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
