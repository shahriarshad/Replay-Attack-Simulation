const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'docs/REVIEW_BUNDLE_V2.md');
const base = 'c0b2a0b0f370e61d7b5aab34d684a9d1734f03a9';
const run = (cmd) => cp.execFileSync('git', cmd, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).trimEnd();
const rel = (f) => path.relative(root, f).replaceAll(path.sep, '/');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/^\uFEFF/, '');
const lines = (s) => s.split(/\r?\n/).length;
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const files = new Set();
function walk(dir, pred) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const p = path.join(abs, e.name), r = rel(p);
    if (e.isDirectory()) {
      if (!['node_modules','dist','.git','db','captures','results','__pycache__'].includes(e.name)) walk(r, pred);
    } else if (pred(r)) files.add(r);
  }
}
walk('server', f => f.endsWith('.js') || f === 'server/package.json' || f === 'server/.env.example');
walk('client/bank/src', () => true);
files.add('attack/attack.sh'); files.add('package.json');
walk('experiments', f => /\.(js|py)$/.test(f) && !f.includes('/results/'));
for (const f of ['docs/THREAT_MODEL.md','docs/LIMITATIONS.md','docs/DEMO.md','docs/REPRODUCE.md','docs/CLAIMS_EVIDENCE.md']) if (fs.existsSync(path.join(root,f))) files.add(f);

// Collect credentials from local configuration/captures without printing them.
const secrets = new Set();
for (const envFile of ['server/.env','server/.env.example']) {
  const p = path.join(root, envFile);
  if (!fs.existsSync(p)) continue;
  const m = fs.readFileSync(p, 'utf8').match(/^\s*(?:HMAC_SECRET|SESSION_SECRET)\s*=\s*(.+?)\s*$/m);
  if (m && m[1] && !m[1].startsWith('#')) secrets.add(m[1].replace(/^['"]|['"]$/g,''));
}
function collectCaptureValues(value, key='') {
  if (value && typeof value === 'object') {
    for (const [k,v] of Object.entries(value)) collectCaptureValues(v,k);
  } else if (typeof value === 'string' && /signature|session.?key|session.?token|authorization|bearer/i.test(key)) {
    const token=value.replace(/^Bearer\s+/i,'').trim();
    if (token.length >= 8 && !/^<REDACTED>$/i.test(token)) secrets.add(token);
  }
}
const captureRoots=[path.join(root,'experiments/results'),path.join(root,'attack')];
for (const dir of captureRoots) if(fs.existsSync(dir)) {
  const todo=[dir];
  while(todo.length) {
    const d=todo.pop();
    for(const ent of fs.readdirSync(d,{withFileTypes:true})) {
      const p=path.join(d,ent.name);
      if(ent.isDirectory()) { if(!['node_modules','db'].includes(ent.name)) todo.push(p); continue; }
      if(!/capture|payload/i.test(ent.name) || !/\.(json|jsonl)$/i.test(ent.name)) continue;
      try { const raw=fs.readFileSync(p,'utf8'); if(ent.name.endsWith('.jsonl')) raw.split(/\r?\n/).filter(Boolean).forEach(x=>collectCaptureValues(JSON.parse(x))); else collectCaptureValues(JSON.parse(raw)); } catch {}
    }
  }
}
function scrub(s) {
  for (const secret of secrets) if (secret.length > 3) s = s.split(secret).join('<REDACTED>');
  return s.replace(/(Authorization\s*[:=]\s*Bearer\s+)[^\s,}"']+/gi,'$1<REDACTED>')
    .replace(/("?(?:sessionKey|session_key|sessionToken|session_token|signature|sig|bearerToken|token)"?\s*:\s*)"?[A-Za-z0-9._~+/=-]{8,}"?/gi,'$1"<REDACTED>"');
}

const env = JSON.parse(read('experiments/results/environment.json'));
const status = run(['status','--short']);
const head = run(['rev-parse','HEAD']);
const version = (cmd) => { try { return run(Array.isArray(cmd) ? cmd : cmd.split(' ')); } catch { return 'unavailable'; } };
let body = `# Review Bundle V2\n\n- Source HEAD: \`${head}\`\n- Bundle generated: ${new Date().toISOString()}\n- Node: ${JSON.stringify(env.runtime?.node || version(['node','--version']))}\n- SQLite library: ${JSON.stringify(env.runtime?.sqliteLibrary || 'see environment.json')} (node package ${JSON.stringify(env.runtime?.sqlite3NodePackage || 'unknown')})\n- Redis-compatible store: ${JSON.stringify(env.nonceBackend?.product || 'unknown')}, version ${JSON.stringify(env.nonceBackend?.memuraiVersion || env.nonceBackend?.redisProtocolVersion || 'see environment.json')}\n- Git status at generation:\n\n\`\`\`text\n${status || '(clean)'}\n\`\`\`\n\n`;

const intro = `## What this project is and how it flows\n\nThis is a local bank simulation for studying replay defenses. A signed transaction passes through authentication/session binding and then the configured check order. HMAC verification is implemented in \`server/utils/hmac.js\` and invoked in \`server/core.js\`; timestamp bounds use \`server/utils/timestamp.js\`; nonce consumption is in \`server/utils/nonce.js\`; request-ID lookup is in \`server/utils/idempotency.js\`; balance and ledger writes are in \`server/core.js\`. \`CHECK_ORDER\` is parsed near the top of \`server/core.js\` and the pipeline dispatches those checks before the balance transaction. \`IDEMPOTENCY_POLICY=success_only\` permits a fresh retry after a FAILED insufficient-balance row while blocking duplicate successful IDs; \`any_outcome\` treats either SUCCESS or FAILED as consumed. In both policies callers should retry an insufficient balance only after funding and with a fresh nonce; using a new request ID is required under \`any_outcome\`.\n\n`;
body += intro;

body += '## Table of contents\n\n| Path | Lines | Bundle lines |\n|---|---:|---:|\n';
const tocEntries = [];
const tocStart = lines(body) + 1;
for (const f of [...files].sort()) {
  const src = scrub(read(f));
  tocEntries.push({ f, n: lines(src) });
}
// Fixed-point line locations: TOC rows themselves are one line each.
const sectionsStart = tocStart + tocEntries.length + 3;
let offset = sectionsStart;
for (const e of tocEntries) {
  const titleLines = 2;
  const contentLines = e.n + 2;
  e.range = `${offset}-${offset + titleLines + contentLines - 1}`;
  offset += titleLines + contentLines + 1;
}
for (const e of tocEntries) body += `| \`${e.f}\` | ${e.n} | ${e.range} |\n`;
body += '\n## Repository tree (excluding dependencies, builds, databases, captures, result files, and this generated bundle)\n\n```text\n';
function tree(dir, depth=0) {
  let out='';
  for (const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
    if (['node_modules','dist','.git','db','captures','results','__pycache__'].includes(e.name)) continue;
    const p=path.join(root,dir,e.name), r=rel(p);
    if (e.isDirectory()) out += `${'  '.repeat(depth)}${e.name}/\n`+tree(r,depth+1);
    else {
      if(/^REVIEW_BUNDLE_V2(?:_part\d+)?\.md$/i.test(e.name)) continue;
      const data=fs.readFileSync(p); const text=data.toString('utf8'); out += `${'  '.repeat(depth)}${e.name} (${data.length} B, ${lines(text)} lines)\n`;
    }
  }
  return out;
}
body += tree('',0) + '```\n\n';

body += `## Plain-English request flow\n\n${intro.replace(/^## What this project is and how it flows\n\n/, '')}`;
body += `## Reference tables\n\n### Environment variables\n\n| Variable | Default | Read in | Effect |\n|---|---|---|---|\n`;
const sourceCore = read('server/core.js');
const varLocations = new Map();
for(const file of files) {
  if(!/\.(js|py)$/.test(file)) continue;
  const src=read(file);
  for(const m of src.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)|\benv\.([A-Z][A-Z0-9_]*)/g)) {
    const name=m[1]||m[2], arr=varLocations.get(name)||[]; arr.push(file); varLocations.set(name,arr);
  }
}
const exampleDefaults=new Map();
if(fs.existsSync(path.join(root,'server/.env.example'))) for(const line of read('server/.env.example').split(/\r?\n/)) {
  const m=line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/); if(m) exampleDefaults.set(m[1],m[2]);
}
for(const [name,locations] of [...varLocations].sort(([a],[b])=>a.localeCompare(b))) {
  let fallback=exampleDefaults.has(name)?exampleDefaults.get(name):'not specified';
  const coreDecl=sourceCore.split(/\r?\n/).find(line=>line.includes(`process.env.${name}`));
  if(coreDecl) { const m=coreDecl.match(/\|\|\s*([^);,]+)|\?\?\s*([^);,]+)/); if(m) fallback=m[1]||m[2]; }
  body+=`| \`${name}\` | \`${String(fallback).replaceAll('|','\\|')}\` | ${[...new Set(locations)].map(x=>`\`${x}\``).join(', ')} | See the named option's use at the listed source locations. |\n`;
}
body += [
  '', '### HTTP routes', '', '| Method | Path | Authentication / checks | Gate |', '|---|---|---|---|',
  '| GET | `/api/health` | none | none |', '| POST | `/api/login` | user ID and PIN; issues bearer session | none |',
  '| GET | `/api/balance/:user_id` | bearer session bound to user | none |', '| GET | `/api/transactions/:user_id` | bearer session bound to user | none |',
  '| POST | `/api/deposit` | bearer, signed-request pipeline, account ownership | deposit replay protection / defense flags |',
  '| POST | `/api/withdraw` | bearer, signed-request pipeline, account ownership and balance | defense flags |',
  '| POST | `/api/reset` | demo-only reset operation | `ENABLE_DEMO_ROUTES` |', '| POST | `/api/demo/nonce-crash` | demo nonce wipe operation | `ENABLE_DEMO_ROUTES` |',
  '| POST | `/__test/fault/nonce-store` | test-only fault injection | `ENABLE_TEST_FAULT_ROUTE` |', '| GET | `/__test/unhandled-error` | test-only error path | `ENABLE_TEST_FAULT_ROUTE` |',
  '| POST | `/__test/profile/flush` | test-only profiling flush | `ENABLE_TEST_FAULT_ROUTE` |', '',
  '### SQLite schema and indexes', '', 'Initialization and migration SQL excerpt from server/core.js; full source and migration tests follow.', '', '```js',
  sourceCore.split(/\r?\n/).slice(124,187).join('\n'), '```', ''
].join('\n');
body += `## Decision and bug log\n\n- Policy-aware request-ID migration and lookup: \`server/core.js\`, \`server/utils/idempotency.js\`, migration and policy tests.\n- E3 now imports the server timestamp-window helper: \`experiments/e3/run.js\`, \`server/utils/timestamp.js\`.\n- E4b repetitions and E4c common-random-number retry pattern: \`experiments/e4/run.js\`; corrected outputs are identified in \`docs/RESULTS_PACK_A.md\`.\n- Audit independently re-parses experiment outputs and computes its own intervals: \`experiments/audit/verify-results.js\`; latest report is \`experiments/results/audit/audit-report.md\`.\n- Earlier discovered proxy transfer-encoding, nonce expiry, oracle, E4c flag/state reuse, and profile flush corrections are recorded in the prior bundle and experiment documentation; do not cite superseded outputs.\n\n`;
body += `## Changes since the first REVIEW_BUNDLE commit\n\nFirst bundle commit: \`${base}\`. The following is the complete requested source/document diff from that commit to source HEAD. Result data is excluded; committed earlier review-bundle documents are included because the requested range starts at their ancestor.\n\n\`\`\`diff\n${scrub(run(['-c','diff.astextplain.textconv=','diff','--no-ext-diff','--no-textconv','--unified=2',`${base}..HEAD`,'--','server','client','experiments','attack','package.json','docs/*.md',':(exclude)experiments/results/**']))}\n\`\`\`\n\n`;
body += `## Outcomes\n\nHeadline result tables, raw CSV paths, hashes, and caveats are reproduced from \`docs/RESULTS_PACK_A.md\` below.\n\n${scrub(read('docs/RESULTS_PACK_A.md'))}\n\n`;
body += `## Commands and run log\n\nThe exact reproduction commands and expected runtimes are listed in \`docs/REPRODUCE.md\`. Saved metadata paths include \`experiments/results/e1-v2/run.json\`, \`experiments/results/e1-v2-s11/run.json\`, \`experiments/results/e2-v2/run.json\`, \`experiments/results/e3-v2/run.json\`, \`experiments/results/e4-v2/run.json\`, and the per-run JSON files under \`experiments/results/s10-policy-*\`.\n\n## Known issues, uncertainties, and weak spots\n\n- Results are localhost measurements on one Windows machine using Memurai Developer; they do not predict real network latency.\n- E3 uses stated assumed delay/clock profiles.\n- E4a tests only the sampled delay grid; a threshold flip between sampled values is not an observed cell.\n- Concurrency and timing results apply to this single-process SQLite simulation.\n- E2 high-performance C8 was optional and was not rerun unless a v3 output is present in the result pack.\n\n## Self-review checklist\n\n1. **Are success decisions derived from SQLite ledger rows?** Yes for the F1 oracle and independent audit: the oracle queries ledger rows; see \`experiments/audit/verify-results.js\` and the included source. HTTP accepted counts are separately reported and are not treated as debit counts.\n2. **Does S10 replay one captured request or several?** Each S10 replay cell replays one captured FAILED request 30 times; separate resubmission cells create distinct failed IDs. Evidence: Results Pack methods and \`experiments/e1/run.js\`.\n3. **Does E3 use the same timestamp rule as the server?** Yes, both import \`isTimestampWithinWindow\` from \`server/utils/timestamp.js\`.\n4. **Can a harness reuse nonce, request ID, or session token across configurations?** Run IDs and per-configuration DB/nonce namespaces are fresh; request identifiers derive from run-specific values. Login returns a fresh server session per server run.\n5. **Can a harness leave state from a previous cell?** E1 creates per-config database and Redis namespace; E3 starts fresh server/database per cell. E4c's first rerun reused output state and was explicitly superseded; only the fresh-directory rerun is cited.\n6. **Are PAST/FUTURE/TTL/SESSION_TTL values what the server received?** Child-process environment assembly is in each experiment runner; inspect \`serverEnv\` in \`experiments/e1/run.js\` and the spawned-server setup in \`experiments/e4/run.js\`. Scaled E1/E4 profiles use the values recorded in each run's metadata.\n\n`;
body += `### Server environment values verified from child-process builders\n\n- E1 scaled profile: \`TIMESTAMP_PAST_WINDOW_SECONDS=6\`, \`TIMESTAMP_FUTURE_WINDOW_SECONDS=2\`, \`NONCE_TTL=4\`, \`SESSION_TTL=15\`; default-window confirmation: \`300\`, \`5\`, \`86400\`, and \`900\` respectively. Values are assigned in \`experiments/e1/run.js\` and recorded in each run metadata JSON.\n- E4 base profile: PAST=6, FUTURE=2, NONCE_TTL=4, SESSION_TTL=3600; E4a overrides NONCE_TTL per cell with 4, 6, 8, 10, or 12. Assignments are in \`experiments/e4/run.js\`; per-run/cell metadata records the active values.\n\n`;
body += `## Full source\n\n`;
for (const e of tocEntries) {
  const content = scrub(read(e.f));
  body += `### \`${e.f}\` (${e.n} lines)\n\n\`\`\`\n${content}\n\`\`\`\n\n`;
}
// Replace approximate TOC locations with exact source section ranges.
const allLines = body.split(/\r?\n/);
for (const e of tocEntries) {
  const title = `### \`${e.f}\` (${e.n} lines)`;
  const start = allLines.findIndex((line) => line === title) + 1;
  const sourceStart = start + 3;
  const end = sourceStart + e.n - 1;
  const row = `| \`${e.f}\` | ${e.n} | ${sourceStart}-${end} |`;
  const ix = allLines.findIndex((line) => line.startsWith(`| \`${e.f}\` |`));
  if (ix >= 0) allLines[ix] = row;
}
body = allLines.join('\n');
const splitAt = 3_500_000;
const bodyLines = body.split('\n');
const chunks=[]; let chunk=[], bytes=0;
for (const line of bodyLines) {
  const n=Buffer.byteLength(line,'utf8')+1;
  if (bytes+n>splitAt && chunk.length) { chunks.push(chunk.join('\n')); chunk=[]; bytes=0; }
  chunk.push(line); bytes+=n;
}
if (chunk.length) chunks.push(chunk.join('\n'));
const partNames=chunks.map((_,i)=>`REVIEW_BUNDLE_V2_part${i+1}.md`);
const provisionalHeader=`# Review Bundle V2, part 1 of ${chunks.length}\n\nSource HEAD: \`${head}\`. Parts are ordered numerically. This part continues the unified bundle; fenced blocks may continue in the next part.\n\n`;
const tocHeader='# Shared table of contents\n\n| File | Source line count | Bundle part and line range |\n|---|---:|---|\n';
const tocLines=tocHeader+tocEntries.map(e=>`| \`${e.f}\` | ${e.n} | placeholder |`).join('\n')+'\n';
const sourceLocations=new Map();
for (let i=0;i<chunks.length;i++) {
  const partLines=chunks[i].split('\n');
  for (const e of tocEntries) {
    const title=`### \`${e.f}\` (${e.n} lines)`;
    const idx=partLines.findIndex(x=>x===title);
    if(idx>=0) sourceLocations.set(e.f,`${partNames[i]}:${lines(provisionalHeader+tocLines)-1+idx+1}-${lines(provisionalHeader+tocLines)-1+idx+e.n}`);
  }
}
const toc=tocHeader+tocEntries.map(e=>`| \`${e.f}\` | ${e.n} | ${sourceLocations.get(e.f)||'included in narrative/diff'} |`).join('\n')+'\n';
for (let i=0;i<chunks.length;i++) {
  const partHeader=`# Review Bundle V2, part ${i+1} of ${chunks.length}\n\nSource HEAD: \`${head}\`. Parts are ordered numerically. This part continues the unified bundle; fenced blocks may continue in the next part.\n\n${toc}\n---\n\n`;
  fs.writeFileSync(path.join(root,'docs',partNames[i]),partHeader+chunks[i],'utf8');
}
const index=`# Review Bundle V2\n\nThe complete bundle is split because it exceeds 4 MB. Read the parts in numeric order. Each part repeats the shared file and line-count table.\n\nSource HEAD: \`${head}\`\nGenerated: ${new Date().toISOString()}\nParts: ${partNames.map(n=>`[${n}](${n})`).join(', ')}\n\n${toc}`;
fs.writeFileSync(out,index,'utf8');
const totalBytes=[out,...partNames.map(n=>path.join(root,'docs',n))].reduce((s,p)=>s+fs.statSync(p).size,0);
const bundleText=[out,...partNames.map(n=>path.join(root,'docs',n))].map(p=>fs.readFileSync(p,'utf8')).join('\n');
const secretMatches=[...secrets].filter(s=>s.length>3).reduce((n,s)=>n+bundleText.split(s).length-1,0);
const exposedBearerCount=(bundleText.match(/Authorization\s*[:=]\s*Bearer\s+(?!<REDACTED>)[A-Za-z0-9._~+/=-]{8,}/gi)||[]).length;
const exposedCredentialFieldCount=(bundleText.match(/(?:sessionKey|session_key|sessionToken|session_token|signature|sig|bearerToken|token)"?\s*:\s*"(?!<REDACTED>)[A-Za-z0-9._~+/=-]{8,}"/gi)||[]).length;
const report = { path: rel(out), parts: partNames, bytes: totalBytes, lines: lines(body), sourceHead: head, sourceFiles: tocEntries.length, knownCaptureValuesCollected: secrets.size, exactSecretOrCaptureMatches: secretMatches, exposedBearerCount, exposedCredentialFieldCount, generatedAt: new Date().toISOString() };
fs.writeFileSync(path.join(root,'experiments/results/audit/review-bundle-scan.json'), JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
