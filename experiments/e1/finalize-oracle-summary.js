const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const output = path.resolve(process.env.E1_OUTPUT_DIR || path.join(root, 'experiments/results/e1-sqlite-final'));
const run = JSON.parse(fs.readFileSync(path.join(output, 'run.json'), 'utf8'));
const runDirectory = path.join(output, run.dataRunDirectory);
function parseCsv(text) {
  const parseLine = (line) => {
    const values = []; let value = ''; let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (quoted && char === '"' && line[index + 1] === '"') { value += '"'; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { values.push(value); value = ''; }
      else value += char;
    }
    values.push(value); return values;
  };
  const lines = text.trimEnd().split(/\r?\n/);
  const headers = parseLine(lines[0]);
  return { headers, rows: lines.slice(1).map(parseLine) };
}
function writeCsv(file, headers, rows) {
  const q = (value) => { const s = value === null || value === undefined ? '' : String(value); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  fs.writeFileSync(file, `${[headers.join(','), ...rows.map((row) => headers.map((key) => q(row[key])).join(','))].join('\n')}\n`);
}
let proxyTimingRows = 0;
for (const name of fs.readdirSync(runDirectory)) {
  const directory = path.join(runDirectory, name);
  if (!fs.statSync(directory).isDirectory()) continue;
  const stdout = path.join(directory, 'proxy.stdout.log');
  if (!fs.existsSync(stdout)) continue;
  const match = fs.readFileSync(stdout, 'utf8').match(/capture file:\s*(.+)/);
  if (!match) continue;
  const log = `${match[1].trim()}.jsonl`;
  if (!fs.existsSync(log)) continue;
  const timings = fs.readFileSync(log, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => {
    const item = JSON.parse(line);
    return { method: item.request.method, path: item.request.path, start_ns: item.start_ns, end_ns: item.end_ns, duration_ns: item.duration_ns, http_status: item.response.statusCode };
  });
  if (timings.length) {
    proxyTimingRows += timings.length;
    writeCsv(path.join(directory, 'proxy-request-timings.csv'), ['method', 'path', 'start_ns', 'end_ns', 'duration_ns', 'http_status'], timings);
  }
}
const summaryFile = path.join(runDirectory, 'summary.csv');
const parsed = parseCsv(fs.readFileSync(summaryFile, 'utf8'));
const rows = parsed.rows.map((cells) => Object.fromEntries(parsed.headers.map((header, index) => [header, cells[index]])));
for (const row of rows) {
  if (row.scenario_id === 'LEGITIMATE_CONTROL') continue;
  row.oracle_integrity_holds = Number(row.oracle_duplicate_debit_count_delta) === 0 && Number(row.oracle_unauthorized_debit_amount_delta) === 0;
}
writeCsv(summaryFile, parsed.headers, rows);
fs.copyFileSync(summaryFile, path.join(output, 'summary.csv'));
const latex = ['\\begin{tabular}{llrrrrl}', '\\toprule', 'Configuration & Scenario & Attempts & Accepted & Debits & Success rate & Wilson 95\\% CI \\\\', '\\midrule', ...rows.filter((row) => row.scenario_id !== 'LEGITIMATE_CONTROL').map((row) => `${row.config_id} & ${row.scenario_id} & ${row.attempts} & ${row.http_accepted_count} & ${row.debited_count} & ${(100 * Number(row.attack_success_rate)).toFixed(2)}\\% & ${row.wilson95_low === '' ? 'constant outcome' : `${Number(row.wilson95_low).toFixed(4)}--${Number(row.wilson95_high).toFixed(4)}`} \\\\`), '\\bottomrule', '\\end{tabular}', ''];
fs.writeFileSync(path.join(runDirectory, 'summary.tex'), latex.join('\n'));
fs.copyFileSync(path.join(runDirectory, 'summary.tex'), path.join(output, 'summary.tex'));
run.allSummaries = rows;
fs.writeFileSync(path.join(runDirectory, 'run.json'), `${JSON.stringify(run, null, 2)}\n`);
fs.copyFileSync(path.join(runDirectory, 'run.json'), path.join(output, 'run.json'));
process.stdout.write(`Finalized ${rows.length} E1 summary rows from direct SQLite oracle deltas and ${proxyTimingRows} proxy-request timing rows in ${summaryFile}.\n`);
