const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const RESULTS = path.join(__dirname, 'results');
const E1 = path.join(RESULTS, 'e1-sqlite-final');
const E2 = path.join(RESULTS, 'e2');
const OUT = path.join(ROOT, 'docs/RESULTS_PACK_A.md');
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function parseCsv(text) {
  const lines = text.trimEnd().split(/\r?\n/);
  const parse = (line) => {
    const values = []; let field = ''; let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (quoted && ch === '"' && line[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = !quoted;
      else if (ch === ',' && !quoted) { values.push(field); field = ''; }
      else field += ch;
    }
    values.push(field); return values;
  };
  const headers = parse(lines[0]);
  return { headers, rows: lines.slice(1).filter(Boolean).map((line) => Object.fromEntries(headers.map((header, index) => [header, parse(line)[index] ?? '']))) };
}
function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const pct = (p) => { const ix = (sorted.length - 1) * p; const lo = Math.floor(ix); const hi = Math.ceil(ix); return sorted[lo] + (sorted[hi] - sorted[lo]) * (ix - lo); };
  return { count: values.length, min: sorted[0], max: sorted.at(-1), mean: values.reduce((a, b) => a + b, 0) / values.length, p50: pct(.5), p95: pct(.95), p99: pct(.99) };
}
function csvFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...csvFiles(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.csv')) result.push(full);
  }
  return result.sort();
}
function escapeCell(value) { return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>'); }
function renderCsvSection(file) {
  const text = fs.readFileSync(file, 'utf8');
  const parsed = parseCsv(text);
  const relative = path.relative(ROOT, file).replace(/\\/g, '/');
  const bytes = Buffer.byteLength(text);
  const large = parsed.rows.length > 1000 || bytes > 200 * 1024;
  const out = [`### \`${relative}\``, '', `- Size: ${bytes} bytes; SHA-256: \`${sha256(file)}\`; rows excluding header: ${parsed.rows.length}.`];
  if (!large) {
    out.push('', `Full table (${parsed.rows.length} rows):`, '', `| ${parsed.headers.join(' | ')} |`, `| ${parsed.headers.map(() => '---').join(' | ')} |`);
    for (const row of parsed.rows) out.push(`| ${parsed.headers.map((key) => escapeCell(row[key])).join(' | ')} |`);
    return out.join('\n');
  }
  out.push('- Large-file policy: only the first 20 data rows, last 20 data rows, and aggregate statistics are shown here. Full CSV stays on disk unchanged.');
  for (const [label, rows] of [['First 20 rows', parsed.rows.slice(0, 20)], ['Last 20 rows', parsed.rows.slice(-20)]]) {
    out.push('', `**${label}**`, '', `| ${parsed.headers.join(' | ')} |`, `| ${parsed.headers.map(() => '---').join(' | ')} |`);
    for (const row of rows) out.push(`| ${parsed.headers.map((key) => escapeCell(row[key])).join(' | ')} |`);
  }
  // Accept only canonical decimal numeric fields. Number('deadbeef') can
  // otherwise coerce hexadecimal-looking IDs/hashes in surprising ways.
  const numericPattern = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;
  const numeric = parsed.headers.filter((key) => !/(?:hash|_?id$|token|signature|nonce|key)/i.test(key)).map((key) => [key, parsed.rows.map((row) => row[key]).filter((value) => value !== '' && numericPattern.test(String(value))).map(Number)]).filter(([, values]) => values.length);
  out.push('', '**Aggregate statistics for numeric columns**', '', '| Column | count | min | max | mean | p50 | p95 | p99 |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const [key, values] of numeric) { const s = stats(values); out.push(`| ${key} | ${s.count} | ${s.min} | ${s.max} | ${s.mean} | ${s.p50} | ${s.p95} | ${s.p99} |`); }
  const numericColumns = new Set(numeric.map(([key]) => key));
  const categorical = parsed.headers.filter((key) => !numericColumns.has(key));
  if (categorical.length) {
    out.push('', '**Counts for categorical columns**', '');
    for (const key of categorical) {
      const counts = new Map();
      for (const row of parsed.rows) counts.set(row[key], (counts.get(row[key]) || 0) + 1);
      const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
      out.push(`- \`${key}\`: ${counts.size} distinct values; total ${parsed.rows.length} rows; top counts: ${JSON.stringify(ordered.slice(0, 20))}.`);
    }
  }
  return out.join('\n');
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

if (!fs.existsSync(path.join(E1, 'run.json')) || !fs.existsSync(path.join(E2, 'run.json'))) throw new Error('E1 and E2 run.json files are required before writing the results pack.');
const e1Run = readJson(path.join(E1, 'run.json'));
const e2Run = readJson(path.join(E2, 'run.json'));
const environmentPath = path.join(RESULTS, 'environment.json');
const environment = fs.existsSync(environmentPath) ? readJson(environmentPath) : null;
const e1Summary = parseCsv(fs.readFileSync(path.join(E1, 'summary.csv'), 'utf8')).rows;
const e2Summary = parseCsv(fs.readFileSync(path.join(E2, 'load-repeat-summary.csv'), 'utf8')).rows;
const e2Floods = parseCsv(fs.readFileSync(path.join(E2, 'rejection-cost.csv'), 'utf8')).rows;
const raceRoot = path.join(RESULTS, 'phase4-source-fixes');
const raceRunName = fs.readdirSync(raceRoot).filter((name) => name.startsWith('race-session-final-') && fs.existsSync(path.join(raceRoot, name, 'race-summary-1000-batches.json'))).sort().at(-1);
const raceRunDirectory = raceRunName ? path.join(raceRoot, raceRunName) : null;
const raceSummary = raceRunDirectory ? readJson(path.join(raceRunDirectory, 'race-summary-1000-batches.json')) : null;
const allOn = e1Summary.filter((row) => row.config_id === 'H1T1N1R1');
const none = e1Summary.filter((row) => row.config_id === 'H0T0N0R0');
const e1ByScenario = (rows) => Object.fromEntries(rows.map((row) => [row.scenario_id, { attempts: Number(row.attempts), debits: Number(row.debited_count), rate: row.attack_success_rate === '' ? null : Number(row.attack_success_rate), blockers: JSON.parse(row.blocking_reason_histogram) }]));
const e1Figure = ['attack-success-heatmap.png', 'attack-success-heatmap.pdf', 'attack-success-heatmap.svg'].map((name) => path.join(E1, name)).filter(fs.existsSync);
const e2Figure = ['latency-by-stack.png', 'latency-by-stack.pdf', 'latency-by-stack.svg'].map((name) => path.join(E2, name)).filter(fs.existsSync);
const lines = [
  '# Results Pack A: E1 and E2', '',
  'This pack reports only the E1 ablation and E2 cost runs. E3, E4, and Phase 5 were not run.', '',
  '## Reproduction settings', '',
  `- E1 command: \`node experiments/e1/run.js\`. Runtime: ${e1Run.elapsedSeconds} seconds; started ${e1Run.started}; ended ${e1Run.ended}.`,
  `- E2 command: \`node experiments/e2/run.js\`. This run completed load cells before a setup error stopped the first rejection cell; after fixing log-header initialization, the completed loads were reused with \`$env:E2_RESUME_FROM=experiments/results/e2/${e2Run.dataRunDirectory}; node experiments/e2/run.js\`. Runtime from initial start to final end: ${e2Run.elapsedSeconds} seconds; started ${e2Run.started}; resumed flood phase ${e2Run.resumedRejectionStarted}; ended ${e2Run.ended}.`,
  '- E2 setup issue and correction: the first attempt read the per-layer CSV before a rejection request had created it, so it ended before that flood sent traffic. The harness now creates the CSV header at server setup. The initial output is retained at `experiments/results/e2-run-console.log`; the resumed run is at `experiments/results/e2-resume-console.log`. All 80 load cells were re-read and their SQLite ledgers revalidated before running the 12 rejection cells.',
  '- Plot and LaTeX rendering: `python experiments/render-pack-a.py`; results documentation: `node experiments/write-results-pack.js`.',
  `- Node: ${e1Run.nodeVersion || process.version}; OS: ${environment?.host?.osVersion || `${process.platform} ${process.arch}`}; CPU: ${environment?.host?.cpuModel || 'see environment.json'}; RAM: ${environment?.host?.totalRamGiB || 'see environment.json'} GiB; SQLite: ${environment?.runtime?.sqliteLibrary || 'see environment.json'}; matplotlib: 3.11.2. Service: ${environment?.nonceBackend?.product || 'Memurai Developer'}, version ${environment?.nonceBackend?.memuraiVersion || 'see environment.json'} (not stock Redis), IPv4 at 127.0.0.1:6379. All traffic was localhost traffic on one Windows machine.`,
  '- The harness used explicit HTTP keep-alive agents. All measured server runs set `LEGACY_SHARED_SECRET=false`, `VIZ_ENABLED=false`, `DEMO_MODE=false`, and `HOST=127.0.0.1`.',
  '- E1 scaled profile: timestamp past window 6 s, future tolerance 2 s, nonce TTL 30 s, session TTL 15 s; default-window confirmation used past 300 s, future 5 s, nonce TTL 86400 s, session TTL 900 s, and waits of 60 s (S2) and 301 s (S4).',
  '- Superseded E1 raw passes are retained in `experiments/results/e1/` and `experiments/results/e1-final/`. The first used a harness-held S9 bearer; the second queried the ledger over HTTP. Only `experiments/results/e1-sqlite-final/`, which reads directly from SQLite, supports claims.',
  '- E1 "none" disables only the four tested replay-defense flags. Session bearer validation and account-ownership checks remain enabled. S9 explicitly gives the attacker a leaked session key. `PROXY_REDACT_LOGIN=true` redacted login request and response bodies in attacker-visible recordings while forwarding the response unchanged; this models the protected key-delivery assumption and does not provide TLS. Money-oracle rows were read directly from SQLite files, not inferred from response bodies.',
  '- E2 load cells used 500 warm-up and 5,000 measured requests, five repeats, and concurrency 1 and 16. Latencies are localhost Windows measurements with Memurai 4.2.3 and support relative comparison only.',
  '- Statistical convention: Wilson 95% intervals are recorded for nonconstant E1 outcomes; constant 0/100% cells have blank intervals. E2 reports the mean and t-based 95% CI across five per-repeat medians.',
  '', '## E1 ablation findings', '',
  '| Configuration | Scenario | Attempts | HTTP accepted | Ledger debits | Attack success | Wilson 95% CI | Blocking reasons | Oracle holds |',
  '| --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- |'
];
for (const scenario of ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S2_default_window_60s', 'S4_default_window_301s']) {
  for (const row of e1Summary.filter((item) => item.scenario_id === scenario && ['H0T0N0R0', 'H1T1N1R1', 'H1T1N1R1-DEFAULT'].includes(item.config_id))) {
    const wilson = row.wilson95_low === '' ? 'constant outcome (not computed)' : `${row.wilson95_low} to ${row.wilson95_high}`;
    lines.push(`| ${row.config_id} | ${scenario} | ${row.attempts} | ${row.http_accepted_count} | ${row.debited_count} | ${row.attack_success_rate} | ${wilson} | ${escapeCell(row.blocking_reason_histogram)} | ${row.oracle_integrity_holds} |`);
  }
}
lines.push('', `E1 scanned ${e1Run.allConfigs} flag configurations and ${e1Run.scenarios} replay scenarios. Across "none", S1 exact replay had ${none.find((r) => r.scenario_id === 'S1')?.debited_count} ledger debits from ${none.find((r) => r.scenario_id === 'S1')?.attempts} attempts; all-on S1 had ${allOn.find((r) => r.scenario_id === 'S1')?.debited_count}. In all-on S9, ${allOn.find((r) => r.scenario_id === 'S9')?.debited_count} of 30 fresh requests were debited with the deliberately leaked session key.`, '');
for (const file of [path.join(E1, 'summary.csv'), path.join(E1, 'summary.tex'), ...e1Figure]) {
  if (fs.existsSync(file)) lines.push(`- \`${path.relative(ROOT, file).replace(/\\/g, '/')}\`: size ${fs.statSync(file).size} bytes; SHA-256 \`${sha256(file)}\`.`);
}
lines.push('', '## E2 load and rejection cost', '', '| Stack | Concurrency | Repeats | Mean repeat median (ms) | 95% CI low | 95% CI high |', '| --- | ---: | ---: | ---: | ---: | ---: |');
for (const row of e2Summary) lines.push(`| ${row.stack_id} | ${row.concurrency} | ${row.repetitions} | ${row.mean_repeat_median_ms} | ${row.ci95_low_ms} | ${row.ci95_high_ms} |`);
lines.push('', '| Check order | Flood | Attempts | Rejected | Mean latency (ms) | p50 (ms) | p95 (ms) | p99 (ms) |', '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const row of e2Floods) lines.push(`| ${row.check_order} | ${row.flood} | ${row.attempts} | ${row.rejected_count} | ${row.mean_duration_ms} | ${row.p50_ms} | ${row.p95_ms} | ${row.p99_ms} |`);
for (const file of ['load-repeats.csv', 'load-repeat-summary.csv', 'layer-timing-summary.csv', 'rejection-cost.csv', 'load-summary.tex', 'rejection-cost.tex', ...e2Figure.map((item) => path.basename(item))].map((name) => path.join(E2, name))) {
  if (fs.existsSync(file)) lines.push(`- \`${path.relative(ROOT, file).replace(/\\/g, '/')}\`: size ${fs.statSync(file).size} bytes; SHA-256 \`${sha256(file)}\`.`);
}
const defaultDuplicateId = e2Floods.find((row) => row.check_order === 'default' && row.flood === 'duplicate_request_id');
if (defaultDuplicateId) {
  const timingPath = path.join(ROOT, defaultDuplicateId.raw_path.replace(/requests\.csv$/, 'layer-timings-rejected.csv'));
  const timingRows = parseCsv(fs.readFileSync(timingPath, 'utf8')).rows;
  const handlerMs = timingRows.map((row) => Number(row.duration_ns) / 1e6).filter(Number.isFinite);
  const handlerSummary = stats(handlerMs);
  const slowestHandler = timingRows.reduce((slowest, row) => Number(row.duration_ns) > Number(slowest.duration_ns) ? row : slowest, timingRows[0]);
  lines.push('', '### Investigated latency outlier', '',
    `The default-order duplicate-request-ID flood had a client-side p99 of ${defaultDuplicateId.p99_ms} ms. Its server handler timing CSV shows p99 ${handlerSummary.p99} ms; the slowest logged handler took ${(Number(slowestHandler.duration_ns) / 1e6).toFixed(3)} ms, with request-ID layer timing ${slowestHandler.request_id_ns} ns and balance marked \`${slowestHandler.balance_ns}\`.`,
    `The code runs account lookup and session-token authentication before the replay layers, and writes EXPERIMENT_LOG synchronously in the request's finally block. Those costs are outside the per-layer timing columns. The current records do not isolate which uninstrumented work caused this tail, so the scenario was retained unchanged and the cause is reported as unresolved. Server timing evidence: \`${path.relative(ROOT, timingPath).replace(/\\/g, '/')}\`; client request evidence: \`${defaultDuplicateId.raw_path}\`.`);
}
lines.push('', '## Derived figures and tables: provenance', '');
const provenance = [
  ...e1Figure.map((file) => ({ file, raw: path.join(E1, 'summary.csv'), command: 'python experiments/render-pack-a.py', runtime: e1Run.elapsedSeconds })),
  { file: path.join(E1, 'summary.tex'), raw: path.join(E1, 'summary.csv'), command: 'node experiments/e1/finalize-oracle-summary.js', runtime: e1Run.elapsedSeconds },
  ...e2Figure.map((file) => ({ file, raw: path.join(E2, 'load-repeat-summary.csv'), command: 'python experiments/render-pack-a.py', runtime: e2Run.elapsedSeconds })),
  { file: path.join(E2, 'load-summary.tex'), raw: path.join(E2, 'load-repeat-summary.csv'), command: 'python experiments/render-pack-a.py', runtime: e2Run.elapsedSeconds },
  { file: path.join(E2, 'rejection-cost.tex'), raw: path.join(E2, 'rejection-cost.csv'), command: 'python experiments/render-pack-a.py', runtime: e2Run.elapsedSeconds }
];
for (const item of provenance) if (fs.existsSync(item.file) && fs.existsSync(item.raw)) lines.push(`- \`${path.relative(ROOT, item.file).replace(/\\/g, '/')}\`: SHA-256 \`${sha256(item.file)}\`; raw CSV \`${path.relative(ROOT, item.raw).replace(/\\/g, '/')}\` SHA-256 \`${sha256(item.raw)}\`; command \`${item.command}\`; run runtime ${item.runtime} seconds.`);
if (raceSummary && raceRunDirectory) {
  const identical = raceSummary.identicalPayloadRace;
  const shared = raceSummary.secretHolderSameRequestIdRace;
  lines.push('', '## F1 session-mode concurrency confirmation', '',
    `Command: \`node experiments/run-f1-races.js\`. The run used session login/signing, all four defenses on, visualization off, a fresh SQLite database, and direct ledger reads from that database. The race issued ${identical.totalRequests} requests in ${identical.batches} batches of ${identical.parallelWidth}; accepted-count distribution was \`${JSON.stringify(identical.acceptedCountDistribution)}\`, balance-delta distribution was \`${JSON.stringify(identical.balanceDeltaDistribution)}\`, and the SQLite oracle found ${identical.moneyOracle.duplicateDebitCount} duplicate debit rows and ${identical.moneyOracle.unauthorizedDebitAmount} unauthorized debit amount.`,
    `The shared-request-ID race used ${shared.parallelWidth} distinct valid nonces with the same request ID: ${shared.acceptedCount} request was accepted, balance delta was ${shared.balanceDelta}, and SQLite oracle \`${JSON.stringify(shared.oracle)}\`.`, '',
    '| F1 raw artifact | Size (bytes) | SHA-256 |', '| --- | ---: | --- |');
  for (const name of ['race-summary-1000-batches.json', 'race-identical-50x1000-batches.csv', 'race-identical-50x1000-requests.csv', 'race-same-request-id-50-requests.csv', 'server-timings.csv']) {
    const file = path.join(raceRunDirectory, name);
    if (fs.existsSync(file)) lines.push(`| \`${path.relative(ROOT, file).replace(/\\/g, '/')}\` | ${fs.statSync(file).size} | \`${sha256(file)}\` |`);
  }
}
lines.push('', `Full E1 raw files remain in \`experiments/results/e1-sqlite-final/${e1Run.dataRunDirectory}/\`; full E2 raw files remain in \`experiments/results/e2/${e2Run.dataRunDirectory}/\`. For every CSV larger than 200 KB or with more than 1,000 data rows, only the first 20 rows, last 20 rows, and aggregate statistics are included below. Smaller CSVs are included in full.`, '');
const e1Inventory = [path.join(E1, 'summary.csv'), ...csvFiles(path.join(E1, e1Run.dataRunDirectory)).filter((file) => path.basename(file) !== 'summary.csv')];
const e2SummaryNames = ['load-repeats.csv', 'load-repeat-summary.csv', 'layer-timing-summary.csv', 'rejection-cost.csv'];
const e2Inventory = [...e2SummaryNames.map((name) => path.join(E2, name)).filter(fs.existsSync), ...csvFiles(path.join(E2, e2Run.dataRunDirectory)).filter((file) => !e2SummaryNames.includes(path.basename(file)))];
const raceInventory = raceRunDirectory ? csvFiles(raceRunDirectory) : [];
for (const file of [...e1Inventory, ...e2Inventory, ...raceInventory]) lines.push(renderCsvSection(file), '');
fs.writeFileSync(OUT, `${lines.join('\n')}\n`);
process.stdout.write(`Wrote ${path.relative(ROOT, OUT)} (${fs.statSync(OUT).size} bytes)\n`);
