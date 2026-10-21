from pathlib import Path
import csv,re,json,zlib
ROOT=Path(__file__).resolve().parents[1]
P=ROOT/'paper'; compared=0; mismatches=[]; disagreements=[]
SCEN=['S1','S2','S3','S4','S5','S6','S7a','S7b','S10 fast','S10 late','S11']
CONFIGS=sorted([f'H{h}T{t}N{n}R{r}' for h in (0,1) for t in (0,1) for n in (0,1) for r in (0,1)])
def read_csv(path):
    with (ROOT/path).open(newline='',encoding='utf-8-sig') as f:return list(csv.DictReader(f))
def summary_map(path):
    return {(r['config_id'],r['scenario_id'],r.get('variant','')):r for r in read_csv(path)}
e1=summary_map('experiments/results/e1-v2/summary.csv')
round_summaries={}
for scenario,run in [('S10 fast','B-S10-fast-R0'),('S10 late','B-S10-late-R0')]:
    for rid in (0,1):
        rname=('B-S10-fast-' if scenario=='S10 fast' else 'B-S10-late-')+f'R{rid}'
        for row in read_csv(f'experiments/results/round-f/{rname}/summary.csv'):
            key=(row['config_id'].split('-')[0],scenario,row['config_id'].split('-')[-1] if rid else 'success_only')
            round_summaries[key]=row
for row in read_csv('experiments/results/round-f/B-s11-100/summary.csv'):
    if row['scenario_id']=='S11': round_summaries[(row['config_id'].split('-')[0],'S11','success_only')]=row

def expected(cfg,scen,policy='success_only'):
    if scen in ('S1','S2','S3','S4','S5','S6','S7a','S7b','S8','S9'):
        var={'S7a':'request_id','S7b':'nonce'}.get(scen,'')
        r=e1.get((cfg,scen,var))
        if r is None: return None
    else:r=round_summaries.get((cfg,scen,policy))
    if not r:return None
    return int(r['http_accepted_count']),int(r['attempts'])
def record(label,got,want):
    global compared
    compared+=1
    if got!=want:mismatches.append({'cell':label,'printed':got,'source':want})

def untex(x):return x.replace(r'\_','_').strip()
def table_rows(path):
    lines=(P/'tables'/path).read_text(encoding='utf-8').splitlines(); active=False; out=[]
    for line in lines:
        if line=='\\midrule':active=True;continue
        if line=='\\bottomrule':break
        if active and '&' in line:
            vals=[untex(v.strip().removesuffix(r'\\')) for v in line.split('&')]
            vals[-1]=untex(vals[-1].replace(r'\\',''))
            out.append(vals)
    return out
# T5 is the numeric source-aligned matrix. Validate each cell against E1 and Round F.
t5=table_rows('T5-e1-coverage.tex')
if len(t5)!=16: mismatches.append({'cell':'T5 row count','printed':len(t5),'source':16})
for row in t5:
    cfg=row[0]
    for scen,val in zip(SCEN,row[1:]):
        source_scen=scen; policy='success_only'
        want=expected(cfg,source_scen,policy)
        gotk=int(val)
        if want is None: mismatches.append({'cell':f'T5 {cfg} {scen}','printed':gotk,'source':'missing'}); continue
        record(f'T5 {cfg} {scen}',(gotk,int(want[1])),want)
# Decode the PDF text runs independently: Matplotlib writes the F2 cell labels in 7-point F3 text.
def pdf_cell_text(path):
    data=(P/'figures'/path).read_bytes(); streams=[]
    for m in re.finditer(rb'stream\r?\n',data):
        start=m.end(); end=data.find(b'endstream',start); raw=data[start:end].rstrip(b'\r\n')
        try: decoded=zlib.decompress(raw)
        except zlib.error: continue
        if b'/F3 7 Tf' in decoded: streams.append(decoded)
    if len(streams)!=1: raise ValueError(f'expected one cell-text content stream in {path}, got {len(streams)}')
    pattern=rb'q\s+1 0 -0 1 ([0-9.]+) ([0-9.]+) cm\s+BT\s+/F3 7 Tf\s+0 0 Td\s+\[(.*?)\]\s*TJ\s+ET\s+Q'
    found=[]
    for m in re.finditer(pattern,streams[0],re.S):
        pieces=re.findall(rb'\((.*?)\)',m.group(3),re.S)
        label=b''.join(pieces).decode('utf-16-be','strict')
        found.append((float(m.group(1)),float(m.group(2)),label))
    if len(found)!=len(CONFIGS)*len(SCEN): raise ValueError(f'{path} has {len(found)} cells, expected {len(CONFIGS)*len(SCEN)}')
    # Page y increases upward; rows are emitted top-to-bottom.
    found.sort(key=lambda x:(-round(x[1],4),x[0]))
    return [x[2] for x in found]
for figure in ['F2-e1-coverage-single.pdf','F2-e1-coverage-double.pdf']:
    printed=pdf_cell_text(figure)
    for i,(cfg,scen) in enumerate((c,s) for c in CONFIGS for s in SCEN):
        want=expected(cfg,scen)
        record(f'{figure} {cfg} {scen}',int(printed[i]),None if want is None else want[0])
# Compare overlapping S10/S11 success rates at 30 vs 100 attempts, and report disagreements.
for cfg in CONFIGS:
    for scen in ['S10 fast','S10 late','S11']:
        old=e1.get((cfg,scen.replace(' ','_'),''))
        new=round_summaries.get((cfg,scen,'success_only'))
        if old and new:
            a,an=int(old['http_accepted_count']),int(old['attempts']); b,bn=int(new['http_accepted_count']),int(new['attempts'])
            if a/an != b/bn: disagreements.append({'config':cfg,'scenario':scen,'30_attempt':f'{a}/{an}','100_attempt':f'{b}/{bn}'})
# T2-full per-configuration S10 cells, including each policy.
for row in table_rows('T2-full.tex'):
    if row[0] not in ('S10_fast','S10_late'):continue
    scen='S10 fast' if row[0]=='S10_fast' else 'S10 late'; cfg=row[1]; pol=row[2]
    if pol=='success_only' and cfg.endswith('R0'):policy='success_only'
    else:policy=pol
    want=expected(cfg,scen,policy)
    got=(int(row[3]),int(row[4]))
    record(f'T2-full {cfg} {scen} {pol}',got,want)
# Compact T2 group rows: validate each grouped cell by aggregating matching Round F summary records.
for row in table_rows('T2.tex'):
    policy,group,scenario,kn,_scope=row
    if scenario not in ('fast','late'):continue
    scen='S10 '+scenario
    rid=1 if 'R on' in group else 0
    freshness=group.split('; ')[1]
    tn={'none':(0,0),'T only':(1,0),'N only':(0,1),'T and N':(1,1)}[freshness]
    candidates=[c for c in CONFIGS if c.endswith(f'R{rid}') and int(c[3])==tn[0] and int(c[5])==tn[1]]
    if _scope in CONFIGS:candidates=[_scope]
    vals=[expected(c,scen,policy) for c in candidates]
    vals=[v for v in vals if v is not None]
    want=(sum(v[0] for v in vals),sum(v[1] for v in vals))
    m=re.match(r'(\d+)/(\d+)',kn); got=(int(m.group(1)),int(m.group(2))) if m else None
    record(f'T2 {policy} {group} {scen}',got,want)
# Explicit report.
lines=['Independent paper asset cross-check','',f'Values compared: {compared}',f'Mismatches: {len(mismatches)}',f'30-attempt vs 100-attempt rate disagreements: {len(disagreements)}','', 'Method: standalone CSV parser and formulas; parses the embedded 7-point cell labels from both F2 PDFs, compares T5 and T2/T2-full printed cells against E1 v2 and Round F summary CSVs, and lists overlapping 30-vs-100 rate disagreements.', '', 'Mismatches:']
lines += [json.dumps(x,sort_keys=True) for x in mismatches] or ['None.']
lines += ['', 'Cells whose success rates differ between the 30-attempt E1 v2 and 100-attempt Round F runs:']
lines += [json.dumps(x,sort_keys=True) for x in disagreements] or ['None.']
(P/'CROSSCHECK.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(f'Cross-check values compared: {compared}; mismatches: {len(mismatches)}; 30 vs 100 rate disagreements: {len(disagreements)}')
if mismatches: raise SystemExit(1)
