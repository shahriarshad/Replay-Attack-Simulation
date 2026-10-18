const test = require('node:test');
const assert = require('node:assert/strict');
const { generateSignature, verifySignature } = require('../utils/hmac');
const { verifyNonce, verifyNonceResilient } = require('../utils/nonce');
const { isRequestProcessed } = require('../utils/idempotency');
const { computeMoneyIntegrity, payloadFingerprint } = require('../utils/money-oracle');
const sqlite3 = require('sqlite3').verbose();
const { sqliteRun } = require('../utils/nonce');

test('HMAC signs the canonical payload and rejects a modified field', () => {
  const payload = { method: 'POST', path: '/api/withdraw', user_id: 'u1', account_id: 'a1', amount: 20, currency: 'BDT', timestamp: '2026-01-01T00:00:00.000Z', nonce: 'n1', request_id: 'r1' };
  payload.signature = generateSignature(payload, 'unit-test-key');
  assert.equal(verifySignature(payload, 'unit-test-key').valid, true);
  assert.equal(verifySignature({ ...payload, amount: 21 }, 'unit-test-key').valid, false);
});

test('memory nonce backend atomically accepts once and expires entries', async () => {
  const store = new Map();
  assert.equal((await verifyNonce(store, 'u', 'n', { backend: 'memory', ttlSeconds: 1 })).valid, true);
  assert.equal((await verifyNonce(store, 'u', 'n', { backend: 'memory', ttlSeconds: 1 })).valid, false);
  await new Promise((resolve) => setTimeout(resolve, 1050));
  assert.equal((await verifyNonce(store, 'u', 'n', { backend: 'memory', ttlSeconds: 1 })).valid, true);
});

test('SQLite nonce backend enforces durable uniqueness and expires entries', async () => {
  const db = new sqlite3.Database(':memory:');
  await sqliteRun(db, 'CREATE TABLE used_nonces (user_id TEXT NOT NULL, nonce TEXT NOT NULL, expires_at INTEGER NOT NULL, PRIMARY KEY(user_id, nonce))');
  assert.equal((await verifyNonce(db, 'u', 'sqlite-nonce', { backend: 'sqlite', ttlSeconds: 60 })).valid, true);
  assert.equal((await verifyNonce(db, 'u', 'sqlite-nonce', { backend: 'sqlite', ttlSeconds: 60 })).valid, false);
  await sqliteRun(db, 'UPDATE used_nonces SET expires_at = 0');
  assert.equal((await verifyNonce(db, 'u', 'sqlite-nonce', { backend: 'sqlite', ttlSeconds: 60 })).valid, true);
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

test('money integrity oracle counts debits and repeated signed payloads', () => {
  const payload = { method: 'POST', path: '/api/withdraw', user_id: 'u', account_id: 'a', amount: 10, currency: 'BDT', timestamp: 't', nonce: 'n', request_id: 'r', signature: 's' };
  const fingerprint = payloadFingerprint(payload);
  const report = computeMoneyIntegrity([
    { type: 'WITHDRAW', status: 'SUCCESS', amount: 10, payload_fingerprint: fingerprint },
    { type: 'WITHDRAW', status: 'SUCCESS', amount: 10, payload_fingerprint: fingerprint }
  ], [payload]);
  assert.equal(report.totalDebited, 20);
  assert.equal(report.duplicateDebitCount, 1);
  assert.equal(report.integrityHolds, false);
});
