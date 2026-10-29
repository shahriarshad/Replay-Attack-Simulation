# Layered Replay-Attack Defense: Simulation and Research Artifact

This repository contains a local bank-API simulation, a browser UI, a Socket.IO visualization dashboard, replay-attack tooling, and measurement harnesses. It was built to evaluate layered replay defenses and idempotency behavior. It is a research/classroom simulation; it is not a bank product, and none of its results describe a real bank, network, Redis deployment, telecom operator, or mobile-financial-service provider.

## What was measured

The checked-in results pack and paper assets summarize experiments run on Windows with Node.js v24.11.1 and **Memurai Developer 4.2.3** (Redis-compatible, but not stock Redis). All measured server and client timings are localhost timings. The E3 delay and clock-skew distributions are assumptions used by the simulation, not observations of any real network.

| Finding | Measured result | Evidence |
|---|---|---|
| Token-only attacker, no session signing key (S11) | In the Round I run, fresh requests with a captured bearer token and no valid signature produced 100/100 SQLite debits when HMAC was off, and 0/100 in each of the eight HMAC-on configurations (`SIGNATURE_FAIL`). | `experiments/results/e1-v3-s11/round-i-s11/summary.csv`; complete counts and Wilson intervals in [RESULTS_PACK_A](docs/RESULTS_PACK_A.md) and [ROUND_I_REPORT](docs/ROUND_I_REPORT.md). |
| Four-layer replay ablation (E1 v3) | 16 H/T/N/R configurations, scaled windows PAST=6 s, FUTURE=2 s, NONCE_TTL=8 s, SESSION_TTL=15 s. S1–S9 used 30 attempts per cell; S5 used 1,500. S9 deliberately gives the attacker the leaked signing key, so it demonstrates the scheme’s limit. | `experiments/results/e1-v3/round-i-scaled/summary.csv`; full request records are in each configuration subdirectory. |
| Corrected TTL-gap confirmation | With default PAST=300 s, FUTURE=5 s, TTL=300 s and a +4 s client offset, request-ID off accepted 0/30 replays at 299 s, 30/30 at 301 s, 30/30 at 303 s, then 0/30 at 305 s and 307 s. With request-ID on, all five delays had 0/30 accepted. | `docs/RESULTS_PACK_A.md` Round F table; raw request CSV paths and SHA-256 hashes are listed there. |
| Previously failed withdrawal replay (independent S10) | Each trial used a different failed request ID and nonce. Under `success_only`, a failed attempt does not reserve its ID; later execution depends on the enabled freshness defenses. Under `any_outcome` with request-ID defense on, the same failed ID is blocked. A funded legitimate retry with a fresh nonce succeeds with a new ID under both policies; reusing the failed ID succeeds only under `success_only`. | Round I S10 and resubmission tables in [RESULTS_PACK_A](docs/RESULTS_PACK_A.md); all cells and reasons in [ROUND_I_REPORT](docs/ROUND_I_REPORT.md). |
| E2 per-layer latency (10 repeats) | Median per-request layer p50s were approximately 190.050 µs for Redis nonce storage, 4,516.675 µs for SQLite nonce storage, and 16.450 µs for in-memory nonce storage. | `paper/tables/T3-layer-cost.tex`; detailed t-based intervals and method in `docs/RESULTS_PACK_A.md`. Localhost/single-machine comparison only. |
| E3 false rejection | Under assumed P1 parameters, PAST=5 s/FUTURE=0 rejected 629/2,000 requests; PAST=5 s/FUTURE=2 rejected 0/2,000. Every E3 cell matched the offline timestamp-rule recomputation. | E3 table in `docs/RESULTS_PACK_A.md`; `experiments/results/e3-v2/summary.csv` and `requests.csv`. These are assumption-driven simulations, not network measurements. |
| E4a TTL/window rule | No rule violations in 135 request-ID-off cells. The tested rule was acceptance iff TTL ≤ replay delay < PAST + future offset; the exact TTL=4 boundary was not sampled. | E4a section in `docs/RESULTS_PACK_A.md`; `experiments/results/e4-v2/e4a-rule-check.json`. |
| Concurrent debit safety check | All 30 repeats of 100 parallel distinct withdrawals against balance 100 satisfied the ledger invariants; minimum reconstructed balance was 0. | `experiments/results/round-i/atomic-debit/runs.csv` and sanitized `ledger.csv`; details in `docs/ROUND_I_REPORT.md`. |
| Nonce-store growth | Clean runs measured about 180.97 bytes per key for accepted requests and requests rejected later at request-ID. Older 164.96 B/key data are marked unverified/superseded. | `docs/RESULTS_PACK_A.md`, memory raw files and INFO logs under `experiments/results/`. |

The evidence is intentionally scoped. A bearer token alone did not let the S11 attacker sign fresh requests when HMAC was enabled, but a leaked session key can forge requests (S9). The key resides in browser memory. The network-observer interpretation assumes protected session-key delivery; the default local HTTP setup does not provide TLS.

## Figures

- **F2 — E1 replay success matrix:** [single-column preview](paper/previews/F2-e1-coverage-single.png), [double-column preview](paper/previews/F2-e1-coverage-double.png), [PDF figures](paper/figures/).
- **F3 — nonce TTL and timestamp window:** [scaled TTL panels](paper/figures/F3a-scaled-TTL-grid.pdf), [default-window TTL gap](paper/figures/F3b-default-TTL-gap.pdf).
- **F4 — assumed E3 false-rejection profiles:** [PDF](paper/figures/F4-E3-false-rejection-future.pdf).
- **F5 — nonce-backend layer cost:** [PDF](paper/figures/F5-E2-layer-cost.pdf).
- LaTeX tables: [scenarios](paper/tables/T1-scenarios.tex), [S10/idempotency](paper/tables/T2.tex), [layer cost](paper/tables/T3-layer-cost.tex), [failure modes](paper/tables/T4-failure-modes.tex), [E1 coverage](paper/tables/T5-e1-coverage.tex).


## Reviewer map

Start here, then follow the linked raw paths and hashes:

1. [docs/RESULTS_PACK_A.md](docs/RESULTS_PACK_A.md) — result tables, provenance, run profiles, and superseded-result notes.
2. [docs/CLAIMS_EVIDENCE.md](docs/CLAIMS_EVIDENCE.md) — candidate claims, supporting evidence, and caveats.
3. [docs/PAPER_FACTS_CURATED.md](docs/PAPER_FACTS_CURATED.md) — curated values with scope and source hashes. The larger `docs/PAPER_FACTS.md` is labeled as a raw machine register, not for citation.
4. [paper/INVENTORY.md](paper/INVENTORY.md), [paper/MANIFEST.md](paper/MANIFEST.md), and [paper/CROSSCHECK.txt](paper/CROSSCHECK.txt) — generated figures/tables, source data, and independent paper-asset check.
5. [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) and [docs/LIMITATIONS.md](docs/LIMITATIONS.md) — attacker assumptions, simulation limits, and security caveats.
6. [docs/REPRODUCE.md](docs/REPRODUCE.md) — Windows reproduction commands, environment, and run conventions.
7. [docs/ROUND_I_REPORT.md](docs/ROUND_I_REPORT.md) — final experiment round details, full per-cell results, code changes, commands, audit, tests, and caveats.

### Important raw-data availability note

The detailed tables and provenance documents are tracked. Some large per-request CSVs, SQLite run databases, and Round I raw outputs are local files excluded by this workspace’s `.git/info/exclude`; those files are not present in a fresh Git checkout. The documentation records their paths and hashes, but those hashes cannot be independently checked from a clone unless the raw artifacts are separately provided. A reviewer can reproduce fresh runs using the commands below; do not treat a fresh run as the exact saved run.

## Verify this checkout

Run these commands from Windows PowerShell at the repository root. They do not need Bash, `jq`, or WSL:

```powershell
# Test suite (44 passed in the recorded Round I run)
npm.cmd test

# Independent audit; choose a new output directory for each audit
$env:AUDIT_OUTPUT_DIR = 'experiments/results/reviewer-audit-2026-10-28'
node experiments/audit/verify-results.js

# Compare the paper tables/heat maps against their source summaries
python paper/crosscheck_assets.py
```

The saved Round I audit reported 4,532 compared values and 0 mismatches. The saved paper generator check reported 1,095 values and 0 mismatches; the separate cross-check reported 672 values and 0 mismatches. The audit and paper cross-check require the referenced raw experiment CSVs. A clean clone without the locally excluded Round I artifacts cannot reproduce those exact audit totals until the raw files are supplied.

To regenerate the paper assets (this rewrites generated files under `paper/`), run:

```powershell
python paper/generate_paper_assets.py
python paper/crosscheck_assets.py
```

## Reproduce the final E1 and correctness runs

The harnesses start local child servers and use login/session signing, a keep-alive HTTP agent, the SQLite ledger oracle, and attacker-visible proxy captures with login-response redaction. Use a **new output directory** for every run. The commands below target loopback only and do not change the server's default NONCE_TTL.

```powershell
# E1 v3 scaled matrix plus default-window confirmation (long run)
$env:E1_OUTPUT_DIR = 'experiments/results/reviewer-e1-v3'
$env:E1_RUN_TAG = 'scaled'
$env:E1_PAST_SECONDS = '6'
$env:E1_FUTURE_SECONDS = '2'
$env:E1_NONCE_TTL_SECONDS = '8'
$env:E1_SESSION_TTL_SECONDS = '15'
node experiments/e1/run.js

# S11, 100 attempts per configuration; use its own output root
$env:E1_OUTPUT_DIR = 'experiments/results/reviewer-s11'
$env:E1_RUN_TAG = 's11'
$env:E1_SCENARIO_FILTER = 'S11'
$env:E1_ATTEMPTS = '100'
node experiments/e1/run.js

# Independent S10 failed-request trials
$env:S10_INDEP_OUTPUT_DIR = 'experiments/results/reviewer-s10-independent'
node experiments/e1/run-s10-independent.js

# I3 correctness checks (set unique destinations)
$env:ROUTE_BINDING_OUTPUT_DIR = 'experiments/results/reviewer-route-binding'
node experiments/checks/run-route-binding.js
$env:ATOMIC_DEBIT_OUTPUT_DIR = 'experiments/results/reviewer-atomic-debit'
node experiments/checks/run-atomic-debit.js

# Exact-count E4c loss/retry experiment
$env:E4_OUTPUT_DIR = 'experiments/results/reviewer-e4c'
$env:E4C_ONLY = 'true'
node experiments/e4/run.js
```

E1 v3 takes roughly 16 minutes on the recorded machine; independent S10 took about 5 minutes. Runtime varies with CPU power state, system load, and Memurai. For E2, E3, and the full E4 sweep, see the exact commands and recorded runtimes in [docs/REPRODUCE.md](docs/REPRODUCE.md). They take longer and should be run with unique output directories. Avoid the top-level `npm run experiments` for a quick verification: it chains the full E1–E4 measurements and render/pack jobs.

## Run the local demo

The bank UI, API, and dashboard are for a classroom presentation. Use the dedicated [demo runbook](docs/DEMO.md) for exact Windows and WSL steps. Key environment detail: this Memurai installation listens on IPv4, so configure `REDIS_URL=redis://127.0.0.1:6379`, not `localhost`. Keep the attack pointed only at the local simulation. `attack/attack.sh` needs `jq` in WSL; the experiment harness itself runs natively on Windows.

For the traditional UI and dashboard startup order, see [docs/DEMO.md](docs/DEMO.md). Demo reset and nonce-crash routes are enabled by default for classroom compatibility and must not be exposed as production endpoints.

## Architecture and defense notation

A protected withdrawal is bound to a login session and account, then passes the configured checks: HMAC signature (H), timestamp freshness (T), nonce uniqueness (N), request-ID idempotency (R), and account balance. `H1T1N1R1` means all four replay-defense layers are enabled; `H0T0N0R0` disables those four checks but retains session authentication, account ownership, and balance checks. The usual order is HMAC → timestamp → nonce → request ID → balance; `CHECK_ORDER` supports the experiment variants.

The default idempotency policy is `success_only`: a failed insufficient-balance transaction does not permanently reserve its request ID, so a legitimate retry can succeed with a fresh nonce. `any_outcome` is an experimental alternative that also reserves failed IDs. See the S10 evidence above and the implementation details in [docs/RESULTS_PACK_A.md](docs/RESULTS_PACK_A.md).

## Security and limitations

- This is a simulation, not a financial service or deployment template.
- The default server uses HTTP; no TLS is provided by this artifact.
- A session signing key exists in client memory. Client compromise or key leakage permits forged signatures until session expiry; S9 measures this explicit limit.
- The login PIN is a classroom mechanism, not production authentication or a claim of rate-limited credential security.
- The dashboard and demo routes are demonstration features. Do not expose them on a public interface.
- Redis measurements used Memurai Developer 4.2.3 on Windows; they do not establish behavior on stock Redis or a distributed production deployment.
- Latencies are localhost measurements on one machine. E3 network-delay and clock-offset profiles are stated assumptions, not empirical network traces.
- The USSD-style gateway is a simulation only and makes no claim about any real telecom operator or MFS provider.

See [THREAT_MODEL.md](docs/THREAT_MODEL.md) and [LIMITATIONS.md](docs/LIMITATIONS.md) before interpreting any security claim.
