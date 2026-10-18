const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const { generateSignature } = require('../server/utils/hmac');
const { computeMoneyIntegrity } = require('../server/utils/money-oracle');
const { timedRequest } = require('./lib/http');
const sqlite3 = require('../server/node_modules/sqlite3').verbose();

const baseUrl = process.env.EXPERIMENT_API || 'http://127.0.0.1:3000';
if (!['127.0.0.1', 'localhost'].includes(new URL(baseUrl).hostname)) throw new Error('Race traffic is restricted to the local simulation at localhost.');
const output = process.env.RACE_OUTPUT || path.join(__dirname, 'results', 'corrections');
const batches = Number(process.env.RACE_BATCHES || 1000);
const width = 50;
const randomSeed = 'f1-race-fixed-seed-2026-v1';
let tokenSequence = 0;
function deterministicToken(label) { return crypto.createHash('sha256').update(`${randomSeed}|${label}|${tokenSequence++}`).digest('hex').slice(0, 32); }
fs.mkdirSync(output, { recursive: true });

let session;
function makePayload(requestId = `request_${deterministicToken('request')}`, nonce = `nonce_${deterministicToken('nonce')}`) {
  const payload = { method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777', amount: 1,
    currency: 'BDT', timestamp: new Date().toISOString(), nonce, request_id: requestId };
  payload.signature = generateSignature(payload, session.sessionKey);
  return payload;
}

async function request(payload) {
  return timedRequest(`${baseUrl}/api/withdraw`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${session.sessionToken}` }, body: JSON.stringify(payload) });
}

function writeRows(filename, header, rows) {
  fs.writeFileSync(path.join(output, filename), `${[header, ...rows].join('\n')}\n`);
}

async function main() {
  const login = await timedRequest(`${baseUrl}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user_id: 'anis_101', pin: process.env.DEMO_PIN || '1234' }) });
  if (login.status !== 200) throw new Error(`Session login failed: ${login.status}`);
  session = login.body;
  const ledgerPath = process.env.RACE_DB_PATH || process.env.SQLITE_DB;
  if (!ledgerPath) throw new Error('Set RACE_DB_PATH to the SQLite database used by the measured server.');
  const ledgerDb = new sqlite3.Database(ledgerPath);
  await new Promise((resolve, reject) => ledgerDb.once('open', resolve).once('error', reject));
  const readLedger = () => new Promise((resolve, reject) => ledgerDb.all('SELECT request_id,type,status,amount FROM transactions ORDER BY id', [], (error, rows) => error ? reject(error) : resolve(rows)));
  const signedRequest = (payload) => { payload.signature = generateSignature(payload, session.sessionKey); return payload; };
  const perRequestRows = [];
  const batchRows = [];
  const batchOracleRows = [];
  const acceptedDistribution = {};
  const balanceDeltaDistribution = {};
  for (let batch = 1; batch <= batches; batch += 1) {
    const reset = await timedRequest(`${baseUrl}/api/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    if (reset.status !== 200) throw new Error(`Reset failed before batch ${batch}`);
    const payload = makePayload();
    const start = process.hrtime.bigint();
    const responses = await Promise.all(Array.from({ length: width }, () => request(payload)));
    const end = process.hrtime.bigint();
    const accepted = responses.filter((response) => response.body.status === 'ACCEPTED').length;
    const reasons = responses.reduce((map, response) => {
      const reason = response.body.reason || response.body.status || 'UNKNOWN'; map[reason] = (map[reason] || 0) + 1; return map;
    }, {});
    const ledger = await readLedger();
    const oracle = computeMoneyIntegrity(ledger, [{ request_id: payload.request_id, amount: payload.amount, type: 'WITHDRAW' }]);
    if (!oracle.integrity_holds || oracle.total_debited !== 1) throw new Error(`Money oracle failed in batch ${batch}`);
    batchOracleRows.push(oracle);
    const balance = await timedRequest(`${baseUrl}/api/balance/anis_101`, { headers: { authorization: `Bearer ${session.sessionToken}` } });
    const balanceDelta = 10000 - balance.body.balance;
    balanceDeltaDistribution[balanceDelta] = (balanceDeltaDistribution[balanceDelta] || 0) + 1;
    acceptedDistribution[accepted] = (acceptedDistribution[accepted] || 0) + 1;
    batchRows.push([batch, accepted, reasons.NONCE_FAIL || 0, oracle.total_debited, oracle.duplicate_debit_count, oracle.duplicate_debit_amount, oracle.unauthorized_debit_amount, oracle.integrity_holds, balanceDelta, (end - start).toString(), reset.start_ns, reset.end_ns, reset.duration_ns].join(','));
    responses.forEach((response, index) => perRequestRows.push([batch, index + 1, response.start_ns, response.end_ns, response.duration_ns, response.status, response.body.reason || response.body.status || ''].join(',')));
    if (accepted !== 1) throw new Error(`Batch ${batch}: expected one acceptance, got ${accepted}`);
  }
  writeRows(`race-identical-50x${batches}-requests.csv`, 'batch,request_index,started_ns,ended_ns,duration_ns,http_status,outcome', perRequestRows);
  writeRows(`race-identical-50x${batches}-batches.csv`, 'batch,accepted_count,nonce_fail_count,oracle_total_debited,oracle_duplicate_debit_count,oracle_duplicate_debit_amount,oracle_unauthorized_debit_amount,oracle_integrity_holds,balance_delta,batch_duration_ns,reset_started_ns,reset_ended_ns,reset_duration_ns', batchRows);

  await timedRequest(`${baseUrl}/api/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  const sharedRequestId = `secret-holder-${deterministicToken('shared-request')}`;
  const payloads = Array.from({ length: width }, (_, index) => makePayload(sharedRequestId, `secret-holder-nonce-${index}-${deterministicToken(`shared-nonce-${index}`)}`));
  const before = await timedRequest(`${baseUrl}/api/balance/anis_101`, { headers: { authorization: `Bearer ${session.sessionToken}` } });
  const raceStart = process.hrtime.bigint();
  const race = await Promise.all(payloads.map(request));
  const raceEnd = process.hrtime.bigint();
  const after = await timedRequest(`${baseUrl}/api/balance/anis_101`, { headers: { authorization: `Bearer ${session.sessionToken}` } });
  const ledger = await readLedger();
  const authorized = payloads.map((payload) => ({ request_id: payload.request_id, amount: payload.amount, type: 'WITHDRAW' }));
  const oracle = computeMoneyIntegrity(ledger, authorized);
  const summary = {
    randomSeed,
    vizEnabled: process.env.VIZ_ENABLED === 'true',
    identicalPayloadRace: {
      batches, parallelWidth: width, acceptedCountDistribution: acceptedDistribution, balanceDeltaDistribution, acceptedPerBatch: 1, totalRequests: batches * width,
      moneyOracle: {
        ledgerReadDirectlyFromSqlite: true,
        evaluatedBatches: batchOracleRows.length,
        integrityHoldsForEveryBatch: batchOracleRows.every((oracle) => oracle.integrity_holds),
        totalDebitedAcrossFreshDatabaseResets: batchOracleRows.reduce((sum, oracle) => sum + oracle.total_debited, 0),
        duplicateDebitCount: batchOracleRows.reduce((sum, oracle) => sum + oracle.duplicate_debit_count, 0),
        duplicateDebitAmount: batchOracleRows.reduce((sum, oracle) => sum + oracle.duplicate_debit_amount, 0),
        unauthorizedDebitAmount: batchOracleRows.reduce((sum, oracle) => sum + oracle.unauthorized_debit_amount, 0)
      }
    },
    secretHolderSameRequestIdRace: {
      parallelWidth: width, acceptedCount: race.filter((result) => result.body.status === 'ACCEPTED').length,
      requestIdShared: true, distinctValidNonces: width, balanceDelta: Number(before.body.balance) - Number(after.body.balance),
      duration_ns: (raceEnd - raceStart).toString(), beforeBalanceTiming: before, afterBalanceTiming: after, oracle
    }
  };
  const sameIdRows = race.map((result, index) => [index + 1, result.start_ns, result.end_ns, result.duration_ns, result.status, result.body.reason || result.body.status || ''].join(','));
  writeRows('race-same-request-id-50-requests.csv', 'request_index,started_ns,ended_ns,duration_ns,http_status,outcome', sameIdRows);
  fs.writeFileSync(path.join(output, `race-summary-${batches}-batches.json`), `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  await new Promise((resolve) => ledgerDb.close(resolve));
}

main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
