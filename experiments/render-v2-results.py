import csv, os, sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E1=os.path.join(ROOT,'experiments','results','e1-v2')
E2ROOT=os.path.join(ROOT,'experiments','results','e2-v2')
E2=E2ROOT
if not os.path.exists(os.path.join(E2,'load-repeat-summary.csv')) and os.path.isdir(E2ROOT):
    candidates=[os.path.join(E2ROOT,n) for n in os.listdir(E2ROOT) if os.path.isdir(os.path.join(E2ROOT,n)) and os.path.exists(os.path.join(E2ROOT,n,'load-repeat-summary.csv'))]
    if candidates:E2=max(candidates,key=os.path.getmtime)
E3=os.path.join(ROOT,'experiments','results','e3-v2')
E4=os.path.join(ROOT,'experiments','results','e4-v2')
E4C=os.path.join(ROOT,'experiments','results','e4-v2-corrected')
def read(path):
    with open(path,newline='',encoding='utf-8') as f:return list(csv.DictReader(f))
def save(fig,directory,name):
    os.makedirs(directory,exist_ok=True)
    for ext in ('png','pdf','svg'):fig.savefig(os.path.join(directory,f'{name}.{ext}'),dpi=180)

e1run=read(os.path.join(E1,'summary.csv'))
scenarios=list(dict.fromkeys(r['scenario_id'] for r in e1run if r['scenario_id']!='LEGITIMATE_CONTROL'))
configs=list(dict.fromkeys(r['config_id'] for r in e1run if '-DEFAULT' not in r['config_id']))
matrix=np.full((len(configs),len(scenarios)),np.nan)
for r in e1run:
    if r['config_id'] in configs and r['scenario_id'] in scenarios and r['attack_success_rate']!='':matrix[configs.index(r['config_id']),scenarios.index(r['scenario_id'])]=float(r['attack_success_rate'])
fig,ax=plt.subplots(figsize=(max(12,len(scenarios)*.85),max(6,len(configs)*.38)),constrained_layout=True)
im=ax.imshow(matrix,vmin=0,vmax=1,cmap='YlOrRd',aspect='auto');ax.set_xticks(range(len(scenarios)),scenarios,rotation=35,ha='right');ax.set_yticks(range(len(configs)),configs);ax.set_xlabel('Scenario');ax.set_ylabel('Defense configuration');ax.set_title('E1 v2 attack success rate (SQLite ledger oracle)')
for i in range(len(configs)):
    for j in range(len(scenarios)):
        if np.isfinite(matrix[i,j]):ax.text(j,i,f'{matrix[i,j]:.2f}',ha='center',va='center',fontsize=6)
fig.colorbar(im,ax=ax,label='Debited / attempts');save(fig,E1,'attack-success-heatmap');plt.close(fig)
tex=['\\begin{tabular}{l'+'c'*len(scenarios)+'}','\\toprule','Configuration & '+' & '.join(scenarios)+' \\\\','\\midrule']
for i,c in enumerate(configs):tex.append(c+' & '+' & '.join('---' if not np.isfinite(matrix[i,j]) else f'{matrix[i,j]:.2f}' for j in range(len(scenarios)))+' \\\\')
tex+=['\\bottomrule','\\end{tabular}'];open(os.path.join(E1,'coverage-matrix.tex'),'w',encoding='utf-8').write('\n'.join(tex)+'\n')

if os.path.exists(os.path.join(E2,'load-repeat-summary.csv')):
    rows=read(os.path.join(E2,'load-repeat-summary.csv'));stacks=[r['stack_id'] for r in rows];vals=[float(r['server_handler_repeat_median_median_ns'])/1e6 for r in rows];means=[(float(r['server_handler_t_ci95_low_ns'])+float(r['server_handler_t_ci95_high_ns']))/2e6 for r in rows];lo=[(float(r['server_handler_t_ci95_high_ns'])-float(r['server_handler_t_ci95_low_ns']))/2e6 for r in rows];
    fig,ax=plt.subplots(figsize=(12,6),constrained_layout=True);x=np.arange(len(stacks));ax.bar(x,means,yerr=[lo,lo],capsize=3,label='Mean of repeat medians with t-based 95% CI');ax.scatter(x,vals,color='black',marker='D',zorder=3,label='Median of repeat medians');ax.set_xticks(x,stacks,rotation=30,ha='right');ax.set_ylabel('Server handler latency (ms)');ax.set_title('E2 v2 server-side handler cost');ax.legend();save(fig,E2,'server-handler-cost');plt.close(fig)
    with open(os.path.join(E2,'load-summary.tex'),'w',encoding='utf-8') as f:
        f.write('\\begin{tabular}{lrrrr}\\toprule\nStack & Median of repeat medians (ns) & Mean t-CI low & Mean t-CI high & Repeats \\\\\n\\midrule\n')
        for r in rows:f.write(f"{r['stack_id']} & {float(r['server_handler_repeat_median_median_ns']):.0f} & {float(r['server_handler_t_ci95_low_ns']):.0f} & {float(r['server_handler_t_ci95_high_ns']):.0f} & {r['repetitions']} \\\\\n")
        f.write('\\bottomrule\\end{tabular}\n')
    rejection_path=os.path.join(E2,'rejection-cost.csv')
    if os.path.exists(rejection_path):
        with open(rejection_path,newline='',encoding='utf-8') as f: floods=list(csv.DictReader(f))
        with open(os.path.join(E2,'rejection-cost.tex'),'w',encoding='utf-8') as f:
            f.write('\\begin{tabular}{llrrrrrr}\\toprule\nOrder & Flood & N & Handler p50 ns & p95 ns & p99 ns & Trimmed p99 ns & Max ns \\\\\n\\midrule\n')
            for r in floods:f.write(f"{r['check_order']} & {r['flood']} r{r['repeat']} & {r['attempts']} & {r['server_handler_p50_ns']} & {r['server_handler_p95_ns']} & {r['server_handler_p99_ns']} & {r['server_handler_trimmed_p99_ns']} & {r['server_handler_max_ns']} \\\\\n")
            f.write('\\bottomrule\\end{tabular}\n')

if os.path.exists(os.path.join(E3,'summary.csv')):
    rows=read(os.path.join(E3,'summary.csv'))
    for profile in ('P1','P2','P3'):
        subset=[r for r in rows if r['profile']==profile];fig,ax=plt.subplots(figsize=(9,5),constrained_layout=True)
        for past in sorted(set(int(r['past_seconds']) for r in subset)):
            curve=sorted((int(r['future_seconds']),float(r['false_rejection_rate'])) for r in subset if int(r['past_seconds'])==past);ax.plot([x[0] for x in curve],[100*x[1] for x in curve],marker='o',label=f'PAST {past}s')
        ax.set_xlabel('FUTURE tolerance (s)');ax.set_ylabel('False rejections (%)');ax.set_title(f'E3 {profile}: assumed clock and delay profile');ax.legend(fontsize=7,ncol=2);save(fig,E3,f'{profile.lower()}-false-rejection-vs-future');plt.close(fig)
    fig,axes=plt.subplots(1,3,figsize=(15,5),constrained_layout=True)
    for ax,profile in zip(axes,('P1','P2','P3')):
        subset=[r for r in rows if r['profile']==profile];futures=sorted(set(int(r['future_seconds']) for r in subset))
        for future in futures:
            curve=sorted((int(r['past_seconds']),float(r['false_rejection_rate'])) for r in subset if int(r['future_seconds'])==future);ax.plot([x[0] for x in curve],[100*x[1] for x in curve],marker='o',label=f'FUTURE {future}s')
        ax.set_title(profile+' assumed');ax.set_xlabel('PAST replay window (s)');ax.set_ylabel('False rejections (%)');ax.legend(fontsize=6)
        right=ax.twinx();past_values=sorted(set(int(r['past_seconds']) for r in subset));right.plot(past_values,past_values,color='black',linestyle='--',alpha=.65,label='Replay acceptance window = PAST');right.set_ylabel('Replay acceptance window (s)')
    save(fig,E3,'false-rejection-vs-past-and-replay-window');plt.close(fig)
    with open(os.path.join(E3,'summary.tex'),'w',encoding='utf-8') as f:
        f.write('\\begin{tabular}{lrrrrrr}\\toprule\nProfile & PAST & FUTURE & Rejects / N & Rate & Wilson low & Wilson high \\\\\n\\midrule\n')
        for r in rows:f.write(f"{r['profile']} & {r['past_seconds']} & {r['future_seconds']} & {r['false_rejections']}/{r['attempts']} & {float(r['false_rejection_rate']):.5f} & {float(r['wilson95_low']):.5f} & {float(r['wilson95_high']):.5f} \\\\\n")
        f.write('\\bottomrule\\end{tabular}\n')

if os.path.exists(os.path.join(E4,'e4a-summary.csv')):
    rows=read(os.path.join(E4,'e4a-summary.csv'))
    with open(os.path.join(E4,'e4a-grid.tex'),'w',encoding='utf-8') as f:
        f.write('\\begin{tabular}{lrrrrrr}\\toprule\nConfig & TTL & Offset & Delay & Trials & Accepted & Blocked / reason \\\\\n\\midrule\n')
        for r in rows:f.write(f"{r['configuration']} & {r['nonce_ttl_seconds']} & {r['client_future_offset_seconds']} & {r['replay_delay_seconds']} & {r['trials']} & {r['accepted']} & {r['blocked']} / \\texttt{{\\detokenize{{{r['blocking_layer_histogram']}}}}} \\\\\n")
        f.write('\\bottomrule\\end{tabular}\n')
    if os.path.exists(os.path.join(E4,'e4d-derived.csv')):
        with open(os.path.join(E4,'e4d-derived.csv'),newline='',encoding='utf-8') as f:derived=list(csv.DictReader(f))
        with open(os.path.join(E4,'e4d-derived.tex'),'w',encoding='utf-8') as f:
            f.write('\\begin{tabular}{rrrrrr}\\toprule\nRate & TTL & Derived keys & B/key & Derived bytes & Derived MiB \\\\\n\\midrule\n')
            for r in derived:f.write(f"{r['requests_per_second']} & {r['ttl_seconds']} & {r['derived_keys']} & {float(r['derived_mean_bytes_per_key']):.5f} & {float(r['derived_memory_bytes']):.0f} & {float(r['derived_memory_mib']):.3f} \\\\\n")
            f.write('\\bottomrule\\end{tabular}\n')
    if os.path.exists(os.path.join(E4,'e4b.csv')):
        rows=read(os.path.join(E4,'e4b.csv'))
        with open(os.path.join(E4,'fault-mode.tex'),'w',encoding='utf-8') as f:
            f.write('\\begin{tabular}{lrrrr}\\toprule\nCase & Legit accepted / total & Replay accepted & Failure mode & Request-ID \\\\\n\\midrule\n')
            for r in rows:
                if r.get('attempt')=='summary':f.write(f"{r['case']} & {r['legitimate_accepted']}/{r['legitimate_total']} & {r['replay_accepted']}/{r['replay_total']} & {r['nonce_fail_mode']} & {r['request_id_defense']} \\\\\n")
            f.write('\\bottomrule\\end{tabular}\n')
    if os.path.exists(os.path.join(E4C,'e4c.csv')):
        rows=read(os.path.join(E4C,'e4c.csv'))
        with open(os.path.join(E4,'retry-loss-corrected.tex'),'w',encoding='utf-8') as f:
            f.write('\\begin{tabular}{lrrrrl}\\toprule\nCase & Loss p & Trials & Debits & Failure after debit & Retry reasons \\\\\n\\midrule\n')
            for r in rows:
                if r.get('kind')=='summary':f.write(f"{r['case']} & {r.get('loss_probability','')} & {r['trials']} & {r.get('debits','')} & {r.get('client_failure_after_debit','')} & \\texttt{{\\detokenize{{{r.get('client_failure_reasons','')}}}}} \\\\\n")
                elif r.get('kind')=='insufficient-retry':f.write(f"{r['case']} & n/a & 1 & n/a & n/a & {r['initial_reason']} → {r['retry_reason']} \\\\\n")
            f.write('\\bottomrule\\end{tabular}\n')
print('matplotlib',matplotlib.__version__,'; wrote E1/E2/E3 figures and E1/E2/E3/E4 LaTeX tables where raw summaries exist')
