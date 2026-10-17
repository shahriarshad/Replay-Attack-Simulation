const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const { generateSignature } = require('../server/utils/hmac');
const { computeMoneyIntegrity } = require('../server/utils/money-oracle');
const { timedRequest } = require('./lib/http');

const baseUrl = process.env.EXPERIMENT_API || 'http://127.0.0.1:3000';
const output = path.join(__dirname, 'results', 'corrections');
const batches = Number(process.env.RACE_BATCHES || 1000);
const width = 50;
fs.mkdirSync(output, { recursive: true });

function makePayload(requestId = `request_${crypto.randomUUID()}`, nonce = `nonce_${crypto.randomUUID()}`) {
  const payload = { method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777', amount: 1,
    currency: 'BDT', timestamp: new Date().toISOString(), nonce, request_id: requestId };
  payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
  return payload;
}

async function request(payload) {
  return timedRequest(`${baseUrl}/api/withdraw`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
}

function writeRows(filename, header, rows) {
  fs.writeFileSync(path.join(output, filename), `${[header, ...rows].join('\n')}\n`);
}

async function main() {
  const perRequestRows = [];
  const batchRows = [];
  const acceptedDistribution = {};
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
    acceptedDistribution[accepted] = (acceptedDistribution[accepted] || 0) + 1;
    batchRows.push([batch, accepted, reasons.NONCE_FAIL || 0, (end - start).toString(), reset.start_ns, reset.end_ns, reset.duration_ns].join(','));
    responses.forEach((response, index) => perRequestRows.push([batch, index + 1, response.start_ns, response.end_ns, response.duration_ns, response.status, response.body.reason || response.body.status || ''].join(',')));
    if (accepted !== 1) throw new Error(`Batch ${batch}: expected one acceptance, got ${accepted}`);
  }
  writeRows(`race-identical-50x${batches}-requests.csv`, 'batch,request_index,started_ns,ended_ns,duration_ns,http_status,outcome', perRequestRows);
  writeRows(`race-identical-50x${batches}-batches.csv`, 'batch,accepted_count,nonce_fail_count,batch_duration_ns,reset_started_ns,reset_ended_ns,reset_duration_ns', batchRows);

  await timedRequest(`${baseUrl}/api/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  const sharedRequestId = `secret-holder-${crypto.randomUUID()}`;
  const payloads = Array.from({ length: width }, (_, index) => makePayload(sharedRequestId, `secret-holder-nonce-${index}-${crypto.randomUUID()}`));
  const before = await timedRequest(`${baseUrl}/api/balance/anis_101`);
  const raceStart = process.hrtime.bigint();
  const race = await Promise.all(payloads.map(request));
  const raceEnd = process.hrtime.bigint();
  const after = await timedRequest(`${baseUrl}/api/balance/anis_101`);
  const transactions = race.map((result, index) => result.body.status === 'ACCEPTED' ? ({
    type: 'WITHDRAW', status: 'SUCCESS', amount: 1, signature: payloads[index].signature
  }) : null).filter(Boolean);
  const oracle = computeMoneyIntegrity(transactions, payloads);
  const summary = {
    vizEnabled: process.env.VIZ_ENABLED === 'true',
    identicalPayloadRace: { batches, parallelWidth: width, acceptedCountDistribution: acceptedDistribution, acceptedPerBatch: 1, totalRequests: batches * width },
    secretHolderSameRequestIdRace: {
      parallelWidth: width, acceptedCount: race.filter((result) => result.body.status === 'ACCEPTED').length,
      requestIdShared: true, distinctValidNonces: width, debitAmount: Number(before.body.balance) - Number(after.body.balance),
      duration_ns: (raceEnd - raceStart).toString(), beforeBalanceTiming: before, afterBalanceTiming: after, oracle
    }
  };
  const sameIdRows = race.map((result, index) => [index + 1, result.start_ns, result.end_ns, result.duration_ns, result.status, result.body.reason || result.body.status || ''].join(','));
  writeRows('race-same-request-id-50-requests.csv', 'request_index,started_ns,ended_ns,duration_ns,http_status,outcome', sameIdRows);
  fs.writeFileSync(path.join(output, `race-summary-${batches}-batches.json`), `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
