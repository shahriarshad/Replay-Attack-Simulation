#!/usr/bin/env python3
"""
Rebuilds the paper figures.  Run:  python make_figures.py   (needs numpy, matplotlib)
Output: ./figs/*.pdf  (black/white friendly: markers + hatching, no colour needed)

IMPORTANT
- E1, E4a and cost use the exact numbers from your result tables (T5, F3a/F3b, T3).
  When you have the raw CSV/JSON, replace the dicts below with a loader and
  re-run, so the figure comes from the raw file and not from a copy.
- E3 is recomputed here with ONE shared sample per profile (common random numbers),
  so curves are monotone and noise-free.  The old F4 used a fresh 2,000-sample draw
  per cell, which is why some lines go UP when FUTURE grows (impossible in theory).
  Decide which version goes in the paper and say so in the caption.
"""
import os, math
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

plt.rcParams.update({
    "font.family": "serif", "font.size": 7, "axes.labelsize": 7,
    "xtick.labelsize": 6.5, "ytick.labelsize": 6.5, "legend.fontsize": 6.5,
    "pdf.fonttype": 42, "axes.linewidth": 0.6,
})
OUT = "figs"
os.makedirs(OUT, exist_ok=True)
COL, DBL = 3.4, 7.1  # IEEE column / full width (inches)


def wilson(k, n, z=1.96):
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return max(0, c - h), min(1, c + h)


# ----------------------------------------------------------------------------
# Fig 1: E1 coverage heat map (exact data = T5).  Rows grouped by #layers on.
# ----------------------------------------------------------------------------
E1_COLS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7a", "S7b", "S10f", "S10l", "S11"]
E1_N = [30, 30, 30, 30, 1500, 30, 30, 30, 30, 30, 100]
E1 = {
    "H0T0N0R0": [30, 30, 30, 30, 1500, 30, 30, 30, 30, 30, 100],
    "H0T0N0R1": [0, 0, 0, 0, 0, 0, 30, 0, 30, 30, 100],
    "H0T0N1R0": [0, 0, 30, 0, 0, 0, 0, 30, 0, 30, 100],
    "H0T0N1R1": [0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 100],
    "H0T1N0R0": [30, 30, 30, 0, 1500, 30, 30, 30, 30, 0, 100],
    "H0T1N0R1": [0, 0, 0, 0, 0, 0, 30, 0, 30, 0, 100],
    "H0T1N1R0": [0, 0, 30, 0, 0, 0, 0, 30, 0, 0, 100],
    "H0T1N1R1": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100],
    "H1T0N0R0": [30, 30, 30, 30, 1500, 0, 0, 0, 30, 30, 0],
    "H1T0N0R1": [0, 0, 0, 0, 0, 0, 0, 0, 30, 30, 0],
    "H1T0N1R0": [0, 0, 30, 0, 0, 0, 0, 0, 0, 30, 0],
    "H1T0N1R1": [0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 0],
    "H1T1N0R0": [30, 30, 30, 0, 1500, 0, 0, 0, 30, 0, 0],
    "H1T1N0R1": [0, 0, 0, 0, 0, 0, 0, 0, 30, 0, 0],
    "H1T1N1R0": [0, 0, 30, 0, 0, 0, 0, 0, 0, 0, 0],
    "H1T1N1R1": [0] * 11,
}


def fig_e1():
    cfgs = sorted(E1, key=lambda c: (sum(int(c[i]) for i in (1, 3, 5, 7)), c))
    # merge S1 and S2 (identical in all 16 rows -> checked in check_paper_numbers.py)
    cols = ["S1,S2", "S3", "S4", "S5", "S6", "S7a", "S7b", "S10 fast", "S10 late", "S11"]
    idx = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    ns = [30, 30, 30, 1500, 30, 30, 30, 30, 30, 100]
    fig, ax = plt.subplots(figsize=(DBL, 3.3))
    for r, c in enumerate(cfgs):
        for j, i in enumerate(idx):
            k = E1[c][i]
            frac = k / ns[j]
            ax.add_patch(Rectangle((j, r), 1, 1, facecolor=str(1 - 0.85 * frac),
                                   edgecolor="0.6", lw=0.4,
                                   hatch="////" if frac > 0 else None))
            ax.text(j + .5, r + .5, f"{k:,}", ha="center", va="center", fontsize=6.3,
                    color="white" if frac > 0.5 else "black", fontweight="bold" if frac > 0 else None)
    ax.set_xlim(0, len(cols)); ax.set_ylim(len(cfgs), 0)
    ax.set_xticks(np.arange(len(cols)) + .5)
    ax.set_xticklabels([f"{c}\n(n={n:,})" for c, n in zip(cols, ns)])
    ax.xaxis.tick_top()
    ax.set_yticks(np.arange(len(cfgs)) + .5)
    ax.set_yticklabels(cfgs, family="monospace", fontsize=6.3)
    # group separators (0,1,2,3,4 layers on)
    k = [sum(int(c[i]) for i in (1, 3, 5, 7)) for c in cfgs]
    for r in range(1, len(cfgs)):
        if k[r] != k[r - 1]:
            ax.axhline(r, color="black", lw=1.0)
    ax.tick_params(length=0)
    for s in ax.spines.values():
        s.set_linewidth(0.8)
    ax.set_title("Successful attacks (shaded = at least one success).  "
                 "S8 = 0 and S9 = all trials succeed in every row (omitted).", fontsize=6.5, pad=22)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig_e1_coverage.pdf")
    plt.close(fig)


# ----------------------------------------------------------------------------
# Fig 2: E4a retention gap.  (a) scaled grid, f = 0,1,2 ; (b) default settings.
# Grid cell value = 30 if  TTL <= d < PAST + f  (rule verified against the data).
# ----------------------------------------------------------------------------
PAST_S = 6
TTLS = [4, 6, 8, 10, 12]
DELAYS = [1, 3, 5, 6, 7, 8, 9, 10, 11]
# observed counts (R off), keyed (ttl, f) -> {delay: count}  -- from F3a
OBS = {
    (4, 0): {5: 30}, (4, 1): {5: 30, 6: 30}, (4, 2): {5: 30, 6: 30, 7: 30},
    (6, 0): {}, (6, 1): {6: 30}, (6, 2): {6: 30, 7: 30},
}


def fig_gap_grid():
    fig, axes = plt.subplots(1, 3, figsize=(DBL, 2.0), sharey=True)
    for ax, f in zip(axes, (0, 1, 2)):
        for r, ttl in enumerate(TTLS):
            for c, d in enumerate(DELAYS):
                v = OBS.get((ttl, f), {}).get(d, 0)
                ax.add_patch(Rectangle((c, r), 1, 1, facecolor="black" if v else "white",
                                       edgecolor="0.6", lw=0.4))
                ax.text(c + .5, r + .5, str(v), ha="center", va="center", fontsize=6,
                        color="white" if v else "black")
        ax.set_xlim(0, len(DELAYS)); ax.set_ylim(len(TTLS), 0)
        ax.set_xticks(np.arange(len(DELAYS)) + .5); ax.set_xticklabels(DELAYS)
        ax.set_yticks(np.arange(len(TTLS)) + .5); ax.set_yticklabels(TTLS)
        ax.set_title(f"clock ahead f = {f} s", fontsize=7)
        ax.set_xlabel("replay delay d (s)")
        ax.tick_params(length=2)
    axes[0].set_ylabel("nonce TTL (s)")
    fig.suptitle(f"Replays executed (of 30), request-ID off, PAST = {PAST_S} s.  "
                 "Black = replay succeeded: TTL ≤ d < PAST + f", fontsize=6.8, y=1.02)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig_gap_grid.pdf", bbox_inches="tight")
    plt.close(fig)


def fig_gap_default():
    delays = [299, 301, 303, 305, 307]
    off = [0, 30, 30, 0, 0]   # request-ID off
    on = [0, 0, 0, 0, 0]      # request-ID on
    fig, ax = plt.subplots(figsize=(COL, 2.1))
    x = np.arange(len(delays))
    for xs, vals, mk, fc, lab in ((x - .09, off, "o", "black", "Request-ID off"),
                                  (x + .09, on, "s", "white", "Request-ID on")):
        lo = [v - wilson(v, 30)[0] * 30 for v in vals]
        hi = [wilson(v, 30)[1] * 30 - v for v in vals]
        ax.errorbar(xs, vals, yerr=[lo, hi], fmt=mk, mfc=fc, mec="black", ecolor="black",
                    capsize=2, ms=4.5, lw=0.8, label=lab)
    ax.set_xticks(x); ax.set_xticklabels(delays)
    ax.set_ylim(-2, 34); ax.set_ylabel("Accepted replays (n = 30)")
    ax.set_xlabel("Replay delay after first use (s)\nTTL = PAST = 300 s, FUTURE = 5 s, client clock +4 s")
    ax.legend(frameon=False, loc="center right")
    ax.grid(axis="y", lw=0.3, alpha=.5)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig_gap_default.pdf")
    plt.close(fig)


def fig_gap_schematic():
    """Concept figure the paper currently lacks: WHY the gap exists."""
    fig, ax = plt.subplots(figsize=(COL, 1.7))
    TTL, PAST, f = 300, 300, 5
    ax.add_patch(Rectangle((0, 1.0), TTL, .5, fc="0.85", ec="black", lw=.6, hatch="\\\\\\\\"))
    ax.text(TTL / 2, 1.25, "nonce store remembers  (TTL)", ha="center", va="center", fontsize=6.5,
            bbox=dict(fc="white", ec="none", pad=1.5))
    ax.add_patch(Rectangle((0, 0.3), PAST + f, .5, fc="white", ec="black", lw=.6))
    ax.text((PAST + f) / 2, .55, "timestamp still valid for a client with clock +f  (PAST + f)",
            ha="center", va="center", fontsize=6.3)
    ax.add_patch(Rectangle((TTL, 0.0), f, 1.8, fc="black", alpha=.85, lw=0))
    ax.annotate("replay gap\n[TTL, PAST+f)", xy=(TTL + f / 2, 1.8), xytext=(TTL - 70, 2.15),
                fontsize=6.5, ha="center", arrowprops=dict(arrowstyle="-|>", lw=.6))
    ax.set_xlim(-5, 330); ax.set_ylim(-.4, 2.7)
    ax.set_yticks([]); ax.set_xlabel("time since first use of the request (s)  -  default settings")
    for s in ("left", "right", "top"):
        ax.spines[s].set_visible(False)
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig_gap_schematic.pdf")
    plt.close(fig)


# ----------------------------------------------------------------------------
# Fig 3: cost.  Per-layer p50 (log scale) with 95% CI -- these CIs are tight.
# Numbers = T3 (median of repeat p50, 95% CI over 10 repeats), microseconds.
# ----------------------------------------------------------------------------
COST = {  # backend -> layer -> (median, lo, hi)
    "Redis":  {"hmac": (37.100, 36.254, 38.606), "timestamp": (9.700, 9.213, 11.687),
               "nonce": (190.050, 185.633, 197.067), "request id": (240.225, 233.994, 248.506)},
    "SQLite": {"hmac": (37.225, 35.640, 38.380), "timestamp": (9.600, 9.135, 10.805),
               "nonce": (4516.675, 3050.985, 4668.855), "request id": (331.825, 307.561, 344.679)},
    "Memory": {"hmac": (37.050, 36.044, 40.046), "timestamp": (10.450, 9.417, 12.023),
               "nonce": (16.450, 16.035, 17.745), "request id": (235.700, 228.729, 247.091)},
}


def fig_cost():
    layers = ["hmac", "timestamp", "nonce", "request id"]
    mk = {"hmac": "o", "timestamp": "s", "nonce": "^", "request id": "D"}
    fc = {"hmac": "black", "timestamp": "white", "nonce": "black", "request id": "white"}
    fig, ax = plt.subplots(figsize=(COL, 2.4))
    for b, backend in enumerate(COST):
        for j, ly in enumerate(layers):
            m, lo, hi = COST[backend][ly]
            ax.errorbar(b + (j - 1.5) * .12, m, yerr=[[m - lo], [hi - m]], fmt=mk[ly], mfc=fc[ly],
                        mec="black", ecolor="black", ms=4.5, capsize=2, lw=.8,
                        label=ly if b == 0 else None)
    ax.set_yscale("log"); ax.set_xticks(range(3)); ax.set_xticklabels(list(COST))
    ax.set_ylabel("Layer p50 (µs, log)")
    ax.set_xlabel("Nonce backend"); ax.set_xlim(-.5, 2.5)
    ax.grid(axis="y", which="both", lw=.3, alpha=.4)
    ax.legend(frameon=False, ncol=2, loc="upper center", bbox_to_anchor=(.5, -.28))
    fig.tight_layout()
    fig.savefig(f"{OUT}/fig_cost.pdf", bbox_inches="tight")
    plt.close(fig)


# ----------------------------------------------------------------------------
# Fig 4: E3 false rejection (shared-sample Monte Carlo).  Profile parameters are the
# ones in the project doc; the PAPER currently omits the log-normal shape (sigma) --
# add it to the Methods text.
# ----------------------------------------------------------------------------
PROFILES = {  # name: (offset sd, delay median, delay lognormal sigma)
    "P1": (0.5, 0.2, 0.6), "P2": (3.0, 0.5, 1.0), "P3": (30.0, 2.0, 1.2),
}
PASTS = [5, 30, 60, 120, 300]
FUTS = [0, 2, 5, 30, 60]


def false_rejection(profile, n=2_000_000, seed=7):
    sd, med, sig = PROFILES[profile]
    rng = np.random.default_rng(seed)
    off = rng.normal(0, sd, n)
    delay = med * np.exp(sig * rng.standard_normal(n))
    age = delay - off          # age as seen by the server
    out = {}
    for pa in PASTS:
        out[pa] = [float(np.mean((age > pa) | (age < -fu))) for fu in FUTS]
    return out


def fig_e3():
    fig, axes = plt.subplots(1, 3, figsize=(DBL, 2.5), sharey=True)
    styles = {5: ("o", "-"), 30: ("s", "--"), 60: ("^", "-."), 120: ("D", ":"), 300: ("v", "-")}
    for ax, p in zip(axes, PROFILES):
        res = false_rejection(p)
        for pa in PASTS:
            m, ls = styles[pa]
            ax.plot(range(len(FUTS)), res[pa], marker=m, ls=ls, color="black", ms=4,
                    mfc="black" if pa in (5, 60) else "white", lw=.9, label=f"PAST = {pa} s")
        ax.set_xticks(range(len(FUTS))); ax.set_xticklabels(FUTS)
        ax.set_title(p, fontsize=7); ax.set_xlabel("FUTURE tolerance (s)")
        ax.grid(axis="y", lw=.3, alpha=.5)
    axes[0].set_ylabel("False-rejection rate")
    h, l = axes[0].get_legend_handles_labels()
    fig.legend(h, l, frameon=False, ncol=5, loc="lower center")
    fig.tight_layout(rect=[0, 0.09, 1, 1])
    fig.savefig(f"{OUT}/fig_e3_false_rejection.pdf")
    plt.close(fig)


if __name__ == "__main__":
    fig_e1(); fig_gap_grid(); fig_gap_default(); fig_gap_schematic(); fig_cost(); fig_e3()
    print("done ->", os.path.abspath(OUT), sorted(os.listdir(OUT)))
