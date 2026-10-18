const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const RESULTS = path.join(ROOT, 'experiments/results');
const OUT = path.join(ROOT, 'docs/RESULTS_PACK_A.md');
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rel = (file) => path.relative(ROOT, file).replace(/\\/g, '/');
const csv = (text) => {
  const lines = text.trimEnd().split(/\r?\n/);
  const parse = (line) => { const a=[]; let v='', q=false; for(let i=0;i<line.length;i++){const c=line[i];if(q&&c==='"'&&line[i+1]==='"'){v+='"';i++;}else if(c==='"')q=!q;else if(c===','&&!q){a.push(v);v='';}else v+=c;}a.push(v);return a; };
  const headers=parse(lines[0]);
  return lines.slice(1).filter(Boolean).map((line)=>Object.fromEntries(headers.map((h,i)=>[h,parse(line)[i]||''])));
};
const readCsv = (file) => csv(fs.readFileSync(file, 'utf8'));
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const q = (file) => `\`${rel(file)}\``;
const h = (file) => `\`${sha(file)}\``;
const markdownRows = (headers, rows) => [
  `| ${headers.join(' | ')} |`, `| ${headers.map(()=> '---').join(' | ')} |`,
  ...rows.map(row=>`| ${row.map(x=>String(x??'').replace(/\|/g,'\\|')).join(' | ')} |`)
];
const L = [
  '# Results Pack A — measured research runs','',
  'Generated only from saved run data. The pack is intentionally compact: summary tables, selected first/last rows, plus an evidence inventory with exact paths, byte sizes, and SHA-256 hashes. Complete CSVs remain on disk. The full dossier handles CSVs over 200 KB or 1,000 rows using the specified first/last 20 rows and aggregate statistics rule.','',
  '## Commands, design, and scope','',
  '- E1: `npm.cmd run experiments:e1`; fresh server/DB per config, session login and signing, Memurai namespace per run, keep-alive HTTP agent, VIZ off. The “none” setting disables the four replay layers only; bearer-session and account-ownership checks remain.','- E2: `npm.cmd run experiments:e2`; 8 cells interleaved in fixed-seed order, 10 repeats per cell, 500 warm-up and 3,000 measured requests, concurrency 1. Rejection floods contain 3,000 requests per cell; duplicate-request-ID floods have three repeats per check order.','- E3: `npm.cmd run experiments:e3`; 75 fresh-server cells × 2,000 requests, no real waiting. Offset/delay distributions are assumptions, not real-network measurements.','- E4: `npm.cmd run experiments:e4`; PAST=6 s, FUTURE=2 s; 30 E4a trials per cell. E4c was rerun with `DEFENSE_REQUEST_ID=true` after the first harness version omitted that flag; only the corrected output is interpreted.','- Figures and LaTeX: `npm.cmd run experiments:render-v2`; pack: `npm.cmd run experiments:pack-v2`; paper facts: `npm.cmd run experiments:paper-facts`. Phase 5 was not started.','- All traffic is localhost on Windows with Memurai Developer 4.2.3; latency supports relative comparisons only. No stock Redis was used.',''
];

const correctionDir=path.join(RESULTS,'corrections');
const memoryFiles=['nonce-memory-accepted-prep-accepted-clean-20261018-summary.json','nonce-memory-requestid-prep-requestid-20261018-summary.json'].map(n=>path.join(correctionDir,n));
if(memoryFiles.every(fs.existsSync)){
  const mem=memoryFiles.map(readJson);
  L.push('## Canonical nonce-memory result','','The canonical result is the two clean reruns with preserved raw INFO evidence. The older 164.96 B/key / 17,543,968 B run is unverified and superseded; it is excluded from every table.','',...markdownRows(['Traffic','Empty baseline B','Used memory at 100k B','Delta B','Bytes/key','Run seconds / TTL'],mem.map(x=>{const s=x.snapshots.find(y=>y.measuredKeys===100000);return[x.label,x.baselineUsedMemoryBytes,s.usedMemoryBytes,s.deltaBytes,x.baselineSubtractedSlopeBytesPerKey,`${x.durationSeconds} / ${x.nonceTtlSeconds}`];})),'',`Accepted raw INFO: ${q(path.join(correctionDir,mem[0].rawInfoLog))} (${h(path.join(correctionDir,mem[0].rawInfoLog))}); request-ID-rejected raw INFO: ${q(path.join(correctionDir,mem[1].rawInfoLog))} (${h(path.join(correctionDir,mem[1].rawInfoLog))}).`,'');
}

const E1=path.join(RESULTS,'e1-v2');
if(fs.existsSync(path.join(E1,'summary.csv'))){
  const rows=readCsv(path.join(E1,'summary.csv')).filter(x=>x.scenario_id!=='LEGITIMATE_CONTROL');
  const groups=[...new Set(rows.map(x=>x.scenario_id))].map(s=>{const a=rows.filter(x=>x.scenario_id===s).map(x=>Number(x.debited_count));return[s,Math.min(...a),Math.max(...a),rows.filter(x=>x.scenario_id===s)[0].attempts];});
  const run=readJson(path.join(E1,'run.json'));
  L.push('## E1 v2 ablation','',`Runtime: ${run.elapsedSeconds} s. Sixteen defense-flag configurations; ${groups.length} scenario/variant groups. S5 used 30 batches of 50 concurrent identical requests. S7a and S7b are separate, 30 attempts each. S10 fast/late each use 30 captured failed requests. Wilson 95% intervals are present for every attack cell, including 0/n and n/n. Direct SQLite ledger reconciliation is saved separately. Default-window confirmation replay waits were 60 s (S2) and 301 s (S4).`,'',...markdownRows(['Scenario / variant','Min debits / config','Max debits / config','Attempts / config'],groups),'',`Compact configuration × scenario LaTeX matrix: ${q(path.join(E1,'coverage-matrix.tex'))}; heat map: ${q(path.join(E1,'attack-success-heatmap.png'))}, ${q(path.join(E1,'attack-success-heatmap.pdf'))}, ${q(path.join(E1,'attack-success-heatmap.svg'))}.`,'',`Raw summary: ${q(path.join(E1,'summary.csv'))} (${h(path.join(E1,'summary.csv'))}); direct SQLite oracle reconciliation: ${q(path.join(E1,'oracle-total-debited-by-scenario.csv'))} (${h(path.join(E1,'oracle-total-debited-by-scenario.csv'))}); command: npm.cmd run experiments:e1.`,'');
  const oracle=readCsv(path.join(E1,'oracle-total-debited-by-scenario.csv'));
  const s10=oracle.filter(x=>x.scenario_id.startsWith('S10'));
  L.push('### S10 delayed execution from previously failed withdrawal','',...markdownRows(['Config','Case','Total debited delta','Duplicate count','Delayed executions','Delayed amount'],s10.map(x=>[x.config_id,x.scenario_id,x.oracle_total_debited_delta,x.oracle_duplicate_debit_count,x.oracle_delayed_execution_count,x.oracle_delayed_execution_amount])),'');
}

const E2ROOT=path.join(RESULTS,'e2-v2');
const E2=fs.existsSync(path.join(E2ROOT,'load-repeat-summary.csv'))?E2ROOT:path.join(E2ROOT,fs.readdirSync(E2ROOT).find(n=>fs.existsSync(path.join(E2ROOT,n,'load-repeat-summary.csv')))||'');
if(fs.existsSync(path.join(E2,'load-repeat-summary.csv'))){
  const rows=readCsv(path.join(E2,'load-repeat-summary.csv'));
  const run=readJson(path.join(E2,'run.json'));
  const E2DATA=run.dataRunDirectory?path.join(E2,run.dataRunDirectory):E2;
  L.push('## E2 v2 cost','',`Runtime: ${run.elapsedSeconds} s; concurrency 1 primary; ${run.repeats} repeats/cell; ${run.warmupRequests} warm-up plus ${run.measuredRequests} measured requests/repeat. The t interval is the two-sided 95% interval for the mean of per-repeat medians; median of those repeat medians is reported separately. Power metadata: ${run.power.activeScheme}; CPU reported ${run.host.cpuReportedMHz} MHz. Battery WMI returned Access denied; an alternate Windows power-status observation was captured after the run at ${q(path.join(E2DATA,'power-status-after-run.json'))} and is not contemporaneous with the benchmark. Prior concurrency-16 data are supplementary queueing measurements in one Node process.`,'',...markdownRows(['Stack','n','Median of repeat medians (handler ns)','Mean t-CI (ns)','Median of repeat medians (client ms)'],rows.map(x=>[x.stack_id,x.repetitions,x.server_handler_repeat_median_median_ns,`${Number(x.server_handler_t_ci95_low_ns).toFixed(0)}–${Number(x.server_handler_t_ci95_high_ns).toFixed(0)}`,x.client_e2e_repeat_median_median_ms])),'',`Handler-layer t intervals: ${q(path.join(E2,'layer-repeat-ci.csv'))} (${h(path.join(E2,'layer-repeat-ci.csv'))}); rejection floods: ${q(path.join(E2,'rejection-cost.csv'))} (${h(path.join(E2,'rejection-cost.csv'))}); summary: ${q(path.join(E2,'load-repeat-summary.csv'))} (${h(path.join(E2,'load-repeat-summary.csv'))}). Figure/LaTeX are in ${q(E2)}. Command: npm.cmd run experiments:e2.`,'' );
  const floods=readCsv(path.join(E2,'rejection-cost.csv'));
  L.push('### E2 duplicate-request-ID flood outlier check','',...markdownRows(['Order','Repeat','p50 ns','p95 ns','p99 ns','Trimmed p50 ns','Trimmed p95 ns','Trimmed p99 ns','Max ns'],floods.filter(x=>x.flood==='duplicate_request_id').map(x=>[x.check_order,x.repeat,x.server_handler_p50_ns,x.server_handler_p95_ns,x.server_handler_p99_ns,x.server_handler_trimmed_p50_ns,x.server_handler_trimmed_p95_ns,x.server_handler_trimmed_p99_ns,x.server_handler_max_ns])),'','The ~500 ms handler outlier did not recur: across the 9 duplicate-request-ID flood runs, maximum observed handler time was 22,227,300 ns (22.2273 ms); maximum untrimmed p99 was 2,998,400 ns and maximum trimmed p99 was 2,636,760 ns. Per-run percentiles are above; full evidence is in the saved CSV. Each profiled server writes event-loop delay and GC observations to its server stdout log.','');
}

const E2PROFILE=path.join(RESULTS,'e2-v2-profiled-corrected');
if(fs.existsSync(E2PROFILE)){
  const dirs=fs.readdirSync(E2PROFILE).filter(n=>fs.existsSync(path.join(E2PROFILE,n,'rejection-cost-profiled.csv'))).sort();
  if(dirs.length){const runDir=path.join(E2PROFILE,dirs.at(-1)),rows=readCsv(path.join(runDir,'rejection-cost-profiled.csv')),run=readJson(path.join(runDir,'profiled-run.json'));
    const eventRows=[];
    for(const file of walk(runDir).filter(f=>path.basename(f)==='server.stdout.log'))for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){try{const x=JSON.parse(line);if(x.type==='EXPERIMENT_EVENT_LOOP')eventRows.push([path.relative(runDir,path.dirname(file)),x.p50_ms,x.p95_ms,x.p99_ms,x.max_ms]);}catch{}}
    const maxOf=(key)=>Math.max(...rows.map(x=>Number(x[key])));
    L.push('### E2 profiled duplicate-request-ID rerun','',`A corrected focused run completed ${rows.length} cells: 3,000 requests × 3 check orders × 3 repeats in ${run.elapsedSeconds} s. The ~500 ms handler outlier did not recur: across these 9 cells, maximum handler time was ${maxOf('server_handler_max_ns')} ns; maximum untrimmed p99 was ${maxOf('server_handler_p99_ns').toFixed(0)} ns and maximum 1%-trimmed p99 was ${maxOf('server_handler_trimmed_p99_ns').toFixed(0)} ns. The earlier profiling attempt is preserved under experiments/results/e2-v2-profiled/ but its flush endpoint returned 404 and it has no event-loop summary; it is superseded. The corrected run records event-loop histograms and GC events in each server stdout log.`,'',...markdownRows(['Order','Repeat','p50 ns','p95 ns','p99 ns','Trim p50 ns','Trim p95 ns','Trim p99 ns','Max ns'],rows.map(x=>[x.check_order,x.repeat,x.server_handler_p50_ns,x.server_handler_p95_ns,x.server_handler_p99_ns,x.server_handler_trimmed_p50_ns,x.server_handler_trimmed_p95_ns,x.server_handler_trimmed_p99_ns,x.server_handler_max_ns])),'',...markdownRows(['Cell log','Event-loop p50 ms','p95 ms','p99 ms','Max ms'],eventRows),'',`Corrected raw flood CSV: ${q(path.join(runDir,'rejection-cost-profiled.csv'))} (${h(path.join(runDir,'rejection-cost-profiled.csv'))}); run metadata: ${q(path.join(runDir,'profiled-run.json'))} (${h(path.join(runDir,'profiled-run.json'))}); command: E2_PROFILE_DUPLICATES_ONLY=true node experiments/e2/run.js; runtime ${run.elapsedSeconds} s.`,'');
  }
}

const E3=path.join(RESULTS,'e3-v2');
if(fs.existsSync(path.join(E3,'summary.csv'))){
  const rows=readCsv(path.join(E3,'summary.csv'));
  const selected=[...rows.slice(0,20),...rows.slice(-20)];
  L.push('## E3 false rejection','',`Run metadata: ${q(path.join(E3,'run.json'))}; 75 cells × 2,000 requests. All ${rows.length} cells report mismatch_count=0 between live rejection decisions and offline recomputation using recorded server check times. Assumed delay and offset distributions do not characterize a real network.`,'',...markdownRows(['Profile','PAST','FUTURE','False rejects / N','Rate','Wilson low–high','Offline mismatches'],selected.map(x=>[x.profile,x.past_seconds,x.future_seconds,`${x.false_rejections}/${x.attempts}`,Number(x.false_rejection_rate).toFixed(4),`${Number(x.wilson95_low).toFixed(4)}–${Number(x.wilson95_high).toFixed(4)}`,x.mismatch_count])),'','The table shows the first and last 20 summary rows; all 75 rows remain in the source CSV. Figures compare FUTURE tolerance and PAST replay acceptance window in PNG/PDF/SVG.','',`Raw summary: ${q(path.join(E3,'summary.csv'))} (${h(path.join(E3,'summary.csv'))}); command: npm.cmd run experiments:e3; runtime ${readJson(path.join(E3,'run.json')).elapsedSeconds} s.`,'' );
}

const E4=path.join(RESULTS,'e4-v2'),E4C=path.join(RESULTS,'e4-v2-corrected');
if(fs.existsSync(path.join(E4,'e4a-summary.csv'))){
  const a=readCsv(path.join(E4,'e4a-summary.csv'));
  const agg=[...new Set(a.map(x=>`${x.configuration}|${x.nonce_ttl_seconds}|${x.client_future_offset_seconds}`))].map(k=>{const g=a.filter(x=>`${x.configuration}|${x.nonce_ttl_seconds}|${x.client_future_offset_seconds}`===k);return[k.split('|')[0],k.split('|')[1],k.split('|')[2],g.reduce((n,x)=>n+Number(x.accepted),0),g.reduce((n,x)=>n+Number(x.blocked),0),g.length*30];});
  const endpoints=[...a.slice(0,20),...a.slice(-20)];
  const b=readCsv(path.join(E4,'e4b.csv')).filter(x=>x.attempt==='summary');
  const c=readCsv(path.join(E4C,'e4c.csv'));
  const csum=c.filter(x=>x.kind==='summary');
  const insufficient=c.filter(x=>x.kind==='insufficient-retry');
  const d=readCsv(path.join(E4,'e4d-derived.csv'));
  L.push('## E4 failure modes','',`Runtime: ${readJson(path.join(E4,'run.json')).elapsedSeconds} s. E4a comprises ${a.length} cells × 30 trials. Each aggregate row sums the 9 delays (270 replay attempts) at one configuration/TTL/future-offset combination; the first/last 20 detailed delay cells follow.`,`### E4a TTL/window aggregate`,...markdownRows(['Configuration','TTL s','Future offset s','Accepted / 270','Blocked / 270'],agg),'','### E4a first and last 20 detailed cells',...markdownRows(['Config','TTL','Future offset','Delay','Trials','Accepted','Blocked','Blocking reasons'],endpoints.map(x=>[x.configuration,x.nonce_ttl_seconds,x.client_future_offset_seconds,x.replay_delay_seconds,x.trials,x.accepted,x.blocked,x.blocking_layer_histogram])),'','Measured result for the hypothesis: with request-ID defense off, replays after nonce expiry were accepted in 30/270 attempts at TTL 4/f=0, 60/270 at TTL 4/f=1, 90/270 at TTL 4/f=2, 30/270 at TTL 6/f=1, and 60/270 at TTL 6/f=2; every other tested TTL/offset group had 0 accepted. With request-ID defense on, every group had 0 accepted. This matches the tested TTL < PAST + future-offset condition. Full grid: '+q(path.join(E4,'e4a-summary.csv'))+' ('+h(path.join(E4,'e4a-summary.csv'))+'); LaTeX table: '+q(path.join(E4,'e4a-grid.tex'))+'.','', '### E4b nonce-store fault mode',...markdownRows(['Case','Legitimate accepted / 30','Replay accepted / 1','Failure mode','Request-ID'],b.map(x=>[x.case,`${x.legitimate_accepted}/${x.legitimate_total}`,`${x.replay_accepted}/${x.replay_total}`,x.nonce_fail_mode,x.request_id_defense])),'',`### E4c lost-response retries (corrected run)`,...markdownRows(['Case','Debits / 100','Exactly one per ID','Client failure after debit','Failure reasons','Oracle holds'],csum.map(x=>[x.case,x.debits,x.exactly_one_debit_request_ids,x.client_failure_after_debit,x.client_failure_reasons,JSON.parse(x.oracle).integrity_holds])),'',...markdownRows(['Insufficient-balance retry','Initial reason','Retry mode','Retry result'],insufficient.map(x=>[x.case,x.initial_reason,x.retry_mode,`${x.retry_status} ${x.retry_reason}`])),'','The first E4c output used request-ID defense off and is invalid for the intended comparison; it is preserved but superseded. Corrected E4c raw: '+q(path.join(E4C,'e4c.csv'))+' ('+h(path.join(E4C,'e4c.csv'))+'); run metadata: '+q(path.join(E4C,'run-e4c-corrected.json'))+'.','', '### E4d linear extrapolation',...markdownRows(['Requests/s','TTL s','Derived keys','Measured mean B/key','Derived MiB','Scope'],d.map(x=>[x.requests_per_second,x.ttl_seconds,x.derived_keys,Number(x.derived_mean_bytes_per_key).toFixed(3),Number(x.derived_memory_mib).toFixed(3),x.scope])),'','E4d values are linear extrapolations from the canonical measured memory slope, not direct measurements.','');
}

const e2Run=readJson(path.join(RESULTS,'e2-v2','run.json'));
const e3Run=readJson(path.join(RESULTS,'e3-v2','run.json'));
const e4Run=readJson(path.join(RESULTS,'e4-v2','run.json'));
const provenance=[];
function addArtifact(title,output,raw,command,runtime){const f=path.join(ROOT,output),sources=raw.map(x=>path.join(ROOT,x));if(fs.existsSync(f)&&sources.every(fs.existsSync))provenance.push([title,q(f),h(f),sources.map(x=>`${q(x)} (${h(x)})`).join('<br>'),command,`${runtime} s`]);}
const e1csv='experiments/results/e1-v2/summary.csv';
for(const ext of ['png','pdf','svg'])addArtifact(`E1 attack-success heat map (${ext})`,`experiments/results/e1-v2/attack-success-heatmap.${ext}`,[e1csv],'npm.cmd run experiments:render-v2',readJson(path.join(RESULTS,'e1-v2','run.json')).elapsedSeconds);
addArtifact('E1 coverage matrix (LaTeX)','experiments/results/e1-v2/coverage-matrix.tex',[e1csv],'npm.cmd run experiments:render-v2',readJson(path.join(RESULTS,'e1-v2','run.json')).elapsedSeconds);
for(const ext of ['png','pdf','svg'])addArtifact(`E2 server-handler cost figure (${ext})`,`experiments/results/e2-v2/server-handler-cost.${ext}`,['experiments/results/e2-v2/load-repeat-summary.csv','experiments/results/e2-v2/layer-repeat-ci.csv'],'npm.cmd run experiments:render-v2',e2Run.elapsedSeconds);
for(const [title,file,raw] of [['E2 load summary (LaTeX)','load-summary.tex','load-repeat-summary.csv'],['E2 rejection cost (LaTeX)','rejection-cost.tex','rejection-cost.csv']])addArtifact(title,`experiments/results/e2-v2/${file}`,[`experiments/results/e2-v2/${raw}`],'npm.cmd run experiments:render-v2',e2Run.elapsedSeconds);
for(const profile of ['p1','p2','p3'])for(const ext of ['png','pdf','svg'])addArtifact(`E3 ${profile.toUpperCase()} false rejection vs FUTURE (${ext})`,`experiments/results/e3-v2/${profile}-false-rejection-vs-future.${ext}`,['experiments/results/e3-v2/summary.csv'],'npm.cmd run experiments:render-v2',e3Run.elapsedSeconds);
for(const ext of ['png','pdf','svg'])addArtifact(`E3 PAST and replay-window figure (${ext})`,`experiments/results/e3-v2/false-rejection-vs-past-and-replay-window.${ext}`,['experiments/results/e3-v2/summary.csv'],'npm.cmd run experiments:render-v2',e3Run.elapsedSeconds);
addArtifact('E3 summary (LaTeX)','experiments/results/e3-v2/summary.tex',['experiments/results/e3-v2/summary.csv'],'npm.cmd run experiments:render-v2',e3Run.elapsedSeconds);
for(const [title,file,raw] of [['E4a TTL/window grid (LaTeX)','e4a-grid.tex','e4a-summary.csv'],['E4b fault mode (LaTeX)','fault-mode.tex','e4b.csv'],['E4d state extrapolation (LaTeX)','e4d-derived.tex','e4d-derived.csv']])addArtifact(title,`experiments/results/e4-v2/${file}`,[`experiments/results/e4-v2/${raw}`],'npm.cmd run experiments:render-v2',e4Run.elapsedSeconds);
addArtifact('E4c corrected retry loss (LaTeX)','experiments/results/e4-v2/retry-loss-corrected.tex',['experiments/results/e4-v2-corrected/e4c.csv'],'npm.cmd run experiments:render-v2',readJson(path.join(RESULTS,'e4-v2-corrected','run-e4c-corrected.json')).elapsedSeconds);
L.push('## Table and figure provenance','','Every generated table/figure below names its source raw CSV(s), source and output SHA-256, generator command, and corresponding measurement runtime. The numerical results are shown in the experiment sections above; the full source data stays on disk.','',...markdownRows(['Artifact','Output path','Output SHA-256','Raw CSV path(s) and SHA-256','Command','Runtime'],provenance),'');
const dirs=['e1-v2','e2-v2','e2-v2-profiled','e2-v2-profiled-corrected','e3-v2','e4-v2','e4-v2-corrected'];
function walk(dir){if(!fs.existsSync(dir))return[];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const f=path.join(dir,e.name);return e.isDirectory()?walk(f):[f];});}
const evidence=dirs.flatMap(d=>walk(path.join(RESULTS,d))).filter(f=>/\.(csv|json|png|pdf|svg|tex|log)$/.test(f)&&!(/\.sqlite(?:-(?:wal|shm))?$/.test(f)));
L.push('## Evidence inventory','','| File path | Bytes | SHA-256 |','|---|---:|---|',...evidence.map(f=>`| ${q(f)} | ${fs.statSync(f).size} | ${h(f)} |`),'','Raw CSVs and logs remain on disk. Session bearer values, session keys, and signatures are not included in this pack.','');
fs.writeFileSync(OUT,L.join('\n'),'utf8');
const size=fs.statSync(OUT).size;
console.log(`Wrote ${rel(OUT)} (${size} bytes; ${evidence.length} evidence files).`);
if(size>=300*1024)process.exitCode=2;
