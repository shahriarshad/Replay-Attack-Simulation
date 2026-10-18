# Results Pack A — measured research runs

Generated only from saved run data. The pack is intentionally compact: summary tables, selected first/last rows, plus an evidence inventory with exact paths, byte sizes, and SHA-256 hashes. Complete CSVs remain on disk. The full dossier handles CSVs over 200 KB or 1,000 rows using the specified first/last 20 rows and aggregate statistics rule.

## Commands, design, and scope

- E1: `npm.cmd run experiments:e1`; fresh server/DB per config, session login and signing, Memurai namespace per run, keep-alive HTTP agent, VIZ off. The “none” setting disables the four replay layers only; bearer-session and account-ownership checks remain.
- E2: `npm.cmd run experiments:e2`; 8 cells interleaved in fixed-seed order, 10 repeats per cell, 500 warm-up and 3,000 measured requests, concurrency 1. Rejection floods contain 3,000 requests per cell; duplicate-request-ID floods have three repeats per check order.
- E3: `npm.cmd run experiments:e3`; 75 fresh-server cells × 2,000 requests, no real waiting. Offset/delay distributions are assumptions, not real-network measurements.
- E4: `npm.cmd run experiments:e4`; PAST=6 s, FUTURE=2 s; 30 E4a trials per cell. E4c was rerun with `DEFENSE_REQUEST_ID=true` after the first harness version omitted that flag; only the corrected output is interpreted.
- Figures and LaTeX: `npm.cmd run experiments:render-v2`; pack: `npm.cmd run experiments:pack-v2`; paper facts: `npm.cmd run experiments:paper-facts`. Phase 5 was not started.
- All traffic is localhost on Windows with Memurai Developer 4.2.3; latency supports relative comparisons only. No stock Redis was used.

## Canonical nonce-memory result

The canonical result is the two clean reruns with preserved raw INFO evidence. The older 164.96 B/key / 17,543,968 B run is unverified and superseded; it is excluded from every table.

| Traffic | Empty baseline B | Used memory at 100k B | Delta B | Bytes/key | Run seconds / TTL |
| --- | --- | --- | --- | --- | --- |
| nonce-store growth from accepted requests | 1083904 | 19180768 | 18096864 | 180.96864 | 843.2111516 / 86400 |
| nonce-store growth from requests rejected at the request-ID check | 1087544 | 19184632 | 18097088 | 180.97088 | 177.7131442 / 86400 |

Accepted raw INFO: `experiments/results/corrections/nonce-memory-accepted-prep-accepted-clean-20261018-raw-info.log` (`6d5044cdd097ec24e2bdd796e2c26f015c8b4de2f8bfffda1e5ee2c574c30e9d`); request-ID-rejected raw INFO: `experiments/results/corrections/nonce-memory-requestid-prep-requestid-20261018-raw-info.log` (`8979d7a176e07c9c2c13c3e0bf62d4d21040b539226792f1086f9807dc4325dd`).

## E1 v2 ablation

Runtime: 1148.321 s. Sixteen defense-flag configurations; 14 scenario/variant groups. S5 used 30 batches of 50 concurrent identical requests. S7a and S7b are separate, 30 attempts each. S10 fast/late each use 30 captured failed requests. Wilson 95% intervals are present for every attack cell, including 0/n and n/n. Direct SQLite ledger reconciliation is saved separately. Default-window confirmation replay waits were 60 s (S2) and 301 s (S4).

| Scenario / variant | Min debits / config | Max debits / config | Attempts / config |
| --- | --- | --- | --- |
| S1 | 0 | 30 | 30 |
| S2 | 0 | 30 | 30 |
| S3 | 0 | 30 | 30 |
| S4 | 0 | 30 | 30 |
| S5 | 0 | 1500 | 1500 |
| S6 | 0 | 30 | 30 |
| S7a | 0 | 30 | 30 |
| S7b | 0 | 30 | 30 |
| S8 | 0 | 0 | 30 |
| S9 | 30 | 30 | 30 |
| S10_fast | 0 | 5 | 30 |
| S10_late | 0 | 5 | 30 |
| S2_default_window_60s | 0 | 0 | 30 |
| S4_default_window_301s | 0 | 0 | 30 |

Compact configuration × scenario LaTeX matrix: `experiments/results/e1-v2/coverage-matrix.tex`; heat map: `experiments/results/e1-v2/attack-success-heatmap.png`, `experiments/results/e1-v2/attack-success-heatmap.pdf`, `experiments/results/e1-v2/attack-success-heatmap.svg`.

Raw summary: `experiments/results/e1-v2/summary.csv` (`d24bdccf210d02995691ecc4e3b0a37ff451e0a11ca0ad14613d2c939076835f`); direct SQLite oracle reconciliation: `experiments/results/e1-v2/oracle-total-debited-by-scenario.csv` (`36ce968954e3377ae404306db6b78141f459bfec6ee224430e4adf9c8a05bab3`); command: npm.cmd run experiments:e1.

### S10 delayed execution from previously failed withdrawal

| Config | Case | Total debited delta | Duplicate count | Delayed executions | Delayed amount |
| --- | --- | --- | --- | --- | --- |
| H0T0N0R0 | S10_fast | 500 | 4 | 5 | 500 |
| H0T0N0R0 | S10_late | 500 | 4 | 5 | 500 |
| H1T0N0R0 | S10_fast | 500 | 4 | 5 | 500 |
| H1T0N0R0 | S10_late | 500 | 4 | 5 | 500 |
| H0T1N0R0 | S10_fast | 500 | 4 | 5 | 500 |
| H0T1N0R0 | S10_late | 0 | 0 | 0 | 0 |
| H1T1N0R0 | S10_fast | 500 | 4 | 5 | 500 |
| H1T1N0R0 | S10_late | 0 | 0 | 0 | 0 |
| H0T0N1R0 | S10_fast | 0 | 0 | 0 | 0 |
| H0T0N1R0 | S10_late | 100 | 0 | 1 | 100 |
| H1T0N1R0 | S10_fast | 0 | 0 | 0 | 0 |
| H1T0N1R0 | S10_late | 100 | 0 | 1 | 100 |
| H0T1N1R0 | S10_fast | 0 | 0 | 0 | 0 |
| H0T1N1R0 | S10_late | 0 | 0 | 0 | 0 |
| H1T1N1R0 | S10_fast | 0 | 0 | 0 | 0 |
| H1T1N1R0 | S10_late | 0 | 0 | 0 | 0 |
| H0T0N0R1 | S10_fast | 100 | 0 | 1 | 100 |
| H0T0N0R1 | S10_late | 100 | 0 | 1 | 100 |
| H1T0N0R1 | S10_fast | 100 | 0 | 1 | 100 |
| H1T0N0R1 | S10_late | 100 | 0 | 1 | 100 |
| H0T1N0R1 | S10_fast | 100 | 0 | 1 | 100 |
| H0T1N0R1 | S10_late | 0 | 0 | 0 | 0 |
| H1T1N0R1 | S10_fast | 100 | 0 | 1 | 100 |
| H1T1N0R1 | S10_late | 0 | 0 | 0 | 0 |
| H0T0N1R1 | S10_fast | 0 | 0 | 0 | 0 |
| H0T0N1R1 | S10_late | 100 | 0 | 1 | 100 |
| H1T0N1R1 | S10_fast | 0 | 0 | 0 | 0 |
| H1T0N1R1 | S10_late | 100 | 0 | 1 | 100 |
| H0T1N1R1 | S10_fast | 0 | 0 | 0 | 0 |
| H0T1N1R1 | S10_late | 0 | 0 | 0 | 0 |
| H1T1N1R1 | S10_fast | 0 | 0 | 0 | 0 |
| H1T1N1R1 | S10_late | 0 | 0 | 0 | 0 |

## E2 v2 cost

Runtime: 2268.197 s; concurrency 1 primary; 10 repeats/cell; 500 warm-up plus 3000 measured requests/repeat. The t interval is the two-sided 95% interval for the mean of per-repeat medians; median of those repeat medians is reported separately. Power metadata: Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced); CPU reported 1896 MHz. Battery WMI returned Access denied; an alternate Windows power-status observation was captured after the run at `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/power-status-after-run.json` and is not contemporaneous with the benchmark. Prior concurrency-16 data are supplementary queueing measurements in one Node process.

| Stack | n | Median of repeat medians (handler ns) | Mean t-CI (ns) | Median of repeat medians (client ms) |
| --- | --- | --- | --- | --- |
| nonce_sqlite | 10 | 11223050 | 8201636–11559774 | 11.844574999999999 |
| all_four | 10 | 6692850 | 4686554–6655976 | 7.3106 |
| hmac | 10 | 6128575 | 4410660–6264600 | 6.7532250000000005 |
| hmac_ts_nonce | 10 | 6316175 | 5524390–6642300 | 6.939775 |
| hmac_ts | 10 | 6126975 | 4832520–6432760 | 6.750225 |
| nonce_redis | 10 | 6668225 | 5416223–6960657 | 7.296525 |
| none | 10 | 6070725 | 4277392–6059078 | 6.690275 |
| nonce_memory | 10 | 6448950 | 4588348–6463372 | 7.046125 |

Handler-layer t intervals: `experiments/results/e2-v2/layer-repeat-ci.csv` (`610573e69192a882cc927b244a0e758527f949942135209738f48271a7745a01`); rejection floods: `experiments/results/e2-v2/rejection-cost.csv` (`85a684770b4a3206f0661d9d7ed6dc716febc457f95b2c70a9beb657adc12b7d`); summary: `experiments/results/e2-v2/load-repeat-summary.csv` (`daf381305a1b5ec7f917401888ac46a4a49d3838d929d8e71286c22dd6476a90`). Figure/LaTeX are in `experiments/results/e2-v2`. Command: npm.cmd run experiments:e2.

### E2 duplicate-request-ID flood outlier check

| Order | Repeat | p50 ns | p95 ns | p99 ns | Trimmed p50 ns | Trimmed p95 ns | Trimmed p99 ns | Max ns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| default | 3 | 1224300 | 1826100 | 2333000 | 1224300 | 1790600 | 2133440 | 9180400 |
| request_id_before_nonce | 1 | 1058800 | 1600100 | 1977600 | 1058800 | 1567600 | 1819339.9999999998 | 12190600 |
| timestamp_first | 1 | 1281400 | 1989900 | 2527100 | 1281400 | 1952300 | 2259259.9999999995 | 14387300 |
| timestamp_first | 3 | 1228100 | 1831800 | 2274100 | 1228100 | 1777000 | 2083119.9999999998 | 14886000 |
| request_id_before_nonce | 2 | 1088000 | 1739300 | 2370100 | 1088000 | 1670000 | 2050959.9999999993 | 9703000 |
| default | 2 | 1229300 | 1767500 | 2290100 | 1229300 | 1720600 | 2094339.9999999998 | 15759800 |
| timestamp_first | 2 | 1233700 | 1878600 | 2428000 | 1233700 | 1809200 | 2200159.9999999995 | 14470800 |
| request_id_before_nonce | 3 | 1172500 | 2234500 | 2998400 | 1172500 | 2155100 | 2636759.9999999995 | 22227300 |
| default | 1 | 1245900 | 1874700 | 2383900 | 1245900 | 1824400 | 2181999.9999999986 | 13225200 |

The ~500 ms handler outlier did not recur: across the 9 duplicate-request-ID flood runs, maximum observed handler time was 22,227,300 ns (22.2273 ms); maximum untrimmed p99 was 2,998,400 ns and maximum trimmed p99 was 2,636,760 ns. Per-run percentiles are above; full evidence is in the saved CSV. Each profiled server writes event-loop delay and GC observations to its server stdout log.

### E2 profiled duplicate-request-ID rerun

A corrected focused run completed 9 cells: 3,000 requests × 3 check orders × 3 repeats in 75.351 s. The ~500 ms handler outlier did not recur: across these 9 cells, maximum handler time was 14748000 ns; maximum untrimmed p99 was 4250929 ns and maximum 1%-trimmed p99 was 3402191 ns. The earlier profiling attempt is preserved under experiments/results/e2-v2-profiled/ but its flush endpoint returned 404 and it has no event-loop summary; it is superseded. The corrected run records event-loop histograms and GC events in each server stdout log.

| Order | Repeat | p50 ns | p95 ns | p99 ns | Trim p50 ns | Trim p95 ns | Trim p99 ns | Max ns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| timestamp_first | 1 | 1504000 | 2098544.9999999995 | 2762588.9999999977 | 1504000 | 2058664.9999999995 | 2429833.0000000005 | 10994000 |
| timestamp_first | 2 | 1631150 | 2697700 | 4250928.999999982 | 1631150 | 2613774.9999999995 | 3402191.0000000056 | 12724700 |
| timestamp_first | 3 | 1483500 | 2135300 | 2948800 | 1483500 | 2083700 | 2428260 | 8805000 |
| request_id_before_nonce | 1 | 1226200 | 1726300 | 2223900 | 1226200 | 1699700 | 1968799.999999999 | 12383500 |
| request_id_before_nonce | 2 | 1332200 | 1973100 | 2528500 | 1332200 | 1931600 | 2249039.9999999995 | 12629400 |
| request_id_before_nonce | 3 | 1266400 | 1930500 | 2717200 | 1266400 | 1878000 | 2236659.9999999995 | 14459000 |
| default | 1 | 1736700 | 2694700 | 3797700 | 1736700 | 2626400 | 3156360 | 13565200 |
| default | 2 | 1608900 | 2529600 | 3407900 | 1608900 | 2444300 | 2976519.9999999995 | 14748000 |
| default | 3 | 1501600 | 2207200 | 3314200 | 1501600 | 2138600 | 2758259.9999999995 | 12207500 |

| Cell log | Event-loop p50 ms | p95 ms | p99 ms | Max ms |
| --- | --- | --- | --- | --- |
| all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1 | 10.018815 | 10.723327 | 16.023551 | 58.687487 |
| all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2 | 10.027007 | 10.657791 | 16.039935 | 52.723711 |
| all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3 | 10.027007 | 10.698751 | 16.072703 | 61.014015 |
| all_four-requestidbeforenonce-flood-duplicate_request_id-r1 | 10.010623 | 10.633215 | 18.137087 | 62.324735 |
| all_four-requestidbeforenonce-flood-duplicate_request_id-r2 | 10.018815 | 10.706943 | 18.907135 | 50.561023 |
| all_four-requestidbeforenonce-flood-duplicate_request_id-r3 | 10.002431 | 10.665983 | 18.153471 | 59.768831 |
| all_four-timestampfirst-flood-duplicate_request_id-r1 | 10.018815 | 10.674175 | 16.105471 | 67.436543 |
| all_four-timestampfirst-flood-duplicate_request_id-r2 | 10.027007 | 10.813439 | 16.039935 | 58.556415 |
| all_four-timestampfirst-flood-duplicate_request_id-r3 | 10.018815 | 10.584063 | 15.998975 | 59.473919 |

Corrected raw flood CSV: `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/rejection-cost-profiled.csv` (`91ad9f15fa78caa32b88945e374979178d6844706864391c499ab25af495e3b9`); run metadata: `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/profiled-run.json` (`a20fbc96a758841bdd5af28104002caca2a92b8388106607f92f10fb6ee5c0ae`); command: E2_PROFILE_DUPLICATES_ONLY=true node experiments/e2/run.js; runtime 75.351 s.

## E3 false rejection

Run metadata: `experiments/results/e3-v2/run.json`; 75 cells × 2,000 requests. All 75 cells report mismatch_count=0 between live rejection decisions and offline recomputation using recorded server check times. Assumed delay and offset distributions do not characterize a real network.

| Profile | PAST | FUTURE | False rejects / N | Rate | Wilson low–high | Offline mismatches |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | 5 | 0 | 629/2000 | 0.3145 | 0.2945–0.3352 | 0 |
| P1 | 5 | 2 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 5 | 5 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 5 | 30 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 5 | 60 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 30 | 0 | 618/2000 | 0.3090 | 0.2891–0.3296 | 0 |
| P1 | 30 | 2 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 30 | 5 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 30 | 30 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 30 | 60 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 60 | 0 | 649/2000 | 0.3245 | 0.3043–0.3453 | 0 |
| P1 | 60 | 2 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 60 | 5 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 60 | 30 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 60 | 60 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 120 | 0 | 653/2000 | 0.3265 | 0.3063–0.3474 | 0 |
| P1 | 120 | 2 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 120 | 5 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 120 | 30 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P1 | 120 | 60 | 0/2000 | 0.0000 | 0.0000–0.0019 | 0 |
| P3 | 30 | 0 | 1284/2000 | 0.6420 | 0.6207–0.6627 | 0 |
| P3 | 30 | 2 | 1237/2000 | 0.6185 | 0.5970–0.6395 | 0 |
| P3 | 30 | 5 | 1186/2000 | 0.5930 | 0.5713–0.6143 | 0 |
| P3 | 30 | 30 | 668/2000 | 0.3340 | 0.3137–0.3550 | 0 |
| P3 | 30 | 60 | 410/2000 | 0.2050 | 0.1879–0.2233 | 0 |
| P3 | 60 | 0 | 969/2000 | 0.4845 | 0.4626–0.5064 | 0 |
| P3 | 60 | 2 | 908/2000 | 0.4540 | 0.4323–0.4759 | 0 |
| P3 | 60 | 5 | 806/2000 | 0.4030 | 0.3817–0.4247 | 0 |
| P3 | 60 | 30 | 332/2000 | 0.1660 | 0.1503–0.1829 | 0 |
| P3 | 60 | 60 | 114/2000 | 0.0570 | 0.0477–0.0680 | 0 |
| P3 | 120 | 0 | 920/2000 | 0.4600 | 0.4383–0.4819 | 0 |
| P3 | 120 | 2 | 843/2000 | 0.4215 | 0.4000–0.4433 | 0 |
| P3 | 120 | 5 | 770/2000 | 0.3850 | 0.3639–0.4065 | 0 |
| P3 | 120 | 30 | 267/2000 | 0.1335 | 0.1193–0.1491 | 0 |
| P3 | 120 | 60 | 47/2000 | 0.0235 | 0.0177–0.0311 | 0 |
| P3 | 300 | 0 | 880/2000 | 0.4400 | 0.4184–0.4618 | 0 |
| P3 | 300 | 2 | 846/2000 | 0.4230 | 0.4015–0.4448 | 0 |
| P3 | 300 | 5 | 778/2000 | 0.3890 | 0.3679–0.4106 | 0 |
| P3 | 300 | 30 | 258/2000 | 0.1290 | 0.1150–0.1444 | 0 |
| P3 | 300 | 60 | 19/2000 | 0.0095 | 0.0061–0.0148 | 0 |

The table shows the first and last 20 summary rows; all 75 rows remain in the source CSV. Figures compare FUTURE tolerance and PAST replay acceptance window in PNG/PDF/SVG.

Raw summary: `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`); command: npm.cmd run experiments:e3; runtime 933.547 s.

## E4 failure modes

Runtime: 401.495 s. E4a comprises 270 cells × 30 trials. Each aggregate row sums the 9 delays (270 replay attempts) at one configuration/TTL/future-offset combination; the first/last 20 detailed delay cells follow.
### E4a TTL/window aggregate
| Configuration | TTL s | Future offset s | Accepted / 270 | Blocked / 270 |
| --- | --- | --- | --- | --- |
| H1T1N1R0-TTL4 | 4 | 0 | 30 | 240 | 270 |
| H1T1N1R0-TTL4 | 4 | 1 | 60 | 210 | 270 |
| H1T1N1R0-TTL4 | 4 | 2 | 90 | 180 | 270 |
| H1T1N1R0-TTL6 | 6 | 0 | 0 | 270 | 270 |
| H1T1N1R0-TTL6 | 6 | 1 | 30 | 240 | 270 |
| H1T1N1R0-TTL6 | 6 | 2 | 60 | 210 | 270 |
| H1T1N1R0-TTL8 | 8 | 0 | 0 | 270 | 270 |
| H1T1N1R0-TTL8 | 8 | 1 | 0 | 270 | 270 |
| H1T1N1R0-TTL8 | 8 | 2 | 0 | 270 | 270 |
| H1T1N1R0-TTL10 | 10 | 0 | 0 | 270 | 270 |
| H1T1N1R0-TTL10 | 10 | 1 | 0 | 270 | 270 |
| H1T1N1R0-TTL10 | 10 | 2 | 0 | 270 | 270 |
| H1T1N1R0-TTL12 | 12 | 0 | 0 | 270 | 270 |
| H1T1N1R0-TTL12 | 12 | 1 | 0 | 270 | 270 |
| H1T1N1R0-TTL12 | 12 | 2 | 0 | 270 | 270 |
| H1T1N1R1-TTL4 | 4 | 0 | 0 | 270 | 270 |
| H1T1N1R1-TTL4 | 4 | 1 | 0 | 270 | 270 |
| H1T1N1R1-TTL4 | 4 | 2 | 0 | 270 | 270 |
| H1T1N1R1-TTL6 | 6 | 0 | 0 | 270 | 270 |
| H1T1N1R1-TTL6 | 6 | 1 | 0 | 270 | 270 |
| H1T1N1R1-TTL6 | 6 | 2 | 0 | 270 | 270 |
| H1T1N1R1-TTL8 | 8 | 0 | 0 | 270 | 270 |
| H1T1N1R1-TTL8 | 8 | 1 | 0 | 270 | 270 |
| H1T1N1R1-TTL8 | 8 | 2 | 0 | 270 | 270 |
| H1T1N1R1-TTL10 | 10 | 0 | 0 | 270 | 270 |
| H1T1N1R1-TTL10 | 10 | 1 | 0 | 270 | 270 |
| H1T1N1R1-TTL10 | 10 | 2 | 0 | 270 | 270 |
| H1T1N1R1-TTL12 | 12 | 0 | 0 | 270 | 270 |
| H1T1N1R1-TTL12 | 12 | 1 | 0 | 270 | 270 |
| H1T1N1R1-TTL12 | 12 | 2 | 0 | 270 | 270 |

### E4a first and last 20 detailed cells
| Config | TTL | Future offset | Delay | Trials | Accepted | Blocked | Blocking reasons |
| --- | --- | --- | --- | --- | --- | --- | --- |
| H1T1N1R0-TTL4 | 4 | 0 | 1 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 0 | 3 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 0 | 5 | 30 | 30 | 0 | {"ACCEPTED":30} |
| H1T1N1R0-TTL4 | 4 | 0 | 6 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 0 | 7 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 0 | 8 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 0 | 9 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 0 | 10 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 0 | 11 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 1 | 1 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 1 | 3 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 1 | 5 | 30 | 30 | 0 | {"ACCEPTED":30} |
| H1T1N1R0-TTL4 | 4 | 1 | 6 | 30 | 30 | 0 | {"ACCEPTED":30} |
| H1T1N1R0-TTL4 | 4 | 1 | 7 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 1 | 8 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 1 | 9 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 1 | 10 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 1 | 11 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 2 | 1 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R0-TTL4 | 4 | 2 | 3 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 0 | 10 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 0 | 11 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 1 | 1 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 1 | 3 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 1 | 5 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 1 | 6 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 1 | 7 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 1 | 8 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 1 | 9 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 1 | 10 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 1 | 11 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 2 | 1 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 2 | 3 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 2 | 5 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 2 | 6 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 2 | 7 | 30 | 0 | 30 | {"NONCE_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 2 | 8 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 2 | 9 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 2 | 10 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |
| H1T1N1R1-TTL12 | 12 | 2 | 11 | 30 | 0 | 30 | {"TIMESTAMP_FAIL":30} |

Measured result for the hypothesis: with request-ID defense off, replays after nonce expiry were accepted in 30/270 attempts at TTL 4/f=0, 60/270 at TTL 4/f=1, 90/270 at TTL 4/f=2, 30/270 at TTL 6/f=1, and 60/270 at TTL 6/f=2; every other tested TTL/offset group had 0 accepted. With request-ID defense on, every group had 0 accepted. This matches the tested TTL < PAST + future-offset condition. Full grid: `experiments/results/e4-v2/e4a-summary.csv` (`fa49f93c7f42408bf54deaa079b9f9ff84c1c21b396dcfbebbe855d25f19abf3`); LaTeX table: `experiments/results/e4-v2/e4a-grid.tex`.

### E4b nonce-store fault mode
| Case | Legitimate accepted / 30 | Replay accepted / 1 | Failure mode | Request-ID |
| --- | --- | --- | --- | --- |
| fault-fail-open-requestid-0 | 30/30 | 1/1 | fail-open | 0 |
| fault-fail-open-requestid-1 | 30/30 | 0/1 | fail-open | 1 |
| fault-fail-closed-requestid-0 | 0/30 | 0/1 | fail-closed | 0 |
| fault-fail-closed-requestid-1 | 0/30 | 0/1 | fail-closed | 1 |

### E4c lost-response retries (corrected run)
| Case | Debits / 100 | Exactly one per ID | Client failure after debit | Failure reasons | Oracle holds |
| --- | --- | --- | --- | --- | --- |
| loss-p0-default-same-signed | 100 | 100 | 0 | {} | true |
| loss-p0-default-fresh-nonce-same-request-id | 100 | 100 | 0 | {} | true |
| loss-p0-request_id_before_nonce-same-signed | 100 | 100 | 0 | {} | true |
| loss-p0-request_id_before_nonce-fresh-nonce-same-request-id | 100 | 100 | 0 | {} | true |
| loss-p0.05-default-same-signed | 100 | 100 | 4 | {"NONCE_FAIL":4} | true |
| loss-p0.05-default-fresh-nonce-same-request-id | 100 | 100 | 3 | {"ALREADY_PROCESSED":3} | true |
| loss-p0.05-request_id_before_nonce-same-signed | 100 | 100 | 10 | {"ALREADY_PROCESSED":10} | true |
| loss-p0.05-request_id_before_nonce-fresh-nonce-same-request-id | 100 | 100 | 1 | {"ALREADY_PROCESSED":1} | true |
| loss-p0.2-default-same-signed | 100 | 100 | 18 | {"NONCE_FAIL":18} | true |
| loss-p0.2-default-fresh-nonce-same-request-id | 100 | 100 | 25 | {"ALREADY_PROCESSED":25} | true |
| loss-p0.2-request_id_before_nonce-same-signed | 100 | 100 | 25 | {"ALREADY_PROCESSED":25} | true |
| loss-p0.2-request_id_before_nonce-fresh-nonce-same-request-id | 100 | 100 | 17 | {"ALREADY_PROCESSED":17} | true |

| Insufficient-balance retry | Initial reason | Retry mode | Retry result |
| --- | --- | --- | --- |
| insufficient-same-nonce | INSUFFICIENT_BALANCE | same-nonce | 409 NONCE_FAIL |
| insufficient-fresh-nonce | INSUFFICIENT_BALANCE | fresh-nonce | 200 ACCEPTED |

The first E4c output used request-ID defense off and is invalid for the intended comparison; it is preserved but superseded. Corrected E4c raw: `experiments/results/e4-v2-corrected/e4c.csv` (`7499a4ff04cfece23d1e1a8d87c1e772166478a30f82d946196b2d39086dbc02`); run metadata: `experiments/results/e4-v2-corrected/run-e4c-corrected.json`.

### E4d linear extrapolation
| Requests/s | TTL s | Derived keys | Measured mean B/key | Derived MiB | Scope |
| --- | --- | --- | --- | --- | --- |
| 10 | 30 | 300 | 180.970 | 0.052 | linear extrapolation, not a measurement |
| 10 | 300 | 3000 | 180.970 | 0.518 | linear extrapolation, not a measurement |
| 10 | 3600 | 36000 | 180.970 | 6.213 | linear extrapolation, not a measurement |
| 100 | 30 | 3000 | 180.970 | 0.518 | linear extrapolation, not a measurement |
| 100 | 300 | 30000 | 180.970 | 5.178 | linear extrapolation, not a measurement |
| 100 | 3600 | 360000 | 180.970 | 62.131 | linear extrapolation, not a measurement |
| 1000 | 30 | 30000 | 180.970 | 5.178 | linear extrapolation, not a measurement |
| 1000 | 300 | 300000 | 180.970 | 51.776 | linear extrapolation, not a measurement |
| 1000 | 3600 | 3600000 | 180.970 | 621.310 | linear extrapolation, not a measurement |

E4d values are linear extrapolations from the canonical measured memory slope, not direct measurements.

## Table and figure provenance

Every generated table/figure below names its source raw CSV(s), source and output SHA-256, generator command, and corresponding measurement runtime. The numerical results are shown in the experiment sections above; the full source data stays on disk.

| Artifact | Output path | Output SHA-256 | Raw CSV path(s) and SHA-256 | Command | Runtime |
| --- | --- | --- | --- | --- | --- |
| E1 attack-success heat map (png) | `experiments/results/e1-v2/attack-success-heatmap.png` | `3852a52218cb3a8447fc019e9a76939b50255a5bd2c11ca25395b676b9778c25` | `experiments/results/e1-v2/summary.csv` (`d24bdccf210d02995691ecc4e3b0a37ff451e0a11ca0ad14613d2c939076835f`) | npm.cmd run experiments:render-v2 | 1148.321 s |
| E1 attack-success heat map (pdf) | `experiments/results/e1-v2/attack-success-heatmap.pdf` | `b918120f56d80e177dc2bdc20372f92f3e22ac5b109d6873885b25769b1dce6b` | `experiments/results/e1-v2/summary.csv` (`d24bdccf210d02995691ecc4e3b0a37ff451e0a11ca0ad14613d2c939076835f`) | npm.cmd run experiments:render-v2 | 1148.321 s |
| E1 attack-success heat map (svg) | `experiments/results/e1-v2/attack-success-heatmap.svg` | `7c0f4e94a5caa77826b1825025eee943b3c6ac25ea13a5603036143d60d7a60d` | `experiments/results/e1-v2/summary.csv` (`d24bdccf210d02995691ecc4e3b0a37ff451e0a11ca0ad14613d2c939076835f`) | npm.cmd run experiments:render-v2 | 1148.321 s |
| E1 coverage matrix (LaTeX) | `experiments/results/e1-v2/coverage-matrix.tex` | `637a1f84d95074d55e0b1403c724ce2525d85875fb2b6a4221ed264493dbe4f4` | `experiments/results/e1-v2/summary.csv` (`d24bdccf210d02995691ecc4e3b0a37ff451e0a11ca0ad14613d2c939076835f`) | npm.cmd run experiments:render-v2 | 1148.321 s |
| E2 server-handler cost figure (png) | `experiments/results/e2-v2/server-handler-cost.png` | `3f097530bd2f25e28e5b0c9924a05ff34e83a5466b888dc4ec865f83010598a1` | `experiments/results/e2-v2/load-repeat-summary.csv` (`daf381305a1b5ec7f917401888ac46a4a49d3838d929d8e71286c22dd6476a90`)<br>`experiments/results/e2-v2/layer-repeat-ci.csv` (`610573e69192a882cc927b244a0e758527f949942135209738f48271a7745a01`) | npm.cmd run experiments:render-v2 | 2268.197 s |
| E2 server-handler cost figure (pdf) | `experiments/results/e2-v2/server-handler-cost.pdf` | `7acff80025cb8496046c39cffb80ed19c21b86abe5b4810ed20f108091f196cb` | `experiments/results/e2-v2/load-repeat-summary.csv` (`daf381305a1b5ec7f917401888ac46a4a49d3838d929d8e71286c22dd6476a90`)<br>`experiments/results/e2-v2/layer-repeat-ci.csv` (`610573e69192a882cc927b244a0e758527f949942135209738f48271a7745a01`) | npm.cmd run experiments:render-v2 | 2268.197 s |
| E2 server-handler cost figure (svg) | `experiments/results/e2-v2/server-handler-cost.svg` | `7c74603f844ba7bc5c0176df8bb1036a6f3dc5aaf3a48324ec70deec7dc09e84` | `experiments/results/e2-v2/load-repeat-summary.csv` (`daf381305a1b5ec7f917401888ac46a4a49d3838d929d8e71286c22dd6476a90`)<br>`experiments/results/e2-v2/layer-repeat-ci.csv` (`610573e69192a882cc927b244a0e758527f949942135209738f48271a7745a01`) | npm.cmd run experiments:render-v2 | 2268.197 s |
| E2 load summary (LaTeX) | `experiments/results/e2-v2/load-summary.tex` | `fd4329741d4b4bf80bea6076fd7f401239a91651c9879565e5cfabc8f9a7c776` | `experiments/results/e2-v2/load-repeat-summary.csv` (`daf381305a1b5ec7f917401888ac46a4a49d3838d929d8e71286c22dd6476a90`) | npm.cmd run experiments:render-v2 | 2268.197 s |
| E2 rejection cost (LaTeX) | `experiments/results/e2-v2/rejection-cost.tex` | `7a6ba1d214f07472c00651198c300a69fbaada591a00beae3ab7325f2924beed` | `experiments/results/e2-v2/rejection-cost.csv` (`85a684770b4a3206f0661d9d7ed6dc716febc457f95b2c70a9beb657adc12b7d`) | npm.cmd run experiments:render-v2 | 2268.197 s |
| E3 P1 false rejection vs FUTURE (png) | `experiments/results/e3-v2/p1-false-rejection-vs-future.png` | `254d52aa5d0b35d1bad469703f6d6be8ff2cc9c075ec7d7abb58b239fbe5785c` | `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`) | npm.cmd run experiments:render-v2 | 933.547 s |
| E3 P1 false rejection vs FUTURE (pdf) | `experiments/results/e3-v2/p1-false-rejection-vs-future.pdf` | `6bd7ddc89410ea8c5cb72de8b2864af4f66b5961318d36b856e975c9a52e75d0` | `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`) | npm.cmd run experiments:render-v2 | 933.547 s |
| E3 P1 false rejection vs FUTURE (svg) | `experiments/results/e3-v2/p1-false-rejection-vs-future.svg` | `2490a9820bb883fca386de5c0a56b532e0955627cb39f5eb5c011101253af8a6` | `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`) | npm.cmd run experiments:render-v2 | 933.547 s |
| E3 P2 false rejection vs FUTURE (png) | `experiments/results/e3-v2/p2-false-rejection-vs-future.png` | `fb6b435d6935002837b545ad815b7488eba1b6e4dcd6324d6cedfbeb11c1a4fd` | `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`) | npm.cmd run experiments:render-v2 | 933.547 s |
| E3 P2 false rejection vs FUTURE (pdf) | `experiments/results/e3-v2/p2-false-rejection-vs-future.pdf` | `c8cb6b9be50d3eb2224df62f16f84e0255e746686963c42bbb88288ecfbb46f1` | `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`) | npm.cmd run experiments:render-v2 | 933.547 s |
| E3 P2 false rejection vs FUTURE (svg) | `experiments/results/e3-v2/p2-false-rejection-vs-future.svg` | `6ad4d4b8989c0df8317c35b73df572299284ca72e6bf0ce43d207d7c800d2dc7` | `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`) | npm.cmd run experiments:render-v2 | 933.547 s |
| E3 P3 false rejection vs FUTURE (png) | `experiments/results/e3-v2/p3-false-rejection-vs-future.png` | `b11b93fcd4e6a40403ec3b8f30f541958bc670aaa4c8ef5c6e301e426703485f` | `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`) | npm.cmd run experiments:render-v2 | 933.547 s |
| E3 P3 false rejection vs FUTURE (pdf) | `experiments/results/e3-v2/p3-false-rejection-vs-future.pdf` | `262fcabba64388073e5128d45aa5ec68122be173efbcb4a432fd80220b2b7a87` | `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`) | npm.cmd run experiments:render-v2 | 933.547 s |
| E3 P3 false rejection vs FUTURE (svg) | `experiments/results/e3-v2/p3-false-rejection-vs-future.svg` | `56471d1f3bae27a102387a6dd1239cea3242ae9f50c064f1dbae5affaae016c3` | `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`) | npm.cmd run experiments:render-v2 | 933.547 s |
| E3 PAST and replay-window figure (png) | `experiments/results/e3-v2/false-rejection-vs-past-and-replay-window.png` | `06677ac0fb93a96641eba5df1e6b0ce8131ef946ee8f8211f4b0763e6cd5606f` | `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`) | npm.cmd run experiments:render-v2 | 933.547 s |
| E3 PAST and replay-window figure (pdf) | `experiments/results/e3-v2/false-rejection-vs-past-and-replay-window.pdf` | `8540332aaa893797b1ce2a529331161b08ec8c83e01a4bd9e2c8c6879b2ccc52` | `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`) | npm.cmd run experiments:render-v2 | 933.547 s |
| E3 PAST and replay-window figure (svg) | `experiments/results/e3-v2/false-rejection-vs-past-and-replay-window.svg` | `5158e288a5e3b3683b6463d9c1d335fbd7edb9a4831a7fe40f24f12ba3c6a082` | `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`) | npm.cmd run experiments:render-v2 | 933.547 s |
| E3 summary (LaTeX) | `experiments/results/e3-v2/summary.tex` | `8707393eb1011a34f3ead25aab1d8b06c2352fc6c70cc769bd823c4513a68180` | `experiments/results/e3-v2/summary.csv` (`b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12`) | npm.cmd run experiments:render-v2 | 933.547 s |
| E4a TTL/window grid (LaTeX) | `experiments/results/e4-v2/e4a-grid.tex` | `5f5a5c8276f41c14c165e620b5f4b76ba25d5f9ee758b434975637bc2c46c61c` | `experiments/results/e4-v2/e4a-summary.csv` (`fa49f93c7f42408bf54deaa079b9f9ff84c1c21b396dcfbebbe855d25f19abf3`) | npm.cmd run experiments:render-v2 | 401.495 s |
| E4b fault mode (LaTeX) | `experiments/results/e4-v2/fault-mode.tex` | `025dea43911ad8467fa72eb257ef667f44b2d8ce949a6e8abc54868e0b187a62` | `experiments/results/e4-v2/e4b.csv` (`423ead4d881363fae853c8b2b34dddb9a78c6a7b8de252c54733731abd128178`) | npm.cmd run experiments:render-v2 | 401.495 s |
| E4d state extrapolation (LaTeX) | `experiments/results/e4-v2/e4d-derived.tex` | `52d849960b8d9865a6a281317e8551c3e9ff9e87b65fb1190f0039ee727b44d7` | `experiments/results/e4-v2/e4d-derived.csv` (`eff60fbb5f3beed1a33955c7365fed38b59974ff384dd7f1a6bbc422d81ec656`) | npm.cmd run experiments:render-v2 | 401.495 s |
| E4c corrected retry loss (LaTeX) | `experiments/results/e4-v2/retry-loss-corrected.tex` | `5d6318ed108b6312d9e32167ea1e2a146b506367e7305f71564e63606046d919` | `experiments/results/e4-v2-corrected/e4c.csv` (`7499a4ff04cfece23d1e1a8d87c1e772166478a30f82d946196b2d39086dbc02`) | npm.cmd run experiments:render-v2 | 21.666 s |

## Evidence inventory

| File path | Bytes | SHA-256 |
|---|---:|---|
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R0/health-readiness.csv` | 330 | `1267ae3093d45224aba1f239a792e122c4647f5499e73dc9b604e0db76793cfb` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R0/proxy-request-timings.csv` | 144384 | `75b4610ae57527ac67b760bec47830200be1f21835c482b835dd4c63e613faee` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R0/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R0/proxy.stdout.log` | 125 | `912a1306544325dda335f1fe28709e5dd7e4d4b558f1f08a0ada98941a0a73dc` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R0/requests.csv` | 190792 | `5d49ddcf33022bfae99ecb7594a444d0bc075bc59f7384dca1edb1bdda233607` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R0/server-timings.csv` | 268910 | `a11012d5a2d6c0754af02c452df228d019fb2de8ca05b1f1fb7e43d48fbbf61a` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R0/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R0/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R1/health-readiness.csv` | 325 | `442d3a62d63b9013bf295d47643da976de9df3d1ccfd5fec94613950a8ba2ccb` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R1/proxy-request-timings.csv` | 144269 | `c766f2865356e3d73434e3bf5965861e91829776edb8bc3b1c966c15c576ccf9` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R1/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R1/proxy.stdout.log` | 125 | `c84889ab78760c2b04df45aae5e1fe4f107ada75715147bf46b5df866e3abe2a` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R1/requests.csv` | 219294 | `ac50648142e512acad42c83e8574fdf83b0e94ef6c5b9c5c6b46bbab53b3e333` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R1/server-timings.csv` | 295499 | `c89c030ee2d37230ba111ee02f7b23f05f496a0be0c870d7e9991944b6f5fb01` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R1/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R1/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R0/health-readiness.csv` | 326 | `c8825bb09e10743b1a70c879d0094f7eae2127fa9182e5a310a5e1e89279791b` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R0/proxy-request-timings.csv` | 144211 | `4ff080a5a4bc8b00ad3965a0520d2121c87efc2d144e818575b1b1d31358c15c` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R0/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R0/proxy.stdout.log` | 125 | `c8a8ef7030b4d41c13ddce307a363940ebeda333d20fd59d68be5a823228a544` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R0/requests.csv` | 206479 | `8e203b74fd8facc668cbcfc4b9bc200fa2121570b9f545460d4eb48517c6eec0` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R0/server-timings.csv` | 282373 | `dfdb7bbae8e2f411bac6188ebe8da4940307f4f3c11337af480aaa5be6de9362` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R0/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R0/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R1/health-readiness.csv` | 325 | `e5304d1c23f5f4e7a7864ee1247a0f54c60dcba7f83ad61ccefdd109f0c901bc` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R1/proxy-request-timings.csv` | 144099 | `5ded4688ebf04859a400c788695e4bc9790c30d9c7f1886315f8e8a45b7a6546` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R1/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R1/proxy.stdout.log` | 125 | `85fde4a10c133fe382e92c6ebfe7c2c332cb07b7a1d137502e31b931ae87c54e` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R1/requests.csv` | 207870 | `f85c8b0bf7daed3999fecc97ac045361393545fead64a4b8e02afdfea8350dcc` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R1/server-timings.csv` | 288478 | `4015932d4bafc1c84ffe81fdd8f5ffe78abdc22510f8b69d3301cdb8e3728ac4` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R1/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R1/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R0/health-readiness.csv` | 326 | `f8e0f857e92d5e5ae47d45de9c77a16e828f6b26285153eb3764c982118d0427` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R0/proxy-request-timings.csv` | 144481 | `02297d1d98b7bed44b1ad806326778ae43290d9f1dd2a2bca4f83af56b79d218` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R0/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R0/proxy.stdout.log` | 125 | `d1e692fa967b236762afca112df721c6890b3efd2fb11d87705b6d6a5f7cd797` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R0/requests.csv` | 191262 | `db3c907d3d865966bbecde4db31326a492119911b7b05600272dc7fec46e736f` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R0/server-timings.csv` | 262864 | `4ff388621a2a5d297b572c57e6b2830bc8ac8260f7d58b46f931cc17dac0af9d` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R0/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R0/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R1/health-readiness.csv` | 385 | `431fba573b0f3d9907f1391df080128aef44c3acd781c348afaf76b2b1578427` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R1/proxy-request-timings.csv` | 144361 | `5eb5e0a966f682713d8172e97fe4503b169d7e54356db67cb3d0e7d6a0857b40` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R1/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R1/proxy.stdout.log` | 125 | `538bc43b6ccf5944c1e60701945ba53d1d32c5527a9229633304db2f7295327c` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R1/requests.csv` | 219238 | `1cb54942ee13deaf6f961a0c9302d9ea92db2720b2b31080379bb252838e8c17` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R1/server-timings.csv` | 289014 | `d28da5b213f876d2c266a32ee3189c3d67841204beb4936f262e540170600f0f` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R1/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R1/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R0/health-readiness.csv` | 383 | `fc26997589bf177dc92125ae4e4b1355cc4697c684163ba882d8ca44ce0bfed2` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R0/proxy-request-timings.csv` | 144487 | `6f2469aaaeaa6370b6eb90f2d158c906681833be7e439af66386d6d7c4e7bbf1` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R0/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R0/proxy.stdout.log` | 125 | `b03ea68804fefd3fd4c0fcc862e4257bfd99cb2115065b2ce55562f43b149f31` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R0/requests.csv` | 207345 | `0b91246338a8b2c7599664564edb98a40142760f94c5ad1a4bd3f7b555c57f19` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R0/server-timings.csv` | 278297 | `883888fb575fd4c7037b1f341ab7d5c0a449bcaf2376e3a5d25891558d687659` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R0/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R0/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R1/health-readiness.csv` | 327 | `b92f00be955047c94c7a6f3748e0a99ca9f509419432de97c44146aa51287cd7` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R1/proxy-request-timings.csv` | 144242 | `0f1d396710bf6010c4ca9f7723eba9e2677c12f619343696a078b491e9ff77d1` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R1/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R1/proxy.stdout.log` | 125 | `d3ae54a680058815872c13e1d11e4ad48c98a361f6fae98d12a772fcc53976a4` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R1/requests.csv` | 208076 | `04539529264706bf446ebe8d6202e809dc5709d93215f7b9bcb4a62d71e0662a` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R1/server-timings.csv` | 283443 | `827b0719901d268c6a5624654b57807afa6ed3e45bf8109d6264094d067648dd` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R1/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R1/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R0/health-readiness.csv` | 327 | `2f3cafaa80a7f3d88cf7e73a4520b610ed79c662b6fef1adf1fce70709ed2259` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R0/proxy-request-timings.csv` | 144456 | `5c4efc82f42b23eeb365fe17e96db98f237986b293dab2f9cee03d421c1b3628` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R0/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R0/proxy.stdout.log` | 125 | `b872165944c69ceb0171812fd0319811efe8034ad56a5fb2553b91ce96cb083d` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R0/requests.csv` | 192122 | `bff2634e5fd729139daf49d58c27b43b5b39a1f8236fb36e74f8540a26e0cee7` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R0/server-timings.csv` | 264976 | `52e38a32a0e64d90bddd7befb45a51f78284d3386c86dfa8a8beef6373830774` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R0/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R0/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R1/health-readiness.csv` | 327 | `4a32681f8eb94711fb12bcdf991d85db14b1c021797a44961fbda9c77d333f1d` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R1/proxy-request-timings.csv` | 144374 | `8ed384f167cdf793269d40d86528c264bafd26dcc0c678b142c9a8c8bbe1b3f1` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R1/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R1/proxy.stdout.log` | 125 | `d499ebb4aa6afb9b94dbf3fa7d6ab6cf32444ef45065c7a7af9bf5ba2fb52025` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R1/requests.csv` | 219615 | `2bfab8847af002781f34c33cbb0fd4eae9d677bb045208229e8e812806d88da6` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R1/server-timings.csv` | 291076 | `c7215a4cc148b42cd07abd1df76a3a72b25e02368ef27bf34b9293b2f34e5384` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R1/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R1/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R0/health-readiness.csv` | 326 | `734bc55832f6e9c3753e6db09839785f013f212a6cf249353928607ba53625ad` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R0/proxy-request-timings.csv` | 144310 | `c01f9957e063e70ba9dd4acc23b6537e90a0c861cad6cf836c16c35864579852` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R0/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R0/proxy.stdout.log` | 125 | `b6e0cd1c04d1b250d5e3ad7d1226a0e24fcfa2cd71cf21211f64ee7adb87846a` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R0/requests.csv` | 207198 | `d29252265a68a0c90ce76b49229823c364496a41523bb3d91b0d8542e23cf123` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R0/server-timings.csv` | 278401 | `062e80c3b5a6644858443da9240219025ac572329492b67ef9a6b514a851e14b` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R0/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R0/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R1/health-readiness.csv` | 326 | `214c92b2bf3a3cb5a360bf34d26cac04db25a3dd003c650274913c5fcbad00e9` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R1/proxy-request-timings.csv` | 144199 | `a7e980a3108f004752085ea45b27728f7ce7b018b752fbb3da60876dd6ae2794` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R1/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R1/proxy.stdout.log` | 125 | `5952bdbb5b7ac8d747209284feec1c0f5d5342f09f7b8f72f3a33338018da75e` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R1/requests.csv` | 208155 | `c9da1586a534a8f80be176ca8abb927cd969d6e955702a7517de3f8601b7f048` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R1/server-timings.csv` | 284096 | `8c4b6f15643f0f591b8863218e52de3848c168564e5f2888a7a5adb4514d61ef` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R1/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R1/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R0/health-readiness.csv` | 439 | `1924130d43deaa1ced5e1292efda00e033390c1d1cf21d07eb91e717f36047e2` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R0/proxy-request-timings.csv` | 144503 | `045b5fc44fe5705b9f7c1aa69aae7e2e1536abceedeca0203bc5a515460eaad3` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R0/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R0/proxy.stdout.log` | 125 | `2235db745899147173c0d38a338687d82bb268e52808a99d9d1804ff19d4310c` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R0/requests.csv` | 192515 | `1b2263f450a8eaa0e5322c672ac1b7b116858ff4e5e2d05e267d343a793e1c76` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R0/server-timings.csv` | 259769 | `fa0d1a60749102e9213fd12b15ce3097080e7303828971e8ab5bb7cc1d2dab69` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R0/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R0/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R1/health-readiness.csv` | 327 | `639d9114ea50cbcbe2ee935b8b6f3d2b4683efb66d75a6b57c5c9c01cdcc7eb6` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R1/proxy-request-timings.csv` | 144261 | `d8cde57dbf02a78a17cda39337ff312b691be286a386571717b50a179e3ec250` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R1/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R1/proxy.stdout.log` | 125 | `83f870eda11d459186a8299cb494478ca7ac8513c72bb098fe9526c2ca042a97` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R1/requests.csv` | 219342 | `a7c8ff59f10cb47ef575140e21d0097b03f74b44245ecf86189eed0b2b5a4918` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R1/server-timings.csv` | 284989 | `917daf64adf98e06221c41388da6921680de3ff16c5c4aa79394012e1aedb7c9` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R1/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R1/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R0/health-readiness.csv` | 383 | `e15649e227aaae8b6973499317c2eb1792987b49e56c35ba6427f3af6bdbcf2a` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R0/proxy-request-timings.csv` | 144265 | `26628594c472e8e94290f77c47d1234116a5523edde036936bfb995e2160a257` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R0/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R0/proxy.stdout.log` | 125 | `d36b8edfea56f3559f251ff4bde6be35ea9bfdf051745866ec700a6c9e6021bc` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R0/requests.csv` | 207746 | `69d1bac2e42149336c3e6275d9966f912c8c72a695a4300972f873848e0d5abc` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R0/server-timings.csv` | 274567 | `1bba0c29f01ef083d0608d78bfbbd7657e3793fd57586378563f6caca2f4e72d` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R0/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R0/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1/health-readiness.csv` | 326 | `84bc4d4d29f2e57c6a93a480dcb968e4acd36fce0782ae396c57f8efbbccba66` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1/proxy-request-timings.csv` | 144506 | `25e6e6403f00ed0a0f7eb6167df2552306241090209c8311d42c4686fbf5ba70` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1/proxy.stdout.log` | 125 | `3651f4f3b21827cf2509384877cdd50617813f31c1dc6c1f65e1761e1f7c5175` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1/requests.csv` | 208502 | `59903bdd1ab1dc3bfb49cd62587044ff4fc0678f605db78ac7716728388a49a6` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1/server-timings.csv` | 280408 | `b5005f6920b2e61a838be51475e62d135847cb46b535bb039713e1f872f91dce` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1-DEFAULT/health-readiness.csv` | 384 | `eed0378ba51e6550c38b5f30bc6b14f0e29359b019c3dd9bc976d04a9871ab08` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1-DEFAULT/proxy-request-timings.csv` | 10117 | `af55fc626faebf4a671192d8fc224970145d87c29d582d1acc127bd49ab32e9d` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1-DEFAULT/proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1-DEFAULT/proxy.stdout.log` | 133 | `2fd9bab41a09a0b1b0599460b06bebd57a506ebc859fa91fc63d18a3a3c7a9de` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1-DEFAULT/requests.csv` | 18268 | `a0785fd266d29402fa9e1685c49f92df3db2b9fd82c476f50ba8b16777f0bd43` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1-DEFAULT/server-timings.csv` | 19815 | `e4af2e4e56a4a31580852ee3ae8f01fa16e3caf757136dfc3b673095480bf4a0` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1-DEFAULT/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1-DEFAULT/server.stdout.log` | 84 | `3000e93e013446093c968c940c1e5492842dee8fd652d9b21360560471523095` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/run.json` | 129336 | `77bf89428090a1f756f2e37cae4feba55e2eab1fcd14515585cdc3aac1a777c2` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/summary.csv` | 19924 | `d24bdccf210d02995691ecc4e3b0a37ff451e0a11ca0ad14613d2c939076835f` |
| `experiments/results/e1-v2/2026-10-18T13-47-01-319Z/summary.tex` | 11557 | `747ff8d779ed9868b687e70f252e6ce6408aac7a0b6ae5095b962f07bb73c3f5` |
| `experiments/results/e1-v2/attack-success-heatmap.pdf` | 28145 | `b918120f56d80e177dc2bdc20372f92f3e22ac5b109d6873885b25769b1dce6b` |
| `experiments/results/e1-v2/attack-success-heatmap.png` | 176785 | `3852a52218cb3a8447fc019e9a76939b50255a5bd2c11ca25395b676b9778c25` |
| `experiments/results/e1-v2/attack-success-heatmap.svg` | 147277 | `7c0f4e94a5caa77826b1825025eee943b3c6ac25ea13a5603036143d60d7a60d` |
| `experiments/results/e1-v2/coverage-matrix.tex` | 1967 | `637a1f84d95074d55e0b1403c724ce2525d85875fb2b6a4221ed264493dbe4f4` |
| `experiments/results/e1-v2/oracle-total-debited-by-scenario.csv` | 29867 | `36ce968954e3377ae404306db6b78141f459bfec6ee224430e4adf9c8a05bab3` |
| `experiments/results/e1-v2/run.json` | 129336 | `77bf89428090a1f756f2e37cae4feba55e2eab1fcd14515585cdc3aac1a777c2` |
| `experiments/results/e1-v2/summary.csv` | 19924 | `d24bdccf210d02995691ecc4e3b0a37ff451e0a11ca0ad14613d2c939076835f` |
| `experiments/results/e1-v2/summary.tex` | 11557 | `747ff8d779ed9868b687e70f252e6ce6408aac7a0b6ae5095b962f07bb73c3f5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-bad_signature-r1/health-readiness.csv` | 326 | `acc6ab9f329aad377084f8bf7b0b61e3ef41c397c8f750e853a90ae041a5924d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-bad_signature-r1/layer-timings-rejected.csv` | 498392 | `c496f4371bceae51dc1f897312c0e187fca62563d002ae7ffa1b063c22b3b643` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-bad_signature-r1/layer-timings.csv` | 498392 | `c496f4371bceae51dc1f897312c0e187fca62563d002ae7ffa1b063c22b3b643` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-bad_signature-r1/requests.csv` | 316979 | `f8401b6892bf546fd678fd6ff049925f235a17fcd8d6faf507a3f35a99f845df` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-bad_signature-r1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-bad_signature-r1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-bad_signature-r1/session-setup.csv` | 123 | `aa7edeea3bee8cb254206a5e6f525b48461d067aba8a7ee95df5db307493ceeb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_nonce-r1/health-readiness.csv` | 325 | `f6c18c2a363b8eba41e821e768d1eb062ced062c717f59a3f8f78774c3d0007e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_nonce-r1/layer-timings-rejected.csv` | 464855 | `182a09a33ae204781ea7ca24575e416a83a8ea2dfd355af0f63df8ade668815a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_nonce-r1/layer-timings.csv` | 464855 | `182a09a33ae204781ea7ca24575e416a83a8ea2dfd355af0f63df8ade668815a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_nonce-r1/requests.csv` | 311079 | `1eb96fc353dfb3153d82459fe4b70224b822a5f224f0fb09f6269701bf01df4f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_nonce-r1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_nonce-r1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_nonce-r1/session-setup.csv` | 123 | `b2c9cc6c7e52172d240232fe4c07fef1d4ecb53198d086a58908b745d991a5c2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/health-readiness.csv` | 325 | `2225ad0abb1de31782738ad1841805f80723c996bee9d0ef1552f5aad5525070` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/layer-timings-rejected.csv` | 502802 | `172e175cb044ddbcaa9775538d073a233418b7e024d68731617d84bab690206b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/layer-timings.csv` | 502802 | `172e175cb044ddbcaa9775538d073a233418b7e024d68731617d84bab690206b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/requests.csv` | 347086 | `9c975c378b4eb893c96e641f81973f75d12b186d0ccaa9ca00c5906cf34fbe34` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/server.stderr.log` | 200 | `868bc2a6b069d752dd01f4addaffc3c6e9ded298003f9daee1e40fd6142da278` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/server.stdout.log` | 1303 | `d4fbcf13d69bb7ea9c92e655cc91143fe7b709df3624d7e5f086b6009cfdea0b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/session-setup.csv` | 123 | `b1c0ed522f7778c13723a6e7308e89faa6c28ea8520887b8841113923c48134d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/health-readiness.csv` | 327 | `26531c5caa251e0dbb073619701a0a753c0cc0e0d307c79e318d1df527e68e96` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/layer-timings-rejected.csv` | 502701 | `e2841b1e0202dd3b9968ae9ce2ee40923bea80112a84d1bc38427609986ba9da` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/layer-timings.csv` | 502701 | `e2841b1e0202dd3b9968ae9ce2ee40923bea80112a84d1bc38427609986ba9da` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/requests.csv` | 347085 | `a2905c9bfa4903337754de1d83b0a304adde7fac80f12d2dbecb77ff0565a668` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/server.stderr.log` | 200 | `96bf0bf291051b713ad92e75080ae8af1bb1089f3e96b8033df6fc56475fac7d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/server.stdout.log` | 1405 | `498ba7cccf60eb6a68b68176b91480f767f5130b2ebab654ed2aa2ce1b80b88d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/session-setup.csv` | 123 | `8a8aed053d4268f0f31f3ce1c92a0e9596d30ec2b1f5aff667b7278be7de5f5a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/health-readiness.csv` | 325 | `cd9bcaddb64243f3e717d683af73fd484da3a1bd6f479d46bf14be76b4f2c849` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/layer-timings-rejected.csv` | 502749 | `17c64ed3404c7417cc86076b022fb8f44b4a5d158fb4869cc253d25d3ed5f079` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/layer-timings.csv` | 502749 | `17c64ed3404c7417cc86076b022fb8f44b4a5d158fb4869cc253d25d3ed5f079` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/requests.csv` | 347085 | `5e989bead9d8f93a4207729e7f417dd3ba2cbfbad95e492d9778b54774834659` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/server.stderr.log` | 199 | `b98f55a331705230282ace932b85fe216c85526ff5e7c5c713824352dc193fd5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/server.stdout.log` | 1401 | `6cc2c61f583448bf2a6093a6576d908f7c51494d3ac88bf719840660dd3177f7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/session-setup.csv` | 123 | `6e086eda54d12f1230a661aaf21d6f5db1b9c48137ba17cc459a167948d45c8c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-stale_timestamp-r1/health-readiness.csv` | 325 | `4e8b0396f73956dae4810653741ae0435be4c521a8e4ed2848fe963f5d017acd` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-stale_timestamp-r1/layer-timings-rejected.csv` | 490861 | `bbaecddbeb46f8bdd66a9ed24e675793801edeefcf467c55af1869e859a5ecec` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-stale_timestamp-r1/layer-timings.csv` | 490861 | `bbaecddbeb46f8bdd66a9ed24e675793801edeefcf467c55af1869e859a5ecec` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-stale_timestamp-r1/requests.csv` | 322908 | `7712886abf861a3b2eb77e8b5f88a6505ab6141b827ec175d849c41fd417864e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-stale_timestamp-r1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-stale_timestamp-r1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-stale_timestamp-r1/session-setup.csv` | 123 | `5dbae5f368006e60b9c975f045cbdee42474cc345ef3c600344d79b914a5f344` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r1-c1/health-readiness.csv` | 327 | `61137dd753c99ee5446eaf79178f1af2820403bb212a008224ffad513843c148` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r1-c1/layer-summary.csv` | 565 | `69ea4ef0a0a28a2b913a508579caeb12c759551e5fc4c262a915db9109436356` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r1-c1/layer-timings.csv` | 386464 | `281030a678aad5ab7c5ea3b5178f0cd00567098d18d9eeea481d599d5c4da2c7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r1-c1/requests.csv` | 178959 | `f15b13ac1e470d6a332d745ad4a0e3d438cc0b06dc1e88911e2171c5484cceb7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r1-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r1-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r1-c1/session-setup.csv` | 123 | `6a4291daa65a17b45318f00a4d46e24effdeee2255b32c221bb0bbc37c21a43b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r1-c1/warmup-requests.csv` | 29450 | `34e5d7511cc7752f154a076882853bd5a13cfd9dff99a043ceae40c6769de1a8` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r10-c1/health-readiness.csv` | 327 | `6444c7a05f162ef26d1ec90937bf25dc3c0923866dd2bc9a9139cae77ac38a5e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r10-c1/layer-summary.csv` | 544 | `8594d2e2543bcde967eae17e2041a9e3919de9b44266cb3274add5108e22f657` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r10-c1/layer-timings.csv` | 392107 | `139abcfd724b23239b1c898e4c4599932ae815f62893b6ea85980ebbeccb47ce` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r10-c1/requests.csv` | 179091 | `7786fc60f221427b0d1fe1c4352b4e0e6413b49c326c866a4478aff581b71dcb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r10-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r10-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r10-c1/session-setup.csv` | 123 | `fc97dbb66571e8f8ae8f7df8293218618cdcfad2b87862558f7c47034da4bfcb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r10-c1/warmup-requests.csv` | 29475 | `1b0e0cf804f0a6392de6a126bcda3c3694f9ba220032fc43391e84b04f800fec` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r2-c1/health-readiness.csv` | 326 | `e31288eaff15fa661bc2e055e3310b78727bf2a714346a417c852d9a564e7f90` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r2-c1/layer-summary.csv` | 565 | `e8b9169e14d94e2d0e4ae69321323f14ce10c30cc941297e1e7ffe2826a8139a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r2-c1/layer-timings.csv` | 387107 | `8f227ba7a8ba5dbdebd9a87a4e3bd59024d0163a15f8dd01a3947ef5b9a4985f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r2-c1/requests.csv` | 179098 | `8298ed15d75803d3c949fb37e78a124458bf1b1341bc2687b16a442e9921618a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r2-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r2-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r2-c1/session-setup.csv` | 123 | `7044c3f776e71c7ae1643d9141c75c422a285378415ab7b655149521283cab2d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r2-c1/warmup-requests.csv` | 29468 | `9b26a5d6d49ddc5d6a89af601da1d6c2b81fc74a9377f97603e662a574652198` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r3-c1/health-readiness.csv` | 384 | `2baadfe99a7c1c7f087043952ea69067a51e0af105e31f4307bee4efda4d7163` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r3-c1/layer-summary.csv` | 527 | `d0cc5398e009f20d69d5388e5a36dc081258fe45fd9eba2f4937dd013e92d9db` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r3-c1/layer-timings.csv` | 387043 | `073fdf6d580a4e121e309c6e46ed52f49dee3fc6579aeea20db88f87aabb84e3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r3-c1/requests.csv` | 178968 | `ee5876217303f189d995aa95a8677c259f49ca6328bd4caaee4eec1251238d3d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r3-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r3-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r3-c1/session-setup.csv` | 123 | `d53c0bec005fc65ce2df95d99573cdc748ad4eced47e69dcfa10489f3a406941` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r3-c1/warmup-requests.csv` | 29454 | `6c923037e5732bc914ce55ccbf840f8fbf9c36cf7aef73a964524231ed3a2453` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r4-c1/health-readiness.csv` | 438 | `ef46b9c7c210c5d6f75807b6e9ce33728579a83ce9c6b3f0c7d00b67e3ae14bb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r4-c1/layer-summary.csv` | 530 | `941a6f888fc7c2051afae064dda3854a99b63d0d6f61fd7091a1594845e0f824` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r4-c1/layer-timings.csv` | 387366 | `b4b43df164f66eb567ba54cbf99d2b8d28f31ac23c4521cdb6b7c65e540c0438` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r4-c1/requests.csv` | 178981 | `e135ee0443b537e03ffe95a13f2fdf50eca26cea5ab3810dab4d3ae0a48528be` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r4-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r4-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r4-c1/session-setup.csv` | 123 | `a88d1381e42f5cb790a4cfe72ce2102d62528b7125f64bea99da35de467f13da` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r4-c1/warmup-requests.csv` | 29450 | `62c3844f0e3f5b33f9479def85e6eae7797e653bdf96b540a32373122b397ec6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r5-c1/health-readiness.csv` | 383 | `8289abc2529e79957cb95c6a84a2c5cb908ec1a58b44dbe62b5129fbe934bc4f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r5-c1/layer-summary.csv` | 566 | `3055c87674ea5831f6dd0c97aef5298ab47b0db732a9ad0d3c4028f1d276eda0` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r5-c1/layer-timings.csv` | 388723 | `7b20005d27cdd7ffef711927060bb8f089be689e14d228b7d47e6e0cfb343f34` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r5-c1/requests.csv` | 179125 | `4a67bf79a7a7e80e9bb9738a11689b3b077568960743c98ef51ac26ef23ab54b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r5-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r5-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r5-c1/session-setup.csv` | 123 | `93ab822ece23157ccefe9410a9663f2f0bf605dcb59315473c5d68884db96978` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r5-c1/warmup-requests.csv` | 29491 | `48a8c6ec8e367eb551c803a99b8977df822d26b7c149191d9d4cec494f64e720` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r6-c1/health-readiness.csv` | 384 | `d807921dc448868f81a6753487c603c1f6940d47a5be9e9ef0241cc6e162c5ff` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r6-c1/layer-summary.csv` | 564 | `bfc176fb9a457fcdf86fb192585497601d238f00dc8bb03c0adb6089aa2163fe` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r6-c1/layer-timings.csv` | 387165 | `9c7803ff266e2d22c27eae030843f6137b217b468884a800bf213c143328fa18` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r6-c1/requests.csv` | 179153 | `9d70ffa429dd4045cfe1ef7f81566b02499988099830f831aed4c6afd2a168bb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r6-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r6-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r6-c1/session-setup.csv` | 123 | `fbd9f4586cb49f530ea63e969d2816bf8813b3e895d626506aa1bf61ab17838a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r6-c1/warmup-requests.csv` | 29484 | `6e6be3573580f2a9b592ca1e7217c30c1289e0f4cb70e6220783898192fb3011` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r7-c1/health-readiness.csv` | 381 | `1eb98b06eec8aac221fcd1481ff553d19bf0d8f513d875c2e55d84655a9745bf` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r7-c1/layer-summary.csv` | 517 | `896201b131bb8539cb2b6f88a11b769af16f7fbc92bffe9266e27ef6a76601ff` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r7-c1/layer-timings.csv` | 388719 | `228d77983978e36090b015f8912540a08948779517da09d2c74dbcc958268e82` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r7-c1/requests.csv` | 179110 | `a4b0127bf197281788ff3c43d93bd742158fda8221a696ecd3333e6e14a642e3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r7-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r7-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r7-c1/session-setup.csv` | 123 | `9e4902e824f139558ad46c374fdce5986939d460bda442c80b17d042958f5057` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r7-c1/warmup-requests.csv` | 29489 | `76592f7c1ea2ad350907d9946bee2ade5ccc1e86de4ad5e5b5b02b655de6a610` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r8-c1/health-readiness.csv` | 328 | `86705c68167835bbfaa67d71aa077fd4bc23954fcd878f8b8ba3f3ab0ee6c54b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r8-c1/layer-summary.csv` | 565 | `624ee6655e0953657959e4306afb52fa70095f0b576d30c207d78f42a10c0758` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r8-c1/layer-timings.csv` | 387371 | `78620bbf827967016aac27678488efdaf87a69d1771265443794e7dc4be04a2d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r8-c1/requests.csv` | 179139 | `9274fc571c14874a930ab6dfbb10a72e3e918f218c468b709f1eb875f10adf5f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r8-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r8-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r8-c1/session-setup.csv` | 123 | `1797af3878568ec3ae4f46bff78c261f417e6c8f42b3b10ef501b3141463b8d1` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r8-c1/warmup-requests.csv` | 29476 | `cf4b898d22312e527b7bb88f846d82847ebb56d1206bab71c64d457bf89b877b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r9-c1/health-readiness.csv` | 326 | `7ae32393355bdef1cdec6559d2c1899132039f76ec80626b89582f3a405b7fe6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r9-c1/layer-summary.csv` | 538 | `7068a74c50e3609895a3060c8690f428afc711f780555b87a93f3b387d4d44ff` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r9-c1/layer-timings.csv` | 387437 | `c784e42acf29ff5ef54a50d90f46c2173acc58b12db2210307df7cf10c8bff9b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r9-c1/requests.csv` | 178972 | `548e29fbd2f5e1012ca1052d24cb7b4a0a8a3beb5cf52750757195d734c96e35` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r9-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r9-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r9-c1/session-setup.csv` | 123 | `9cbd070ee9c153d45e57f210c76c76fca67860086366b9b8bcf9670ae8f21c2c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-r9-c1/warmup-requests.csv` | 29450 | `e60f8e09a017fe399df0095b422ac4d20bf5f4987ca4ac668ff9668f614338f9` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-bad_signature-r1/health-readiness.csv` | 326 | `ccef20c96ac4e206c86d1bc5fce771910c91a1083e7b30be594f9c5a8a99e2e1` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-bad_signature-r1/layer-timings-rejected.csv` | 498422 | `6e67cdca313ff5a612a8c5a2c4e153a4fed09c5eca7c43e34ca6f5c496df3d8a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-bad_signature-r1/layer-timings.csv` | 498422 | `6e67cdca313ff5a612a8c5a2c4e153a4fed09c5eca7c43e34ca6f5c496df3d8a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-bad_signature-r1/requests.csv` | 364978 | `b2c618d51ec0c9fecef3f666415c7376a31a2c517e2c5460a5c7c10255588423` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-bad_signature-r1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-bad_signature-r1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-bad_signature-r1/session-setup.csv` | 123 | `c9deb2044be00f812d9e69822aa36567397e8555e355491b9b628e39e71acf10` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_nonce-r1/health-readiness.csv` | 383 | `8bc2c0ada6bd162c204a81d38663024e3f37a7d2ea305c36ae7e7ff44288fd74` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_nonce-r1/layer-timings-rejected.csv` | 452226 | `64cebcccf10d2cb4cf186f46e742310b24f5a68d0abc634127e88853b7bd7c55` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_nonce-r1/layer-timings.csv` | 452226 | `64cebcccf10d2cb4cf186f46e742310b24f5a68d0abc634127e88853b7bd7c55` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_nonce-r1/requests.csv` | 359102 | `142f3cc01d806aa161dd1be7b05962dd9f525a4dd8dd6cbbe5c06a6b91ffd102` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_nonce-r1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_nonce-r1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_nonce-r1/session-setup.csv` | 123 | `6aa4b34f62a86aa8eb9d34d34b40ce6f73843b94bf9e85d9a690b7c23161fed2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/health-readiness.csv` | 382 | `57436d0d73613895365ab617a61879403faf23f2f38df6031d2f7d2d96505497` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/layer-timings-rejected.csv` | 517089 | `11bf8c5d5b938a823d19b93db40dd9039cf86636e149dae936c05eee6a272006` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/layer-timings.csv` | 517089 | `11bf8c5d5b938a823d19b93db40dd9039cf86636e149dae936c05eee6a272006` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/requests.csv` | 395100 | `0ed083acf36cc712ef9af0cbd1a27dd14ecc2cc5d45c82c5ab785bb5e1c13ba6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/server.stderr.log` | 200 | `2ada3af483d82f39b1f6ca806260464f29d5882f4f2cec7e24ae4004553101f7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/server.stdout.log` | 1303 | `99056d28c4904d88b91852dd4e9096ffd1a5727230b3237287cb3624f16a4cea` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/session-setup.csv` | 123 | `0480dc8f40090da80fb8ff1b4d3899a315df67065ac7a82e232748993288bb3f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/health-readiness.csv` | 325 | `10ea22157e757a607a4afcf9b518a74a54714b211b72e897d32f21d5c321352f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/layer-timings-rejected.csv` | 517228 | `72cd27b50bc53eb0faf893f3f08323fb3d667f6cf36f52682d52c3026a6ad350` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/layer-timings.csv` | 517228 | `72cd27b50bc53eb0faf893f3f08323fb3d667f6cf36f52682d52c3026a6ad350` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/requests.csv` | 395101 | `cc7355e6b75121d4d8d8a41c8d58794a10ddd4812c1cd5142d6545add9683d9b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/server.stderr.log` | 200 | `0999e7d93e63bae7b406786400b12dd91c7601a282b7db6878102d229ff860be` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/server.stdout.log` | 1197 | `f84914b21932ff70530cc24a98939816ffed449c5bd91bc51622ab9b45b98181` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/session-setup.csv` | 123 | `c9fcdbbdbe0cedb2d753d7d0b6c7c4f71e52e40869a8356fa5f61f4e45574ff6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/health-readiness.csv` | 327 | `fded75986cca3c8a7962ca5fc4d7a19e97da99895f30d8af598689924bc53321` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/layer-timings-rejected.csv` | 517769 | `47a3590b56f977995a25ca4f6487727ab40636a3d01f8004c7ea4c11c1717e64` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/layer-timings.csv` | 517769 | `47a3590b56f977995a25ca4f6487727ab40636a3d01f8004c7ea4c11c1717e64` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/requests.csv` | 395105 | `0741933f5a8dc15dbde64da3f56932e511c445b2186abbdda63b09adf3d35739` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/server.stderr.log` | 200 | `204742c0088b61ef96dd5d5b68e2508d6fe2603154045a1b93afe7b77c74a997` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/server.stdout.log` | 1096 | `aed47555a8e4a2c6baa5e8fc757183863864b6a8550bb33d99e425c3551ed53f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/session-setup.csv` | 123 | `aee1bd72df6730dbdc71a36727a3eeaf128c02e2ae7dfae9a6227a836716c07e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-stale_timestamp-r1/health-readiness.csv` | 384 | `c96f1f2f491bd8e5b2cadc31450996d0ae1839f48c2a8a9a35b715bf97a270ba` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-stale_timestamp-r1/layer-timings-rejected.csv` | 490829 | `52d56d7377edd8722ea4c26829858cbc1eca245519037353a770123629ec1817` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-stale_timestamp-r1/layer-timings.csv` | 490829 | `52d56d7377edd8722ea4c26829858cbc1eca245519037353a770123629ec1817` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-stale_timestamp-r1/requests.csv` | 370980 | `ef2ce31daa8056f3a606810e9bf3588f014add243e78af9d1daf113f002e36b9` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-stale_timestamp-r1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-stale_timestamp-r1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-requestidbeforenonce-flood-stale_timestamp-r1/session-setup.csv` | 123 | `3c41fe20d329104a1f977d0ffd6189494106cc512fbfba37c0f9c0afcedf9872` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-bad_signature-r1/health-readiness.csv` | 326 | `f30db269febb105680296dce805a0122b87e7d696a2c9ae67f764708576f62ad` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-bad_signature-r1/layer-timings-rejected.csv` | 479260 | `56d9138514ace7c5ae4f17b711f638661583a5c48e8a613d280f51fb73f5cd3d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-bad_signature-r1/layer-timings.csv` | 479260 | `56d9138514ace7c5ae4f17b711f638661583a5c48e8a613d280f51fb73f5cd3d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-bad_signature-r1/requests.csv` | 340980 | `cab884cd6b99af1c08eafc51fca6a451ef474abc2ddedf975b1d9feb2d8db0af` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-bad_signature-r1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-bad_signature-r1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-bad_signature-r1/session-setup.csv` | 123 | `08ea5637d618682d93edc6a3811e178b41a820f0953ac9e1edcf4c142df323f2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_nonce-r1/health-readiness.csv` | 327 | `c0331a7c8c69d86b4d888769102ad43ceebbe5ce878a1d809d3cd9f9102ec8ca` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_nonce-r1/layer-timings-rejected.csv` | 468043 | `ce4ab3d488ef742bf6fd53984423318196625bdfbb1cfde33917ae01f3af4fb1` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_nonce-r1/layer-timings.csv` | 468043 | `ce4ab3d488ef742bf6fd53984423318196625bdfbb1cfde33917ae01f3af4fb1` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_nonce-r1/requests.csv` | 335089 | `7cd65eb86285247bee34f00398fe4e60a4a437571aa1dd6fa2ae895bb7331851` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_nonce-r1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_nonce-r1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_nonce-r1/session-setup.csv` | 123 | `709fbde03e3a3583a017905f4c5a1164339432ffaf9c23bfd86027209dab379f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r1/health-readiness.csv` | 382 | `fc781c4c6725c13080531ffc61d6cd45674ca43b4d2f6ee9c1adc950a16b59c7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r1/layer-timings-rejected.csv` | 503231 | `7ddb153c1c887bd1aec1fc20f6671d975f04939d70504b0f74e9e3d09c363125` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r1/layer-timings.csv` | 503231 | `7ddb153c1c887bd1aec1fc20f6671d975f04939d70504b0f74e9e3d09c363125` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r1/requests.csv` | 371096 | `f44a9c40e3540cf039bc7f6a581b4dd97513bc8dd3d87cb1e1a95bddaaa39a46` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r1/server.stderr.log` | 200 | `865cb4b13428bb4326e835b20d90078acf41230594c2bbea26fac336c2104b5c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r1/server.stdout.log` | 1405 | `c52e93fbc6197436b8d53afa99513b6e009d008b3049746da879ad928c842967` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r1/session-setup.csv` | 123 | `8c08fad9a8da3d22e8da0a0158fc472b7bed0b4b67cfd3d402a9752b390224b1` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r2/health-readiness.csv` | 326 | `33e0da75be120f70621b7f628c0adbde36383e068a0f3979924e42653e3aa1fb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r2/layer-timings-rejected.csv` | 503003 | `5e05e4b0f12bf55e5420c9da510f8512e37b0ebeeafeb06ad85360aee5940794` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r2/layer-timings.csv` | 503003 | `5e05e4b0f12bf55e5420c9da510f8512e37b0ebeeafeb06ad85360aee5940794` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r2/requests.csv` | 371093 | `5a36843e1812c5e35bec8bda5c955447b6d736da7a0b98974bd5ff326b574c84` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r2/server.stderr.log` | 200 | `de3b094111f46e0ca0468c69d7befa8e2088dd377c15aedd872310006bb7ce51` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r2/server.stdout.log` | 1402 | `4e79c646b404ba5aa6ee434b4b496a4b670baef7f05f44a18573515ad55b47c4` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r2/session-setup.csv` | 123 | `c331f2fbc03826ab4e35830fa7904cfda2dd49eb168bba3774dcaaea77fae00a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r3/health-readiness.csv` | 325 | `750758b86c928ba54706d45907f9266797ecb10a6399a44ab50eebf35b817505` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r3/layer-timings-rejected.csv` | 502912 | `f3419b94af3be1beac7a73f3fc5cc5141cf0989c9b6293b1fa416d2594d85d4f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r3/layer-timings.csv` | 502912 | `f3419b94af3be1beac7a73f3fc5cc5141cf0989c9b6293b1fa416d2594d85d4f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r3/requests.csv` | 371093 | `36b04f9e900b8d2f297ece6b3436592402394c93a397bec272a63d46f3ecd3bd` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r3/server.stderr.log` | 200 | `364658fa57eda4ec9fa7b501943417285c8baa844720a41a5a5484954f6e3786` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r3/server.stdout.log` | 1300 | `261342b14b37f188835ca9e7539bc56e5fdf86d889f9c76c405f3967c65a4779` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-duplicate_request_id-r3/session-setup.csv` | 123 | `45579c11b88fde1d60b03d3f96fa9ef8f3331c99de3134683dfbca81359c365e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-stale_timestamp-r1/health-readiness.csv` | 327 | `f41a16b0ae7559d22f457f62539dd0ffc128cbb60c02466b780366a7f4fb368f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-stale_timestamp-r1/layer-timings-rejected.csv` | 509885 | `8d77ebe4960eddc2f27cdc16b07291f1db10f71938dbcdd8dff7866493991144` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-stale_timestamp-r1/layer-timings.csv` | 509885 | `8d77ebe4960eddc2f27cdc16b07291f1db10f71938dbcdd8dff7866493991144` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-stale_timestamp-r1/requests.csv` | 346982 | `37c4ff3e0a516527cf96ba3a92e8d8b45681e170556c86cb691f347a9bfbc2e8` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-stale_timestamp-r1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-stale_timestamp-r1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/all_four-timestampfirst-flood-stale_timestamp-r1/session-setup.csv` | 123 | `e6b55e898a1c59119a1ac0a9b85d4d340720af5b0b01ed8cd631512b728ef9a5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r1-c1/health-readiness.csv` | 325 | `9d0dffb3163dd9ccc219632d0d8a20f9f02176e126f1017ff1a8176f88e5c55e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r1-c1/layer-summary.csv` | 409 | `4e04f9dd249684a2a58f86065ce5f9f4195df030defe5a1ef1cce1280de8cd01` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r1-c1/layer-timings.csv` | 399402 | `00bf80ea0f9fd072ebad2873e8226b45c75cb3e1cdadb5a4b608d740f1d799ba` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r1-c1/requests.csv` | 178974 | `ea8aadd541282cfd8bac4f7450908050dec632694bb872b385ec3bb7b3ac1f56` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r1-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r1-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r1-c1/session-setup.csv` | 123 | `3e88f1c07c2d24a6e3be504dd2ddd7f12c1b0d37961be0405760ff3eb6f3414a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r1-c1/warmup-requests.csv` | 29450 | `5405abeafdc6dd9a0dd2075550123ab3aa3f3e02977345162548ba5fa4be4a42` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r10-c1/health-readiness.csv` | 441 | `ef0a191c9b30457edb5f5c963a63ffac1d1b7998e7e4dc5c5f3c8d556ec577ef` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r10-c1/layer-summary.csv` | 425 | `1f55ee62108502e0dcc6e57904e01aff30f477244a167d9993438cd1c21270d3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r10-c1/layer-timings.csv` | 402913 | `f09108800e45e1919aae09eb228ce2f1467a6b5cae56e557212a735277e06c46` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r10-c1/requests.csv` | 179038 | `e26cc25806add74c38a31c325eb6fba376d91db2fc62fced9b37f12168dcdd42` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r10-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r10-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r10-c1/session-setup.csv` | 123 | `c71a56f207bb3e117d7de391659cd8a5e3b5d416aeb06217d43d890343af5381` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r10-c1/warmup-requests.csv` | 29460 | `4583a424865382f3029b6102709179accb7846c51ea30e25bc254aff2e5d045c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r2-c1/health-readiness.csv` | 326 | `29dce47d4cc833af6aafea4b082c2f007f126b3960344d451d8ac53c3d432409` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r2-c1/layer-summary.csv` | 431 | `dca39ad3150bcec1491e58eeda7966991c35235885dfd49e67f384a35620d6c0` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r2-c1/layer-timings.csv` | 399235 | `2b5fd07f00d94bb635394108661c7b9118170d96628dce4629da5ea58c59da74` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r2-c1/requests.csv` | 178952 | `61c8f4f86b89b76610e561817d9934b1a42056b3d0538bc85bdfd22d7eaab3b4` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r2-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r2-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r2-c1/session-setup.csv` | 123 | `d50e5ccbd93695638971f6989cd255e0ff4c6fd675f8c7cba6ee966104348969` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r2-c1/warmup-requests.csv` | 29449 | `dcc3f88ee2c09621e1c601cc22509d7505507c72012c5227746f8fc5347c4045` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r3-c1/health-readiness.csv` | 327 | `806eeb8c2171f3e689e6e4bdfcd0dd411fe8b90b4a7de734f9d8944c4db037f5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r3-c1/layer-summary.csv` | 434 | `47e70ec331afcb257cab80b04268d0aa732c5007991c989f385286479ae6974d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r3-c1/layer-timings.csv` | 399325 | `15217e3e2c4501eab292b42d6134f9d8ed1ba6c653d0e20b6033351d30c59b38` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r3-c1/requests.csv` | 179030 | `de9d0662c696e82af3eccfaff81952ffe981398160f37796236e775fb881c1a7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r3-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r3-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r3-c1/session-setup.csv` | 123 | `62260be1602b88cbfb577d552bee693eb19c22f3e363fdb98e96786712ba3d95` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r3-c1/warmup-requests.csv` | 29461 | `1341a25d34565530ac4168a32d0ee6eef1b9c5a9d19972bd07009638faa580a4` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r4-c1/health-readiness.csv` | 325 | `69369efbf266935dc04ce75843dba97e819a3f27d31eb30e4ed7dee8b2d55bb2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r4-c1/layer-summary.csv` | 396 | `2a74c151e3100e01bec16e8ad4ce5cc217eae0cea33af09b1b38540ca8ea4375` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r4-c1/layer-timings.csv` | 399242 | `3fd766d3c1667bac59e1f16499bfd2016782e188f0bc6effb45fe49f7befeb3f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r4-c1/requests.csv` | 178955 | `ebfa72ad7eb271ac52cca81f8b587a6c33fcc60692a7d4348f1b828f917ec07c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r4-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r4-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r4-c1/session-setup.csv` | 123 | `ef958a2685ea3039c42054f4a9a4d79f452c7ddc1a065c72e818a29b74fbebf4` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r4-c1/warmup-requests.csv` | 29447 | `5b2d1e1b17bf403ab30b9ea49cb7a883b95d60f91c4c8fa15f22277eeb539014` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r5-c1/health-readiness.csv` | 326 | `dcf0d232d654f2252f5a95d8921f1077e7a0cd07a80066f6feac9e719b768be1` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r5-c1/layer-summary.csv` | 419 | `cf31b2b49a0cc84f00a41eb67a3615dfa4eb500bb4368c9dc55a8efc2116966f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r5-c1/layer-timings.csv` | 399291 | `e28a156caceb1c0f403f60f9e3bc5481180f52e7eed0b319152869c096949a18` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r5-c1/requests.csv` | 179039 | `5d5a372a9e06afae5fe3f82801d4b647803645829e6ae8e47eb63f7b885ce62b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r5-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r5-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r5-c1/session-setup.csv` | 123 | `0ce05632042391de23bb6e4946c577ff860c2b923da188079c9944ab261ec742` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r5-c1/warmup-requests.csv` | 29458 | `787644c469d30afaa805193c8047c109411206f00bc6ecfd221cb50865fdd509` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r6-c1/health-readiness.csv` | 382 | `35ec1ad3f2e31e8aefe1118992a46e3a4b4c25f767bd9aa01c2ef523e4a71183` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r6-c1/layer-summary.csv` | 432 | `1803d2b0f9a6419f55887dd36a532d94c936538ca6baa5406bd0156003842714` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r6-c1/layer-timings.csv` | 399362 | `921e084a4df5f63da74a9ace81bbce1ebddc619197aed775e0cc22fe774b3c67` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r6-c1/requests.csv` | 179035 | `7d44ee2f7645596b036bcc467da8a8b0c84a8caf79d42da882bb7cf564b0a27b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r6-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r6-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r6-c1/session-setup.csv` | 123 | `06794a2af6ae4e4499134d438a146ae863a982a1c97dbc3269f5abae6fecc5fc` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r6-c1/warmup-requests.csv` | 29466 | `9fb46aadc20b46b15efeea8c206bbb81f77454f0dd36c6a7efe646800306c8d8` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r7-c1/health-readiness.csv` | 383 | `87d1cfbf73b2c8e74bb94642758431404381478fdc39c7d964d75ab363aefb9a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r7-c1/layer-summary.csv` | 397 | `3274a0392cedc22c59f85ba9a0fb5ee7e1143a43f4e600d15d96c5926b5108f5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r7-c1/layer-timings.csv` | 399325 | `577906d1d965439f0d5524f540255c28fa87e55c536ef902d96cfe9836d52cbc` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r7-c1/requests.csv` | 179040 | `c931f30c2f1a4674e8b0da5413d3cab5c8ba558603a6d8e3efdc49231511ad6c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r7-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r7-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r7-c1/session-setup.csv` | 123 | `6eb216a38420fff71dd1c6f4ae0c7ce2e6c93d3a386dd77357c1606ba0c6d6dc` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r7-c1/warmup-requests.csv` | 29460 | `ced5e07b0246dabb18e32c9698fae9600b558e9d98ad761fab56249fa6f8e462` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r8-c1/health-readiness.csv` | 326 | `bf517549a3ac8a544900e4373a0782cdfa815690e9b30a90895766117dbf02e5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r8-c1/layer-summary.csv` | 407 | `bc05b115597a0bc12365039d289019747cd2ec8c34ea1c1917dfa212c085cfa1` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r8-c1/layer-timings.csv` | 399332 | `37e2f86991e6edee560d2fe38344a079e56e8db58e8b649a338e89e3d96db378` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r8-c1/requests.csv` | 179050 | `7a033ebfa1c44e1958bf2785c389e22b03a2d47fd7b8d1bc6e4656dd76ba0c56` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r8-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r8-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r8-c1/session-setup.csv` | 123 | `14688f72b51c57df297e37c301512b1f61fa58af26eedeee6da01f46569f16f1` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r8-c1/warmup-requests.csv` | 29467 | `49873d01f97ec94c0e9b1b06f8790bbe4fd6523e07c2479fefcbb8c1eb7d7d3c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r9-c1/health-readiness.csv` | 441 | `13a768834f1c2640aa9df7926fc8917361ba30b20de3cc34e0f2116a37591b66` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r9-c1/layer-summary.csv` | 419 | `de33db9bd83cf4b99a5b8b7e166e62b8171cf2878461e536a7e24e17ba7ce8bb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r9-c1/layer-timings.csv` | 399373 | `e5d89a81c8f63fe4030e1a04434ad0230deed97bbcd528fa60d0cb7d590ee23e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r9-c1/requests.csv` | 179075 | `9519eb413076712a3b5792f693145df3cef2d7bca70750073bac78ed373308a7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r9-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r9-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r9-c1/session-setup.csv` | 123 | `43d92ae2f7f25ab24a6a08fd99173e83068202ac4783753adb6be246cc84f472` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac-r9-c1/warmup-requests.csv` | 29465 | `c7335d1c6386136c11faf830af01647b1f01387780ce7d7294673993b3df2a35` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r1-c1/health-readiness.csv` | 325 | `586235447eea92ed3b66a1a185a4beb2a2064335739040e962b02e4b29d55f4a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r1-c1/layer-summary.csv` | 463 | `21a760b1eddb0f4070019ae09f199d1197deb64f6e218f44023d079e9ed4b90d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r1-c1/layer-timings.csv` | 398941 | `2c211850e7fc2e493e2d79613cf07b9826a5c556c689b28d4378237a9635d2be` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r1-c1/requests.csv` | 179058 | `985c8b73259e048c8ccd7dbb3748b7fd8af3a9e1804baa59f6c9d3920e108e1f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r1-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r1-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r1-c1/session-setup.csv` | 123 | `76a18bae29febd6d71566c6870208bf0730022f70fb6debcd04cdcda145aee0c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r1-c1/warmup-requests.csv` | 29465 | `11812fe27da171dc5672597562de7b3d255e029c8ed796c0d1ad3effa0a6612e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r10-c1/health-readiness.csv` | 325 | `540cf653efc4f21e032d285619f5ef5d20523b17937460e4ed5cfb68ff2ccc23` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r10-c1/layer-summary.csv` | 461 | `49ac643e0e81a4684890e61be882449ec7efbbff85cc7399e58303ba598454be` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r10-c1/layer-timings.csv` | 401505 | `ba9b0a259baa9278bdf747a6a1aae23b909ad70fa8e7d2db43544bde0d8a0182` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r10-c1/requests.csv` | 179074 | `6faf244f7bf20ea2286170a7acbb7a57775a2c3bd8ac079914891507b669baee` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r10-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r10-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r10-c1/session-setup.csv` | 123 | `5aee6c948089bf637b96f60c4b5278926b7b61e60112181977691d0fa419b3a1` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r10-c1/warmup-requests.csv` | 29463 | `c00fbdff9130714d9747b88a082d2aa62b5a8285ec1b4375c7fea8c42a045fb5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r2-c1/health-readiness.csv` | 327 | `143837d945203030b996d507ec495521641f242fd6d55ddd18ca83a39a96427b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r2-c1/layer-summary.csv` | 452 | `54373c4c4b99139fd611a39bf4ba43a637e45689abf184d032bf0303efeabd85` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r2-c1/layer-timings.csv` | 397310 | `ff01a59d53420d80732e5bc8ab8fe8f8cd60b931e618cc1427dc78d0a39838f9` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r2-c1/requests.csv` | 178954 | `607f87bd5d6a7364b973c3d4ff841beadd48d59b26d2aabddd43ecd623ac1a9d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r2-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r2-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r2-c1/session-setup.csv` | 123 | `d2b7627e812211f34ddd31a31ab8f8456eeb692ac8bd899eaa8a28db7c9869d7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r2-c1/warmup-requests.csv` | 29450 | `3d5cd6e430ea5dd69e6656f2c51ca22d01ab2699534bf4ca2440ac866e97b9d8` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r3-c1/health-readiness.csv` | 383 | `61199f50a5c6e596d309373a3c5adbb0748e0f1e75b15e780da5496343ea2985` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r3-c1/layer-summary.csv` | 453 | `931ad01aaa48438346262f4fee311ce52079531bd70de9e39858ff45e2c9913c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r3-c1/layer-timings.csv` | 397858 | `a84a0db1887b1c1b7327aa952204e15808315adc232c8bb6fcc573a49ecb5a62` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r3-c1/requests.csv` | 179047 | `d9d662b2cb84d4ca4c63f8a8a28ca36dc539c6ae9aa84896b9c9c94ecc2201c6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r3-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r3-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r3-c1/session-setup.csv` | 123 | `bda60642a23c954321883946c9126819c17acfb4a155299c81fe697c27c827bf` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r3-c1/warmup-requests.csv` | 29482 | `81b195d378e12d186c0264e3c1e57ba43a1f855e838b81a1803b1d76b9841115` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r4-c1/health-readiness.csv` | 325 | `2bb729782bf652abced8c2d1c969f7b38dd951fd42658564f0410d9bd33c122e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r4-c1/layer-summary.csv` | 463 | `d84f84d13bc182cfca9c74a06d8e09fe0e2fed14d67932cf86138902f1c9f4f2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r4-c1/layer-timings.csv` | 397503 | `338496730617a76837a721f87d179a9dce26448d9ed1ce3f51bcb22db8ca21c3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r4-c1/requests.csv` | 178958 | `5e34b0ad9b92d5a233ef1e6cebf80fab97c45382c3d316f9ae283e5a008fe73b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r4-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r4-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r4-c1/session-setup.csv` | 123 | `cde3828adeefed9036871ec78b338970c7fadb9602e0ca0aa50d82c2fef36aec` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r4-c1/warmup-requests.csv` | 29448 | `5848643aa81b9e2cec890681359ef5468d0037afc84a55777c662ef40bbc9090` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r5-c1/health-readiness.csv` | 382 | `fe661938df0dce81c5f7384c3dc5a2d4301528457922ad75b609ac4925db71c6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r5-c1/layer-summary.csv` | 442 | `1c0e45d13f7ad7d0267dd8e523fd35bd1dc742ce55704feb4feb782bc5d382f7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r5-c1/layer-timings.csv` | 399075 | `9a879a02d4687e176bbc1e44e2dc9c1b37fa5759c1a8967066d9e52b26d266af` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r5-c1/requests.csv` | 179050 | `42f29e5af83a7e83fdd01980ff0439b37b16acd597d31314cceb3041a2bf7580` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r5-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r5-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r5-c1/session-setup.csv` | 123 | `2c2b3b5b6f49a51ae5adbc93dfb5259cf64480302fc61b0450448b3fe027fb01` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r5-c1/warmup-requests.csv` | 29471 | `6173cf063618c664459cd34abecd1ea78feae749c92b4db3ea1f78724a53c016` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r6-c1/health-readiness.csv` | 383 | `6aa5e3aa8d34c14b5c10f34ec1a58386e148054050606aa1eea00698aaa64d22` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r6-c1/layer-summary.csv` | 488 | `9268659a9b6e3c5cd58bd3e44883d0aab6a8bf02978b50e0d53753e277eb481e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r6-c1/layer-timings.csv` | 397475 | `b42ba9f35f30a02acba18e0d7c3600162f9a2a0677cefd663618a4d1bdd23b73` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r6-c1/requests.csv` | 178997 | `5f246d290faa6c8b2ff09b5619846325baaa257fd5e88f461b46a825a0734fa2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r6-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r6-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r6-c1/session-setup.csv` | 123 | `45c8b3b302951f00d049add3bcc4bce44216937f500080d8ecc658343c6f2e63` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r6-c1/warmup-requests.csv` | 29455 | `c11c894477815e0252956fc111fb8b0d99686875b50c73b86ab0671e527326c0` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r7-c1/health-readiness.csv` | 326 | `7709923be14377baf85b2b4da46546800eef2ceb04e6d00b2740d87c5fc79b6a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r7-c1/layer-summary.csv` | 453 | `2e07acd04e7994772c4b28fc42cf15bde73e1723fd5fdad1389721a588cca64b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r7-c1/layer-timings.csv` | 397638 | `f075a2314b6bee3ed3f5d29a37d06144c30c5cf6c1657fd95602d4b95eeba98e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r7-c1/requests.csv` | 179061 | `d74cec3f88074de88f4056efbf500f676f9d60f78577aee4a0cfe3f6661a6e85` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r7-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r7-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r7-c1/session-setup.csv` | 123 | `1b12f0ce6a3a55a4eb05b6517e22401335988b264503dd25cf40d74a0ea112a5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r7-c1/warmup-requests.csv` | 29465 | `ee89e33e129e95bd0b656fc180243d5085b1926af71768e7877f99b72af07e5e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r8-c1/health-readiness.csv` | 326 | `4d9424fc4d127ab90efc3f014bfc5e1775df909e415a4fdd03a8f00704a1454c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r8-c1/layer-summary.csv` | 481 | `c1b669b89d61676baef510b1c0a615b39dbc59e7cdb5628889765e8af7eeb9dd` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r8-c1/layer-timings.csv` | 397395 | `6a570fd1c5944e5b4a17d5cb930d2fc22bb0ba67bea33b575f0be9d5fa133643` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r8-c1/requests.csv` | 179031 | `0f80753c0f9f1aa69819a7b1d31c515b52f3d579a80f208afc57297eacf47c2f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r8-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r8-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r8-c1/session-setup.csv` | 123 | `bc9ae436a37ad918898711a9f45e90f074526762a9a7693b56aba3b60ffd2ca6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r8-c1/warmup-requests.csv` | 29466 | `e9d0f50ad88dad3b004d7a0a24a553ed1819ad5c837525f4fd4e6d63b8a8ab1d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r9-c1/health-readiness.csv` | 327 | `9d61bd09755ce1feefb0e3396813ebffc8df5e7642cffbdec1068d400416f304` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r9-c1/layer-summary.csv` | 479 | `67f7a1bb7efee6ec3492e81f970e8b8a22e6bee587d24d9569dfa49303b73b0c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r9-c1/layer-timings.csv` | 397824 | `d7f2224390c38f7a86699c73b248f9d36c9265d2db6831e7fca12a3124bca8be` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r9-c1/requests.csv` | 179055 | `4ed61ef9d162b00fd3e056d8097f3c2bece7c39939e671d135beb7bbdf7cbe5f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r9-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r9-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r9-c1/session-setup.csv` | 123 | `9eb92d3155ae86c4e64e09029d0a1518e118de32ec724a3f99d508d3166aec28` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts-r9-c1/warmup-requests.csv` | 29461 | `f9eb21eed3221c9eff592ebb996b557d9ad07c84754d16ab466419666af2c6c7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r1-c1/health-readiness.csv` | 327 | `4ac3cf9b28f9d0d115ff28d6abdc58e7dacb268edb29b166438eaaac82da9bd7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r1-c1/layer-summary.csv` | 568 | `0b86c9f448dda57e9d0f52cf1b798e77c13123e4697bd2f1edf5f59cee98c467` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r1-c1/layer-timings.csv` | 412452 | `a98282033e7acaf6772a0561c2be7cc60a80b91de08a6ec292d87cb6767a4967` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r1-c1/requests.csv` | 178969 | `fd7c8328fcf88f685c02397b5589d4cf7224b7b84f5a56a8b2330b809707ec97` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r1-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r1-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r1-c1/session-setup.csv` | 123 | `154655dfda9a7f8ba0306b475343260e046776af59285ca316d7312883b11aa9` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r1-c1/warmup-requests.csv` | 29450 | `ec8191fddc77e46c2ed923945d5a34ff54e625da0f05aaa6cd16070cbba2d694` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r10-c1/health-readiness.csv` | 383 | `a0bfd66573994df66bf53527fcc5b7739a9de0b86dafb7dc26b9be75f2db9e9d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r10-c1/layer-summary.csv` | 550 | `2d84411011fc359db03e0b918ee05c98c987ba5c4e984accf4564f5b8fb6e071` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r10-c1/layer-timings.csv` | 416581 | `8f90ef3f5e8810e486ee605c6cda7c522e22e564f2c2814102c5620edbb75fdf` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r10-c1/requests.csv` | 179087 | `a6527f842c76985193688abc702ea3171f5a8a8fc1c417cb3b3cf77e3c239d14` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r10-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r10-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r10-c1/session-setup.csv` | 123 | `e405849dd30563f64c7f69fdd6b246a92ad262d7e4f0b786ff7bce90b532d2cb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r10-c1/warmup-requests.csv` | 29475 | `6e95f16f1f02e743906b1e0b7f2e123d2c51cea5d0d1a2eb4dc80d33754812f9` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r2-c1/health-readiness.csv` | 325 | `767a8926479669583ee937e038396d00edc66441efab18500617539dbed19223` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r2-c1/layer-summary.csv` | 530 | `377add77d624ee401d2cf81ffdb10cf5f9e79dcc96e033043186a8a626712956` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r2-c1/layer-timings.csv` | 411662 | `5ed6a8e37a0a8eba7e16b77da87e9fea847bfc68f378e40127528655de28d9e4` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r2-c1/requests.csv` | 179050 | `0d30e33b5326c77e1811ca61af16d6ece4567fe6d9b2c037609ea083f5e75bb7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r2-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r2-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r2-c1/session-setup.csv` | 123 | `c1c7c4a43735463e3ea760611b29d5481732abbb308b4dbe2f73de632019f05b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r2-c1/warmup-requests.csv` | 29462 | `0fc13ea4c14adfe2f8a5c2e1c627f79afa9276b46b82328e381514d78b701fd4` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r3-c1/health-readiness.csv` | 325 | `1d5ba4ba98dea6588c317b505a14413c8eb37ad6a38669df1f4a69b75824044c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r3-c1/layer-summary.csv` | 521 | `418b72ef25ccb2ec212125f2be494b28a2540b15b8c9d2ea64547c837b358b29` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r3-c1/layer-timings.csv` | 413054 | `19a4a679301957d7c33e0923b544a227f207de68523a9e608a2514626c8da5b4` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r3-c1/requests.csv` | 179048 | `af7c44868111f4308f3566a9529e97a3529949e0eecbe19cff51142ce661f36b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r3-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r3-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r3-c1/session-setup.csv` | 123 | `181ac27b8a8c5c7ed906aa79dc3ce6ad4a7cf5c56be2043a1bcc10c68439b9cd` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r3-c1/warmup-requests.csv` | 29471 | `53dbcbeada63abf9754002d2116d3ba92a3de46f4db8f5632afb03f88bdc5952` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r4-c1/health-readiness.csv` | 327 | `70c8cc41de95a85ebe555a637c37310dc57f2d9497f252f9225e3ac3956c2e38` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r4-c1/layer-summary.csv` | 555 | `e1c8a4980cceadd8a8b811a826f42e9896ea27eba0acf0da436eaab70541d7f6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r4-c1/layer-timings.csv` | 411497 | `4987502b78fe1b938f1615daba3e58817eaba89a0d5f50055e703ed0c6cf9597` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r4-c1/requests.csv` | 179052 | `b17b8ca3230fc63b32a90d37cf0941cf267565952ff65b77c1ee7863c8c920a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r4-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r4-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r4-c1/session-setup.csv` | 123 | `c7056c37b10ca7ba6b5eaf20336850b6eb286df647b585c442f68de8cb7dc87f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r4-c1/warmup-requests.csv` | 29463 | `4b67227c95a36c0395006b6e1f695ec471d42a24aa9663599366cef55ca445e5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r5-c1/health-readiness.csv` | 383 | `309c879f334ab8913c64ae8ae2d8d214dc598b4b152349124ab18f0a0d0dd2bc` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r5-c1/layer-summary.csv` | 531 | `bbf2d979fc36e35b30b14cf80f0abc956267b9e745c312451fa74759026544d9` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r5-c1/layer-timings.csv` | 411451 | `b06a3389c38042aabd5ee72dbb5a23aa612ea89d7a3e4de1593c6c17626c07ee` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r5-c1/requests.csv` | 179061 | `851bbd5e1eced9c15b53ee94e49743f3bbbb87f3f9bc2b52effb9da06193dea0` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r5-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r5-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r5-c1/session-setup.csv` | 123 | `7e55063bca2a02db61558f6354fbebf0c73bbc150c34754ff19fd19602816e6c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r5-c1/warmup-requests.csv` | 29467 | `a12cffb13f1fda7e36b90acff3e9ec85cab6f8c73d1e5d828730ec4195e519d2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r6-c1/health-readiness.csv` | 439 | `c3149c779949a297e5903f7e706e0e539d6d3c2136624b9c83a8de5dc753a81e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r6-c1/layer-summary.csv` | 531 | `2e52d323ef742e5be0156505892d583e2c11747522f0cf0cbeea41875f08aeec` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r6-c1/layer-timings.csv` | 412302 | `aa50b85aaa9cd4301f6e53e2f2b0edddf24157d63de1666c3ff7eb6ed50fa6ed` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r6-c1/requests.csv` | 179152 | `41b3049c9cc8e52d77cabc58fbd186f62dbeec4b388f508d68609c900247a8fd` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r6-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r6-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r6-c1/session-setup.csv` | 123 | `00b735269f583dd6ecba0d2f57c191d8407e75de4f0974ee6bba6285378c90ea` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r6-c1/warmup-requests.csv` | 29472 | `23a9c92810879db7b6bc16195e449006c608ce2a69c884650552a67df4d00c1d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r7-c1/health-readiness.csv` | 384 | `f462b7498bc4f812a613169fc9583f934c5368e45ed82720dee9977bb820e943` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r7-c1/layer-summary.csv` | 543 | `341ca4609802f1eb0823f35f1e0becb250e535fe51309be876cec7174b4f6042` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r7-c1/layer-timings.csv` | 413130 | `ebdcf6091a73019a25f71c382488aeb45aad19fb9f194c1c975cf4bde60520b3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r7-c1/requests.csv` | 179091 | `2b825251af94ea0a3207d9545131c5bc2905a0d78f928a6df3e31f1a90c5fd91` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r7-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r7-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r7-c1/session-setup.csv` | 123 | `91978851634d13fe1a5328dfb7713ec05e007a8eac93ce89c77edd808b1c863b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r7-c1/warmup-requests.csv` | 29472 | `77416829323ad3b2acf5c975f3da9987f30b25cc9b9b620c0080c7f759739971` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r8-c1/health-readiness.csv` | 325 | `b9641eba24b73480241fc7518e77065fe1b45dad269cc90097aed31b85b30991` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r8-c1/layer-summary.csv` | 545 | `010483b9365fdc14b45aabf0e8269651b9d631efe3b22d4b4fce4989f658984e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r8-c1/layer-timings.csv` | 411528 | `dcd097a55e1857487e52067714b1fcae3a7aba25f5239d451629373a66dbd815` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r8-c1/requests.csv` | 179060 | `bcdfcd4efa5c7d4b256b595d9bb36a9c5c4bffa0a03cfb7fe876166b676c80de` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r8-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r8-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r8-c1/session-setup.csv` | 123 | `d0b4d9446aa8fa552ceceabbe51220374c3be05332ae162066451e1a178d1124` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r8-c1/warmup-requests.csv` | 29478 | `e39baf48a29c98b50b4701b1b78f9c724e931930a32f7e8676524e8eb1becf97` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r9-c1/health-readiness.csv` | 328 | `5b6e9ac67f340d3f605d268357fac50f95f3c1c4dce89bb9d2e82746bf90186d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r9-c1/layer-summary.csv` | 551 | `8f77eb32e075425694c480527889c00b17079f1e3fe2d0b03054c36e754556d6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r9-c1/layer-timings.csv` | 413063 | `3efed647f092f9f90118d0e9fa433dcb5107bbc18d50d3ba892f700f081192e0` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r9-c1/requests.csv` | 178985 | `17f481b08a745a0432a1fb2eb30edd0bc7aed2a95b5362d43d700fe92fd82368` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r9-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r9-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r9-c1/session-setup.csv` | 123 | `4a8aa6fa90d2b01e707b9e7d5fc6ca6eaa4c518e4ca213bc780ae7e0eedf1daf` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/hmac_ts_nonce-r9-c1/warmup-requests.csv` | 29490 | `477ea2d7e72f53007fffbd2980178a750661a14de096c0a86439555dc81ffaec` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/layer-repeat-ci.csv` | 4280 | `610573e69192a882cc927b244a0e758527f949942135209738f48271a7745a01` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/layer-timing-summary.csv` | 31744 | `32a2ff33e834baee02a43b48674a48a59d51a9942aa00cd89d628f61168f3fb5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/load-repeat-summary.csv` | 1068 | `daf381305a1b5ec7f917401888ac46a4a49d3838d929d8e71286c22dd6476a90` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/load-repeats.csv` | 20446 | `73ed45040a0e83ffc3e0d4176e3fb54a674503c7f1b36df2ef620528abd3c6bb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r1-c1/health-readiness.csv` | 327 | `3228efe41d437ef4d26971a6d76498694d5ba8a2e443e02001ea2a023b1da4cf` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r1-c1/layer-summary.csv` | 566 | `b007f67550144c998d1e91ba7c932f539ce38b0338cd946a56b6b7c0f793813d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r1-c1/layer-timings.csv` | 397802 | `321a43418c3cdc6cc8627f91be699654627ceb41c298321ae209aeec60d44887` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r1-c1/requests.csv` | 179069 | `df0c1d898f42f9786d7d70cbdf4e218f2d8197ec868f9b86ad4e8ea47c17ebfd` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r1-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r1-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r1-c1/session-setup.csv` | 123 | `d3eb5e1b889261c0611d15055f7325592e9b2f0db3d7d4a27391a38a0c92b9cb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r1-c1/warmup-requests.csv` | 29508 | `b80a6ebfd3d6396de48de36f1d6b684d224882998b0da8ba149af76f97060e52` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r10-c1/health-readiness.csv` | 325 | `038af4721afc1500f9fb11925839b86fa8f8077259ae1a02b15ba431a41415b8` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r10-c1/layer-summary.csv` | 588 | `8bea288928bef7b3a61a9901ee2140ebd68829f832e682870323d0439ac202dc` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r10-c1/layer-timings.csv` | 401557 | `2a3dfe78687c120fe7a6fac57be95693e4d6f19682b61a2a291dfa625fcebcce` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r10-c1/requests.csv` | 178973 | `74ce20529b579b817ed5ac22f0b225f963a5e701421c4fb1d719dc31dc58bb41` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r10-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r10-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r10-c1/session-setup.csv` | 123 | `ccaa27801d15ef45d2dd55c444991155bce75d05a4a2438a847c10f602bab422` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r10-c1/warmup-requests.csv` | 29449 | `b17c38e5863d44db80e36efc69c30264db10ee404b701e67d90cdd74eef5d922` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r2-c1/health-readiness.csv` | 325 | `205e5c3cb5f4e13508babe5f7bab7e214091295f0b54eecba7d4fab0a62e8ade` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r2-c1/layer-summary.csv` | 570 | `82702512f7f9f37a92ed9ada6800633ebf853c352ae722f2eebe5a6ff00e764b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r2-c1/layer-timings.csv` | 397634 | `5138c2a55c92781c3fa49cfeb4dff1dce91de85fc2b7ef337cf875893c7a8d1a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r2-c1/requests.csv` | 178958 | `079705a6c767e15c50af9223f19c790a3aa9a617619e0440bced97b3ce0116bb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r2-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r2-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r2-c1/session-setup.csv` | 123 | `22cd68d19e4123c1e4fe4b7841f15ac37cb83b601a9cc03a094e1d6fc770dd25` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r2-c1/warmup-requests.csv` | 29450 | `0864b01edf9a4667b2178e9a12b1594517bb12e0fd0f7fe87d5235ff818c3d15` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r3-c1/health-readiness.csv` | 326 | `df29fbbbc9b4165397769bf7dfef340ce43a6e233098595ac82a057cda712859` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r3-c1/layer-summary.csv` | 556 | `84edaa16ca6c04fe7f3f1d4b62c09355a7d64cc761e196ee46dfb8f352525aa2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r3-c1/layer-timings.csv` | 398058 | `a1f1d235454450038bfe41b8b585d249c3c60f0cb1dba78fa9d736265e1f4a09` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r3-c1/requests.csv` | 178965 | `371c2dc99fe8a298eac91a45cb75420fe540ed5a3506dfcf9608c1e3ad7913a6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r3-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r3-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r3-c1/session-setup.csv` | 123 | `25f9c3c618f89bd8485eb6a3f772c1670f79b6e7fd89da1d6b4009e94cb96739` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r3-c1/warmup-requests.csv` | 29449 | `7255854e955a20f818783abc94e6465177bb6e3602b2f64bc7668038c188c48c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r4-c1/health-readiness.csv` | 383 | `59d19a0add8d450d0d424757c4f2951ed7b75ac73e9b10ac208fa018d2f9072d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r4-c1/layer-summary.csv` | 582 | `c196a1f8a287d06de9390e1824fd7a6fd809d894769176a481ffa93299fbcd13` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r4-c1/layer-timings.csv` | 399179 | `78776155a983f22eb8582fcd3a98d3b656376da17f735236ee4c2de0bbadc1f2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r4-c1/requests.csv` | 178972 | `0756492756184022d4d05632ccc6c9d36eefa9b0898ca11d2abb909f62e05a10` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r4-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r4-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r4-c1/session-setup.csv` | 123 | `173b4d62565d5c13014358e69486b224e761cfde2394cf957f646b363ba913b7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r4-c1/warmup-requests.csv` | 29450 | `f3829e3aff6780fb49f009fe2ad6b54b4da37c6e2dd400b1394331dc8d5932ce` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r5-c1/health-readiness.csv` | 325 | `b4de066edc185dd7bca1394a797a7661424cc38c55897b1d5c6ee82a0e90095f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r5-c1/layer-summary.csv` | 543 | `50ab05c8d5a5df84e1139d1accdad8ed7a0a26ac6be49cd572d8a282825e6499` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r5-c1/layer-timings.csv` | 397501 | `0142a7c30e2727fec49043149ecefbde610dbd95fe9a8d8f300320f589bac8cb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r5-c1/requests.csv` | 179072 | `962aa0433591458bdb92731f75bada48f92e9b69c20cc2ca5524c2b276ec5524` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r5-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r5-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r5-c1/session-setup.csv` | 123 | `423d2ea6646908bc83ebd6a038d962fd60019dfb509ae4024ae1e7b497e279a4` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r5-c1/warmup-requests.csv` | 29480 | `30399817b5002ed58611556c65b420be492a979d147032353cf8f9d7b860787c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r6-c1/health-readiness.csv` | 327 | `cd38a621abe48ab705ebdd248b9b31a18453165fb43bc6468c0a606218ae00ca` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r6-c1/layer-summary.csv` | 594 | `2aa978bc6bb512cc760d5ff3ee2423d6f7788e28a37640cf1e6cd23c4f30da7b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r6-c1/layer-timings.csv` | 399183 | `db686852ac6a48709a2745e4782af5c21f916a7f41706058fc4ee8e557d56f16` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r6-c1/requests.csv` | 179097 | `a2bd58862d2aa2afe43a24503f4818d0183c54a4ceb1887aa44e384d4797b463` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r6-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r6-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r6-c1/session-setup.csv` | 123 | `163207cb3ee9d7ff6df8f71eb9e73af0df6c8a0cfa12fc0d5b175d1393b50b4a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r6-c1/warmup-requests.csv` | 29479 | `4963b727279b376351b0530d81d697285868548304d4fbff8c8f1521770a9084` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r7-c1/health-readiness.csv` | 381 | `529cf3af53bba19619ea855781dcf56ec44bd94c52483f4b84f22d23868a4922` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r7-c1/layer-summary.csv` | 548 | `95d4e428c0a332dd1d5b9ecae3db0c54d602ead32e6ad4950049fef85246f1d7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r7-c1/layer-timings.csv` | 398126 | `58d33841d4dd59f9845ae2ae4f2c2d2784a3c2c07a42736d95cdc40ee8e026a2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r7-c1/requests.csv` | 179135 | `9699a860a13933990f5f9faacd74ef097e0c6bd7a7be92bbe4fd5c91b5d56d72` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r7-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r7-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r7-c1/session-setup.csv` | 123 | `1aec387ecff4742565ba67476d4195e0c530c805cea38033ba3cee6948dc859a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r7-c1/warmup-requests.csv` | 29483 | `5159f41836798025fe2c660a60bfd16b2813099f29155028f90cad9250910971` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r8-c1/health-readiness.csv` | 499 | `a9c18a3f14e0dfae34ce1dc6e9df99ffab030c477131e8969d49f086820d36db` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r8-c1/layer-summary.csv` | 557 | `debbe40fb98a8e50b0659edb1c58f6c2fdd34f049b30969ee27ed2177f80afef` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r8-c1/layer-timings.csv` | 397706 | `a7503da3b75fc185304e65ac095f9e8af105ef24f7ca870ae9b75c19d7854115` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r8-c1/requests.csv` | 179087 | `62a6efa65b8c341364bd88555fe5e0e77bf865cf89971a4f442082fcab105ea0` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r8-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r8-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r8-c1/session-setup.csv` | 123 | `a035f279b2a4b4e7564828671b6f8f3628bf1a269de69787cba6ccd955022168` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r8-c1/warmup-requests.csv` | 29473 | `8550137c3dd993f2f2a8120f56124ca5435ef008412b57871c548fa326971199` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r9-c1/health-readiness.csv` | 326 | `f26ec6fadf47de5eb6d5a88d1b65d21ccde4d11a4159c665ff34fbdaddee250b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r9-c1/layer-summary.csv` | 582 | `38b1c33e5acdc643b39f9d5375079d7e5422e7879bc2b5b9c15bae33392b87d0` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r9-c1/layer-timings.csv` | 399126 | `d5ccf736ce91c63524667400b9e24feaa83b28e8c41beabc80581bd846f6c3a5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r9-c1/requests.csv` | 179089 | `f82d9421bde9fa3c6f48acdf2f37d1b869b742195f136b8f4d07841b780ab279` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r9-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r9-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r9-c1/session-setup.csv` | 123 | `cefc511259497f1dfe0b1a934e289e8de865cbd577316d2a828c860ea1cc01cc` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r9-c1/warmup-requests.csv` | 29459 | `319a4bd69b870b33a72e335d60ed1c9871ff54d1245b09ca114679f61a6e6425` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r1-c1/health-readiness.csv` | 326 | `a91e02f18ae03cd7323ffde73d310f1d1e6f3e0bcd712e5522ba7bd560f36c1c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r1-c1/layer-summary.csv` | 560 | `3d8d052a88c17a2bba0051c6dc8ff230553851f8551f25cea7c7479f840b02f6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r1-c1/layer-timings.csv` | 397535 | `1cfbe2a1107d0accf052fb70307f73df3db53db2eee301997001d4d443efec85` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r1-c1/requests.csv` | 179109 | `ff619bd884d9f37ae0a9671b1159171af498e41cf9267aa61c58c2fbe2267f4c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r1-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r1-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r1-c1/session-setup.csv` | 123 | `e4ceaaf1fef43ce74ceb0189f3a61b6f55a1e7825664b4396060459b1699b41a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r1-c1/warmup-requests.csv` | 29477 | `cd62c0a059403f590259ac8fe3142d139f16d07179bef5f506f2e71485ef659d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r10-c1/health-readiness.csv` | 325 | `6806826411f1b038a7ef177f8f50156c4d0478ca77e272c08fea09cc49abd3a9` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r10-c1/layer-summary.csv` | 569 | `444f9b4aa56407decabfd46b032f92f9d68157502fa7105c334fa9ee0026c553` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r10-c1/layer-timings.csv` | 402783 | `01652b8452419826c19d0bc415c788e8b440258ede277a994f2193812f1e0b7a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r10-c1/requests.csv` | 178964 | `138f69c265119bd724009aeca786515a9a84542b88028f077a6f64ad45cedec6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r10-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r10-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r10-c1/session-setup.csv` | 123 | `dc39eb6d3a4c0910d1654d1a7e5a24781d5aed27d47b3998d2bdb3026b483aa3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r10-c1/warmup-requests.csv` | 29448 | `d2d18e303b299535606f73e8a89db962f110a0de3c69f40c34ad331f40a2a736` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r2-c1/health-readiness.csv` | 325 | `2c79d859f0105a1b91b970d287e3754e941d66864b7ab3aa2e01735e9b8b55dd` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r2-c1/layer-summary.csv` | 570 | `14e3479c18ffe4fe155d7d5c687d94bcf2297e3daea59d021a7fd49ece992298` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r2-c1/layer-timings.csv` | 397739 | `54be807d124f4c3120f80321180671cacc3bc920328f1b01c786f9da632e895d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r2-c1/requests.csv` | 178967 | `5f99c507a8ccb1704568f1bbea1c7ee513382091fac9fb361e2925b96fcbcabb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r2-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r2-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r2-c1/session-setup.csv` | 123 | `18c1a0a2fa9da6269c0ff69c4e058de25ecda894701c24f6c95ede5d43f74c05` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r2-c1/warmup-requests.csv` | 29448 | `66d36ce6c15a41ac4dd7055ed422d93d14435276fb447effd27020b0c78f0ecd` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r3-c1/health-readiness.csv` | 381 | `58e7fda8c32dad2e54e4a816329cb36eb0705c0ac01edd71d435ea94d3733b48` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r3-c1/layer-summary.csv` | 558 | `a385daad4eb531a8d817c828cb417e59a18d28afa8e296ed3423d639937ecffe` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r3-c1/layer-timings.csv` | 397724 | `6b483ca8ea2c5273f9e3161a12f089214b6b81eeb4bbea146e56f6b8a37ee2fd` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r3-c1/requests.csv` | 179092 | `fe06cdb1c1b691e0919e78ead60652abe56872bdc20b6cea429160b13d5627af` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r3-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r3-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r3-c1/session-setup.csv` | 123 | `93d8d1a92231bee89e5a0f36aa2b5d781684d7794c75f62332a06c477606f432` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r3-c1/warmup-requests.csv` | 29469 | `4c77e1e72566e803e23eeb105bf658a2b30a45f7222adf00360dbd0bdbcc7f14` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r4-c1/health-readiness.csv` | 327 | `d3d933a635b35c46984e1b90dc57d1cc925aab8b4b3ea56c0b496340a329865e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r4-c1/layer-summary.csv` | 571 | `b0f065b46040739227f4d1f02c83974f9060c4e8b78f97699143701b5ac6aa67` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r4-c1/layer-timings.csv` | 399408 | `1825ab97cfdb074f04cb41820ae919d93221bd4cf80e367debd712aa248cd76b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r4-c1/requests.csv` | 179108 | `e579c51511972990e07d1dffca9d8cc1f5df8ee14f459834d0bee161ade4d41e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r4-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r4-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r4-c1/session-setup.csv` | 123 | `48f2d47cacfb2d76b5dff132a903ca2166d775724fe686182dadc61da787fb29` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r4-c1/warmup-requests.csv` | 29528 | `24e26b7f6838052cd06017c3062ee11cfb42bc90a9bf5f3cc229285987eef3c0` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r5-c1/health-readiness.csv` | 327 | `285a51a137e65ab746f5675b8f53094e67ca776b0686a05e070beb4e159c3856` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r5-c1/layer-summary.csv` | 557 | `5d66e373bf18ffa866707887da19d97d97b0faa7fef42393ef020a8db843049e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r5-c1/layer-timings.csv` | 397535 | `827850010450b9a6541b19a23383783a75f9c08a92e408224db390b9b6119cfb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r5-c1/requests.csv` | 179102 | `47c9335db1524d7c54d0056850190dbbe8f1a17cfc67977a89deb18a155bc1a2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r5-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r5-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r5-c1/session-setup.csv` | 123 | `94b8303bc22136d4e5b78db9b334daea840ef435dbe2cbb549ac98d3c9fb8329` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r5-c1/warmup-requests.csv` | 29474 | `c7ff18a01df7787b0179d7de235585616ff63045ce0e4578b7afda4481deac41` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r6-c1/health-readiness.csv` | 380 | `3cf261367aad03fea7ebd3c1eeaddca5e6d12af4d4e73d4633cfcae4b3a46336` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r6-c1/layer-summary.csv` | 573 | `06891619c174b0f9d8e3bc9578ca374889a40f10b9326ac7db68f878db7144a6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r6-c1/layer-timings.csv` | 399309 | `9acf70450ba53f18d1ac18a33388055bd92185b53f68b2edbf6ac473fab22912` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r6-c1/requests.csv` | 179126 | `1b7843fd1733cbef834b74d2de860b3f8093ff672c527abc09f71b7f5b0b8650` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r6-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r6-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r6-c1/session-setup.csv` | 123 | `ada1d4a35f24feebfd325f2fbf56eefd58bbcd75a7a0737db622ff3d05d13bf6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r6-c1/warmup-requests.csv` | 29477 | `22d9b3da0d7726207fab2dba28984010c29223850b4de3fae924e880c0312241` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r7-c1/health-readiness.csv` | 326 | `b287ffd79e0c85f92b5c5d15bfdec9b8f29f496ddcfd4a45184cf485a8d9a7a5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r7-c1/layer-summary.csv` | 557 | `469dd859c251715c178f74bce6efc6ac016f09f6d59e194f81548dba916cf7bc` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r7-c1/layer-timings.csv` | 397951 | `8d1c40988a8f78f1b6b302a13f422a636acebb066400dbaf4329c4bee7ecc0b9` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r7-c1/requests.csv` | 179154 | `2b9cf6e7c167e442b5ab14895de4fc9c6374314046591fc21a41ee3bf36b29dc` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r7-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r7-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r7-c1/session-setup.csv` | 123 | `b74b8873acab636482e9570bdaa85fbe7271f81dff4bac6e1b438143fcc66259` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r7-c1/warmup-requests.csv` | 29467 | `976e56a4c6a2cd5b6464daefe1bad7f50869d44345406c91a26c9182a7b9e696` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r8-c1/health-readiness.csv` | 439 | `f283e61d3201d56939b9547d0783bf601917fbbb81ffd7511fb730d574501ef1` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r8-c1/layer-summary.csv` | 532 | `0161a75fec5257d131fd56618176d7bdf1cfb6d2f8d985770ab556cb0d6c1743` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r8-c1/layer-timings.csv` | 397598 | `8f7b1ec25b4a010d8aa6fe57d8908e7f5762696d16db513d5a04b59181f5f53a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r8-c1/requests.csv` | 179102 | `b99f96830602c3a942c180f16068e2e33404b8ac34d26ff043a328e526d9f943` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r8-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r8-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r8-c1/session-setup.csv` | 124 | `5990d230a754c697e1075750a840694032422c851f7783147cfb28b7077d31f5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r8-c1/warmup-requests.csv` | 29491 | `217be2ba8d8542a4cbbb11898de778f86c2af4d9114a59eac739a31e39061112` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r9-c1/health-readiness.csv` | 326 | `78aa4ccfdca31f106ecd447ff4028df6df395905170ab0e9fc0d4a9029ae157e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r9-c1/layer-summary.csv` | 560 | `2ddc79a02de70bd894b5c5163329c25b690594acb8ced7d6dc59d51cc07810ed` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r9-c1/layer-timings.csv` | 397618 | `61428c8f1646620b9539809e79a85d5ecbb6db81005c35553d8e55a96d020b4a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r9-c1/requests.csv` | 179125 | `435d9b13890a4e330f0d7004d9bf4a870678b96791cd4301daa3f346ab7f645b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r9-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r9-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r9-c1/session-setup.csv` | 123 | `e5e96f43ffaa7e60e7763ce179adc2e1766bd27ace32e1b6c5e105fc4ee446c2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r9-c1/warmup-requests.csv` | 29474 | `3acdbc25bf9e546ba5d0bcebb4fda8f22a377eebc25c4b62501972f78da6383a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r1-c1/health-readiness.csv` | 385 | `d4f36f34a8d7fb0687bca13cc1c23bdce5123602cedbde6e0fd66a5ad77328ad` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r1-c1/layer-summary.csv` | 587 | `101b6b63c8b9dff728af13712a9ae7d521d509cca439a0b109c10a7ffad13218` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r1-c1/layer-timings.csv` | 404440 | `201cada3c60f9d51b3e5d98fde9bf8c332f65a2747e93bea7597d83500bad735` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r1-c1/requests.csv` | 179087 | `f528e4975d266453e1e0bda319095228645deaee95219740f1b89b6c4fadeda3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r1-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r1-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r1-c1/session-setup.csv` | 123 | `8b5e8c636fd29fe26add674adc920406a580f14e1d8ee9c61bde7b031c3ec3e7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r1-c1/warmup-requests.csv` | 29475 | `7538b7bf59d4d77dae84329b47e5a4d4eb71fdeac0d25ce6111949ca504e9da1` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r10-c1/health-readiness.csv` | 326 | `2138d26f867058a1bcd4e89ff4672aa2490933390557b22d19b9d3b557f769e9` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r10-c1/layer-summary.csv` | 580 | `821b7050120e2ea5569001baedac7419eed997e382fad5ef30b2f08b197fe080` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r10-c1/layer-timings.csv` | 413354 | `a4cd961c59055f2a674748c25c7eb25c57d9f9900698ebb38ab83a5aa46a3839` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r10-c1/requests.csv` | 181950 | `77dff5e892f0f6aa60a1eab7e3ea82f8223fa7dc7c7c39fefc874af97f936070` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r10-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r10-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r10-c1/session-setup.csv` | 123 | `65e7345634863d589eb70437b9a05f3c37a2d5a1a988658c820ae068eb88e4d0` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r10-c1/warmup-requests.csv` | 29947 | `4bd20cbf6f8b480162da473d1ffc123cb0af2f27be766fa3f1a76db0c9fba106` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r2-c1/health-readiness.csv` | 384 | `af5ffdc48749e7e8f8ae91e24a32f7d32415aa7648c4054ad2566ef8f1606284` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r2-c1/layer-summary.csv` | 575 | `629a02c6b8b73db96ad38af77e08bd65cf0ee9d56e9c17fad792bd11910df7ca` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r2-c1/layer-timings.csv` | 405090 | `f97a7524f37ebc1ab36cb5949f7116f816742754a23c3ee583569ecb2d46cb9e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r2-c1/requests.csv` | 179091 | `be58109fe196aec4b62cfa2e4bc874a79e5dd5d4702c5a191033f2a1e1e8afa1` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r2-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r2-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r2-c1/session-setup.csv` | 123 | `e2d19c12f4b2e91c3da670950b2e21f3a5e0042eea5e97d82d147cd7709ca58c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r2-c1/warmup-requests.csv` | 29469 | `0e38b2299c5074795f0cb55760f14733ea39bf3666d6f9b81d8fd1b79aea8348` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r3-c1/health-readiness.csv` | 324 | `58d6d589cdab9dd2fea35b08e1dd3ba5dfdaba22f0db89f60e1cc766964aaa65` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r3-c1/layer-summary.csv` | 573 | `c42ebd96001e224df90a689b79b854d192bf79e3bdbb28686293c7da75b7362a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r3-c1/layer-timings.csv` | 405269 | `bdb64b7651b9cb8b6cd0de1aff7cea615ced3a2ae16965264aa182af283fe3aa` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r3-c1/requests.csv` | 179753 | `6ddd2a3285232a98afad12b35a78ed80158bc3c49b0ffcfcc179f7d21c5c8cc0` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r3-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r3-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r3-c1/session-setup.csv` | 123 | `b4c3438aa290755b247c1810fb8fb3c1f1b0a6bbb882e3c540e1e39dbc5d76fd` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r3-c1/warmup-requests.csv` | 29471 | `c4bde13c50f4d5e884b4ced30cd5e8ec3459af94f4bb2e6427aff0afd398a674` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r4-c1/health-readiness.csv` | 324 | `bafc79d8bdd0db53940ea92a6f1606383ca9b38fdd8078f6c2b4dfdea3afef48` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r4-c1/layer-summary.csv` | 597 | `3a5fbe4d301f69c4137bb68e935aaa93c505a1f2a9af689ac2a47465e7c2b173` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r4-c1/layer-timings.csv` | 407121 | `cf3fe49fca99f9cb284fbb8f961e395347dda699714a209e1367d1796b51facc` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r4-c1/requests.csv` | 181504 | `8223977326a9e7821ca6d6ca2d96fce0f6671f6970b5964f8c94d204eb2af07e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r4-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r4-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r4-c1/session-setup.csv` | 123 | `26d6c28cf4b8a32bf2106af2febce667a669a89c2fc4047dfe74ea6a5339de41` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r4-c1/warmup-requests.csv` | 29472 | `f5453375bcc0be50112cc975bb58982606f60708da824c572d396597ddec5945` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r5-c1/health-readiness.csv` | 326 | `d2de433620c70caa0cc33755034ac2c00db7332a666138da624fd4ab9a92cece` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r5-c1/layer-summary.csv` | 588 | `d316d9ea2697e7c810f865e0bc3728056c45d3bab20503eddab8ce1b002c9c17` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r5-c1/layer-timings.csv` | 408204 | `3a6e3d8210fc26efc87ea0dadec7d4fe91c7c127dd3661baba33945c06c45a67` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r5-c1/requests.csv` | 181948 | `52d13101fb97961723952022db93504732611216320793b0b35c2f1cc9a2ee32` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r5-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r5-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r5-c1/session-setup.csv` | 123 | `8bd8d7c4b12cec3aed04a38460009b0e98f2d400c707e2cda3d5ceccb650f4bc` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r5-c1/warmup-requests.csv` | 29946 | `610b0dfd303dd037dfc88333222b990099121418b67c4ad9b4e87b354c693396` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r6-c1/health-readiness.csv` | 382 | `73e7de3a268923f349fbbe3e8b0ee489529088269f9efb3ae92a26c02e74662a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r6-c1/layer-summary.csv` | 597 | `a86ca3cac7e6e72fd71491fa46cc654e800cc362a3b27cea68c6dd7bccf2a2f3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r6-c1/layer-timings.csv` | 409692 | `ed1cef6cffbf3764ab1bcc54548e91c011f44587eb7b7f83a89848e8ed4842a7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r6-c1/requests.csv` | 181948 | `20778304f3c7782ea9fc0d8d1b9423ee48d09591b943fb32166071cd8e4843bf` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r6-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r6-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r6-c1/session-setup.csv` | 123 | `3c355ca2d051660da7e68cd8e5f1f868430abf4006cff400495c9add74733761` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r6-c1/warmup-requests.csv` | 29946 | `1a0db6bf34d251ee91e1ce9f4f53e1178a5dc4612b5c1f52dfc03b0a17208431` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r7-c1/health-readiness.csv` | 327 | `a86670764273e945da7baf65f52506f83ee5eb0559e136c5755c3b8487e03ea9` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r7-c1/layer-summary.csv` | 561 | `188f58d468004f4ee10e73fdd2f1731d2b60028ffffa6427d7ce355cd1b66b70` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r7-c1/layer-timings.csv` | 409335 | `032d64b88f8d2217e962f8c071af1160947985023f3a59c52b83c9fb6d2264ed` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r7-c1/requests.csv` | 181948 | `63d38ee03cef8f699642b4c3d38b138799646bc675e8daa61527a3ec2ee3bbf0` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r7-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r7-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r7-c1/session-setup.csv` | 123 | `d8d37a2652662369b3d7776a4b66c13dea1e9f5576d512853e5ebecab201e56f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r7-c1/warmup-requests.csv` | 29946 | `3d49a5f3357251a49daac454b5bdfbae5afd3c3e736b67a8499289b0536f1c91` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r8-c1/health-readiness.csv` | 328 | `2d57b9df69e4efec227ecdf194ddb188c6f634112ceb3da031525ff02157e5ba` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r8-c1/layer-summary.csv` | 583 | `8e53d4805d2db85459684f0d8c536bd37f05fbbdd619909d7188407f9c04b6a4` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r8-c1/layer-timings.csv` | 408654 | `39c1640ca07d4ce92280f1584e2699043e2ad1390878b5d0b247fb6d6433e4b1` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r8-c1/requests.csv` | 181948 | `006d21d8f97010478a3b3bfd8e347bedde7c3a5ee7ed9676a43774086bc53e3d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r8-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r8-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r8-c1/session-setup.csv` | 123 | `74b59446f4acf86b5ab9b67bc969d97eed910a31fb1b5a0a7e6c3753055ff1b0` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r8-c1/warmup-requests.csv` | 29946 | `d82a01564a1dc2888022bce1d72be068419df60c921c2c374cb61003116df5dc` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r9-c1/health-readiness.csv` | 325 | `29fc84aad14fcd9c013e42b4708dc5e75704369ef661611fe0b38d689cbf0fc7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r9-c1/layer-summary.csv` | 560 | `89ebb75d5768a3d6bf4191e7ba413bdaeecb565504a35653099e86cb38aaf406` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r9-c1/layer-timings.csv` | 407455 | `ff906b269cb78afab7267ca55887ded822a0ac8f2aaf99cb9103e5f70b7677f6` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r9-c1/requests.csv` | 181799 | `d611a5a5217aee4f2679ee81c3897e57c42b7d0ef13638a871f8a29728266264` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r9-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r9-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r9-c1/session-setup.csv` | 123 | `0be9fec65bbe455f4e17634eefe80b98644899f2d7a2fcf0b810bbd6281098c0` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r9-c1/warmup-requests.csv` | 29790 | `588ff376286f3f2097696b88aea988d4288ec655151d267528482ff3faafba1e` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r1-c1/health-readiness.csv` | 325 | `02d0171d06c003a9308d74daf0a18f656d60541459968513156ef51794833f5a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r1-c1/layer-summary.csv` | 370 | `93c93f48d1cd43c2192f4b3e410e843ff50c24748b53707963bbd2fc3b08008c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r1-c1/layer-timings.csv` | 409898 | `1c62ac4571b51452ba0636efb514e4e85290d04c369f45157cb124695f37ac24` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r1-c1/requests.csv` | 179036 | `95a7dcf07d5c08725ec5088eda479d2501c9f40bbd6d6f077cd6d73ce47fd6fd` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r1-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r1-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r1-c1/session-setup.csv` | 123 | `c9269865d097c1364411ca3f31ec6c2e94f9f6424d96bfb52c7d475c466ca463` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r1-c1/warmup-requests.csv` | 29463 | `80a2d84d68caab7cc04af338812713625efb576ac4fd2337fd6c85323f03872c` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r10-c1/health-readiness.csv` | 441 | `ca7998de8edfed49e07e77a0cc2adcbc800bc1df8ddcfd795c1f66dde1f11c79` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r10-c1/layer-summary.csv` | 385 | `4be68d12502316593a94c662df6ff94c194566035bb42d7acffac6b4b2bbc0c3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r10-c1/layer-timings.csv` | 413256 | `401e14eb6f6ed4f9f91751c0b7bb8740ebd31bd4d92b748ea6daba5f3564b4a9` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r10-c1/requests.csv` | 178964 | `8d798554c16566c292fc63526115ce06403c2683ee9e523b53f3cf1b1f48bd31` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r10-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r10-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r10-c1/session-setup.csv` | 123 | `45cee33db02cdf3174c044669d6f97f421ae5916759dece42006519eb3204a84` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r10-c1/warmup-requests.csv` | 29449 | `956652159889dfee2d0fcd7f9e386867df53bf48088b0227ef88df648afa4284` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r2-c1/health-readiness.csv` | 438 | `8d28155b4603d281493e5e149829e143049838d3394a1e8c34a7708821d89eae` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r2-c1/layer-summary.csv` | 393 | `f63d7d9fbd5411efad6e7983f68669d54238bcb24112dc3af8d683287d23076f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r2-c1/layer-timings.csv` | 409768 | `7d6f06f4c7cf35330bdb0ba870e719577a9ba9569fd439ec7ed72fa1344b62ed` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r2-c1/requests.csv` | 178955 | `76dc5f7793ca1dfd87c169f431f2b8baafc433bd3e5b747cca87c25b57d71bb9` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r2-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r2-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r2-c1/session-setup.csv` | 123 | `5beb230872c784156d07f9e71f1709ad0e731e2e02a3215b7c51da2b55c5dd3f` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r2-c1/warmup-requests.csv` | 29453 | `eb45716db7593b33fc4516f2d92c71214c9d6b3186c73dada9b2a2f347e3b173` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r3-c1/health-readiness.csv` | 328 | `ca9580e1ee59bfbdc5711eec8a559428ec0ed42bba28a8d27ec500a7a39fd207` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r3-c1/layer-summary.csv` | 378 | `a5a600320dae4bd08242aa39bc1452d656b0b634f833679af0c45302810653cf` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r3-c1/layer-timings.csv` | 409699 | `ca17c198a8ec22d8b895b10cefdc1cf603ad65cd5dc25ddaf1dda96c05b312da` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r3-c1/requests.csv` | 178956 | `f0dfe5e04fdc4211597b57af3d7de0ae88813e99ff83b872b18912a17b3a3021` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r3-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r3-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r3-c1/session-setup.csv` | 123 | `5be391412aadeaa47a5fcf8b2a44015d60c6c6f6f2b04762e86abf365e174208` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r3-c1/warmup-requests.csv` | 29448 | `8f7c66aa7f946cd0ba057cc207bddfda92df46dfa3628538da49306809e86c64` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r4-c1/health-readiness.csv` | 326 | `089b1613a74e80d7157b607a3f5c4da831f1cfd1a7ba64092618a70b824d51c2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r4-c1/layer-summary.csv` | 369 | `100bbaab6fd9b2583b7cb5e400e272d2ff07879c5a6b3ae73a539d2bc566c6ee` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r4-c1/layer-timings.csv` | 409745 | `ff6df409a490feeffc1dae87187e960576e035463aa27c7ff37e9c5e6c2c3330` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r4-c1/requests.csv` | 178957 | `591a6513512f0984e5f6fdb9ff29002f939cd6fd31da0cfd2e5bbbd10e5e1d42` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r4-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r4-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r4-c1/session-setup.csv` | 123 | `7cbc92966a3014c3de20ed7eaf5daf7bcda16f3126d042675b83b5f4b34e0594` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r4-c1/warmup-requests.csv` | 29447 | `176083c7838ccbba88609c51cfea0aaa8d5c786a04bc8e271c0084f6d07e22eb` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r5-c1/health-readiness.csv` | 327 | `414073c6d61b9644e480fe8733443d5fdbeb98563d333116b3341b1568a8f8d3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r5-c1/layer-summary.csv` | 380 | `8e939bbcb6ba8763ae57d0e3029879c57dfc5bf5f06170a7a4b42fdef5f6fc6a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r5-c1/layer-timings.csv` | 409897 | `9d319fa32157e4b24a3231f4fafe91a98f888428a4181d39e4c7b3e580bb6817` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r5-c1/requests.csv` | 179031 | `a29bebd2a1a77f3aa44a69a64a6d22c7ccfc71f6ca195c783c9d4a910776c850` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r5-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r5-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r5-c1/session-setup.csv` | 123 | `750548246b898f0d226c165140d105acf1833e429eb42a7fd9ba02ce74a4d70a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r5-c1/warmup-requests.csv` | 29472 | `7ce6bccbd288db2560b96cd7d44090c2cbcf64bfd811a3330c409215a9d297a8` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r6-c1/health-readiness.csv` | 325 | `748858eb7eb8e958b05fdff10d8fc28f56d36a3f6739e9045d9774bb97e38daa` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r6-c1/layer-summary.csv` | 370 | `4e974e2d64a53ede35fc0967aa490778a17fae9b89c0bd149148e7528b74edec` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r6-c1/layer-timings.csv` | 409879 | `971637f87240173fa319fc0ad4405ef2d2f00738a6c3192b9c0223ece60f71f5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r6-c1/requests.csv` | 179060 | `43ecdf99a41d8c350592948219654d56f6e5c989322505ada414b22cb1767029` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r6-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r6-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r6-c1/session-setup.csv` | 123 | `589d897c9eca5cbc668e18c84a27b99485fba16c60ade07fd8560cd0454a8f60` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r6-c1/warmup-requests.csv` | 29464 | `475793d793d340f21178407df4195a386054e4c7304c690d2965d487fb9d40e7` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r7-c1/health-readiness.csv` | 670 | `dd50e2461a4926e4d652cec9c88e535f63521accbe7639ee282d7b22294b16ed` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r7-c1/layer-summary.csv` | 384 | `7da5f684205c333125460e68baa3ca2b5815fb24c7b4ff8882c5805cad589835` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r7-c1/layer-timings.csv` | 409912 | `dc7342afc9115ed2a4623af1ce09022663b493b92aaffa17c091528a099db328` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r7-c1/requests.csv` | 179044 | `1f63e9841e5b906b9ad75ce7f9b7f608ded54c4b306751bbc9b7ccc8aa330684` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r7-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r7-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r7-c1/session-setup.csv` | 123 | `fbebfd0e353f644810323794c28aa6079c90f512bbaa12b7151ef5fee50d4231` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r7-c1/warmup-requests.csv` | 29475 | `e72daacdc2804ad18cf8c001929e22b0a608d52f22cffa41eebc62163dddb55d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r8-c1/health-readiness.csv` | 325 | `54907d7299e2de8b7027ed7d6359d7a9be18a6094dab7416e31cc2ef1230bf62` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r8-c1/layer-summary.csv` | 380 | `e789bb758953ee1a65784361b04f9df57b36912b04f70e363d05553228ac870b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r8-c1/layer-timings.csv` | 409986 | `fe84b9575390216d6c26598e6763a046af51075a7990546d85bd6651cb1f522d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r8-c1/requests.csv` | 179076 | `41699e0511cf8246a6339272a7bc0cd0da9724eb0b56142149f662709a1dc681` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r8-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r8-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r8-c1/session-setup.csv` | 123 | `a0c261cd403be5c53ffc1ec78a6e172c401ad1ef9413c7ab3fd1171331b684a5` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r8-c1/warmup-requests.csv` | 29483 | `039f816633fa4b1cbccc3f538a2a10293c09598d3cc3fb51bc197dfc1e8e2937` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r9-c1/health-readiness.csv` | 327 | `c85178d329d04bbb881f51a505d16f6ccbf65422edae49f69abb506fdda418ea` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r9-c1/layer-summary.csv` | 379 | `3657d7375f355b80f2d6b1637195e8cb930c0300d83b58717c96e1dd12d6a21b` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r9-c1/layer-timings.csv` | 409807 | `7a45aa94dbcfbe993f56f87758bfb92813abfdd2a3793f4c8c972571607b8db2` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r9-c1/requests.csv` | 179035 | `27c17e702e7ccc812001784eb236bdb7c06b204b39c2fda89d1b283581d9da5d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r9-c1/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r9-c1/server.stdout.log` | 84 | `e1acc9a9dbed99ad18b9dc523295730065ee33a18b7604c010c35657cc4ad5a3` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r9-c1/session-setup.csv` | 123 | `88e07ce958e9504ee8ccb0e7504a2d99ae12521afdccbf0440de3f10f350415a` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/none-r9-c1/warmup-requests.csv` | 29466 | `befa42344ff0464d4f36dc5301c4274db6c44108f1bc438e316c792dd9bd51ce` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/power-status-after-run.json` | 241 | `e9e5c118d57b788237792a780fed571e4acd8a30718e21021b04ef9a6e3a7627` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/rejection-cost.csv` | 5614 | `85a684770b4a3206f0661d9d7ed6dc716febc457f95b2c70a9beb657adc12b7d` |
| `experiments/results/e2-v2/2026-10-18T14-10-41-169Z/run.json` | 251333 | `a3dab817338a4aa5547d205a194a1bcec66aa6dc8e1e796bd4f5f5b1d448bdaf` |
| `experiments/results/e2-v2/layer-repeat-ci.csv` | 4280 | `610573e69192a882cc927b244a0e758527f949942135209738f48271a7745a01` |
| `experiments/results/e2-v2/layer-timing-summary.csv` | 31744 | `32a2ff33e834baee02a43b48674a48a59d51a9942aa00cd89d628f61168f3fb5` |
| `experiments/results/e2-v2/load-repeat-summary.csv` | 1068 | `daf381305a1b5ec7f917401888ac46a4a49d3838d929d8e71286c22dd6476a90` |
| `experiments/results/e2-v2/load-repeats.csv` | 20446 | `73ed45040a0e83ffc3e0d4176e3fb54a674503c7f1b36df2ef620528abd3c6bb` |
| `experiments/results/e2-v2/load-summary.tex` | 546 | `fd4329741d4b4bf80bea6076fd7f401239a91651c9879565e5cfabc8f9a7c776` |
| `experiments/results/e2-v2/rejection-cost.csv` | 5614 | `85a684770b4a3206f0661d9d7ed6dc716febc457f95b2c70a9beb657adc12b7d` |
| `experiments/results/e2-v2/rejection-cost.tex` | 2212 | `7a6ba1d214f07472c00651198c300a69fbaada591a00beae3ab7325f2924beed` |
| `experiments/results/e2-v2/run.json` | 251333 | `a3dab817338a4aa5547d205a194a1bcec66aa6dc8e1e796bd4f5f5b1d448bdaf` |
| `experiments/results/e2-v2/server-handler-cost.pdf` | 17405 | `7acff80025cb8496046c39cffb80ed19c21b86abe5b4810ed20f108091f196cb` |
| `experiments/results/e2-v2/server-handler-cost.png` | 75161 | `3f097530bd2f25e28e5b0c9924a05ff34e83a5466b888dc4ec865f83010598a1` |
| `experiments/results/e2-v2/server-handler-cost.svg` | 47319 | `7c74603f844ba7bc5c0176df8bb1036a6f3dc5aaf3a48324ec70deec7dc09e84` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/health-readiness.csv` | 383 | `0ec6b69bf6b25745d9fa02242cb0d6c35f415e469c863747205765fef7e70178` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/layer-timings-rejected.csv` | 504264 | `9dac32a6e3cde4e2f27a92525a3facc56916a4bed4742ec47243668567000b69` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/layer-timings.csv` | 504264 | `9dac32a6e3cde4e2f27a92525a3facc56916a4bed4742ec47243668567000b69` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/profile-flush.json` | 156 | `1f322d0e3697456381edaee230716922f82f954024bd48395abb7272c298c5f4` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/requests.csv` | 347088 | `c6937e5b6f9546ad34f211d472c66ea722b9a897bc1a081edb39d6b78175db45` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/server.stderr.log` | 200 | `b0c79a13e185525f2acd6eef7bf0ff13a9ee3e16d645bae2c2fcf668d65710a3` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/server.stdout.log` | 1402 | `12e347a087193f7aea5ecb4880f95b7e90b8b6143f82926843127c454f50b5fc` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/session-setup.csv` | 123 | `2ea6ac83a26246c95acc3571c866e37a07ec740adbe492e94c28d3e45864daf5` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/health-readiness.csv` | 382 | `404828fb95c9f16fdf0606f6cad301c0b1ba11349f107f116ab8891caa018c38` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/layer-timings-rejected.csv` | 504382 | `f00d561a58d185423d61a52d3432cdc2c22ae00f7ad41466a9672cd5fed66c84` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/layer-timings.csv` | 504382 | `f00d561a58d185423d61a52d3432cdc2c22ae00f7ad41466a9672cd5fed66c84` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/profile-flush.json` | 156 | `517054666fca9a0c3a964ad9f308a6bb6b1948aab64ad0914ad7e835f3e44681` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/requests.csv` | 347089 | `9fe6096a538d720643ff8734132fe52a4f009bd8da72c7826d245cad8bd11907` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/server.stderr.log` | 199 | `503bdf695d8ec7281198ae9683468b876d5a22a5a7f0c2bc93a3fc9c8ca900f9` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/server.stdout.log` | 1403 | `0c5b04663e901804eae6c0c4581198357332534bd9b2c5f4475b9831ad5d0b53` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/session-setup.csv` | 124 | `79867da4c32f9b129dcfbfbcfbf2a4c696b6659f7475fde02982eff52882f002` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/health-readiness.csv` | 442 | `c5c1d3649e841c775364d07df290d07966cf0540d670ae1f0c6d8ef435145446` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/layer-timings-rejected.csv` | 504312 | `d94b78911c452058c8812c01fa3b85888bedf95ce665bc281fdd2d310e1a2373` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/layer-timings.csv` | 504312 | `d94b78911c452058c8812c01fa3b85888bedf95ce665bc281fdd2d310e1a2373` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/profile-flush.json` | 156 | `5260e090c927849c3aabf823dca2505049b9fc735405f5a135a53a695111fe99` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/requests.csv` | 347085 | `e35a09c9b0c59ccb35517106a6b3b2ddb9a822dc59c7699ed79896a7e3eafd85` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/server.stderr.log` | 200 | `2d5f41b9f77438c4b1eb67b13c37ebeaf71730454ebd2ee2aee56fc74667185a` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/server.stdout.log` | 1400 | `0326d5e41ed9686c585045c4b2437782517549581fac70044321a7e6e9c73dc2` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/session-setup.csv` | 123 | `ab4c0a7590445e633a73078ab829cb87b4ea0f4d685669d7427c729e9d296343` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/health-readiness.csv` | 498 | `5061fd273543267feb7d3a8787966ef169f7aaeea43e1c2d1dd5432d53124f21` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/layer-timings-rejected.csv` | 519809 | `45acebc7213040084e636197c82ce44ce1f13cb89a8b417efda957e5512f9d09` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/layer-timings.csv` | 519809 | `45acebc7213040084e636197c82ce44ce1f13cb89a8b417efda957e5512f9d09` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/profile-flush.json` | 156 | `03f397d9db8373f12e0e19c04a8196629c52cbe3d32b4b9bfd08c033c64e8405` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/requests.csv` | 395143 | `686cc6c6fdb783623161091138f34bd0a5d708d27bdb17c0947c134adc52f3ca` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/server.stderr.log` | 200 | `db1ae54dd6f40c4bb47abe0aeb1a41e0eadf74ca9d898b54a9a315a057620b35` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/server.stdout.log` | 1202 | `23d9d8c4909c4fe7ca3c4c4bfb7044426c9c37a4ce3c8104a845278d338c7aee` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/session-setup.csv` | 123 | `34a12ecd69a61b0391af6a1cb1fbbbce5760976e682651afd65d242b7b662963` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/health-readiness.csv` | 441 | `2221bd43a5d96b3bc98aee9071a01a8a6d343ee999c18fd6b09cf55ec1058450` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/layer-timings-rejected.csv` | 519546 | `63f95a9d703f8199c3904dee9351842bb3cbc72a88ed9a31e9401b142b7e1293` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/layer-timings.csv` | 519546 | `63f95a9d703f8199c3904dee9351842bb3cbc72a88ed9a31e9401b142b7e1293` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/profile-flush.json` | 156 | `bf26e93b14405b6058aa3982a8e4a75799aeb7aee75a245ef6fd3497e0c4b6ec` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/requests.csv` | 395104 | `94c4ac976f184a1a4ac7df7bf92960374a8bafc29b556bf97dde769d18ef2880` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/server.stderr.log` | 200 | `6100ce31028ef0e9710d78a41cf668c876a8310f1b5b02993f9d808be5c358f5` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/server.stdout.log` | 1094 | `a7aa0753f94b670bca237a7eb250cac8db801bc5d0065b7bda7a9c32750fa8a3` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/session-setup.csv` | 123 | `5a03253d3f88cc57408243c12c6463f56c834c943e5be04e03ee915054890ab1` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/health-readiness.csv` | 499 | `674f30bee0614fcdd39b84ecbc45885e111f98aa2f0d8f02a6584ccd3ace63fa` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/layer-timings-rejected.csv` | 519422 | `a153b1e909140b0549499b9d59b5a5cfeabd842648aa227b5c51692418a12587` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/layer-timings.csv` | 519422 | `a153b1e909140b0549499b9d59b5a5cfeabd842648aa227b5c51692418a12587` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/profile-flush.json` | 156 | `6a0809049bf7cf26b73d3de382e2620052273b551c186f7ea3228bece4ffb1b3` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/requests.csv` | 395110 | `493f2765f5e368168259b0f8e2f7b448be11e6a12772c903ee1a5332bf1ce696` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/server.stderr.log` | 200 | `a8f53147317fc2ef0ca6e17b8dbe38787daa60e914d1a56118c3e625d450d69e` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/server.stdout.log` | 1198 | `410a93edbdc53c1dd7c53e78a4812694ab33d55153bd0ab8da3ff9ad72bba480` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/session-setup.csv` | 123 | `cf9a568da101a7ac95939f180911359e0bafe7f5e08a00755e0ca3be83212247` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r1/health-readiness.csv` | 444 | `722ada9f6b9b11027e1a7ea7a66c7826562e62cd7481ac1037f24d15fd455fbe` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r1/layer-timings-rejected.csv` | 504944 | `fa95165b76e2d04c0f4f4364c97e3402c57b3e44e405648b9d33d4bfaff2ad88` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r1/layer-timings.csv` | 505102 | `7fc37316d3e9a0989e82f808698fcee81c95892d54fa0b86295869186c2076db` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r1/profile-flush.json` | 156 | `7bd2ed737ac840827681d50996c2a4ff318c127ee78c680077e822addae604bd` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r1/requests.csv` | 371139 | `46892c5c823e8362dee208108ceed243cc7569d3a1780f652a7b6042c36e4430` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r1/server.stderr.log` | 200 | `77488cb514a2dde2943885a53089d519ba8f59c5150e7eeb8dc45ff1e629802b` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r1/server.stdout.log` | 1407 | `be16fa70060250df171f4ad82a6045bf0611284a8e37e56e318bb7945b21b9a7` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r1/session-setup.csv` | 124 | `d6aa290d25b2ae349fb82e5b48bdc52e1092ac6467ac434b041b0ea4a993a67c` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r2/health-readiness.csv` | 442 | `b8513785a14a758dc989f7dfe34a68953018320c0c0668461170138b35f7d182` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r2/layer-timings-rejected.csv` | 504810 | `f09d4d2a661b9c62c1f6fc2c2ba028f3c38498e87733673cfd932923d93b9dca` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r2/layer-timings.csv` | 504964 | `f6eefaeb5b34b8bbc45bde7c9d6e6769a423067b09cc64df7ba0899f23f3483c` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r2/profile-flush.json` | 157 | `2fdad95281a659ea4fd3d574ffe562220bafa9cfad3cada6f12f12f68ae3b832` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r2/requests.csv` | 371117 | `0188ed83d8ad3e90ab3d78866bce606fe2a22d1df477616d3cb26bf1ea068b15` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r2/server.stderr.log` | 200 | `4f2481300e0ce2d6afe42f7f7ab6fa15298aba293c5fe1dd09d57855e4e82207` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r2/server.stdout.log` | 1404 | `737d32e946196d28557883923de040035d7d33afe943249d7f6429a0adc6f4b4` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r2/session-setup.csv` | 123 | `1ce528219d93c90614240cecbc7ce4f561947f05be4eeffb16067b62cf85750b` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r3/health-readiness.csv` | 496 | `4a5898f26430d417045c194738e437e73e4c399efaef7c0cbe63be29a8b31c2d` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r3/layer-timings-rejected.csv` | 504703 | `0ef2bcd0e1227147e164b09e7fd0a1edbf612627987535d55aca4647d2d0420a` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r3/layer-timings.csv` | 504703 | `0ef2bcd0e1227147e164b09e7fd0a1edbf612627987535d55aca4647d2d0420a` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r3/profile-flush.json` | 156 | `17218ba13b177df4363b288f4cd25866f04844f742cb0001a372800fa7eeccaf` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r3/requests.csv` | 371114 | `26be9afb912705c0ee2b3283f9af076e850f91dab87c504a2f3aef8fc8684bf9` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r3/server.stderr.log` | 199 | `896ae4b75fe947e8c9c0364879b49a7894cf65a1e44dbfdf721c04af8eadb9af` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r3/server.stdout.log` | 1406 | `0c3a8a9726a6bd4446f4dc9528d7f75e113346b0ef3799a73badb8ef7c1da515` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/all_four-timestampfirst-flood-duplicate_request_id-r3/session-setup.csv` | 123 | `00c9bb3613102b10edc86d987a3b0bb44fc1486292c72073aca4521dc0e6dae2` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/profiled-run.json` | 445 | `4d42afa2f7196b7421e7db1389ae29df6edf7cad024ff2e85b6ff3b280ee5f04` |
| `experiments/results/e2-v2-profiled/2026-10-18T15-27-16-321Z/rejection-cost-profiled.csv` | 3097 | `82871b93cdf865611294da97beb4fc0af5d0020dbb4248951e41a917b045f607` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/health-readiness.csv` | 382 | `3d12557052974b067445b92259d68c11d94374037ca2edfc513d4595f2d84dc9` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/layer-timings-rejected.csv` | 504404 | `fc31e81493bf671de315f1b71eec9db596ac9d68d9f800e80a9b31fcce7d6286` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/layer-timings.csv` | 504404 | `fc31e81493bf671de315f1b71eec9db596ac9d68d9f800e80a9b31fcce7d6286` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/profile-flush.json` | 150 | `166462efdb8cba8cb14de9aac1ec447cb329a205ff21401880898e15269bd9b2` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/requests.csv` | 347087 | `d65d2f202f583be53d1a988b986c21f22e102cfdda7fbee98a09ff40f7caf4de` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/server.stderr.log` | 200 | `9a0a575375f3e09b95c3a390e97b3920ef4a27db0d4d67210a07cddd0fa48372` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/server.stdout.log` | 1559 | `9467170767a64272369252e47c757d05a92c80fd27f81d751cdad068800545c0` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r1/session-setup.csv` | 123 | `0a230706920a9420dc9b74efda83ec9434e80152be9ca6a58e112e2a51a9864c` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/health-readiness.csv` | 382 | `874b683b9668d681ccbf94fa1c98e298a24e25b626b0a49d7e18e437e160fb6b` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/layer-timings-rejected.csv` | 504364 | `eb284a92dde5d09cc5d7f4d05b886b887c00fa88b36d70654919eedd3de2420c` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/layer-timings.csv` | 504364 | `eb284a92dde5d09cc5d7f4d05b886b887c00fa88b36d70654919eedd3de2420c` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/profile-flush.json` | 150 | `ecfc1bd955d40b487cc4e08a779cc459893b564d9d182fd51577461fdc50ea68` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/requests.csv` | 347089 | `37bcb6d2b50b494d335058db71c3472cf9fbb390245d2cf51d0e45b13c5384ee` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/server.stderr.log` | 200 | `f1ddee9607db1e683061b233901f0764122cc5b462a96aef7de9eba0b0daa36f` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/server.stdout.log` | 1560 | `eef29749cde5c708ce92a7d531dc5e89663ddfa45c79dac663a2bace0abc1f6d` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r2/session-setup.csv` | 123 | `1fe74004f51896aaa75725594107408ead273c086558c9c463af93f335e8edc5` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/health-readiness.csv` | 439 | `899a78c562f78f03b422d416202cb8240e4de0d22693b69b166ef6151808907a` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/layer-timings-rejected.csv` | 504345 | `f9e08b8708579f74fcd0f47e6fe2291fe5fba4c7fab6b92622245926bd533564` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/layer-timings.csv` | 504345 | `f9e08b8708579f74fcd0f47e6fe2291fe5fba4c7fab6b92622245926bd533564` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/profile-flush.json` | 150 | `54632ce1babeb31dd3ca317f04bc814ec8964e9c01ae72acd1da08b81edf3051` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/requests.csv` | 347088 | `d0a4ddb8a372a9d097da377c5509df48c97e1b889ef966a34b7e89f7b7d6e5cf` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/server.stderr.log` | 200 | `89551d91ebfc74ab111580a93036e34d052169fae41702537623590e58977af7` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/server.stdout.log` | 1562 | `1550cb3292ef999940fa762e5e097e8fd02d94ddd97b865e974c821dd0662169` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-hmac,timestamp,nonce,request_id,balance-flood-duplicate_request_id-r3/session-setup.csv` | 123 | `6c2d4a40a8fd519006517d55c68d68d1082c6adacd0e540db0c0fed6ffc0b056` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/health-readiness.csv` | 382 | `c5d26e61ac08feed988d675949c822b5ce2b1c33d1767b9510a14f86d9dda649` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/layer-timings-rejected.csv` | 519283 | `2a3e4ffa1531876122f39a1e2a3689f1f54ba53a8d1e92ca497c3a80d782915e` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/layer-timings.csv` | 519283 | `2a3e4ffa1531876122f39a1e2a3689f1f54ba53a8d1e92ca497c3a80d782915e` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/profile-flush.json` | 150 | `4282f67109e3b36d76f1bc6fb8d8f24d7a674a2857b3bae5a00d80b4a61b11d5` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/requests.csv` | 395102 | `159f0413ac7f61520f840ee51deb7b2df1b856f7e9e3964faa52f34d7ff90903` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/server.stderr.log` | 200 | `1490273815b66ed36b98ea73f02550b65d06975681383a8f008ef5dc45edec9f` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/server.stdout.log` | 1458 | `ff99086438f2e89ff88bd2e6c713cf2f8e22d8880382e78ab4fbd725ff968d6b` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r1/session-setup.csv` | 123 | `3629fb81d56c5eefe290a8163c222c1c74034193d6bc856849bcacebff77cb66` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/health-readiness.csv` | 381 | `4dd157f37a4f193d5be2aabc08a89746536485766fb83ea16463c2c65c115832` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/layer-timings-rejected.csv` | 519313 | `334aa390b01d6511025ab5dbc0c694eab1b4262e8ba1cdd84bac8554fc2261c0` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/layer-timings.csv` | 519313 | `334aa390b01d6511025ab5dbc0c694eab1b4262e8ba1cdd84bac8554fc2261c0` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/profile-flush.json` | 150 | `17f4b00377117ae02b966f90e694717743f358cf7631e41afcac557c58a253e9` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/requests.csv` | 395103 | `82c0eeb0bd76b4f7338fa415ffc01a770ffd5b0dc9aafcd8d32a000eb741d6f1` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/server.stderr.log` | 199 | `0836f2a2481f2037fbcc560d57f6c8ca69bec34d7fdb27ac01cf881260601715` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/server.stdout.log` | 1457 | `5d8625aad84bcb6a5ce4073318aa6182faadb7434130250e065693044e02a1e0` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r2/session-setup.csv` | 123 | `098a7f83f7a32e7f4e4970534af5186a8826188c1614899873187a37cf1fc1a3` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/health-readiness.csv` | 383 | `e8e481ccd79c8bfca1cacd8a70d62f3b49e88a69dec2120c398fea9980154661` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/layer-timings-rejected.csv` | 519335 | `66df66fd2e5823e76a21ac891a5bd9ad3a2a784fb1a6e9df1b5be8e854b492ed` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/layer-timings.csv` | 519335 | `66df66fd2e5823e76a21ac891a5bd9ad3a2a784fb1a6e9df1b5be8e854b492ed` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/profile-flush.json` | 150 | `4c219a85d9898a41bac53089cf18a2fe892328ca8f5f70c79ad586e8f20d41fb` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/requests.csv` | 395100 | `200ffc364197892e8fe235e73e56386231fe166c6fc0413c7112f11e008528fe` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/server.stderr.log` | 200 | `9d64cc3c2153bc7385b95e2977369dc7f39745dead582b939c4e9c1ea2dd9124` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/server.stdout.log` | 1356 | `24ba957a92f056de0bbc4f0e053d8c707bf904eaf2ee50484651b8dc0b63c1e9` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-requestidbeforenonce-flood-duplicate_request_id-r3/session-setup.csv` | 123 | `c8ff483244bdd455bef5ca870c59de93b6aa5381dbf8bc575890c4e248032596` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r1/health-readiness.csv` | 387 | `4d06a247faace65125d9348a6c814f7132954ddf90d3febb55414d7bf9408b07` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r1/layer-timings-rejected.csv` | 504185 | `243cb9fbe56fd20a0ef9e7e40b35dbbcad24f764be83046d3b864a47dadd7e9b` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r1/layer-timings.csv` | 504340 | `cdcc90fc9ac7ab9ec4f5764a04da99f34e9dab6ddf3e22d5604bc5d70d48db5f` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r1/profile-flush.json` | 150 | `9c02d0ba657e28e601649fd894ea9a9e7a33a29e2cc49b8c74059cb3cc15dd25` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r1/requests.csv` | 371095 | `b0b9b91fdaf6abca702647d1c02d3fa6afc3d5efb49fc50c9f12ee9021c3825b` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r1/server.stderr.log` | 200 | `371567bdc7923b4a5e8d29e8ab790a09b98f550f861476a5d8d4c832f666db09` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r1/server.stdout.log` | 1558 | `0b7d609b2bb9e134460d9ffea80606871e6c6731ff670c56ee1873b6613d9d9a` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r1/session-setup.csv` | 123 | `dfa4cd4fcc28efcc2e4f2787f411eafd747f2f75269530509347ae1cdf665b95` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r2/health-readiness.csv` | 442 | `0a863b98da753fa9d9e0957d8cfe7780c36bff99a51b69a0913c3fb51d56bf32` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r2/layer-timings-rejected.csv` | 504267 | `4affc57f60c2bb3f97a935852f0e71609c18a8a3e6a3eaf1b0c14a81ff3947b9` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r2/layer-timings.csv` | 504422 | `0bc1ad2462757063e49137f47406006d8aa925e1699c38208efd19d3c0146eea` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r2/profile-flush.json` | 150 | `a2c7580894afda5f23f16be7a3caba350f8726cf74489b859e7641971dbec0d3` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r2/requests.csv` | 371097 | `1dedfd6c790e6c96600658ad4d958bf9d3e1ec3f5e787811dbf7b68bf57aa138` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r2/server.stderr.log` | 200 | `7be5fbc10a08ba9bf55254f9d100a5fb0ea4507eda2ed901ed65bc1e4ebefbee` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r2/server.stdout.log` | 1459 | `b4791899831c1963f273e5a2f5289ea0ab95565412bfc237bdf574c23d998050` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r2/session-setup.csv` | 123 | `96cf453d3137b73ca567cde6fc8c7850604c600e8fb0a3d19309617621f0db7b` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r3/health-readiness.csv` | 385 | `5ecf61f6f7adb262631cb2c8285e7f657504036a7f3a4d4b5a627d59091f2d9a` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r3/layer-timings-rejected.csv` | 504345 | `b65db23d74d811a868e56d104485c740086fbe020a222b08a559297ef5d2b568` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r3/layer-timings.csv` | 504345 | `b65db23d74d811a868e56d104485c740086fbe020a222b08a559297ef5d2b568` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r3/profile-flush.json` | 150 | `c91744a8f0602ecd2b6ddd45498d98088d845a9702ef82215813ce41cb4d9634` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r3/requests.csv` | 371093 | `377dbcd17eff19f2feafee114321993a764de952d4323b8ff578cdbf734e541d` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r3/server.stderr.log` | 200 | `90f580fe9f44032349c75e6d0be365a74f0cb64ac8356a9704239797757b8abf` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r3/server.stdout.log` | 1562 | `0402854512f90eef837adb885740bb6005dc40d06a99842680993cebc5069331` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/all_four-timestampfirst-flood-duplicate_request_id-r3/session-setup.csv` | 123 | `ac29136498d83c9e7a558d2c9be8afb38eb4a12e6a66f3a21a9a7a47d3a19ca8` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/profiled-run.json` | 445 | `a20fbc96a758841bdd5af28104002caca2a92b8388106607f92f10fb6ee5c0ae` |
| `experiments/results/e2-v2-profiled-corrected/2026-10-18T15-29-06-997Z/rejection-cost-profiled.csv` | 3201 | `91ad9f15fa78caa32b88945e374979178d6844706864391c499ab25af495e3b9` |
| `experiments/results/e3-v2/false-rejection-vs-past-and-replay-window.pdf` | 24782 | `8540332aaa893797b1ce2a529331161b08ec8c83e01a4bd9e2c8c6879b2ccc52` |
| `experiments/results/e3-v2/false-rejection-vs-past-and-replay-window.png` | 181114 | `06677ac0fb93a96641eba5df1e6b0ce8131ef946ee8f8211f4b0763e6cd5606f` |
| `experiments/results/e3-v2/false-rejection-vs-past-and-replay-window.svg` | 108376 | `5158e288a5e3b3683b6463d9c1d335fbd7edb9a4831a7fe40f24f12ba3c6a082` |
| `experiments/results/e3-v2/P1/past-120-future-0/server-timings.csv` | 251095 | `fe27fb0c34b9033d49f683486b03b6f39c20aaba7885539882bd69cf0bedc308` |
| `experiments/results/e3-v2/P1/past-120-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-120-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-120-future-2/server-timings.csv` | 235968 | `63cb9dc7eb12a35c7e81efb30c3a7e252f40db36a8d3ed584051bc7240515bb3` |
| `experiments/results/e3-v2/P1/past-120-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-120-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-120-future-30/server-timings.csv` | 238146 | `67ee53bb9e7b19b59a6e573ae746a484700156116eca4cc76f9d30e0424e7da9` |
| `experiments/results/e3-v2/P1/past-120-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-120-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-120-future-5/server-timings.csv` | 235524 | `d5abaa5f431c91f1ca04065d87dfa5b51bc9f25a918cc6214ff5b23c313a9436` |
| `experiments/results/e3-v2/P1/past-120-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-120-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-120-future-60/server-timings.csv` | 238247 | `db531c17801f58143e5559464dd243c7370bda76948dda872fe81d86e29fe3d3` |
| `experiments/results/e3-v2/P1/past-120-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-120-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-30-future-0/server-timings.csv` | 246175 | `d0d27cf8b6410fb5c1048f0ef7832bc372ef9dc5aea62ce43c29953b5e76bedc` |
| `experiments/results/e3-v2/P1/past-30-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-30-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-30-future-2/server-timings.csv` | 231523 | `29533a9b7364e35ff30ae47d851fd4109fbe960ef6af9689e2485c003f80589e` |
| `experiments/results/e3-v2/P1/past-30-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-30-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-30-future-30/server-timings.csv` | 233499 | `8b52e5b68469af94be2760b44b26352682850a7170151cb0895b7e430d71aa4f` |
| `experiments/results/e3-v2/P1/past-30-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-30-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-30-future-5/server-timings.csv` | 231385 | `80f576677c9fe3fac8aee758f0ee21bafd6d1ba9d792882a98af1fa4b42e2da7` |
| `experiments/results/e3-v2/P1/past-30-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-30-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-30-future-60/server-timings.csv` | 235361 | `34d531ec819038b03c44ee4ab5429624c30dadd632c9b692c6f077eb1ec1f334` |
| `experiments/results/e3-v2/P1/past-30-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-30-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-300-future-0/server-timings.csv` | 250315 | `d38ba654521359e526f3d8c9c29da18492b07e0ab3a93ead385d780b728122dd` |
| `experiments/results/e3-v2/P1/past-300-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-300-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-300-future-2/server-timings.csv` | 235570 | `c68099d879ab4ccd7458b97cafaad26e36bd5d8dd03eb6825aef8c278f08f9c0` |
| `experiments/results/e3-v2/P1/past-300-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-300-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-300-future-30/server-timings.csv` | 237970 | `04b195eac42a7ba5a72d4ec3bf5cdfaa5130f6c13756f09c140870ea71f33ad9` |
| `experiments/results/e3-v2/P1/past-300-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-300-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-300-future-5/server-timings.csv` | 236201 | `f289c64dcc599dc2b0294fc67545c93666bfceeda7edd112dfe7c5e149533a81` |
| `experiments/results/e3-v2/P1/past-300-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-300-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-300-future-60/server-timings.csv` | 238129 | `ea769b5716df6b7396a2928445c28374bc464c75d79e245e204603fec1b222f2` |
| `experiments/results/e3-v2/P1/past-300-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-300-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-5-future-0/server-timings.csv` | 244511 | `ccdf0f18c490aebcf0fb173c16b0b75822f95eb231cdad9c36e333eb22303e88` |
| `experiments/results/e3-v2/P1/past-5-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-5-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-5-future-2/server-timings.csv` | 229652 | `b5fd04b32e79343988d9fcf572f62c10c640785952e456c881e8549136def466` |
| `experiments/results/e3-v2/P1/past-5-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-5-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-5-future-30/server-timings.csv` | 231464 | `9d4966f4daeee5db3d0b79fcd7c9c25d83cf43625301232b8d23e6b0342c8128` |
| `experiments/results/e3-v2/P1/past-5-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-5-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-5-future-5/server-timings.csv` | 229759 | `eeb3a376a2e0db378d5cea23593da84d993894d8449cf698e6fd32f9f804cf56` |
| `experiments/results/e3-v2/P1/past-5-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-5-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-5-future-60/server-timings.csv` | 232089 | `10216cd886fc2c40da71ee9ed95565bfd3a58dd4327a46fab26087df6cdc364d` |
| `experiments/results/e3-v2/P1/past-5-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-5-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-60-future-0/server-timings.csv` | 248345 | `af5a8bf4fa58ca72025b87667d4508ec508a56e9a76b2088b9a364b149eb407e` |
| `experiments/results/e3-v2/P1/past-60-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-60-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-60-future-2/server-timings.csv` | 233351 | `41459b01b5aad7b59943b86372b8d6caa26f7de89a36310d333e2d2d811ce9cb` |
| `experiments/results/e3-v2/P1/past-60-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-60-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-60-future-30/server-timings.csv` | 235337 | `352e89de0a499aa5143b22b7fa66494f4bc4d2b9211c88245ee401de2e524565` |
| `experiments/results/e3-v2/P1/past-60-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-60-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-60-future-5/server-timings.csv` | 233617 | `552b9e1984ad1e665b6a2155695b78b93257b2ac0c072df77d2f83f40f8abda3` |
| `experiments/results/e3-v2/P1/past-60-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-60-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P1/past-60-future-60/server-timings.csv` | 235426 | `9aed9e2e7c063c8edee10d8a736ce9f76bd9e82cbc9f3759d318862169a58901` |
| `experiments/results/e3-v2/P1/past-60-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P1/past-60-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/p1-false-rejection-vs-future.pdf` | 18625 | `6bd7ddc89410ea8c5cb72de8b2864af4f66b5961318d36b856e975c9a52e75d0` |
| `experiments/results/e3-v2/p1-false-rejection-vs-future.png` | 60965 | `254d52aa5d0b35d1bad469703f6d6be8ff2cc9c075ec7d7abb58b239fbe5785c` |
| `experiments/results/e3-v2/p1-false-rejection-vs-future.svg` | 43395 | `2490a9820bb883fca386de5c0a56b532e0955627cb39f5eb5c011101253af8a6` |
| `experiments/results/e3-v2/P2/past-120-future-0/server-timings.csv` | 253736 | `dec9f691fccf5a1677293d293faecfa79db5dcbb1a9a17a778e6b77f0c903809` |
| `experiments/results/e3-v2/P2/past-120-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-120-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-120-future-2/server-timings.csv` | 243830 | `d3f2661298041c365c03766bd1c345376bc5bf27da9d72d89fc49d20bc7bce0d` |
| `experiments/results/e3-v2/P2/past-120-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-120-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-120-future-30/server-timings.csv` | 237653 | `d9ade0682f4d2b07737f4ea09eb135df881847d94849e538d8304abe0bc305e7` |
| `experiments/results/e3-v2/P2/past-120-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-120-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-120-future-5/server-timings.csv` | 237227 | `0e490dd2b169d6fbd2c29239c10be9ef32a3b67b8143c35d0a253f26d8fab319` |
| `experiments/results/e3-v2/P2/past-120-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-120-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-120-future-60/server-timings.csv` | 238118 | `c7ce8917e239081be3b117fca38025b97bc148f4780dfb6229990c8a2e2ce55d` |
| `experiments/results/e3-v2/P2/past-120-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-120-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-30-future-0/server-timings.csv` | 253556 | `bca2b8cedc6b7040233df35a1340fec87da78811da63534f46243a7d86f42b37` |
| `experiments/results/e3-v2/P2/past-30-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-30-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-30-future-2/server-timings.csv` | 242420 | `455d422bd41265c2f7659bd244c81de6066648cd22f462b23a7be1b29e0974de` |
| `experiments/results/e3-v2/P2/past-30-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-30-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-30-future-30/server-timings.csv` | 236724 | `92d950ba6a1ec0f4da77efcfa174cf0e1245dcac6fe279fa450b968c21a41f60` |
| `experiments/results/e3-v2/P2/past-30-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-30-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-30-future-5/server-timings.csv` | 235289 | `bd26a9b32d96e3f1d7023b3e76c191aef0d68b5a56417ab09448b8bc33e9976b` |
| `experiments/results/e3-v2/P2/past-30-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-30-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-30-future-60/server-timings.csv` | 235406 | `f1410dd5e21ed6e905312f0424168652aa9b50c5d230a37d7e2903e2e0fb7748` |
| `experiments/results/e3-v2/P2/past-30-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-30-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-300-future-0/server-timings.csv` | 253249 | `7231d21033b84719121d95e171ea111e824fb12e9da887012dc3afce0734b2e6` |
| `experiments/results/e3-v2/P2/past-300-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-300-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-300-future-2/server-timings.csv` | 245178 | `a2d4322fb41919c7784072e77586b8cce7397231f7e693b99e8e9e99f553b80a` |
| `experiments/results/e3-v2/P2/past-300-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-300-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-300-future-30/server-timings.csv` | 238267 | `797488ee3369a468bb93ee3a9c86391a94b377644893d959609d3ca043af202e` |
| `experiments/results/e3-v2/P2/past-300-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-300-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-300-future-5/server-timings.csv` | 237649 | `93659e4fdc23dfc52322945d535561972b72f6bcacb445c687ff236cc39be42a` |
| `experiments/results/e3-v2/P2/past-300-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-300-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-300-future-60/server-timings.csv` | 237813 | `8d956af6bcb1f8359f199d5eb983184edfb46dbe1c4d367902c4dd1cc264d01e` |
| `experiments/results/e3-v2/P2/past-300-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-300-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-5-future-0/server-timings.csv` | 254264 | `88536024711ab61b866db0846fe17b1dbaeb6009a0d7c832c2225999e54540a5` |
| `experiments/results/e3-v2/P2/past-5-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-5-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-5-future-2/server-timings.csv` | 243396 | `17cb9fca8b4d5fe0d799584596efc98fb9bb5913c080a22703c0dd74ddd269de` |
| `experiments/results/e3-v2/P2/past-5-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-5-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-5-future-30/server-timings.csv` | 238133 | `5076339e074f1408ec1bdc5d48ee6284714721f3f46b426e44fe3710e5372141` |
| `experiments/results/e3-v2/P2/past-5-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-5-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-5-future-5/server-timings.csv` | 238007 | `ff4355ba3d9b7538b5ad68f1483a0ec1e16d6249eecfde6fca6fa7c183f18991` |
| `experiments/results/e3-v2/P2/past-5-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-5-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-5-future-60/server-timings.csv` | 237882 | `d18c7d168142193baf453f21c6160ca2c5e2df5c6e1e8362f3ede5df06c593a7` |
| `experiments/results/e3-v2/P2/past-5-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-5-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-60-future-0/server-timings.csv` | 252134 | `1b9b9fd2fb423765e0e61eb14c7ce9aa7e2914394cbbfef41752aa373ea0dd80` |
| `experiments/results/e3-v2/P2/past-60-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-60-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-60-future-2/server-timings.csv` | 241491 | `202da0656580beaa1e7fdb77a4bc68aeb36a19ded2adb9a7c0399b7ab4e0d9a9` |
| `experiments/results/e3-v2/P2/past-60-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-60-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-60-future-30/server-timings.csv` | 235300 | `4b68fe634bded6fa9fbeaf89ee5d831d60b83eef1f78016a4f7269e38bf63256` |
| `experiments/results/e3-v2/P2/past-60-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-60-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-60-future-5/server-timings.csv` | 235124 | `4924167b003a52653597e3686796a3760c9df515d062c7a3e0bfe1d1c1dedae1` |
| `experiments/results/e3-v2/P2/past-60-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-60-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P2/past-60-future-60/server-timings.csv` | 235359 | `8da274600c95f262106f6f91c3f2ede351edab09bde9d0bdcced18ba5d8eb009` |
| `experiments/results/e3-v2/P2/past-60-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P2/past-60-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/p2-false-rejection-vs-future.pdf` | 18791 | `c8cb6b9be50d3eb2224df62f16f84e0255e746686963c42bbb88288ecfbb46f1` |
| `experiments/results/e3-v2/p2-false-rejection-vs-future.png` | 80378 | `fb6b435d6935002837b545ad815b7488eba1b6e4dcd6324d6cedfbeb11c1a4fd` |
| `experiments/results/e3-v2/p2-false-rejection-vs-future.svg` | 43009 | `6ad4d4b8989c0df8317c35b73df572299284ca72e6bf0ce43d207d7c800d2dc7` |
| `experiments/results/e3-v2/P3/past-120-future-0/server-timings.csv` | 256589 | `a814857fc6efa95a104ac06f0f6604acd26f458ef12f2c8fc5752d3b0c4f30a8` |
| `experiments/results/e3-v2/P3/past-120-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-120-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-120-future-2/server-timings.csv` | 255505 | `91242d006bf930b664bae27be63a7a678576d8a9cc1195e667b6eebf3fae8a8e` |
| `experiments/results/e3-v2/P3/past-120-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-120-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-120-future-30/server-timings.csv` | 243582 | `5a179cf680c071dbf2716ef88d2228e2384cd3b2a33272b152d2e80890fd9eda` |
| `experiments/results/e3-v2/P3/past-120-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-120-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-120-future-5/server-timings.csv` | 253712 | `166b8748fb05245faa5554d6535f711a1c15955303f6e9bfdfdeef3a09796c5a` |
| `experiments/results/e3-v2/P3/past-120-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-120-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-120-future-60/server-timings.csv` | 238600 | `125da8a6ce2e753a0335206f3e4d74396ef171f00dfc8190318eea9c151f7cde` |
| `experiments/results/e3-v2/P3/past-120-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-120-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-30-future-0/server-timings.csv` | 262900 | `a922809a9c87303cf9495250af000eed8a5ea290c510c0ef1a87878a1ffa5361` |
| `experiments/results/e3-v2/P3/past-30-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-30-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-30-future-2/server-timings.csv` | 261995 | `b95e0d73bc8f030ef192173b72cb64ae6c3dcc4745fd674fd13e78a7aa9e7a51` |
| `experiments/results/e3-v2/P3/past-30-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-30-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-30-future-30/server-timings.csv` | 250797 | `28d560df477c794f2a592bf3bad8a17882f652df1537affda783a8ffeb97a603` |
| `experiments/results/e3-v2/P3/past-30-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-30-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-30-future-5/server-timings.csv` | 261227 | `a5d300204e8c0eddce59c1a0d0f199b4d775ef06cce525d7207d123fe0190df0` |
| `experiments/results/e3-v2/P3/past-30-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-30-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-30-future-60/server-timings.csv` | 245596 | `6b9921be6c5d8110a3a12fe3d3802323e499c18b7a1b8f2e9435cdf0b2919ca9` |
| `experiments/results/e3-v2/P3/past-30-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-30-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-300-future-0/server-timings.csv` | 255720 | `33dfc0775f0d23d17c1bf19afa2ce0b368fd56a535248f493b81abccca99580b` |
| `experiments/results/e3-v2/P3/past-300-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-300-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-300-future-2/server-timings.csv` | 255578 | `4420491d6dcece6b4bb7d6ae6f4c31686141be12b88906b7c255fa45e2b546d0` |
| `experiments/results/e3-v2/P3/past-300-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-300-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-300-future-30/server-timings.csv` | 243954 | `234b02ef3cb57bae2ce841c02238245d227cd66d646258f50a066a8105827ae2` |
| `experiments/results/e3-v2/P3/past-300-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-300-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-300-future-5/server-timings.csv` | 254209 | `60dd51f164e952c4ef56e7dc667d2180961b20eab903845f94d9223243fe75f2` |
| `experiments/results/e3-v2/P3/past-300-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-300-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-300-future-60/server-timings.csv` | 238118 | `3401fd81e0c560fbf8e108663978252971a2ab0be39489f8e2497b333830a594` |
| `experiments/results/e3-v2/P3/past-300-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-300-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-5-future-0/server-timings.csv` | 274744 | `c35920454886ef329ead104849a54db7a20e18ae9550a143864c4dc95831f81b` |
| `experiments/results/e3-v2/P3/past-5-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-5-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-5-future-2/server-timings.csv` | 274163 | `73492b29ed75d13fbd27ddbff1a5db67859a8279c0bb55be4138860214a60e4a` |
| `experiments/results/e3-v2/P3/past-5-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-5-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-5-future-30/server-timings.csv` | 261931 | `e1e755c8322c25d16488bf0feaa4d3f8abc07a092388c90535b8a9ab2b139dcb` |
| `experiments/results/e3-v2/P3/past-5-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-5-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-5-future-5/server-timings.csv` | 272552 | `da6cbbba512bd052fe5ed46f0941fa0517b48e2915ee68f46029f8544933b483` |
| `experiments/results/e3-v2/P3/past-5-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-5-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-5-future-60/server-timings.csv` | 256468 | `09434bb432e893ef36a9e3fc8d74b1cd9098c7bb425f467848413fe36e8f5ad8` |
| `experiments/results/e3-v2/P3/past-5-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-5-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-60-future-0/server-timings.csv` | 256681 | `f53942f768b81a545db395aef3717de363dc25856ecab355ead63249e1385633` |
| `experiments/results/e3-v2/P3/past-60-future-0/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-60-future-0/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-60-future-2/server-timings.csv` | 254923 | `137c2eba7953894310fb14ef57eed9ae0eb95d1483d2c6b0df5edf6eabb8e9cd` |
| `experiments/results/e3-v2/P3/past-60-future-2/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-60-future-2/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-60-future-30/server-timings.csv` | 243584 | `53667ee41979079a243368b85a8db33875f4b86182cadf972c0cd8ac14f07d6f` |
| `experiments/results/e3-v2/P3/past-60-future-30/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-60-future-30/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-60-future-5/server-timings.csv` | 251913 | `9abc0fd93f0a258e8151e0d99074aeab052b7367e60560e6c904bb83f2cfc987` |
| `experiments/results/e3-v2/P3/past-60-future-5/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-60-future-5/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/P3/past-60-future-60/server-timings.csv` | 238357 | `fcb61aac3dd10a96d3a4fbe061213d89bd4db6bc4135165b0cea52d68a52c8cf` |
| `experiments/results/e3-v2/P3/past-60-future-60/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e3-v2/P3/past-60-future-60/server.stdout.log` | 84 | `38030b371ce1ae28e7ef57f6e08a6b0aa3e666ceccb65ddb2fd7216c470f4ce0` |
| `experiments/results/e3-v2/p3-false-rejection-vs-future.pdf` | 19324 | `262fcabba64388073e5128d45aa5ec68122be173efbcb4a432fd80220b2b7a87` |
| `experiments/results/e3-v2/p3-false-rejection-vs-future.png` | 109236 | `b11b93fcd4e6a40403ec3b8f30f541958bc670aaa4c8ef5c6e301e426703485f` |
| `experiments/results/e3-v2/p3-false-rejection-vs-future.svg` | 43446 | `56471d1f3bae27a102387a6dd1239cea3242ae9f50c064f1dbae5affaae016c3` |
| `experiments/results/e3-v2/requests.csv` | 21753304 | `260b0a695554e9d6f6f9788e57c3e47131050d24f312e29d21dea97ee71fc998` |
| `experiments/results/e3-v2/run.json` | 1166 | `749fdd6b321959e1d8feed033f4e54723c05e08da14225837056b69cadca92a1` |
| `experiments/results/e3-v2/summary.csv` | 12505 | `b9a5898245997649e70872b61ea83198f608bd241647ddbc936a587d06d40b12` |
| `experiments/results/e3-v2/summary.tex` | 4411 | `8707393eb1011a34f3ead25aab1d8b06c2352fc6c70cc769bd823c4513a68180` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL10/server-timings.csv` | 211709 | `30885604834de88d35c3557f7db862503a470fa932f3b96126c8f4ea8c4f8c32` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL10/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL10/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL12/server-timings.csv` | 211740 | `84b5a6ca0b37de31d73dcd5db8c7f39af0e6a159b3be909bfa24cbbe47567594` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL12/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL12/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL4/server-timings.csv` | 206823 | `d33071e66f1afcda04d86da957ce7f99abfcee68294cc43548f0652808e36627` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL4/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL4/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL6/server-timings.csv` | 207628 | `6cc6287ab1e3efb9b460ae034293e288324e6ad57841074707fe5c5e946458c0` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL6/server.stderr.log` | 67 | `e46ee8b2bacb753550094d181bd6a7cb6a7cb031d6a0a1bfc07d688b81c18f65` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL6/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL8/server-timings.csv` | 208483 | `b1c306789f65651a0e6de7608aaf207e2d479a56b74fb9f4f42ca7bbb35a40c9` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL8/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e4-v2/E4a/H1T1N1R0-TTL8/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL10/server-timings.csv` | 212473 | `fdad0ff0670439680e3e844c66279b095dde440a0dd5f9d030ff812c3ca4c52d` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL10/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL10/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL12/server-timings.csv` | 212931 | `4096c79859651d158d834e855d260147725dcc8e6b17a774d131cf3415abb815` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL12/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL12/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL4/server-timings.csv` | 209580 | `ea5efe16dc08886be5452492cf771861ccabc9fdf996e9c74bbbe5ca3ec186ae` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL4/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL4/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL6/server-timings.csv` | 209622 | `10936f5be5cce9ef7100e0ac1060bd939d61ca3df8e32ff252c39fa894ce86aa` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL6/server.stderr.log` | 67 | `e46ee8b2bacb753550094d181bd6a7cb6a7cb031d6a0a1bfc07d688b81c18f65` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL6/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL8/server-timings.csv` | 209386 | `d20fad6b67a6fd8498e21c9e328b35f6f1c04466da79b2d8bbcd80e6946c9af2` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL8/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/e4-v2/E4a/H1T1N1R1-TTL8/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/e4a-grid.tex` | 24284 | `5f5a5c8276f41c14c165e620b5f4b76ba25d5f9ee758b434975637bc2c46c61c` |
| `experiments/results/e4-v2/e4a-requests.csv` | 1168452 | `a1760a8caa7299cc38ad3d66d064cb4beebbebbff133647275d2cba29e7b1436` |
| `experiments/results/e4-v2/e4a-summary.csv` | 14552 | `fa49f93c7f42408bf54deaa079b9f9ff84c1c21b396dcfbebbe855d25f19abf3` |
| `experiments/results/e4-v2/E4b/fault-fail-closed-requestid-0/server-timings.csv` | 5546 | `c45c1ce4b951c537bef0752cdde0c72529fbbdc26b79f857d7b28355a4cd70b8` |
| `experiments/results/e4-v2/E4b/fault-fail-closed-requestid-0/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4b/fault-fail-closed-requestid-0/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4b/fault-fail-closed-requestid-1/server-timings.csv` | 5655 | `275061d60aabec18f87e5b37bc9b20631eaddddf55ceee45f3f8ccf492dc3e76` |
| `experiments/results/e4-v2/E4b/fault-fail-closed-requestid-1/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4b/fault-fail-closed-requestid-1/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4b/fault-fail-open-requestid-0/server-timings.csv` | 4733 | `d1526a4655b6c5d107242caaf7e8002220c84490d75d01a05913301b9872efc3` |
| `experiments/results/e4-v2/E4b/fault-fail-open-requestid-0/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4b/fault-fail-open-requestid-0/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4b/fault-fail-open-requestid-1/server-timings.csv` | 4693 | `dcf18337540072b94adcb2b8f6f6ac6721b4bc098e1071d3a0c3c826c6c4a5ec` |
| `experiments/results/e4-v2/E4b/fault-fail-open-requestid-1/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4b/fault-fail-open-requestid-1/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/e4b.csv` | 14200 | `423ead4d881363fae853c8b2b34dddb9a78c6a7b8de252c54733731abd128178` |
| `experiments/results/e4-v2/E4c/insufficient-fresh-nonce/server-timings.csv` | 582 | `463a5e5e9ff4702477d183bf32a9daa27b55eade37cd2b4213d3aebb3fa62878` |
| `experiments/results/e4-v2/E4c/insufficient-fresh-nonce/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/insufficient-fresh-nonce/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4c/insufficient-same-nonce/server-timings.csv` | 584 | `5ce2b7dfda63a20c62a9334b196c6c4748aea102b1fe1cf0a54bdddf308e092c` |
| `experiments/results/e4-v2/E4c/insufficient-same-nonce/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/insufficient-same-nonce/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4c/loss-p0-default-fresh-nonce-same-request-id/server-timings.csv` | 18267 | `b1d46f89044a0c3dc6a09322ff36cc40f488d47077bb1f6deb7891048ce9187a` |
| `experiments/results/e4-v2/E4c/loss-p0-default-fresh-nonce-same-request-id/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/loss-p0-default-fresh-nonce-same-request-id/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4c/loss-p0-default-same-signed/server-timings.csv` | 15053 | `dce24c1ad081be082f719f65952ab5eb5a31da4a9646a5b9770b6bd3c7174ec3` |
| `experiments/results/e4-v2/E4c/loss-p0-default-same-signed/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/loss-p0-default-same-signed/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4c/loss-p0-request_id_before_nonce-fresh-nonce-same-request-id/server-timings.csv` | 21451 | `6e1acacba540dfb7bac691f4410dae77c02cc51058e17e21117d335e993b5249` |
| `experiments/results/e4-v2/E4c/loss-p0-request_id_before_nonce-fresh-nonce-same-request-id/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/loss-p0-request_id_before_nonce-fresh-nonce-same-request-id/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4c/loss-p0-request_id_before_nonce-same-signed/server-timings.csv` | 18253 | `7e005d7540a00bb8e44fc4dcbb36e5dc800349bac36ba6f380ea41a4e317df67` |
| `experiments/results/e4-v2/E4c/loss-p0-request_id_before_nonce-same-signed/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/loss-p0-request_id_before_nonce-same-signed/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4c/loss-p0.05-default-fresh-nonce-same-request-id/server-timings.csv` | 19416 | `5d2a5811263b1b41e858c8f6fdc21e798c98071f7156bc0a298130926366acae` |
| `experiments/results/e4-v2/E4c/loss-p0.05-default-fresh-nonce-same-request-id/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/loss-p0.05-default-fresh-nonce-same-request-id/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4c/loss-p0.05-default-same-signed/server-timings.csv` | 16483 | `4355941b41a0a9240acdbf2659d0aaa6f8620c0b81d0c8ba296dd53b5da00c1e` |
| `experiments/results/e4-v2/E4c/loss-p0.05-default-same-signed/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/loss-p0.05-default-same-signed/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4c/loss-p0.05-request_id_before_nonce-fresh-nonce-same-request-id/server-timings.csv` | 24901 | `2da031757d4e991b84450a1c0461961c03c7891bdaa36afb3e83169396aed88e` |
| `experiments/results/e4-v2/E4c/loss-p0.05-request_id_before_nonce-fresh-nonce-same-request-id/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/loss-p0.05-request_id_before_nonce-fresh-nonce-same-request-id/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4c/loss-p0.05-request_id_before_nonce-same-signed/server-timings.csv` | 19439 | `9d27d663f1bcb761af162070e90aef076dd726e1fb293863eeff65461aa196aa` |
| `experiments/results/e4-v2/E4c/loss-p0.05-request_id_before_nonce-same-signed/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/loss-p0.05-request_id_before_nonce-same-signed/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4c/loss-p0.2-default-fresh-nonce-same-request-id/server-timings.csv` | 22349 | `84f54ba0cb75928f397a50fb6400d9307ca8739554d1f7bde4f176ba865b3483` |
| `experiments/results/e4-v2/E4c/loss-p0.2-default-fresh-nonce-same-request-id/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/loss-p0.2-default-fresh-nonce-same-request-id/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4c/loss-p0.2-default-same-signed/server-timings.csv` | 20641 | `e104d709aada58ca14be95d6368eb6243e09e897d83b5e7757ce854833847e81` |
| `experiments/results/e4-v2/E4c/loss-p0.2-default-same-signed/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/loss-p0.2-default-same-signed/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4c/loss-p0.2-request_id_before_nonce-fresh-nonce-same-request-id/server-timings.csv` | 25540 | `33daef43ac614c530e6a0de130c48e67a43f53c36c05b6aec406683ef2a505c0` |
| `experiments/results/e4-v2/E4c/loss-p0.2-request_id_before_nonce-fresh-nonce-same-request-id/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/loss-p0.2-request_id_before_nonce-fresh-nonce-same-request-id/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/E4c/loss-p0.2-request_id_before_nonce-same-signed/server-timings.csv` | 23901 | `05fac87ddc22174d130f6f7a4b317af68a72f2cdc602cfbb61054b2cf4f7f36b` |
| `experiments/results/e4-v2/E4c/loss-p0.2-request_id_before_nonce-same-signed/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2/E4c/loss-p0.2-request_id_before_nonce-same-signed/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2/e4c.csv` | 213465 | `d5e592ce132b86ac3bacae877a5cad41efa5814af76dcf6db68eac3f2ccb3464` |
| `experiments/results/e4-v2/e4d-derived.csv` | 3221 | `eff60fbb5f3beed1a33955c7365fed38b59974ff384dd7f1a6bbc422d81ec656` |
| `experiments/results/e4-v2/e4d-derived.tex` | 609 | `52d849960b8d9865a6a281317e8551c3e9ff9e87b65fb1190f0039ee727b44d7` |
| `experiments/results/e4-v2/fault-mode.tex` | 402 | `025dea43911ad8467fa72eb257ef667f44b2d8ce949a6e8abc54868e0b187a62` |
| `experiments/results/e4-v2/retry-loss-corrected.tex` | 1630 | `5d6318ed108b6312d9e32167ea1e2a146b506367e7305f71564e63606046d919` |
| `experiments/results/e4-v2/retry-loss.tex` | 1577 | `f4d095664c545903bd91ccfdfc9ad8fb423ee10f9904c51a66d6b5ad4f85059f` |
| `experiments/results/e4-v2/run.json` | 637 | `097709e9aeca3ec9a1c0c4111893abffc8743df3a5a42980b86d1e3ebbdadeb0` |
| `experiments/results/e4-v2-corrected/E4c/insufficient-fresh-nonce/server-timings.csv` | 583 | `35bbba5531d8548878007fc5fcfa68c1a4d50b51a21c634a3c704ea4739201c0` |
| `experiments/results/e4-v2-corrected/E4c/insufficient-fresh-nonce/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/insufficient-fresh-nonce/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/E4c/insufficient-same-nonce/server-timings.csv` | 585 | `c3cc3983a4875815365935da3974efe6f19c80684d82acb6bb22b2da8c44f033` |
| `experiments/results/e4-v2-corrected/E4c/insufficient-same-nonce/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/insufficient-same-nonce/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0-default-fresh-nonce-same-request-id/server-timings.csv` | 18052 | `2a7c2b8222b789c10721d0f5ffe19a4023e727c6ee1c0f4aeb804da3aae515c6` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0-default-fresh-nonce-same-request-id/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0-default-fresh-nonce-same-request-id/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0-default-same-signed/server-timings.csv` | 14864 | `11d57c1e71b99dbf5542efd4a428fad2bff5e0df8ccb357a7e32e0873a430a61` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0-default-same-signed/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0-default-same-signed/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0-request_id_before_nonce-fresh-nonce-same-request-id/server-timings.csv` | 21256 | `accc3cdca0504a2f6f12a042494fb0fe3345c67a683e95d925247c7377ef6666` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0-request_id_before_nonce-fresh-nonce-same-request-id/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0-request_id_before_nonce-fresh-nonce-same-request-id/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0-request_id_before_nonce-same-signed/server-timings.csv` | 18052 | `0222e8683953f7b7050104720e491e4c4a965095d1fa16aeebef3d6d32961b80` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0-request_id_before_nonce-same-signed/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0-request_id_before_nonce-same-signed/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.05-default-fresh-nonce-same-request-id/server-timings.csv` | 19300 | `b7156964b546023012b096bb33368e6bd87d563e4450899db546688ef1b193fa` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.05-default-fresh-nonce-same-request-id/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.05-default-fresh-nonce-same-request-id/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.05-default-same-signed/server-timings.csv` | 16153 | `3a00dc2624b3648e83453284d1400a3f73fca493d61b1993f1db01bf623bde4d` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.05-default-same-signed/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.05-default-same-signed/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.05-request_id_before_nonce-fresh-nonce-same-request-id/server-timings.csv` | 22136 | `af8009c1ed4134e09da9ad489b1250cbcd9727d75491649bd8ca2136f752cd26` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.05-request_id_before_nonce-fresh-nonce-same-request-id/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.05-request_id_before_nonce-fresh-nonce-same-request-id/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.05-request_id_before_nonce-same-signed/server-timings.csv` | 20727 | `d9cdd35e4cc1d38bbb6cfe34545c5c8ac6143f34885e4050b88301b158b3ac13` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.05-request_id_before_nonce-same-signed/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.05-request_id_before_nonce-same-signed/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.2-default-fresh-nonce-same-request-id/server-timings.csv` | 23468 | `bb81fb05f7c9c109d9d6c0842c859eb31d269849c5a8e57969f446030c13bf62` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.2-default-fresh-nonce-same-request-id/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.2-default-fresh-nonce-same-request-id/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.2-default-same-signed/server-timings.csv` | 18237 | `b0b60433310fc350195d13d087b6a7b0ca6d44c0cf2d5e430fae363392ecc50b` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.2-default-same-signed/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.2-default-same-signed/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.2-request_id_before_nonce-fresh-nonce-same-request-id/server-timings.csv` | 25678 | `be537adae09641f25e8d98c4a1e4ba94d62ace302acc67134862f7a89580f0fe` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.2-request_id_before_nonce-fresh-nonce-same-request-id/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.2-request_id_before_nonce-fresh-nonce-same-request-id/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.2-request_id_before_nonce-same-signed/server-timings.csv` | 23584 | `ddcf20e88e71842dbb7986f7a05d3986f5451755dd20c2d0d2bc87f5e698eeb4` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.2-request_id_before_nonce-same-signed/server.stderr.log` | 67 | `91612a630712b2ebf4661696aad5d27aac595a35a8aea04592d88c57a5f95107` |
| `experiments/results/e4-v2-corrected/E4c/loss-p0.2-request_id_before_nonce-same-signed/server.stdout.log` | 84 | `d28b68f63bb8f51c354201f7dfb880c6a30d5e1dcf74ea18f017c932b10a69a5` |
| `experiments/results/e4-v2-corrected/e4c.csv` | 213565 | `7499a4ff04cfece23d1e1a8d87c1e772166478a30f82d946196b2d39086dbc02` |
| `experiments/results/e4-v2-corrected/run-e4c-corrected.json` | 408 | `e394e89553bdee5f04e216010685a6d1b1f1678d079063f4b4f98bc2f2756a48` |

Raw CSVs and logs remain on disk. Session bearer values, session keys, and signatures are not included in this pack.
