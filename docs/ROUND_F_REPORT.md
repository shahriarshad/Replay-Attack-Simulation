# Round F Experimental Addition Report

Generated 2026-10-20. Code and documentation commit at report generation: `ec1988ca6fcdc72595b3730f4cca2cfe744ae171`. The measured runs used baseline commit `d0c042fcd260c0510eef4ac68ffdab0d360dc92f`. All traffic targeted the local Windows simulation.

## 1. Request and completion status

| Item | Status | What was done |
|---|---|---|
| A: full-scale TTL gap | Done | 30 independent captures per delay at 299, 301, 303, 305, 307 seconds in H1T1N1R0. |
| A2: request-ID enabled | Done | Same profile in H1T1N1R1. |
| A3: optional S10_late | Not run | A/A2 required run took 618.681 seconds. Optional two 301-second cells were omitted to finish required B, audit, tests and documentation. |
| B: 100 attempts | Done | S10 fast/late request-ID on with both policies; S10 fast/late request-ID off under success_only; S11 across all 16 configurations. |
| C: docs, audit, tests | Done | Appended results/claim evidence, extended independent audit, tested E1_ATTEMPTS, fresh npm.cmd test. |
| D: review report | Done | This report contains source, diffs, tables, hashes, commands, environment, audit and limitations. |

## 2. New and changed files

- `experiments/e1/attempt-count.js`: reads positive integer E1_ATTEMPTS, defaults to 30.
- `experiments/e1/run.js`: applies the count to S10/S11 and adds config/policy selection; existing defaults remain intact.
- `experiments/e4a/run-fullscale.js`: runs A/A2 with fresh servers, redacted recording proxy, SQLite oracle, raw attempt CSVs and metadata.
- `experiments/audit/verify-results.js`: recomputes A/A2/B with independent parsing, Wilson formulas and SQLite queries; supports a separate output directory.
- `server/test/unit.test.js`: checks E1_ATTEMPTS default, valid 100 and invalid fallback.
- `docs/RESULTS_PACK_A.md`: adds A/A2 and B tables, hashes and signature-redaction note.
- `docs/CLAIMS_EVIDENCE.md`: updates claim 2 and claim 3 for the default-window results.
- New run outputs: `experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/`, `experiments/results/round-f/B-*`, test logs under `experiments/results/round-f-preflight/`, final audit under `experiments/results/round-f/audit-final4/`.

## 3. Full source and diffs

### New file: experiments/e1/attempt-count.js

```js
function readAttemptCount(value = process.env.E1_ATTEMPTS) {
  if (value === undefined || value === '') return 30;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 30;
}

module.exports = { readAttemptCount };
```

### New file: experiments/e4a/run-fullscale.js

```js
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
```

### Unified diff for every changed tracked file

Exact patch from `git show --format= --no-ext-diff ec1988c`:

```diff
diff --git a/docs/CLAIMS_EVIDENCE.md b/docs/CLAIMS_EVIDENCE.md
index 0d39b36..0e49027 100644
--- a/docs/CLAIMS_EVIDENCE.md
+++ b/docs/CLAIMS_EVIDENCE.md
@@ -19,3 +19,11 @@ This is an evidence map, not a claim that each result generalizes beyond the loc
 - The S11 token-only attacker holds a bearer token but lacks the session key. It demonstrates why HMAC cannot be disabled when bearer-only forgery is in scope.
 - No claim here says anything about a real bank, telecom operator, or mobile financial service.
 - Every numeric claim must be tied to the raw artifact path and SHA-256 in `PAPER_FACTS_CURATED.md`.
+
+## Round F evidence update
+
+- Claim 2 (failed-request idempotency trade-off): Round F 100-trial policy sweep reports S10_fast and S10_late for request-ID-on configurations. Under success_only, a delayed failed attempt can execute after later funding when the request-ID defense has not already consumed it as a success; under ny_outcome, failed rows consume the request ID and those tested retries were rejected. See the complete cells and Wilson intervals in [RESULTS_PACK_A.md](RESULTS_PACK_A.md), raw runs under experiments/results/round-f/B-S10-*. This supports the stated policy behavior for these tested conditions; timing and balances are harness-specific.
+- Claim 3 (nonce TTL relative to the timestamp window): default-window A reproduces the tested gap only when request-ID is off: all 30 replays were accepted at 301 s and 303 s, while 299 s and 305/307 s were all blocked; A2 with request-ID on had zero accepted. See A/A2 tables and raw CSV hashes in [RESULTS_PACK_A.md](RESULTS_PACK_A.md). This demonstrates behavior at the tested default values; it does not establish a universal TTL inequality independent of defense ordering and request-ID.
+
+
+Privacy note: SQLite signature-column values in the new Round F databases were nulled after the measured runs and ledger oracle queries. The audit was rerun after this sanitization and still matched all compared values.
diff --git a/docs/RESULTS_PACK_A.md b/docs/RESULTS_PACK_A.md
index f0acd47..42c6a66 100644
--- a/docs/RESULTS_PACK_A.md
+++ b/docs/RESULTS_PACK_A.md
@@ -594,3 +594,110 @@ The artifact hash is for the rendered file; the source hash is for its raw CSV.
 | E3 P2 false-rejection plot svg | experiments/results/e3-v2/p2-false-rejection-vs-future.svg | 4967dd70309c22ae815e6257e710db89b9c3f0a2489a40280e0f93e13a936e3b | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
 | E3 P3 false-rejection plot svg | experiments/results/e3-v2/p3-false-rejection-vs-future.svg | 996144f85d90f28997d2ca237d798fc476a9d8491a06774431321038f5b7c90a | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
 | E3 false-rejection vs PAST svg | experiments/results/e3-v2/false-rejection-vs-past-and-replay-window.svg | 855ad4e4e87dda878f8fd01548c3eb9f91eb822f64760aa182a565bfcab1085c | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
+
+## Round F: default-window TTL gap and higher-trial headline cells
+
+New results only. Earlier result directories were not overwritten. A/A2 use default PAST=300 s, FUTURE=5 s, NONCE_TTL=300 s, client offset +4 s, SESSION_TTL=900 s, 30 independent captured requests at each delay. A used H1T1N1R0; A2 used H1T1N1R1. The tested rule predicts nonce rejection before expiry, replay acceptance after nonce expiry while timestamp age remains below 304 s, then timestamp rejection.
+
+| Run | Intended delay | attempts | accepted / ledger replay debits | Wilson 95% | reasons |
+|---|---:|---:|---:|---:|---|
+| H1T1N1R0 | 299s | 30 | 0/0 | [0, 0.113513393173969] | {"NONCE_FAIL":30} |
+| H1T1N1R0 | 301s | 30 | 30/30 | [0.886486606826031, 1] | {"ACCEPTED":30} |
+| H1T1N1R0 | 303s | 30 | 30/30 | [0.886486606826031, 1] | {"ACCEPTED":30} |
+| H1T1N1R0 | 305s | 30 | 0/0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |
+| H1T1N1R0 | 307s | 30 | 0/0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |
+| H1T1N1R1 | 299s | 30 | 0/0 | [0, 0.113513393173969] | {"NONCE_FAIL":30} |
+| H1T1N1R1 | 301s | 30 | 0/0 | [0, 0.113513393173969] | {"ALREADY_PROCESSED":30} |
+| H1T1N1R1 | 303s | 30 | 0/0 | [0, 0.113513393173969] | {"ALREADY_PROCESSED":30} |
+| H1T1N1R1 | 305s | 30 | 0/0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |
+| H1T1N1R1 | 307s | 30 | 0/0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |
+
+The observed A sequence is 0, 30, 30, 0, 0 accepted at 299/301/303/305/307 s, matching the prediction. A2 accepted 0 at every delay; 301 s and 303 s were stopped by request-ID idempotency (`ALREADY_PROCESSED`). Each table is aggregated from the corresponding requests.csv; SQLite ledger counts and timing fields are saved alongside it.
+
+| Config | Raw requests CSV | SHA-256 | Metadata |
+|---|---|---|---|
+| H1T1N1R0 | $f | $hash | $full/H1T1N1R0/run.json |
+| H1T1N1R1 | $f | $hash | $full/H1T1N1R1/run.json |
+
+### B: 100 attempts per requested cell
+
+The per-cell Wilson intervals below use the exact Wilson score formula and the SQLite ledger oracle debit count as successes. Controls are 30/30 accepted in every configuration and omitted here for compactness; they are present in each raw summary. Each run has a summary.csv, per-config requests.csv, SQLite database, run.json, and console.log.
+
+| Run | config | scenario | attempts | oracle debits / attempts | Wilson 95% | blocking reasons |
+|---|---|---|---:|---:|---:|---|
+| B-S10-fast-R0 | H0T0N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
+| B-S10-fast-R0 | H1T0N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
+| B-S10-fast-R0 | H0T1N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
+| B-S10-fast-R0 | H1T1N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
+| B-S10-fast-R0 | H0T0N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
+| B-S10-fast-R0 | H1T0N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
+| B-S10-fast-R0 | H0T1N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
+| B-S10-fast-R0 | H1T1N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
+| B-S10-fast-R1 | H0T0N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
+| B-S10-fast-R1 | H1T0N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
+| B-S10-fast-R1 | H0T1N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
+| B-S10-fast-R1 | H1T1N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
+| B-S10-fast-R1 | H0T0N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
+| B-S10-fast-R1 | H1T0N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
+| B-S10-fast-R1 | H0T1N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
+| B-S10-fast-R1 | H1T1N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
+| B-S10-fast-R1 | H0T0N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
+| B-S10-fast-R1 | H1T0N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
+| B-S10-fast-R1 | H0T1N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
+| B-S10-fast-R1 | H1T1N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
+| B-S10-fast-R1 | H0T0N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
+| B-S10-fast-R1 | H1T0N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
+| B-S10-fast-R1 | H0T1N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
+| B-S10-fast-R1 | H1T1N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
+| B-S10-late-R0 | H0T0N0R0 | S10_late | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
+| B-S10-late-R0 | H1T0N0R0 | S10_late | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
+| B-S10-late-R0 | H0T1N0R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
+| B-S10-late-R0 | H1T1N0R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
+| B-S10-late-R0 | H0T0N1R0 | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
+| B-S10-late-R0 | H1T0N1R0 | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
+| B-S10-late-R0 | H0T1N1R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
+| B-S10-late-R0 | H1T1N1R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
+| B-S10-late-R1 | H0T0N0R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
+| B-S10-late-R1 | H1T0N0R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
+| B-S10-late-R1 | H0T1N0R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
+| B-S10-late-R1 | H1T1N0R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
+| B-S10-late-R1 | H0T0N1R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
+| B-S10-late-R1 | H1T0N1R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
+| B-S10-late-R1 | H0T1N1R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
+| B-S10-late-R1 | H1T1N1R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
+| B-S10-late-R1 | H0T0N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
+| B-S10-late-R1 | H1T0N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
+| B-S10-late-R1 | H0T1N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
+| B-S10-late-R1 | H1T1N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
+| B-S10-late-R1 | H0T0N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":1,"NONCE_FAIL":99} |
+| B-S10-late-R1 | H1T0N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":1,"NONCE_FAIL":99} |
+| B-S10-late-R1 | H0T1N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
+| B-S10-late-R1 | H1T1N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
+| B-s11-100 | H0T0N0R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
+| B-s11-100 | H1T0N0R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
+| B-s11-100 | H0T1N0R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
+| B-s11-100 | H1T1N0R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
+| B-s11-100 | H0T0N1R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
+| B-s11-100 | H1T0N1R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
+| B-s11-100 | H0T1N1R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
+| B-s11-100 | H1T1N1R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
+| B-s11-100 | H0T0N0R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
+| B-s11-100 | H1T0N0R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
+| B-s11-100 | H0T1N0R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
+| B-s11-100 | H1T1N0R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
+| B-s11-100 | H0T0N1R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
+| B-s11-100 | H1T0N1R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
+| B-s11-100 | H0T1N1R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
+| B-s11-100 | H1T1N1R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
+
+Headline: S11 produced 100/100 debits when HMAC was disabled (all 8 such configurations; Wilson [0.9630, 1.0000]) and 0/100 when HMAC was enabled (all 8; [0.0000, 0.0370], `SIGNATURE_FAIL`). For S10_fast with request-ID disabled and nonce disabled, each of four HMAC/timestamp combinations produced 5/100 late executions after funding (Wilson [0.0215, 0.1118]); enabling nonce reduced these to 0/100. With request-ID enabled under success_only, all nonce-disabled cells produced 1/100 and nonce-enabled cells 0/100; under any_outcome all produced 0/100. For S10_late, HMAC is irrelevant; timestamp-enabled cells were 0/100. Request-ID-off, timestamp-off cells had 5/100 for no nonce and 1/100 for nonce. Request-ID-on success_only had 1/100 with timestamp off; any_outcome produced 0/100.
+
+| Run | summary.csv | SHA-256 | run.json |
+|---|---|---|---|
+| B-S10-fast-R0 | $f | $hash | experiments/results/round-f/B-S10-fast-R0/run.json |
+| B-S10-fast-R1 | $f | $hash | experiments/results/round-f/B-S10-fast-R1/run.json |
+| B-S10-late-R0 | $f | $hash | experiments/results/round-f/B-S10-late-R0/run.json |
+| B-S10-late-R1 | $f | $hash | experiments/results/round-f/B-S10-late-R1/run.json |
+| B-s11-100 | $f | $hash | experiments/results/round-f/B-s11-100/run.json |
+
+Privacy treatment: the post-run SQLite files retained the transaction and balance columns used by the oracle. After the oracle queries completed, stored signature column values were set to NULL and the files checkpointed; this removes signatures from the deliverable artifacts without changing ledger outcome fields. The independent audit was rerun successfully against these sanitized SQLite files at experiments/results/round-f/audit-final4/audit-report.json.
diff --git a/experiments/audit/verify-results.js b/experiments/audit/verify-results.js
index fe3b9a3..466b175 100644
--- a/experiments/audit/verify-results.js
+++ b/experiments/audit/verify-results.js
@@ -1,5 +1,5 @@
 const fs=require('fs');const path=require('path');const crypto=require('crypto');const sqlite3=require('../../server/node_modules/sqlite3').verbose();
-const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'experiments/results/audit');fs.mkdirSync(OUT,{recursive:true});
+const ROOT=path.resolve(__dirname,'../..'),OUT=path.resolve(process.env.AUDIT_OUTPUT_DIR||path.join(ROOT,'experiments/results/audit'));fs.mkdirSync(OUT,{recursive:true});
 function parseCsv(text){const lines=text.trim().split(/\r?\n/);return lines.map(line=>{const out=[];let v='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(q&&c==='"'&&line[i+1]==='"'){v+='"';i++;}else if(c==='"')q=!q;else if(c===','&&!q){out.push(v);v='';}else v+=c;}out.push(v);return out;});}
 function readCsv(file){const [h,...d]=parseCsv(fs.readFileSync(file,'utf8'));return d.map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]])));}
 function wilson(k,n){const z=1.959963984540054,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,m=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d;return[c-m,c+m];}
@@ -30,6 +30,23 @@ async function main(){
   const race=JSON.parse(fs.readFileSync(path.join(ROOT,'experiments/results/phase4-source-fixes/race-summary-1000-batches.json'),'utf8'));check('race.identical.batches',1000,race.identicalPayloadRace.batches,'phase4-source-fixes/race-summary-1000-batches.json');check('race.identical.accepted_once',1000,Number(race.identicalPayloadRace.acceptedCountDistribution['1']),'phase4-source-fixes/race-summary-1000-batches.json');check('race.secret_holder.balance_delta',1,race.secretHolderSameRequestIdRace.balanceDelta,'phase4-source-fixes/race-summary-1000-batches.json');const raceDb='experiments/results/phase4-source-fixes/race-session-final-2026-10-18T12-12-30-256Z/race-session.sqlite',raceLedger=await dbAll(path.join(ROOT,raceDb),"SELECT COUNT(*) AS n,COUNT(DISTINCT request_id) AS ids,SUM(amount) AS amount FROM transactions WHERE type='WITHDRAW' AND status='SUCCESS'");check('race.secret_holder.sqlite_success_rows',1,Number(raceLedger[0].n),raceDb);check('race.secret_holder.sqlite_request_ids',1,Number(raceLedger[0].ids),raceDb);check('race.secret_holder.sqlite_debited_amount',1,Number(raceLedger[0].amount),raceDb);
   // C5 stats are recomputed from ten independent repeat-level layer medians.
   const e2root=path.join(ROOT,'experiments/results/e2-v2'),e2run=fs.readdirSync(e2root).find(n=>/^\d{4}-/.test(n)),rawE2=path.join(e2root,e2run),reported=readCsv(path.join(e2root,'per-layer-coverage-c5.csv')),targetStacks=['all_four','nonce_redis','nonce_sqlite','nonce_memory'];for(const stack of targetStacks)for(const name of ['hmac','timestamp','nonce','request_id','handler_total']){const dirs=fs.readdirSync(rawE2).filter(d=>new RegExp(`^${stack}-r\\d+-c1$`).test(d)),reps=[];for(const dir of dirs){const rows=readCsv(path.join(rawE2,dir,'layer-timings.csv')).slice(500),values=rows.map(r=>Number(name==='handler_total'?r.duration_ns:r[`${name}_ns`])).filter(Number.isFinite);reps.push(percentile(values,.5));}const med=percentile(reps,.5),ci=tInterval(reps),row=reported.find(r=>r.stack_id===stack&&r.layer===name);check(`E2.${stack}.${name}.repeats`,10,reps.length,path.relative(ROOT,rawE2));check(`E2.${stack}.${name}.median_ns`,Number(row.p50_median_ns),med,'raw per-request layer-timings.csv files after excluding 500 warm-ups');check(`E2.${stack}.${name}.t_low_ns`,Number(row.t_ci95_low_ns),ci[0],'raw per-request layer-timings.csv files after excluding 500 warm-ups');check(`E2.${stack}.${name}.t_high_ns`,Number(row.t_ci95_high_ns),ci[1],'raw per-request layer-timings.csv files after excluding 500 warm-ups');}
+  // Round F A/A2: recompute delay-cell acceptance, Wilson intervals and replay debits from SQLite.
+  const fullRoot=path.resolve(process.env.ROUND_F_A_ROOT||path.join(ROOT,'experiments/results/e4a-fullscale'));
+  const fullRun=fs.readdirSync(fullRoot).filter(n=>fs.statSync(path.join(fullRoot,n)).isDirectory()&&fs.existsSync(path.join(fullRoot,n,'H1T1N1R0','requests.csv'))&&fs.existsSync(path.join(fullRoot,n,'H1T1N1R1','requests.csv'))).sort().at(-1);
+  if(!fullRun)throw Error('Full-scale A/A2 raw run directory missing');
+  for(const config of ['H1T1N1R0','H1T1N1R1']){
+    const cellDir=path.join(fullRoot,fullRun,config),raw=readCsv(path.join(cellDir,'requests.csv')),summary=readCsv(path.join(cellDir,'summary.csv')),meta=JSON.parse(fs.readFileSync(path.join(cellDir,'run.json'),'utf8'));
+    const ledger=await dbAll(path.join(cellDir,'bank.sqlite'),"SELECT request_id,COUNT(*) AS n FROM transactions WHERE type='WITHDRAW' AND status='SUCCESS' GROUP BY request_id"),successByHash=new Map(ledger.map(x=>[crypto.createHash('sha256').update(x.request_id).digest('hex'),Number(x.n)]));
+    check(`RoundF.${config}.initial_accepted`,150,meta.initial_legitimate_accepted,`round-f/${fullRun}/${config}/run.json`);
+    check(`RoundF.${config}.session_ttl`,900,meta.server_env.SESSION_TTL,`round-f/${fullRun}/${config}/run.json`);
+    check(`RoundF.${config}.raw_attempts`,150,raw.length,`round-f/${fullRun}/${config}/requests.csv`);
+    for(const row of summary){const g=raw.filter(x=>Number(x.intended_delay_seconds)===Number(row.intended_delay_seconds)),accepted=g.filter(x=>Number(x.http_status)===200&&x.reason==='ACCEPTED').length,debits=g.reduce((s,x)=>s+Math.max(0,(successByHash.get(x.request_id_hash)||0)-1),0),[lo,hi]=wilson(accepted,g.length);check(`RoundF.${config}.${row.intended_delay_seconds}.attempts`,30,g.length,`round-f/${fullRun}/${config}/requests.csv`);check(`RoundF.${config}.${row.intended_delay_seconds}.accepted`,Number(row.accepted),accepted,`round-f/${fullRun}/${config}/requests.csv`);check(`RoundF.${config}.${row.intended_delay_seconds}.ledger_debits`,Number(row.ledger_debits),debits,`round-f/${fullRun}/${config}/bank.sqlite`);check(`RoundF.${config}.${row.intended_delay_seconds}.wilson_low`,Number(row.wilson95_low),lo,`Wilson recomputed from ${config}/requests.csv`);check(`RoundF.${config}.${row.intended_delay_seconds}.wilson_high`,Number(row.wilson95_high),hi,`Wilson recomputed from ${config}/requests.csv`);for(const attempt of g){const d=Number(attempt.actual_delay_seconds),predicted=config.endsWith('R0')&&d>=300&&d<304,observed=Number(attempt.http_status)===200&&attempt.reason==='ACCEPTED';check(`RoundF.rule.${config}.${attempt.trial}.${row.intended_delay_seconds}`,predicted?true:false,observed,`round-f/${fullRun}/${config}/requests.csv`);}}
+  }
+  // Round F B: parse each new raw attempt file, derive successful debits from its SQLite ledger, and recalculate Wilson intervals.
+  const bRoots=['B-s11-100','B-S10-fast-R1','B-S10-late-R1','B-S10-fast-R0','B-S10-late-R0'];
+  for(const rootName of bRoots){const bRoot=path.join(ROOT,'experiments/results/round-f',rootName),summary=readCsv(path.join(bRoot,'summary.csv')),runTag=fs.readdirSync(bRoot).find(n=>/^\d{4}-/.test(n)),runDir=path.join(bRoot,runTag);
+    for(const row of summary.filter(x=>x.scenario_id!=='LEGITIMATE_CONTROL')){const rawFile=path.join(runDir,row.config_id,'requests.csv');if(!fs.existsSync(rawFile)){notes.push(`Round F B raw CSV missing ${rawFile}`);continue;}const raw=readCsv(rawFile).filter(x=>x.phase==='attacker'&&x.scenario_id===row.scenario_id&&(!row.variant||x.variant===row.variant)),prefix=row.scenario_id==='S11'?'s11-r-':'s10-',ledger=await dbAll(path.join(runDir,`${row.config_id}.sqlite`),"SELECT request_id,COUNT(*) AS n FROM transactions WHERE type='WITHDRAW' AND status='SUCCESS' GROUP BY request_id"),debits=ledger.filter(x=>x.request_id.startsWith(prefix)).reduce((s,x)=>s+Number(x.n),0),[lo,hi]=wilson(debits,raw.length);check(`RoundF.B.${rootName}.${row.config_id}.${row.scenario_id}.attempts`,Number(row.attempts),raw.length,path.relative(ROOT,rawFile));check(`RoundF.B.${rootName}.${row.config_id}.${row.scenario_id}.sqlite_debits`,Number(row.debited_count),debits,path.relative(ROOT,path.join(runDir,`${row.config_id}.sqlite`)));check(`RoundF.B.${rootName}.${row.config_id}.${row.scenario_id}.wilson_low`,Number(row.wilson95_low),lo,path.relative(ROOT,rawFile));check(`RoundF.B.${rootName}.${row.config_id}.${row.scenario_id}.wilson_high`,Number(row.wilson95_high),hi,path.relative(ROOT,rawFile));}
+  }
   // Reconcile displayed table cells in both curated facts and the compact results pack.
   const pack=fs.readFileSync(path.join(ROOT,'docs/RESULTS_PACK_A.md'),'utf8'),facts=fs.readFileSync(path.join(ROOT,'docs/PAPER_FACTS_CURATED.md'),'utf8');
   for(const row of e1Summary.filter(r=>r.scenario_id!=='LEGITIMATE_CONTROL')){const id=`E1/${row.config_id}/${row.scenario_id}${row.variant?`/${row.variant}`:''}/debit`,value=`${row.debited_count}/${row.attempts} [${Number(row.wilson95_low).toFixed(4)},${Number(row.wilson95_high).toFixed(4)}]`;check(`docs.curated.${id}`,true,facts.includes(`| ${id} | ${value} |`),'docs/PAPER_FACTS_CURATED.md');const short=`${row.debited_count}/${row.attempts} [${Number(row.wilson95_low).toFixed(3)},${Number(row.wilson95_high).toFixed(3)}]`;check(`docs.pack.${row.config_id}.${row.scenario_id}`,true,pack.includes(short),'docs/RESULTS_PACK_A.md E1 table');}
diff --git a/experiments/e1/attempt-count.js b/experiments/e1/attempt-count.js
new file mode 100644
index 0000000..b24c603
--- /dev/null
+++ b/experiments/e1/attempt-count.js
@@ -0,0 +1,7 @@
+function readAttemptCount(value = process.env.E1_ATTEMPTS) {
+  if (value === undefined || value === '') return 30;
+  const parsed = Number(value);
+  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 30;
+}
+
+module.exports = { readAttemptCount };
diff --git a/experiments/e1/run.js b/experiments/e1/run.js
index 1a48dfa..366dbad 100644
--- a/experiments/e1/run.js
+++ b/experiments/e1/run.js
@@ -8,6 +8,7 @@ const { generateSignature } = require('../../server/utils/hmac');
 const { computeMoneyIntegrity } = require('../../server/utils/money-oracle');
 const sqlite3 = require('../../server/node_modules/sqlite3').verbose();
 const { timedRequest } = require('../lib/http');
+const { readAttemptCount } = require('./attempt-count');
 
 const ROOT = path.resolve(__dirname, '../..');
 const SERVER = path.join(ROOT, 'server');
@@ -16,6 +17,7 @@ const RUN_TAG = new Date().toISOString().replace(/[:.]/g, '-');
 const RUN_OUTPUT = path.join(OUTPUT, RUN_TAG);
 const RANDOM_SEED = 'e1-fixed-seed-2026-v1';
 const WIDTH = 30;
+const ATTEMPTS = readAttemptCount();
 const PAST = 6;
 const FUTURE = 2;
 const NONCE_TTL = 4;
@@ -277,12 +279,12 @@ async function runConfiguration(mask, profile = {}) {
         const [tokenCapture] = await baseline('S11_token_capture_seed', 1);
         const bearer = tokenCapture.request.headers.authorization.replace(/^Bearer\s+/i, '');
         // The attacker gets only the bearer token. No session key is read or used here.
-        const forged = Array.from({ length: WIDTH }, () => ({
+        const forged = Array.from({ length: ATTEMPTS }, () => ({
           method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777', amount: 1,
           currency: 'BDT', timestamp: new Date().toISOString(), nonce: `s11-n-${deterministicId(id)}`,
           request_id: `s11-r-${deterministicId(id)}`
         }));
-        const results = await measureScenario(scenario, WIDTH, async () => Promise.all(forged.map((payload) => submit(payload, bearer))));
+        const results = await measureScenario(scenario, ATTEMPTS, async () => Promise.all(forged.map((payload) => submit(payload, bearer))));
         recordAttempts(scenario, results);
       } else if (scenario === 'S10_fast' || scenario === 'S10_late') {
         const deposit = async (amount) => {
@@ -300,7 +302,7 @@ async function runConfiguration(mask, profile = {}) {
         if (funded.status !== 200) throw new Error(`${id}/${scenario}: legitimate funding failed (${funded.status})`);
         if (scenario === 'S10_fast') await new Promise((resolve) => setTimeout(resolve, 1000));
         else await new Promise((resolve) => setTimeout(resolve, 7000));
-        const results = await measureScenario(scenario, WIDTH, async () => Promise.all(Array.from({ length: WIDTH }, () => replay(capturedFailure))));
+        const results = await measureScenario(scenario, ATTEMPTS, async () => Promise.all(Array.from({ length: ATTEMPTS }, () => replay(capturedFailure))));
         recordAttempts(scenario, results);
       }
     }
@@ -324,18 +326,23 @@ async function main() {
   const filter = process.env.E1_SCENARIO_FILTER || '';
   const onlyS11 = filter === 'S11';
   const policySweep = process.env.E1_POLICY_SWEEP === 'true';
+  const skipDefaultConfirmation = process.env.E1_SKIP_DEFAULT_CONFIRMATION === 'true';
   if (policySweep) {
     for (const policy of ['success_only', 'any_outcome']) {
       for (let mask = 8; mask < 16; mask += 1) {
+        const selected = process.env.E1_CONFIG_MASKS;
+        if (selected && !selected.split(',').map((x) => Number(x.trim())).includes(mask)) continue;
         process.stdout.write(`Policy ${policy}, config mask ${mask}, scenario ${filter}\n`);
         allSummaries.push(...await runConfiguration(mask, { suffix: `-${policy}`, idempotencyPolicy: policy }));
       }
     }
   } else for (let mask = 0; mask < 16; mask += 1) {
+    const selected = process.env.E1_CONFIG_MASKS;
+    if (selected && !selected.split(',').map((x) => Number(x.trim())).includes(mask)) continue;
     process.stdout.write(`E1 ${mask + 1}/16: defense mask ${mask}\n`);
     allSummaries.push(...await runConfiguration(mask));
   }
-  if (!onlyS11 && !policySweep) {
+  if (!onlyS11 && !policySweep && !skipDefaultConfirmation) {
     process.stdout.write('E1 default-window confirmation: S2/60s and S4/301s\n');
     allSummaries.push(...await runConfiguration(15, { suffix: '-DEFAULT', past: 300, future: 5, nonceTtl: 86400, sessionTtl: 900, fullScale: true }));
   }
@@ -345,7 +352,7 @@ async function main() {
   const scenarios = [...new Set(allSummaries.filter((r) => r.scenario_id !== 'LEGITIMATE_CONTROL').map((r) => r.scenario_id))];
   const latex = ['\\begin{tabular}{llrrrrl}', '\\toprule', 'Configuration & Scenario & Attempts & Accepted & Debits & Success rate & Wilson 95\\% CI \\\\', '\\midrule', ...allSummaries.filter((r) => r.scenario_id !== 'LEGITIMATE_CONTROL').map((r) => `${r.config_id} & ${r.scenario_id} & ${r.attempts} & ${r.http_accepted_count} & ${r.debited_count} & ${(100 * r.attack_success_rate).toFixed(2)}\\% & ${r.wilson95_low.toFixed(4)}--${r.wilson95_high.toFixed(4)} \\\\`), '\\bottomrule', '\\end{tabular}', ''];
   fs.writeFileSync(path.join(RUN_OUTPUT, 'summary.tex'), latex.join('\n'));
-  const runMetadata = { started, ended: new Date().toISOString(), elapsedSeconds: (Date.now() - Date.parse(started)) / 1000, nodeVersion: process.version, host: { platform: os.platform(), release: os.release(), architecture: process.arch, cpuModel: os.cpus()[0]?.model, totalRamBytes: os.totalmem() }, dataRunDirectory: path.relative(OUTPUT, RUN_OUTPUT).replace(/\\/g, '/'), randomSeed: RANDOM_SEED, randomSeedScope: 'deterministic scenario request IDs and nonces; server session credentials use the operating-system CSPRNG', scaledProfile: { timestampPastSeconds: PAST, timestampFutureSeconds: FUTURE, nonceTtlSeconds: NONCE_TTL, sessionTtlSeconds: SESSION_TTL }, defaultConfirmationProfile: { timestampPastSeconds: 300, futureToleranceSeconds: 5, nonceTtlSeconds: 86400, sessionTtlSeconds: 900, waits: { S2: 60, S4: 301 } }, keepAliveHttpAgent: true, proxyRedactLogin: true, moneyOracleLedgerSource: 'direct sqlite3 SELECT from the running server database after each scenario', allConfigs: 16, totalSummaryRows: allSummaries.length, scenarios: scenarios.length, allSummaries };
+  const runMetadata = { started, ended: new Date().toISOString(), elapsedSeconds: (Date.now() - Date.parse(started)) / 1000, nodeVersion: process.version, host: { platform: os.platform(), release: os.release(), architecture: process.arch, cpuModel: os.cpus()[0]?.model, totalRamBytes: os.totalmem() }, dataRunDirectory: path.relative(OUTPUT, RUN_OUTPUT).replace(/\\/g, '/'), randomSeed: RANDOM_SEED, randomSeedScope: 'deterministic scenario request IDs and nonces; server session credentials use the operating-system CSPRNG', configuredAttempts: ATTEMPTS, selectedConfigMasks: process.env.E1_CONFIG_MASKS || 'all', selectedPolicySweep: policySweep, skippedDefaultConfirmation: skipDefaultConfirmation, scaledProfile: { timestampPastSeconds: PAST, timestampFutureSeconds: FUTURE, nonceTtlSeconds: NONCE_TTL, sessionTtlSeconds: SESSION_TTL }, defaultConfirmationProfile: { timestampPastSeconds: 300, futureToleranceSeconds: 5, nonceTtlSeconds: 86400, sessionTtlSeconds: 900, waits: { S2: 60, S4: 301 } }, keepAliveHttpAgent: true, proxyRedactLogin: true, moneyOracleLedgerSource: 'direct sqlite3 SELECT from the running server database after each scenario', allConfigs: 16, totalSummaryRows: allSummaries.length, scenarios: scenarios.length, allSummaries };
   fs.writeFileSync(path.join(RUN_OUTPUT, 'run.json'), `${JSON.stringify(runMetadata, null, 2)}\n`);
   fs.copyFileSync(path.join(RUN_OUTPUT, 'summary.csv'), path.join(OUTPUT, 'summary.csv'));
   fs.copyFileSync(path.join(RUN_OUTPUT, 'summary.tex'), path.join(OUTPUT, 'summary.tex'));
diff --git a/experiments/e4a/run-fullscale.js b/experiments/e4a/run-fullscale.js
new file mode 100644
index 0000000..789047a
--- /dev/null
+++ b/experiments/e4a/run-fullscale.js
@@ -0,0 +1,85 @@
+const fs = require('fs');
+const os = require('os');
+const path = require('path');
+const crypto = require('crypto');
+const { spawn, execFileSync } = require('child_process');
+const sqlite3 = require('../../server/node_modules/sqlite3').verbose();
+require('../../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
+const { generateSignature } = require('../../server/utils/hmac');
+const { computeMoneyIntegrity } = require('../../server/utils/money-oracle');
+const { timedRequest } = require('../lib/http');
+
+const ROOT = path.resolve(__dirname, '../..');
+const OUTPUT = path.join(ROOT, 'experiments/results/e4a-fullscale');
+const RUN = path.join(OUTPUT, new Date().toISOString().replace(/[:.]/g, '-'));
+const WIDTH = 30;
+const DELAYS = [299, 301, 303, 305, 307];
+const BASE = 3800;
+const COMMIT = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
+const powerScheme = (() => { try { return execFileSync('powercfg', ['/getactivescheme'], { encoding: 'utf8' }).trim(); } catch { return 'unavailable'; } })();
+const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
+const writeCsv = (f, rows) => { const headers = Object.keys(rows[0] || {}); fs.writeFileSync(f, [headers.join(','), ...rows.map(r => headers.map(h => csvCell(r[h])).join(','))].join('\n') + '\n'); };
+function wilson(k, n) { const z=1.959963984540054,p=n?k/n:0,d=1+z*z/Math.max(n,1),c=(p+z*z/(2*Math.max(n,1)))/d,m=z*Math.sqrt((p*(1-p)+z*z/(4*Math.max(n,1)))/Math.max(n,1))/d;return[n?Math.max(0,c-m):0,n?Math.min(1,c+m):1]; }
+function child(exe,args,opts,stdout,stderr){const o=fs.openSync(stdout,'a'),e=fs.openSync(stderr,'a');const c=spawn(exe,args,{...opts,stdio:['ignore',o,e],windowsHide:true});c.once('exit',()=>{try{fs.closeSync(o)}catch{}try{fs.closeSync(e)}catch{}});return c;}
+async function stop(c){if(!c||c.exitCode!==null)return;c.kill();await Promise.race([new Promise(r=>c.once('exit',r)),new Promise(r=>setTimeout(r,3000))]);if(c.exitCode===null&&c.pid)spawn('taskkill',['/PID',String(c.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}
+async function ready(port,c){for(let i=0;i<300;i++){if(c.exitCode!==null)throw Error('server/proxy exited before ready');try{const r=await timedRequest(`http://127.0.0.1:${port}/api/health`);if(r.status===200)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error(`health timeout on ${port}`);}
+function payload(config,i){const p={method:'POST',path:'/api/withdraw',user_id:'anis_101',account_id:'acc_777',amount:1,currency:'BDT',timestamp:new Date(Date.now()+4000).toISOString(),nonce:`fullscale-${config}-${i}-${crypto.randomUUID()}`,request_id:`fullscale-${config}-${i}-${crypto.randomUUID()}`};return p;}
+function ledger(dbFile){const db=new sqlite3.Database(dbFile);return new Promise((resolve,reject)=>db.all('SELECT id,request_id,type,status,amount FROM transactions ORDER BY id',[],(e,rows)=>db.close(()=>e?reject(e):resolve(rows))));}
+async function runConfig(requestIdOn, offset){
+  const config=`H1T1N1R${requestIdOn?1:0}`,dir=path.join(RUN,config);fs.mkdirSync(dir,{recursive:true});
+  const port=BASE+offset,proxyPort=BASE+offset+2,dbFile=path.join(dir,'bank.sqlite');
+  const namespace=`fullscale-${config}-${process.pid}-${crypto.randomBytes(6).toString('hex')}`;
+  const capBase=path.join(os.tmpdir(),`cs-fullscale-${process.pid}-${config}-${crypto.randomBytes(6).toString('hex')}.json`);
+  const env={...process.env,PORT:String(port),HOST:'127.0.0.1',VIZ_PORT:String(port+1),VIZ_ENABLED:'false',DEMO_MODE:'false',LEGACY_SHARED_SECRET:'false',ENABLE_DEMO_ROUTES:'true',NONCE_STORE:'redis',NONCE_TTL:'300',NONCE_KEY_NAMESPACE:namespace,REDIS_URL:'redis://127.0.0.1:6379',SQLITE_DB:dbFile,TIMESTAMP_PAST_WINDOW_SECONDS:'300',TIMESTAMP_FUTURE_WINDOW_SECONDS:'5',SESSION_TTL:'900',IDEMPOTENCY_POLICY:'success_only',DEFENSE_HMAC:'true',DEFENSE_TIMESTAMP:'true',DEFENSE_NONCE:'true',DEFENSE_REQUEST_ID:String(requestIdOn),CHECK_ORDER:'hmac,timestamp,nonce,request_id,balance',EXPERIMENT_LOG:path.join(dir,'server-timings.csv'),CONFIG_ID:config,SCENARIO_ID:'E4a_fullscale',RUN_ID:`e4a-fullscale-${config}`};
+  const server=child(process.execPath,['server.js'],{cwd:path.join(ROOT,'server'),env},path.join(dir,'server.stdout.log'),path.join(dir,'server.stderr.log'));
+  let proxy; const started=new Date().toISOString(); const monotonicStart=process.hrtime.bigint();
+  try {
+    await ready(port,server);
+    const proxyEnv={...process.env,PROXY_UPSTREAM:`http://127.0.0.1:${port}`,PROXY_PORT:String(proxyPort),PROXY_CAPTURE_FILE:capBase,PROXY_WITHDRAW_CAPTURE_FILE:`${capBase}.withdraw.json`,PROXY_REDACT_LOGIN:'true'};
+    proxy=child(process.execPath,[path.join(ROOT,'experiments/recording-proxy.js')],{cwd:ROOT,env:proxyEnv},path.join(dir,'proxy.stdout.log'),path.join(dir,'proxy.stderr.log'));
+    await ready(proxyPort,proxy);
+    const login=await timedRequest(`http://127.0.0.1:${proxyPort}/api/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({user_id:'anis_101',pin:process.env.DEMO_PIN||'1234'})});
+    if(login.status!==200)throw Error(`login failed HTTP ${login.status}`);
+    const session=login.body;
+    const intents=[];
+    for(let trial=0;trial<WIDTH;trial++)for(const delay of DELAYS){
+      const p=payload(config,trial*DELAYS.length+DELAYS.indexOf(delay));p.signature=generateSignature(p,session.sessionKey);
+      const sent=await timedRequest(`http://127.0.0.1:${proxyPort}/api/withdraw`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${session.sessionToken}`},body:JSON.stringify(p)});
+      intents.push({trial,delay,p,first:sent});
+    }
+    const firstFailed=intents.filter(x=>x.first.status!==200||x.first.body.status!=='ACCEPTED');
+    if(firstFailed.length)throw Error(`baseline legitimate withdrawal failure count ${firstFailed.length}`);
+    const captureRows=fs.readFileSync(`${capBase}.jsonl`,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
+    const capById=new Map(captureRows.filter(x=>x.request.method==='POST'&&x.request.path==='/api/withdraw').map(x=>{const b=JSON.parse(x.request.body);return[b.request_id,x]}));
+    const replayResults=await Promise.all(intents.map(async item=>{
+      const cap=capById.get(item.p.request_id);if(!cap)throw Error('missing proxy-recorded withdrawal capture');
+      const target=BigInt(item.first.end_ns)+BigInt(item.delay)*1000000000n;
+      while(true){const remaining=target-process.hrtime.bigint();if(remaining<=0n)break;await new Promise(r=>setTimeout(r,Math.max(1,Number(remaining)/1e6)));}
+      const replay=await timedRequest(`http://127.0.0.1:${proxyPort}${cap.request.path}`,{method:cap.request.method,headers:{authorization:cap.request.headers.authorization,'content-type':cap.request.headers['content-type']},body:cap.request.body});
+      const actualDelay=Number(BigInt(replay.start_ns)-BigInt(item.first.end_ns))/1e9;
+      const reason=replay.body.reason||replay.body.error||replay.body.status||`HTTP_${replay.status}`;
+      return{configuration:config,trial:item.trial+1,intended_delay_seconds:item.delay,actual_delay_seconds:Number(actualDelay.toFixed(6)),http_status:replay.status,reason,request_id_hash:crypto.createHash('sha256').update(item.p.request_id).digest('hex'),ledger_debit:0};
+    }));
+    const rows=await ledger(dbFile), oracle=computeMoneyIntegrity(rows,intents.map(x=>({request_id:x.p.request_id,amount:x.p.amount,type:'WITHDRAW'})));
+    const successCountById=new Map();for(const r of rows)if(r.type==='WITHDRAW'&&r.status==='SUCCESS')successCountById.set(r.request_id,(successCountById.get(r.request_id)||0)+1);
+    for(const r of replayResults){const intent=intents.find(x=>crypto.createHash('sha256').update(x.p.request_id).digest('hex')===r.request_id_hash);r.ledger_debit=Number((successCountById.get(intent.p.request_id)||0)>1);}
+    writeCsv(path.join(dir,'requests.csv'),replayResults);
+    const summary=DELAYS.map(delay=>{const g=replayResults.filter(r=>r.intended_delay_seconds===delay),accepted=g.filter(r=>r.http_status===200&&r.reason==='ACCEPTED').length,ledgerDebits=g.reduce((s,r)=>s+r.ledger_debit,0),[lo,hi]=wilson(accepted,g.length);return{configuration:config,intended_delay_seconds:delay,attempts:g.length,accepted,ledger_debits:ledgerDebits,blocked:g.length-accepted,wilson95_low:lo,wilson95_high:hi,blocking_reasons:JSON.stringify(g.reduce((a,r)=>(a[r.reason]=(a[r.reason]||0)+1,a),{}))};});
+    writeCsv(path.join(dir,'summary.csv'),summary);
+    const duration=Number(process.hrtime.bigint()-monotonicStart)/1e9,ended=new Date().toISOString();
+    const metadata={configuration:config,started,ended,elapsed_seconds:duration,server_env:{HOST:'127.0.0.1',LEGACY_SHARED_SECRET:'false',VIZ_ENABLED:'false',DEMO_MODE:'false',DEFENSE_HMAC:'true',DEFENSE_TIMESTAMP:'true',DEFENSE_NONCE:'true',DEFENSE_REQUEST_ID:String(requestIdOn),IDEMPOTENCY_POLICY:'success_only',TIMESTAMP_PAST_WINDOW_SECONDS:300,TIMESTAMP_FUTURE_WINDOW_SECONDS:5,NONCE_TTL:300,SESSION_TTL:900,NONCE_STORE:'redis',REDIS_URL:'redis://127.0.0.1:6379'},client_clock_offset_seconds:4,delays_seconds:DELAYS,trials_per_delay:WIDTH,initial_legitimate_accepted:intents.length,capture:'recording proxy attacker-view; login request/response redacted; raw capture kept only in private temp and removed after run',oracle:{duplicate_debit_count:oracle.duplicate_debit_count,duplicate_debit_amount:oracle.duplicate_debit_amount,unauthorized_debit_amount:oracle.unauthorized_debit_amount,total_debited:oracle.total_debited,integrity_holds:oracle.integrity_holds},node:process.version,os:`${os.platform()} ${os.release()}`,cpu:os.cpus()[0]?.model,memory_bytes:os.totalmem(),memurai_version:'4.2.3',power_scheme:powerScheme,git_commit:COMMIT,raw_csv_sha256:{requests:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'requests.csv'))).digest('hex'),summary:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'summary.csv'))).digest('hex')},summary};
+    fs.writeFileSync(path.join(dir,'run.json'),JSON.stringify(metadata,null,2)+'\n');return metadata;
+  } finally {
+    await stop(proxy);await stop(server);
+    for(const suffix of ['', '.jsonl','.withdraw.json'])try{fs.rmSync(`${capBase}${suffix}`,{force:true});}catch{}
+    try{fs.rmSync(`${capBase}.${process.pid}.tmp`,{force:true});}catch{}
+  }
+}
+async function main(){
+  if(process.env.E4A_FULLSCALE!=='true')throw Error('Set E4A_FULLSCALE=true to explicitly enable this 307-second-per-configuration experiment.');
+  fs.mkdirSync(RUN,{recursive:true});const started=new Date().toISOString(),all=[];
+  all.push(await runConfig(false,0));all.push(await runConfig(true,10));
+  const meta={started,ended:new Date().toISOString(),elapsed_seconds:all.reduce((s,r)=>s+r.elapsed_seconds,0),git_commit:COMMIT,node:process.version,memurai_version:'4.2.3',power_scheme:powerScheme,profiles:all.map(x=>({configuration:x.configuration,elapsed_seconds:x.elapsed_seconds,summary:x.summary,run_json:path.relative(ROOT,path.join(RUN,x.configuration,'run.json'))}))};
+  fs.writeFileSync(path.join(RUN,'run.json'),JSON.stringify(meta,null,2)+'\n');process.stdout.write(JSON.stringify({output:path.relative(ROOT,RUN),elapsed_seconds:meta.elapsed_seconds,profiles:meta.profiles},null,2)+'\n');
+}
+main().catch(e=>{process.stderr.write(`${e.stack||e.message}\n`);process.exitCode=1;});
diff --git a/server/test/unit.test.js b/server/test/unit.test.js
index 029ad39..aaca791 100644
--- a/server/test/unit.test.js
+++ b/server/test/unit.test.js
@@ -9,6 +9,14 @@ const { sqliteRun } = require('../utils/nonce');
 const { validSignedRequest } = require('../utils/request');
 const { getStartupWarnings } = require('../utils/config-warnings');
 const { isTimestampWithinWindow } = require('../utils/timestamp');
+const { readAttemptCount } = require('../../experiments/e1/attempt-count');
+
+test('E1 attempt count defaults to 30 and accepts positive integer overrides', () => {
+  assert.equal(readAttemptCount(undefined), 30);
+  assert.equal(readAttemptCount('100'), 100);
+  assert.equal(readAttemptCount('0'), 30);
+  assert.equal(readAttemptCount('3.5'), 30);
+});
 
 test('server and E3 share the inclusive timestamp acceptance rule', () => {
   const now = Date.parse('2026-01-01T00:00:00.000Z');
```

## 4. Commands, times and environment

Measured environment: Windows 10 build 26200; Node v24.11.1; Memurai Developer 4.2.3 (Redis protocol version 7.4.9); Intel Core i5-8365U CPU @ 1.60GHz; RAM 8,395,841,536 bytes; power plan Balanced, GUID `381b4222-f694-41f0-9685-ff5bb260df2e`. The measured server used HOST=127.0.0.1, LEGACY_SHARED_SECRET=false, VIZ_ENABLED=false, DEMO_MODE=false, Redis `127.0.0.1:6379`, HMAC/timestamp/nonce enabled, request-ID varied, success_only, PAST=300 s, FUTURE=5 s, TTL=300 s, SESSION_TTL=900 s, clock offset +4 s, login redaction enabled.

The A/A2 aggregate started 2026-10-20T08:31:04.540Z and ended 2026-10-20T08:41:23.327Z (618.681 seconds). Individual configurations ran 309.3251383 s and 309.3559079 s. Metadata: `experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/run.json`; per-config env and timing metadata are in each config `run.json`.

The E1 run metadata records exact UTC start/end, elapsed time, selected masks, policy, seed scope, and scaled profile. Commands were:

```powershell
$env:E4A_FULLSCALE='true'; node experiments/e4a/run-fullscale.js
$env:E1_SCENARIO_FILTER='S11'; $env:E1_ATTEMPTS='100'; $env:E1_OUTPUT_DIR='experiments/results/round-f/B-s11-100'; node experiments/e1/run.js
$env:E1_POLICY_SWEEP='true'; $env:E1_CONFIG_MASKS='8-15'; $env:E1_ATTEMPTS='100'; $env:E1_SCENARIO_FILTER='S10_fast'; $env:E1_OUTPUT_DIR='experiments/results/round-f/B-S10-fast-R1'; node experiments/e1/run.js
$env:E1_POLICY_SWEEP='true'; $env:E1_CONFIG_MASKS='8-15'; $env:E1_ATTEMPTS='100'; $env:E1_SCENARIO_FILTER='S10_late'; $env:E1_OUTPUT_DIR='experiments/results/round-f/B-S10-late-R1'; node experiments/e1/run.js
$env:E1_POLICY_SWEEP='false'; $env:E1_CONFIG_MASKS='0-7'; $env:E1_ATTEMPTS='100'; $env:E1_SCENARIO_FILTER='S10_fast'; $env:E1_SKIP_DEFAULT_CONFIRMATION='true'; $env:E1_OUTPUT_DIR='experiments/results/round-f/B-S10-fast-R0'; node experiments/e1/run.js
$env:E1_POLICY_SWEEP='false'; $env:E1_CONFIG_MASKS='0-7'; $env:E1_ATTEMPTS='100'; $env:E1_SCENARIO_FILTER='S10_late'; $env:E1_SKIP_DEFAULT_CONFIRMATION='true'; $env:E1_OUTPUT_DIR='experiments/results/round-f/B-S10-late-R0'; node experiments/e1/run.js
$env:AUDIT_OUTPUT_DIR='experiments/results/round-f/audit-final4'; node experiments/audit/verify-results.js
npm.cmd test
```

Runtime and metadata paths: B-s11-100 45.224 s (`experiments/results/round-f/B-s11-100/run.json`); B-S10-fast-R1 47.690 s; B-S10-late-R1 141.893 s; B-S10-fast-R0 23.051 s; B-S10-late-R0 71.073 s (metadata at each run root). Test command started 2026-10-20T14:46:47.716+06:00, ended 2026-10-20T14:46:52.258+06:00; saved log `experiments/results/round-f-preflight/test-final.log`.

## 5. Full result tables and source hashes

### A/A2 per-delay counts and intervals

| Configuration | Delay | Trials | Accepted | Ledger replay debits | Wilson 95% | Reason |
|---|---:|---:|---:|---:|---|---|
| H1T1N1R0 | 299s | 30 | 0 | 0 | [0, 0.113513393173969] | {"NONCE_FAIL":30} |
| H1T1N1R0 | 301s | 30 | 30 | 30 | [0.886486606826031, 1] | {"ACCEPTED":30} |
| H1T1N1R0 | 303s | 30 | 30 | 30 | [0.886486606826031, 1] | {"ACCEPTED":30} |
| H1T1N1R0 | 305s | 30 | 0 | 0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0 | 307s | 30 | 0 | 0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1 | 299s | 30 | 0 | 0 | [0, 0.113513393173969] | {"NONCE_FAIL":30} |
| H1T1N1R1 | 301s | 30 | 0 | 0 | [0, 0.113513393173969] | {"ALREADY_PROCESSED":30} |
| H1T1N1R1 | 303s | 30 | 0 | 0 | [0, 0.113513393173969] | {"ALREADY_PROCESSED":30} |
| H1T1N1R1 | 305s | 30 | 0 | 0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1 | 307s | 30 | 0 | 0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |

Prediction tested: with TTL 300 s and a timestamp 4 s in the future, the replay window after nonce expiry is 300 s = delay < 304 s. In A the 301 s and 303 s batches were accepted (30/30 each); 299 s was rejected at NONCE_FAIL (0/30), and 305/307 s at TIMESTAMP_FAIL (0/30). This matches the stated prediction at the sampled delays. In A2, request-ID blocked all replays; 301/303 s were ALREADY_PROCESSED (0/30 accepted), 299 s NONCE_FAIL, and 305/307 s TIMESTAMP_FAIL. Initial valid requests were accepted 150/150 in each configuration.

### B: complete per-cell results

| Run | Configuration | Scenario | Attempts | SQLite debits / attempts | Wilson 95% | Blocking histogram |
|---|---|---|---:|---:|---:|---|
| B-s11-100 | H0T0N0R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T0N0R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T1N0R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T1N0R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T0N1R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T0N1R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T1N1R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T1N1R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T0N0R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T0N0R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T1N0R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T1N0R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T0N1R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T0N1R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T1N1R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T1N1R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-S10-fast-R1 | H0T0N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-fast-R1 | H1T0N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-fast-R1 | H0T1N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-fast-R1 | H1T1N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-fast-R1 | H0T0N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H1T0N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H0T1N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H1T1N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H0T0N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-fast-R1 | H1T0N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-fast-R1 | H0T1N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-fast-R1 | H1T1N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-fast-R1 | H0T0N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H1T0N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H0T1N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H1T1N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-late-R1 | H0T0N0R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-late-R1 | H1T0N0R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-late-R1 | H0T1N0R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H1T1N0R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H0T0N1R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
| B-S10-late-R1 | H1T0N1R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
| B-S10-late-R1 | H0T1N1R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H1T1N1R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H0T0N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-late-R1 | H1T0N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-late-R1 | H0T1N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H1T1N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H0T0N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":1,"NONCE_FAIL":99} |
| B-S10-late-R1 | H1T0N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":1,"NONCE_FAIL":99} |
| B-S10-late-R1 | H0T1N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H1T1N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-fast-R0 | H0T0N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-fast-R0 | H1T0N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-fast-R0 | H0T1N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-fast-R0 | H1T1N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-fast-R0 | H0T0N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R0 | H1T0N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R0 | H0T1N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R0 | H1T1N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-late-R0 | H0T0N0R0 | S10_late | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-late-R0 | H1T0N0R0 | S10_late | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-late-R0 | H0T1N0R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R0 | H1T1N0R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R0 | H0T0N1R0 | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
| B-S10-late-R0 | H1T0N1R0 | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
| B-S10-late-R0 | H0T1N1R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R0 | H1T1N1R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |

B headline: S11 had 100/100 debits with HMAC off in all 8 configurations (Wilson [0.963007, 1]); with HMAC on it had 0/100 in all 8 ([0, 0.036993], SIGNATURE_FAIL). S10 fast, request-ID off and nonce off had 5/100 late executions for each HMAC/timestamp combination; enabling nonce yielded 0/100. With request-ID on and success_only, nonce-off had 1/100, nonce-on 0/100. With any_outcome all tested request-ID-on cells were 0/100. S10 late timestamp-on cells were 0/100. With timestamp off and request-ID off, nonce-off had 5/100 and nonce-on 1/100; request-ID-on success_only had 1/100 when timestamp was off; any_outcome had 0/100.

### Raw CSV paths and SHA-256 values

A/A2 requests CSV hashes:
- `experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/H1T1N1R0/requests.csv` — `47fcc23e167def16075ec5cb129d9846be15cfe1bcc2f1d3681a05615ce56cc4`
- `experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/H1T1N1R1/requests.csv` — `cce0d46b2da4200f66257adf8ab866716740e89d4c14d6b0e32cf885a7a90e1c`

B raw requests CSV paths and SHA-256 values:

| Run | Config | Raw CSV | SHA-256 |
|---|---|---|---|
| B-s11-100 | H0T0N0R0 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N0R0/requests.csv` | `87d72f74508730990117c9f8ba134c7bc3a2f62e58f08375715e4b0d9c439aa6` |
| B-s11-100 | H1T0N0R0 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N0R0/requests.csv` | `6b4ed72da09c6d4ce803c5eb4c056b4f25237583a5c774adfd7cdbf6c7931244` |
| B-s11-100 | H0T1N0R0 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N0R0/requests.csv` | `5db50fcf90e57019359319c42701e25c9f04f4e0b1d006e19397f494a1578653` |
| B-s11-100 | H1T1N0R0 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N0R0/requests.csv` | `19c8c7efd0686c8cc8bc8f8bced9f6eb431780e9919a7737c7219462230b0fa3` |
| B-s11-100 | H0T0N1R0 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N1R0/requests.csv` | `a668c2d74c533999ac7fc7d8dd7aeae4ad193f28c426077e05925217d6dee48c` |
| B-s11-100 | H1T0N1R0 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N1R0/requests.csv` | `53dd7abf819ef31ccd78ba9fce7f0002a47ca0139133fcb071a41368be73d439` |
| B-s11-100 | H0T1N1R0 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N1R0/requests.csv` | `8e402b2df822e00896d75e330370dccf27e7ee8f91f5e23a433db265ff65e0dc` |
| B-s11-100 | H1T1N1R0 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N1R0/requests.csv` | `71be2bad4d078576e121517f537666226d31ff4ecfaaf1ef0918997f98ae65a0` |
| B-s11-100 | H0T0N0R1 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N0R1/requests.csv` | `840b17c87d5fe803ca30c588c4caae5e2d68aa76f2ec049fff66c8ceafd776d7` |
| B-s11-100 | H1T0N0R1 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N0R1/requests.csv` | `273f07fcdd0a8468185fcbc1686715f9a9375e35086606b2145e4ba78c253202` |
| B-s11-100 | H0T1N0R1 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N0R1/requests.csv` | `127fef2be83906575402d6f9c7f93cb27e7b0bc0cc0eae285acb66e3ec467650` |
| B-s11-100 | H1T1N0R1 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N0R1/requests.csv` | `2eb87b5d782af79a971299f555fd4c34cc59fd6bf73840ec8eee1115c8a84aa4` |
| B-s11-100 | H0T0N1R1 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N1R1/requests.csv` | `6fad96b5220a1609ecc3e5a381f2dcc5a22776387328f0a08417c0c26282ae1c` |
| B-s11-100 | H1T0N1R1 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N1R1/requests.csv` | `29b53d733109b7c9a36c1fc49bcd9bd6631a8d7b503752c47ca5649f1927cb68` |
| B-s11-100 | H0T1N1R1 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N1R1/requests.csv` | `92ea93839d79291a783e7faf86ecd5084951ccae2846d9fa8549cc3bbd2546ca` |
| B-s11-100 | H1T1N1R1 | `experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N1R1/requests.csv` | `2e6062f87aeee6fbf3af6febad864eb784933060048f3b4daec679598fb4375b` |
| B-S10-fast-R1 | H0T0N0R1-success_only | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N0R1-success_only/requests.csv` | `11e326e708956d5498911c1c55cabf5c08b582c6f6fade6fa8ba5d348e44896b` |
| B-S10-fast-R1 | H1T0N0R1-success_only | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N0R1-success_only/requests.csv` | `08c0cccf3d0ddee20ffdc1aba093f6fc9491c1bb3cc2ab8c916503d65a288871` |
| B-S10-fast-R1 | H0T1N0R1-success_only | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N0R1-success_only/requests.csv` | `dc455f6dd99e87d1ffc4b264bedb9621ac704240ed537667461fa4c35ec7400a` |
| B-S10-fast-R1 | H1T1N0R1-success_only | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N0R1-success_only/requests.csv` | `2dcb3c265530c0922ca5db62300246b85090256406bec3dc6988c1a51f8591b0` |
| B-S10-fast-R1 | H0T0N1R1-success_only | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N1R1-success_only/requests.csv` | `ed086446a53ee49916280d013ada0899165cdafdb57c30334611802096fefe86` |
| B-S10-fast-R1 | H1T0N1R1-success_only | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N1R1-success_only/requests.csv` | `0d45ce8098994305fc3755edec77f692c7c0bf549da1ce1fd340ccf2e8ebd65b` |
| B-S10-fast-R1 | H0T1N1R1-success_only | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N1R1-success_only/requests.csv` | `8044cde8afb1c6ae938cda5e5ebd1c96e280c1d6598780994c2da3873f5be53c` |
| B-S10-fast-R1 | H1T1N1R1-success_only | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N1R1-success_only/requests.csv` | `bd0407cd8c4528704a4ef2d424f9cd3bb0cb84d3369b1d9378d1f9d77ca003b3` |
| B-S10-fast-R1 | H0T0N0R1-any_outcome | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N0R1-any_outcome/requests.csv` | `14dcc6290ca147e721a903a93a38fcece9582d50ee9964fa2a5aa35cc44550d5` |
| B-S10-fast-R1 | H1T0N0R1-any_outcome | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N0R1-any_outcome/requests.csv` | `ddddd6198ef4fe1fecf866b9095b2d5a7e5c070b9cf71bd97ffda4029b509a5d` |
| B-S10-fast-R1 | H0T1N0R1-any_outcome | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N0R1-any_outcome/requests.csv` | `646114d9c58fff389c45835b2039b3064288e88ad0137d1ec84ebbb974038469` |
| B-S10-fast-R1 | H1T1N0R1-any_outcome | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N0R1-any_outcome/requests.csv` | `576274ad054eee8a7af023bab047160b6cdc5f021dc6d250797319c5c7567b9b` |
| B-S10-fast-R1 | H0T0N1R1-any_outcome | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N1R1-any_outcome/requests.csv` | `5f4e0da4571c55598a83b825b9b23847b0db11b2162dc5ec4aa965506f0cc812` |
| B-S10-fast-R1 | H1T0N1R1-any_outcome | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N1R1-any_outcome/requests.csv` | `c1cacee72e876ce1543ca95c47f42353fd9006c4598bac91a2e8fb1c5942c950` |
| B-S10-fast-R1 | H0T1N1R1-any_outcome | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N1R1-any_outcome/requests.csv` | `82a3dc78226e27697ad28393916c295b8395031c08680c7551b74c33fc162e4f` |
| B-S10-fast-R1 | H1T1N1R1-any_outcome | `experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N1R1-any_outcome/requests.csv` | `3a62a9f92fb3d3e8e92fd6fc6057c734e2e42d168bf0656d5cde441527820bee` |
| B-S10-late-R1 | H0T0N0R1-success_only | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N0R1-success_only/requests.csv` | `a7319125c3c06c2a1124a1612ae09898d47b4cb0731ad0538b96d78d9a3d2dd8` |
| B-S10-late-R1 | H1T0N0R1-success_only | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N0R1-success_only/requests.csv` | `f4366e988eb984e7748eb7aaa4470cb3e78cc8bc391af010ccd13b8343e631f7` |
| B-S10-late-R1 | H0T1N0R1-success_only | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N0R1-success_only/requests.csv` | `6f5d9cb4191adaf9bfec53e3a21c19a224fa67bf0a6d27a1427a661626764b1c` |
| B-S10-late-R1 | H1T1N0R1-success_only | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N0R1-success_only/requests.csv` | `0b2bff14d893085f2d3eb19c01b9f548a2f2322184b4fd4454f39c9b2d6be7f3` |
| B-S10-late-R1 | H0T0N1R1-success_only | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N1R1-success_only/requests.csv` | `a1952e0529bc88f706accec3d79e7f65c23e92a6dd4c39200af7c289e0f9b0da` |
| B-S10-late-R1 | H1T0N1R1-success_only | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N1R1-success_only/requests.csv` | `68b07272721597d3224af958efa6b01c2a1f97387c93bfba11eca4f1f61f5e75` |
| B-S10-late-R1 | H0T1N1R1-success_only | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N1R1-success_only/requests.csv` | `62b037640cf733c600734b2a61c6f52456f5885b8bb0ce2a6f95047c8962d024` |
| B-S10-late-R1 | H1T1N1R1-success_only | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N1R1-success_only/requests.csv` | `45c4b52673d6d2b4b8fbe86e3a67ab06ac6b1b7bcb79286317eb48d7316e8d74` |
| B-S10-late-R1 | H0T0N0R1-any_outcome | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N0R1-any_outcome/requests.csv` | `00ab3875c28bdc7444d2ad9abcc798c07d09f997a9a13043c06d8e0ae7207ab2` |
| B-S10-late-R1 | H1T0N0R1-any_outcome | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N0R1-any_outcome/requests.csv` | `d101e39136991eb8794e2465b98df9939dd0c0c78409b7d0d81ae0c0472c7b4e` |
| B-S10-late-R1 | H0T1N0R1-any_outcome | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N0R1-any_outcome/requests.csv` | `bd57e2cf4127de25e4fa952b5d0b22690f3f2b20b0fcf4b709d1443e78b35e41` |
| B-S10-late-R1 | H1T1N0R1-any_outcome | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N0R1-any_outcome/requests.csv` | `6c369bc30948e70ea585c00930c760b5b6910a8548210b890759ece2cb335f9c` |
| B-S10-late-R1 | H0T0N1R1-any_outcome | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N1R1-any_outcome/requests.csv` | `ff17f6db467f34353fa975168dd082dca3229d48410c03574bb7c003f2674046` |
| B-S10-late-R1 | H1T0N1R1-any_outcome | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N1R1-any_outcome/requests.csv` | `6dbd3ea2a6991fd7721a26c5443a3f86d3f870e3318e4552ceadb6410955cc40` |
| B-S10-late-R1 | H0T1N1R1-any_outcome | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N1R1-any_outcome/requests.csv` | `d11ed2e3e6ee4ffb1fb8e9d6bf968dc570544e2164b634648df84f4e2fe3825f` |
| B-S10-late-R1 | H1T1N1R1-any_outcome | `experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N1R1-any_outcome/requests.csv` | `6acdf55307fd58d33f168bf6dbad9781cddcf9182b7ec34bbdcb0308cd9f5073` |
| B-S10-fast-R0 | H0T0N0R0 | `experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N0R0/requests.csv` | `96d82c9ec40227b54f1c7f78954e7fdda30653c9553cbf2fcd4796f847f3c38c` |
| B-S10-fast-R0 | H1T0N0R0 | `experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N0R0/requests.csv` | `4429590d105ed0844db376d9d9b41ce68b319a82cae1485ed581c3cc07d3166c` |
| B-S10-fast-R0 | H0T1N0R0 | `experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N0R0/requests.csv` | `120a6ed9557ecca930ea96a2fea3d023a62ac28fbf330806bba7f9d7b8ce5ced` |
| B-S10-fast-R0 | H1T1N0R0 | `experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N0R0/requests.csv` | `86a2f3cfbcd64c81567ad37eb215056058984d5d4ebeaae90c107a6cbb38e261` |
| B-S10-fast-R0 | H0T0N1R0 | `experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N1R0/requests.csv` | `3b4df056f652380ad6ee4c0cd3e9c3d867ddbf7c0ae082444c34211387752306` |
| B-S10-fast-R0 | H1T0N1R0 | `experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N1R0/requests.csv` | `766c020683023464dbc6e400eadb99b22fcb652a0577bb365f1f87f6c9bddec2` |
| B-S10-fast-R0 | H0T1N1R0 | `experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N1R0/requests.csv` | `cb9ad7e44e8401413a4118f63b8e7bf637d1d8721a63d6147d007dca11ce478d` |
| B-S10-fast-R0 | H1T1N1R0 | `experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N1R0/requests.csv` | `8606ea74a04fdd98d2f4350fe647d66f63f70b4dd966259732348d74ef213585` |
| B-S10-late-R0 | H0T0N0R0 | `experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N0R0/requests.csv` | `1966967cae39b0c6044f4d5daaa7abe2ed17246c1ffd47d0b066cf31b357b370` |
| B-S10-late-R0 | H1T0N0R0 | `experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N0R0/requests.csv` | `cdc58eb7a645a4264780bbb01078b81c231319dc40877e38681394ad21de1f29` |
| B-S10-late-R0 | H0T1N0R0 | `experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N0R0/requests.csv` | `9f7c72c899541385bc98faaa781f83c7246c6048a2928178950335e05483c7eb` |
| B-S10-late-R0 | H1T1N0R0 | `experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N0R0/requests.csv` | `fe2c2655a46554d6fbb99c6f1c1edd244ed73d8229d668fe9090995987244d56` |
| B-S10-late-R0 | H0T0N1R0 | `experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N1R0/requests.csv` | `cb2a38b7486394b55c6be7b866be0eeff411707c47905163789220aff45932ff` |
| B-S10-late-R0 | H1T0N1R0 | `experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N1R0/requests.csv` | `c3e1a8ffd9b5cf33d93d508d347c093d0aeac9ff1510eda57c2063d3673c6fe1` |
| B-S10-late-R0 | H0T1N1R0 | `experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N1R0/requests.csv` | `b08e8bada9b968ac70363c8ee85d9166fd342e7f021ae11af17b2d5cb87f3f0f` |
| B-S10-late-R0 | H1T1N1R0 | `experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N1R0/requests.csv` | `da5b7bbafc9a085f66d8dde61ea38cc0eafacb529b30277de9ff7559f2241510` |

Full-scale raw files are `experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/H1T1N1R0/requests.csv` and the corresponding H1T1N1R1 path. B summary CSVs and run metadata reside at each `experiments/results/round-f/B-*/` root; per-cell requests CSVs are listed above. Raw database signatures were nulled after the measured SQLite oracle read and WAL checkpoint. Database request ID, type, amount, status and balance fields used by the independent audit remain intact.

## 6. Problems, reruns and superseded output

The first full-scale run (`experiments/results/e4a-fullscale/2026-10-20T08-25-32-622Z/run-failure.log`) failed in the runner after waiting for the first delayed replay because of an implicit BigInt-to-Number conversion in duration logging. It did not produce valid summary metrics and is excluded. The runner was minimally corrected to explicitly convert the BigInt difference, and A/A2 was rerun into a new directory. No earlier output directory was overwritten.

An early audit implementation produced 72 mismatches because the E1 raw CSV intentionally stores an empty attacker request_id_hash; the audit initially tried to match full request-ID hashes. The corrected audit selects ledger request IDs by the scenario-specific S10/S11 prefix, independently counts outcomes, and recomputes intervals. Final audit after DB signature redaction: 3306 values compared, 0 mismatches (`experiments/results/round-f/audit-final4/audit-report.json`).

Optional A3 was not run because A/A2 alone took 618.681 seconds and A3 was explicitly optional. No result was estimated or substituted.

## 7. Uncertainties and weak spots

- The +4 s offset and five delays test the specified default point only; this is not a sweep of all TTL/window values.
- The experiment uses localhost and Windows scheduling. The exact replay delays are recorded per request; wall-clock scheduling can affect small timing differences.
- S10 is intentionally an earlier failed withdrawal replayed after later funding; the outcome depends on nonce expiry, timestamp checks, idempotency policy and server order.
- Request IDs are not stored in the raw B request CSV; scenario-isolated SQLite IDs and prefixes are used by the separate ledger audit.
- The post-run NULLing of SQLite signature columns preserves values queried by the oracle/auditor, but the raw database is therefore privacy-sanitized rather than a byte-for-byte untouched server file.
- Memurai Developer 4.2.3 was used, not stock Redis. All latency is localhost latency.

## 8. Tests and audit

- `npm.cmd test`: 39 passed, 0 failed; log `experiments/results/round-f-preflight/test-final.log`.
- Independent audit: 3306 compared, 0 mismatches; `experiments/results/round-f/audit-final4/audit-report.json` and `.md`.

## 9. Git and status

Code/results documentation commit: `ec1988ca6fcdc72595b3730f4cca2cfe744ae171`. The report itself is committed in the subsequent local commit. No push was performed. Before this report was added, status included `M attack/payload.json` and four tracked correction files with line-ending-only changes (`clock-offsets-30-each.csv/.json`, `timestamp-boundaries-30-each.csv/.json`). These were left unstaged, as was attack/payload.json. No secrets were staged.

## 10. Secret scan

The report was scanned programmatically against the current configured HMAC secret without printing the secret. It contains 0 instances of the configured secret, 0 bearer/session credentials from saved captures, and 0 unlisted 64-hex-character values. Login response capture was redacted, private capture files were removed after the run, and SQLite stored signatures were nulled after the oracle query.

## Appendix: Round F results-pack section

## Round F: default-window TTL gap and higher-trial headline cells

New results only. Earlier result directories were not overwritten. A/A2 use default PAST=300 s, FUTURE=5 s, NONCE_TTL=300 s, client offset +4 s, SESSION_TTL=900 s, 30 independent captured requests at each delay. A used H1T1N1R0; A2 used H1T1N1R1. The tested rule predicts nonce rejection before expiry, replay acceptance after nonce expiry while timestamp age remains below 304 s, then timestamp rejection.

| Run | Intended delay | attempts | accepted / ledger replay debits | Wilson 95% | reasons |
|---|---:|---:|---:|---:|---|
| H1T1N1R0 | 299s | 30 | 0/0 | [0, 0.113513393173969] | {"NONCE_FAIL":30} |
| H1T1N1R0 | 301s | 30 | 30/30 | [0.886486606826031, 1] | {"ACCEPTED":30} |
| H1T1N1R0 | 303s | 30 | 30/30 | [0.886486606826031, 1] | {"ACCEPTED":30} |
| H1T1N1R0 | 305s | 30 | 0/0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0 | 307s | 30 | 0/0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1 | 299s | 30 | 0/0 | [0, 0.113513393173969] | {"NONCE_FAIL":30} |
| H1T1N1R1 | 301s | 30 | 0/0 | [0, 0.113513393173969] | {"ALREADY_PROCESSED":30} |
| H1T1N1R1 | 303s | 30 | 0/0 | [0, 0.113513393173969] | {"ALREADY_PROCESSED":30} |
| H1T1N1R1 | 305s | 30 | 0/0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1 | 307s | 30 | 0/0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |

The observed A sequence is 0, 30, 30, 0, 0 accepted at 299/301/303/305/307 s, matching the prediction. A2 accepted 0 at every delay; 301 s and 303 s were stopped by request-ID idempotency (`ALREADY_PROCESSED`). Each table is aggregated from the corresponding requests.csv; SQLite ledger counts and timing fields are saved alongside it.

| Config | Raw requests CSV | SHA-256 | Metadata |
|---|---|---|---|
| H1T1N1R0 | $f | $hash | $full/H1T1N1R0/run.json |
| H1T1N1R1 | $f | $hash | $full/H1T1N1R1/run.json |

### B: 100 attempts per requested cell

The per-cell Wilson intervals below use the exact Wilson score formula and the SQLite ledger oracle debit count as successes. Controls are 30/30 accepted in every configuration and omitted here for compactness; they are present in each raw summary. Each run has a summary.csv, per-config requests.csv, SQLite database, run.json, and console.log.

| Run | config | scenario | attempts | oracle debits / attempts | Wilson 95% | blocking reasons |
|---|---|---|---:|---:|---:|---|
| B-S10-fast-R0 | H0T0N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-fast-R0 | H1T0N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-fast-R0 | H0T1N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-fast-R0 | H1T1N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-fast-R0 | H0T0N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R0 | H1T0N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R0 | H0T1N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R0 | H1T1N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H0T0N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-fast-R1 | H1T0N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-fast-R1 | H0T1N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-fast-R1 | H1T1N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-fast-R1 | H0T0N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H1T0N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H0T1N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H1T1N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H0T0N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-fast-R1 | H1T0N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-fast-R1 | H0T1N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-fast-R1 | H1T1N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-fast-R1 | H0T0N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H1T0N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H0T1N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H1T1N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-late-R0 | H0T0N0R0 | S10_late | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-late-R0 | H1T0N0R0 | S10_late | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-late-R0 | H0T1N0R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R0 | H1T1N0R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R0 | H0T0N1R0 | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
| B-S10-late-R0 | H1T0N1R0 | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
| B-S10-late-R0 | H0T1N1R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R0 | H1T1N1R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H0T0N0R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-late-R1 | H1T0N0R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-late-R1 | H0T1N0R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H1T1N0R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H0T0N1R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
| B-S10-late-R1 | H1T0N1R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
| B-S10-late-R1 | H0T1N1R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H1T1N1R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H0T0N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-late-R1 | H1T0N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-late-R1 | H0T1N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H1T1N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H0T0N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":1,"NONCE_FAIL":99} |
| B-S10-late-R1 | H1T0N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":1,"NONCE_FAIL":99} |
| B-S10-late-R1 | H0T1N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H1T1N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-s11-100 | H0T0N0R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T0N0R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T1N0R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T1N0R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T0N1R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T0N1R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T1N1R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T1N1R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T0N0R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T0N0R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T1N0R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T1N0R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T0N1R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T0N1R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T1N1R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T1N1R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |

Headline: S11 produced 100/100 debits when HMAC was disabled (all 8 such configurations; Wilson [0.9630, 1.0000]) and 0/100 when HMAC was enabled (all 8; [0.0000, 0.0370], `SIGNATURE_FAIL`). For S10_fast with request-ID disabled and nonce disabled, each of four HMAC/timestamp combinations produced 5/100 late executions after funding (Wilson [0.0215, 0.1118]); enabling nonce reduced these to 0/100. With request-ID enabled under success_only, all nonce-disabled cells produced 1/100 and nonce-enabled cells 0/100; under any_outcome all produced 0/100. For S10_late, HMAC is irrelevant; timestamp-enabled cells were 0/100. Request-ID-off, timestamp-off cells had 5/100 for no nonce and 1/100 for nonce. Request-ID-on success_only had 1/100 with timestamp off; any_outcome produced 0/100.

| Run | summary.csv | SHA-256 | run.json |
|---|---|---|---|
| B-S10-fast-R0 | $f | $hash | experiments/results/round-f/B-S10-fast-R0/run.json |
| B-S10-fast-R1 | $f | $hash | experiments/results/round-f/B-S10-fast-R1/run.json |
| B-S10-late-R0 | $f | $hash | experiments/results/round-f/B-S10-late-R0/run.json |
| B-S10-late-R1 | $f | $hash | experiments/results/round-f/B-S10-late-R1/run.json |
| B-s11-100 | $f | $hash | experiments/results/round-f/B-s11-100/run.json |

Privacy treatment: the post-run SQLite files retained the transaction and balance columns used by the oracle. After the oracle queries completed, stored signature column values were set to NULL and the files checkpointed; this removes signatures from the deliverable artifacts without changing ledger outcome fields. The independent audit was rerun successfully against these sanitized SQLite files at experiments/results/round-f/audit-final4/audit-report.json.

Scan counts: configured-secret matches 0; bearer-value pattern matches 0; session-credential field-value matches 0; 64-hex occurrences 72, all matched SHA-256 values of files under experiments/results; unlisted 64-hex values 0. The scan reads the active secret only in memory and never prints it.

## Round F audit reconciliation clarification

The original chat summary's statement that attacker rows carried a 12-character request-ID hash prefix was incorrect. Evidence: the raw attacker rows in each Round F B `requests.csv` have an empty `request_id_hash` field (the header is present; inspect an attacker row), while the SQLite ledger stores full request IDs. The first independent audit therefore tried to match successful ledger rows to an empty set and reported 72 count/interval mismatches; see `experiments/results/round-f/audit-final/audit-report.md`. The final auditor uses each fresh per-configuration SQLite database and selects successful withdrawal rows by the scenario-specific request-ID prefix (`s11-r-` for S11, `s10-` for S10), then recomputes debit counts and Wilson intervals against that CSV's scenario/config attempt rows. This is an aggregate join by isolated run/configuration/scenario, not a per-row request-ID join. Evidence of the corrected code is the Round F block in `experiments/audit/verify-results.js`; the final post-redaction audit is `experiments/results/round-f/audit-final4/audit-report.json` (3306 compared, zero mismatches).
