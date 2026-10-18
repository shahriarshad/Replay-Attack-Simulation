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
  const login = await call('/api/login', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({user_id:'anis_101',pin:process.env.DEMO_PIN || '1234'}) });
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
