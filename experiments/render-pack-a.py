import csv
import os
import sys

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
e1_dir = os.path.join(root, 'experiments', 'results', 'e1-sqlite-final')
e2_dir = os.path.join(root, 'experiments', 'results', 'e2')

with open(os.path.join(e1_dir, 'summary.csv'), newline='', encoding='utf-8') as f:
    e1_rows = list(csv.DictReader(f))
configs = []
scenarios = [f'S{i}' for i in range(1, 10)]
for row in e1_rows:
    if row['scenario_id'] in scenarios and row['config_id'] not in configs:
        configs.append(row['config_id'])
matrix = np.full((len(configs), len(scenarios)), np.nan)
for row in e1_rows:
    if row['scenario_id'] in scenarios and row['config_id'] in configs and row['attack_success_rate']:
        matrix[configs.index(row['config_id']), scenarios.index(row['scenario_id'])] = float(row['attack_success_rate'])
fig, ax = plt.subplots(figsize=(13, max(6, len(configs) * 0.42)), constrained_layout=True)
image = ax.imshow(matrix, cmap='YlOrRd', vmin=0, vmax=1, aspect='auto')
ax.set_xticks(range(len(scenarios)), scenarios)
ax.set_yticks(range(len(configs)), configs)
ax.set_xlabel('Attack scenario')
ax.set_ylabel('Defense configuration')
ax.set_title('E1 attack success rate (SQLite ledger debit count / attempts)')
for i in range(len(configs)):
    for j in range(len(scenarios)):
        value = matrix[i, j]
        ax.text(j, i, '—' if np.isnan(value) else f'{value:.2f}', ha='center', va='center', fontsize=7, color='black')
fig.colorbar(image, ax=ax, label='Attack success rate')
for ext in ('png', 'pdf', 'svg'):
    fig.savefig(os.path.join(e1_dir, f'attack-success-heatmap.{ext}'), dpi=200)
plt.close(fig)

with open(os.path.join(e2_dir, 'load-repeat-summary.csv'), newline='', encoding='utf-8') as f:
    e2_rows = list(csv.DictReader(f))
stacks = list(dict.fromkeys(row['stack_id'] for row in e2_rows))
x = np.arange(len(stacks))
fig, ax = plt.subplots(figsize=(13, 6), constrained_layout=True)
width = 0.36
for offset, concurrency in enumerate(('1', '16')):
    vals, low, high = [], [], []
    for stack in stacks:
        row = next((item for item in e2_rows if item['stack_id'] == stack and item['concurrency'] == concurrency), None)
        vals.append(float(row['mean_repeat_median_ms']) if row else 0)
        low.append(float(row['mean_repeat_median_ms']) - float(row['ci95_low_ms']) if row else 0)
        high.append(float(row['ci95_high_ms']) - float(row['mean_repeat_median_ms']) if row else 0)
    ax.bar(x + (offset - .5) * width, vals, width, yerr=[low, high], capsize=3, label=f'Concurrency {concurrency}')
ax.set_xticks(x, stacks, rotation=30, ha='right')
ax.set_ylabel('Mean per-repeat median latency (ms)')
ax.set_title('E2 end-to-end latency with 95% CI across five repeat medians')
ax.legend()
for ext in ('png', 'pdf', 'svg'):
    fig.savefig(os.path.join(e2_dir, f'latency-by-stack.{ext}'), dpi=200)
plt.close(fig)

with open(os.path.join(e2_dir, 'load-repeat-summary.csv'), newline='', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))
with open(os.path.join(e2_dir, 'load-summary.tex'), 'w', encoding='utf-8') as f:
    f.write('\\begin{tabular}{lrrrrr}\n\\toprule\nStack & C & Mean median (ms) & 95\\% CI low & 95\\% CI high & Repeats \\\\\n\\midrule\n')
    for row in rows:
        f.write(f"{row['stack_id']} & {row['concurrency']} & {float(row['mean_repeat_median_ms']):.4f} & {float(row['ci95_low_ms']):.4f} & {float(row['ci95_high_ms']):.4f} & {row['repetitions']} \\\\\n")
    f.write('\\bottomrule\n\\end{tabular}\n')

with open(os.path.join(e2_dir, 'rejection-cost.csv'), newline='', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))
with open(os.path.join(e2_dir, 'rejection-cost.tex'), 'w', encoding='utf-8') as f:
    f.write('\\begin{tabular}{llrrrr}\n\\toprule\nOrder & Flood & Attempts & Mean ms & p95 ms & Rejected \\\\\n\\midrule\n')
    for row in rows:
        f.write(f"{row['check_order']} & {row['flood']} & {row['attempts']} & {float(row['mean_duration_ms']):.4f} & {float(row['p95_ms']):.4f} & {row['rejected_count']} \\\\\n")
    f.write('\\bottomrule\n\\end{tabular}\n')

print(f'matplotlib {matplotlib.__version__}; wrote E1 heatmap and E2 latency figure in PNG, PDF, SVG plus LaTeX tables')
