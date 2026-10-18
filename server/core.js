require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { monitorEventLoopDelay, PerformanceObserver } = require('perf_hooks');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('redis');
const { verifySignature } = require('./utils/hmac');
const { validSignedRequest } = require('./utils/request');
const { getStartupWarnings } = require('./utils/config-warnings');
const { verifyNonceResilient, listNonceKeys, clearNonceKeys, sqliteRun, sqliteGet, startNonceSweep } = require('./utils/nonce');
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
const ENABLE_DEMO_ROUTES = flag('ENABLE_DEMO_ROUTES', true);
let nonceStoreFaultedForTest = false;
const EXPERIMENT_PROFILE = flag('EXPERIMENT_PROFILE', false);
let eventLoopProfile = null;
let gcObserver = null;
let eventLoopProfileFlushed = false;
function flushEventLoopProfile() {
  if (!EXPERIMENT_PROFILE || eventLoopProfileFlushed || !eventLoopProfile) return false;
  eventLoopProfileFlushed = true;
  eventLoopProfile.disable();
  console.log(JSON.stringify({ type: 'EXPERIMENT_EVENT_LOOP', min_ms: eventLoopProfile.min / 1e6, max_ms: eventLoopProfile.max / 1e6, mean_ms: eventLoopProfile.mean / 1e6, p50_ms: eventLoopProfile.percentile(50) / 1e6, p95_ms: eventLoopProfile.percentile(95) / 1e6, p99_ms: eventLoopProfile.percentile(99) / 1e6 }));
  gcObserver?.disconnect();
  return true;
}
if (EXPERIMENT_PROFILE) {
  eventLoopProfile = monitorEventLoopDelay({ resolution: 10 });
  eventLoopProfile.enable();
  gcObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) console.log(JSON.stringify({ type: 'EXPERIMENT_GC', kind: entry.kind, flags: entry.flags, duration_ms: entry.duration, start_time_ms: entry.startTime }));
  });
  gcObserver.observe({ entryTypes: ['gc'] });
  console.log('EXPERIMENT_PROFILE enabled: event-loop delay and GC events are recorded in the server log.');
  process.once('SIGTERM', () => {
    flushEventLoopProfile();
    process.exit(0);
  });
}
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
const defaultPin = String(process.env.DEMO_PIN || '1234');
const db = new sqlite3.Database(DB_PATH);
const redisClient = createClient({ url: REDIS_URL });
redisClient.on('error', (error) => console.error(`Redis client error: ${error.message}`));
const memoryNonces = new Map();
let transactionQueue = Promise.resolve();
let now = () => Date.now();
let nonceSweepTimer;

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
  await run('CREATE INDEX IF NOT EXISTS idx_used_nonces_expires_at ON used_nonces(expires_at)');
  if (NONCE_BACKEND === 'memory' || NONCE_BACKEND === 'sqlite') {
    if (nonceSweepTimer) clearInterval(nonceSweepTimer);
    nonceSweepTimer = startNonceSweep({ backend: NONCE_BACKEND, store: NONCE_BACKEND === 'memory' ? memoryNonces : db, now: () => now() });
  }
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
  return verifyNonceResilient(store, userId, nonce, { backend: NONCE_BACKEND, ttlSeconds: NONCE_TTL, failMode: NONCE_STORE_FAIL_MODE, now: () => now(), forceError: nonceStoreFaultedForTest });
}

function errorResponse(res, statusCode, reason) {
  return res.status(statusCode).json({ status: 'REJECTED', reason });
}

function rejectVisual(reason, amount) {
  emit('transaction-result', { status: 'REJECTED', amount, reason });
}

function validRequest(payload, type) {
  return validSignedRequest(payload, type);
}

function timingFields() {
  return {
    hmac_ns: DEFENSES.hmac ? 'not_reached' : 'disabled',
    timestamp_ns: DEFENSES.timestamp ? 'not_reached' : 'disabled',
    nonce_ns: DEFENSES.nonce ? 'not_reached' : 'disabled',
    request_id_ns: DEFENSES.request_id ? 'not_reached' : 'disabled',
    balance_ns: 'not_reached'
  };
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
        if (!DEFENSES.hmac) return { valid: true, disabled: true };
        const result = verifySignature(payload, auth.secret);
        emit('check-signature', DEMO_MODE
          ? { status: result.valid ? 'PASS' : 'FAIL', expected: result.expected, received: result.received }
          : { status: result.valid ? 'PASS' : 'FAIL' });
        return result;
      },
      timestamp: async () => {
        if (!DEFENSES.timestamp) return { valid: true, disabled: true };
        const checkedAtMs = now();
        if (experimentLogPath) res.setHeader('x-server-check-time-ms', String(checkedAtMs));
        const skewSeconds = (checkedAtMs - Date.parse(payload.timestamp)) / 1000;
        const valid = skewSeconds >= -FUTURE_WINDOW && skewSeconds <= PAST_WINDOW;
        emit('check-timestamp', { status: valid ? 'PASS' : 'FAIL', diff: Math.round(skewSeconds), allowedPast: PAST_WINDOW, allowedFuture: FUTURE_WINDOW });
        return { valid, skewSeconds };
      },
      nonce: async () => {
        if (!DEFENSES.nonce) return { valid: true, disabled: true };
        const result = await verifyAndRememberNonce(payload.user_id, payload.nonce);
        emit('check-nonce', { status: result.valid ? 'PASS' : 'FAIL', redisResult: result.redisResult });
        await emitNonceUpdate();
        return result;
      },
      request_id: async () => {
        if (!DEFENSES.request_id) return { valid: true, disabled: true };
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
      if (result.disabled) timings[`${layer}_ns`] = 'disabled';
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

if (ENABLE_DEMO_ROUTES) app.post('/api/reset', async (req, res) => {
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

if (ENABLE_DEMO_ROUTES) app.post('/api/demo/nonce-crash', async (req, res) => {
  try {
    const cleared = await clearUsedNonces();
    await emitNonceUpdate();
    res.json({ ok: true, deleted: cleared.length });
  } catch (error) { res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' }); }
});

if (flag('ENABLE_TEST_FAULT_ROUTE', false)) {
  app.post('/__test/fault/nonce-store', (req, res) => {
    nonceStoreFaultedForTest = req.body?.enabled === true;
    return res.json({ enabled: nonceStoreFaultedForTest });
  });
  app.get('/__test/unhandled-error', (req, res, next) => next(new Error('test-only injected failure')));
  app.post('/__test/profile/flush', (req, res) => {
    if (!flushEventLoopProfile()) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ logged: true });
  });
}
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400) return res.status(400).json({ error: 'INVALID_REQUEST' });
  console.error(error);
  return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
});
app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

async function start() {
  for (const warning of getStartupWarnings({ nonceTtl: NONCE_TTL, pastWindow: PAST_WINDOW, futureWindow: FUTURE_WINDOW, host: HOST, enableDemoRoutes: ENABLE_DEMO_ROUTES })) console.warn(warning);
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
  config: { LEGACY_SHARED_SECRET, HMAC_SECRET, NONCE_BACKEND, NONCE_TTL, PAST_WINDOW, FUTURE_WINDOW, VIZ_ENABLED, DEMO_MODE, ENABLE_DEMO_ROUTES, DEPOSIT_REPLAY_PROTECTION, DEFENSES, CHECK_ORDER, NONCE_STORE_FAIL_MODE },
  helpers: { get, all, run, pinDigest, clearUsedNonces, currentNonceKeys, emitDatabaseUpdate, parseOrder, validRequest, getStartupWarnings }
};

if (require.main === module) {
  start().catch((error) => { console.error(error); process.exit(1); });
}
