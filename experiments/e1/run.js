const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
require('../../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const { generateSignature } = require('../../server/utils/hmac');
const { computeMoneyIntegrity } = require('../../server/utils/money-oracle');
const sqlite3 = require('../../server/node_modules/sqlite3').verbose();
const { timedRequest } = require('../lib/http');

const ROOT = path.resolve(__dirname, '../..');
const SERVER = path.join(ROOT, 'server');
const OUTPUT = path.resolve(process.env.E1_OUTPUT_DIR || path.join(ROOT, 'experiments/results/e1-v2'));
const RUN_TAG = new Date().toISOString().replace(/[:.]/g, '-');
const RUN_OUTPUT = path.join(OUTPUT, RUN_TAG);
const RANDOM_SEED = 'e1-fixed-seed-2026-v1';
const WIDTH = 30;
const PAST = 6;
const FUTURE = 2;
const NONCE_TTL = 4;
const SESSION_TTL = 15;
const PIN = process.env.DEMO_PIN || '1234';
fs.mkdirSync(OUTPUT, { recursive: true });

const csv = (value) => {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const writeCsv = (file, headers, rows) => fs.writeFileSync(file, `${[headers.join(','), ...rows.map((row) => headers.map((key) => csv(row[key])).join(','))].join('\n')}\n`);
const wilson = (successes, n) => {
  if (!n) return [0, 1];
  const z = 1.959963984540054;
  const p = successes / n;
  const d = 1 + z * z / n;
  const center = (p + z * z / (2 * n)) / d;
  const margin = z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n) / d;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
};
const shortHash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
let deterministicSequence = 0;
const deterministicId = (scope) => crypto.createHash('sha256').update(`${RANDOM_SEED}|${scope}|${deterministicSequence++}`).digest('hex').slice(0, 32);

async function waitHealth(port, child, log) {
  const deadline = Date.now() + 30000;
  const rows = [];
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited early; see ${log}`);
    try {
      const response = await timedRequest(`http://127.0.0.1:${port}/api/health`);
      rows.push({ start_ns: response.start_ns, end_ns: response.end_ns, duration_ns: response.duration_ns, http_status: response.status, outcome: response.status === 200 ? 'READY' : 'NOT_READY' });
      if (response.status === 200) { writeCsv(path.join(path.dirname(log), 'health-readiness.csv'), Object.keys(rows[0]), rows); return; }
    } catch (error) { rows.push({ start_ns: error.start_ns, end_ns: error.end_ns, duration_ns: error.duration_ns, http_status: '', outcome: 'CONNECT_ERROR' }); }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (rows.length) writeCsv(path.join(path.dirname(log), 'health-readiness.csv'), Object.keys(rows[0]), rows);
  throw new Error(`Server health timed out; see ${log}`);
}

function spawnLogged(exe, args, options, stdout, stderr) {
  const out = fs.openSync(stdout, 'a');
  const err = fs.openSync(stderr, 'a');
  const child = spawn(exe, args, { ...options, stdio: ['ignore', out, err], windowsHide: true });
  child.once('exit', () => { try { fs.closeSync(out); } catch {} try { fs.closeSync(err); } catch {} });
  return child;
}

async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([new Promise((resolve) => child.once('exit', resolve)), new Promise((resolve) => setTimeout(resolve, 3000))]);
  if (child.exitCode === null && child.pid) spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
}

function parseCaptures(logPath) {
  if (!fs.existsSync(logPath)) return [];
  return fs.readFileSync(logPath, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

async function runConfiguration(mask, profile = {}) {
  const past = profile.past ?? PAST;
  const future = profile.future ?? FUTURE;
  const nonceTtl = profile.nonceTtl ?? NONCE_TTL;
  const sessionTtl = profile.sessionTtl ?? SESSION_TTL;
  const policy = profile.idempotencyPolicy || process.env.IDEMPOTENCY_POLICY || 'success_only';
  const id = `H${mask & 1 ? 1 : 0}T${mask & 2 ? 1 : 0}N${mask & 4 ? 1 : 0}R${mask & 8 ? 1 : 0}${profile.suffix || ''}`;
  const port = 3200;
  const vizPort = 3201;
  const proxyPort = 3202;
  const namespace = `e1-${id.toLowerCase()}-${process.pid}`;
  const runDir = path.join(RUN_OUTPUT, id);
  fs.mkdirSync(runDir, { recursive: true });
  const captureBase = path.join(os.tmpdir(), `cs-e1-${id}-${process.pid}.json`);
  const captureLog = `${captureBase}.jsonl`;
  const serverEnv = {
    ...process.env,
    PORT: String(port), HOST: '127.0.0.1', VIZ_PORT: String(vizPort),
    VIZ_ENABLED: 'false', DEMO_MODE: 'false', LEGACY_SHARED_SECRET: 'false',
    ENABLE_DEMO_ROUTES: 'true', NONCE_STORE: 'redis', NONCE_TTL: String(nonceTtl),
    REDIS_URL: 'redis://127.0.0.1:6379',
    NONCE_KEY_NAMESPACE: namespace, SQLITE_DB: path.join(RUN_OUTPUT, `${id}.sqlite`),
    TIMESTAMP_PAST_WINDOW_SECONDS: String(past), TIMESTAMP_FUTURE_WINDOW_SECONDS: String(future), SESSION_TTL: String(sessionTtl),
    DEFENSE_HMAC: String(Boolean(mask & 1)), DEFENSE_TIMESTAMP: String(Boolean(mask & 2)),
    DEFENSE_NONCE: String(Boolean(mask & 4)), DEFENSE_REQUEST_ID: String(Boolean(mask & 8)),
    IDEMPOTENCY_POLICY: policy,
    EXPERIMENT_LOG: path.join(runDir, 'server-timings.csv'), CONFIG_ID: id, SCENARIO_ID: 'e1', RUN_ID: `e1-${Date.now()}`
  };
  const server = spawnLogged(process.execPath, ['server.js'], { cwd: SERVER, env: serverEnv }, path.join(runDir, 'server.stdout.log'), path.join(runDir, 'server.stderr.log'));
  const proxyEnv = { ...process.env, PROXY_UPSTREAM: `http://127.0.0.1:${port}`, PROXY_PORT: String(proxyPort), PROXY_CAPTURE_FILE: captureBase, PROXY_WITHDRAW_CAPTURE_FILE: `${captureBase}.withdraw.json`, PROXY_REDACT_LOGIN: 'true' };
  let proxy;
  const requestRows = [];
  const summaries = [];
  let session = null;
  let ledgerDb = null;
  let sequence = 0;

  async function startProxy() {
    proxy = spawnLogged(process.execPath, [path.join(ROOT, 'experiments/recording-proxy.js')], { cwd: ROOT, env: proxyEnv }, path.join(runDir, 'proxy.stdout.log'), path.join(runDir, 'proxy.stderr.log'));
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (proxy.exitCode !== null) throw new Error(`Proxy exited; see ${runDir}`);
      try { await timedRequest(`http://127.0.0.1:${proxyPort}/api/health`); return; } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Proxy health timed out: ${runDir}`);
  }

  async function login() {
    const result = await timedRequest(`http://127.0.0.1:${proxyPort}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user_id: 'anis_101', pin: PIN }) });
    if (result.status !== 200) throw new Error(`Session login failed with HTTP ${result.status}`);
    session = result.body;
  }

  function signedPayload({ requestId = `e1-${deterministicId(id)}`, nonce = `n-${deterministicId(id)}`, amount = 1 } = {}, signingKey = session.sessionKey) {
    const payload = { method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777', amount, currency: 'BDT', timestamp: new Date().toISOString(), nonce, request_id: requestId };
    payload.signature = generateSignature(payload, signingKey);
    return payload;
  }

  async function submit(payload, token = session.sessionToken) {
    return timedRequest(`http://127.0.0.1:${proxyPort}/api/withdraw`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  }

  function findCapture(requestId) {
    const record = parseCaptures(captureLog).reverse().find((entry) => {
      if (entry.request.method !== 'POST' || new URL(entry.request.path, 'http://localhost').pathname !== '/api/withdraw') return false;
      try { return JSON.parse(entry.request.body).request_id === requestId; } catch { return false; }
    });
    if (!record) throw new Error(`Attacker-visible proxy capture missing for request ${shortHash(requestId)}`);
    return record;
  }

  async function replay(capture, mutate = (body) => body) {
    const body = mutate(JSON.parse(capture.request.body));
    const headers = { 'content-type': 'application/json' };
    const authorization = capture.request.headers.authorization;
    if (authorization) headers.authorization = authorization;
    return timedRequest(`http://127.0.0.1:${proxyPort}/api/withdraw`, { method: 'POST', headers, body: JSON.stringify(body) });
  }

  async function ledger() {
    return new Promise((resolve, reject) => ledgerDb.all('SELECT id, request_id, type, status, amount FROM transactions ORDER BY id', [], (error, rows) => error ? reject(error) : resolve(rows)));
  }

  async function baseline(label, count, addAuthorization = true) {
    const captures = [];
    for (let i = 0; i < count; i += 1) {
      const payload = signedPayload();
      const response = await submit(payload);
      if (response.status !== 200 || response.body.status !== 'ACCEPTED') throw new Error(`${id}/${label}: baseline rejected (${response.status}/${response.body.reason || response.body.error})`);
      if (addAuthorization) authorized.push({ request_id: payload.request_id, amount: payload.amount, type: 'WITHDRAW' });
      captures.push(findCapture(payload.request_id));
      requestRows.push({ config_id: id, scenario_id: label, variant: '', attempt: i + 1, phase: 'legitimate', request_id_hash: shortHash(payload.request_id), start_ns: response.start_ns, end_ns: response.end_ns, duration_ns: response.duration_ns, http_status: response.status, outcome: response.body.status, reason: '' });
    }
    return captures;
  }

  const authorized = [];

  async function measureScenario(name, attempts, action, options = {}) {
    const beforeLedger = await ledger();
    const beforeRows = beforeLedger.filter((row) => row.status === 'SUCCESS' && row.type === 'WITHDRAW').length;
    const beforeOracle = computeMoneyIntegrity(beforeLedger, authorized);
    const results = await action();
    const afterLedger = await ledger();
    const afterRows = afterLedger.filter((row) => row.status === 'SUCCESS' && row.type === 'WITHDRAW').length;
    const afterOracle = computeMoneyIntegrity(afterLedger, authorized);
    const debited = afterRows - beforeRows;
    const accepted = results.filter((r) => r.status === 200 && r.body.status === 'ACCEPTED').length;
    const duplicateDelta = afterOracle.duplicate_debit_count - beforeOracle.duplicate_debit_count;
    const duplicateAmountDelta = afterOracle.duplicate_debit_amount - beforeOracle.duplicate_debit_amount;
    const unauthorizedDelta = afterOracle.unauthorized_debit_amount - beforeOracle.unauthorized_debit_amount;
    const reasons = {};
    results.forEach((r) => { const reason = r.body.reason || r.body.error || r.body.status || `HTTP_${r.status}`; reasons[reason] = (reasons[reason] || 0) + 1; });
    const interval = wilson(debited, attempts);
    summaries.push({ config_id: id, scenario_id: name, variant: options.variant || '', attempts, http_accepted_count: accepted, debited_count: debited, attack_success_rate: attempts ? debited / attempts : 0, wilson95_low: interval[0], wilson95_high: interval[1], blocking_reason_histogram: JSON.stringify(reasons), oracle_total_debited_delta: afterOracle.total_debited - beforeOracle.total_debited, oracle_duplicate_debit_count_delta: duplicateDelta, oracle_duplicate_debit_amount_delta: duplicateAmountDelta, oracle_unauthorized_debit_amount_delta: unauthorizedDelta, oracle_delayed_execution_count_delta: afterOracle.delayed_execution_count - beforeOracle.delayed_execution_count, oracle_delayed_execution_amount_delta: afterOracle.delayed_execution_amount - beforeOracle.delayed_execution_amount, oracle_integrity_holds: duplicateDelta === 0 && unauthorizedDelta === 0 });
    return results;
  }

  function recordAttempts(label, results, startIndex = 0, variant = '') {
    results.forEach((response, index) => {
      requestRows.push({ config_id: id, scenario_id: label, variant, attempt: startIndex + index + 1, phase: 'attacker', request_id_hash: '', start_ns: response.start_ns, end_ns: response.end_ns, duration_ns: response.duration_ns, http_status: response.status, outcome: response.body.status || 'REJECTED', reason: response.body.reason || response.body.error || '' });
    });
  }

  try {
    await waitHealth(port, server, path.join(runDir, 'server.stderr.log'));
    ledgerDb = new sqlite3.Database(serverEnv.SQLITE_DB);
    await new Promise((resolve, reject) => ledgerDb.once('open', resolve).once('error', reject));
    await startProxy();
    await login();
    await baseline('LEGITIMATE_CONTROL', 30);
    summaries.push({ config_id: id, scenario_id: 'LEGITIMATE_CONTROL', attempts: 30, http_accepted_count: 30, debited_count: 30, attack_success_rate: null, wilson95_low: null, wilson95_high: null, blocking_reason_histogram: '{}', oracle_duplicate_debit_count_delta: 0, oracle_duplicate_debit_amount_delta: 0, oracle_unauthorized_debit_amount_delta: 0, oracle_integrity_holds: true });

    if (profile.fullScale) {
      for (const scenario of ['S2', 'S4']) {
        await login();
        const captures = await baseline(`${scenario}_legitimate_seed`, WIDTH);
        const waitSeconds = scenario === 'S2' ? 60 : 301;
        await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
        const results = await measureScenario(`${scenario}_default_window_${waitSeconds}s`, WIDTH, async () => Promise.all(captures.map((capture) => replay(capture))));
        recordAttempts(`${scenario}_default_window_${waitSeconds}s`, results);
      }
      writeCsv(path.join(runDir, 'requests.csv'), ['config_id', 'scenario_id', 'variant', 'attempt', 'phase', 'request_id_hash', 'start_ns', 'end_ns', 'duration_ns', 'http_status', 'outcome', 'reason'], requestRows);
      return summaries;
    }

    const filter = process.env.E1_SCENARIO_FILTER || '';
    const selectedScenarios = filter ? [filter] : ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7a', 'S7b', 'S8', 'S9', 'S10_fast', 'S10_late'];
    for (const scenario of selectedScenarios) {
      await login();
      if (scenario === 'S1' || scenario === 'S2' || scenario === 'S3' || scenario === 'S4' || scenario === 'S8') {
        const captures = await baseline(`${scenario}_legitimate_seed`, WIDTH);
        if (scenario === 'S2') await new Promise((resolve) => setTimeout(resolve, 2000));
        if (scenario === 'S3') await timedRequest(`http://127.0.0.1:${proxyPort}/api/demo/nonce-crash`, { method: 'POST', headers: { authorization: `Bearer ${session.sessionToken}` }, body: '{}' });
        if (scenario === 'S4') await new Promise((resolve) => setTimeout(resolve, (past + 1) * 1000));
        if (scenario === 'S8') await new Promise((resolve) => setTimeout(resolve, (sessionTtl + 1) * 1000));
        const results = await measureScenario(scenario, WIDTH, async () => Promise.all(captures.map((capture) => replay(capture))));
        recordAttempts(scenario, results);
      } else if (scenario === 'S5') {
        const allResults = [];
        for (let batch = 0; batch < WIDTH; batch += 1) {
          await login();
          const [capture] = await baseline(`${scenario}_legitimate_seed`, 1);
          const results = await measureScenario(scenario, 50, async () => Promise.all(Array.from({ length: 50 }, () => replay(capture))));
          recordAttempts(scenario, results, batch * 50);
          allResults.push(results);
        }
        const group = summaries.filter((row) => row.config_id === id && row.scenario_id === scenario);
        const attempts = group.reduce((sum, row) => sum + row.attempts, 0);
        const debited = group.reduce((sum, row) => sum + row.debited_count, 0);
        const accepted = group.reduce((sum, row) => sum + row.http_accepted_count, 0);
        const interval = wilson(debited, attempts);
        const reasonHistogram = {};
        for (const results of allResults) for (const response of results) { const reason = response.body.reason || response.body.error || response.body.status || `HTTP_${response.status}`; reasonHistogram[reason] = (reasonHistogram[reason] || 0) + 1; }
        const duplicateDelta = group.reduce((sum, row) => sum + row.oracle_duplicate_debit_count_delta, 0);
        const unauthorizedDelta = group.reduce((sum, row) => sum + row.oracle_unauthorized_debit_amount_delta, 0);
        summaries.splice(summaries.length - group.length, group.length, { config_id: id, scenario_id: scenario, attempts, http_accepted_count: accepted, debited_count: debited, attack_success_rate: debited / attempts, wilson95_low: interval ? interval[0] : null, wilson95_high: interval ? interval[1] : null, blocking_reason_histogram: JSON.stringify(reasonHistogram), oracle_duplicate_debit_count_delta: duplicateDelta, oracle_duplicate_debit_amount_delta: group.reduce((sum, row) => sum + row.oracle_duplicate_debit_amount_delta, 0), oracle_unauthorized_debit_amount_delta: unauthorizedDelta, oracle_integrity_holds: duplicateDelta === 0 && unauthorizedDelta === 0 });
        continue;
      } else if (scenario === 'S6') {
        const captures = await baseline(`${scenario}_legitimate_seed`, WIDTH);
        const results = await measureScenario(scenario, WIDTH, async () => Promise.all(captures.map((capture) => replay(capture, (body) => ({ ...body, amount: body.amount + 1 })))));
        recordAttempts(scenario, results);
      } else if (scenario === 'S7a' || scenario === 'S7b') {
        const captures = await baseline(`${scenario}_legitimate_seed`, WIDTH);
        const field = scenario === 'S7a' ? 'request_id' : 'nonce';
        const results = await measureScenario(scenario, WIDTH, async () => Promise.all(captures.map((capture) => replay(capture, (body) => ({ ...body, [field]: `${body[field]}-changed` })))), { variant: field });
        recordAttempts(scenario, results, 0, field);
      } else if (scenario === 'S9') {
        const [seedCapture] = await baseline('S9_leaked_key_seed', 1);
        const bearer = seedCapture.request.headers.authorization.replace(/^Bearer\s+/i, '');
        const leakedKey = session.sessionKey;
        const payloads = Array.from({ length: WIDTH }, () => signedPayload({}, leakedKey));
        const results = await measureScenario(scenario, WIDTH, async () => Promise.all(payloads.map((payload) => submit(payload, bearer))));
        recordAttempts(scenario, results);
      } else if (scenario === 'S11') {
        const [tokenCapture] = await baseline('S11_token_capture_seed', 1);
        const bearer = tokenCapture.request.headers.authorization.replace(/^Bearer\s+/i, '');
        // The attacker gets only the bearer token. No session key is read or used here.
        const forged = Array.from({ length: WIDTH }, () => ({
          method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777', amount: 1,
          currency: 'BDT', timestamp: new Date().toISOString(), nonce: `s11-n-${deterministicId(id)}`,
          request_id: `s11-r-${deterministicId(id)}`
        }));
        const results = await measureScenario(scenario, WIDTH, async () => Promise.all(forged.map((payload) => submit(payload, bearer))));
        recordAttempts(scenario, results);
      } else if (scenario === 'S10_fast' || scenario === 'S10_late') {
        const deposit = async (amount) => {
          const payload = { method: 'POST', path: '/api/deposit', user_id: 'anis_101', account_id: 'acc_777', amount, currency: 'BDT', timestamp: new Date().toISOString(), nonce: `deposit-${deterministicId(id)}`, request_id: `fund-${deterministicId(id)}` };
          payload.signature = generateSignature(payload, session.sessionKey);
          return timedRequest(`http://127.0.0.1:${proxyPort}/api/deposit`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${session.sessionToken}` }, body: JSON.stringify(payload) });
        };
        await new Promise((resolve, reject) => ledgerDb.run("UPDATE accounts SET balance=1 WHERE user_id='anis_101'", (error) => error ? reject(error) : resolve()));
        const failedPayload = signedPayload({ requestId: `s10-${deterministicId(id)}`, amount: 100 });
        authorized.push({ request_id: failedPayload.request_id, amount: failedPayload.amount, type: 'WITHDRAW' });
        const failedResponse = await submit(failedPayload);
        if (failedResponse.body.reason !== 'INSUFFICIENT_BALANCE') throw new Error(`${id}/${scenario}: expected INSUFFICIENT_BALANCE, got ${failedResponse.body.reason || failedResponse.body.error}`);
        const capturedFailure = findCapture(failedPayload.request_id);
        const funded = await deposit(500);
        if (funded.status !== 200) throw new Error(`${id}/${scenario}: legitimate funding failed (${funded.status})`);
        if (scenario === 'S10_fast') await new Promise((resolve) => setTimeout(resolve, 1000));
        else await new Promise((resolve) => setTimeout(resolve, 7000));
        const results = await measureScenario(scenario, WIDTH, async () => Promise.all(Array.from({ length: WIDTH }, () => replay(capturedFailure))));
        recordAttempts(scenario, results);
      }
    }

    const rawHeaders = ['config_id', 'scenario_id', 'variant', 'attempt', 'phase', 'request_id_hash', 'start_ns', 'end_ns', 'duration_ns', 'http_status', 'outcome', 'reason'];
    writeCsv(path.join(runDir, 'requests.csv'), rawHeaders, requestRows);
  } finally {
    const proxyRows = parseCaptures(captureLog).map((entry) => ({ path: entry.request.path, method: entry.request.method, start_ns: entry.start_ns, end_ns: entry.end_ns, duration_ns: entry.duration_ns, http_status: entry.response.statusCode }));
    if (proxyRows.length) writeCsv(path.join(runDir, 'proxy-request-timings.csv'), Object.keys(proxyRows[0]), proxyRows);
    if (ledgerDb) await new Promise((resolve) => ledgerDb.close(() => resolve()));
    await stop(proxy);
    await stop(server);
  }
  return summaries;
}

async function main() {
  fs.mkdirSync(RUN_OUTPUT, { recursive: true });
  const started = new Date().toISOString();
  const allSummaries = [];
  const filter = process.env.E1_SCENARIO_FILTER || '';
  const onlyS11 = filter === 'S11';
  const policySweep = process.env.E1_POLICY_SWEEP === 'true';
  if (policySweep) {
    for (const policy of ['success_only', 'any_outcome']) {
      for (let mask = 8; mask < 16; mask += 1) {
        process.stdout.write(`Policy ${policy}, config mask ${mask}, scenario ${filter}\n`);
        allSummaries.push(...await runConfiguration(mask, { suffix: `-${policy}`, idempotencyPolicy: policy }));
      }
    }
  } else for (let mask = 0; mask < 16; mask += 1) {
    process.stdout.write(`E1 ${mask + 1}/16: defense mask ${mask}\n`);
    allSummaries.push(...await runConfiguration(mask));
  }
  if (!onlyS11 && !policySweep) {
    process.stdout.write('E1 default-window confirmation: S2/60s and S4/301s\n');
    allSummaries.push(...await runConfiguration(15, { suffix: '-DEFAULT', past: 300, future: 5, nonceTtl: 86400, sessionTtl: 900, fullScale: true }));
  }
  const headers = ['config_id', 'scenario_id', 'variant', 'attempts', 'http_accepted_count', 'debited_count', 'attack_success_rate', 'wilson95_low', 'wilson95_high', 'blocking_reason_histogram', 'oracle_total_debited_delta', 'oracle_duplicate_debit_count_delta', 'oracle_duplicate_debit_amount_delta', 'oracle_unauthorized_debit_amount_delta', 'oracle_delayed_execution_count_delta', 'oracle_delayed_execution_amount_delta', 'oracle_integrity_holds'];
  writeCsv(path.join(RUN_OUTPUT, 'summary.csv'), headers, allSummaries);
  const configs = [...new Set(allSummaries.map((r) => r.config_id))];
  const scenarios = [...new Set(allSummaries.filter((r) => r.scenario_id !== 'LEGITIMATE_CONTROL').map((r) => r.scenario_id))];
  const latex = ['\\begin{tabular}{llrrrrl}', '\\toprule', 'Configuration & Scenario & Attempts & Accepted & Debits & Success rate & Wilson 95\\% CI \\\\', '\\midrule', ...allSummaries.filter((r) => r.scenario_id !== 'LEGITIMATE_CONTROL').map((r) => `${r.config_id} & ${r.scenario_id} & ${r.attempts} & ${r.http_accepted_count} & ${r.debited_count} & ${(100 * r.attack_success_rate).toFixed(2)}\\% & ${r.wilson95_low.toFixed(4)}--${r.wilson95_high.toFixed(4)} \\\\`), '\\bottomrule', '\\end{tabular}', ''];
  fs.writeFileSync(path.join(RUN_OUTPUT, 'summary.tex'), latex.join('\n'));
  const runMetadata = { started, ended: new Date().toISOString(), elapsedSeconds: (Date.now() - Date.parse(started)) / 1000, nodeVersion: process.version, host: { platform: os.platform(), release: os.release(), architecture: process.arch, cpuModel: os.cpus()[0]?.model, totalRamBytes: os.totalmem() }, dataRunDirectory: path.relative(OUTPUT, RUN_OUTPUT).replace(/\\/g, '/'), randomSeed: RANDOM_SEED, randomSeedScope: 'deterministic scenario request IDs and nonces; server session credentials use the operating-system CSPRNG', scaledProfile: { timestampPastSeconds: PAST, timestampFutureSeconds: FUTURE, nonceTtlSeconds: NONCE_TTL, sessionTtlSeconds: SESSION_TTL }, defaultConfirmationProfile: { timestampPastSeconds: 300, futureToleranceSeconds: 5, nonceTtlSeconds: 86400, sessionTtlSeconds: 900, waits: { S2: 60, S4: 301 } }, keepAliveHttpAgent: true, proxyRedactLogin: true, moneyOracleLedgerSource: 'direct sqlite3 SELECT from the running server database after each scenario', allConfigs: 16, totalSummaryRows: allSummaries.length, scenarios: scenarios.length, allSummaries };
  fs.writeFileSync(path.join(RUN_OUTPUT, 'run.json'), `${JSON.stringify(runMetadata, null, 2)}\n`);
  fs.copyFileSync(path.join(RUN_OUTPUT, 'summary.csv'), path.join(OUTPUT, 'summary.csv'));
  fs.copyFileSync(path.join(RUN_OUTPUT, 'summary.tex'), path.join(OUTPUT, 'summary.tex'));
  fs.copyFileSync(path.join(RUN_OUTPUT, 'run.json'), path.join(OUTPUT, 'run.json'));
  process.stdout.write(`E1 done: ${allSummaries.length} summary rows, output ${OUTPUT}\n`);
}

main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
