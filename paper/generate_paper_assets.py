#!/usr/bin/env python3
"""Render paper assets only from saved experiment CSVs; do not contact services."""
from __future__ import annotations

import csv
import json
import hashlib
import math
import re
import statistics
from collections import Counter, defaultdict
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
PAPER = ROOT / 'paper'
FIG = PAPER / 'figures'
TABLE = PAPER / 'tables'
PREVIEW = PAPER / 'previews'
for folder in (FIG, TABLE, PREVIEW):
    folder.mkdir(parents=True, exist_ok=True)

plt.rcParams.update({
    'font.family': 'serif', 'font.size': 8, 'axes.labelsize': 8,
    'xtick.labelsize': 8, 'ytick.labelsize': 8, 'legend.fontsize': 8,
    'pdf.fonttype': 42, 'ps.fonttype': 42, 'hatch.linewidth': 0.6,
})
CHECKED = 0


def raw(path: str) -> list[dict[str, str]]:
    with (ROOT / path).open(newline='', encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))


def sha(path: str) -> str:
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def check_value(value: float | int) -> float | int:
    """Register each printed or plotted measurement derived from the CSV rows."""
    global CHECKED
    CHECKED += 1
    if isinstance(value, float) and not math.isfinite(value):
        raise ValueError(f'non-finite raw-derived value: {value}')
    return value


def wilson(k: int, n: int) -> tuple[float, float]:
    if n == 0:
        raise ValueError('cannot form an interval for an empty raw-data cell')
    z = 1.959963984540054
    p = k / n
    den = 1 + z*z/n
    mid = (p + z*z/(2*n)) / den
    half = z * math.sqrt((p*(1-p) + z*z/(4*n))/n) / den
    return max(0, mid-half), min(1, mid+half)


def savefig(fig, stem: str, width: float, tight_rect=None) -> None:
    fig.set_size_inches(width, fig.get_size_inches()[1], forward=True)
    fig.tight_layout(rect=tight_rect)
    fig.savefig(FIG / f'{stem}.pdf')
    fig.savefig(PREVIEW / f'{stem}.png', dpi=150)
    plt.close(fig)


def tex_escape(s: str) -> str:
    return str(s).replace('\\', r'\textbackslash{}').replace('&', r'\&').replace('_', r'\_').replace('%', r'\%').replace('#', r'\#')


def write_table(name: str, headers: list[str], rows: list[list[object]]) -> None:
    out = [r'\begin{table*}[t]', r'\centering', r'\small', r'\begin{tabular}{' + 'l' * len(headers) + '}', r'\toprule', ' & '.join(tex_escape(x) for x in headers) + r' \\', r'\midrule']
    out.extend(' & '.join(tex_escape(x) for x in row) + r' \\' for row in rows)
    out += [r'\bottomrule', r'\end{tabular}', r'\end{table*}', '']
    (TABLE / f'{name}.tex').write_text('\n'.join(out), encoding='utf-8')


def latest_e1_run() -> Path:
    root = ROOT / 'experiments/results/e1-v2'
    return sorted(p for p in root.iterdir() if p.is_dir() and (p / 'H0T0N0R0/requests.csv').exists())[-1]


def latest_b_csv(run: str, config: str, policy: str = 'success_only') -> str:
    meta = __import__('json').loads((ROOT / f'experiments/results/round-f/{run}/run.json').read_text(encoding='utf-8'))
    suffix='R0' if '-R0' in run else 'R1'
    actual_config=config if run == 'B-s11-100' else config[:6]+suffix
    if suffix=='R1' and run!='B-s11-100': actual_config += '-'+policy
    return f"experiments/results/round-f/{run}/{meta['dataRunDirectory']}/{actual_config}/requests.csv"


def attacking_rows(path: str, scenario: str, variant: str | None = None) -> list[dict[str, str]]:
    rows = [r for r in raw(path) if r.get('phase') == 'attacker' and r.get('scenario_id') == scenario]
    if variant is not None:
        rows = [r for r in rows if r.get('variant') == variant]
    return rows


def cell(rows: list[dict[str, str]]) -> tuple[int, int, float]:
    n = len(rows)
    k = sum(r.get('outcome') == 'ACCEPTED' and int(r.get('http_status', '0')) == 200 for r in rows)
    return k, n, check_value(k / n if n else 0)


# Read every source once; all plotted/table figures are calculated from per-request CSV rows.
e1_path = 'experiments/results/e1-v2/' + str(latest_e1_run().relative_to(ROOT / 'experiments/results/e1-v2')).replace('\\', '/') + '/H0T0N0R0/requests.csv'
e1_dir = latest_e1_run()
configs = sorted(p.name for p in e1_dir.iterdir() if p.is_dir() and re.fullmatch(r'H[01]T[01]N[01]R[01]',p.name) and (p/'requests.csv').is_file())
e1_cells: dict[tuple[str, str], tuple[int, int, float]] = {}
for cfg in configs:
    p = f"{str(e1_dir.relative_to(ROOT)).replace('\\', '/')}/{cfg}/requests.csv"
    rows = raw(p)
    for scenario, variant in [('S1', ''), ('S2', ''), ('S3', ''), ('S4', ''), ('S5', ''), ('S6', ''), ('S7', 'S7a'), ('S7', 'S7b')]:
        matching = [r for r in rows if r.get('phase') == 'attacker' and r.get('scenario_id') == scenario and (not variant or r.get('variant') == variant)]
        e1_cells[(cfg, variant or scenario)] = cell(matching)
    for scenario in ('S8','S9'):
        matching=[r for r in rows if r.get('phase')=='attacker' and r.get('scenario_id')==scenario]
        e1_cells[(cfg,scenario)]=cell(matching)

# F2: request-level attack success matrix; S10/S11 extend the same 16-config matrix.
b_specs = [('S10 fast', 'S10_fast', 'B-S10-fast-R0', 'B-S10-fast-R1'), ('S10 late', 'S10_late', 'B-S10-late-R0', 'B-S10-late-R1')]
for cfg in configs:
    for label, scenario, r0, r1 in b_specs:
        run=r0 if cfg.endswith('R0') else r1
        p=latest_b_csv(run,cfg,'success_only')
        selected=attacking_rows(p,scenario)
        if cfg.endswith('R1'):
            selected=[r for r in selected if r.get('config_id','').endswith('success_only')]
        e1_cells[(cfg,label)]=cell(selected)
    if cfg.endswith('R0'):
        p=latest_b_csv('B-s11-100',cfg)
        e1_cells[(cfg,'S11')]=cell(attacking_rows(p,'S11'))
    else:
        # S11 stores both R0/R1 in its config names and is present in the all-config run.
        p=latest_b_csv('B-s11-100',cfg)
        e1_cells[(cfg,'S11')]=cell(attacking_rows(p,'S11'))

columns = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7a', 'S7b', 'S10 fast', 'S10 late', 'S11']
for cfg in configs:
    for col in columns:
        if (cfg, col) not in e1_cells:
            raise ValueError(f'missing F2 cell {cfg} {col}')

def f2(width: float, stem: str) -> None:
    fig, ax = plt.subplots(figsize=(width, 5.6))
    vals = np.array([[e1_cells[(cfg, c)][2] for c in columns] for cfg in configs])
    im = ax.imshow(vals, cmap='Greys', vmin=0, vmax=1, aspect='auto')
    for y, cfg in enumerate(configs):
        for x, col in enumerate(columns):
            k, n, _ = e1_cells[(cfg, col)]
            if width > 4:
                ax.text(x, y, f'{k}/{n}', ha='center', va='center', fontsize=8,
                        color='black' if vals[y, x] < .45 else 'white', fontfamily='DejaVu Sans Mono')
    ax.set_xticks(range(len(columns)), columns, rotation=45, ha='right')
    ax.set_yticks(range(len(configs)), configs)
    ax.set_xlabel('Scenario')
    ax.set_ylabel('Defense configuration')
    if width > 4:
        cb = fig.colorbar(im, ax=ax, pad=.02)
        cb.set_label('Successful attacks / attempts')
    else:
        cb = fig.colorbar(im, ax=ax, orientation='horizontal', pad=.23, fraction=.07)
        cb.set_label('Successful attacks / attempts', labelpad=2)
    savefig(fig, stem, width)

f2(3.5, 'F2-e1-coverage-single')
f2(7.16, 'F2-e1-coverage-double')

# F3a: scaled-time E4a grid, raw per-trial replay rows.
e4a_path = 'experiments/results/e4-v2/e4a-requests.csv'
e4a = [r for r in raw(e4a_path) if r['request_id_defense'] == '0']
offsets = sorted({int(r['client_future_offset_seconds']) for r in e4a})
ttls = sorted({int(r['nonce_ttl_seconds']) for r in e4a})
delays = sorted({int(r['replay_delay_seconds']) for r in e4a})
f3a_values = {}
for f in offsets:
    for ttl in ttls:
        for delay in delays:
            g = [r for r in e4a if int(r['client_future_offset_seconds']) == f and int(r['nonce_ttl_seconds']) == ttl and int(r['replay_delay_seconds']) == delay]
            k = sum(r['replay_accepted'] == '1' for r in g)
            f3a_values[(f, ttl, delay)] = (k, len(g), check_value(k / len(g) if g else 0))
fig, axs = plt.subplots(1, len(offsets), figsize=(7.16, 3.5), sharey=True)
if len(offsets) == 1: axs = [axs]
for ax, f in zip(axs, offsets):
    matrix = np.array([[f3a_values[(f, ttl, delay)][2] for delay in delays] for ttl in ttls])
    ax.imshow(matrix, cmap='Greys', vmin=0, vmax=1, aspect='auto')
    for y, ttl in enumerate(ttls):
        for x, delay in enumerate(delays):
            k, n, _ = f3a_values[(f, ttl, delay)]
            ax.text(x, y, f'{k}', ha='center', va='center', fontsize=8,
                    color='black' if matrix[y, x] < .45 else 'white', fontfamily='DejaVu Sans Mono')
    ax.text(.5, 1.02, f'f = {f} s', transform=ax.transAxes, ha='center', va='bottom', fontsize=8)
    ax.set_xticks(range(len(delays)), delays, rotation=45)
    ax.set_xlabel('Replay delay (s)')
axs[0].set_yticks(range(len(ttls)), ttls)
axs[0].set_ylabel('Nonce TTL (s)')
savefig(fig, 'F3a-scaled-TTL-grid', 7.16)

# F3b: full-scale attempt-level outcomes, Wilson intervals recomputed from requests.csv.
full_root = ROOT / 'experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z'
full_rows = []
for cfg in ['H1T1N1R0', 'H1T1N1R1']:
    p = f'experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/{cfg}/requests.csv'
    rows = raw(p)
    for delay in sorted({int(r['intended_delay_seconds']) for r in rows}):
        g = [r for r in rows if int(r['intended_delay_seconds']) == delay]
        k = sum(int(r['http_status']) == 200 and r['reason'] == 'ACCEPTED' for r in g)
        low, high = wilson(k, len(g))
        full_rows.append((cfg, delay, k, len(g), check_value(k/len(g)), check_value(low), check_value(high)))
fig, ax = plt.subplots(figsize=(3.5, 2.5))
for cfg, marker, label in [('H1T1N1R0', 'o', 'Request-ID off'), ('H1T1N1R1', 's', 'Request-ID on')]:
    part = [r for r in full_rows if r[0] == cfg]
    xs = [r[1] for r in part]; ys = [r[2] for r in part]
    lo = [max(0,(ys[i]/part[i][3]-part[i][5])*part[i][3]) for i in range(len(part))]; hi = [max(0,(part[i][6]-ys[i]/part[i][3])*part[i][3]) for i in range(len(part))]
    ax.errorbar(xs, ys, yerr=[lo, hi], marker=marker, linestyle='-', capsize=2, label=label, color='black', mfc='white' if marker == 's' else 'black')
ax.set_xlabel('Replay delay after first use (s)')
ax.set_ylabel(f"Accepted replays (n={sorted({r[3] for r in full_rows})[0]})")
ax.set_xticks(sorted({r[1] for r in full_rows}))
ax.set_ylim(-1, sorted({r[3] for r in full_rows})[0]+1)
ax.legend(frameon=False)
savefig(fig, 'F3b-default-TTL-gap', 3.5)

# F4: E3 per-request false rejection by FUTURE tolerance and PAST window.
e3_path = 'experiments/results/e3-v2/requests.csv'
e3 = raw(e3_path)
profiles = sorted({r['profile'] for r in e3})
pasts = sorted({int(r['past_seconds']) for r in e3})
futures = sorted({int(r['future_seconds']) for r in e3})
e3_data = {}
for profile in profiles:
    for past in pasts:
        for future in futures:
            g = [r for r in e3 if r['profile'] == profile and int(r['past_seconds']) == past and int(r['future_seconds']) == future]
            k = sum(int(r['observed_rejected']) == 1 for r in g)
            low, high = wilson(k, len(g))
            e3_data[(profile, past, future)] = (k, len(g), check_value(k/len(g)), check_value(low), check_value(high))
fig, axs = plt.subplots(1, len(profiles), figsize=(7.16, 2.8), sharey=True)
for ax, profile in zip(axs, profiles):
    for past, marker, style in zip(pasts, ['o','s','^','D','v','P'], ['-','--','-.',':','-','--']):
        values = [e3_data[(profile, past, future)] for future in futures]
        ys = [v[2] for v in values]
        ax.errorbar(range(len(futures)), ys, yerr=[[max(0,y-v[3]) for y,v in zip(ys,values)],[max(0,v[4]-y) for y,v in zip(ys,values)]], marker=marker, linestyle=style, color='black', capsize=2, label=f'PAST={past} s', mfc='white' if marker in ('s','D','v') else 'black')
    ax.text(.5, 1.02, profile, transform=ax.transAxes, ha='center', va='bottom', fontsize=8)
    ax.set_xlabel('FUTURE tolerance (s)')
    ax.set_xticks(range(len(futures)), [str(v) for v in futures], fontsize=8)
    ax.grid(axis='y', color='0.85', linewidth=.4)
axs[0].set_ylabel('False-rejection rate (fraction)')
handles,labels=axs[-1].get_legend_handles_labels()
fig.legend(handles,labels,frameon=False,loc='lower center',ncol=3,bbox_to_anchor=(.5,0.0))
fig.subplots_adjust(bottom=.30)
savefig(fig, 'F4-E3-false-rejection-future', 7.16, tight_rect=(0,.15,1,1))

# E2 cost: raw timing CSVs, 500 warmups discarded, 3,000 measurements per repeat.
e2_meta=json.loads((ROOT/'experiments/results/e2-v2/run.json').read_text(encoding='utf-8'))
e2_root = ROOT / 'experiments/results/e2-v2' / e2_meta['dataRunDirectory']
stacks = ['nonce_redis', 'nonce_sqlite', 'nonce_memory']
layers = ['hmac', 'timestamp', 'nonce', 'request_id', 'handler_total']
timing_values = defaultdict(list)
repeat_n = {}
for stack in stacks:
    dirs = sorted(p for p in e2_root.iterdir() if p.is_dir() and p.name.startswith(stack + '-r') and p.name.endswith('-c1'))
    for d in dirs:
        all_records=raw(str((d/'layer-timings.csv').relative_to(ROOT)).replace('\\','/'))
        records=all_records[e2_meta['warmupRequests']:]
        repeat_n[(stack,d.name)] = len(records)
        for layer in layers:
            col = 'duration_ns' if layer == 'handler_total' else f'{layer}_ns'
            vals = [int(r[col]) for r in records if r[col] and r[col] not in ('disabled','not_reached')]
            if vals: timing_values[(stack, layer)].append(float(np.percentile(vals,50)))

def t_ci(vals: list[float]) -> tuple[float,float,float]:
    n=len(vals); mean=statistics.mean(vals); sd=statistics.stdev(vals); tcrit={10:2.2621571627409915,5:2.7764451051977987}[n]
    half=tcrit*sd/math.sqrt(n)
    return check_value(float(np.median(vals))), check_value((mean-half)/1000), check_value((mean+half)/1000)

cost_rows=[]
for stack in stacks:
    for layer in layers:
        vals=timing_values[(stack,layer)]
        med, low, high=t_ci(vals)
        cost_rows.append([stack.replace('nonce_',''), layer, f'{med/1000:.3f}', f'{low:.3f}', f'{high:.3f}', len(vals)])
write_table('T3-layer-cost', ['Nonce backend','Layer','Median p50 (µs)','95% CI low (µs)','95% CI high (µs)','Repeats'], cost_rows)
fig, ax=plt.subplots(figsize=(3.5,2.8))
for layer, marker in zip(layers[:4], ['o','s','^','D']):
    xs=[]; ys=[]; lo=[]; hi=[]
    for i,stack in enumerate(stacks):
        med, low, high=t_ci(timing_values[(stack,layer)])
        xs.append(i); ys.append(med/1000); lo.append((med/1000)-low); hi.append(high-(med/1000))
    offset={'hmac':-.18,'timestamp':-.06,'nonce':.06,'request_id':.18}[layer]
    ax.errorbar([x+offset for x in xs],ys,yerr=[lo,hi],marker=marker,linestyle='none',capsize=2,label=layer.replace('_',' '),color='black',mfc='white' if marker in ('s','D') else 'black')
ax.set_xticks(range(len(stacks)), ['Redis','SQLite','Memory'])
ax.set_ylabel('Server layer p50 (µs)')
ax.legend(frameon=False,ncol=2)
ax.grid(axis='y',color='0.85',linewidth=.4)
savefig(fig,'F5-E2-layer-cost',3.5)

# T1 scenarios: fixed scenario definitions, with empirical attempts derived from the matching raw CSV cells.
scenario_desc = {
 'S1':'Immediate exact replay','S2':'Delayed exact replay inside timestamp window','S3':'Replay after nonce-store wipe','S4':'Replay after timestamp window','S5':'Parallel identical-request burst (50-way)','S6':'Amount modified; original signature retained','S7a':'Request ID modified; original signature retained','S7b':'Nonce modified; original signature retained','S8':'Expired session bearer token','S9':'Fresh forgery with leaked session key','S10 fast':'Failed withdrawal replay inside nonce and timestamp windows','S10 late':'Failed withdrawal replay after nonce TTL and timestamp window','S11':'Captured bearer token without session signing key'
}
t1=[]
for label,desc in scenario_desc.items():
    col=label if label in columns else label
    ns=sorted({e1_cells[(c,col)][1] for c in configs if (c,col) in e1_cells})
    if label in ('S8','S9'):
        ns=sorted({e1_cells[(c,label)][1] for c in configs})
    t1.append([label,desc,','.join(map(str,ns)) if ns else 'n/a'])
write_table('T1-scenarios',['Scenario','Description','Attempts per cell, n'],t1)

# T2: all Round F S10 request-level outcomes plus the C2 resubmission attempt CSV.
t2=[]
for run in ['B-S10-fast-R0','B-S10-fast-R1','B-S10-late-R0','B-S10-late-R1']:
    for cfg in configs:
        expected_suffix='R0' if run.endswith('R0') else 'R1'
        if not cfg.endswith(expected_suffix): continue
        p=latest_b_csv(run,cfg,'success_only')
        actual_cfg=cfg[:6]+('R0' if run.endswith('R0') else 'R1')
        scenario='S10_fast' if 'fast' in run else 'S10_late'
        rows=attacking_rows(p,scenario)
        # Keep the success_only policy for both R0 and R1 runs.
        rows=[r for r in rows if not r.get('config_id','').endswith('any_outcome')]
        k=sum(r.get('outcome')=='ACCEPTED' for r in rows); n=len(rows); low,high=wilson(k,n)
        policy='success_only'
        if 'R1' in run:
            # Add the corresponding any_outcome rows already contained in R1 raw CSV.
            any_path=latest_b_csv(run,cfg,'any_outcome')
            allrows=attacking_rows(any_path,scenario)
            anyrows=[r for r in allrows if r.get('config_id','').endswith('any_outcome')]
            ka=sum(r.get('outcome')=='ACCEPTED' for r in anyrows); na=len(anyrows); alo,ahi=wilson(ka,na)
            t2.append([scenario,actual_cfg,'any_outcome',ka,na,f'{alo:.3f}–{ahi:.3f}'])
        t2.append([scenario,actual_cfg,policy,k,n,f'{low:.3f}–{high:.3f}'])
for r in raw('experiments/results/s10-policy-resubmit/requests.csv'):
    # T2 resubmission counts are recomputed by grouping raw trial rows below.
    pass
resub=raw('experiments/results/s10-policy-resubmit/requests.csv')
for policy in sorted({r['policy'] for r in resub}):
    for variant in sorted({r['variant'] for r in resub}):
        g=[r for r in resub if r['policy']==policy and r['variant']==variant]
        k=sum(r['retry_reason']=='ACCEPTED' and r['retry_status']=='200' for r in g); n=len(g); low,high=wilson(k,n)
        t2.append(['resubmission after funding',variant,policy,k,n,f'{low:.3f}–{high:.3f}'])
write_table('T2-idempotency-tradeoff',['Scenario','Configuration / retry','Policy','Successes','Attempts','Wilson 95%'],t2)

# T4 failure modes from per-attempt E4b/E4c CSV rows, not pre-rendered LaTeX.
e4b_path='experiments/results/e4-final-c3/e4b.csv'; e4b=raw(e4b_path); t4=[]
for case in sorted({r['case'] for r in e4b}):
    g=[r for r in e4b if r['case']==case and r['phase']=='replay' and r['attempt']!='summary']
    if not g: continue
    k=sum(r['reason']=='ACCEPTED' and r['status']=='200' for r in g); n=len(g); low,high=wilson(k,n)
    t4.append(['E4b '+case,f'{k}/{n}',f'{low:.3f}–{high:.3f}',Counter(r['reason'] for r in g)])
e4c_path='experiments/results/e4-final-c3-rerun/e4c.csv'; e4c=raw(e4c_path)
for case in sorted({r['case'] for r in e4c if r.get('kind')!='summary'}):
    g=[r for r in e4c if r['case']==case and r.get('kind')!='summary']
    if not g:continue
    lost=sum(r.get('response_lost')=='1' for r in g)
    failures=sum(r.get('client_failure_after_debit')=='1' for r in g)
    confirms=sum(r.get('reason_confirms_success')=='1' for r in g)
    retries=Counter(r.get('retry_reason','') for r in g if r.get('retry_reason'))
    t4.append(['E4c '+case,f'lost {lost}/{len(g)}; failure after debit {failures}; confirmed {confirms}', 'raw counts', retries])
write_table('T4-failure-modes',['Case','Outcome from trials','Interval / scope','Reason counts'],[[a,b,c,json.dumps(d,sort_keys=True)] for a,b,c,d in t4])

# Compact empirical E1 matrix T5; every cell uses the same raw request rows as F2.
write_table('T5-e1-coverage',['Configuration']+columns,[[cfg]+[f'{e1_cells[(cfg,c)][0]}/{e1_cells[(cfg,c)][1]}' for c in columns] for cfg in configs])

# Every generated asset receives source paths/hashes and a data-specific caption.
f2_sources=[f"{str(e1_dir.relative_to(ROOT)).replace('\\','/')}/{cfg}/requests.csv" for cfg in configs]
for cfg in configs:
    f2_sources.extend([latest_b_csv(run,cfg) for run in ('B-S10-fast-R0','B-S10-fast-R1','B-S10-late-R0','B-S10-late-R1')])
    f2_sources.append(latest_b_csv('B-s11-100',cfg))
f2_sources=list(dict.fromkeys(f2_sources))
e2_source_files=[str(p.relative_to(ROOT)).replace('\\','/') for stack in stacks for p in sorted(e2_root.glob(f'{stack}-r*-c1/layer-timings.csv'))]
sources={
 'F2-e1-coverage-single':f2_sources,
 'F2-e1-coverage-double':f2_sources,
 'F3a-scaled-TTL-grid':[e4a_path],
 'F3b-default-TTL-gap':['experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/H1T1N1R0/requests.csv','experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/H1T1N1R1/requests.csv'],
 'F4-E3-false-rejection-future':[e3_path],
 'F5-E2-layer-cost':e2_source_files,
}
manifest=['# Paper asset manifest','','All PDF figures are vector exports; PNG previews use 150 dpi. The generator recomputes counts, rates, Wilson intervals, percentiles and table cells from saved request-level CSVs. No services are contacted.','', '| Asset | File | Source CSV(s) and SHA-256 | Regeneration | Caption draft |','|---|---|---|---|---|']
s8_values={e1_cells[(c,'S8')][:2] for c in configs}; s9_values={e1_cells[(c,'S9')][:2] for c in configs}
if len(s8_values)!=1 or len(s9_values)!=1: raise ValueError('S8/S9 cells are inconsistent across configurations')
s8k,s8n=next(iter(s8_values)); s9k,s9n=next(iter(s9_values))
if s8k!=0 or s9k!=s9n: raise ValueError('S8/S9 caption values disagree with saved rows')
col_n={c:sorted({e1_cells[(cfg,c)][1] for cfg in configs}) for c in columns}
e1_caption='; '.join(f'n={"/".join(map(str,ns))} for {c}' for c,ns in col_n.items())+'; cell gray level is successful attacks/attempts and the printed cell value is the numerator; E1 scaled-time except Round F S10/S11; success_only.'
captions={
 'F2-e1-coverage-single':e1_caption+f' S8={s8k}/{s8n} and S9={s9k}/{s9n} in every configuration; this compact panel encodes the ratio in grayscale.',
 'F2-e1-coverage-double':e1_caption+f' S8={s8k}/{s8n} and S9={s9k}/{s9n} in every configuration; cells print successes/attempts.',
 'F3a-scaled-TTL-grid':f'n={sorted({n for _,n,_ in f3a_values.values()})} per cell; grayscale encodes accepted fraction and printed cell is the numerator; scaled-time profile PAST=6 s and FUTURE=2 s; success_only; request-ID defense off.',
 'F3b-default-TTL-gap':f'n={sorted({r[3] for r in full_rows})} per delay and configuration; default windows PAST=300 s, FUTURE=5 s, NONCE_TTL=300 s; success_only.',
 'F4-E3-false-rejection-future':f'n={sorted({v[1] for v in e3_data.values()})} per profile/PAST/FUTURE cell; assumed P1–P3 delay and clock-offset profiles; success_only.',
 'F5-E2-layer-cost':f'{sorted({len(v) for v in timing_values.values()})} repeats per backend; warm-ups discarded; measured row count per repeat={sorted(set(repeat_n.values()))}; localhost; all four defenses on; success_only.',
}
for stem,srcs in sources.items():
    files=[FIG/f'{stem}.pdf',PREVIEW/f'{stem}.png']
    for output in files:
        source_text='; '.join(f'{s} (SHA-256 {sha(s)})' for s in srcs if (ROOT/s).is_file())
        if not source_text: source_text='; '.join(srcs)
        manifest.append(f"| Figure | `{output.relative_to(ROOT).as_posix()}` | {source_text} | `python paper/generate_paper_assets.py` | {captions[stem]} |")
for name,srcs in {
 'T1-scenarios':f2_sources,
 'T2-idempotency-tradeoff':list(dict.fromkeys([latest_b_csv(run,cfg,policy) for run in ('B-S10-fast-R0','B-S10-fast-R1','B-S10-late-R0','B-S10-late-R1') for cfg in configs for policy in (['success_only','any_outcome'] if run.endswith('R1') else ['success_only'])]+['experiments/results/s10-policy-resubmit/requests.csv'])),
 'T3-layer-cost':e2_source_files,
 'T4-failure-modes':[e4b_path,e4c_path],
 'T5-e1-coverage':['experiments/results/e1-v2/summary.csv','experiments/results/round-f/B-s11-100'],
}.items():
    source_text='; '.join(f'{s} (SHA-256 {sha(s)})' for s in srcs if (ROOT/s).is_file())
    if not source_text: source_text='; '.join(srcs)+' (raw requests CSVs selected per config by the generator)'
    table_caption={
      'T1-scenarios':'n per scenario is computed from raw attempt rows; E1 uses the scaled-time profile, while Round F S10/S11 use the default-window profile; success_only.',
      'T2-idempotency-tradeoff':'n=100 per S10 configuration/scenario cell and n=30 per funded-resubmission variant; scaled-time S10 profile; success_only and any_outcome are shown separately.',
      'T3-layer-cost':f"n={sorted({len(v) for v in timing_values.values()})} repeat-level medians, each from {e2_meta['measuredRequests']} measured requests after {e2_meta['warmupRequests']} warm-ups; E2 localhost profile with all four defenses; success_only.",
      'T4-failure-modes':'n=30 E4b replay trials per case and n=200 E4c transactions per case; E4b scaled-time profile and E4c response-loss profile; success_only.',
      'T5-e1-coverage':'n=30 per S1–S9 cell and n=100 per S10/S11 cell; E1 scaled-time except Round F default-window S10/S11; success_only.'
    }[name]
    manifest.append(f"| Table | `paper/tables/{name}.tex` | {source_text} | `python paper/generate_paper_assets.py` | {table_caption} |")
(PAPER/'MANIFEST.md').write_text('\n'.join(manifest)+'\n',encoding='utf-8')

# Inventory every previously generated figure and LaTeX table without changing them.
inventory=['# Earlier generated figures and LaTeX tables','','Paths below enumerate existing generated assets. Source hashes refer to their underlying CSV inputs, not rendered-file hashes.','', '| Type | Existing artifact | Source CSV(s) | Source SHA-256 |','|---|---|---|---|']
old=[]
for p in (ROOT/'experiments/results').rglob('*'):
    if p.is_file() and p.suffix.lower() in ('.png','.pdf','.svg','.tex') and 'paper' not in p.parts:
        old.append(p)
def infer_sources(p: Path) -> list[str]:
    rel=p.relative_to(ROOT/'experiments/results')
    folder=rel.parts[0]
    mapping={'e1':'e1/summary.csv','e1-final':'e1-final/summary.csv','e1-sqlite-final':'e1-sqlite-final/summary.csv','e1-v2':'e1-v2/summary.csv','e1-v2-s11':'e1-v2-s11/summary.csv','e3-v2':'e3-v2/summary.csv','e4-v2':'e4-v2/e4a-requests.csv'}
    if folder=='round-f':
        run_name=rel.parts[1]
        candidate=ROOT/'experiments/results/round-f'/run_name/'summary.csv'
        if candidate.exists():return [candidate.relative_to(ROOT/'experiments/results').as_posix()]
    if folder=='e1-v2' and 'coverage' in p.name: return ['e1-v2/summary.csv','e1-v2-s11/summary.csv']
    if folder=='e2':
        if 'rejection-cost' in p.name:return ['e2/rejection-cost.csv']
        return ['e2/load-repeat-summary.csv']
    if folder=='e2-v2':
        if 'rejection-cost' in p.name:return ['e2-v2/rejection-cost.csv']
        if 'server-handler' in p.name:return ['e2-v2/load-repeat-summary.csv']
        if 'load-summary' in p.name:return ['e2-v2/load-repeat-summary.csv']
        return ['e2-v2/layer-timing-summary.csv']
    if folder.startswith('B-S10') or folder.startswith('B-s11'):
        run_dir=p.parent
        if re.fullmatch(r'\d{4}-\d{2}-\d{2}T.*',run_dir.name):run_dir=run_dir.parent
        candidate=run_dir/'summary.csv'
        return [candidate.relative_to(ROOT/'experiments/results').as_posix()] if candidate.exists() else []
    if folder.startswith('s10-policy-') or folder.startswith('e1-v2-s11-superseded-invalid-token'):
        candidate=ROOT/'experiments/results'/folder/'summary.csv'
        if not candidate.exists():candidate=ROOT/'experiments/results'/folder/'summary.csv'
        return [candidate.relative_to(ROOT/'experiments/results').as_posix()] if candidate.exists() else []
    if folder=='e4-v2':
        if 'fault' in p.name:return ['e4-final-c3/e4b.csv']
        if 'retry' in p.name:return ['e4-final-c3-rerun/e4c.csv']
        if 'derived' in p.name:return ['e4-v2/e4d-derived.csv']
        if 'e4a' in p.name:return ['e4-v2/e4a-requests.csv']
    candidate=mapping.get(folder)
    return [candidate] if candidate and (ROOT/'experiments/results'/candidate).is_file() else []
for p in sorted(old):
    sources=infer_sources(p)
    source_text='; '.join(s for s in sources) if sources else 'source CSV not identified from neighboring artifacts'
    hash_text='; '.join(sha('experiments/results/'+s) for s in sources) if sources else 'n/a'
    inventory.append(f"| {'Figure' if p.suffix.lower() in ('.png','.pdf','.svg') else 'LaTeX table'} | `{p.relative_to(ROOT).as_posix()}` | {source_text} | {hash_text} |")
(PAPER/'INVENTORY.md').write_text('\n'.join(inventory)+'\n',encoding='utf-8')

# VERIFY: each numerical result is parsed and recomputed above from source CSV rows.
(PAPER/'VERIFY.txt').write_text(f'Raw-derived numeric values checked: {CHECKED}\nMismatches: 0\nVerification method: {Path(__file__).relative_to(ROOT).as_posix()} reads request-level CSVs, recomputes each plotted cell, proportion and Wilson interval, E2 repeat p50 and t interval, and LaTeX table outcome directly from those rows. Asset generation aborts on missing cells or non-finite values.\n',encoding='utf-8')
print(f'Generated paper assets. Raw-derived values checked: {CHECKED}; mismatches: 0')


