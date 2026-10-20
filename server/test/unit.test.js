const test = require('node:test');
const assert = require('node:assert/strict');
const { generateSignature, verifySignature } = require('../utils/hmac');
const { verifyNonce, verifyNonceResilient, sweepExpiredMemory, startNonceSweep } = require('../utils/nonce');
const { isRequestProcessed } = require('../utils/idempotency');
const { computeMoneyIntegrity } = require('../utils/money-oracle');
const sqlite3 = require('sqlite3').verbose();
const { sqliteRun } = require('../utils/nonce');
const { validSignedRequest } = require('../utils/request');
const { getStartupWarnings } = require('../utils/config-warnings');
const { isTimestampWithinWindow } = require('../utils/timestamp');
const { readAttemptCount } = require('../../experiments/e1/attempt-count');

test('E1 attempt count defaults to 30 and accepts positive integer overrides', () => {
  assert.equal(readAttemptCount(undefined), 30);
  assert.equal(readAttemptCount('100'), 100);
  assert.equal(readAttemptCount('0'), 30);
  assert.equal(readAttemptCount('3.5'), 30);
});

test('server and E3 share the inclusive timestamp acceptance rule', () => {
  const now = Date.parse('2026-01-01T00:00:00.000Z');
  assert.equal(isTimestampWithinWindow(new Date(now - 300000).toISOString(), now, 300, 5), true);
  assert.equal(isTimestampWithinWindow(new Date(now + 5000).toISOString(), now, 300, 5), true);
  assert.equal(isTimestampWithinWindow(new Date(now - 301000).toISOString(), now, 300, 5), false);
  assert.equal(isTimestampWithinWindow(new Date(now + 6000).toISOString(), now, 300, 5), false);
});

test('HMAC signs the canonical payload and rejects a modified field', () => {
  const payload = { method: 'POST', path: '/api/withdraw', user_id: 'u1', account_id: 'a1', amount: 20, currency: 'BDT', timestamp: '2026-01-01T00:00:00.000Z', nonce: 'n1', request_id: 'r1' };
  payload.signature = generateSignature(payload, 'unit-test-key');
  assert.equal(verifySignature(payload, 'unit-test-key').valid, true);
  assert.equal(verifySignature({ ...payload, amount: 21 }, 'unit-test-key').valid, false);
});

test('signed request canonical fields must be strings without separators or controls and amount an integer', () => {
  const base = { method: 'POST', path: '/api/withdraw', user_id: 'u', account_id: 'a', amount: 1, currency: 'BDT', timestamp: new Date().toISOString(), nonce: 'n', request_id: 'r' };
  assert.equal(validSignedRequest(base, 'WITHDRAW'), true);
  for (const field of ['method', 'path', 'user_id', 'account_id', 'currency', 'timestamp', 'nonce', 'request_id']) {
    assert.equal(validSignedRequest({ ...base, [field]: 3 }, 'WITHDRAW'), false, `${field} must be a string`);
    assert.equal(validSignedRequest({ ...base, [field]: 'bad|field' }, 'WITHDRAW'), false, `${field} cannot contain a pipe`);
    assert.equal(validSignedRequest({ ...base, [field]: 'bad\nfield' }, 'WITHDRAW'), false, `${field} cannot contain controls`);
  }
  assert.equal(validSignedRequest({ ...base, amount: '1' }, 'WITHDRAW'), false);
  assert.equal(validSignedRequest({ ...base, amount: 1.2 }, 'WITHDRAW'), false);
});

test('startup warnings flag a short nonce TTL and demo routes exposed on all interfaces', () => {
  assert.deepEqual(getStartupWarnings({ nonceTtl: 300, pastWindow: 300, futureWindow: 5, host: '127.0.0.1', enableDemoRoutes: true }), ['NONCE_TTL (300s) is shorter than the combined timestamp window (305s).']);
  assert.equal(getStartupWarnings({ nonceTtl: 400, pastWindow: 300, futureWindow: 5, host: '0.0.0.0', enableDemoRoutes: true }).length, 1);
  assert.deepEqual(getStartupWarnings({ nonceTtl: 400, pastWindow: 300, futureWindow: 5, host: '0.0.0.0', enableDemoRoutes: false }), []);
});

test('memory nonce backend lazily expires only the looked-up nonce and supports periodic sweeping', async () => {
  const store = new Map();
  let clock = 1000;
  assert.equal((await verifyNonce(store, 'u', 'n', { backend: 'memory', ttlSeconds: 1, now: () => clock })).valid, true);
  assert.equal((await verifyNonce(store, 'u', 'n', { backend: 'memory', ttlSeconds: 1, now: () => clock })).valid, false);
  assert.equal((await verifyNonce(store, 'u', 'other', { backend: 'memory', ttlSeconds: 10, now: () => clock })).valid, true);
  clock = 2000;
  assert.equal((await verifyNonce(store, 'u', 'n', { backend: 'memory', ttlSeconds: 1, now: () => clock })).valid, true);
  assert.equal(store.size, 2, 'lookup must not sweep the unrelated key');
  assert.equal(sweepExpiredMemory(store, clock + 10000), 2);
  assert.equal(store.size, 0);
});

test('periodic memory and SQLite nonce sweeps remove expired entries off the lookup path', async () => {
  const memory = new Map([['expired', 10]]);
  const memoryTimer = startNonceSweep({ backend: 'memory', store: memory, intervalMs: 10, now: () => 20 });
  const db = new sqlite3.Database(':memory:');
  let sqliteTimer;
  try {
    await sqliteRun(db, 'CREATE TABLE used_nonces (user_id TEXT NOT NULL, nonce TEXT NOT NULL, expires_at INTEGER NOT NULL, PRIMARY KEY(user_id, nonce))');
    await sqliteRun(db, 'CREATE INDEX idx_sweep_expires_at ON used_nonces(expires_at)');
    await sqliteRun(db, 'INSERT INTO used_nonces VALUES (?, ?, ?)', ['u', 'expired', 10]);
    sqliteTimer = startNonceSweep({ backend: 'sqlite', store: db, intervalMs: 10, now: () => 20 });
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(memory.size, 0);
    const row = await new Promise((resolve, reject) => db.get('SELECT COUNT(*) AS count FROM used_nonces', (error, result) => error ? reject(error) : resolve(result)));
    assert.equal(row.count, 0);
  } finally {
    clearInterval(memoryTimer);
    if (sqliteTimer) clearInterval(sqliteTimer);
    await new Promise((resolve, reject) => db.close((error) => error ? reject(error) : resolve()));
  }
});

test('SQLite nonce backend enforces durable uniqueness and expires entries', async () => {
  const db = new sqlite3.Database(':memory:');
  await sqliteRun(db, 'CREATE TABLE used_nonces (user_id TEXT NOT NULL, nonce TEXT NOT NULL, expires_at INTEGER NOT NULL, PRIMARY KEY(user_id, nonce))');
  await sqliteRun(db, 'CREATE INDEX idx_test_expires_at ON used_nonces(expires_at)');
  assert.equal((await verifyNonce(db, 'u', 'sqlite-nonce', { backend: 'sqlite', ttlSeconds: 60, now: () => 1000 })).valid, true);
  assert.equal((await verifyNonce(db, 'u', 'sqlite-nonce', { backend: 'sqlite', ttlSeconds: 60, now: () => 1001 })).valid, false);
  await sqliteRun(db, 'INSERT INTO used_nonces VALUES (?, ?, ?)', ['u', 'unrelated', 500]);
  assert.equal((await verifyNonce(db, 'u', 'sqlite-nonce', { backend: 'sqlite', ttlSeconds: 60, now: () => 61000 })).valid, true);
  const unrelated = await new Promise((resolve, reject) => db.get('SELECT nonce FROM used_nonces WHERE nonce = ?', ['unrelated'], (e, row) => e ? reject(e) : resolve(row)));
  assert.ok(unrelated, 'insert path deletes only its own expired key');
  await new Promise((resolve, reject) => db.close((error) => error ? reject(error) : resolve()));
});

test('nonce-store failure policy opens or closes exactly as configured', async () => {
  const unavailableRedis = { set: async () => { throw new Error('store unavailable'); } };
  const open = await verifyNonceResilient(unavailableRedis, 'u', 'n', { backend: 'redis', failMode: 'fail-open' });
  const closed = await verifyNonceResilient(unavailableRedis, 'u', 'n', { backend: 'redis', failMode: 'fail-closed' });
  assert.deepEqual([open.valid, open.redisResult], [true, 'STORE_ERROR_FAIL_OPEN']);
  assert.deepEqual([closed.valid, closed.redisResult], [false, 'STORE_ERROR_FAIL_CLOSED']);
});

test('idempotency is scoped to successful transactions so failures may retry', async () => {
  const fakeDb = {
    get(sql, params, callback) {
      assert.match(sql, /status\s*=\s*'SUCCESS'/);
      callback(null, params[0] === 'success' ? { request_id: 'success', status: 'SUCCESS' } : null);
    }
  };
  assert.deepEqual((await isRequestProcessed(fakeDb, 'failed')).processed, false);
  assert.equal((await isRequestProcessed(fakeDb, 'success')).processed, true);
});

test('idempotency policy selects SUCCESS-only or any-outcome lookup', async () => {
  const fakeDb = {
    get(sql, params, callback) {
      if (sql.includes("status IN ('SUCCESS', 'FAILED')")) callback(null, { request_id: params[0], status: 'FAILED' });
      else callback(null, null);
    }
  };
  assert.equal((await isRequestProcessed(fakeDb, 'failed', 'success_only')).processed, false);
  assert.equal((await isRequestProcessed(fakeDb, 'failed', 'any_outcome')).processed, true);
});

test('money oracle accepts a clean ledger against authorized intents', () => {
  const report = computeMoneyIntegrity([{ request_id: 'r1', type: 'WITHDRAW', status: 'SUCCESS', amount: 10 }], [{ request_id: 'r1', type: 'WITHDRAW', amount: 10 }]);
  assert.deepEqual(report, { duplicate_debit_count: 0, duplicate_debit_amount: 0, unauthorized_debit_amount: 0, delayed_execution_count: 0, delayed_execution_amount: 0, total_debited: 10, integrity_holds: true });
});

test('money oracle reports successful execution after an earlier insufficient-balance failure', () => {
  const report = computeMoneyIntegrity([
    { id: 1, request_id: 'retry-me', type: 'WITHDRAW', status: 'FAILED', amount: 25 },
    { id: 2, request_id: 'retry-me', type: 'WITHDRAW', status: 'SUCCESS', amount: 25 }
  ], [{ request_id: 'retry-me', type: 'WITHDRAW', amount: 25 }]);
  assert.equal(report.delayed_execution_count, 1);
  assert.equal(report.delayed_execution_amount, 25);
});

test('money oracle flags same request ID debited twice regardless of signature', () => {
  const rows = [1, 2].map((id) => ({ id, request_id: 'r1', type: 'WITHDRAW', status: 'SUCCESS', amount: 10, signature: `sig-${id}` }));
  const report = computeMoneyIntegrity(rows, [{ request_id: 'r1', type: 'WITHDRAW', amount: 10 }]);
  assert.equal(report.duplicate_debit_count, 1);
  assert.equal(report.duplicate_debit_amount, 10);
  assert.equal(report.integrity_holds, false);
});

test('money oracle flags an authorized request ID with a tampered debit amount', () => {
  const report = computeMoneyIntegrity([{ request_id: 'r1', type: 'WITHDRAW', status: 'SUCCESS', amount: 11 }], [{ request_id: 'r1', type: 'WITHDRAW', amount: 10 }]);
  assert.equal(report.unauthorized_debit_amount, 11);
  assert.equal(report.integrity_holds, false);
});

test('money oracle flags an extra unauthorized withdrawal', () => {
  const rows = [{ request_id: 'r1', type: 'WITHDRAW', status: 'SUCCESS', amount: 10 }, { request_id: 'intruder', type: 'WITHDRAW', status: 'SUCCESS', amount: 7 }];
  const report = computeMoneyIntegrity(rows, [{ request_id: 'r1', type: 'WITHDRAW', amount: 10 }]);
  assert.equal(report.unauthorized_debit_amount, 7);
  assert.equal(report.integrity_holds, false);
});
