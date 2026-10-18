const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { io } = require('../client/bank/node_modules/socket.io-client');
const { createClient } = require('../server/node_modules/redis');
require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const crypto = require('crypto');
const outputDir = path.join(__dirname, 'results', 'preparation');
fs.mkdirSync(outputDir, { recursive: true });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function request(url, options = {}) {
  const response = await fetch(url, options);
  return { status: response.status, body: await response.json() };
}
async function main() {
  const results = [];
  for (const viz of [false, true]) for (const demo of [false, true]) {
    const name = `viz-${viz}-demo-${demo}`;
    const logPath = path.join(outputDir, `egress-${name}.csv`);
    const outPath = path.join(outputDir, `egress-${name}.stdout.log`);
    const errPath = path.join(outputDir, `egress-${name}.stderr.log`);
    const namespace = `egress-${name}`;
    const env = { ...process.env, PORT: '3000', HOST: '127.0.0.1', VIZ_PORT: '3001', VIZ_ENABLED: String(viz), DEMO_MODE: String(demo), LEGACY_SHARED_SECRET: 'true', REDIS_URL: 'redis://127.0.0.1:6379', NONCE_STORE: 'redis', NONCE_TTL: '300', NONCE_KEY_NAMESPACE: namespace, SQLITE_DB: path.join(outputDir, `${name}.db`), EXPERIMENT_LOG: logPath, CONFIG_ID: name, SCENARIO_ID: 'egress-audit', RUN_ID: name };
    const child = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '../server'), env, windowsHide: true, stdio: ['ignore', fs.openSync(outPath, 'w'), fs.openSync(errPath, 'w')] });
    const base = 'http://127.0.0.1:3000';
    let socket;
    try {
      let healthy = false;
      for (let i = 0; i < 60; i++) { try { await fetch(`${base}/api/health`); healthy = true; break; } catch { await wait(500); } }
      if (!healthy) throw new Error(`${name}: server did not become healthy`);
      socket = io('http://127.0.0.1:3001', { transports: ['websocket'], timeout: 5000 });
      await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); setTimeout(() => reject(new Error('socket timeout')), 5000); });
      const events = [];
      for (const eventName of ['check-signature','db-update','transaction-result','request-received','check-nonce','check-requestid','check-balance']) socket.on(eventName, (data) => {
        if (eventName === 'request-received' && data.type === 'CONNECTED') return;
        events.push({ eventName, data });
      });
      const wrongPins = [];
      for (let i = 0; i < 5; i++) wrongPins.push(await request(`${base}/api/login`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({user_id:'anis_101',pin:'incorrect-demo-pin'}) }));
      const login = await request(`${base}/api/login`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({user_id:'anis_101',pin:process.env.DEMO_PIN || '1234'}) });
      if (login.status !== 200) throw new Error(`${name}: login status ${login.status}`);
      const { sessionToken, sessionKey } = login.body;
      const payload = { method:'POST',path:'/api/withdraw',user_id:'anis_101',account_id:'acc_777',amount:1,currency:'BDT',timestamp:new Date().toISOString(),nonce:`egress-${crypto.randomUUID()}`,request_id:`egress-${crypto.randomUUID()}` };
      const canonical = [payload.method,payload.path,payload.user_id,payload.account_id,payload.amount,payload.currency,payload.timestamp,payload.nonce,payload.request_id].join('|');
      payload.signature = crypto.createHmac('sha256', sessionKey).update(canonical).digest('hex');
      const tx = await request(`${base}/api/withdraw`, { method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${sessionToken}`},body:JSON.stringify(payload) });
      if (tx.body.status !== 'ACCEPTED') throw new Error(`${name}: transaction rejected ${tx.body.reason}`);
      await wait(300);
      const redis = createClient({url:'redis://127.0.0.1:6379'});
      await redis.connect();
      const sessionTtlSeconds = await redis.ttl(`session:${sessionToken}`);
      const nonceTtlSeconds = await redis.ttl(`used_nonce:${namespace}:anis_101:${payload.nonce}`);
      await redis.quit();
      const rawEvents = JSON.stringify(events);
      const stdout = fs.readFileSync(outPath, 'utf8');
      const stderr = fs.readFileSync(errPath, 'utf8');
      const csv = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';
      const indicators = [sessionKey, sessionToken, payload.signature];
      results.push({ config:name, vizEnabled:viz, demoMode:demo, eventsReceived:events.map((x)=>x.eventName), socketSensitiveValuesFound: indicators.map((value)=>rawEvents.includes(value)), consoleSensitiveValuesFound: indicators.map((value)=>(stdout+stderr).includes(value)), experimentCsvSensitiveValuesFound: indicators.map((value)=>csv.includes(value)), transactionHttpStatus:tx.status, wrongPinStatuses:wrongPins.map((x)=>x.status), correctPinAfterFailuresStatus:login.status, sessionKeyLayout:'session:<sessionToken>', sessionTtlSeconds, nonceKeyLayout:'used_nonce:<namespace>:<user_id>:<nonce>', nonceTtlSeconds });
    } finally {
      if (socket) socket.close();
      child.kill();
      await new Promise((resolve)=>{ if(child.exitCode!==null) resolve(); else { child.once('exit',resolve); setTimeout(resolve,1500); } });
    }
  }
  const out = path.join(outputDir, 'egress-audit-matrix.json');
  fs.writeFileSync(out, JSON.stringify(results,null,2)+'\n');
  process.stdout.write(JSON.stringify({ output:out, results },null,2)+'\n');
}
main().catch((error)=>{ process.stderr.write(`${error.stack||error.message}\n`); process.exitCode=1; });

