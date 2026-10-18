# Reproducing the Final Experiment Round

All experiment services and harnesses run natively on Windows. WSL is only needed for `attack/attack.sh`; none of the C0–C10 measurement commands need Bash, `jq`, or WSL. The harnesses target `127.0.0.1` only and use a keep-alive HTTP agent.

## Prerequisites

1. Start the Windows Memurai service, then check it with:

   ```powershell
   & 'C:\Applications\memurai-cli.exe' ping
   ```

   Expected response: `PONG`. In `server/.env`, set `REDIS_URL=redis://127.0.0.1:6379`; Memurai listens on IPv4 only in this environment.

2. From PowerShell at the repository root, verify the research dependencies before any run:

   ```powershell
   node --version
   & 'C:\Applications\memurai-cli.exe' INFO server
   Test-NetConnection 127.0.0.1 -Port 6379
   ```

3. E1/E2/E3/E4 start isolated child server processes with explicit environment values, fresh SQLite paths, and Memurai namespaces. A separate default server on port 3000 is not needed for those harnesses. Existing Phase 0 standalone scripts and race/memory scripts use the already running local server; their environment must match the command metadata and the saved raw artifact.

## Reproduce commands and recorded runtimes

| Result | PowerShell command | Saved output | Recorded runtime |
|---|---|---|---:|
| Unit/integration tests | `npm.cmd test 2>&1 | Tee-Object experiments/results/final-round/npm-test.log` | `experiments/results/final-round/npm-test.log` | Current test runtime is printed at the end of the log. |
| E1 v2 ablation and default-window confirmation | `node experiments/e1/run.js` | `experiments/results/e1-v2/` | 1,148.321 s (`e1-v2/run.json`) |
| C1 S11 only | `$env:E1_SCENARIO_FILTER='S11'; $env:E1_OUTPUT_DIR='experiments/results/e1-v2-s11'; node experiments/e1/run.js` | `experiments/results/e1-v2-s11/` | 32.509 s (`run.json`) |
| C2 S10 fast, both policies | `$env:E1_POLICY_SWEEP='true'; $env:E1_SCENARIO_FILTER='S10_fast'; $env:E1_OUTPUT_DIR='experiments/results/s10-policy-fast'; node experiments/e1/run.js` | `experiments/results/s10-policy-fast/` | 44.324 s (`run.json`) |
| C2 S10 late, both policies | `$env:E1_POLICY_SWEEP='true'; $env:E1_SCENARIO_FILTER='S10_late'; $env:E1_OUTPUT_DIR='experiments/results/s10-policy-late'; node experiments/e1/run.js` | `experiments/results/s10-policy-late/` | 139.527 s (`run.json`) |
| C2 legitimate post-funding resubmission | `$env:POLICY_RETRY_OUTPUT='experiments/results/s10-policy-resubmit-final'; node experiments/e1/run-policy-resubmit.js` | `experiments/results/s10-policy-resubmit-final/` | `run.json` records elapsed seconds. |
| E2 v2 load and rejection cost | `node experiments/e2/run.js` | `experiments/results/e2-v2/` | 2,268.197 s (`run.json`) |
| C5 per-layer table | `node experiments/audit/make-e2-layer-table.js` | `experiments/results/e2-v2/per-layer-coverage-c5.csv` | Under 1 s on the recorded host. |
| E3 false rejection sweep | `node experiments/e3/run.js` | `experiments/results/e3-v2/` | 933.547 s (`run.json`) |
| E4a–E4d original scaled-time run | `$env:E4_OUTPUT_DIR='experiments/results/e4-v2-rerun-unique'; node experiments/e4/run.js` | Chosen unique output directory | Prior saved E4 v2 runtime: 401.495 s (`e4-v2/run.json`). A fresh rerun will take the runtime recorded in its new `run.json`. |
| C3 E4b, 30 replays per case | `$env:E4B_ONLY='true'; $env:E4_OUTPUT_DIR='experiments/results/e4b-rerun-unique'; node experiments/e4/run.js` | Chosen unique output directory, `e4b.csv` | 5.343 s in the saved corrected run. |
| C3 E4c, 200 transactions/cell | `$env:E4C_ONLY='true'; $env:E4_OUTPUT_DIR='experiments/results/e4c-rerun-unique'; node experiments/e4/run.js` | Chosen unique output directory, `e4c.csv` | 27.511 s in the saved fresh-directory run. |
| C4 E4a rule check | `node experiments/audit/check-e4a-rule.js` | `experiments/results/e4-v2/e4a-rule-check.json` | Under 1 s. |
| C9 independent audit | `node experiments/audit/verify-results.js` | `experiments/results/audit/audit-report.json` and `.md` | About 6 s in the saved audit invocation. |
| Curated facts | `node experiments/audit/build-curated-facts.js` | `docs/PAPER_FACTS_CURATED.md` | Under 2 s. |
| Results pack | `node experiments/audit/build-results-pack-final.js` | `docs/RESULTS_PACK_A.md` | Under 2 s. |

## Recreate the E1 policy sweep without reusing state

For a new measurement, use a new `E1_OUTPUT_DIR` for every invocation. Each configuration starts a child server and a new SQLite file; do not point a second run at an existing directory. Set the desired scenario filter and policy-sweep flag before launching Node. The recorded `s10-policy-fast` and `s10-policy-late` outputs each contain both policies and all eight configurations with request-ID defense enabled.

The separate resubmission harness starts one fresh server/database per policy/variant cell, and runs 30 failed-withdrawal/funding/retry trials inside it. Use a new `POLICY_RETRY_OUTPUT` directory for every reproduction.

## E4 state isolation

`experiments/e4/run.js` writes per-cell SQLite files under `E4_OUTPUT_DIR`. Choose a previously unused output directory for every run. The first C3 E4c correction reused an existing directory; its attempts were rejected against prior request IDs and it is superseded. The cited C3 E4c run uses a new directory, has 200 transactions per cell, and records the fixed common random loss pattern. E4b uses 30 replay attempts per fault case and calculates Wilson intervals including 0/30 and 30/30.

## Race and nonce memory measurements

These scripts talk to the already-running local Windows server. Save fresh output to a new path and ensure `EXPERIMENT_API` resolves to loopback:

```powershell
$env:EXPERIMENT_API='http://127.0.0.1:3000'
$env:RACE_OUTPUT='experiments/results/race-new'
node experiments/run-races.js

$env:RUN_ID='accepted-new'
node experiments/run-nonce-memory.js accepted
$env:RUN_ID='requestid-new'
node experiments/run-nonce-memory.js requestid
```

The canonical saved memory runs used `NONCE_TTL=86400`, collected an empty-store `INFO memory` baseline first, measured 0/1k/10k/100k nonce keys, and preserved raw INFO output. Their runtime and duration/TTL ratios are in their JSON summaries. The older unverified 164.96 B/key result is superseded and excluded.

## Reported runtimes and variability

Runtimes above come from saved run metadata, except where the test or offline renderer prints its own runtime. Windows scheduling, CPU power policy, Memurai state, and background load can change a reproduction’s time and latency. Reproduction commands write new results; they do not overwrite the cited final-round result directories when the unique output paths shown above are used.
