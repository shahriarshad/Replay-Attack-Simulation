# Final Experiment Results Pack

Generated 2026-10-21T07:40:03.638Z. All traffic was directed to the localhost simulation on Windows with Memurai Developer 4.2.3. Latency numbers are localhost-only and support relative comparisons. No Phase 5 work was started.

## Methods and corrections

- E1/E1-S11 use session login, bearer tokens, per-session signing for legitimate traffic, a keep-alive HTTP agent, isolated SQLite databases, per-run Memurai namespaces, and VIZ disabled. “None” disables only the four replay layers; authentication and account ownership remain. S11 attacker requests contain only the captured bearer token and no signature.
- C2 compares `success_only` (default) and `any_outcome`; all other experiments use `success_only`. S10 fast/late each replay one captured FAILED request 30 times. C2 resubmission trials use 30 distinct failed requests per cell.
- E3 offsets and delays are simulation assumptions; they are not measured network distributions. Timestamp acceptance uses the same exported helper in `server/utils/timestamp.js` for server and E3 offline validation.
- E4c initial output and the reused-directory rerun are superseded. Cite only `experiments/results/e4-final-c3-rerun/e4c.csv`. E4b’s earlier one-replay-per-case output is superseded by the 30-trial rerun.
- Older E1 report field `oracle_total_debited_delta` is an amount, not a debit-row count. `debited_count` is the number of success rows. E1 S10 had one FAILED request ID replayed 30 times, which explains amounts greater than debit-row counts.

## E1 v2 plus S11 token-only forgery

E1 run runtime: 1148.321s. S11 runtime: 26.943s. E1 raw summary: `experiments/results/e1-v2/summary.csv` SHA-256 `d24bdccf210d02995691ecc4e3b0a37ff451e0a11ca0ad14613d2c939076835f`; S11 raw summary: `experiments/results/e1-v2-s11/summary.csv` SHA-256 `05b6281d9f85a85349672e831ce6acb3cc98974e45814bdd17d2835127a52309`. Commands: `node experiments/e1/run.js`; S11: `$env:E1_SCENARIO_FILTER="S11"; node experiments/e1/run.js`. Each matrix value is SQLite debits/attempts [Wilson 95%].

| Config | Scenario | Debits / attempts [Wilson 95%] |
|---|---|---|
| H0T0N0R0 | S1 | 30/30 [0.886,1.000] |
| H0T0N0R0 | S2 | 30/30 [0.886,1.000] |
| H0T0N0R0 | S3 | 30/30 [0.886,1.000] |
| H0T0N0R0 | S4 | 30/30 [0.886,1.000] |
| H0T0N0R0 | S5 | 1500/1500 [0.997,1.000] |
| H0T0N0R0 | S6 | 30/30 [0.886,1.000] |
| H0T0N0R0 | S7a | 30/30 [0.886,1.000] |
| H0T0N0R0 | S7b | 30/30 [0.886,1.000] |
| H0T0N0R0 | S8 | 0/30 [0.000,0.114] |
| H0T0N0R0 | S9 | 30/30 [0.886,1.000] |
| H0T0N0R0 | S10_fast | 5/30 [0.073,0.336] |
| H0T0N0R0 | S10_late | 5/30 [0.073,0.336] |
| H1T0N0R0 | S1 | 30/30 [0.886,1.000] |
| H1T0N0R0 | S2 | 30/30 [0.886,1.000] |
| H1T0N0R0 | S3 | 30/30 [0.886,1.000] |
| H1T0N0R0 | S4 | 30/30 [0.886,1.000] |
| H1T0N0R0 | S5 | 1500/1500 [0.997,1.000] |
| H1T0N0R0 | S6 | 0/30 [0.000,0.114] |
| H1T0N0R0 | S7a | 0/30 [0.000,0.114] |
| H1T0N0R0 | S7b | 0/30 [0.000,0.114] |
| H1T0N0R0 | S8 | 0/30 [0.000,0.114] |
| H1T0N0R0 | S9 | 30/30 [0.886,1.000] |
| H1T0N0R0 | S10_fast | 5/30 [0.073,0.336] |
| H1T0N0R0 | S10_late | 5/30 [0.073,0.336] |
| H0T1N0R0 | S1 | 30/30 [0.886,1.000] |
| H0T1N0R0 | S2 | 30/30 [0.886,1.000] |
| H0T1N0R0 | S3 | 30/30 [0.886,1.000] |
| H0T1N0R0 | S4 | 0/30 [0.000,0.114] |
| H0T1N0R0 | S5 | 1500/1500 [0.997,1.000] |
| H0T1N0R0 | S6 | 30/30 [0.886,1.000] |
| H0T1N0R0 | S7a | 30/30 [0.886,1.000] |
| H0T1N0R0 | S7b | 30/30 [0.886,1.000] |
| H0T1N0R0 | S8 | 0/30 [0.000,0.114] |
| H0T1N0R0 | S9 | 30/30 [0.886,1.000] |
| H0T1N0R0 | S10_fast | 5/30 [0.073,0.336] |
| H0T1N0R0 | S10_late | 0/30 [0.000,0.114] |
| H1T1N0R0 | S1 | 30/30 [0.886,1.000] |
| H1T1N0R0 | S2 | 30/30 [0.886,1.000] |
| H1T1N0R0 | S3 | 30/30 [0.886,1.000] |
| H1T1N0R0 | S4 | 0/30 [0.000,0.114] |
| H1T1N0R0 | S5 | 1500/1500 [0.997,1.000] |
| H1T1N0R0 | S6 | 0/30 [0.000,0.114] |
| H1T1N0R0 | S7a | 0/30 [0.000,0.114] |
| H1T1N0R0 | S7b | 0/30 [0.000,0.114] |
| H1T1N0R0 | S8 | 0/30 [0.000,0.114] |
| H1T1N0R0 | S9 | 30/30 [0.886,1.000] |
| H1T1N0R0 | S10_fast | 5/30 [0.073,0.336] |
| H1T1N0R0 | S10_late | 0/30 [0.000,0.114] |
| H0T0N1R0 | S1 | 0/30 [0.000,0.114] |
| H0T0N1R0 | S2 | 0/30 [0.000,0.114] |
| H0T0N1R0 | S3 | 30/30 [0.886,1.000] |
| H0T0N1R0 | S4 | 30/30 [0.886,1.000] |
| H0T0N1R0 | S5 | 0/1500 [0.000,0.003] |
| H0T0N1R0 | S6 | 0/30 [0.000,0.114] |
| H0T0N1R0 | S7a | 0/30 [0.000,0.114] |
| H0T0N1R0 | S7b | 30/30 [0.886,1.000] |
| H0T0N1R0 | S8 | 0/30 [0.000,0.114] |
| H0T0N1R0 | S9 | 30/30 [0.886,1.000] |
| H0T0N1R0 | S10_fast | 0/30 [0.000,0.114] |
| H0T0N1R0 | S10_late | 1/30 [0.006,0.167] |
| H1T0N1R0 | S1 | 0/30 [0.000,0.114] |
| H1T0N1R0 | S2 | 0/30 [0.000,0.114] |
| H1T0N1R0 | S3 | 30/30 [0.886,1.000] |
| H1T0N1R0 | S4 | 30/30 [0.886,1.000] |
| H1T0N1R0 | S5 | 0/1500 [0.000,0.003] |
| H1T0N1R0 | S6 | 0/30 [0.000,0.114] |
| H1T0N1R0 | S7a | 0/30 [0.000,0.114] |
| H1T0N1R0 | S7b | 0/30 [0.000,0.114] |
| H1T0N1R0 | S8 | 0/30 [0.000,0.114] |
| H1T0N1R0 | S9 | 30/30 [0.886,1.000] |
| H1T0N1R0 | S10_fast | 0/30 [0.000,0.114] |
| H1T0N1R0 | S10_late | 1/30 [0.006,0.167] |
| H0T1N1R0 | S1 | 0/30 [0.000,0.114] |
| H0T1N1R0 | S2 | 0/30 [0.000,0.114] |
| H0T1N1R0 | S3 | 30/30 [0.886,1.000] |
| H0T1N1R0 | S4 | 0/30 [0.000,0.114] |
| H0T1N1R0 | S5 | 0/1500 [0.000,0.003] |
| H0T1N1R0 | S6 | 0/30 [0.000,0.114] |
| H0T1N1R0 | S7a | 0/30 [0.000,0.114] |
| H0T1N1R0 | S7b | 30/30 [0.886,1.000] |
| H0T1N1R0 | S8 | 0/30 [0.000,0.114] |
| H0T1N1R0 | S9 | 30/30 [0.886,1.000] |
| H0T1N1R0 | S10_fast | 0/30 [0.000,0.114] |
| H0T1N1R0 | S10_late | 0/30 [0.000,0.114] |
| H1T1N1R0 | S1 | 0/30 [0.000,0.114] |
| H1T1N1R0 | S2 | 0/30 [0.000,0.114] |
| H1T1N1R0 | S3 | 30/30 [0.886,1.000] |
| H1T1N1R0 | S4 | 0/30 [0.000,0.114] |
| H1T1N1R0 | S5 | 0/1500 [0.000,0.003] |
| H1T1N1R0 | S6 | 0/30 [0.000,0.114] |
| H1T1N1R0 | S7a | 0/30 [0.000,0.114] |
| H1T1N1R0 | S7b | 0/30 [0.000,0.114] |
| H1T1N1R0 | S8 | 0/30 [0.000,0.114] |
| H1T1N1R0 | S9 | 30/30 [0.886,1.000] |
| H1T1N1R0 | S10_fast | 0/30 [0.000,0.114] |
| H1T1N1R0 | S10_late | 0/30 [0.000,0.114] |
| H0T0N0R1 | S1 | 0/30 [0.000,0.114] |
| H0T0N0R1 | S2 | 0/30 [0.000,0.114] |
| H0T0N0R1 | S3 | 0/30 [0.000,0.114] |
| H0T0N0R1 | S4 | 0/30 [0.000,0.114] |
| H0T0N0R1 | S5 | 0/1500 [0.000,0.003] |
| H0T0N0R1 | S6 | 0/30 [0.000,0.114] |
| H0T0N0R1 | S7a | 30/30 [0.886,1.000] |
| H0T0N0R1 | S7b | 0/30 [0.000,0.114] |
| H0T0N0R1 | S8 | 0/30 [0.000,0.114] |
| H0T0N0R1 | S9 | 30/30 [0.886,1.000] |
| H0T0N0R1 | S10_fast | 1/30 [0.006,0.167] |
| H0T0N0R1 | S10_late | 1/30 [0.006,0.167] |
| H1T0N0R1 | S1 | 0/30 [0.000,0.114] |
| H1T0N0R1 | S2 | 0/30 [0.000,0.114] |
| H1T0N0R1 | S3 | 0/30 [0.000,0.114] |
| H1T0N0R1 | S4 | 0/30 [0.000,0.114] |
| H1T0N0R1 | S5 | 0/1500 [0.000,0.003] |
| H1T0N0R1 | S6 | 0/30 [0.000,0.114] |
| H1T0N0R1 | S7a | 0/30 [0.000,0.114] |
| H1T0N0R1 | S7b | 0/30 [0.000,0.114] |
| H1T0N0R1 | S8 | 0/30 [0.000,0.114] |
| H1T0N0R1 | S9 | 30/30 [0.886,1.000] |
| H1T0N0R1 | S10_fast | 1/30 [0.006,0.167] |
| H1T0N0R1 | S10_late | 1/30 [0.006,0.167] |
| H0T1N0R1 | S1 | 0/30 [0.000,0.114] |
| H0T1N0R1 | S2 | 0/30 [0.000,0.114] |
| H0T1N0R1 | S3 | 0/30 [0.000,0.114] |
| H0T1N0R1 | S4 | 0/30 [0.000,0.114] |
| H0T1N0R1 | S5 | 0/1500 [0.000,0.003] |
| H0T1N0R1 | S6 | 0/30 [0.000,0.114] |
| H0T1N0R1 | S7a | 30/30 [0.886,1.000] |
| H0T1N0R1 | S7b | 0/30 [0.000,0.114] |
| H0T1N0R1 | S8 | 0/30 [0.000,0.114] |
| H0T1N0R1 | S9 | 30/30 [0.886,1.000] |
| H0T1N0R1 | S10_fast | 1/30 [0.006,0.167] |
| H0T1N0R1 | S10_late | 0/30 [0.000,0.114] |
| H1T1N0R1 | S1 | 0/30 [0.000,0.114] |
| H1T1N0R1 | S2 | 0/30 [0.000,0.114] |
| H1T1N0R1 | S3 | 0/30 [0.000,0.114] |
| H1T1N0R1 | S4 | 0/30 [0.000,0.114] |
| H1T1N0R1 | S5 | 0/1500 [0.000,0.003] |
| H1T1N0R1 | S6 | 0/30 [0.000,0.114] |
| H1T1N0R1 | S7a | 0/30 [0.000,0.114] |
| H1T1N0R1 | S7b | 0/30 [0.000,0.114] |
| H1T1N0R1 | S8 | 0/30 [0.000,0.114] |
| H1T1N0R1 | S9 | 30/30 [0.886,1.000] |
| H1T1N0R1 | S10_fast | 1/30 [0.006,0.167] |
| H1T1N0R1 | S10_late | 0/30 [0.000,0.114] |
| H0T0N1R1 | S1 | 0/30 [0.000,0.114] |
| H0T0N1R1 | S2 | 0/30 [0.000,0.114] |
| H0T0N1R1 | S3 | 0/30 [0.000,0.114] |
| H0T0N1R1 | S4 | 0/30 [0.000,0.114] |
| H0T0N1R1 | S5 | 0/1500 [0.000,0.003] |
| H0T0N1R1 | S6 | 0/30 [0.000,0.114] |
| H0T0N1R1 | S7a | 0/30 [0.000,0.114] |
| H0T0N1R1 | S7b | 0/30 [0.000,0.114] |
| H0T0N1R1 | S8 | 0/30 [0.000,0.114] |
| H0T0N1R1 | S9 | 30/30 [0.886,1.000] |
| H0T0N1R1 | S10_fast | 0/30 [0.000,0.114] |
| H0T0N1R1 | S10_late | 1/30 [0.006,0.167] |
| H1T0N1R1 | S1 | 0/30 [0.000,0.114] |
| H1T0N1R1 | S2 | 0/30 [0.000,0.114] |
| H1T0N1R1 | S3 | 0/30 [0.000,0.114] |
| H1T0N1R1 | S4 | 0/30 [0.000,0.114] |
| H1T0N1R1 | S5 | 0/1500 [0.000,0.003] |
| H1T0N1R1 | S6 | 0/30 [0.000,0.114] |
| H1T0N1R1 | S7a | 0/30 [0.000,0.114] |
| H1T0N1R1 | S7b | 0/30 [0.000,0.114] |
| H1T0N1R1 | S8 | 0/30 [0.000,0.114] |
| H1T0N1R1 | S9 | 30/30 [0.886,1.000] |
| H1T0N1R1 | S10_fast | 0/30 [0.000,0.114] |
| H1T0N1R1 | S10_late | 1/30 [0.006,0.167] |
| H0T1N1R1 | S1 | 0/30 [0.000,0.114] |
| H0T1N1R1 | S2 | 0/30 [0.000,0.114] |
| H0T1N1R1 | S3 | 0/30 [0.000,0.114] |
| H0T1N1R1 | S4 | 0/30 [0.000,0.114] |
| H0T1N1R1 | S5 | 0/1500 [0.000,0.003] |
| H0T1N1R1 | S6 | 0/30 [0.000,0.114] |
| H0T1N1R1 | S7a | 0/30 [0.000,0.114] |
| H0T1N1R1 | S7b | 0/30 [0.000,0.114] |
| H0T1N1R1 | S8 | 0/30 [0.000,0.114] |
| H0T1N1R1 | S9 | 30/30 [0.886,1.000] |
| H0T1N1R1 | S10_fast | 0/30 [0.000,0.114] |
| H0T1N1R1 | S10_late | 0/30 [0.000,0.114] |
| H1T1N1R1 | S1 | 0/30 [0.000,0.114] |
| H1T1N1R1 | S2 | 0/30 [0.000,0.114] |
| H1T1N1R1 | S3 | 0/30 [0.000,0.114] |
| H1T1N1R1 | S4 | 0/30 [0.000,0.114] |
| H1T1N1R1 | S5 | 0/1500 [0.000,0.003] |
| H1T1N1R1 | S6 | 0/30 [0.000,0.114] |
| H1T1N1R1 | S7a | 0/30 [0.000,0.114] |
| H1T1N1R1 | S7b | 0/30 [0.000,0.114] |
| H1T1N1R1 | S8 | 0/30 [0.000,0.114] |
| H1T1N1R1 | S9 | 30/30 [0.886,1.000] |
| H1T1N1R1 | S10_fast | 0/30 [0.000,0.114] |
| H1T1N1R1 | S10_late | 0/30 [0.000,0.114] |
| H1T1N1R1-DEFAULT | S2_default_window_60s | 0/30 [0.000,0.114] |
| H1T1N1R1-DEFAULT | S4_default_window_301s | 0/30 [0.000,0.114] |
| H0T0N0R0 | S11 | 30/30 [0.886,1.000] |
| H1T0N0R0 | S11 | 0/30 [0.000,0.114] |
| H0T1N0R0 | S11 | 30/30 [0.886,1.000] |
| H1T1N0R0 | S11 | 0/30 [0.000,0.114] |
| H0T0N1R0 | S11 | 30/30 [0.886,1.000] |
| H1T0N1R0 | S11 | 0/30 [0.000,0.114] |
| H0T1N1R0 | S11 | 30/30 [0.886,1.000] |
| H1T1N1R0 | S11 | 0/30 [0.000,0.114] |
| H0T0N0R1 | S11 | 30/30 [0.886,1.000] |
| H1T0N0R1 | S11 | 0/30 [0.000,0.114] |
| H0T1N0R1 | S11 | 30/30 [0.886,1.000] |
| H1T1N0R1 | S11 | 0/30 [0.000,0.114] |
| H0T0N1R1 | S11 | 30/30 [0.886,1.000] |
| H1T0N1R1 | S11 | 0/30 [0.000,0.114] |
| H0T1N1R1 | S11 | 30/30 [0.886,1.000] |
| H1T1N1R1 | S11 | 0/30 [0.000,0.114] |

Coverage LaTeX: `experiments/results/e1-v2/coverage-matrix.tex`; heat map: `experiments/results/e1-v2/attack-success-heatmap.png` (PDF/SVG siblings). Provenance for original E1 and S11 summaries: `experiments/results/e1-v2/coverage-provenance.txt`.

S11 provenance correction: the earliest attempt derived its token from an in-process login response and all 480 attacks returned SESSION_INVALID; it is superseded. The cited rerun obtains the bearer value from a forwarded request header in the proxy capture, with no session-key use; its newest run directory is 2026-10-18T18-46-52-147Z.

### S10 original delayed-execution rows

C0: each 30-attempt S10 replay batch replays one captured FAILED request; it has one distinct request ID and one nonce. The harness sets balance to 1, sends a 100-unit withdrawal, then funds with 500, making the balance 501. Five successful 100-unit withdrawals leave 1. Five ledger success rows for one request ID count as four extra duplicate rows (`5 - 1 = 4`). This is the saved E1 result, not a new run.

| Config | Scenario | Debits/30 | Delayed rows | Delayed amount | Duplicate extra rows |
|---|---|---|---|---|---|
| H0T0N0R0 | S10_fast | 5/30 | 5 | 500 | 4 |
| H0T0N0R0 | S10_late | 5/30 | 5 | 500 | 4 |
| H1T0N0R0 | S10_fast | 5/30 | 5 | 500 | 4 |
| H1T0N0R0 | S10_late | 5/30 | 5 | 500 | 4 |
| H0T1N0R0 | S10_fast | 5/30 | 5 | 500 | 4 |
| H0T1N0R0 | S10_late | 0/30 | 0 | 0 | 0 |
| H1T1N0R0 | S10_fast | 5/30 | 5 | 500 | 4 |
| H1T1N0R0 | S10_late | 0/30 | 0 | 0 | 0 |
| H0T0N1R0 | S10_fast | 0/30 | 0 | 0 | 0 |
| H0T0N1R0 | S10_late | 1/30 | 1 | 100 | 0 |
| H1T0N1R0 | S10_fast | 0/30 | 0 | 0 | 0 |
| H1T0N1R0 | S10_late | 1/30 | 1 | 100 | 0 |
| H0T1N1R0 | S10_fast | 0/30 | 0 | 0 | 0 |
| H0T1N1R0 | S10_late | 0/30 | 0 | 0 | 0 |
| H1T1N1R0 | S10_fast | 0/30 | 0 | 0 | 0 |
| H1T1N1R0 | S10_late | 0/30 | 0 | 0 | 0 |
| H0T0N0R1 | S10_fast | 1/30 | 1 | 100 | 0 |
| H0T0N0R1 | S10_late | 1/30 | 1 | 100 | 0 |
| H1T0N0R1 | S10_fast | 1/30 | 1 | 100 | 0 |
| H1T0N0R1 | S10_late | 1/30 | 1 | 100 | 0 |
| H0T1N0R1 | S10_fast | 1/30 | 1 | 100 | 0 |
| H0T1N0R1 | S10_late | 0/30 | 0 | 0 | 0 |
| H1T1N0R1 | S10_fast | 1/30 | 1 | 100 | 0 |
| H1T1N0R1 | S10_late | 0/30 | 0 | 0 | 0 |
| H0T0N1R1 | S10_fast | 0/30 | 0 | 0 | 0 |
| H0T0N1R1 | S10_late | 1/30 | 1 | 100 | 0 |
| H1T0N1R1 | S10_fast | 0/30 | 0 | 0 | 0 |
| H1T0N1R1 | S10_late | 1/30 | 1 | 100 | 0 |
| H0T1N1R1 | S10_fast | 0/30 | 0 | 0 | 0 |
| H0T1N1R1 | S10_late | 0/30 | 0 | 0 | 0 |
| H1T1N1R1 | S10_fast | 0/30 | 0 | 0 | 0 |
| H1T1N1R1 | S10_late | 0/30 | 0 | 0 | 0 |

## C2 idempotency policy trade-off

Fast policy sweep runtime: 44.324s. Late sweep runtime: 139.527s. Resubmission runtime: 7.513s. Combined table: `experiments/results/s10-policy-tradeoff.csv` SHA-256 `110e52a6d6214f5ff2cd0e82f3c774997019250ee2f5ee7d93d51cf30f1a370d`. Commands: scenario-filtered E1 runner with `E1_POLICY_SWEEP=true`; `node experiments/e1/run-policy-resubmit.js`.

| Policy | Config | Case | Variant | Successes / attempts [Wilson 95%] | Reasons |
|---|---|---|---|---|---|
| success_only | H0T0N0R1 | S10_fast | one_failed_payload_replayed_30_times | 1/30 [0.006,0.167] | {"ACCEPTED":1,"ALREADY_PROCESSED":29} |
| success_only | H1T0N0R1 | S10_fast | one_failed_payload_replayed_30_times | 1/30 [0.006,0.167] | {"ACCEPTED":1,"ALREADY_PROCESSED":29} |
| success_only | H0T1N0R1 | S10_fast | one_failed_payload_replayed_30_times | 1/30 [0.006,0.167] | {"ACCEPTED":1,"ALREADY_PROCESSED":29} |
| success_only | H1T1N0R1 | S10_fast | one_failed_payload_replayed_30_times | 1/30 [0.006,0.167] | {"ACCEPTED":1,"ALREADY_PROCESSED":29} |
| success_only | H0T0N1R1 | S10_fast | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"NONCE_FAIL":30} |
| success_only | H1T0N1R1 | S10_fast | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"NONCE_FAIL":30} |
| success_only | H0T1N1R1 | S10_fast | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"NONCE_FAIL":30} |
| success_only | H1T1N1R1 | S10_fast | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"NONCE_FAIL":30} |
| any_outcome | H0T0N0R1 | S10_fast | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"ALREADY_PROCESSED":30} |
| any_outcome | H1T0N0R1 | S10_fast | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"ALREADY_PROCESSED":30} |
| any_outcome | H0T1N0R1 | S10_fast | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"ALREADY_PROCESSED":30} |
| any_outcome | H1T1N0R1 | S10_fast | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"ALREADY_PROCESSED":30} |
| any_outcome | H0T0N1R1 | S10_fast | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"NONCE_FAIL":30} |
| any_outcome | H1T0N1R1 | S10_fast | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"NONCE_FAIL":30} |
| any_outcome | H0T1N1R1 | S10_fast | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"NONCE_FAIL":30} |
| any_outcome | H1T1N1R1 | S10_fast | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"NONCE_FAIL":30} |
| success_only | H0T0N0R1 | S10_late | one_failed_payload_replayed_30_times | 1/30 [0.006,0.167] | {"ACCEPTED":1,"ALREADY_PROCESSED":29} |
| success_only | H1T0N0R1 | S10_late | one_failed_payload_replayed_30_times | 1/30 [0.006,0.167] | {"ACCEPTED":1,"ALREADY_PROCESSED":29} |
| success_only | H0T1N0R1 | S10_late | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"TIMESTAMP_FAIL":30} |
| success_only | H1T1N0R1 | S10_late | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"TIMESTAMP_FAIL":30} |
| success_only | H0T0N1R1 | S10_late | one_failed_payload_replayed_30_times | 1/30 [0.006,0.167] | {"ACCEPTED":1,"NONCE_FAIL":29} |
| success_only | H1T0N1R1 | S10_late | one_failed_payload_replayed_30_times | 1/30 [0.006,0.167] | {"ACCEPTED":1,"NONCE_FAIL":29} |
| success_only | H0T1N1R1 | S10_late | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"TIMESTAMP_FAIL":30} |
| success_only | H1T1N1R1 | S10_late | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"TIMESTAMP_FAIL":30} |
| any_outcome | H0T0N0R1 | S10_late | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"ALREADY_PROCESSED":30} |
| any_outcome | H1T0N0R1 | S10_late | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"ALREADY_PROCESSED":30} |
| any_outcome | H0T1N0R1 | S10_late | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"TIMESTAMP_FAIL":30} |
| any_outcome | H1T1N0R1 | S10_late | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"TIMESTAMP_FAIL":30} |
| any_outcome | H0T0N1R1 | S10_late | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"ALREADY_PROCESSED":1,"NONCE_FAIL":29} |
| any_outcome | H1T0N1R1 | S10_late | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"ALREADY_PROCESSED":1,"NONCE_FAIL":29} |
| any_outcome | H0T1N1R1 | S10_late | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"TIMESTAMP_FAIL":30} |
| any_outcome | H1T1N1R1 | S10_late | one_failed_payload_replayed_30_times | 0/30 [0.000,0.114] | {"TIMESTAMP_FAIL":30} |
| success_only | H1T1N1R1 | after_funding | same_request_id_fresh_nonce | 30/30 [0.886,1.000] | {"ACCEPTED":30} |
| success_only | H1T1N1R1 | after_funding | new_request_id_fresh_nonce | 30/30 [0.886,1.000] | {"ACCEPTED":30} |
| any_outcome | H1T1N1R1 | after_funding | same_request_id_fresh_nonce | 0/30 [0.000,0.114] | {"ALREADY_PROCESSED":30} |
| any_outcome | H1T1N1R1 | after_funding | new_request_id_fresh_nonce | 30/30 [0.886,1.000] | {"ACCEPTED":30} |

## E2 v2 cost and C5 server layer table

E2 runtime: 2268.197s. Load summary `experiments/results/e2-v2/load-repeat-summary.csv` SHA-256 `daf381305a1b5ec7f917401888ac46a4a49d3838d929d8e71286c22dd6476a90`; C5 table `experiments/results/e2-v2/per-layer-coverage-c5.csv` SHA-256 `5ac02a97e16f98e3da58ecf1d1cb096288216f751ef30b319d8e1f4734d053b9`; rejection raw `experiments/results/e2-v2/rejection-cost.csv` SHA-256 `85a684770b4a3206f0661d9d7ed6dc716febc457f95b2c70a9beb657adc12b7d`. Command: `node experiments/e2/run.js`; C5 recomputation: `node experiments/audit/make-e2-layer-table.js`. E2’s 500 warm-up requests are discarded. CIs are t-based across repeat-level medians.

| Stack | Handler p50 median ns | t-CI low..high ns | Client p50 median ms | t-CI low..high ms | Repeats |
|---|---|---|---|---|---|
| nonce_sqlite | 11223050 | 8201635.797659843..11559774.202340156 | 11.844574999999999 | 8.802476069875791..12.18784393012421 | 10 |
| all_four | 6692850 | 4686554.276630906..6655975.723369094 | 7.3106 | 5.227818211956587..7.277611788043414 | 10 |
| hmac | 6128575 | 4410660.360724791..6264599.639275209 | 6.7532250000000005 | 4.975799615833209..6.893060384166793 | 10 |
| hmac_ts_nonce | 6316175 | 5524389.917407328..6642300.082592672 | 6.939775 | 6.134805958694753..7.269074041305244 | 10 |
| hmac_ts | 6126975 | 4832520.096739766..6432759.903260234 | 6.750225 | 5.427456909581718..7.057853090418282 | 10 |
| nonce_redis | 6668225 | 5416222.913192404..6960657.086807596 | 7.296525 | 5.998410370767474..7.584489629232526 | 10 |
| none | 6070725 | 4277392.408264458..6059077.591735542 | 6.690275 | 4.888566528762025..6.678363471237976 | 10 |
| nonce_memory | 6448950 | 4588347.900511024..6463372.099488976 | 7.046125 | 5.160376133092691..7.071643866907309 | 10 |

### Per-layer p50 microseconds and four-layer share

CI is the t-based 95% interval calculated over repeat-level values; for four-layer share, point and interval are percentages. The median point can fall outside a t interval around the mean because the repeat distribution is skewed.

| Stack | Layer | Median p50 µs / share % | t-CI low..high |
|---|---|---|---|
| all_four | hmac | 37.25 | 35.33536518962621..38.39463481037379 |
| all_four | timestamp | 9.85 | 9.168745783887546..11.101254216112453 |
| all_four | nonce | 188.975 | 181.79100643065928..198.07899356934072 |
| all_four | request_id | 239.825 | 227.80167082791985..249.06832917208015 |
| all_four | handler_total | 6692.85 | 4686.48585937345..6656.044140626551 |
| nonce_redis | hmac | 37.1 | 36.254040856440724..38.605959143559275 |
| nonce_redis | timestamp | 9.7 | 9.212687571323235..11.687312428676766 |
| nonce_redis | nonce | 190.05 | 185.63266162101093..197.0673383789891 |
| nonce_redis | request_id | 240.225 | 233.99428787401078..248.50571212598922 |
| nonce_redis | handler_total | 6668.225 | 5416.1692598970885..6960.710740102912 |
| nonce_sqlite | hmac | 37.225 | 35.640112797120594..38.37988720287941 |
| nonce_sqlite | timestamp | 9.6 | 9.135042316376069..10.804957683623932 |
| nonce_sqlite | nonce | 4516.675 | 3050.9853087177553..4668.854691282244 |
| nonce_sqlite | request_id | 331.825 | 307.56073328812636..344.67926671187365 |
| nonce_sqlite | handler_total | 11223.05 | 8201.519136688068..11559.890863311932 |
| nonce_memory | hmac | 37.05 | 36.044383054777775..40.04561694522222 |
| nonce_memory | timestamp | 10.45 | 9.41708126055364..12.022918739446359 |
| nonce_memory | nonce | 16.45 | 16.034590794041733..17.745409205958264 |
| nonce_memory | request_id | 235.7 | 228.72932624751002..247.09067375249 |
| nonce_memory | handler_total | 6448.95 | 4588.282762592691..6463.437237407309 |
| all_four | four_layer_share | 7.1997485448155905 | 7.207403645941274..10.56193586693979 |
| nonce_redis | four_layer_share | 7.17083526782514 | 6.630456279718685..9.52901581919414 |
| nonce_sqlite | four_layer_share | 43.45860802891771 | 40.99248089192906..43.86077560297471 |
| nonce_memory | four_layer_share | 4.668335113694007 | 4.654270736893378..7.0297574517402595 |

### Attack rejection cost raw cells


| Order | Flood | Repeat | Handler p50/p95/p99 ns | Max ns |
|---|---|---|---|---|
| default | duplicate_request_id | 3 | 1224300/1826100/2333000 | 9180400 |
| request_id_before_nonce | duplicate_request_id | 1 | 1058800/1600100/1977600 | 12190600 |
| request_id_before_nonce | duplicate_nonce | 1 | 1265900/2448700/4118200 | 18509400 |
| timestamp_first | duplicate_request_id | 1 | 1281400/1989900/2527100 | 14387300 |
| request_id_before_nonce | bad_signature | 1 | 729100/1105720/1493764.9999999984 | 16750600 |
| default | stale_timestamp | 1 | 755450/1123684.9999999995/1527102 | 16037000 |
| default | duplicate_nonce | 1 | 938200/1415700/1935300 | 7242300 |
| timestamp_first | duplicate_request_id | 3 | 1228100/1831800/2274100 | 14886000 |
| request_id_before_nonce | duplicate_request_id | 2 | 1088000/1739300/2370100 | 9703000 |
| default | duplicate_request_id | 2 | 1229300/1767500/2290100 | 15759800 |
| timestamp_first | duplicate_request_id | 2 | 1233700/1878600/2428000 | 14470800 |
| timestamp_first | bad_signature | 1 | 737700/1145429.9999999998/1474754.9999999963 | 7910100 |
| request_id_before_nonce | stale_timestamp | 1 | 724500/1079584.9999999995/1371304 | 4685200 |
| timestamp_first | duplicate_nonce | 1 | 1256900/2086500/2800700 | 25556200 |
| timestamp_first | stale_timestamp | 1 | 784300/1413289.999999998/2276061.9999999986 | 17643600 |
| default | bad_signature | 1 | 733000/1072310/1365811.9999999998 | 5712700 |
| request_id_before_nonce | duplicate_request_id | 3 | 1172500/2234500/2998400 | 22227300 |
| default | duplicate_request_id | 1 | 1245900/1874700/2383900 | 13225200 |

## E3 false rejection (75 cells)

Runtime: 933.547s. Raw per-request CSV: `experiments/results/e3-v2/requests.csv`; summary `experiments/results/e3-v2/summary.csv` SHA-256 `b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`. Command: `node experiments/e3/run.js`. Each cell has 2,000 requests. Offset and delay distributions are assumptions, not measurements of a real network. Offline counts are recomputed from the recorded server timestamp check time.

| Profile | PAST/FUTURE s | Rejects / N [Wilson 95%] | Offline rejects | Mismatch |
|---|---|---|---|---|
| P1 | 5/0 | 629/2000 [0.295,0.335] | 629 | 0 |
| P1 | 5/2 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 5/5 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 5/30 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 5/60 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 30/0 | 618/2000 [0.289,0.330] | 618 | 0 |
| P1 | 30/2 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 30/5 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 30/30 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 30/60 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 60/0 | 649/2000 [0.304,0.345] | 649 | 0 |
| P1 | 60/2 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 60/5 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 60/30 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 60/60 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 120/0 | 653/2000 [0.306,0.347] | 653 | 0 |
| P1 | 120/2 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 120/5 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 120/30 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 120/60 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 300/0 | 652/2000 [0.306,0.347] | 652 | 0 |
| P1 | 300/2 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 300/5 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 300/30 | 0/2000 [0.000,0.002] | 0 | 0 |
| P1 | 300/60 | 0/2000 [0.000,0.002] | 0 | 0 |
| P2 | 5/0 | 984/2000 [0.470,0.514] | 984 | 0 |
| P2 | 5/2 | 526/2000 [0.244,0.283] | 526 | 0 |
| P2 | 5/5 | 272/2000 [0.122,0.152] | 272 | 0 |
| P2 | 5/30 | 177/2000 [0.077,0.102] | 177 | 0 |
| P2 | 5/60 | 192/2000 [0.084,0.110] | 192 | 0 |
| P2 | 30/0 | 805/2000 [0.381,0.424] | 805 | 0 |
| P2 | 30/2 | 361/2000 [0.164,0.198] | 361 | 0 |
| P2 | 30/5 | 53/2000 [0.020,0.034] | 53 | 0 |
| P2 | 30/30 | 0/2000 [0.000,0.002] | 0 | 0 |
| P2 | 30/60 | 0/2000 [0.000,0.002] | 0 | 0 |
| P2 | 60/0 | 803/2000 [0.380,0.423] | 803 | 0 |
| P2 | 60/2 | 330/2000 [0.149,0.182] | 330 | 0 |
| P2 | 60/5 | 60/2000 [0.023,0.038] | 60 | 0 |
| P2 | 60/30 | 0/2000 [0.000,0.002] | 0 | 0 |
| P2 | 60/60 | 0/2000 [0.000,0.002] | 0 | 0 |
| P2 | 120/0 | 792/2000 [0.375,0.418] | 792 | 0 |
| P2 | 120/2 | 357/2000 [0.162,0.196] | 357 | 0 |
| P2 | 120/5 | 59/2000 [0.023,0.038] | 59 | 0 |
| P2 | 120/30 | 0/2000 [0.000,0.002] | 0 | 0 |
| P2 | 120/60 | 0/2000 [0.000,0.002] | 0 | 0 |
| P2 | 300/0 | 776/2000 [0.367,0.410] | 776 | 0 |
| P2 | 300/2 | 387/2000 [0.177,0.211] | 387 | 0 |
| P2 | 300/5 | 63/2000 [0.025,0.040] | 63 | 0 |
| P2 | 300/30 | 0/2000 [0.000,0.002] | 0 | 0 |
| P2 | 300/60 | 0/2000 [0.000,0.002] | 0 | 0 |
| P3 | 5/0 | 1869/2000 [0.923,0.945] | 1869 | 0 |
| P3 | 5/2 | 1800/2000 [0.886,0.912] | 1800 | 0 |
| P3 | 5/5 | 1766/2000 [0.868,0.896] | 1766 | 0 |
| P3 | 5/30 | 1240/2000 [0.599,0.641] | 1240 | 0 |
| P3 | 5/60 | 999/2000 [0.478,0.521] | 999 | 0 |
| P3 | 30/0 | 1284/2000 [0.621,0.663] | 1284 | 0 |
| P3 | 30/2 | 1237/2000 [0.597,0.640] | 1237 | 0 |
| P3 | 30/5 | 1186/2000 [0.571,0.614] | 1186 | 0 |
| P3 | 30/30 | 668/2000 [0.314,0.355] | 668 | 0 |
| P3 | 30/60 | 410/2000 [0.188,0.223] | 410 | 0 |
| P3 | 60/0 | 969/2000 [0.463,0.506] | 969 | 0 |
| P3 | 60/2 | 908/2000 [0.432,0.476] | 908 | 0 |
| P3 | 60/5 | 806/2000 [0.382,0.425] | 806 | 0 |
| P3 | 60/30 | 332/2000 [0.150,0.183] | 332 | 0 |
| P3 | 60/60 | 114/2000 [0.048,0.068] | 114 | 0 |
| P3 | 120/0 | 920/2000 [0.438,0.482] | 920 | 0 |
| P3 | 120/2 | 843/2000 [0.400,0.443] | 843 | 0 |
| P3 | 120/5 | 770/2000 [0.364,0.407] | 770 | 0 |
| P3 | 120/30 | 267/2000 [0.119,0.149] | 267 | 0 |
| P3 | 120/60 | 47/2000 [0.018,0.031] | 47 | 0 |
| P3 | 300/0 | 880/2000 [0.418,0.462] | 880 | 0 |
| P3 | 300/2 | 846/2000 [0.402,0.445] | 846 | 0 |
| P3 | 300/5 | 778/2000 [0.368,0.411] | 778 | 0 |
| P3 | 300/30 | 258/2000 [0.115,0.144] | 258 | 0 |
| P3 | 300/60 | 19/2000 [0.006,0.015] | 19 | 0 |

## E4a TTL/window grid and rule check

Original E4 runtime: 401.495s. Raw cells `experiments/results/e4-v2/e4a-requests.csv`; summary `experiments/results/e4-v2/e4a-summary.csv` SHA-256 `fa49f93c7f42408bf54deaa079b9f9ff84c1c21b396dcfbebbe855d25f19abf3`; independent rule check `experiments/results/e4-v2/e4a-rule-check.json` SHA-256 `0104e2ba4ac9fc7ab34d90e9343c6e2426a48976e5f29ce30011525dda07c233`. Rule-check command: `node experiments/audit/check-e4a-rule.js`.

| Config / TTL / future offset | Accepted / 270 | Blocked / 270 |
|---|---|---|
| H1T1N1R0-TTL4\|4\|0 | 30/270 | 240 |
| H1T1N1R0-TTL4\|4\|1 | 60/270 | 210 |
| H1T1N1R0-TTL4\|4\|2 | 90/270 | 180 |
| H1T1N1R0-TTL6\|6\|0 | 0/270 | 270 |
| H1T1N1R0-TTL6\|6\|1 | 30/270 | 240 |
| H1T1N1R0-TTL6\|6\|2 | 60/270 | 210 |
| H1T1N1R0-TTL8\|8\|0 | 0/270 | 270 |
| H1T1N1R0-TTL8\|8\|1 | 0/270 | 270 |
| H1T1N1R0-TTL8\|8\|2 | 0/270 | 270 |
| H1T1N1R0-TTL10\|10\|0 | 0/270 | 270 |
| H1T1N1R0-TTL10\|10\|1 | 0/270 | 270 |
| H1T1N1R0-TTL10\|10\|2 | 0/270 | 270 |
| H1T1N1R0-TTL12\|12\|0 | 0/270 | 270 |
| H1T1N1R0-TTL12\|12\|1 | 0/270 | 270 |
| H1T1N1R0-TTL12\|12\|2 | 0/270 | 270 |
| H1T1N1R1-TTL4\|4\|0 | 0/270 | 270 |
| H1T1N1R1-TTL4\|4\|1 | 0/270 | 270 |
| H1T1N1R1-TTL4\|4\|2 | 0/270 | 270 |
| H1T1N1R1-TTL6\|6\|0 | 0/270 | 270 |
| H1T1N1R1-TTL6\|6\|1 | 0/270 | 270 |
| H1T1N1R1-TTL6\|6\|2 | 0/270 | 270 |
| H1T1N1R1-TTL8\|8\|0 | 0/270 | 270 |
| H1T1N1R1-TTL8\|8\|1 | 0/270 | 270 |
| H1T1N1R1-TTL8\|8\|2 | 0/270 | 270 |
| H1T1N1R1-TTL10\|10\|0 | 0/270 | 270 |
| H1T1N1R1-TTL10\|10\|1 | 0/270 | 270 |
| H1T1N1R1-TTL10\|10\|2 | 0/270 | 270 |
| H1T1N1R1-TTL12\|12\|0 | 0/270 | 270 |
| H1T1N1R1-TTL12\|12\|1 | 0/270 | 270 |
| H1T1N1R1-TTL12\|12\|2 | 0/270 | 270 |

Among request-ID-off cells: 135 tested; rule violations: 0. Tested rule: accepted iff TTL <= delay < PAST(6s) + future_offset. The observed transitions are in the JSON source; TTL4 uses sampled delays 3 and 5, so the exact TTL=4 boundary itself was not sampled.

## E4b nonce-store failure

Runtime: 5.343s. Raw output `experiments/results/e4-final-c3/e4b.csv` SHA-256 `4c7ed15dd81307d9cd1ed721bdb0c3739f0c894b79c2d40899559db1017524f7`; run 30 replay trials per case. Command: `$env:E4B_ONLY="true"; node experiments/e4/run.js`.

| Case | Legit accepted/30 | Replay accepted/30 [Wilson 95%] |
|---|---|---|
| fault-fail-open-requestid-0 | 30/30 | 30/30 [0.886,1.000] |
| fault-fail-open-requestid-1 | 30/30 | 0/30 [0.000,0.114] |
| fault-fail-closed-requestid-0 | 0/30 | 0/30 [0.000,0.114] |
| fault-fail-closed-requestid-1 | 0/30 | 0/30 [0.000,0.114] |

## E4c lost-response retries

Runtime: 27.511s. Raw output `experiments/results/e4-final-c3-rerun/e4c.csv` SHA-256 `77410d793945fe154759bd5f6fcc141b6f3df734850bd2b096df87f08b0b13d2`; 200 transactions per cell, common random number pattern by p. Command: `$env:E4C_ONLY="true"; node experiments/e4/run.js`. The first C3 rerun reused populated DB directories and is superseded; this cited run used a fresh output directory.

| Case | Losses | Debits / exactly-once IDs | Client failure after debit | ALREADY_PROCESSED inferable | Other reason | Oracle dup / unauth / delayed |
|---|---|---|---|---|---|---|
| loss-p0-default-same-signed | 0 | 200/200 | 0 | 0 | {} | 0/0/0 |
| loss-p0-default-fresh-nonce-same-request-id | 0 | 200/200 | 0 | 0 | {} | 0/0/0 |
| loss-p0-request_id_before_nonce-same-signed | 0 | 200/200 | 0 | 0 | {} | 0/0/0 |
| loss-p0-request_id_before_nonce-fresh-nonce-same-request-id | 0 | 200/200 | 0 | 0 | {} | 0/0/0 |
| loss-p0.05-default-same-signed | 3 | 200/200 | 3 | 0 | {"NONCE_FAIL":3} | 0/0/0 |
| loss-p0.05-default-fresh-nonce-same-request-id | 3 | 200/200 | 3 | 3 | {"ALREADY_PROCESSED":3} | 0/0/0 |
| loss-p0.05-request_id_before_nonce-same-signed | 3 | 200/200 | 3 | 3 | {"ALREADY_PROCESSED":3} | 0/0/0 |
| loss-p0.05-request_id_before_nonce-fresh-nonce-same-request-id | 3 | 200/200 | 3 | 3 | {"ALREADY_PROCESSED":3} | 0/0/0 |
| loss-p0.2-default-same-signed | 44 | 200/200 | 44 | 0 | {"NONCE_FAIL":44} | 0/0/0 |
| loss-p0.2-default-fresh-nonce-same-request-id | 44 | 200/200 | 44 | 44 | {"ALREADY_PROCESSED":44} | 0/0/0 |
| loss-p0.2-request_id_before_nonce-same-signed | 44 | 200/200 | 44 | 44 | {"ALREADY_PROCESSED":44} | 0/0/0 |
| loss-p0.2-request_id_before_nonce-fresh-nonce-same-request-id | 44 | 200/200 | 44 | 44 | {"ALREADY_PROCESSED":44} | 0/0/0 |

| Insufficient retry | Initial reason | Retry mode | Outcome |
|---|---|---|---|
| insufficient-same-nonce | INSUFFICIENT_BALANCE | same-nonce | 409 NONCE_FAIL |
| insufficient-fresh-nonce | INSUFFICIENT_BALANCE | fresh-nonce | 200 ACCEPTED |

## E4d nonce-store size extrapolation

Raw derived table `experiments/results/e4-v2/e4d-derived.csv` SHA-256 `eff60fbb5f3beed1a33955c7365fed38b59974ff384dd7f1a6bbc422d81ec656`. These are linear extrapolations from the measured clean ~181 B/key slopes, not measured deployments.

| Rate/s | TTL s | Derived keys | Mean B/key | Derived MiB |
|---|---|---|---|---|
| 10 | 30 | 300 | 180.96976 | 0.05177586364746094 |
| 10 | 300 | 3000 | 180.96976 | 0.5177586364746094 |
| 10 | 3600 | 36000 | 180.96976 | 6.213103637695313 |
| 100 | 30 | 3000 | 180.96976 | 0.5177586364746094 |
| 100 | 300 | 30000 | 180.96976 | 5.177586364746094 |
| 100 | 3600 | 360000 | 180.96976 | 62.131036376953126 |
| 1000 | 30 | 30000 | 180.96976 | 5.177586364746094 |
| 1000 | 300 | 300000 | 180.96976 | 51.77586364746094 |
| 1000 | 3600 | 3600000 | 180.96976 | 621.3103637695312 |

## Race, memory and timestamp boundary headlines

Race source `experiments/results/phase4-source-fixes/race-summary-1000-batches.json` SHA-256 `cc65875aa7dfe2cb1538422fbc03d60ee5861145ea0c1d928319bdd7f552cd1c`; identical payload: 1,000 batches of 50, distribution {"1":1000}. Shared-request-ID secret-holder case: 1 accepted and balance delta 1.

| Memory run | Baseline bytes | 100k used bytes | Measured B/key | Duration / TTL |
|---|---|---|---|---|
| accepted | 1083904 | 19180768 | 180.96864 | 843.2111516/86400 |
| requestid | 1087544 | 19184632 | 180.97088 | 177.7131442/86400 |

Boundary CSV: experiments/results/corrections/timestamp-boundaries-30-each.csv; SHA-256 c5385ff3a98c76e504f83e74c3e723f099dd539f93d6478e83cf4ddf6e5762d2; six boundary/age cases, 30 repetitions each.

## Independent audit

Audit command: node experiments/audit/verify-results.js; report: experiments/results/audit/audit-report.md; JSON: experiments/results/audit/audit-report.json. The audit independently parsed raw CSVs, recomputed Wilson and t intervals, queried SQLite for S11/E4c/policy cases, and reported zero mismatches at generation time.

## Figures with raw data provenance

The artifact hash is for the rendered file; the source hash is for its raw CSV. Rendering runtime is from `experiments/results/final-round/render-v2-run.json`.

| Figure | Artifact | Artifact SHA-256 | Raw CSV | Raw SHA-256 | Command | Runtime s |
|---|---|---|---|---|---|---|
| E1 coverage heat map png | experiments/results/e1-v2/attack-success-heatmap.png | ffe57f3662c457568eed9d9d26c364e509d9df0ef9cf938d98f0e522ddc782fb | experiments/results/e1-v2/summary.csv + experiments/results/e1-v2-s11/summary.csv | d24bdccf210d02995691ecc4e3b0a37ff451e0a11ca0ad14613d2c939076835f + 05b6281d9f85a85349672e831ce6acb3cc98974e45814bdd17d2835127a52309 | python experiments/render-v2-results.py | 9.5961856 |
| E2 server-handler cost png | experiments/results/e2-v2/server-handler-cost.png | 3f097530bd2f25e28e5b0c9924a05ff34e83a5466b888dc4ec865f83010598a1 | experiments/results/e2-v2/load-repeat-summary.csv | daf381305a1b5ec7f917401888ac46a4a49d3838d929d8e71286c22dd6476a90 | python experiments/render-v2-results.py | 9.5961856 |
| E3 P1 false-rejection plot png | experiments/results/e3-v2/p1-false-rejection-vs-future.png | 254d52aa5d0b35d1bad469703f6d6be8ff2cc9c075ec7d7abb58b239fbe5785c | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
| E3 P2 false-rejection plot png | experiments/results/e3-v2/p2-false-rejection-vs-future.png | fb6b435d6935002837b545ad815b7488eba1b6e4dcd6324d6cedfbeb11c1a4fd | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
| E3 P3 false-rejection plot png | experiments/results/e3-v2/p3-false-rejection-vs-future.png | b11b93fcd4e6a40403ec3b8f30f541958bc670aaa4c8ef5c6e301e426703485f | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
| E3 false-rejection vs PAST png | experiments/results/e3-v2/false-rejection-vs-past-and-replay-window.png | 06677ac0fb93a96641eba5df1e6b0ce8131ef946ee8f8211f4b0763e6cd5606f | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
| E1 coverage heat map pdf | experiments/results/e1-v2/attack-success-heatmap.pdf | 60e785e639faebc252c4322154f3feeedccfb10ccdd7c852d430b8c5bb49443e | experiments/results/e1-v2/summary.csv + experiments/results/e1-v2-s11/summary.csv | d24bdccf210d02995691ecc4e3b0a37ff451e0a11ca0ad14613d2c939076835f + 05b6281d9f85a85349672e831ce6acb3cc98974e45814bdd17d2835127a52309 | python experiments/render-v2-results.py | 9.5961856 |
| E2 server-handler cost pdf | experiments/results/e2-v2/server-handler-cost.pdf | 89ed53af8151a81f117048402d3c98b5dc0a6e92b3205405a0579c576f729bf7 | experiments/results/e2-v2/load-repeat-summary.csv | daf381305a1b5ec7f917401888ac46a4a49d3838d929d8e71286c22dd6476a90 | python experiments/render-v2-results.py | 9.5961856 |
| E3 P1 false-rejection plot pdf | experiments/results/e3-v2/p1-false-rejection-vs-future.pdf | 9b02b5e7a7f6e757b1c353e65e0089f78d71b5cb4fcdd0ec2635fad9da6ceebb | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
| E3 P2 false-rejection plot pdf | experiments/results/e3-v2/p2-false-rejection-vs-future.pdf | 95938665c75167da0a527826c08538bc526f159d062138aa0406ab56ffb3e729 | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
| E3 P3 false-rejection plot pdf | experiments/results/e3-v2/p3-false-rejection-vs-future.pdf | d4ac23b0e8d68668d953c3c2d51862357137859178661daa6c25564affe38e09 | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
| E3 false-rejection vs PAST pdf | experiments/results/e3-v2/false-rejection-vs-past-and-replay-window.pdf | 0bb56143d5b07e2843f4567b6b981090342a7d2f3ad895d5b425b8e54ac49e48 | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
| E1 coverage heat map svg | experiments/results/e1-v2/attack-success-heatmap.svg | 51fd4af00211bf79a49d817d5d6e29e5d4f29bc96d759188d54d1e94a0709807 | experiments/results/e1-v2/summary.csv + experiments/results/e1-v2-s11/summary.csv | d24bdccf210d02995691ecc4e3b0a37ff451e0a11ca0ad14613d2c939076835f + 05b6281d9f85a85349672e831ce6acb3cc98974e45814bdd17d2835127a52309 | python experiments/render-v2-results.py | 9.5961856 |
| E2 server-handler cost svg | experiments/results/e2-v2/server-handler-cost.svg | 131661c3cc882a69c3dfc7fe506e39799689e9f0499c01640e473cff18e3e042 | experiments/results/e2-v2/load-repeat-summary.csv | daf381305a1b5ec7f917401888ac46a4a49d3838d929d8e71286c22dd6476a90 | python experiments/render-v2-results.py | 9.5961856 |
| E3 P1 false-rejection plot svg | experiments/results/e3-v2/p1-false-rejection-vs-future.svg | b6b1d18861c745c7ccc472fa98a190e3124d488fa69a0ad2e3e3f07e54101a5d | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
| E3 P2 false-rejection plot svg | experiments/results/e3-v2/p2-false-rejection-vs-future.svg | 4967dd70309c22ae815e6257e710db89b9c3f0a2489a40280e0f93e13a936e3b | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
| E3 P3 false-rejection plot svg | experiments/results/e3-v2/p3-false-rejection-vs-future.svg | 996144f85d90f28997d2ca237d798fc476a9d8491a06774431321038f5b7c90a | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |
| E3 false-rejection vs PAST svg | experiments/results/e3-v2/false-rejection-vs-past-and-replay-window.svg | 855ad4e4e87dda878f8fd01548c3eb9f91eb822f64760aa182a565bfcab1085c | experiments/results/e3-v2/summary.csv | b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12 | python experiments/render-v2-results.py | 9.5961856 |

## Round F: default-window TTL gap and higher-trial headline cells

New results only. Earlier result directories were not overwritten. A/A2 use default PAST=300 s, FUTURE=5 s, NONCE_TTL=300 s, client offset +4 s, SESSION_TTL=900 s, 30 independent captured requests at each delay. A used H1T1N1R0; A2 used H1T1N1R1. The tested rule predicts nonce rejection before expiry, replay acceptance after nonce expiry while timestamp age remains below 304 s, then timestamp rejection.

| Run | Intended delay | attempts | accepted / ledger replay debits | Wilson 95% | reasons |
|---|---:|---:|---:|---:|---|
| H1T1N1R0 | 299s | 30 | 0/0 | [0, 0.113513393173969] | {"NONCE_FAIL":30} |
| H1T1N1R0 | 301s | 30 | 30/30 | [0.886486606826031, 1] | {"ACCEPTED":30} |
| H1T1N1R0 | 303s | 30 | 30/30 | [0.886486606826031, 1] | {"ACCEPTED":30} |
| H1T1N1R0 | 305s | 30 | 0/0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0 | 307s | 30 | 0/0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1 | 299s | 30 | 0/0 | [0, 0.113513393173969] | {"NONCE_FAIL":30} |
| H1T1N1R1 | 301s | 30 | 0/0 | [0, 0.113513393173969] | {"ALREADY_PROCESSED":30} |
| H1T1N1R1 | 303s | 30 | 0/0 | [0, 0.113513393173969] | {"ALREADY_PROCESSED":30} |
| H1T1N1R1 | 305s | 30 | 0/0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1 | 307s | 30 | 0/0 | [0, 0.113513393173969] | {"TIMESTAMP_FAIL":30} |

The observed A sequence is 0, 30, 30, 0, 0 accepted at 299/301/303/305/307 s, matching the prediction. A2 accepted 0 at every delay; 301 s and 303 s were stopped by request-ID idempotency (`ALREADY_PROCESSED`). Each table is aggregated from the corresponding requests.csv; SQLite ledger counts and timing fields are saved alongside it.

| Config | Raw requests CSV | SHA-256 | Metadata |
|---|---|---|---|
| H1T1N1R0 | experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/H1T1N1R0/requests.csv | 47fcc23e167def16075ec5cb129d9846be15cfe1bcc2f1d3681a05615ce56cc4 | experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/H1T1N1R0/run.json |
| H1T1N1R1 | experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/H1T1N1R1/requests.csv | cce0d46b2da4200f66257adf8ab866716740e89d4c14d6b0e32cf885a7a90e1c | experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/H1T1N1R1/run.json |

### B: 100 attempts per requested cell

The per-cell Wilson intervals below use the exact Wilson score formula and the SQLite ledger oracle debit count as successes. Controls are 30/30 accepted in every configuration and omitted here for compactness; they are present in each raw summary. Each run has a summary.csv, per-config requests.csv, SQLite database, run.json, and console.log.

| Run | config | scenario | attempts | oracle debits / attempts | Wilson 95% | blocking reasons |
|---|---|---|---:|---:|---:|---|
| B-S10-fast-R0 | H0T0N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-fast-R0 | H1T0N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-fast-R0 | H0T1N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-fast-R0 | H1T1N0R0 | S10_fast | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-fast-R0 | H0T0N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R0 | H1T0N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R0 | H0T1N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R0 | H1T1N1R0 | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H0T0N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-fast-R1 | H1T0N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-fast-R1 | H0T1N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-fast-R1 | H1T1N0R1-success_only | S10_fast | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-fast-R1 | H0T0N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H1T0N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H0T1N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H1T1N1R1-success_only | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H0T0N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-fast-R1 | H1T0N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-fast-R1 | H0T1N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-fast-R1 | H1T1N0R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-fast-R1 | H0T0N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H1T0N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H0T1N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-fast-R1 | H1T1N1R1-any_outcome | S10_fast | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"NONCE_FAIL":100} |
| B-S10-late-R0 | H0T0N0R0 | S10_late | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-late-R0 | H1T0N0R0 | S10_late | 100 | 5/100 | [0.021543679154368, 0.111750469231919] | {"ACCEPTED":5,"INSUFFICIENT_BALANCE":95} |
| B-S10-late-R0 | H0T1N0R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R0 | H1T1N0R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R0 | H0T0N1R0 | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
| B-S10-late-R0 | H1T0N1R0 | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
| B-S10-late-R0 | H0T1N1R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R0 | H1T1N1R0 | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H0T0N0R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-late-R1 | H1T0N0R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"ALREADY_PROCESSED":99} |
| B-S10-late-R1 | H0T1N0R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H1T1N0R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H0T0N1R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
| B-S10-late-R1 | H1T0N1R1-success_only | S10_late | 100 | 1/100 | [0.00176743206414065, 0.0544861961787053] | {"ACCEPTED":1,"NONCE_FAIL":99} |
| B-S10-late-R1 | H0T1N1R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H1T1N1R1-success_only | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H0T0N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-late-R1 | H1T0N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":100} |
| B-S10-late-R1 | H0T1N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H1T1N0R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H0T0N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":1,"NONCE_FAIL":99} |
| B-S10-late-R1 | H1T0N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"ALREADY_PROCESSED":1,"NONCE_FAIL":99} |
| B-S10-late-R1 | H0T1N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-S10-late-R1 | H1T1N1R1-any_outcome | S10_late | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"TIMESTAMP_FAIL":100} |
| B-s11-100 | H0T0N0R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T0N0R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T1N0R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T1N0R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T0N1R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T0N1R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T1N1R0 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T1N1R0 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T0N0R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T0N0R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T1N0R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T1N0R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T0N1R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T0N1R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |
| B-s11-100 | H0T1N1R1 | S11 | 100 | 100/100 | [0.963006501793014, 1] | {"ACCEPTED":100} |
| B-s11-100 | H1T1N1R1 | S11 | 100 | 0/100 | [3.46944695195361E-18, 0.0369934982069857] | {"SIGNATURE_FAIL":100} |

Headline: S11 produced 100/100 debits when HMAC was disabled (all 8 such configurations; Wilson [0.9630, 1.0000]) and 0/100 when HMAC was enabled (all 8; [0.0000, 0.0370], `SIGNATURE_FAIL`). For S10_fast with request-ID disabled and nonce disabled, each of four HMAC/timestamp combinations produced 5/100 late executions after funding (Wilson [0.0215, 0.1118]); enabling nonce reduced these to 0/100. With request-ID enabled under success_only, all nonce-disabled cells produced 1/100 and nonce-enabled cells 0/100; under any_outcome all produced 0/100. For S10_late, HMAC is irrelevant; timestamp-enabled cells were 0/100. Request-ID-off, timestamp-off cells had 5/100 for no nonce and 1/100 for nonce. Request-ID-on success_only had 1/100 with timestamp off; any_outcome produced 0/100.

| Run | summary.csv | SHA-256 | run.json |
|---|---|---|---|
| B-S10-fast-R0 | experiments/results/round-f/B-S10-fast-R0/summary.csv | ee4d68115750664265087d43dcaddffc2f4617cd6cd3306e29cad8cccda8af37 | experiments/results/round-f/B-S10-fast-R0/run.json |
| B-S10-fast-R1 | experiments/results/round-f/B-S10-fast-R1/summary.csv | 71657d57a7de64f7284fc4cb30f05a113e0d3d9cb092eeca2569b77c90c137b9 | experiments/results/round-f/B-S10-fast-R1/run.json |
| B-S10-late-R0 | experiments/results/round-f/B-S10-late-R0/summary.csv | c6ebdfa9492a733baae2297220fc15826584399a70695bef954a9d756411576b | experiments/results/round-f/B-S10-late-R0/run.json |
| B-S10-late-R1 | experiments/results/round-f/B-S10-late-R1/summary.csv | 1d67ce561ad7eee3ebf8b4fc3694df4130c5caac530d8a5bd93250319b639285 | experiments/results/round-f/B-S10-late-R1/run.json |
| B-s11-100 | experiments/results/round-f/B-s11-100/summary.csv | e67a7a7b69609b24598816dbc6523f11e99dbcdc2831d1178aaf0bd4c2a6fba2 | experiments/results/round-f/B-s11-100/run.json |

Privacy treatment: the post-run SQLite files retained the transaction and balance columns used by the oracle. After the oracle queries completed, stored signature column values were set to NULL and the files checkpointed; this removes signatures from the deliverable artifacts without changing ledger outcome fields. The independent audit was rerun successfully against these sanitized SQLite files at experiments/results/round-f/audit-final4/audit-report.json.
