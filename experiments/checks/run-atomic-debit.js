'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { spawn } = require('child_process');
const sqlite3 = require('../../server/node_modules/sqlite3').verbose();
const { generateSignature } = require('../../server/utils/hmac');
const { timedRequest } = require('../lib/http');
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.resolve(process.env.ATOMIC_DEBIT_OUTPUT_DIR || path.join(ROOT, 'experiments/results/round-i/atomic-debit'));
const PIN = process.env.DEMO_PIN || '1234';
const q = v => { v = String(v ?? ''); return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
const write = (file, rows) => { const h = Object.keys(rows[0]); fs.writeFileSync(file, `${h.join(',')}\n${rows.map(r => h.map(k => q(r[k])).join(',')).join('\n')}\n`); };
function openDb(file) { return new Promise((resolve, reject) => { const db = new sqlite3.Database(file, e => e ? reject(e) : resolve(db)); }); }
function all(db, sql) { return new Promise((resolve, reject) => db.all(sql, (e, rows) => e ? reject(e) : resolve(rows))); }
function get(db, sql) { return new Promise((resolve, reject) => db.get(sql, (e, row) => e ? reject(e) : resolve(row))); }
async function stop(child) { if (!child || child.exitCode !== null) return; child.kill(); await Promise.race([new Promise(r => child.once('exit', r)), new Promise(r => setTimeout(r, 2500))]); if (child.exitCode === null) spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); }
async function main() {
  fs.mkdirSync(OUT, { recursive: true }); const started = new Date().toISOString(), runs = [], ledgerRows = [];
  for (let repetition = 1; repetition <= 30; repetition++) {
    const id = `atomic-${String(repetition).padStart(2, '0')}`, dir = path.join(OUT, id); fs.mkdirSync(dir, { recursive: true }); const port = 3820, dbFile = path.join(dir, 'run.sqlite');
    const env = { ...process.env, PORT: String(port), HOST: '127.0.0.1', VIZ_PORT: '3821', VIZ_ENABLED: 'false', DEMO_MODE: 'false', LEGACY_SHARED_SECRET: 'false', ENABLE_DEMO_ROUTES: 'false', NONCE_STORE: 'redis', NONCE_TTL: '300', REDIS_URL: 'redis://127.0.0.1:6379', NONCE_KEY_NAMESPACE: `round-i-atomic-${repetition}-${process.pid}`, SQLITE_DB: dbFile, DEFENSE_HMAC: 'true', DEFENSE_TIMESTAMP: 'true', DEFENSE_NONCE: 'true', DEFENSE_REQUEST_ID: 'true', EXPERIMENT_LOG: path.join(dir, 'timings.csv') };
    const out = fs.openSync(path.join(dir, 'stdout.log'), 'a'), err = fs.openSync(path.join(dir, 'stderr.log'), 'a'); const child = spawn(process.execPath, ['server.js'], { cwd: path.join(ROOT, 'server'), env, stdio: ['ignore', out, err], windowsHide: true });
    try {
      let ready = false; for (let i = 0; i < 300; i++) { if (child.exitCode !== null) throw Error(`server exited; inspect ${dir}`); try { if ((await timedRequest(`http://127.0.0.1:${port}/api/health`)).status === 200) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 100)); } if (!ready) throw Error(`health timeout ${dir}`);
      const login = await timedRequest(`http://127.0.0.1:${port}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user_id: 'anis_101', pin: PIN }) }); if (login.status !== 200) throw Error(`login HTTP ${login.status}`); const session = login.body;
      const db = await openDb(dbFile); await new Promise((resolve, reject) => db.run("UPDATE accounts SET balance=100 WHERE user_id='anis_101'", e => e ? reject(e) : resolve()));
      const payloads = Array.from({ length: 100 }, (_, i) => { const p = { method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777', amount: i + 1, currency: 'BDT', timestamp: new Date().toISOString(), nonce: `${id}-nonce-${i}`, request_id: `${id}-request-${i}` }; p.signature = generateSignature(p, session.sessionKey); return p; });
      const requests = payloads.map(p => timedRequest(`http://127.0.0.1:${port}/api/withdraw`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${session.sessionToken}` }, body: JSON.stringify(p) }));
      const responses = await Promise.all(requests); const rows = await all(db, "SELECT id, request_id, amount, status FROM transactions WHERE type='WITHDRAW' ORDER BY id"); const account = await get(db, "SELECT balance FROM accounts WHERE user_id='anis_101'");
      let current = 100, minimum = 100, sum = 0; for (const row of rows) { if (row.status === 'SUCCESS') { current -= row.amount; sum += row.amount; } minimum = Math.min(minimum, current); ledgerRows.push({ run: id, ledger_id: row.id, request_id_hash: crypto.createHash('sha256').update(row.request_id).digest('hex').slice(0, 12), amount: row.amount, status: row.status, reconstructed_balance: current }); }
      const accepted = responses.filter(r => r.status === 200 && r.body.status === 'ACCEPTED').length;
      const result = { run: id, attempts: responses.length, accepted, ledger_rows: rows.length, success_debit_count: rows.filter(r => r.status === 'SUCCESS').length, success_debit_sum: sum, final_balance: account.balance, minimum_balance_from_ledger: minimum, invariant_nonnegative: minimum >= 0, invariant_debits_at_most_100: sum <= 100, invariant_balance_plus_debits_100: account.balance + sum === 100, started_ns: responses.reduce((m, r) => !m || BigInt(r.start_ns) < BigInt(m) ? r.start_ns : m, ''), ended_ns: responses.reduce((m, r) => !m || BigInt(r.end_ns) > BigInt(m) ? r.end_ns : m, '') };
      if (!result.invariant_nonnegative || !result.invariant_debits_at_most_100 || !result.invariant_balance_plus_debits_100) throw Error(`atomic debit invariant failed in ${id}: ${JSON.stringify(result)}`);
      runs.push(result); await new Promise(resolve => db.close(() => resolve()));
    } finally { await stop(child); try { fs.closeSync(out); fs.closeSync(err); } catch {} }
    process.stdout.write(`${id}: balance ${runs.at(-1).final_balance}, debit ${runs.at(-1).success_debit_sum}\n`);
  }
  write(path.join(OUT, 'runs.csv'), runs); write(path.join(OUT, 'ledger.csv'), ledgerRows); fs.writeFileSync(path.join(OUT, 'run.json'), JSON.stringify({ started, ended: new Date().toISOString(), elapsedSeconds: (Date.now() - Date.parse(started)) / 1000, repetitions: runs.length, requestsPerRepetition: 100, balanceSeed: 100, amounts: '1 through 100, each once', allInvariantsHold: runs.every(r => r.invariant_nonnegative && r.invariant_debits_at_most_100 && r.invariant_balance_plus_debits_100), layers: 'HMAC, timestamp, nonce, request-ID all enabled', nonceBackend: 'Memurai via Redis', sessionMode: true, localhostOnly: true }, null, 2) + '\n');
}
main().catch(e => { process.stderr.write(`${e.stack || e.message}\n`); process.exitCode = 1; });
