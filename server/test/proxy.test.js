const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function listen(server) { return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port))); }
function close(server) { return new Promise((resolve) => server.close(resolve)); }

test('proxy forwards login response unchanged but redacts attacker-visible login bodies', async () => {
  const token = 'test-session-token-must-not-be-captured';
  const key = 'test-session-key-must-not-be-captured';
  const upstream = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ sessionToken: token, sessionKey: key })); });
  const upstreamPort = await listen(upstream);
  const proxyPortServer = http.createServer();
  const proxyPort = await listen(proxyPortServer);
  await close(proxyPortServer);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-redact-test-'));
  const capture = path.join(directory, 'capture.json');
  const child = spawn(process.execPath, [path.resolve(__dirname, '../../experiments/recording-proxy.js')], {
    env: { ...process.env, PROXY_UPSTREAM: `http://127.0.0.1:${upstreamPort}`, PROXY_PORT: String(proxyPort), PROXY_CAPTURE_FILE: capture, PROXY_WITHDRAW_CAPTURE_FILE: `${capture}.withdraw.json`, PROXY_REDACT_LOGIN: 'true' },
    stdio: 'ignore'
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try { await fetch(`http://127.0.0.1:${proxyPort}/api/health`); ready = true; break; } catch { await new Promise((resolve) => setTimeout(resolve, 50)); }
    }
    assert.equal(ready, true, 'proxy process should start');
    const response = await fetch(`http://127.0.0.1:${proxyPort}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"user_id":"u","pin":"1234"}' });
    const body = await response.json();
    assert.deepEqual(body, { sessionToken: token, sessionKey: key });
    const captureRecord = JSON.parse(fs.readFileSync(capture, 'utf8'));
    assert.equal(captureRecord.response.body, '<REDACTED LOGIN RESPONSE>');
    assert.equal(captureRecord.request.body, '<REDACTED LOGIN REQUEST>');
    assert.equal(JSON.stringify(captureRecord).includes(token), false);
    assert.equal(JSON.stringify(captureRecord).includes(key), false);
  } finally {
    child.kill();
    await close(upstream);
  }
});
