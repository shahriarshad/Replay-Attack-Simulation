const fs = require('fs');
const path = require('path');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const cells = []; let value = ''; let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const c = line[i];
      if (quoted && c === '"' && line[i + 1] === '"') { value += '"'; i += 1; }
      else if (c === '"') quoted = !quoted;
      else if (c === ',' && !quoted) { cells.push(value); value = ''; }
      else value += c;
    }
    cells.push(value); return cells;
  });
}

const root = path.resolve(__dirname, '../..');
const input = path.join(root, 'experiments/results/e4-v2/e4a-requests.csv');
const [header, ...data] = parseCsv(fs.readFileSync(input, 'utf8'));
const rows = data.map((cells) => Object.fromEntries(header.map((key, i) => [key, cells[i]])));
const groups = new Map();
for (const row of rows.filter((r) => r.request_id_defense === '0')) {
  const k = [row.configuration, row.nonce_ttl_seconds, row.client_future_offset_seconds, row.replay_delay_seconds].join('|');
  const group = groups.get(k) || [];
  group.push(row); groups.set(k, group);
}
const violations = []; const flips = [];
for (const [key, cell] of groups) {
  const [configuration, ttlText, futureText, delayText] = key.split('|');
  const ttl = Number(ttlText), future = Number(futureText), delay = Number(delayText);
  const predicted = ttl <= delay && delay < 6 + future;
  const accepted = cell.filter((r) => r.replay_accepted === '1').length;
  const actual = accepted > 0;
  if (cell.length !== 30 || actual !== predicted) violations.push({ configuration, ttl, future, delay, trials: cell.length, accepted, expectedAcceptedCell: predicted });
  flips.push({ configuration, ttl, future, delay, accepted, trials: cell.length, expectedAcceptedCell: predicted });
}
const cells = [...groups.values()].length;
const ranges=new Map();for(const r of flips){const k=[r.configuration,r.ttl,r.future].join('|');const a=ranges.get(k)||[];a.push(r);ranges.set(k,a);}const boundaryTransitions=[];for(const [k,a] of ranges){a.sort((x,y)=>x.delay-y.delay);for(let i=1;i<a.length;i++){const prev=a[i-1],next=a[i];if((prev.accepted===30)!==(next.accepted===30))boundaryTransitions.push({configuration:prev.configuration,ttl:prev.ttl,future_offset:prev.future,from_delay:prev.delay,from_accepted:prev.accepted,to_delay:next.delay,to_accepted:next.accepted});}}
const result = { input: path.relative(root, input).replace(/\\/g, '/'), cells, trialsPerCell: 30, requestIdDefense: 0, rule: 'accepted iff TTL <= delay < PAST(6s) + future_offset', violatingCells: violations.length, violations, boundaryTransitions, checkedAt: new Date().toISOString() };
const output = path.join(root, 'experiments/results/e4-v2/e4a-rule-check.json');
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`E4a cells=${cells}, violations=${violations.length}, output=${path.relative(root, output)}\n`);
