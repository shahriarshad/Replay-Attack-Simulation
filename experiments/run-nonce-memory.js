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
