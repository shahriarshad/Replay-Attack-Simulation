const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = path.resolve(__dirname, '..');
const experimentRoot = path.join(projectRoot, 'experiments');
const resultRoot = path.join(experimentRoot, 'results');
const outputPath = path.join(projectRoot, 'docs', 'EXPERIMENTS.md');
const manifestPath = path.join(resultRoot, 'SHA256SUMS.json');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const absolutePath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
    });
}

function refreshResultManifest() {
  const files = walk(resultRoot).filter((filePath) => path.resolve(filePath) !== path.resolve(manifestPath));
  const entries = files.map((filePath) => ({
    path: relativePath(filePath),
    sizeBytes: fs.statSync(filePath).size,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
  }));
  fs.writeFileSync(manifestPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

function relativePath(absolutePath) {
  return path.relative(projectRoot, absolutePath).split(path.sep).join('/');
}

function sha256(absolutePath) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
  } catch (error) {
    return `unavailable while file is open: ${error.code || error.message}`;
  }
}

function fenceFor(text) {
  const longest = Math.max(0, ...Array.from(text.matchAll(/`+/g), (match) => match[0].length));
  return '`'.repeat(Math.max(3, longest + 1));
}

function languageFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return ({ '.js': 'js', '.json': 'json', '.csv': 'csv', '.log': 'text' })[extension] || 'text';
}

function percentile(sorted, percent) {
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * percent;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function aggregate(values) {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (!sorted.length) return { count: 0, min: null, max: null, mean: null, p50: null, p95: null, p99: null };
  return { count: sorted.length, min: sorted[0], max: sorted[sorted.length - 1],
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    p50: percentile(sorted, 0.5), p95: percentile(sorted, 0.95), p99: percentile(sorted, 0.99) };
}

function parseCsv(line) {
  const cells = []; let cell = ''; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { cells.push(cell); cell = ''; }
    else cell += char;
  }
  cells.push(cell); return cells;
}

function largeFileSummary(filePath, text, rows) {
  const aggregates = {};
  if (path.extname(filePath).toLowerCase() === '.csv' && rows.length > 1) {
    const headers = parseCsv(rows[0]); const columns = headers.map(() => []);
    for (const row of rows.slice(1)) parseCsv(row).forEach((value, index) => {
      if (value !== '' && Number.isFinite(Number(value))) columns[index].push(Number(value));
    });
    headers.forEach((header, index) => { if (columns[index].length) aggregates[header] = aggregate(columns[index]); });
  } else {
    const numbers = [...text.matchAll(/(?<![A-Za-z0-9_])[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g)].map((match) => Number(match[0]));
    aggregates.numericValues = aggregate(numbers);
  }
  return { totalRows: rows.length, first20: rows.slice(0, 20), last20: rows.slice(-20), aggregates };
}

function redactAuthenticationArtifacts(filePath, text) {
  if (/\.json$/i.test(filePath)) {
    text = text.replace(/("signature"\s*:\s*")[^"]*(")/gi, '$1[REDACTED SIGNATURE]$2');
  }
  if (/\.(json|log)$/i.test(filePath)) {
    text = text.replace(/((?:preserved )?signature:\s*)[0-9a-f]{16,}/gi, '$1[REDACTED SIGNATURE]');
  }
  return text;
}

function buildTree(files) {
  const nodes = new Map();
  for (const absolutePath of files) {
    const rel = path.relative(experimentRoot, absolutePath).split(path.sep);
    let current = '';
    for (let index = 0; index < rel.length; index += 1) {
      current = current ? `${current}/${rel[index]}` : rel[index];
      if (!nodes.has(current)) nodes.set(current, { name: rel[index], isDirectory: index < rel.length - 1 });
    }
  }
  const children = new Map();
  for (const [key, node] of nodes) {
    const parent = key.includes('/') ? key.slice(0, key.lastIndexOf('/')) : '';
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push({ ...node, key });
  }
  const lines = ['experiments/'];
  function emit(parent, prefix) {
    const entries = (children.get(parent) || []).sort((a, b) => a.name.localeCompare(b.name));
    entries.forEach((entry, index) => {
      const last = index === entries.length - 1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${entry.name}${entry.isDirectory ? '/' : ''}`);
      if (entry.isDirectory) emit(entry.key, `${prefix}${last ? '    ' : '│   '}`);
    });
  }
  emit('', '');
  return lines.join('\n');
}

refreshResultManifest();
const allFiles = walk(experimentRoot);
const resultFiles = allFiles.filter((filePath) => filePath.startsWith(`${resultRoot}${path.sep}`));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const manifestHashes = new Map(manifest.map((entry) => [entry.path, entry.sha256]));
const summary = JSON.parse(fs.readFileSync(path.join(resultRoot, 'baseline', 'phase0-summary.json'), 'utf8'));
const environment = JSON.parse(fs.readFileSync(path.join(resultRoot, 'environment.json'), 'utf8'));
const cases = JSON.parse(fs.readFileSync(path.join(resultRoot, 'baseline', 'measured-cases.json'), 'utf8'));
const nonceGrowth = JSON.parse(fs.readFileSync(path.join(resultRoot, 'baseline', 'nonce-growth-measured.json'), 'utf8'));

const lines = [];
const add = (...items) => lines.push(...items);
const code = String.fromCharCode(96);
add(
  '# Complete Experiment Dossier',
  '',
  'Generated from the current `experiments/` tree. It includes the complete folder structure, a file inventory, measured interpretation, and a full text/code listing of every file currently under `experiments/`.',
  '',
  '## Scope and evidence rules',
  '',
  '- Phase 0 baseline artifacts and Phase 1–3 implementation/test artifacts are recorded here. The full Phase 4 experiment matrix and Phase 5 USSD evaluation have not been run.',
  '- Every numeric finding below is read from a saved run artifact. No unrun experiment is represented as a result.',
  '- Phase 0 CSVs predate per-request monotonic timing; their missing durations are called out rather than reconstructed. Updated scripts record `process.hrtime.bigint()` start, end, and duration fields.',
  '- The WSL-only Bash attacker does not require Node.js; its client-side timing CSV uses WSL `date +%s%N`. The Windows server experiment log records monotonic `process.hrtime.bigint()` request and layer timings for those same requests.',
  '- Request HMAC signature values are redacted in this document because they are replay-capable authentication artifacts. Their source files remain unchanged in `experiments/results/`; the recorded hashes refer to those original files.',
  '- Every result file is inventoried with current path, byte size, and SHA-256. For a result over 200 KB or 1,000 rows, only its first 20 rows, last 20 rows, and aggregate statistics are shown; the complete file remains on disk. Source code and harness scripts stay in full.',
  '- The generated document itself is outside `experiments/`, so it is not included in the experiment tree or its result manifest.',
  '',
  '## Reproduction environment',
  '',
  `- Captured at: ${code}${environment.capturedAt}${code} UTC.`,
  `- Operating system: ${environment.host.osVersion} (${environment.host.os}).`,
  `- CPU: ${environment.host.cpuModel}; ${environment.host.logicalCpuCount} logical CPUs.`,
  `- RAM: ${environment.host.totalRamBytes} bytes (${environment.host.totalRamGiB} GiB).`,
  `- Node.js: ${environment.runtime.node}.`,
  `- SQLite Node package: ${environment.runtime.sqlite3NodePackage}; SQLite library: ${environment.runtime.sqliteLibrary}.`,
  `- Nonce store: ${environment.nonceBackend.product}, version ${environment.nonceBackend.memuraiVersion}; Redis protocol ${environment.nonceBackend.redisProtocolVersion}. Memurai, not stock Redis, was used.`,
  '- Memurai listens on IPv4 only. The configured URL is `redis://127.0.0.1:6379`; `localhost` may resolve to `::1` and fail.',
  '- Native Windows ports 3000, 3001, and 6379 were reachable. WSL reached the Windows API at `http://localhost:3000/api/health` with HTTP 200 and body `OK`.',
  `- Git commit captured in environment metadata: ${code}${environment.audit?.commitHash || 'not recorded'}${code}; status snapshot clean: ${environment.audit?.gitStatusClean ?? 'not recorded'}. The snapshot is preserved verbatim in ${code}results/environment.json${code}.`,
  '- The attacker shell ran in WSL. All server, Node, SQLite, Memurai, and measurement traffic ran on Windows and targeted only the local simulation.',
  '',
  '## Phase 0 run method',
  '',
  '1. Start the Windows Memurai service and verify it with `C:\\Applications\\memurai-cli.exe ping`.',
  '2. Set `REDIS_URL=redis://127.0.0.1:6379` in the ignored `server/.env` file.',
  '3. Start the server natively from `server/`; its startup log reports the bank API on 3000 and Socket.IO on 3001.',
  '4. From WSL, check `curl http://localhost:3000/api/health` before running attacks.',
  '5. Start `experiments/recording-proxy.js` on Windows and route a local client through port 3002; keep the exact request recording in a private temp directory outside the repository.',
  '6. Set WSL `CAPTURE_FILE` to the Windows recording path mounted into WSL, then run `attack/attack.sh --capture`, replay, tamper, stale-payload, and nonce-crash cases.',
  '7. A native Windows Node script sent 50 parallel copies of one valid payload, tested request-ID tampering and clock offsets, reset the demo state, created one successful seed transaction, cleared its nonce, then sent 10,000 sequential requests with fresh nonces and that already-successful request ID. They were rejected at request-ID after nonce consumption.',
  '8. `C:\\Applications\\memurai-cli.exe --scan --pattern used_nonce:*` counted nonce keys; `INFO memory` supplied `used_memory`.',
  '',
  'The Phase 0 parallel run used one batch of 50. Each Phase 0 clock offset was measured once. The Phase 0 10,000-request run is “nonce-store growth from requests rejected at the request-ID check,” not legitimate transactions.',
  '',
  '## Measured findings',
  '',
  '| Measurement | Observed result | Evidence |',
  '|---|---|---|',
  `| 50 identical parallel valid requests | ${cases.parallel50.counts.ACCEPTED} accepted; ${cases.parallel50.counts.NONCE_FAIL} returned NONCE_FAIL. | ${code}baseline/parallel-50-responses.json${code} |`,
  `| Changed request ID, original signature | HTTP ${cases.changedRequestIdWithOldSignature.httpStatus}, ${cases.changedRequestIdWithOldSignature.reason}. | ${code}baseline/measured-cases.json${code} |`,
  `| Clock skew -10m | ${cases.clockSkew.find((entry) => entry.label === '-10m').result.reason}. | ${code}baseline/measured-cases.json${code} |`,
  `| Clock skew -1m | ${cases.clockSkew.find((entry) => entry.label === '-1m').result.status}. | ${code}baseline/measured-cases.json${code} |`,
  `| Clock skew +10s, +1m, +10m | ${cases.clockSkew.filter((entry) => entry.label.startsWith('+')).map((entry) => `${entry.label}: ${entry.result.reason}`).join('; ')}. | ${code}baseline/measured-cases.json${code} |`,
  `| Exact in-window replay | ${readLog('immediate-replay.log').match(/"reason": "([^"]+)"/)?.[1] || 'see raw log'}. | ${code}baseline/immediate-replay.log${code} |`,
  `| Replay after nonce store clear | ${readLog('replay-after-nonce-crash.log').match(/"reason": "([^"]+)"/)?.[1] || 'see raw log'}; crash endpoint deleted ${JSON.parse(fs.readFileSync(path.join(resultRoot, 'baseline', 'nonce-crash.json'), 'utf8')).deleted} key. | ${code}baseline/replay-after-nonce-crash.log${code}, ${code}baseline/nonce-crash.json${code} |`,
  `| Nonce-store growth from requests rejected at the request-ID check | ${nonceGrowth.usedNonceKeys} keys; ${code}${nonceGrowth.usedMemoryBytes}${code} bytes used_memory (${nonceGrowth.usedMemoryHuman}). | ${code}baseline/nonce-growth-measured.json${code}, ${code}baseline/unique-nonce-10000-responses.csv${code} |`,
  '| Tampered amount with a fresh signed source | SIGNATURE_FAIL. | `baseline/tamper-fresh.log` |',
  '| Correctly signed payload older than 300 seconds | TIMESTAMP_FAIL. | `baseline/stale-replay.log` |',
  '| WSL to Windows health check | HTTP 200; body `OK`, before and after server restart. | `baseline/wsl-health.log`, `baseline/wsl-health-postrotation.log` |',
  '',
  '### Section 5 comparison',
  '',
  `The Phase 0 comparison recorded ${summary.section5Comparison.mismatchesAmongMeasuredCases.length} mismatches among measured cases. Tested response descriptions matched the report for health, accepted withdrawal, fresh tampering, stale signed request, reused nonce, request-ID replay after nonce clearing, and capture mode.`,
  '',
  'Section 5 responses in `PROJECT_AUDIT_REPORT.md` are labeled as measured or code-derived. The Phase 0 10,000-request artifact represents requests rejected at the request-ID check; nonce records were written before that check.',
  '',
  '### Future timestamp tolerance hypothesis for E3',
  '',
  'E3 should sweep future tolerance values of 0 s, 5 s, 30 s, and 60 s and measure false rejections for fast legitimate client clocks. Phase 0 observed rejection at +10 s under the 5 s default. The sweep is a hypothesis to test; no false-rejection rate is claimed yet.',
  '',
  '### On-path capture procedure',
  '',
  '`recording-proxy.js` is a local Node proxy restricted to a localhost upstream. Route the UI/API client to port 3002 and set `PROXY_CAPTURE_FILE` to a private path outside the repository. The proxy saves the exact request method, path, headers, and body it forwards. `attack/attack.sh --replay` reads the proxy envelope from `CAPTURE_FILE`; it does not use a payload file written by the server. Capture files include a signature and authorization header, so keep them outside `experiments/`, `docs/`, and version control.',
  '',
  '### Tests and build',
  '',
  '- Server unit and integration tests use Node’s built-in test runner on Windows. Their captured output is inventoried below.',
  '- The bank UI production build was run after removing the global signing secret from browser code. Client requests use a per-session signing key held in memory.',
  '- Legacy shared-secret verification remains behind `LEGACY_SHARED_SECRET=true`; the browser bundle contains no global shared key.',
  '',
  '## Experiment directory structure',
  '',
  '```text',
  buildTree(allFiles),
  '```',
  '',
  '## File inventory',
  '',
  '| File | Bytes | SHA-256 |',
  '|---|---:|---|'
);

for (const absolutePath of allFiles) {
  const rel = relativePath(absolutePath);
  const stat = fs.statSync(absolutePath);
  const listedHash = manifestHashes.get(rel);
  const digest = listedHash || sha256(absolutePath);
  add(`| ${code}${rel}${code} | ${stat.size} | ${code}${digest}${code} |`);
}

const correctionArtifacts = path.join(resultRoot, 'corrections');
if (fs.existsSync(correctionArtifacts)) {
  add('', '## Phase 0 correction measurements', '', 'These are scoped correction checks, not the full Phase 4 experiment matrix.', '');
  const memoryFiles = fs.readdirSync(correctionArtifacts).filter((name) => /^nonce-memory-(accepted|requestid)-.*100k-summary\.json$/.test(name));
  for (const name of memoryFiles) {
    const result = JSON.parse(fs.readFileSync(path.join(correctionArtifacts, name), 'utf8'));
    add(`### ${result.label}`, '', `- Mode: ${result.mode}; requests: ${result.requestCount}.`, `- NONCE_TTL: ${result.nonceTtlSeconds} seconds; duration: ${result.durationSeconds} seconds (${result.durationVsTtl} of TTL).`, `- Empty namespace memory baseline: ${result.baselineUsedMemoryBytes} bytes.`, `- Baseline-subtracted slope at 100,000 keys: ${result.baselineSubtractedSlopeBytesPerKey} bytes/key.`, `- Request timings: ${code}corrections/${result.requestRowsCsv}${code}.`, '');
    for (const snapshot of result.snapshots) add(`- ${snapshot.measuredKeys} keys: ${snapshot.usedMemoryBytes} bytes; delta ${snapshot.deltaBytes}; baseline-subtracted ${snapshot.bytesPerKeyAboveBaseline ?? 'n/a'} bytes/key; elapsed ${snapshot.elapsedSeconds ?? 0} seconds.`);
    add('');
  }
  const racePath = path.join(correctionArtifacts, 'race-summary-1000-batches.json');
  if (fs.existsSync(racePath)) {
    const race = JSON.parse(fs.readFileSync(racePath, 'utf8'));
    add('### Race repeatability', '', `- ${race.identicalPayloadRace.totalRequests} identical replay requests over ${race.identicalPayloadRace.batches} batches of ${race.identicalPayloadRace.parallelWidth}; accepted-count distribution: ${JSON.stringify(race.identicalPayloadRace.acceptedCountDistribution)}.`, `- Secret-holder same-request-ID race: ${race.secretHolderSameRequestIdRace.parallelWidth} different signed payloads; ${race.secretHolderSameRequestIdRace.acceptedCount} accepted; debit ${race.secretHolderSameRequestIdRace.debitAmount}; oracle ${JSON.stringify(race.secretHolderSameRequestIdRace.oracle)}.`, '');
  }
  const boundaryPath = path.join(correctionArtifacts, 'timestamp-boundaries-30-each.json');
  if (fs.existsSync(boundaryPath)) {
    const boundary = JSON.parse(fs.readFileSync(boundaryPath, 'utf8'));
    add('### Clock boundary repetitions', '', `- Repetitions per edge/case: ${boundary.repetitionsPerCase}.`, `- First rejected past age: ${boundary.firstRejectedPastAgeSeconds}s; first rejected future offset: +${boundary.firstRejectedFutureOffsetSeconds}s.`, `- Raw per-request timing CSV: ${code}corrections/timestamp-boundaries-30-each.csv${code}.`, '');
  }
  const clockOffsetsPath = path.join(correctionArtifacts, 'clock-offsets-30-each.json');
  if (fs.existsSync(clockOffsetsPath)) {
    const clockOffsets = JSON.parse(fs.readFileSync(clockOffsetsPath, 'utf8'));
    add('### Repeated Phase 0 client clock offsets', '', `- Repetitions per offset: ${clockOffsets.repetitionsPerOffset}; all rows record request start/end/duration.`, `- Outcomes: ${clockOffsets.cases.map((item) => `${item.label} ${item.offsetMs}ms => ${item.expected} (${item.measuredCount}/${clockOffsets.repetitionsPerOffset})`).join('; ')}.`, `- Raw per-request timing CSV: ${code}corrections/clock-offsets-30-each.csv${code}.`, '');
  }
  const vizPath = path.join(correctionArtifacts, 'viz-enabled-nonce-scan-summary.json');
  if (fs.existsSync(vizPath)) {
    const viz = JSON.parse(fs.readFileSync(vizPath, 'utf8'));
    add('### Dashboard scan overhead', '', '- Measured once with VIZ_ENABLED=true. This is an implementation artifact of demo key scanning, not a defense property.', `- Samples: ${viz.nonceKeySamples.map((sample) => `${sample.nonceKeysAtDashboardScan} keys: ${sample.duration_ms} ms`).join('; ')}.`, '');
  }
}

add('', '## Complete file contents', '', 'Source code is included in full. Small result files are included in full. For any result over 200 KB or 1,000 rows, only the first 20 rows, last 20 rows, and aggregate statistics are included; the full result stays on disk. Signature values are redacted in this dossier.', '');

for (const absolutePath of allFiles) {
  const rel = relativePath(absolutePath);
  const stat = fs.statSync(absolutePath);
  add(`### ${code}${rel}${code}`, '', `Bytes: ${stat.size}. SHA-256: ${code}${manifestHashes.get(rel) || sha256(absolutePath)}${code}.`, '');
  if (stat.size === 0) {
    add('_Empty file (0 bytes)._','');
    continue;
  }
  let text = fs.readFileSync(absolutePath, 'utf8');
  text = redactAuthenticationArtifacts(rel, text);
  const rows = text.replace(/\r\n/g, '\n').split('\n');
  if (rows.at(-1) === '') rows.pop();
  const isResult = absolutePath.startsWith(`${resultRoot}${path.sep}`) && rel !== 'experiments/results/SHA256SUMS.json';
  if (isResult && (stat.size > 200 * 1024 || rows.length > 1000)) {
    const summary = largeFileSummary(absolutePath, text, rows);
    const excerpt = [...summary.first20, '... omitted rows ...', ...summary.last20].join('\n');
    add('Large-result rule applied. The complete result remains on disk.', '', `Total rows: ${summary.totalRows}.`, '', 'Aggregate statistics (counts, min, max, mean, p50, p95, and p99 for numeric columns):', '', `${code.repeat(3)}json`, JSON.stringify(summary.aggregates, null, 2), code.repeat(3), '', `${code.repeat(3)}${languageFor(rel)}`, excerpt, code.repeat(3), '');
    continue;
  }
  const fence = fenceFor(text);
  add(`${fence}${languageFor(rel)}`, text.endsWith('\n') ? text.slice(0, -1) : text, fence, '');
}

function readLog(name) {
  return fs.readFileSync(path.join(resultRoot, 'baseline', name), 'utf8');
}

fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
process.stdout.write(`Wrote ${relativePath(outputPath)} with ${allFiles.length} experiment files.\n`);
