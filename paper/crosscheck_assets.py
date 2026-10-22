"""Independent paper-cell validation. Does not import the asset generator."""
from pathlib import Path
import csv, re, zlib, json

ROOT = Path(__file__).resolve().parents[1]
PAPER = ROOT / 'paper'
CONFIGS = [f'H{h}T{t}N{n}R{r}' for h in (0,1) for t in (0,1) for n in (0,1) for r in (0,1)]
SCENARIOS = ['S1','S2','S3','S4','S5','S6','S7a','S7b','S10 fast','S10 late','S11']
compared = 0
mismatches = []
def csv_rows(relative):
    with (ROOT / relative).open(newline='', encoding='utf-8-sig') as stream:
        return list(csv.DictReader(stream))
def keyed(relative, config_field='config_id'):
    return {(r[config_field], r['scenario_id']): r for r in csv_rows(relative)}
def check(label, actual, expected):
    global compared
    compared += 1
    if actual != expected:
        mismatches.append({'cell': label, 'asset_value': actual, 'summary_value': expected})
def wilson(k,n):
    z=1.959963984540054; p=k/n; d=1+z*z/n; c=(p+z*z/(2*n))/d; m=z*((p*(1-p)+z*z/(4*n))/n)**0.5/d
    return max(0,c-m),min(1,c+m)
v3 = keyed('experiments/results/e1-v3/round-i-scaled/summary.csv')
s10rows = csv_rows('experiments/results/e1-v3-s10-independent/2026-10-22T04-40-36-408Z/summary.csv')
s10 = {(r['config_id'].rsplit('-',1)[0], r['scenario_id'], r['policy']): r for r in s10rows}
s11 = keyed('experiments/results/e1-v3-s11/round-i-s11/summary.csv')
expected = {}
for config in CONFIGS:
    for scenario in SCENARIOS[:8]:
        row = v3[(config, scenario)]
        expected[(config, scenario)] = (int(row['debited_count']), int(row['attempts']))
    for label, source in [('S10 fast','S10_indep_fast'),('S10 late','S10_indep_late')]:
        row = s10[(config, source, 'success_only')]
        expected[(config, label)] = (int(row['delayed_execution_count']), int(row['attempts']))
    row = s11[(config, 'S11')]
    expected[(config, 'S11')] = (int(row['debited_count']), int(row['attempts']))

def tex_table(relative):
    lines = (PAPER / relative).read_text(encoding='utf-8').splitlines()
    active = False
    result = []
    for line in lines:
        if line.strip() == r'\midrule': active = True; continue
        if line.strip() == r'\bottomrule': break
        if active and '&' in line:
            fields = [x.strip().replace(r'\_', '_') for x in line.split('&')]
            fields[-1] = fields[-1].removesuffix(r'\\').strip()
            result.append(fields)
    return result

t5 = tex_table('tables/T5-e1-coverage.tex')
if len(t5) != 16:
    mismatches.append({'cell':'T5 configuration rows','asset_value':len(t5),'summary_value':16})
for row in t5:
    config = row[0]
    for scenario, printed in zip(SCENARIOS, row[1:]):
        k, n = expected[(config, scenario)]
        check(f'T5 {config} {scenario}', (int(printed), n), (k, n))

def pdf_values(filename):
    content = (PAPER/'figures'/filename).read_bytes()
    streams=[]
    for match in re.finditer(rb'stream\r?\n', content):
        start=match.end(); end=content.find(b'endstream',start); stream=content[start:end].rstrip(b'\r\n')
        try: decoded=zlib.decompress(stream)
        except zlib.error: continue
        if b'/F3 7 Tf' in decoded: streams.append(decoded)
    if len(streams)!=1: raise ValueError(f'{filename}: expected one cell-label stream, found {len(streams)}')
    pattern=rb'q\s+1 0 -0 1 ([0-9.]+) ([0-9.]+) cm\s+BT\s+/F3 7 Tf\s+0 0 Td\s+\[(.*?)\]\s*TJ\s+ET\s+Q'
    values=[]
    for match in re.finditer(pattern,streams[0],re.S):
        pieces=re.findall(rb'\((.*?)\)',match.group(3),re.S)
        values.append((float(match.group(1)),float(match.group(2)),int(b''.join(pieces).decode('utf-16-be'))))
    if len(values)!=len(CONFIGS)*len(SCENARIOS): raise ValueError(f'{filename}: expected 176 heatmap labels, got {len(values)}')
    values.sort(key=lambda item:(-round(item[1],4),item[0]))
    return [x[2] for x in values]
for figure in ['F2-e1-coverage-single.pdf','F2-e1-coverage-double.pdf']:
    values=pdf_values(figure)
    for index,(config,scenario) in enumerate((c,s) for c in CONFIGS for s in SCENARIOS):
        check(f'{figure} {config} {scenario}', values[index], expected[(config,scenario)][0])

# The S10 table entries are independently checked from the source summary as well.
for row in tex_table('tables/T2-full.tex'):
    policy, config, scenario, kn, ci = row
    label = 'S10 fast' if scenario == 'fast' else 'S10 late'
    summary = s10[(config, 'S10_indep_'+scenario, policy)]
    check(f'T2-full {policy} {config} {label}', tuple(map(int, kn.split('/'))), (int(summary['delayed_execution_count']),int(summary['attempts'])))
    numbers=re.findall(r'\d+\.\d+',ci)
    low,high=wilson(int(summary['delayed_execution_count']),int(summary['attempts']))
    check(f'T2-full {policy} {config} {label} Wilson',tuple(map(float,numbers[:2])) if len(numbers)>=2 else None,(round(low,3),round(high,3)))
for row in tex_table('tables/T2.tex'):
    policy, defense, scope, fast_text, late_text, resub_text = row
    if defense == 'After funding': continue
    rid=int(re.search(r'R([01])',defense).group(1)); fresh=defense.split('; ',1)[1]
    tn={'No T/N':(0,0),'T only':(1,0),'N only':(0,1),'T and N':(1,1)}[fresh]
    configs=re.findall(r'H[01]T[01]N[01]R[01]',scope)
    def check_compact(text, scenario):
        match=re.match(r'(\d+)/(\d+) \[([0-9.]+), ([0-9.]+)\]',text)
        values=[(c,s10[(c,'S10_indep_'+scenario,policy)]) for c in configs]
        counts={(int(v['delayed_execution_count']),int(v['attempts'])) for _,v in values}
        if len(counts)!=1:
            mismatches.append({'cell':f'T2 compact {policy} {defense} {scenario}','asset_value':scope,'summary_value':'group contains non-identical cells'});return
        k,n=next(iter(counts));low,high=wilson(k,n)
        check(f'T2 compact {policy} {defense} {scenario} count',(int(match.group(1)),int(match.group(2))) if match else None,(k,n))
        check(f'T2 compact {policy} {defense} {scenario} Wilson',(round(float(match.group(3)),3),round(float(match.group(4)),3)) if match else None,(round(low,3),round(high,3)))
    check_compact(fast_text,'fast'); check_compact(late_text,'late')

report = [
    '# Independent Paper Cross-check','',
    f'Values compared: {compared}',
    f'Mismatches: {len(mismatches)}',
    'Source: E1 v3 summary.csv, S10-independent summary.csv (success_only), and E1 v3 S11 summary.csv.',
    'Method: this standalone script parses summary CSVs and LaTeX tables directly and extracts the 7-point cell labels from both F2 PDFs; it does not import generate_paper_assets.py.',
    '', '## Mismatches'
]
report += [json.dumps(row,sort_keys=True) for row in mismatches] if mismatches else ['None.']
report.append('')
(PAPER/'CROSSCHECK.txt').write_text('\n'.join(report),encoding='utf-8')
print(f'Independent cross-check compared {compared} values; mismatches={len(mismatches)}')
if mismatches: raise SystemExit(1)
