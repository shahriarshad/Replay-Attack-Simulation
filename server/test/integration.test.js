const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const testArtifactDirectory = path.resolve(process.env.TEST_ARTIFACT_DIR || path.join(os.tmpdir(), `cs-project-tests-${process.pid}`));
fs.mkdirSync(testArtifactDirectory, { recursive: true });

process.env.SQLITE_DB = path.join(os.tmpdir(), `cs-project-phase3-${process.pid}-${crypto.randomUUID()}.sqlite`);
process.env.NONCE_STORE = 'memory';
process.env.VIZ_ENABLED = 'false';
process.env.DEMO_MODE = 'false';
process.env.LEGACY_SHARED_SECRET = 'false';
process.env.HMAC_SECRET = 'phase3-server-test-key';
process.env.DEFENSE_HMAC = 'true';
process.env.DEFENSE_TIMESTAMP = 'true';
process.env.DEFENSE_NONCE = 'true';
process.env.DEFENSE_REQUEST_ID = 'true';
process.env.TIMESTAMP_PAST_WINDOW_SECONDS = '300';
process.env.TIMESTAMP_FUTURE_WINDOW_SECONDS = '5';
process.env.ENABLE_TEST_FAULT_ROUTE = 'true';
process.env.EXPERIMENT_LOG = path.join(testArtifactDirectory, `layer-timings-${process.pid}.csv`);
process.env.CONFIG_ID = 'phase3-default-defenses';
process.env.SCENARIO_ID = 'integration-suite';
process.env.RUN_ID = `windows-node-test-${process.pid}`;

const { app, db, redisClient, initializeDatabase, setClock } = require('../core');
const { generateSignature } = require('../utils/hmac');
const { computeMoneyIntegrity } = require('../utils/money-oracle');

let server;
let baseUrl;
let session;
let serverNow = Date.now();

async function call(method, pathName, payload, token = session?.sessionToken) {
  const started = process.hrtime.bigint();
  const response = await fetch(`${baseUrl}${pathName}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
  const text = await response.text();
  const ended = process.hrtime.bigint();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: response.status, data, started_ns: started.toString(), ended_ns: ended.toString(), duration_ns: (ended - started).toString() };
}

function payload(overrides = {}) {
  const result = {
    method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777',
    amount: 10, currency: 'BDT', timestamp: new Date(serverNow).toISOString(),
    nonce: `nonce_${crypto.randomUUID()}`, request_id: `req_${crypto.randomUUID()}`,
    ...overrides
  };
  result.signature = generateSignature(result, session.sessionKey);
  return result;
}

async function reset() {
  serverNow = Date.now();
  setClock(() => serverNow);
  const result = await call('POST', '/api/reset', {});
  assert.equal(result.status, 200);
}

test.before(async () => {
  await initializeDatabase();
  await redisClient.connect();
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const login = await call('POST', '/api/login', { user_id: 'anis_101', pin: '1234' }, null);
  assert.equal(login.status, 200);
  session = login.data;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await redisClient.quit();
  await new Promise((resolve) => db.close(resolve));
});

test('account and history lookups return the seeded account and an empty ledger', async () => {
  const balance = await call('GET', '/api/balance/anis_101');
  const history = await call('GET', '/api/transactions/anis_101');
  const missing = await call('GET', '/api/balance/unknown');
  assert.equal(balance.status, 200);
  assert.equal(balance.data.account_id, 'acc_777');
  assert.equal(history.status, 200);
  assert.ok(Array.isArray(history.data.transactions));
  assert.deepEqual(missing.data, { error: 'ACCOUNT_NOT_FOUND' });
});

test('deposit uses signature, timestamp, nonce, request ID and balance pipeline', async () => {
  await reset();
  const request = payload({ path: '/api/deposit', amount: 50, request_id: 'dep-one' });
  const accepted = await call('POST', '/api/deposit', request);
  assert.equal(accepted.status, 200);
  assert.equal(accepted.data.status, 'ACCEPTED');
  const afterNonceWipe = await call('POST', '/api/demo/nonce-crash', {});
  assert.equal(afterNonceWipe.status, 200);
  const replay = await call('POST', '/api/deposit', request);
  assert.equal(replay.data.reason, 'ALREADY_PROCESSED');
  const bad = payload({ path: '/api/deposit', amount: 15 });
  bad.signature = '0'.repeat(64);
  const rejected = await call('POST', '/api/deposit', bad);
  assert.deepEqual(rejected.data, { status: 'REJECTED', reason: 'SIGNATURE_FAIL' });
});

test('withdraw rejects bad signatures, timestamps, account ownership and unknown users', async () => {
  await reset();
  const badSignature = payload();
  badSignature.signature = '0'.repeat(64);
  assert.equal((await call('POST', '/api/withdraw', badSignature)).data.reason, 'SIGNATURE_FAIL');
  const stale = payload({ timestamp: new Date(serverNow - 301000).toISOString() });
  stale.signature = generateSignature(stale, session.sessionKey);
  assert.equal((await call('POST', '/api/withdraw', stale)).data.reason, 'TIMESTAMP_FAIL');
  const badAccount = payload({ account_id: 'someone-elses-account' });
  badAccount.signature = generateSignature(badAccount, session.sessionKey);
  assert.equal((await call('POST', '/api/withdraw', badAccount)).data.reason, 'ACCOUNT_OWNERSHIP_FAIL');
  const unknown = payload({ user_id: 'missing-user' });
  unknown.signature = generateSignature(unknown, session.sessionKey);
  assert.deepEqual((await call('POST', '/api/withdraw', unknown)).data, { error: 'ACCOUNT_NOT_FOUND' });
  const timingLines = fs.readFileSync(process.env.EXPERIMENT_LOG, 'utf8').trim().split(/\r?\n/);
  const timingRow = timingLines[timingLines.length - 1];
  assert.equal(timingRow.includes('skipped'), false);
  assert.match(timingRow, /,\d+,not_reached,not_reached,not_reached,/);
});

test('insufficient balance is recorded as failed and the request ID remains retryable', async () => {
  await reset();
  const failed = payload({ amount: 20000, request_id: 'retryable-id' });
  assert.deepEqual((await call('POST', '/api/withdraw', failed)).data, { status: 'REJECTED', reason: 'INSUFFICIENT_BALANCE' });
  const retry = payload({ amount: 10, request_id: 'retryable-id' });
  const accepted = await call('POST', '/api/withdraw', retry);
  assert.equal(accepted.data.status, 'ACCEPTED');
  const ledger = await new Promise((resolve, reject) => db.all("SELECT id,request_id,type,status,amount FROM transactions WHERE request_id='retryable-id' ORDER BY id", [], (error, rows) => error ? reject(error) : resolve(rows)));
  const oracle = computeMoneyIntegrity(ledger, [{ request_id: 'retryable-id', amount: 10, type: 'WITHDRAW' }]);
  assert.equal(oracle.delayed_execution_count, 1);
  assert.equal(oracle.delayed_execution_amount, 10);
});

test('same request ID is idempotent after success, even when nonce state is wiped', async () => {
  await reset();
  const request = payload();
  assert.equal((await call('POST', '/api/withdraw', request)).data.status, 'ACCEPTED');
  await call('POST', '/api/demo/nonce-crash', {});
  const replay = await call('POST', '/api/withdraw', request);
  assert.equal(replay.data.reason, 'ALREADY_PROCESSED');
});

test('test-only nonce-store fault route causes fail-closed unavailability and can be cleared', async () => {
  const enabled = await call('POST', '/__test/fault/nonce-store', { enabled: true });
  assert.equal(enabled.status, 200);
  const rejected = await call('POST', '/api/withdraw', payload());
  assert.equal(rejected.status, 503);
  assert.equal(rejected.data.reason, 'NONCE_STORE_UNAVAILABLE');
  const disabled = await call('POST', '/__test/fault/nonce-store', { enabled: false });
  assert.equal(disabled.status, 200);
  const accepted = await call('POST', '/api/withdraw', payload());
  assert.equal(accepted.status, 200);
});

test('malformed input and unknown routes have documented JSON bodies', async () => {
  const malformed = await fetch(`${baseUrl}/api/withdraw`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: 'INVALID_REQUEST' });
  assert.deepEqual((await call('GET', '/not-a-route')).data, { error: 'NOT_FOUND' });
});

test('future and past timestamp edges repeat 30 times and save per-request timings', async () => {
  await reset();
  const cases = [
    { label: 'past_tolerance_edge_minus_5s', offsetMs: -5000, expected: 'ACCEPTED' },
    { label: 'future_tolerance_edge_plus_5s', offsetMs: 5000, expected: 'ACCEPTED' },
    { label: 'age_299s', offsetMs: -299000, expected: 'ACCEPTED' },
    { label: 'age_300s', offsetMs: -300000, expected: 'ACCEPTED' },
    { label: 'age_301s_first_rejected_past_side', offsetMs: -301000, expected: 'TIMESTAMP_FAIL' },
    { label: 'future_6s_first_rejected_future_side', offsetMs: 6000, expected: 'TIMESTAMP_FAIL' }
  ];
  const rows = [];
  for (const item of cases) {
    for (let repetition = 1; repetition <= 30; repetition += 1) {
      const request = payload({ amount: 1, timestamp: new Date(serverNow + item.offsetMs).toISOString(), request_id: `boundary-${item.label}-${repetition}` });
      request.signature = generateSignature(request, session.sessionKey);
      const result = await call('POST', '/api/withdraw', request);
      const outcome = result.data.status === 'ACCEPTED' ? 'ACCEPTED' : result.data.reason;
      assert.equal(outcome, item.expected, `${item.label} repetition ${repetition}`);
      rows.push({ label: item.label, repetition, offset_ms: item.offsetMs, ...result, outcome });
    }
  }
  const output = testArtifactDirectory;
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'timestamp-boundaries-30-each.csv'), [
    'label,repetition,offset_ms,started_ns,ended_ns,duration_ns,http_status,outcome',
    ...rows.map((row) => [row.label, row.repetition, row.offset_ms, row.started_ns, row.ended_ns, row.duration_ns, row.status, row.outcome].join(','))
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(output, 'timestamp-boundaries-30-each.json'), JSON.stringify({ repetitionsPerCase: 30, vizEnabled: process.env.VIZ_ENABLED === 'true', cases: cases.map((item) => ({ ...item, measuredCount: rows.filter((row) => row.label === item.label && row.outcome === item.expected).length })), firstRejectedPastAgeSeconds: 301, firstRejectedFutureOffsetSeconds: 6, responses: rows }, null, 2) + '\n');
});

test('Phase 0 client clock offsets repeat 30 times per offset and save per-request timings', async () => {
  await reset();
  const cases = [
    { label: 'minus_10m', offsetMs: -600000, expected: 'TIMESTAMP_FAIL' },
    { label: 'minus_1m', offsetMs: -60000, expected: 'ACCEPTED' },
    { label: 'plus_10s', offsetMs: 10000, expected: 'TIMESTAMP_FAIL' },
    { label: 'plus_1m', offsetMs: 60000, expected: 'TIMESTAMP_FAIL' },
    { label: 'plus_10m', offsetMs: 600000, expected: 'TIMESTAMP_FAIL' }
  ];
  const rows = [];
  for (const item of cases) {
    for (let repetition = 1; repetition <= 30; repetition += 1) {
      const request = payload({ amount: 1, timestamp: new Date(serverNow + item.offsetMs).toISOString(), request_id: `clock-offset-${item.label}-${repetition}` });
      request.signature = generateSignature(request, session.sessionKey);
      const result = await call('POST', '/api/withdraw', request);
      const outcome = result.data.status === 'ACCEPTED' ? 'ACCEPTED' : result.data.reason;
      assert.equal(outcome, item.expected, `${item.label} repetition ${repetition}`);
      rows.push({ label: item.label, repetition, offset_ms: item.offsetMs, ...result, outcome });
    }
  }
  const output = testArtifactDirectory;
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'clock-offsets-30-each.csv'), [
    'label,repetition,offset_ms,started_ns,ended_ns,duration_ns,http_status,outcome',
    ...rows.map((row) => [row.label, row.repetition, row.offset_ms, row.started_ns, row.ended_ns, row.duration_ns, row.status, row.outcome].join(','))
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(output, 'clock-offsets-30-each.json'), JSON.stringify({ repetitionsPerOffset: 30, vizEnabled: process.env.VIZ_ENABLED === 'true', cases: cases.map((item) => ({ ...item, measuredCount: rows.filter((row) => row.label === item.label && row.outcome === item.expected).length })), responses: rows }, null, 2) + '\n');
});

test('deposit unknown account, invalid fields, and internal error response contracts are covered', async () => {
  await reset();
  const invalid = await call('POST', '/api/deposit', { user_id: 'anis_101', account_id: 'acc_777', amount: 0 });
  assert.deepEqual(invalid.data, { error: 'INVALID_REQUEST' });
  const unknown = payload({ path: '/api/deposit', user_id: 'absent-user', amount: 10 });
  unknown.signature = generateSignature(unknown, session.sessionKey);
  assert.deepEqual((await call('POST', '/api/deposit', unknown)).data, { error: 'ACCOUNT_NOT_FOUND' });
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.deepEqual((await call('GET', '/__test/unhandled-error')).data, { error: 'INTERNAL_SERVER_ERROR' });
  } finally { console.error = originalError; }
});

test('50 identical concurrent requests produce one debit and one acceptance', async () => {
  await reset();
  const request = payload({ amount: 1 });
  const results = await Promise.all(Array.from({ length: 50 }, () => call('POST', '/api/withdraw', request)));
  assert.equal(results.filter((result) => result.data.status === 'ACCEPTED').length, 1);
  assert.equal(results.filter((result) => result.data.reason === 'NONCE_FAIL').length, 49);
  const balance = await call('GET', '/api/balance/anis_101');
  assert.equal(balance.data.balance, 9999);
});

test('50 valid nonces racing on one request ID produce one debit', async () => {
  await reset();
  const results = await Promise.all(Array.from({ length: 50 }, (_, index) => {
    const request = payload({ amount: 1, request_id: 'shared-race-request-id', nonce: `different-nonce-${index}` });
    request.signature = generateSignature(request, session.sessionKey);
    return call('POST', '/api/withdraw', request);
  }));
  assert.equal(results.filter((result) => result.data.status === 'ACCEPTED').length, 1);
  const balance = await call('GET', '/api/balance/anis_101');
  assert.equal(balance.data.balance, 9999);
});

test('route binding rejects a correctly signed request sent to the other transaction route', async () => {
  await reset();
  const deposit = payload({ path: '/api/deposit', request_id: 'route-deposit-as-withdraw', amount: 1 });
  const withdraw = payload({ path: '/api/withdraw', request_id: 'route-withdraw-as-deposit', amount: 1 });
  assert.deepEqual((await call('POST', '/api/withdraw', deposit)).data, { error: 'INVALID_REQUEST' });
  assert.deepEqual((await call('POST', '/api/deposit', withdraw)).data, { error: 'INVALID_REQUEST' });
  const rows = await new Promise((resolve, reject) => db.all('SELECT request_id FROM transactions WHERE request_id IN (?, ?)', [deposit.request_id, withdraw.request_id], (error, result) => error ? reject(error) : resolve(result)));
  assert.deepEqual(rows, []);
});

test('parallel withdrawals preserve atomic balance invariants', async () => {
  await reset();
  await new Promise((resolve, reject) => db.run("UPDATE accounts SET balance=100 WHERE user_id='anis_101'", (error) => error ? reject(error) : resolve()));
  const requests = Array.from({ length: 100 }, (_, index) => payload({
    amount: index + 1,
    nonce: `atomic-${index}`,
    request_id: `atomic-${index}`
  }));
  const responses = await Promise.all(requests.map((request) => call('POST', '/api/withdraw', request)));
  const rows = await new Promise((resolve, reject) => db.all("SELECT id, amount, status FROM transactions WHERE request_id LIKE 'atomic-%' ORDER BY id", (error, result) => error ? reject(error) : resolve(result)));
  let balance = 100;
  let minimum = balance;
  let successSum = 0;
  for (const row of rows) {
    if (row.status === 'SUCCESS') { balance -= row.amount; successSum += row.amount; }
    minimum = Math.min(minimum, balance);
  }
  const account = await new Promise((resolve, reject) => db.get("SELECT balance FROM accounts WHERE user_id='anis_101'", (error, result) => error ? reject(error) : resolve(result)));
  assert.ok(responses.some((response) => response.data.status === 'ACCEPTED'));
  assert.ok(minimum >= 0);
  assert.ok(successSum <= 100);
  assert.equal(account.balance + successSum, 100);
});

test('session authentication must match the signed user ID', async () => {
  await reset();
  const user = payload({ user_id: 'anis_101' });
  const foreignToken = 'definitely-not-a-session-token';
  assert.equal((await call('POST', '/api/withdraw', user, foreignToken)).data.reason, 'SESSION_INVALID');
  const noSession = await call('POST', '/api/withdraw', user, null);
  assert.equal(noSession.data.reason, 'AUTHENTICATION_REQUIRED');
});

test('legacy shared-secret signatures are rejected when LEGACY_SHARED_SECRET is false', async () => {
  assert.equal(process.env.LEGACY_SHARED_SECRET, 'false');
  const legacySigned = {
    method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777',
    amount: 1, currency: 'BDT', timestamp: new Date(serverNow).toISOString(),
    nonce: `legacy-${crypto.randomUUID()}`, request_id: `legacy-${crypto.randomUUID()}`
  };
  legacySigned.signature = generateSignature(legacySigned, process.env.HMAC_SECRET);
  const response = await call('POST', '/api/withdraw', legacySigned, session.sessionToken);
  assert.equal(response.status, 401);
  assert.deepEqual(response.data, { status: 'REJECTED', reason: 'SIGNATURE_FAIL' });
});

test('CHECK_ORDER accepts timestamp-first and request-ID-before-nonce alternatives', () => {
  assert.deepEqual(require('../core').helpers.parseOrder('timestamp first'), ['timestamp', 'hmac', 'nonce', 'request_id', 'balance']);
  assert.deepEqual(require('../core').helpers.parseOrder('request_id before nonce'), ['hmac', 'timestamp', 'request_id', 'nonce', 'balance']);
  assert.deepEqual(require('../core').helpers.parseOrder('timestamp,hmac,nonce,request_id,balance'), ['timestamp', 'hmac', 'nonce', 'request_id', 'balance']);
});
