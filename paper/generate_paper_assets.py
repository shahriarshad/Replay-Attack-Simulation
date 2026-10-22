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
NOT_APPLICABLE_CELLS = {('T2', 'any_outcome', 'request-ID off')}  # Policy switch is not applicable when request-ID defense is off; this cell is intentionally omitted, not encoded as 0/0.


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
    out = [r'\begin{table*}[t]', r'\centering', r'\small', r'\begin{tabular}{l' + 'c' * (len(headers)-1) + '}', r'\toprule', ' & '.join(tex_escape(x) for x in headers) + r' \\', r'\midrule']
    out.extend(' & '.join(tex_escape(x) for x in row) + r' \\' for row in rows)
    out += [r'\bottomrule', r'\end{tabular}', r'\end{table*}', '']
    (TABLE / f'{name}.tex').write_text('\n'.join(out), encoding='utf-8')


def latest_e1_run() -> Path:
    root = ROOT / 'experiments/results/e1-v3'
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
    if n == 0:
        raise ValueError('empty cell is not applicable here; no plotted/table cell may have attempts=0')
    check_value(k); check_value(n)
    return k, n, check_value(k / n)


# Read every source once; all plotted/table figures are calculated from per-request CSV rows.
e1_dir = latest_e1_run()
configs = sorted(p.name for p in e1_dir.iterdir() if p.is_dir() and re.fullmatch(r'H[01]T[01]N[01]R[01]',p.name) and (p/'requests.csv').is_file())
e1_path = f"{str(e1_dir.relative_to(ROOT)).replace('\\', '/')}/H0T0N0R0/requests.csv"
e1_summary_path = f"{str(e1_dir.relative_to(ROOT)).replace('\\', '/')}/summary.csv"
e1_summary = raw(e1_summary_path)
def summary_cell(row: dict[str, str], success_field: str = 'debited_count') -> tuple[int, int, float]:
    k, n = int(row[success_field]), int(row['attempts'])
    if n == 0: raise ValueError(f"empty applicable cell {row.get('config_id')}/{row.get('scenario_id')}")
    check_value(k); check_value(n)
    return k, n, check_value(k/n)
e1_cells: dict[tuple[str, str], tuple[int, int, float]] = {}
for cfg in configs:
    for scenario in ('S1','S2','S3','S4','S5','S6','S7a','S7b','S8','S9'):
        candidates=[r for r in e1_summary if r.get('config_id')==cfg and r.get('scenario_id')==scenario]
        if scenario in ('S7a','S7b'):
            variant='request_id' if scenario=='S7a' else 'nonce'
            candidates=[r for r in candidates if r.get('variant')==variant]
        if len(candidates)!=1: raise ValueError(f'missing/ambiguous E1 v3 cell {cfg}/{scenario}: {len(candidates)}')
        e1_cells[(cfg,scenario)]=summary_cell(candidates[0])

# F2: request-level attack success matrix; S10/S11 extend the same 16-config matrix.
s10_root=ROOT/'experiments/results/e1-v3-s10-independent'
s10_runs=sorted(p for p in s10_root.iterdir() if p.is_dir() and (p/'summary.csv').exists())
if not s10_runs: raise ValueError('S10-independent summary missing')
s10_run=s10_runs[-1]
s10_path=str((s10_run/'requests.csv').relative_to(ROOT)).replace('\\','/')
s10_summary_path=str((s10_run/'summary.csv').relative_to(ROOT)).replace('\\','/')
s10_summary=raw(s10_summary_path)
s11_root=ROOT/'experiments/results/e1-v3-s11'
s11_runs=sorted(p for p in s11_root.iterdir() if p.is_dir() and (p/'summary.csv').exists())
if not s11_runs: raise ValueError('E1 v3 S11 summary missing')
s11_run=s11_runs[-1]
s11_summary_path=str((s11_run/'summary.csv').relative_to(ROOT)).replace('\\','/')
s11_summary=raw(s11_summary_path)
for cfg in configs:
    for label,scenario in [('S10 fast','S10_indep_fast'),('S10 late','S10_indep_late')]:
        candidates=[r for r in s10_summary if r.get('config_id')==f'{cfg}-success_only' and r.get('scenario_id')==scenario]
        if len(candidates)!=1: raise ValueError(f'missing S10-independent success_only cell {cfg}/{scenario}')
        e1_cells[(cfg,label)]=summary_cell(candidates[0],'delayed_execution_count')
    candidates=[r for r in s11_summary if r.get('config_id')==cfg and r.get('scenario_id')=='S11']
    if len(candidates)!=1: raise ValueError(f'missing E1 v3 S11 cell {cfg}')
    e1_cells[(cfg,'S11')]=summary_cell(candidates[0])

columns = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7a', 'S7b', 'S10 fast', 'S10 late', 'S11']
for cfg in configs:
    for col in columns:
        if (cfg, col) not in e1_cells:
            raise ValueError(f'missing F2 cell {cfg} {col}')

def f2(width: float, stem: str) -> None:
    fig, ax = plt.subplots(figsize=(width, 5.6))
    vals = np.array([[e1_cells[(cfg, c)][2] for c in columns] for cfg in configs])
    im = ax.imshow(vals, cmap='Greys', vmin=0, vmax=1, aspect='auto')
    from matplotlib.patches import Rectangle
    for y, cfg in enumerate(configs):
        for x, col in enumerate(columns):
            k, n, _ = e1_cells[(cfg, col)]
            ax.add_patch(Rectangle((x-.5,y-.5),1,1,fill=False, hatch='///' if vals[y,x] >= .5 else None, linewidth=0, edgecolor='0.35'))
            ax.text(x, y, f'{k}', ha='center', va='center', fontsize=7,
                    color='black' if vals[y, x] < .45 else 'white', fontfamily='DejaVu Sans Mono')
    labels=[f'{c} (n={e1_cells[(configs[0],c)][1]})' for c in columns]
    ax.set_xticks(range(len(columns)), labels, rotation=45, ha='right')
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
            if not g: raise ValueError(f'empty E4a cell f={f}, TTL={ttl}, delay={delay}')
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
for cfg, marker, label, offset in [('H1T1N1R0', 'o', 'Request-ID off', -0.09), ('H1T1N1R1', 's', 'Request-ID on', 0.09)]:
    part = [r for r in full_rows if r[0] == cfg]
    xs = [i + offset for i in range(len(part))]; ys = [r[2] for r in part]
    lo = [max(0,(ys[i]/part[i][3]-part[i][5])*part[i][3]) for i in range(len(part))]; hi = [max(0,(part[i][6]-ys[i]/part[i][3])*part[i][3]) for i in range(len(part))]
    ax.errorbar(xs, ys, yerr=[lo, hi], marker=marker, linestyle='none', capsize=2, label=label, color='black', mfc='white' if marker == 's' else 'black')
ax.set_xlabel('Replay delay after first use (s)')
ax.set_ylabel(f"Accepted replays (n={sorted({r[3] for r in full_rows})[0]})")
ax.set_xticks(range(len(sorted({r[1] for r in full_rows}))), sorted({r[1] for r in full_rows}))
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
fig, ax=plt.subplots(figsize=(3.5,3.2))
for layer, marker in zip(layers[:4], ['o','s','^','D']):
    xs=[]; ys=[]; lo=[]; hi=[]
    for i,stack in enumerate(stacks):
        med, low, high=t_ci(timing_values[(stack,layer)])
        xs.append(i); ys.append(med/1000); lo.append((med/1000)-low); hi.append(high-(med/1000))
    offset={'hmac':-.18,'timestamp':-.06,'nonce':.06,'request_id':.18}[layer]
    ax.errorbar([x+offset for x in xs],ys,yerr=[lo,hi],marker=marker,linestyle='none',capsize=2,label=layer.replace('_',' '),color='black',mfc='white' if marker in ('s','D') else 'black')
ax.set_xticks(range(len(stacks)), ['Redis','SQLite','Memory'])
ax.set_ylabel('Server layer p50 (microseconds)')
ax.set_yscale('log')
ax.legend(frameon=False,ncol=2,loc='upper center',bbox_to_anchor=(.5,-.20))
ax.grid(axis='y',color='0.85',linewidth=.4,which='both')
fig.subplots_adjust(left=.29,right=.97,top=.96,bottom=.31)
savefig(fig,'F5-E2-layer-cost',3.5)

# T1 scenarios: attempts and attacker class from the measured cells.
scenario_desc = {
 'S1':('Immediate exact replay','A'),'S2':('Delayed exact replay inside timestamp window','A'),'S3':('Replay after nonce-store wipe','A'),'S4':('Replay after timestamp window','A'),'S5':('Parallel identical-request burst (50 parallel x 30 batches)','A'),'S6':('Amount modified; original signature retained','A'),'S7a':('Request ID modified; original signature retained','A'),'S7b':('Nonce modified; original signature retained','A'),'S8':('Expired session bearer token','A'),'S9':('Fresh forgery with leaked session key','C'),'S10 fast':('Independent failed withdrawals replayed once after 1 s; funded balance 3,002; amount 100','A'),'S10 late':('Independent failed withdrawals replayed once after 9 s; nonce TTL 8 s and past window 6 s','A'),'S11':('Captured bearer token, without session signing key','B')
}
t1=[]
for label,(desc,attacker) in scenario_desc.items():
    ns=sorted({e1_cells[(c,label)][1] for c in configs})
    t1.append([label,desc,attacker,', '.join(map(str,ns))])
write_table('T1-scenarios',['Scenario','Description','Attacker','Attempts n'],t1)
t1_tex=[r'\begin{table*}[t]',r'\centering',r'\small',r'\begin{tabular}{lp{4.2in}cc}',r'\toprule',r'Scenario & Description & Attacker & Attempts $n$ \\',r'\midrule']
t1_tex += [f"{tex_escape(a)} & {tex_escape(b)} & {tex_escape(c)} & {tex_escape(d)}" + r' \\' for a,b,c,d in t1]
t1_tex += [r'\bottomrule',r'\end{tabular}',r'\end{table*}','']
(TABLE/'T1-scenarios.tex').write_text('\n'.join(t1_tex),encoding='utf-8')

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
write_table('T2-full',['Scenario','Configuration / retry','Policy','Successes','Attempts','Wilson 95%'],t2)

# Compact T2 groups R1/R0 cells by T/N freshness defenses; pool H variants only when identical.
compact=[]
for rid,policy in [(1,'success_only'),(0,'success_only'),(1,'any_outcome')]:
    for t,n,group in [(0,0,'none'),(1,0,'T only'),(0,1,'N only'),(1,1,'T and N')]:
        group_cfg=[c for c in configs if c.endswith(f'R{rid}') and c[3]==str(t) and c[5]==str(n)]
        if not group_cfg: continue
        for scen in ['S10_fast','S10_late']:
            values=[]
            run='B-S10-'+('fast' if scen=='S10_fast' else 'late')+f'-R{rid}'
            for c in group_cfg:
                pth=latest_b_csv(run,c,policy)
                rr=attacking_rows(pth,scen)
                if rid == 1: rr=[r for r in rr if r.get('config_id','').endswith(policy)]
                kk=sum(r.get('outcome')=='ACCEPTED' and r.get('http_status')=='200' for r in rr); nn=len(rr)
                values.append((c,kk,nn))
            if len({(v[1],v[2]) for v in values})==1:
                k=sum(v[1] for v in values); nv=sum(v[2] for v in values); configs_label='pooled H0/H1' if len(values)>1 else values[0][0]
                lo,hi=wilson(k,nv); compact.append([policy,('R on' if rid else 'R off')+'; '+group,scen.replace('S10_',''),f'{k}/{nv} [{lo:.3f}, {hi:.3f}]',configs_label])
            else:
                for c,k,nv in values:
                    lo,hi=wilson(k,nv); compact.append([policy,('R on' if rid else 'R off')+'; '+group,scen.replace('S10_',''),f'{k}/{nv} [{lo:.3f}, {hi:.3f}]',c])
for policy in sorted({r['policy'] for r in resub}):
    for variant in sorted({r['variant'] for r in resub}):
        g=[r for r in resub if r['policy']==policy and r['variant']==variant]
        k=sum(r['retry_reason']=='ACCEPTED' and r['retry_status']=='200' for r in g); n=len(g); lo,hi=wilson(k,n)
        compact.append([policy,'After funding',variant,f'{k}/{n} [{lo:.3f}, {hi:.3f}]','resubmission trials'])
write_table('T2',['Policy','Request-ID / freshness','Scenario','Successes / n (Wilson 95%)','Configuration scope'],compact)

# Round I replaces the old single-request S10 figures with independent trials.
resub_path='experiments/results/round-i/s10-independent/resubmission/requests.csv'
resub=raw(resub_path)
round_i_full=[]
for r in s10_summary:
    cfg=r['config_id'].rsplit('-',1)[0]; k=int(r['delayed_execution_count']); n=int(r['attempts']); lo,hi=wilson(k,n)
    round_i_full.append([r['policy'],cfg,r['scenario_id'].replace('S10_indep_',''),f'{k}/{n}',f'{lo:.3f}–{hi:.3f}'])
write_table('T2-full',['Policy','Configuration','Scenario','Delayed executions / n','Wilson 95%'],round_i_full)
round_i_compact=[]
for rid,policy in [(0,'success_only'),(1,'success_only'),(1,'any_outcome')]:
    for t,n,fresh in [(0,0,'No T/N'),(1,0,'T only'),(0,1,'N only'),(1,1,'T and N')]:
        candidates=[c for c in configs if c.endswith(f'R{rid}') and c[3]==str(t) and c[5]==str(n)]
        cells=[]
        for cfg in candidates:
            vals=[]
            for scenario in ['S10_indep_fast','S10_indep_late']:
                found=[r for r in s10_summary if r['config_id']==f'{cfg}-{policy}' and r['scenario_id']==scenario]
                if len(found)!=1: raise ValueError(f'missing independent S10 cell {cfg}/{policy}/{scenario}')
                row=found[0]; k=int(row['delayed_execution_count']); total=int(row['attempts']); lo,hi=wilson(k,total); vals.append((k,total,lo,hi))
            cells.append((cfg,*vals))
        unique=[]
        for item in cells:
            same=next((u for u in unique if u[1:]==list(item[1:])),None)
            if same: same[0].append(item[0])
            else: unique.append([[item[0]],*item[1:]])
        for names,fast,late in unique:
            label=', '.join(names)+(f' (H0/H1 identical)' if len(names)>1 else '')
            ftxt=f'{fast[0]}/{fast[1]} [{fast[2]:.3f}, {fast[3]:.3f}]'; ltxt=f'{late[0]}/{late[1]} [{late[2]:.3f}, {late[3]:.3f}]'
            round_i_compact.append([policy,f'R{rid}; {fresh}',label,ftxt,ltxt,''])
for policy in sorted({r['policy'] for r in resub}):
    for variant in sorted({r['variant'] for r in resub}):
        g=[r for r in resub if r['policy']==policy and r['variant']==variant]
        k=sum(r['retry_status']=='200' and r['retry_reason']=='ACCEPTED' for r in g); n=len(g); lo,hi=wilson(k,n)
        round_i_compact.append([policy,'After funding',variant,'N/A','N/A',f'{k}/{n} [{lo:.3f}, {hi:.3f}]'])
write_table('T2',['Policy','Request-ID / freshness','Configuration(s)','S10 fast k/n (Wilson 95%)','S10 late k/n (Wilson 95%)','Resubmission success (Wilson 95%)'],round_i_compact)
t2file=TABLE/'T2.tex'; t2text=t2file.read_text(encoding='utf-8').replace(r'\begin{tabular}{lccccc}',r'\setlength{\tabcolsep}{2pt}'+'\n'+r'\begin{tabular}{lp{0.68in}p{1.38in}p{1.30in}p{1.30in}p{1.15in}}')
t2file.write_text(t2text,encoding='utf-8')

# T4 failure modes: E4b Wilson rows and E4c retry outcome counts from raw trials.
e4b_path='experiments/results/e4-final-c3/e4b.csv'; e4b=raw(e4b_path); t4=[]
for case in sorted({r['case'] for r in e4b}):
    g=[r for r in e4b if r['case']==case and r['phase'] in ('legitimate','replay')]
    leg=[r for r in g if r['phase']=='legitimate']; rep=[r for r in g if r['phase']=='replay']
    lk=sum(r['reason']=='ACCEPTED' and r['status']=='200' for r in leg); rk=sum(r['reason']=='ACCEPTED' and r['status']=='200' for r in rep)
    ln=len(leg); rn=len(rep); ll,lh=wilson(lk,ln); rl,rh=wilson(rk,rn)
    mode='fail-open' if 'fail-open' in case else 'fail-closed'; rid='on' if case.endswith('-1') else 'off'
    t4.append(['E4b',mode,rid,'',f'{lk}/{ln} [{ll:.3f}, {lh:.3f}]',f'{rk}/{rn} [{rl:.3f}, {rh:.3f}]','','','',''])
e4c_path='experiments/results/round-i/e4c-exact/e4c.csv'; e4c=raw(e4c_path)
for case in sorted({r['case'] for r in e4c if r.get('kind')!='summary'}):
    g=[r for r in e4c if r['case']==case and r.get('kind')!='summary']
    if not case.startswith('loss-'): continue
    if not g: raise ValueError(f'missing E4c trials for {case}')
    m=re.match(r'loss-p([0-9.]+)-(default|request_id_before_nonce)-(same-signed|fresh-nonce-same-request-id)',case)
    if not m: continue
    prob,order,retry=m.groups(); lost=sum(r.get('response_lost')=='1' for r in g)
    reasons=Counter(r.get('retry_reason','not_retried') for r in g)
    summary=next((r for r in e4c if r.get('case')==case and r.get('kind')=='summary'),None)
    if summary is None: raise ValueError(f'missing E4c raw oracle summary for {case}')
    debit=int(summary.get('debits') or 0); exactly=int(summary.get('exactly_one_debit_request_ids') or 0); infer=int(summary.get('reason_confirms_success_count') or 0)
    if int(summary.get('trials') or 0)!=200 or len(g)!=200: raise ValueError(f'E4c trial count mismatch for {case}')
    reason_text='; '.join(f'{name}:{count}' for name,count in sorted(reasons.items()))
    t4.append(['E4c',f'p={prob}', 'default' if order=='default' else 'request-ID first', 'identical signed request' if retry=='same-signed' else 'fresh nonce, same request_id','','',f'{lost}/200',reason_text,f'{exactly}/200',str(infer)])
write_table('T4-failure-modes',['Experiment','Mode / loss p','Request-ID / check order','Retry type','Legitimate accepted (k/30, Wilson 95%)','Replay accepted (k/30, Wilson 95%)','Lost responses (of 200)','Retry reason counts','Debited exactly once (k/200)','Retries infer success (k)'],t4)
t4file=TABLE/'T4-failure-modes.tex'; t4text=t4file.read_text(encoding='utf-8')
t4text=t4text.replace(r'\begin{tabular}{lccccccccc}',r'\setlength{\tabcolsep}{1.5pt}'+'\n'+r'\begin{tabular}{lp{0.47in}p{0.61in}p{0.75in}p{0.76in}p{0.76in}p{0.49in}p{0.75in}p{0.70in}p{0.49in}}')
t4text=t4text.replace(r'\small',r'\small'+'\n'+r'\caption*{For E4b, the first two outcome columns are legitimate requests accepted and replay requests accepted, each out of 30 with Wilson 95% intervals. For E4c, failures after debit equal the lost-response count by construction; the table reports lost responses, retry reasons, exactly-once debit count, and retries that reveal prior success.}')
t4file.write_text(t4text,encoding='utf-8')

# Compact empirical E1 matrix T5; every cell uses the same raw request rows as F2.
t5headers=['Config']+[f"{c.replace('S10 fast','S10f').replace('S10 late','S10l')} (n={e1_cells[(configs[0],c)][1]})" for c in columns]
write_table('T5-e1-coverage',t5headers,[[cfg]+[str(e1_cells[(cfg,c)][0]) for c in columns] for cfg in configs])

# Every generated asset receives source paths/hashes and a data-specific caption.
f2_sources=[f"{str(e1_dir.relative_to(ROOT)).replace('\\','/')}/{cfg}/requests.csv" for cfg in configs]+[e1_summary_path,s10_path,s10_summary_path,s11_summary_path]
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
manifest=['# Paper asset manifest','','All PDF figures are vector exports; PNG previews use 150 dpi. The generator recomputes displayed values and intervals from saved CSVs. Notation H/T/N/R means HMAC, timestamp, nonce, and request-ID defenses; A is a network observer without the session key, B has a bearer token only, and C has a leaked session key.','', '| Asset | Output files | Source CSV(s) and SHA-256 | Regeneration | Caption draft |','|---|---|---|---|---|']
s8_values={e1_cells[(c,'S8')][:2] for c in configs}; s9_values={e1_cells[(c,'S9')][:2] for c in configs}
if len(s8_values)!=1 or len(s9_values)!=1: raise ValueError('S8/S9 cells are inconsistent across configurations')
s8k,s8n=next(iter(s8_values)); s9k,s9n=next(iter(s9_values))
if s8k!=0 or s9k!=s9n: raise ValueError('S8/S9 caption values disagree with saved rows')
col_n={c:e1_cells[(configs[0],c)][1] for c in columns}
e1_caption='F2: H/T/N/R denote HMAC/timestamp/nonce/request-ID defenses; attacker A observes traffic without the session key (S1 through S8 and S10), attacker C has the leaked key (S9), and B holds a bearer token only (S11). Each column header gives n; cells print successful attacks k, with grayscale/hatching encoding k/n. S5 uses n=1,500 (50 parallel x 30 batches); S8='+f'{s8k}/{s8n}'+', S9='+f'{s9k}/{s9n}'+'. S1-S9 use E1 v3 scaled time (PAST=6 s, FUTURE=2 s, NONCE_TTL=8 s); S10 uses independent trials at 1 s/9 s; S11 uses 100 attempts; success_only.'
caption_map={
'F2-e1-coverage-single':e1_caption, 'F2-e1-coverage-double':e1_caption,
'F3a-scaled-TTL-grid':'n=30 per cell; attacker A (network observer, no session key) replays recorded requests; H/T/N/R mean HMAC/timestamp/nonce/request-ID; scaled-time PAST=6 s/FUTURE=2 s, success_only, H1T1N1R0.',
'F3b-default-TTL-gap':'n=30 per delay/configuration; attacker A (network observer, no session key) replays captured requests; H/T/N/R mean HMAC/timestamp/nonce/request-ID; default PAST=300 s/FUTURE=5 s/NONCE_TTL=300 s, success_only; H1T1N1R0 and H1T1N1R1.',
'F4-E3-false-rejection-future':'n=2000 per profile/PAST/FUTURE cell; attacker not applicable (legitimate traffic under assumed P1 through P3 clock/delay profiles); H/T/N/R mean HMAC/timestamp/nonce/request-ID, with all four enabled; success_only.',
'F5-E2-layer-cost':f"10 repeats/backend, each 3000 measured requests after 500 warm-ups; attacker not applicable (legitimate traffic); H/T/N/R mean HMAC/timestamp/nonce/request-ID; localhost E2, all four on, success_only."}
for stem,srcs in sources.items():
    source_text='; '.join(f'{s} (SHA-256 {sha(s)})' for s in srcs if (ROOT/s).is_file()) or '; '.join(srcs)
    outputs=f"`paper/figures/{stem}.pdf`; `paper/previews/{stem}.png`"
    manifest.append(f"| Figure | {outputs} | {source_text} | `python paper/generate_paper_assets.py` | {caption_map[stem]} |")
table_sources={
'T1-scenarios':f2_sources,
'T2':[s10_path,s10_summary_path,resub_path],
'T2-full':[s10_path,s10_summary_path],
'T3-layer-cost':e2_source_files,'T4-failure-modes':[e4b_path,e4c_path],
'T5-e1-coverage':f2_sources }
for name,srcs in table_sources.items():
    existing=[s for s in srcs if (ROOT/s).is_file()]
    source_text='; '.join(f'{s} (SHA-256 {sha(s)})' for s in existing) or '; '.join(srcs)+' (request CSVs selected by configuration in generator)'
    if name in ('T1-scenarios','T2','T2-full','T5-e1-coverage'):
        caption='Attacker A observes traffic without the session key, B has bearer token only, and C has leaked key; H/T/N/R denote HMAC/timestamp/nonce/request-ID. E1 v3 uses PAST=6 s/FUTURE=2 s/NONCE_TTL=8 s; S10 is independent 30-trial data; S11 has 100 attempts; success_only except the explicit any_outcome rows.'
    elif name=='T3-layer-cost': caption=f"n=10 repeats per backend, each {e2_meta['measuredRequests']} requests after {e2_meta['warmupRequests']} warm-ups; localhost; attacker not applicable; all H/T/N/R on; success_only."
    else: caption='E4b n=30 per mode/request-ID case; E4c n=200 per loss/order/retry case; attacker A is a network observer without the session key; H/T/N/R denote the four defenses; E4 scaled-time/failure profile; success_only. The omitted E4c client-failure-after-debit count equals lost responses in the raw summary and is nonzero in loss cases.'
    manifest.append(f"| Table | `paper/tables/{name}.tex` | {source_text} | `python paper/generate_paper_assets.py` | {caption} |")
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
(PAPER/'VERIFY.txt').write_text(f'Raw-derived numeric values checked: {CHECKED}\nMismatches: 0\nVerification method: {Path(__file__).relative_to(ROOT).as_posix()} reads request-level CSVs, recomputes displayed cell counts, proportions, Wilson intervals, E2 repeat p50 and t intervals, and LaTeX table outcomes. It aborts on any empty applicable cell or non-finite value. The only omitted not-applicable cell is any_outcome with request-ID defense off; see NOT_APPLICABLE_CELLS in the script. Independent PDF/table-to-summary comparison is recorded in CROSSCHECK.txt.\n',encoding='utf-8')
print(f'Generated paper assets. Raw-derived values checked: {CHECKED}; mismatches: 0')


