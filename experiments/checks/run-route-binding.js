'use strict';
const fs = require('fs'), path = require('path'), { spawn } = require('child_process'), crypto = require('crypto');
const { generateSignature } = require('../../server/utils/hmac');
const sqlite3 = require('../../server/node_modules/sqlite3').verbose();
const { timedRequest } = require('../lib/http');
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.resolve(process.env.ROUTE_BINDING_OUTPUT_DIR || path.join(ROOT, 'experiments/results/round-i/route-binding'));
const PIN = process.env.DEMO_PIN || '1234';
const csv = v => { v = String(v ?? ''); return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
const write = (p, rows) => fs.writeFileSync(p, `${Object.keys(rows[0]).join(',')}\n${rows.map(r => Object.keys(rows[0]).map(k => csv(r[k])).join(',')).join('\n')}\n`);
const openDb = file => new Promise((resolve, reject) => { const db = new sqlite3.Database(file, e => e ? reject(e) : resolve(db)); });
const dbAll = (db, sql, args) => new Promise((resolve, reject) => db.all(sql, args, (e, rows) => e ? reject(e) : resolve(rows)));
function payload(session, pathName, id) { const p = { method: 'POST', path: pathName, user_id: 'anis_101', account_id: 'acc_777', amount: 1, currency: 'BDT', timestamp: new Date().toISOString(), nonce: crypto.randomUUID(), request_id: id }; p.signature = generateSignature(p, session.sessionKey); return p; }
async function main() {
  fs.mkdirSync(OUT, { recursive: true }); const rows = [], metadata = { started: new Date().toISOString(), node: process.version, host: '127.0.0.1', defenseLayers: 'all enabled except HMAC in second configuration', loginMode: 'session', vizEnabled: false, demoMode: false, redis: 'Memurai at 127.0.0.1:6379' };
  for (const [idx, hmac] of [true, false].entries()) {
    const dir = path.join(OUT, `H${hmac ? 1 : 0}`); fs.mkdirSync(dir, { recursive: true }); const port = 3810 + idx, dbFile = path.join(dir, 'run.sqlite');
    const env = { ...process.env, PORT: String(port), HOST: '127.0.0.1', VIZ_PORT: String(port + 1), VIZ_ENABLED: 'false', DEMO_MODE: 'false', LEGACY_SHARED_SECRET: 'false', ENABLE_DEMO_ROUTES: 'false', NONCE_STORE: 'redis', NONCE_TTL: '300', REDIS_URL: 'redis://127.0.0.1:6379', NONCE_KEY_NAMESPACE: `round-i-route-${hmac}-${process.pid}`, SQLITE_DB: dbFile, DEFENSE_HMAC: String(hmac), DEFENSE_TIMESTAMP: 'true', DEFENSE_NONCE: 'true', DEFENSE_REQUEST_ID: 'true', EXPERIMENT_LOG: path.join(dir, 'timings.csv') };
    const out = fs.openSync(path.join(dir, 'stdout.log'), 'a'), err = fs.openSync(path.join(dir, 'stderr.log'), 'a'); const child = spawn(process.execPath, ['server.js'], { cwd: path.join(ROOT, 'server'), env, stdio: ['ignore', out, err], windowsHide: true });
    try {
      let ready = false; for (let i = 0; i < 300; i++) { if (child.exitCode !== null) throw Error(`server exited; inspect ${dir}`); try { if ((await timedRequest(`http://127.0.0.1:${port}/api/health`)).status === 200) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 100)); } if (!ready) throw Error(`health timeout ${dir}`);
      const login = await timedRequest(`http://127.0.0.1:${port}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user_id: 'anis_101', pin: PIN }) }); if (login.status !== 200) throw Error(`login HTTP ${login.status}`); const session = login.body;
      const cases = [ ['/api/withdraw', payload(session, '/api/deposit', `route-deposit-${hmac}`), 'deposit-signed-to-withdraw'], ['/api/deposit', payload(session, '/api/withdraw', `route-withdraw-${hmac}`), 'withdraw-signed-to-deposit'] ];
      const casesStart = rows.length;
      for (const [endpoint, body, label] of cases) { const response = await timedRequest(`http://127.0.0.1:${port}${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${session.sessionToken}` }, body: JSON.stringify(body) }); rows.push({ hmac_enabled: hmac, case: label, requested_endpoint: endpoint, http_status: response.status, reason: response.body.reason || response.body.error || response.body.status, request_id_hash: crypto.createHash('sha256').update(body.request_id).digest('hex').slice(0, 12), ledger_rows_for_request: '', start_ns: response.start_ns, end_ns: response.end_ns, duration_ns: response.duration_ns }); }
      const db = await openDb(dbFile);
      for (let i = casesStart; i < rows.length; i++) rows[i].ledger_rows_for_request = (await dbAll(db, 'SELECT id FROM transactions WHERE request_id = ?', [cases[i - casesStart][1].request_id])).length;
      const acceptedHmac = hmac && rows.slice(casesStart).some(r => r.http_status === 200 && r.reason === 'ACCEPTED');
      if (acceptedHmac) metadata.unexpectedAcceptedDetails = rows.slice(casesStart).map(r => ({ ...r, signed_fields: 'method/path/user_id/account_id/amount/currency/timestamp/nonce/request_id were signed; signature redacted by output policy' }));
      await new Promise(resolve => db.close(() => resolve()));
    } finally { child.kill(); await Promise.race([new Promise(r => child.once('exit', r)), new Promise(r => setTimeout(r, 2000))]); if (child.exitCode === null) spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); try { fs.closeSync(out); fs.closeSync(err); } catch {} }
  }
  write(path.join(OUT, 'requests.csv'), rows); metadata.ended = new Date().toISOString(); metadata.results = rows; fs.writeFileSync(path.join(OUT, 'run.json'), JSON.stringify(metadata, null, 2) + '\n');
  if (metadata.unexpectedAcceptedDetails) throw Error(`HMAC-on route mismatch accepted; sanitized fields and ledger counts saved in ${OUT}`);
}
main().catch(e => { process.stderr.write(`${e.stack || e.message}\n`); process.exitCode = 1; });
