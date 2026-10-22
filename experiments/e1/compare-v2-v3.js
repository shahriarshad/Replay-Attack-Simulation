'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.resolve(process.env.E1_COMPARISON_OUTPUT || path.join(ROOT, 'experiments/results/round-i/e1-v2-v3-cell-differences.csv'));
function parseCsv(text) { const lines = text.trim().split(/\r?\n/); const parse = line => { const out=[]; let field='',quoted=false; for(let i=0;i<line.length;i++){const c=line[i];if(quoted){if(c==='"'&&line[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}else if(c==='"')quoted=true;else if(c===','){out.push(field);field='';}else field+=c;}out.push(field);return out;}; const h=parse(lines.shift()); return lines.map(l=>Object.fromEntries(parse(l).map((v,i)=>[h[i],v]))); }
function rows(rel) { return parseCsv(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
function map(rows) { return new Map(rows.filter(r=>r.scenario_id!=='LEGITIMATE_CONTROL').map(r=>[`${r.config_id}|${r.scenario_id}|${r.variant||''}`,r])); }
const v2 = map([...rows('experiments/results/e1-v2/summary.csv'), ...rows('experiments/results/e1-v2-s11/summary.csv')]);
const v3base = map(rows('experiments/results/e1-v3/round-i-scaled/summary.csv'));
const v3s11 = map(rows('experiments/results/e1-v3-s11/round-i-s11/summary.csv'));
const v3 = new Map([...v3base,...v3s11]);
const output=[];
for (const [key, newer] of v3) {
  if (!v2.has(key)) continue;
  const older=v2.get(key); const oldK=Number(older.debited_count), newK=Number(newer.debited_count), oldN=Number(older.attempts), newN=Number(newer.attempts);
  if (oldK!==newK || oldN!==newN || oldK/oldN!==newK/newN) output.push({config_id:newer.config_id,scenario_id:newer.scenario_id,variant:newer.variant||'',v2_successes:oldK,v2_attempts:oldN,v2_rate:oldK/oldN,v3_successes:newK,v3_attempts:newN,v3_rate:newK/newN,difference_kind:oldK/oldN!==newK/newN?'SUCCESS_RATE_CHANGED':'ATTEMPT_COUNT_CHANGED_RATE_SAME',difference:'E1 v2 used TTL 4 s; E1 v3 used TTL 8 s'});
}
fs.mkdirSync(path.dirname(OUT),{recursive:true});const headers=Object.keys(output[0]||{config_id:'',scenario_id:'',variant:'',v2_successes:'',v2_attempts:'',v2_rate:'',v3_successes:'',v3_attempts:'',v3_rate:'',difference:''});const q=v=>{v=String(v??'');return /[",\r\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v;};fs.writeFileSync(OUT,[headers.join(','),...output.map(r=>headers.map(h=>q(r[h])).join(','))].join('\n')+'\n');process.stdout.write(`Compared ${[...v3.keys()].filter(k=>v2.has(k)).length} overlapping cells; differing cells ${output.length}; ${OUT}\n`);
