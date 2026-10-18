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
const OUTPUT = path.join(ROOT, 'experiments/results/e2');
const RUN_TAG = new Date().toISOString().replace(/[:.]/g, '-');
const RUN_OUTPUT = process.env.E2_RESUME_FROM ? path.resolve(process.env.E2_RESUME_FROM) : path.join(OUTPUT, RUN_TAG);
const PIN = process.env.DEMO_PIN || '1234';
const WARMUP = 500;
const MEASURED = 5000;
const REPEATS = 5;
const RANDOM_SEED = 'e2-fixed-seed-2026-v1';
let deterministicSequence = 0;
const deterministicId = (scope) => crypto.createHash('sha256').update(`${RANDOM_SEED}|${scope}|${deterministicSequence++}`).digest('hex').slice(0, 32);
const STACKS = [
  { id: 'none', flags: [false, false, false, false] },
  { id: 'hmac', flags: [true, false, false, false] },
  { id: 'hmac_ts', flags: [true, true, false, false] },
  { id: 'hmac_ts_nonce', flags: [true, true, true, false] },
  { id: 'all_four', flags: [true, true, true, true] },
  { id: 'nonce_redis', flags: [true, true, true, true], backend: 'redis' },
  { id: 'nonce_sqlite', flags: [true, true, true, true], backend: 'sqlite' },
  { id: 'nonce_memory', flags: [true, true, true, true], backend: 'memory' }
];
const ORDERS = [
  { id: 'default', value: 'hmac,timestamp,nonce,request_id,balance' },
  { id: 'timestamp_first', value: 'timestampfirst' },
  { id: 'request_id_before_nonce', value: 'requestidbeforenonce' }
];
const FLOODS = ['bad_signature', 'stale_timestamp', 'duplicate_nonce', 'duplicate_request_id'];

fs.mkdirSync(OUTPUT, { recursive: true });
const csv = (value) => { const s = value === undefined || value === null ? '' : String(value); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const writeCsv = (file, headers, rows) => fs.writeFileSync(file, `${[headers.join(','), ...rows.map((row) => headers.map((key) => csv(row[key])).join(','))].join('\n')}\n`);
function parseCsvRows(file) {
  const lines = fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/);
  const parseLine = (line) => {
    const values = []; let value = ''; let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (quoted && char === '"' && line[index + 1] === '"') { value += '"'; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { values.push(value); value = ''; }
      else value += char;
    }
    values.push(value); return values;
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).filter(Boolean).map((line) => Object.fromEntries(headers.map((key, index) => [key, parseLine(line)[index] ?? ''])));
}
function percentile(values, pct) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * pct;
  const lower = Math.floor(position); const upper = Math.ceil(position);
  return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}
function mean(values) { return values.reduce((a, b) => a + b, 0) / values.length; }
function ci95(values) {
  const avg = mean(values);
  const sd = Math.sqrt(values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1));
  const half = 2.776 * sd / Math.sqrt(values.length);
  return [avg - half, avg + half];
}
function parseCsvLine(line) { return line.split(','); }
function spawnLogged(args, env, cwd, stdout, stderr) {
  const out = fs.openSync(stdout, 'a'); const err = fs.openSync(stderr, 'a');
  const child = spawn(process.execPath, args, { cwd, env, stdio: ['ignore', out, err], windowsHide: true });
  child.once('exit', () => { try { fs.closeSync(out); } catch {} try { fs.closeSync(err); } catch {} });
  return child;
}
async function waitHealth(port, child, log) {
  const deadline = Date.now() + 30000;
  const rows = [];
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited; inspect ${log}`);
    try {
      const response = await timedRequest(`http://127.0.0.1:${port}/api/health`);
      rows.push({ start_ns: response.start_ns, end_ns: response.end_ns, duration_ns: response.duration_ns, http_status: response.status, outcome: response.status === 200 ? 'READY' : 'NOT_READY' });
      if (response.status === 200) { writeCsv(path.join(path.dirname(log), 'health-readiness.csv'), Object.keys(rows[0]), rows); return; }
    } catch (error) { rows.push({ start_ns: error.start_ns, end_ns: error.end_ns, duration_ns: error.duration_ns, http_status: '', outcome: 'CONNECT_ERROR' }); }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (rows.length) writeCsv(path.join(path.dirname(log), 'health-readiness.csv'), Object.keys(rows[0]), rows);
  throw new Error(`Health timed out: ${log}`);
}
async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([new Promise((resolve) => child.once('exit', resolve)), new Promise((resolve) => setTimeout(resolve, 3000))]);
  if (child.exitCode === null && child.pid) spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
}

async function startCell(stack, order, runId, backend = stack.backend || 'redis', scenario = 'legitimate') {
  const port = 3300; const vizPort = 3301;
  const id = [stack.id, backend === (stack.backend || 'redis') ? '' : backend, order || '', runId].filter(Boolean).join('-');
  const dir = path.join(RUN_OUTPUT, id); fs.mkdirSync(dir, { recursive: true });
  const experimentLog = path.join(dir, 'layer-timings.csv');
  const experimentHeaders = ['config_id', 'scenario_id', 'run_id', 'started_ns', 'ended_ns', 'duration_ns', 'hmac_ns', 'timestamp_ns', 'nonce_ns', 'request_id_ns', 'balance_ns', 'outcome', 'http_status'];
  if (!fs.existsSync(experimentLog)) writeCsv(experimentLog, experimentHeaders, []);
  const env = {
    ...process.env, PORT: String(port), HOST: '127.0.0.1', VIZ_PORT: String(vizPort),
    VIZ_ENABLED: 'false', DEMO_MODE: 'false', LEGACY_SHARED_SECRET: 'false', ENABLE_DEMO_ROUTES: 'true',
    NONCE_STORE: backend, NONCE_TTL: '3600', NONCE_KEY_NAMESPACE: `e2-${id}-${process.pid}`,
    REDIS_URL: 'redis://127.0.0.1:6379',
    SQLITE_DB: path.join(RUN_OUTPUT, `${id}.sqlite`), TIMESTAMP_PAST_WINDOW_SECONDS: '300', TIMESTAMP_FUTURE_WINDOW_SECONDS: '5', SESSION_TTL: '3600',
    DEFENSE_HMAC: String(stack.flags[0]), DEFENSE_TIMESTAMP: String(stack.flags[1]), DEFENSE_NONCE: String(stack.flags[2]), DEFENSE_REQUEST_ID: String(stack.flags[3]),
    CHECK_ORDER: order || ORDERS[0].value, EXPERIMENT_LOG: experimentLog, CONFIG_ID: stack.id, SCENARIO_ID: scenario, RUN_ID: runId
  };
  const child = spawnLogged(['server.js'], env, SERVER, path.join(dir, 'server.stdout.log'), path.join(dir, 'server.stderr.log'));
  await waitHealth(port, child, path.join(dir, 'server.stderr.log'));
  const login = await timedRequest(`http://127.0.0.1:${port}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user_id: 'anis_101', pin: PIN }) });
  if (login.status !== 200) { await stop(child); throw new Error(`Login failed ${login.status} in ${dir}`); }
  writeCsv(path.join(dir, 'session-setup.csv'), ['request', 'start_ns', 'end_ns', 'duration_ns', 'http_status', 'outcome'], [{ request: 'login', start_ns: login.start_ns, end_ns: login.end_ns, duration_ns: login.duration_ns, http_status: login.status, outcome: 'SESSION_READY' }]);
  return { child, port, dir, experimentLog, session: login.body, id };
}

function withdrawPayload(session, index, extra = {}) {
  const payload = { method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777', amount: 1, currency: 'BDT', timestamp: new Date().toISOString(), nonce: `e2-n-${deterministicId(index)}`, request_id: `e2-r-${deterministicId(index)}`, ...extra };
  payload.signature = generateSignature(payload, session.sessionKey);
  return payload;
}
async function sendWithdrawal(cell, index) {
  const payload = withdrawPayload(cell.session, index);
  const response = await timedRequest(`http://127.0.0.1:${cell.port}/api/withdraw`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${cell.session.sessionToken}` }, body: JSON.stringify(payload) });
  return { response, intent: { request_id: payload.request_id, amount: payload.amount, type: 'WITHDRAW' } };
}
async function runLoadCell(stack, concurrency, repeat) {
  const runId = `r${repeat}-c${concurrency}`;
  const cell = await startCell(stack, null, runId);
  const rawRows = [];
  const warmupRows = [];
  const authorizedIntents = [];
  try {
    for (let i = 0; i < WARMUP; i += concurrency) {
      const batch = await Promise.all(Array.from({ length: Math.min(concurrency, WARMUP - i) }, (_, j) => sendWithdrawal(cell, `warm-${i + j}`)));
      batch.forEach(({ response }, index) => warmupRows.push({ index: i + index + 1, start_ns: response.start_ns, end_ns: response.end_ns, duration_ns: response.duration_ns, http_status: response.status, outcome: response.body.status || response.body.reason || response.body.error || '' }));
      if (batch.some((item) => item.response.status !== 200 || item.response.body.status !== 'ACCEPTED')) throw new Error(`${stack.id}/${runId} rejected a warm-up withdrawal`);
      authorizedIntents.push(...batch.map((item) => item.intent));
    }
    const start = process.hrtime.bigint();
    for (let i = 0; i < MEASURED; i += concurrency) {
      const count = Math.min(concurrency, MEASURED - i);
      const batch = await Promise.all(Array.from({ length: count }, (_, j) => sendWithdrawal(cell, `measured-${i + j}`)));
      batch.forEach(({ response }, j) => rawRows.push({ index: i + j + 1, start_ns: response.start_ns, end_ns: response.end_ns, duration_ns: response.duration_ns, http_status: response.status, outcome: response.body.status || response.body.reason || response.body.error || '' }));
      if (batch.some(({ response }) => response.status !== 200 || response.body.status !== 'ACCEPTED')) throw new Error(`${stack.id}/${runId} had rejected legitimate request`);
      authorizedIntents.push(...batch.map((item) => item.intent));
    }
    const end = process.hrtime.bigint();
    const endToEnd = rawRows.map((row) => Number(row.duration_ns) / 1e6);
    const elapsedSeconds = Number(end - start) / 1e9;
    writeCsv(path.join(cell.dir, 'requests.csv'), ['index', 'start_ns', 'end_ns', 'duration_ns', 'http_status', 'outcome'], rawRows);
    writeCsv(path.join(cell.dir, 'warmup-requests.csv'), ['index', 'start_ns', 'end_ns', 'duration_ns', 'http_status', 'outcome'], warmupRows);
    const timingLines = fs.readFileSync(cell.experimentLog, 'utf8').trim().split(/\r?\n/).slice(1 + WARMUP);
    const timingHeader = ['config_id', 'scenario_id', 'run_id', 'started_ns', 'ended_ns', 'duration_ns', 'hmac_ns', 'timestamp_ns', 'nonce_ns', 'request_id_ns', 'balance_ns', 'outcome', 'http_status'];
    const layers = ['hmac_ns', 'timestamp_ns', 'nonce_ns', 'request_id_ns', 'balance_ns'];
    const layerStats = [];
    for (const layer of layers) {
      const values = timingLines.map((line) => parseCsvLine(line)[timingHeader.indexOf(layer)]).filter((value) => value && /^\d+$/.test(value)).map(Number);
      const statusIndex = timingHeader.indexOf(layer);
      const statuses = timingLines.map((line) => parseCsvLine(line)[statusIndex]);
      layerStats.push({ stack_id: stack.id, backend: stack.backend || 'redis', concurrency, repeat, layer: layer.replace('_ns', ''), numeric_samples: values.length, disabled_count: statuses.filter((value) => value === 'disabled').length, not_reached_count: statuses.filter((value) => value === 'not_reached').length, p50_ns: percentile(values, 0.5), p95_ns: percentile(values, 0.95), p99_ns: percentile(values, 0.99) });
    }
    const layerPath = path.join(cell.dir, 'layer-summary.csv');
    writeCsv(layerPath, Object.keys(layerStats[0]), layerStats);
    const ledgerDb = new sqlite3.Database(path.join(RUN_OUTPUT, `${cell.id}.sqlite`));
    await new Promise((resolve, reject) => ledgerDb.once('open', resolve).once('error', reject));
    let ledgerRows;
    try { ledgerRows = await new Promise((resolve, reject) => ledgerDb.all('SELECT request_id,type,status,amount FROM transactions ORDER BY id', [], (error, rows) => error ? reject(error) : resolve(rows))); }
    finally { await new Promise((resolve) => ledgerDb.close(() => resolve())); }
    const oracle = computeMoneyIntegrity(ledgerRows, authorizedIntents);
    if (!oracle.integrity_holds || oracle.total_debited !== WARMUP + MEASURED) throw new Error(`${stack.id}/${runId}: money-integrity oracle failed (${JSON.stringify(oracle)})`);
    const report = { stack_id: stack.id, backend: stack.backend || 'redis', concurrency, repeat, warmup_requests: WARMUP, measured_requests: MEASURED, p50_ms: percentile(endToEnd, 0.5), p95_ms: percentile(endToEnd, 0.95), p99_ms: percentile(endToEnd, 0.99), throughput_requests_per_second: MEASURED / elapsedSeconds, elapsed_seconds: elapsedSeconds, end_to_end_median_ms: percentile(endToEnd, 0.5), money_oracle_total_debited: oracle.total_debited, money_oracle_duplicate_debit_count: oracle.duplicate_debit_count, money_oracle_unauthorized_debit_amount: oracle.unauthorized_debit_amount, money_oracle_integrity_holds: oracle.integrity_holds, layer_stats_path: path.relative(ROOT, layerPath).replace(/\\/g, '/') };
    return { report, layerStats };
  } finally { await stop(cell.child); }
}

function attackPayload(session, props = {}) {
  const payload = { method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777', amount: 1, currency: 'BDT', timestamp: new Date().toISOString(), nonce: `flood-n-${deterministicId('flood')}`, request_id: `flood-r-${deterministicId('flood')}`, ...props };
  payload.signature = generateSignature(payload, session.sessionKey);
  return payload;
}
async function runFlood(order, flood) {
  const stack = { id: 'all_four', flags: [true, true, true, true] };
  const cell = await startCell(stack, order.value, `flood-${flood}`, 'redis', `flood-${flood}`);
  const rows = [];
  const seedRows = [];
  const send = async (payload) => timedRequest(`http://127.0.0.1:${cell.port}/api/withdraw`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${cell.session.sessionToken}` }, body: JSON.stringify(payload) });
  try {
    let repeated;
    if (flood === 'duplicate_nonce') {
      const seed = attackPayload(cell.session, { nonce: 'flood-fixed-nonce' });
      const seedResponse = await send(seed);
      if (seedResponse.body.status !== 'ACCEPTED') throw new Error('duplicate nonce seed failed');
      seedRows.push({ check_order: order.id, flood, attempt: 0, phase: 'legitimate_seed', start_ns: seedResponse.start_ns, end_ns: seedResponse.end_ns, duration_ns: seedResponse.duration_ns, http_status: seedResponse.status, outcome: seedResponse.body.status, reason: '' });
      repeated = () => attackPayload(cell.session, { nonce: 'flood-fixed-nonce' });
    } else if (flood === 'duplicate_request_id') {
      const requestId = 'flood-fixed-request-id';
      const seed = attackPayload(cell.session, { request_id: requestId });
      const seedResponse = await send(seed);
      if (seedResponse.body.status !== 'ACCEPTED') throw new Error('duplicate request ID seed failed');
      seedRows.push({ check_order: order.id, flood, attempt: 0, phase: 'legitimate_seed', start_ns: seedResponse.start_ns, end_ns: seedResponse.end_ns, duration_ns: seedResponse.duration_ns, http_status: seedResponse.status, outcome: seedResponse.body.status, reason: '' });
      repeated = () => attackPayload(cell.session, { request_id: requestId });
    } else if (flood === 'stale_timestamp') repeated = () => attackPayload(cell.session, { timestamp: new Date(Date.now() - 600000).toISOString() });
    else repeated = () => { const payload = attackPayload(cell.session); payload.signature = '0'.repeat(64); return payload; };
    const beforeLines = fs.readFileSync(cell.experimentLog, 'utf8').trim().split(/\r?\n/).length;
    for (let start = 0; start < 1000; start += 16) {
      const responses = await Promise.all(Array.from({ length: Math.min(16, 1000 - start) }, (_, j) => send(repeated())));
      responses.forEach((response, j) => rows.push({ check_order: order.id, flood, attempt: start + j + 1, phase: 'attacker', start_ns: response.start_ns, end_ns: response.end_ns, duration_ns: response.duration_ns, http_status: response.status, outcome: response.body.status || '', reason: response.body.reason || response.body.error || '' }));
    }
    const lines = fs.readFileSync(cell.experimentLog, 'utf8').trim().split(/\r?\n/);
    const headers = lines[0].split(',');
    const logRows = lines.slice(beforeLines).map((line) => {
      const values = parseCsvLine(line); const row = {};
      headers.forEach((key, index) => { row[key] = values[index]; }); return row;
    });
    const rejects = rows.filter((row) => row.http_status !== 200 || row.outcome !== 'ACCEPTED').length;
    writeCsv(path.join(cell.dir, 'requests.csv'), Object.keys(rows[0]), [...seedRows, ...rows]);
    writeCsv(path.join(cell.dir, 'layer-timings-rejected.csv'), headers, logRows);
    return { check_order: order.id, flood, attempts: 1000, rejected_count: rejects, accepted_count: 1000 - rejects, mean_duration_ms: mean(rows.map((r) => Number(r.duration_ns) / 1e6)), p50_ms: percentile(rows.map((r) => Number(r.duration_ns) / 1e6), .5), p95_ms: percentile(rows.map((r) => Number(r.duration_ns) / 1e6), .95), p99_ms: percentile(rows.map((r) => Number(r.duration_ns) / 1e6), .99), raw_path: path.relative(ROOT, path.join(cell.dir, 'requests.csv')).replace(/\\/g, '/') };
  } finally { await stop(cell.child); }
}

async function resumeLoadCells() {
  const cellRows = []; const layerRows = [];
  for (const stack of STACKS) for (const concurrency of [1, 16]) for (let repeat = 1; repeat <= REPEATS; repeat += 1) {
    const runId = `r${repeat}-c${concurrency}`;
    const id = [stack.id, '', '', runId].filter(Boolean).join('-');
    const directory = path.join(RUN_OUTPUT, id);
    const requests = parseCsvRows(path.join(directory, 'requests.csv'));
    const layers = parseCsvRows(path.join(directory, 'layer-summary.csv'));
    if (requests.length !== MEASURED) throw new Error(`Cannot resume: ${id} has ${requests.length} measured requests`);
    const durations = requests.map((row) => Number(row.duration_ns) / 1e6);
    const starts = requests.map((row) => BigInt(row.start_ns));
    const ends = requests.map((row) => BigInt(row.end_ns));
    const elapsedSeconds = Number((ends.reduce((max, value) => value > max ? value : max, ends[0]) - starts.reduce((min, value) => value < min ? value : min, starts[0]))) / 1e9;
    const databasePath = path.join(RUN_OUTPUT, `${id}.sqlite`);
    const ledgerDb = new sqlite3.Database(databasePath);
    await new Promise((resolve, reject) => ledgerDb.once('open', resolve).once('error', reject));
    let ledgerRows;
    try { ledgerRows = await new Promise((resolve, reject) => ledgerDb.all('SELECT request_id,type,status,amount FROM transactions ORDER BY id', [], (error, rows) => error ? reject(error) : resolve(rows))); }
    finally { await new Promise((resolve) => ledgerDb.close(() => resolve())); }
    const authorizedIntents = ledgerRows.filter((row) => row.status === 'SUCCESS').map((row) => ({ request_id: row.request_id, amount: row.amount, type: row.type }));
    const oracle = computeMoneyIntegrity(ledgerRows, authorizedIntents);
    if (!oracle.integrity_holds || oracle.total_debited !== WARMUP + MEASURED) throw new Error(`${id}: resumed money-integrity oracle failed (${JSON.stringify(oracle)})`);
    const report = { stack_id: stack.id, backend: stack.backend || 'redis', concurrency, repeat, warmup_requests: WARMUP, measured_requests: MEASURED, p50_ms: percentile(durations, .5), p95_ms: percentile(durations, .95), p99_ms: percentile(durations, .99), throughput_requests_per_second: MEASURED / elapsedSeconds, elapsed_seconds: elapsedSeconds, end_to_end_median_ms: percentile(durations, .5), money_oracle_total_debited: oracle.total_debited, money_oracle_duplicate_debit_count: oracle.duplicate_debit_count, money_oracle_unauthorized_debit_amount: oracle.unauthorized_debit_amount, money_oracle_integrity_holds: oracle.integrity_holds, layer_stats_path: path.relative(ROOT, path.join(directory, 'layer-summary.csv')).replace(/\\/g, '/') };
    cellRows.push(report);
    layerRows.push(...layers.map((row) => ({ ...row, concurrency: Number(row.concurrency), repeat: Number(row.repeat), numeric_samples: Number(row.numeric_samples), disabled_count: Number(row.disabled_count), not_reached_count: Number(row.not_reached_count), p50_ns: row.p50_ns === '' ? '' : Number(row.p50_ns), p95_ns: row.p95_ns === '' ? '' : Number(row.p95_ns), p99_ns: row.p99_ns === '' ? '' : Number(row.p99_ns) })));
  }
  return { cellRows, layerRows };
}

async function main() {
  fs.mkdirSync(RUN_OUTPUT, { recursive: true });
  const originalRunStart = process.env.E2_RESUME_FROM ? new Date(fs.statSync(RUN_OUTPUT).birthtimeMs).toISOString() : new Date().toISOString();
  const started = new Date().toISOString();
  const cellRows = []; const layerRows = [];
  if (process.env.E2_RESUME_FROM) {
    process.stdout.write(`E2 resuming rejection floods from ${RUN_OUTPUT}; reusing completed load raw data and revalidating SQLite ledgers\n`);
    const resumed = await resumeLoadCells(); cellRows.push(...resumed.cellRows); layerRows.push(...resumed.layerRows);
  } else {
    for (const stack of STACKS) for (const concurrency of [1, 16]) for (let repeat = 1; repeat <= REPEATS; repeat += 1) {
      process.stdout.write(`E2 load ${stack.id} concurrency=${concurrency} repeat=${repeat}/${REPEATS}\n`);
      const result = await runLoadCell(stack, concurrency, repeat);
      cellRows.push(result.report); layerRows.push(...result.layerStats);
    }
  }
  const rejectionRows = [];
  for (const order of ORDERS) for (const flood of FLOODS) {
    process.stdout.write(`E2 rejection ${order.id} / ${flood}\n`);
    rejectionRows.push(await runFlood(order, flood));
  }
  const grouped = new Map();
  for (const row of cellRows) {
    const key = `${row.stack_id}|${row.concurrency}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row.end_to_end_median_ms);
  }
  const repeatSummary = [];
  for (const [key, medians] of grouped) {
    const [stack_id, concurrency] = key.split('|'); const [low, high] = ci95(medians);
    repeatSummary.push({ stack_id, concurrency: Number(concurrency), repetitions: medians.length, mean_repeat_median_ms: mean(medians), ci95_low_ms: low, ci95_high_ms: high });
  }
  const reports = [
    ['load-repeats.csv', Object.keys(cellRows[0]), cellRows],
    ['load-repeat-summary.csv', Object.keys(repeatSummary[0]), repeatSummary],
    ['layer-timing-summary.csv', Object.keys(layerRows[0]), layerRows],
    ['rejection-cost.csv', Object.keys(rejectionRows[0]), rejectionRows]
  ];
  for (const [name, headers, rows] of reports) writeCsv(path.join(RUN_OUTPUT, name), headers, rows);
  const ended = new Date().toISOString();
  const runMetadata = { started: process.env.E2_RESUME_FROM ? originalRunStart : started, loadStarted: process.env.E2_RESUME_FROM ? originalRunStart : started, resumedRejectionStarted: process.env.E2_RESUME_FROM ? started : null, ended, elapsedSeconds: (Date.parse(ended) - Date.parse(process.env.E2_RESUME_FROM ? originalRunStart : started)) / 1000, resumedExistingLoadData: Boolean(process.env.E2_RESUME_FROM), nodeVersion: process.version, host: { platform: os.platform(), release: os.release(), architecture: process.arch, cpuModel: os.cpus()[0]?.model, totalRamBytes: os.totalmem() }, dataRunDirectory: path.relative(OUTPUT, RUN_OUTPUT).replace(/\\/g, '/'), randomSeed: RANDOM_SEED, randomSeedScope: 'deterministic request IDs and nonces; server session credentials use the operating-system CSPRNG', warmupRequests: WARMUP, measuredRequests: MEASURED, repeats: REPEATS, concurrency: [1, 16], keepAliveHttpAgent: true, vizEnabled: false, demoMode: false, legacySharedSecret: false, redisUrl: 'redis://127.0.0.1:6379', memuraiVersion: '4.2.3', nonceBackends: ['redis', 'sqlite', 'memory'], moneyOracleLedgerSource: 'direct sqlite3 SELECT from each server database', rejectionFloodsPerLayerOrder: 1000, loadCells: cellRows, repeatSummary, layerTimingSummary: layerRows, rejectionCost: rejectionRows };
  fs.writeFileSync(path.join(RUN_OUTPUT, 'run.json'), `${JSON.stringify(runMetadata, null, 2)}\n`);
  fs.copyFileSync(path.join(RUN_OUTPUT, 'run.json'), path.join(OUTPUT, 'run.json'));
  for (const [name] of reports) fs.copyFileSync(path.join(RUN_OUTPUT, name), path.join(OUTPUT, name));
  process.stdout.write(`E2 done: ${cellRows.length} load cells, ${rejectionRows.length} rejection cells, output ${OUTPUT}\n`);
}

main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
