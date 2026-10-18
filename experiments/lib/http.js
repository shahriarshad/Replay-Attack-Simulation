const http = require('http');
const https = require('https');
const agents = { 'http:': new http.Agent({ keepAlive: true }), 'https:': new https.Agent({ keepAlive: true }) };

function timedRequest(input, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(input);
    const start = process.hrtime.bigint();
    const request = (url.protocol === 'https:' ? https : http).request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      agent: agents[url.protocol]
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const end = process.hrtime.bigint();
        const text = Buffer.concat(chunks).toString('utf8');
        let body;
        try { body = JSON.parse(text); } catch { body = text; }
        resolve({ start_ns: start.toString(), end_ns: end.toString(), duration_ns: (end - start).toString(), status: response.statusCode, headers: response.headers, body });
      });
    });
    request.on('error', (error) => {
      const end = process.hrtime.bigint();
      error.start_ns = start.toString();
      error.end_ns = end.toString();
      error.duration_ns = (end - start).toString();
      reject(error);
    });
    if (options.body !== undefined) request.write(options.body);
    request.end();
  });
}

module.exports = { timedRequest, keepAlive: true, agents };
