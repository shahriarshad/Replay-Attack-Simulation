'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
require('../../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const { generateSignature } = require('../../server/utils/hmac');
const { computeMoneyIntegrity } = require('../../server/utils/money-oracle');
const sqlite3 = require('../../server/node_modules/sqlite3').verbose();
const { timedRequest } = require('../lib/http');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.resolve(process.env.S10_INDEP_OUTPUT_DIR || path.join(ROOT, 'experiments/results/e1-v3-s10-independent'));
const TAG = new Date().toISOString().replace(/[:.]/g, '-');
const RUN = path.join(OUT, TAG);
const ATTEMPTS = 30;
const PROFILES = { past: 6, future: 2, nonceTtl: 8, sessionTtl: 15 };
const PIN = process.env.DEMO_PIN || '1234';
const csv = (v) => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function writeCsv(file, rows) { const headers = Object.keys(rows[0] || {}); fs.writeFileSync(file, `${[headers.join(','), ...rows.map((r) => headers.map((h) => csv(r[h])).join(','))].join('\n')}\n`); }
function wilson(k, n) { if (!n) throw Error('Wilson interval needs a positive trial count'); const z=1.959963984540054,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,m=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d; return [Math.max(0,c-m),Math.min(1,c+m)]; }
const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 12);
function start(exe, args, options, stdout, stderr) { const out=fs.openSync(stdout,'a'),err=fs.openSync(stderr,'a'); const p=spawn(exe,args,{...options,stdio:['ignore',out,err],windowsHide:true});p.once('exit',()=>{try{fs.closeSync(out)}catch{}try{fs.closeSync(err)}catch{}});return p; }
async function stop(p) { if(!p||p.exitCode!==null)return;p.kill();await Promise.race([new Promise(r=>p.once('exit',r)),new Promise(r=>setTimeout(r,2500))]);if(p.exitCode===null)spawn('taskkill',['/PID',String(p.pid),'/T','/F'],{stdio:'ignore',windowsHide:true}); }
async function ready(port,p,log) { const until=Date.now()+30000;while(Date.now()<until){if(p.exitCode!==null)throw Error(`child exited; inspect ${log}`);try{if((await timedRequest(`http://127.0.0.1:${port}/api/health`)).status===200)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error(`health timeout; inspect ${log}`); }
function openDb(file) { const db=new sqlite3.Database(file);return new Promise((res,rej)=>db.once('open',()=>res(db)).once('error',rej)); }
function dbRun(db,sql,args=[]) { return new Promise((res,rej)=>db.run(sql,args,e=>e?rej(e):res())); }
function dbAll(db,sql,args=[]) { return new Promise((res,rej)=>db.all(sql,args,(e,rows)=>e?rej(e):res(rows))); }
function dbClose(db) { return new Promise(r=>db.close(()=>r())); }
function config(mask, policy) { return `H${mask&1?1:0}T${mask&2?1:0}N${mask&4?1:0}R${mask&8?1:0}-${policy}`; }
async function runCell(mask, policy, scenario) {
  const cfg=config(mask,policy), id=`${cfg}-${scenario}`,dir=path.join(RUN,id);fs.mkdirSync(dir,{recursive:true});
  const port=3700,vizPort=3701,proxyPort=3702,dbFile=path.join(dir,'bank.sqlite');
  const namespace=`e1v3-s10-${id}-${process.pid}`;
  const env={...process.env,PORT:String(port),HOST:'127.0.0.1',VIZ_PORT:String(vizPort),VIZ_ENABLED:'false',DEMO_MODE:'false',LEGACY_SHARED_SECRET:'false',ENABLE_DEMO_ROUTES:'false',NONCE_STORE:'redis',NONCE_TTL:String(PROFILES.nonceTtl),REDIS_URL:'redis://127.0.0.1:6379',NONCE_KEY_NAMESPACE:namespace,SQLITE_DB:dbFile,TIMESTAMP_PAST_WINDOW_SECONDS:String(PROFILES.past),TIMESTAMP_FUTURE_WINDOW_SECONDS:String(PROFILES.future),SESSION_TTL:String(PROFILES.sessionTtl),DEFENSE_HMAC:String(Boolean(mask&1)),DEFENSE_TIMESTAMP:String(Boolean(mask&2)),DEFENSE_NONCE:String(Boolean(mask&4)),DEFENSE_REQUEST_ID:String(Boolean(mask&8)),IDEMPOTENCY_POLICY:policy,EXPERIMENT_LOG:path.join(dir,'server-timings.csv'),CONFIG_ID:cfg,SCENARIO_ID:scenario,RUN_ID:`e1v3-${TAG}`};
  const server=start(process.execPath,['server.js'],{cwd:path.join(ROOT,'server'),env},path.join(dir,'server.stdout.log'),path.join(dir,'server.stderr.log'));
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'e1-s10-indep-')),capture=path.join(temp,'capture.json'),captureLog=`${capture}.jsonl`;
  const proxyEnv={...process.env,PROXY_UPSTREAM:`http://127.0.0.1:${port}`,PROXY_PORT:String(proxyPort),PROXY_CAPTURE_FILE:capture,PROXY_WITHDRAW_CAPTURE_FILE:`${capture}.withdraw.json`,PROXY_REDACT_LOGIN:'true'};
  let proxy,db,session;const requests=[],authorized=[];const started=process.hrtime.bigint();
  try {
    await ready(port,server,path.join(dir,'server.stderr.log'));
    db=await openDb(dbFile);
    proxy=start(process.execPath,[path.join(ROOT,'experiments/recording-proxy.js')],{cwd:ROOT,env:proxyEnv},path.join(dir,'proxy.stdout.log'),path.join(dir,'proxy.stderr.log'));
    await ready(proxyPort,proxy,path.join(dir,'proxy.stderr.log'));
    const login=await timedRequest(`http://127.0.0.1:${proxyPort}/api/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({user_id:'anis_101',pin:PIN})});
    if(login.status!==200)throw Error(`login failed with HTTP ${login.status}`);session=login.body;
    await dbRun(db,"UPDATE accounts SET balance=1 WHERE user_id='anis_101'");
    const failed=[];
    for(let i=0;i<ATTEMPTS;i++){
      const requestId=`s10i-${TAG}-${cfg}-${scenario}-${i}`,nonce=`s10i-n-${TAG}-${cfg}-${scenario}-${i}`;
      const payload={method:'POST',path:'/api/withdraw',user_id:'anis_101',account_id:'acc_777',amount:100,currency:'BDT',timestamp:new Date().toISOString(),nonce,request_id:requestId};payload.signature=generateSignature(payload,session.sessionKey);
      const first=await timedRequest(`http://127.0.0.1:${proxyPort}/api/withdraw`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${session.sessionToken}`},body:JSON.stringify(payload)});
      if(first.body.reason!=='INSUFFICIENT_BALANCE')throw Error(`${cfg}/${scenario}: failed seed was ${first.body.reason||first.body.error}`);
      const ledgerRow=(await dbAll(db,'SELECT id,status,reason FROM transactions WHERE request_id=?',[requestId]))[0];
      if(!ledgerRow||ledgerRow.status!=='FAILED'||ledgerRow.reason!=='INSUFFICIENT_BALANCE')throw Error('missing FAILED row in SQLite seed ledger');
      const entry=fs.readFileSync(captureLog,'utf8').trim().split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x)).reverse().find(x=>x.request.method==='POST'&&x.request.path==='/api/withdraw'&&JSON.parse(x.request.body).request_id===requestId);
      if(!entry)throw Error('attacker-visible capture missing');
      failed.push({requestId,nonce,payload,entry,first});authorized.push({request_id:requestId,amount:100,type:'WITHDRAW'});
      requests.push({config_id:cfg,policy,scenario_id:scenario,phase:'failed_seed',trial:i+1,request_id_hash:hash(requestId),nonce_hash:hash(nonce),http_status:first.status,reason:first.body.reason,start_ns:first.start_ns,end_ns:first.end_ns,duration_ns:first.duration_ns,ledger_status:ledgerRow.status});
    }
    const depositId=`s10i-fund-${TAG}-${cfg}-${scenario}`,depNonce=`s10i-fund-n-${TAG}-${cfg}-${scenario}`;
    const deposit={method:'POST',path:'/api/deposit',user_id:'anis_101',account_id:'acc_777',amount:3001,currency:'BDT',timestamp:new Date().toISOString(),nonce:depNonce,request_id:depositId};deposit.signature=generateSignature(deposit,session.sessionKey);
    const funded=await timedRequest(`http://127.0.0.1:${proxyPort}/api/deposit`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${session.sessionToken}`},body:JSON.stringify(deposit)});
    if(funded.status!==200||funded.body.status!=='ACCEPTED')throw Error(`funding failed: HTTP ${funded.status}`);
    const delay=scenario==='S10_indep_fast'?1:9;await new Promise(r=>setTimeout(r,delay*1000));
    const replayResponses=await Promise.all(failed.map(async ({requestId,nonce,entry},i)=>{
      const response=await timedRequest(`http://127.0.0.1:${proxyPort}/api/withdraw`,{method:'POST',headers:{'content-type':'application/json',authorization:entry.request.headers.authorization},body:entry.request.body});
      requests.push({config_id:cfg,policy,scenario_id:scenario,phase:'replay',trial:i+1,request_id_hash:hash(requestId),nonce_hash:hash(nonce),intended_delay_seconds:delay,actual_delay_seconds:Number(BigInt(response.start_ns)-BigInt(funded.end_ns))/1e9,http_status:response.status,reason:response.body.reason||response.body.error||response.body.status,start_ns:response.start_ns,end_ns:response.end_ns,duration_ns:response.duration_ns,ledger_status:''});
      return response;
    }));
    const ledger=await dbAll(db,'SELECT id,request_id,type,status,reason,amount FROM transactions WHERE type=\'WITHDRAW\' ORDER BY id');
    const oracle=computeMoneyIntegrity(ledger,authorized);
    const k=oracle.delayed_execution_count,n=ATTEMPTS,[low,high]=wilson(k,n);
    const summary={config_id:cfg,policy,scenario_id:scenario,attempts:n,failed_requests:n,distinct_request_ids:new Set(failed.map(x=>x.requestId)).size,distinct_nonces:new Set(failed.map(x=>x.nonce)).size,http_accepted_count:replayResponses.filter(r=>r.status===200&&r.body.status==='ACCEPTED').length,delayed_execution_count:k,delayed_execution_amount:oracle.delayed_execution_amount,success_rate:k/n,wilson95_low:low,wilson95_high:high,replay_reason_histogram:JSON.stringify(replayResponses.reduce((a,r)=>{const q=r.body.reason||r.body.status||r.body.error||`HTTP_${r.status}`;a[q]=(a[q]||0)+1;return a;},{})),funded_balance:3002,amount_per_withdrawal:100,oracle_integrity_holds:oracle.integrity_holds,oracle:JSON.stringify(oracle),run_duration_seconds:Number(process.hrtime.bigint()-started)/1e9,delay_after_funding_seconds:delay};
    requests.push({config_id:cfg,policy,scenario_id:scenario,phase:'funding',trial:0,request_id_hash:hash(depositId),nonce_hash:hash(depNonce),http_status:funded.status,reason:funded.body.status,start_ns:funded.start_ns,end_ns:funded.end_ns,duration_ns:funded.duration_ns});
    writeCsv(path.join(dir,'requests.csv'),requests);writeCsv(path.join(dir,'summary.csv'),[summary]);
    // Demo mode is disabled; make signature-column sanitation explicit for retained DB evidence.
    await dbRun(db,'UPDATE transactions SET signature=NULL');
    fs.writeFileSync(path.join(dir,'ledger.csv'),['id,request_id_hash,type,status,reason,amount',...ledger.map(r=>`${r.id},${hash(r.request_id)},${r.type},${r.status},${r.reason||''},${r.amount}`)].join('\n')+'\n');
    return {summary,dir};
  } finally {
    if(db)await dbClose(db);await stop(proxy);await stop(server);
    fs.rmSync(temp,{recursive:true,force:true});
  }
}
async function main(){fs.mkdirSync(RUN,{recursive:true});const started=new Date().toISOString(),cells=[];
  for(const scenario of ['S10_indep_fast','S10_indep_late'])for(let mask=0;mask<16;mask++)for(const policy of (mask&8?['success_only','any_outcome']:['success_only'])){
    const result=await runCell(mask,policy,scenario);cells.push(result.summary);process.stdout.write(`${scenario} ${result.summary.config_id}: ${result.summary.delayed_execution_count}/${ATTEMPTS}\n`);
  }
  const headers=Object.keys(cells[0]);writeCsv(path.join(RUN,'summary.csv'),cells);
  fs.writeFileSync(path.join(RUN,'run.json'),JSON.stringify({started,ended:new Date().toISOString(),elapsedSeconds:(Date.now()-Date.parse(started))/1000,nodeVersion:process.version,profiles:PROFILES,attemptsPerCell:ATTEMPTS,policies:['success_only','any_outcome (request-ID on only)'],scenarioWaitsSeconds:{S10_indep_fast:1,S10_indep_late:9},distinctFailedRequestIdsPerCell:30,distinctFailedNoncesPerCell:30,accountSeedBalance:1,fundingDeposit:3001,postFundingBalance:3002,amountPerWithdrawal:100,ledgerOracle:'computeMoneyIntegrity from SQLite rows',sessionMode:true,proxyRedactLogin:true,keepAliveHttpAgent:true,localhostOnly:true,cells:cells.length},null,2)+'\n');
  process.stdout.write(`S10 independent trials complete: ${cells.length} cells in ${RUN}\n`);
}
main().catch(e=>{process.stderr.write(`${e.stack||e.message}\n`);process.exitCode=1;});
