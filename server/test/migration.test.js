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
process.env.HMAC_SECRET = 'migration-test-key';

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

