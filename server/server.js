require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('redis');
const { verifySignature } = require('./utils/hmac');
const { verifyNonce, listNonceKeys, clearNonceKeys } = require('./utils/nonce');
const { isRequestProcessed } = require('./utils/idempotency');
const { startVizServer, emitVizEvent } = require('./viz-server');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const HMAC_SECRET = process.env.HMAC_SECRET || 'demo_shared_hmac_secret_change_me';
const DB_PATH = path.resolve(__dirname, process.env.SQLITE_DB || './db/bank.db');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const ATTACK_PAYLOAD_PATH = path.resolve(__dirname, '..', 'attack', 'payload.json');

const db = new sqlite3.Database(DB_PATH);
const redisClient = createClient({ url: REDIS_URL });
let transactionQueue = Promise.resolve();

app.use(cors());
app.use(express.json());

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }
      resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row || null);
    });
  });
}

function withTransactionLock(task) {
  const next = transactionQueue.then(task, task);
  transactionQueue = next.catch(() => {});
  return next;
}

async function rollbackIfActive() {
  try {
    await run('ROLLBACK');
  } catch (rollbackError) {
    if (rollbackError.message && !rollbackError.message.includes('no transaction')) {
      console.error(rollbackError);
    }
  }
}

function isSqliteConstraint(error) {
  return Boolean(error && typeof error.code === 'string' && error.code.startsWith('SQLITE_CONSTRAINT'));
}

async function syncCapturedWithdrawPayload(payload) {
  const temporaryPath = `${ATTACK_PAYLOAD_PATH}.tmp`;
  const serializedPayload = `${JSON.stringify(payload, null, 2)}\n`;
  await fs.writeFile(temporaryPath, serializedPayload, 'utf8');
  await fs.rename(temporaryPath, ATTACK_PAYLOAD_PATH);
}

async function initializeDatabase() {
  await run('PRAGMA journal_mode = WAL');
  await run('PRAGMA foreign_keys = ON');

  await run(`
    CREATE TABLE IF NOT EXISTS accounts (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      balance INTEGER NOT NULL DEFAULT 10000,
      currency TEXT DEFAULT 'BDT',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT UNIQUE NOT NULL,
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
    )
  `);

  await run(`
    INSERT OR IGNORE INTO accounts (user_id, username, balance)
    VALUES ('anis_101', 'Anis Ahmed', 10000)
  `);
}

async function getDatabaseState() {
  const accounts = await all('SELECT * FROM accounts ORDER BY user_id');
  const transactions = await all('SELECT * FROM transactions ORDER BY id DESC LIMIT 20');
  return { accounts, transactions };
}

async function emitDatabaseUpdate() {
  emitVizEvent('db-update', await getDatabaseState());
}

async function emitRedisUpdate() {
  emitVizEvent('redis-update', {
    keys: await listNonceKeys(redisClient)
  });
}

async function clearUsedNonces() {
  return clearNonceKeys(redisClient);
}

function requestTypeLabel(req) {
  const bodyType = req.body && req.body.type;
  if (bodyType) {
    return bodyType;
  }
  return req.path.includes('withdraw') ? 'WITHDRAW' : 'DEPOSIT';
}

function rejectWithdraw(res, statusCode, reason, amount, newBalance = null) {
  emitVizEvent('transaction-result', {
    status: 'REJECTED',
    amount,
    newBalance,
    reason
  });

  res.status(statusCode).json({
    status: 'REJECTED',
    reason
  });
}

app.get('/api/health', async (req, res) => {
  res.type('text/plain').send('OK');
});

app.get('/api/balance/:user_id', async (req, res, next) => {
  try {
    const account = await get(
      'SELECT user_id, username, balance, currency FROM accounts WHERE user_id = ?',
      [req.params.user_id]
    );

    if (!account) {
      res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });
      return;
    }

    res.json(account);
  } catch (error) {
    next(error);
  }
});

app.get('/api/transactions/:user_id', async (req, res, next) => {
  try {
    const transactions = await all(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC',
      [req.params.user_id]
    );
    res.json({ transactions });
  } catch (error) {
    next(error);
  }
});

app.post('/api/deposit', async (req, res, next) => {
  try {
    const {
      user_id,
      account_id = 'acc_777',
      amount,
      currency = 'BDT',
      request_id,
      signature = null
    } = req.body;

    emitVizEvent('request-received', {
      user: user_id,
      amount,
      type: requestTypeLabel(req)
    });

    if (!user_id || !request_id || !Number.isInteger(Number(amount)) || Number(amount) <= 0) {
      res.status(400).json({ error: 'INVALID_REQUEST' });
      return;
    }

    const duplicate = await isRequestProcessed(db, request_id);
    if (duplicate.processed) {
      res.status(409).json({ status: 'REJECTED', reason: 'ALREADY_PROCESSED' });
      return;
    }

    const account = await withTransactionLock(async () => {
      await run('BEGIN IMMEDIATE TRANSACTION');
      await run(
        'UPDATE accounts SET balance = balance + ? WHERE user_id = ?',
        [Number(amount), user_id]
      );
      const updatedAccount = await get('SELECT balance FROM accounts WHERE user_id = ?', [user_id]);

      if (!updatedAccount) {
        await run('ROLLBACK');
        return null;
      }

      await run(
        `INSERT INTO transactions
         (request_id, user_id, account_id, type, amount, currency, status, reason, signature)
         VALUES (?, ?, ?, 'DEPOSIT', ?, ?, 'SUCCESS', NULL, ?)`,
        [request_id, user_id, account_id, Number(amount), currency, signature]
      );
      await run('COMMIT');
      return updatedAccount;
    });

    if (!account) {
      res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });
      return;
    }

    emitVizEvent('transaction-result', {
      status: 'ACCEPTED',
      amount: Number(amount),
      newBalance: account.balance,
      reason: null
    });
    await emitDatabaseUpdate();

    res.json({
      status: 'ACCEPTED',
      amount: Number(amount),
      newBalance: account.balance
    });
  } catch (error) {
    await rollbackIfActive();
    if (isSqliteConstraint(error)) {
      res.status(409).json({ status: 'REJECTED', reason: 'ALREADY_PROCESSED' });
      return;
    }
    next(error);
  }
});

app.post('/api/reset', async (req, res, next) => {
  try {
    await run('BEGIN IMMEDIATE TRANSACTION');
    await run('DELETE FROM transactions');
    await run(`
      INSERT INTO accounts (user_id, username, balance, currency)
      VALUES ('anis_101', 'Anis Ahmed', 10000, 'BDT')
      ON CONFLICT(user_id) DO UPDATE SET
        username = 'Anis Ahmed',
        balance = 10000,
        currency = 'BDT'
    `);
    await run('COMMIT');

    const clearedNonceKeys = await clearUsedNonces();
    const databaseState = await getDatabaseState();
    const nonceKeys = await listNonceKeys(redisClient);

    emitVizEvent('reset', {
      accounts: databaseState.accounts,
      transactions: databaseState.transactions,
      clearedNonceKeys,
      keys: nonceKeys
    });
    emitVizEvent('db-update', databaseState);
    emitVizEvent('redis-update', { keys: nonceKeys });

    res.json({
      status: 'RESET',
      accounts: databaseState.accounts,
      transactions: databaseState.transactions,
      clearedNonceKeys,
      keys: nonceKeys
    });
  } catch (error) {
    try {
      await run('ROLLBACK');
    } catch (rollbackError) {
      if (rollbackError.message && !rollbackError.message.includes('no transaction')) {
        console.error(rollbackError);
      }
    }
    next(error);
  }
});

app.post('/api/demo/nonce-crash', async (req, res, next) => {
  try {
    // DEMO ONLY: classroom fault-injection for nonce-store state loss.
    // This deliberately clears Redis anti-replay nonce records and is not production-safe.
    const clearedNonceKeys = await clearUsedNonces();
    const nonceKeys = await listNonceKeys(redisClient);
    emitVizEvent('redis-update', { keys: nonceKeys });

    res.json({
      ok: true,
      deleted: clearedNonceKeys.length
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/withdraw', async (req, res, next) => {
  const payload = req.body;
  const amount = Number(payload.amount);
  const timestampMs = Date.parse(payload.timestamp);

  try {
    emitVizEvent('request-received', {
      user: payload.user_id,
      amount,
      type: 'WITHDRAW'
    });

    if (
      !payload.method ||
      !payload.path ||
      !payload.user_id ||
      !payload.account_id ||
      !payload.currency ||
      !payload.nonce ||
      !payload.request_id ||
      !Number.isInteger(amount) ||
      amount <= 0 ||
      Number.isNaN(timestampMs)
    ) {
      res.status(400).json({ error: 'INVALID_REQUEST' });
      return;
    }

    const signatureResult = verifySignature(payload, HMAC_SECRET);
    emitVizEvent('check-signature', {
      status: signatureResult.valid ? 'PASS' : 'FAIL',
      expected: signatureResult.expected,
      received: signatureResult.received
    });

    if (!signatureResult.valid) {
      rejectWithdraw(res, 401, 'SIGNATURE_FAIL', amount);
      return;
    }

    const skewSeconds = Number.isNaN(timestampMs)
      ? Number.POSITIVE_INFINITY
      : (Date.now() - timestampMs) / 1000;
    const timestampValid = skewSeconds >= -5 && skewSeconds <= 300;

    emitVizEvent('check-timestamp', {
      status: timestampValid ? 'PASS' : 'FAIL',
      diff: Number.isFinite(skewSeconds) ? Math.round(skewSeconds) : null,
      allowed: 300
    });

    if (!timestampValid) {
      rejectWithdraw(res, 400, 'TIMESTAMP_FAIL', amount);
      return;
    }

    const nonceResult = await verifyNonce(redisClient, payload.user_id, payload.nonce);
    emitVizEvent('check-nonce', {
      status: nonceResult.valid ? 'PASS' : 'FAIL',
      nonce: payload.nonce,
      redisResult: nonceResult.redisResult
    });
    await emitRedisUpdate();

    if (!nonceResult.valid) {
      rejectWithdraw(res, 409, 'NONCE_FAIL', amount);
      return;
    }

    const idempotencyResult = await isRequestProcessed(db, payload.request_id);
    emitVizEvent('check-requestid', {
      status: idempotencyResult.processed ? 'FAIL' : 'PASS',
      requestId: payload.request_id,
      found: idempotencyResult.processed
    });

    if (idempotencyResult.processed) {
      rejectWithdraw(res, 409, 'ALREADY_PROCESSED', amount);
      return;
    }

    const transactionResult = await withTransactionLock(async () => {
      await run('BEGIN IMMEDIATE TRANSACTION');

      const account = await get(
        'SELECT balance FROM accounts WHERE user_id = ?',
        [payload.user_id]
      );
      const balance = account ? account.balance : 0;
      const balanceValid = Boolean(account) && balance >= amount;

      emitVizEvent('check-balance', {
        status: balanceValid ? 'PASS' : 'FAIL',
        balance,
        required: amount
      });

      if (!balanceValid) {
        await run('ROLLBACK');
        await run(
          `INSERT INTO transactions
           (request_id, user_id, account_id, type, amount, currency, status, reason, signature)
           VALUES (?, ?, ?, 'WITHDRAW', ?, ?, 'FAILED', 'INSUFFICIENT_BALANCE', ?)`,
          [
            payload.request_id,
            payload.user_id,
            payload.account_id,
            amount,
            payload.currency,
            payload.signature
          ]
        );
        return { accepted: false, balance };
      }

      await run(
        'UPDATE accounts SET balance = balance - ? WHERE user_id = ?',
        [amount, payload.user_id]
      );
      const updatedAccount = await get(
        'SELECT balance FROM accounts WHERE user_id = ?',
        [payload.user_id]
      );
      await run(
        `INSERT INTO transactions
         (request_id, user_id, account_id, type, amount, currency, status, reason, signature)
         VALUES (?, ?, ?, 'WITHDRAW', ?, ?, 'SUCCESS', NULL, ?)`,
        [
          payload.request_id,
          payload.user_id,
          payload.account_id,
          amount,
          payload.currency,
          payload.signature
        ]
      );
      await run('COMMIT');
      return { accepted: true, updatedAccount };
    });

    if (!transactionResult.accepted) {
      await emitDatabaseUpdate();
      rejectWithdraw(res, 400, 'INSUFFICIENT_BALANCE', amount, transactionResult.balance);
      return;
    }

    emitVizEvent('transaction-result', {
      status: 'ACCEPTED',
      amount,
      newBalance: transactionResult.updatedAccount.balance,
      reason: null
    });
    await emitDatabaseUpdate();
    try {
      await syncCapturedWithdrawPayload(payload);
    } catch (syncError) {
      console.error('Failed to sync captured withdraw payload:', syncError);
    }

    res.json({
      status: 'ACCEPTED',
      amount,
      newBalance: transactionResult.updatedAccount.balance
    });
  } catch (error) {
    await rollbackIfActive();
    if (isSqliteConstraint(error)) {
      rejectWithdraw(res, 409, 'ALREADY_PROCESSED', amount);
      return;
    }
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR'
  });
});

async function start() {
  await initializeDatabase();
  await redisClient.connect();
  await redisClient.ping();
  startVizServer();
  await emitDatabaseUpdate();
  await emitRedisUpdate();

  app.listen(PORT, HOST, () => {
    console.log(`Bank server listening on ${HOST}:${PORT}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  app,
  db,
  redisClient,
  initializeDatabase,
  start
};
