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
