const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
const sqlite3 = require('../../server/node_modules/sqlite3').verbose();
require('../../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const { generateSignature } = require('../../server/utils/hmac');
const { computeMoneyIntegrity } = require('../../server/utils/money-oracle');
const { timedRequest } = require('../lib/http');

const ROOT = path.resolve(__dirname, '../..');
const OUTPUT = path.join(ROOT, 'experiments/results/e4a-fullscale');
const RUN = path.join(OUTPUT, new Date().toISOString().replace(/[:.]/g, '-'));
const WIDTH = 30;
const DELAYS = [299, 301, 303, 305, 307];
const BASE = 3800;
const COMMIT = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
const powerScheme = (() => { try { return execFileSync('powercfg', ['/getactivescheme'], { encoding: 'utf8' }).trim(); } catch { return 'unavailable'; } })();
const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const writeCsv = (f, rows) => { const headers = Object.keys(rows[0] || {}); fs.writeFileSync(f, [headers.join(','), ...rows.map(r => headers.map(h => csvCell(r[h])).join(','))].join('\n') + '\n'); };
function wilson(k, n) { const z=1.959963984540054,p=n?k/n:0,d=1+z*z/Math.max(n,1),c=(p+z*z/(2*Math.max(n,1)))/d,m=z*Math.sqrt((p*(1-p)+z*z/(4*Math.max(n,1)))/Math.max(n,1))/d;return[n?Math.max(0,c-m):0,n?Math.min(1,c+m):1]; }
function child(exe,args,opts,stdout,stderr){const o=fs.openSync(stdout,'a'),e=fs.openSync(stderr,'a');const c=spawn(exe,args,{...opts,stdio:['ignore',o,e],windowsHide:true});c.once('exit',()=>{try{fs.closeSync(o)}catch{}try{fs.closeSync(e)}catch{}});return c;}
async function stop(c){if(!c||c.exitCode!==null)return;c.kill();await Promise.race([new Promise(r=>c.once('exit',r)),new Promise(r=>setTimeout(r,3000))]);if(c.exitCode===null&&c.pid)spawn('taskkill',['/PID',String(c.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}
async function ready(port,c){for(let i=0;i<300;i++){if(c.exitCode!==null)throw Error('server/proxy exited before ready');try{const r=await timedRequest(`http://127.0.0.1:${port}/api/health`);if(r.status===200)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error(`health timeout on ${port}`);}
function payload(config,i){const p={method:'POST',path:'/api/withdraw',user_id:'anis_101',account_id:'acc_777',amount:1,currency:'BDT',timestamp:new Date(Date.now()+4000).toISOString(),nonce:`fullscale-${config}-${i}-${crypto.randomUUID()}`,request_id:`fullscale-${config}-${i}-${crypto.randomUUID()}`};return p;}
function ledger(dbFile){const db=new sqlite3.Database(dbFile);return new Promise((resolve,reject)=>db.all('SELECT id,request_id,type,status,amount FROM transactions ORDER BY id',[],(e,rows)=>db.close(()=>e?reject(e):resolve(rows))));}
async function runConfig(requestIdOn, offset){
  const config=`H1T1N1R${requestIdOn?1:0}`,dir=path.join(RUN,config);fs.mkdirSync(dir,{recursive:true});
  const port=BASE+offset,proxyPort=BASE+offset+2,dbFile=path.join(dir,'bank.sqlite');
  const namespace=`fullscale-${config}-${process.pid}-${crypto.randomBytes(6).toString('hex')}`;
  const capBase=path.join(os.tmpdir(),`cs-fullscale-${process.pid}-${config}-${crypto.randomBytes(6).toString('hex')}.json`);
  const env={...process.env,PORT:String(port),HOST:'127.0.0.1',VIZ_PORT:String(port+1),VIZ_ENABLED:'false',DEMO_MODE:'false',LEGACY_SHARED_SECRET:'false',ENABLE_DEMO_ROUTES:'true',NONCE_STORE:'redis',NONCE_TTL:'300',NONCE_KEY_NAMESPACE:namespace,REDIS_URL:'redis://127.0.0.1:6379',SQLITE_DB:dbFile,TIMESTAMP_PAST_WINDOW_SECONDS:'300',TIMESTAMP_FUTURE_WINDOW_SECONDS:'5',SESSION_TTL:'900',IDEMPOTENCY_POLICY:'success_only',DEFENSE_HMAC:'true',DEFENSE_TIMESTAMP:'true',DEFENSE_NONCE:'true',DEFENSE_REQUEST_ID:String(requestIdOn),CHECK_ORDER:'hmac,timestamp,nonce,request_id,balance',EXPERIMENT_LOG:path.join(dir,'server-timings.csv'),CONFIG_ID:config,SCENARIO_ID:'E4a_fullscale',RUN_ID:`e4a-fullscale-${config}`};
  const server=child(process.execPath,['server.js'],{cwd:path.join(ROOT,'server'),env},path.join(dir,'server.stdout.log'),path.join(dir,'server.stderr.log'));
  let proxy; const started=new Date().toISOString(); const monotonicStart=process.hrtime.bigint();
  try {
    await ready(port,server);
    const proxyEnv={...process.env,PROXY_UPSTREAM:`http://127.0.0.1:${port}`,PROXY_PORT:String(proxyPort),PROXY_CAPTURE_FILE:capBase,PROXY_WITHDRAW_CAPTURE_FILE:`${capBase}.withdraw.json`,PROXY_REDACT_LOGIN:'true'};
    proxy=child(process.execPath,[path.join(ROOT,'experiments/recording-proxy.js')],{cwd:ROOT,env:proxyEnv},path.join(dir,'proxy.stdout.log'),path.join(dir,'proxy.stderr.log'));
    await ready(proxyPort,proxy);
    const login=await timedRequest(`http://127.0.0.1:${proxyPort}/api/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({user_id:'anis_101',pin:process.env.DEMO_PIN||'1234'})});
    if(login.status!==200)throw Error(`login failed HTTP ${login.status}`);
    const session=login.body;
    const intents=[];
    for(let trial=0;trial<WIDTH;trial++)for(const delay of DELAYS){
      const p=payload(config,trial*DELAYS.length+DELAYS.indexOf(delay));p.signature=generateSignature(p,session.sessionKey);
      const sent=await timedRequest(`http://127.0.0.1:${proxyPort}/api/withdraw`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${session.sessionToken}`},body:JSON.stringify(p)});
      intents.push({trial,delay,p,first:sent});
    }
    const firstFailed=intents.filter(x=>x.first.status!==200||x.first.body.status!=='ACCEPTED');
    if(firstFailed.length)throw Error(`baseline legitimate withdrawal failure count ${firstFailed.length}`);
    const captureRows=fs.readFileSync(`${capBase}.jsonl`,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
    const capById=new Map(captureRows.filter(x=>x.request.method==='POST'&&x.request.path==='/api/withdraw').map(x=>{const b=JSON.parse(x.request.body);return[b.request_id,x]}));
    const replayResults=await Promise.all(intents.map(async item=>{
      const cap=capById.get(item.p.request_id);if(!cap)throw Error('missing proxy-recorded withdrawal capture');
      const target=BigInt(item.first.end_ns)+BigInt(item.delay)*1000000000n;
      while(true){const remaining=target-process.hrtime.bigint();if(remaining<=0n)break;await new Promise(r=>setTimeout(r,Math.max(1,Number(remaining)/1e6)));}
      const replay=await timedRequest(`http://127.0.0.1:${proxyPort}${cap.request.path}`,{method:cap.request.method,headers:{authorization:cap.request.headers.authorization,'content-type':cap.request.headers['content-type']},body:cap.request.body});
      const actualDelay=Number(BigInt(replay.start_ns)-BigInt(item.first.end_ns))/1e9;
      const reason=replay.body.reason||replay.body.error||replay.body.status||`HTTP_${replay.status}`;
      return{configuration:config,trial:item.trial+1,intended_delay_seconds:item.delay,actual_delay_seconds:Number(actualDelay.toFixed(6)),http_status:replay.status,reason,request_id_hash:crypto.createHash('sha256').update(item.p.request_id).digest('hex'),ledger_debit:0};
    }));
    const rows=await ledger(dbFile), oracle=computeMoneyIntegrity(rows,intents.map(x=>({request_id:x.p.request_id,amount:x.p.amount,type:'WITHDRAW'})));
    const successCountById=new Map();for(const r of rows)if(r.type==='WITHDRAW'&&r.status==='SUCCESS')successCountById.set(r.request_id,(successCountById.get(r.request_id)||0)+1);
    for(const r of replayResults){const intent=intents.find(x=>crypto.createHash('sha256').update(x.p.request_id).digest('hex')===r.request_id_hash);r.ledger_debit=Number((successCountById.get(intent.p.request_id)||0)>1);}
    writeCsv(path.join(dir,'requests.csv'),replayResults);
    const summary=DELAYS.map(delay=>{const g=replayResults.filter(r=>r.intended_delay_seconds===delay),accepted=g.filter(r=>r.http_status===200&&r.reason==='ACCEPTED').length,ledgerDebits=g.reduce((s,r)=>s+r.ledger_debit,0),[lo,hi]=wilson(accepted,g.length);return{configuration:config,intended_delay_seconds:delay,attempts:g.length,accepted,ledger_debits:ledgerDebits,blocked:g.length-accepted,wilson95_low:lo,wilson95_high:hi,blocking_reasons:JSON.stringify(g.reduce((a,r)=>(a[r.reason]=(a[r.reason]||0)+1,a),{}))};});
    writeCsv(path.join(dir,'summary.csv'),summary);
    const duration=Number(process.hrtime.bigint()-monotonicStart)/1e9,ended=new Date().toISOString();
    const metadata={configuration:config,started,ended,elapsed_seconds:duration,server_env:{HOST:'127.0.0.1',LEGACY_SHARED_SECRET:'false',VIZ_ENABLED:'false',DEMO_MODE:'false',DEFENSE_HMAC:'true',DEFENSE_TIMESTAMP:'true',DEFENSE_NONCE:'true',DEFENSE_REQUEST_ID:String(requestIdOn),IDEMPOTENCY_POLICY:'success_only',TIMESTAMP_PAST_WINDOW_SECONDS:300,TIMESTAMP_FUTURE_WINDOW_SECONDS:5,NONCE_TTL:300,SESSION_TTL:900,NONCE_STORE:'redis',REDIS_URL:'redis://127.0.0.1:6379'},client_clock_offset_seconds:4,delays_seconds:DELAYS,trials_per_delay:WIDTH,initial_legitimate_accepted:intents.length,capture:'recording proxy attacker-view; login request/response redacted; raw capture kept only in private temp and removed after run',oracle:{duplicate_debit_count:oracle.duplicate_debit_count,duplicate_debit_amount:oracle.duplicate_debit_amount,unauthorized_debit_amount:oracle.unauthorized_debit_amount,total_debited:oracle.total_debited,integrity_holds:oracle.integrity_holds},node:process.version,os:`${os.platform()} ${os.release()}`,cpu:os.cpus()[0]?.model,memory_bytes:os.totalmem(),memurai_version:'4.2.3',power_scheme:powerScheme,git_commit:COMMIT,raw_csv_sha256:{requests:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'requests.csv'))).digest('hex'),summary:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'summary.csv'))).digest('hex')},summary};
    fs.writeFileSync(path.join(dir,'run.json'),JSON.stringify(metadata,null,2)+'\n');return metadata;
  } finally {
    await stop(proxy);await stop(server);
    for(const suffix of ['', '.jsonl','.withdraw.json'])try{fs.rmSync(`${capBase}${suffix}`,{force:true});}catch{}
    try{fs.rmSync(`${capBase}.${process.pid}.tmp`,{force:true});}catch{}
  }
}
async function main(){
  if(process.env.E4A_FULLSCALE!=='true')throw Error('Set E4A_FULLSCALE=true to explicitly enable this 307-second-per-configuration experiment.');
  fs.mkdirSync(RUN,{recursive:true});const started=new Date().toISOString(),all=[];
  all.push(await runConfig(false,0));all.push(await runConfig(true,10));
  const meta={started,ended:new Date().toISOString(),elapsed_seconds:all.reduce((s,r)=>s+r.elapsed_seconds,0),git_commit:COMMIT,node:process.version,memurai_version:'4.2.3',power_scheme:powerScheme,profiles:all.map(x=>({configuration:x.configuration,elapsed_seconds:x.elapsed_seconds,summary:x.summary,run_json:path.relative(ROOT,path.join(RUN,x.configuration,'run.json'))}))};
  fs.writeFileSync(path.join(RUN,'run.json'),JSON.stringify(meta,null,2)+'\n');process.stdout.write(JSON.stringify({output:path.relative(ROOT,RUN),elapsed_seconds:meta.elapsed_seconds,profiles:meta.profiles},null,2)+'\n');
}
main().catch(e=>{process.stderr.write(`${e.stack||e.message}\n`);process.exitCode=1;});
