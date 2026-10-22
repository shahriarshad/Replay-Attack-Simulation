'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
function csv(text){const lines=text.trim().split(/\r?\n/);function parse(line){const out=[];let v='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(q&&c==='"'&&line[i+1]==='"'){v+='"';i++;}else if(c==='"')q=!q;else if(c===','&&!q){out.push(v);v='';}else v+=c;}out.push(v);return out;}const h=parse(lines.shift());return lines.map(line=>Object.fromEntries(parse(line).map((v,i)=>[h[i],v])));}
const read=p=>csv(fs.readFileSync(path.join(ROOT,p),'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
const ci=r=>`[${Number(r.wilson95_low).toFixed(4)}, ${Number(r.wilson95_high).toFixed(4)}]`;
const histogram=s=>{try{return Object.entries(JSON.parse(s||'{}')).map(([k,v])=>`${k}:${v}`).join('; ')||'none';}catch{return String(s||'none');}};
const diffPath='experiments/results/round-i/e1-v2-v3-cell-differences.csv';
const e1Path='experiments/results/e1-v3/round-i-scaled/summary.csv';
const s11Path='experiments/results/e1-v3-s11/round-i-s11/summary.csv';
const s10Root='experiments/results/e1-v3-s10-independent';
const s10Run=fs.readdirSync(path.join(ROOT,s10Root)).filter(n=>/^\d{4}-/.test(n)).sort().at(-1);
const s10Path=`${s10Root}/${s10Run}/summary.csv`;
const retryPath='experiments/results/round-i/s10-independent/resubmission/summary.csv';
const routePath='experiments/results/round-i/route-binding/requests.csv';
const atomicPath='experiments/results/round-i/atomic-debit/runs.csv';
const e4cPath='experiments/results/round-i/e4c-exact/e4c.csv';
const e1=read(e1Path),s11=read(s11Path).filter(r=>r.scenario_id==='S11'),s10=read(s10Path),retry=read(retryPath),route=read(routePath),atomic=read(atomicPath),e4c=read(e4cPath);
const differences=read(diffPath),defaultRows=e1.filter(r=>r.config_id==='H1T1N1R1-DEFAULT'&&r.scenario_id!=='LEGITIMATE_CONTROL');
const s10Table=s10.map(r=>`| ${r.config_id} | ${r.policy} | ${r.scenario_id.replace('S10_indep_','')} | ${r.delayed_execution_count}/${r.attempts} | ${ci(r)} | ${histogram(r.replay_reason_histogram)} |`);
const s11Table=s11.map(r=>`| ${r.config_id} | ${r.debited_count}/${r.attempts} | ${ci(r)} | ${histogram(r.blocking_reason_histogram)} |`);
const e4cTable=e4c.filter(r=>r.kind==='summary').map(r=>{const m=/loss-p([0-9.]+)-(default|request_id_before_nonce)-(same-signed|fresh-nonce-same-request-id)/.exec(r.case);if(!m)throw Error(`invalid E4c case ${r.case}`);return `| ${m[1]} | ${m[2]} | ${m[3]} | ${r.lost_responses}/200 | ${histogram(r.client_failure_reasons)} | ${r.exactly_one_debit_request_ids}/200 | ${r.reason_confirms_success_count} |`;});
const minBal=Math.min(...atomic.map(r=>Number(r.minimum_balance_from_ledger)));
const debitSums=[...new Set(atomic.map(r=>Number(r.success_debit_sum)))].sort((a,b)=>a-b).join(', ');
const lines=[
'','', '## Round I — final experimental addendum','',
'All new outputs are under Round I directories; older result folders were left untouched. Environment: Node v24.11.1, Windows, Memurai Developer 4.2.3, localhost only. E1 v2 used TTL 4 s, deliberately shorter than PAST 6 s (a mis-configured profile). E1 v3 used PAST=6 s, FUTURE=2 s, NONCE_TTL=8 s, SESSION_TTL=15 s, success_only. The default-window confirmation used PAST=300 s, FUTURE=5 s, NONCE_TTL=300 s, SESSION_TTL=900 s.','',
'### Provenance','',
'| Artifact | SHA-256 |','|---|---|',
`| ${e1Path} | ${sha(e1Path)} |`,`| ${s10Path} | ${sha(s10Path)} |`,`| ${s11Path} | ${sha(s11Path)} |`,`| ${retryPath} | ${sha(retryPath)} |`,`| ${routePath} | ${sha(routePath)} |`,`| ${atomicPath} | ${sha(atomicPath)} |`,`| ${e4cPath} | ${sha(e4cPath)} |`,'',
'### E1 v2 versus v3','',
`${differences.length} cells differ in count or attempt denominator. Two cells changed success rate: S4 for H0T0N1R0 and H1T0N1R0. The old 4 s TTL expired by the 7 s replay; the clean 8 s TTL remained live and blocked it. S11 changed from 30 to 100 attempts per configuration; its success rate was unchanged in every configuration. Full comparison: ${diffPath}.`,'',
'| Configuration | Scenario | E1 v2 k/n | E1 v3 k/n |','|---|---|---:|---:|',
...differences.filter(r=>r.difference_kind==='SUCCESS_RATE_CHANGED').map(r=>`| ${r.config_id} | ${r.scenario_id} | ${r.v2_successes}/${r.v2_attempts} | ${r.v3_successes}/${r.v3_attempts} |`),'',
'Default-window confirmation:','',
'| Scenario | Attempts | HTTP accepted / SQLite debits | Wilson 95% | Blocking reasons |','|---|---:|---:|---|---|',
...defaultRows.map(r=>`| ${r.scenario_id} | ${r.attempts} | ${r.http_accepted_count}/${r.debited_count} | ${ci(r)} | ${histogram(r.blocking_reason_histogram)} |`),'',
'### S10 independent trials','',
'Each cell used 30 distinct failed request IDs and nonces, withdrawal amount 100, initial balance 1, one 3,001 deposit (post-funding balance 3,002), then replayed each failed capture exactly once. The output is delayed SQLite executions by request ID.','',
'| Configuration | Policy | Scenario | Delayed executions | Wilson 95% | Blocking reason histogram |','|---|---|---|---:|---|---|',...s10Table,'',
'### S11 token-only forgery','',
'The attacker had the captured bearer token but no session signing key; each attempt was a fresh withdrawal with amount 1 and an absent signature.','',
'| Configuration | SQLite debits / attempts | Wilson 95% | Blocking reason |','|---|---:|---|---|',...s11Table,'',
'### Resubmission after funding','',
'| Policy | Variant | Successes / attempts | Wilson 95% | SQLite success debits | Reasons |','|---|---|---:|---|---:|---|',
...retry.map(r=>`| ${r.policy} | ${r.variant} | ${r.successes}/${r.attempts} | ${ci(r)} | ${r.sqlite_success_debits} | ${histogram(r.reason_histogram)} |`),'',
'### I3 correctness checks','',
`Route binding: the four cases in ${routePath} were rejected as INVALID_REQUEST with zero matching ledger rows, both with HMAC enabled and disabled. Atomic debit: 30 fresh-state runs, each with 100 parallel valid withdrawals of amounts 1..100 against balance 100. All satisfy nonnegative balance, debit sum at most 100, and final balance plus successful debits equal 100. The lowest reconstructed balance was ${minBal}; distinct observed successful-debit sums were ${debitSums}. Raw per-run CSV: ${atomicPath}; sanitized ledger rows: experiments/results/round-i/atomic-debit/ledger.csv.`,'',
'### E4c exact-count loss sampling','',
'The new seeded Fisher-Yates pattern selects exactly round(p x 200) positions and shares the pattern for cells with the same p.','',
'| p | Check order | Retry type | Lost responses | Retry reasons | Exactly-one debits | ALREADY_PROCESSED success clues |','|---:|---|---|---:|---|---:|---:|',...e4cTable,'',
'The prior E4c output is superseded. Its old generator drew 200 independent Bernoulli outcomes using an LCG: function lossPattern(p){let x=(0xE4C2026+(Math.round(p*1000)*2654435761))>>>0;const out=[];for(let i=0;i<200;i++){x=(1664525*x+1013904223)>>>0;out.push(x/4294967296<p);}return out;}. It did not enforce an exact count; the old saved output happened to contain 3 losses at p=0.05 and 44 at p=0.2. New raw data: '+e4cPath+'.'
];
const resultsFile=path.join(ROOT,'docs/RESULTS_PACK_A.md');let results=fs.readFileSync(resultsFile,'utf8').replace(/\n## Round I — final experimental addendum[\s\S]*$/,'');fs.writeFileSync(resultsFile,results+lines.join('\n'),'utf8');
const claimLines=['','', '## Round I claim scope','',
'1. Four-layer leave-one-out evidence is scoped to E1 v3 (PAST=6 s, FUTURE=2 s, NONCE_TTL=8 s, SESSION_TTL=15 s, success_only). Ordinary S1-S9 use 30 attempts (S5 uses 1,500); S11 uses 100 attempts. “None” still retains session bearer authentication and account ownership.','',
'2. The idempotency policy trade-off uses independent S10 trials: 30 distinct failed requests and one replay per failed request. Under success_only, retries can execute after funding if the other enabled freshness layer does not block them. Under any_outcome with request-ID on, the same request ID returned ALREADY_PROCESSED. The separate resubmission rows use 30 trials per policy and retry variant.','',
'3. The scaled-time TTL result is reproduced: E1 v2 used the deliberately short, mis-configured 4 s TTL; E1 v3 uses 8 s with PAST=6 s and FUTURE=2 s. S4 changed only in the nonce-on/request-ID-off cells, where the v2 replay succeeded and v3 replay was blocked. This round did not rerun E4a or the default full-scale TTL-gap experiment.','',
'See the Round I raw paths and hashes in RESULTS_PACK_A.md. Route binding and atomic debit were checked only in this local simulation; they do not establish multi-process production behavior.'];
const claimsFile=path.join(ROOT,'docs/CLAIMS_EVIDENCE.md');let claims=fs.readFileSync(claimsFile,'utf8').replace(/\n## Round I claim scope[\s\S]*$/,'');fs.writeFileSync(claimsFile,claims+claimLines.join('\n'),'utf8');
process.stdout.write(`Updated docs from raw Round I CSVs; rate-change cells=${differences.filter(r=>r.difference_kind==='SUCCESS_RATE_CHANGED').length}; S10 cells=${s10.length}; S11 cells=${s11.length}; E4c cells=${e4c.filter(r=>r.kind==='summary').length}; atomic runs=${atomic.length}; lowest reconstructed balance=${minBal}\n`);
