const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const upstream = new URL(process.env.PROXY_UPSTREAM || 'http://127.0.0.1:3000');
if (!['127.0.0.1', 'localhost'].includes(upstream.hostname)) throw new Error('Recording proxy only permits a localhost upstream');
const port = Number(process.env.PROXY_PORT || 3002);
const outputPath = process.env.PROXY_CAPTURE_FILE || path.join(os.tmpdir(), 'cs-project-onpath-capture.json');
const captureLogPath = `${outputPath}.jsonl`;
const withdrawalCapturePath = process.env.PROXY_WITHDRAW_CAPTURE_FILE || `${outputPath}.withdraw.json`;
const redactLogin = /^(1|true|yes|on)$/i.test(process.env.PROXY_REDACT_LOGIN || 'false');

const server = http.createServer((request, response) => {
  const started = process.hrtime.bigint();
  const chunks = [];
  request.on('data', (chunk) => chunks.push(chunk));
  request.on('end', () => {
    const bodyBuffer = Buffer.concat(chunks);
    const headers = { ...request.headers };
    delete headers.host;
    delete headers['content-length'];
    const proxyRequest = http.request({
      hostname: upstream.hostname,
      port: Number(upstream.port || 80),
      method: request.method,
      path: request.url,
      headers: { ...headers, 'content-length': bodyBuffer.length }
    }, (upstreamResponse) => {
      const responseChunks = [];
      upstreamResponse.on('data', (chunk) => responseChunks.push(chunk));
      upstreamResponse.on('end', () => {
        const responseBody = Buffer.concat(responseChunks);
        const ended = process.hrtime.bigint();
        const isLogin = request.method === 'POST' && new URL(request.url, upstream).pathname === '/api/login';
        const redact = redactLogin && isLogin;
        const record = {
          capturedAt: new Date().toISOString(),
          start_ns: started.toString(),
          end_ns: ended.toString(),
          duration_ns: (ended - started).toString(),
          request: {
            method: request.method,
            path: request.url,
            headers: request.headers,
            body: redact ? '<REDACTED LOGIN REQUEST>' : bodyBuffer.toString('utf8')
          },
          response: { statusCode: upstreamResponse.statusCode, body: redact ? '<REDACTED LOGIN RESPONSE>' : responseBody.toString('utf8') }
        };
        fs.appendFileSync(captureLogPath, `${JSON.stringify(record)}\n`, { mode: 0o600 });
        const tempPath = `${outputPath}.${process.pid}.tmp`;
        fs.writeFileSync(tempPath, `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
        fs.renameSync(tempPath, outputPath);
        if (request.method === 'POST' && new URL(request.url, upstream).pathname === '/api/withdraw') {
          const withdrawalTempPath = `${withdrawalCapturePath}.${process.pid}.tmp`;
          fs.writeFileSync(withdrawalTempPath, `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
          fs.renameSync(withdrawalTempPath, withdrawalCapturePath);
        }
        response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
        response.end(responseBody);
      });
    });
    proxyRequest.on('error', (error) => {
      response.writeHead(502, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'UPSTREAM_UNAVAILABLE', message: error.message }));
    });
    proxyRequest.end(bodyBuffer);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Recording proxy listening on http://127.0.0.1:${port}; capture file: ${outputPath}`);
});

function shutdown() { server.close(() => process.exit(0)); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
