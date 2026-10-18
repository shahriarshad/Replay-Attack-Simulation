const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { generateSignature } = require('../../server/utils/hmac');
const { isTimestampWithinWindow } = require('../../server/utils/timestamp');
const { timedRequest } = require('../lib/http');

const ROOT = path.resolve(__dirname, '../..');
require('../../server/node_modules/dotenv').config({ path: path.join(ROOT, 'server/.env') });
const OUT = path.resolve(process.env.E3_OUTPUT_DIR || path.join(ROOT, 'experiments/results/e3-v2'));
const PASTS = [5, 30, 60, 120, 300];
const FUTURES = [0, 2, 5, 30, 60];
const PROFILE = [
  { id: 'P1', offsetMean: 0, offsetSigma: 0.5, delayMedian: 0.2, delaySigma: 0.6 },
  { id: 'P2', offsetMean: 0, offsetSigma: 3, delayMedian: 0.5, delaySigma: 1 },
  { id: 'P3', offsetMean: 0, offsetSigma: 30, delayMedian: 2, delaySigma: 1.2 }
];
const N = 2000;
const SEED = 0xE3202610;
let rng = SEED >>> 0;
function random() { rng = (1664525 * rng + 1013904223) >>> 0; return (rng + 0.5) / 4294967296; }
function normal() { const u = random(), v = random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function sample(profile) { const offset = profile.offsetMean + profile.offsetSigma * normal(); const delay = profile.delayMedian * Math.exp(profile.delaySigma * normal()); return { offset, delay }; }
function csv(value) { const text = value == null ? '' : String(value); return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function writeCsv(file, headers, rows) { fs.writeFileSync(file, `${[headers.join(','), ...rows.map((r) => headers.map((h) => csv(r[h])).join(','))].join('\n')}\n`); }
function wilson(k, n) { const z = 1.959963984540054, p = k / n, d = 1 + z*z/n, c = (p + z*z/(2*n))/d, m = z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d; return [c-m,c+m]; }
function spawnLog(env, directory) { const out=fs.openSync(path.join(directory,'server.stdout.log'),'a'),err=fs.openSync(path.join(directory,'server.stderr.log'),'a');const child = spawn(process.execPath, ['server.js'], { cwd: path.join(ROOT, 'server'), env, stdio: ['ignore', out, err], windowsHide: true });child.once('exit',()=>{try{fs.closeSync(out);}catch{}try{fs.closeSync(err);}catch{}});return child; }
async function stop(child) { if (!child || child.exitCode !== null) return; child.kill(); await Promise.race([new Promise((r) => child.once('exit',r)), new Promise((r) => setTimeout(r,2500))]); if (child.exitCode === null) spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true}); }
async function ready(port, child) { for (let i=0;i<200;i++) { if (child.exitCode !== null) throw new Error('server exited before health check'); try { const r=await timedRequest(`http://127.0.0.1:${port}/api/health`); if(r.status===200)return; } catch {} await new Promise(r=>setTimeout(r,100)); } throw new Error('server health timeout'); }
async function main() {
  fs.mkdirSync(OUT,{recursive:true}); const requests=[], summary=[]; let cell=0; const started=Date.now();
  for (const profile of PROFILE) for (const past of PASTS) for (const future of FUTURES) {
    cell++; const port=3400, dir=path.join(OUT,profile.id,`past-${past}-future-${future}`); fs.mkdirSync(dir,{recursive:true});
    const env={...process.env,PORT:String(port),HOST:'127.0.0.1',VIZ_PORT:'3401',VIZ_ENABLED:'false',DEMO_MODE:'false',LEGACY_SHARED_SECRET:'false',ENABLE_DEMO_ROUTES:'false',NONCE_STORE:'redis',NONCE_TTL:'86400',REDIS_URL:'redis://127.0.0.1:6379',NONCE_KEY_NAMESPACE:`e3-${process.pid}-${cell}`,SQLITE_DB:path.join(dir,'run.sqlite'),TIMESTAMP_PAST_WINDOW_SECONDS:String(past),TIMESTAMP_FUTURE_WINDOW_SECONDS:String(future),DEFENSE_HMAC:'true',DEFENSE_TIMESTAMP:'true',DEFENSE_NONCE:'true',DEFENSE_REQUEST_ID:'true',EXPERIMENT_LOG:path.join(dir,'server-timings.csv'),CONFIG_ID:`${profile.id}-P${past}-F${future}`,SCENARIO_ID:'false-rejection',RUN_ID:`e3-${cell}`};
    const server=spawnLog(env,dir); try {
      await ready(port,server); const login=await timedRequest(`http://127.0.0.1:${port}/api/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({user_id:'anis_101',pin:process.env.DEMO_PIN||'1234'})});
      if(login.status!==200)throw new Error(`login HTTP ${login.status}`); const {sessionKey,sessionToken}=login.body; let rejected=0, offlineRejected=0, mismatch=0;
      for(let i=0;i<N;i++){
        const {offset,delay}=sample(profile); const sendMs=Date.now(); const timestampMs=sendMs-delay*1000+offset*1000; const timestampIso=new Date(timestampMs).toISOString(); const serializedTimestampMs=Date.parse(timestampIso);
        const p={method:'POST',path:'/api/withdraw',user_id:'anis_101',account_id:'acc_777',amount:1,currency:'BDT',timestamp:timestampIso,nonce:`e3-${cell}-${i}-${Math.floor(random()*1e12)}`,request_id:`e3-${cell}-${i}`}; p.signature=generateSignature(p,sessionKey);
        const response=await timedRequest(`http://127.0.0.1:${port}/api/withdraw`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${sessionToken}`},body:JSON.stringify(p)});
        const observed=response.status!==200; rejected+=observed?1:0;
        const checkMs=Number(response.headers?.['x-server-check-time-ms']||sendMs); const expectedAge=(checkMs-serializedTimestampMs)/1000; const offline=!isTimestampWithinWindow(timestampIso,checkMs,past,future); offlineRejected+=offline?1:0; mismatch+=offline!==observed?1:0;
        requests.push({profile:profile.id,past_seconds:past,future_seconds:future,attempt:i+1,send_time_epoch_ms:sendMs,timestamp_iso:timestampIso,timestamp_epoch_ms:serializedTimestampMs,server_check_time_ms:checkMs,client_offset_seconds:offset,assumed_delay_seconds:delay,expected_age_at_check_seconds:expectedAge,offline_expected_rejected:offline?1:0,http_status:response.status,reason:response.body.reason||response.body.error||'',observed_rejected:observed?1:0,duration_ns:response.duration_ns});
      }
      const [low,high]=wilson(rejected,N); summary.push({profile:profile.id,past_seconds:past,future_seconds:future,attempts:N,false_rejections:rejected,false_rejection_rate:rejected/N,wilson95_low:low,wilson95_high:high,offline_expected_rejections:offlineRejected,mismatch_count:mismatch,validated:mismatch===0,assumptions:JSON.stringify(profile)});
    } finally { await stop(server); }
    process.stdout.write(`E3 ${cell}/75 ${profile.id} PAST=${past} FUTURE=${future}\n`);
  }
  writeCsv(path.join(OUT,'requests.csv'),Object.keys(requests[0]),requests); writeCsv(path.join(OUT,'summary.csv'),Object.keys(summary[0]),summary);
  fs.writeFileSync(path.join(OUT,'run.json'),JSON.stringify({started:new Date(started).toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,seed:SEED,cells:cell,requests:N,profiles:PROFILE,pastSeconds:PASTS,futureSeconds:FUTURES,localhostOnly:true,keepAliveHttpAgent:true,nonceStore:'Memurai Developer via redis',falseRejectionFormula:'(server rejection responses) / 2000; offline age=(server_check_time_ms-parsed_timestamp), reject if age>PAST or age< -FUTURE; server check time is captured in response header',machine:{platform:os.platform(),release:os.release(),cpu:os.cpus()[0]?.model,totalRamBytes:os.totalmem()}},null,2)+'\n');
  process.stdout.write(`E3 complete: ${summary.length} cells, ${requests.length} requests at ${OUT}\n`);
}
main().catch(e=>{process.stderr.write(`${e.stack||e.message}\n`);process.exitCode=1;});
