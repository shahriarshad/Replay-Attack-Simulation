# Round I report

## 1. Requested work and status

|Item|Status|Evidence|
|-|-|-|
|I1 E1 v3 clean profile|Done|experiments/results/e1-v3/round-i-scaled/summary.csv|
|I2 independent S10 and resubmissions|Done|experiments/results/e1-v3-s10-independent/2026-10-22T04-40-36-408Z/summary.csv; experiments/results/round-i/s10-independent/resubmission/summary.csv|
|I3 route binding, atomic debit, exact E4c|Done|experiments/results/round-i/route-binding/requests.csv; experiments/results/round-i/atomic-debit/runs.csv; experiments/results/round-i/e4c-exact/e4c.csv|
|I4 presentation|Done|paper/ figures and tables|
|I5 docs, audit, tests, commit|Done|audit-report.md; npm-test.log; commit c9022ef|
|I6 detailed report|Done|this report|

## 2. Environment and exact run metadata

Node v24.11.1; Windows 10 build 26200 x64; Intel Core i5-8365U; RAM 8,395,841,536 bytes; Memurai Developer 4.2.3 (Redis compatibility 7.4.9), 127.0.0.1:6379. Active power plan Balanced, GUID `381b4222-f694-41f0-9685-ff5bb260df2e`. AC/battery and CPU frequency queries were denied by Windows; no power plan change was attempted.

|Run|Command|Started UTC|Ended UTC|Runtime seconds|Metadata|
|---|---|---|---:|---:|---|
|E1 v3|`node experiments/e1/run.js (6/2/8/15 s; all configs)`|2026-10-22T04:23:29.440Z|2026-10-22T04:39:47.218Z|977.778|experiments/results/e1-v3/round-i-scaled/run.json|
|S11 v3|`node experiments/e1/run.js (S11, E1_ATTEMPTS=100)`|2026-10-22T04:39:56.395Z|2026-10-22T04:40:26.513Z|30.118|experiments/results/e1-v3-s11/round-i-s11/run.json|
|S10 independent|`node experiments/e1/run-s10-independent.js`|2026-10-22T04:40:36.426Z|2026-10-22T04:45:43.193Z|306.767|experiments/results/e1-v3-s10-independent/2026-10-22T04-40-36-408Z/run.json|
|Route binding|`node experiments/checks/run-route-binding.js`|2026-10-22T04:22:39.364Z|2026-10-22T04:22:40.894Z|undefined|experiments/results/round-i/route-binding/run.json|
|Atomic debit|`node experiments/checks/run-atomic-debit.js`|2026-10-22T04:22:45.453Z|2026-10-22T04:23:21.263Z|35.81|experiments/results/round-i/atomic-debit/run.json|
|E4c exact|`node experiments/e4/run.js (exact-count run)`|2026-10-22T04:46:09.764Z|2026-10-22T04:46:34.020Z|24.256|experiments/results/round-i/e4c-exact/run-e4c-corrected.json|
|Tests|`npm.cmd test`|2026-10-22T05:15:12.3498505Z|2026-10-22T05:15:18.0928004Z|5.7429499|experiments/results/round-i/final-verification/npm-test-run.json|

Audit command: `node experiments/audit/verify-results.js` with `AUDIT_OUTPUT_DIR=experiments/results/round-i/audit`. Paper commands: `python paper/generate_paper_assets.py`; `python paper/crosscheck_assets.py`.

## 3. File changes

New: `experiments/lib/exact-loss-pattern.js` (seeded exact-count shuffle); `experiments/e1/run-s10-independent.js` (distinct failed S10 requests and SQLite oracle); `experiments/e1/compare-v2-v3.js` (cell comparison); `experiments/checks/run-route-binding.js`, `run-atomic-debit.js` (I3 recorded runs); `experiments/write-round-i-docs.js` (raw-derived documentation); `server/test/round-i.test.js` (attempt override, loss pattern, route-binding unit tests).
Modified: `experiments/e1/run.js` (scenario/profile overrides and E1_ATTEMPTS); `experiments/e1/run-policy-resubmit.js` (profile controls and SQLite success counts); `experiments/e4/run.js` (exact-count common loss patterns); `experiments/audit/verify-results.js` (independent I1-I3 recomputation); `server/test/integration.test.js` (isolated outputs, path binding and atomic debit checks); `paper/generate_paper_assets.py` and `paper/crosscheck_assets.py` plus generated paper files; `docs/RESULTS_PACK_A.md`, `docs/CLAIMS_EVIDENCE.md`. No server defense logic/default TTL changed.

## 4. I1: E1 v3 and v2 differences

E1 v3 scaled profile: PAST=6 s, FUTURE=2 s, nonce TTL=8 s, SESSION_TTL=15 s; success_only; 16 configs. S1-S9 n=30, S5 n=1,500. S11 n=100 in separate run. Default confirmation uses PAST=300 s, FUTURE=5 s, TTL=300 s, session TTL=900 s; S2 wait=60 s, S4 wait=301 s.

|Configuration|Scenario|v2 k/n|v3 k/n|Difference|
|-|-|-|-|-|
|H0T0N1R0|S4|30/30|0/30|SUCCESS_RATE_CHANGED|
|H1T0N1R0|S4|30/30|0/30|SUCCESS_RATE_CHANGED|
|H0T0N0R0|S11|30/30|100/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H1T0N0R0|S11|0/30|0/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H0T1N0R0|S11|30/30|100/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H1T1N0R0|S11|0/30|0/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H0T0N1R0|S11|30/30|100/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H1T0N1R0|S11|0/30|0/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H0T1N1R0|S11|30/30|100/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H1T1N1R0|S11|0/30|0/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H0T0N0R1|S11|30/30|100/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H1T0N0R1|S11|0/30|0/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H0T1N0R1|S11|30/30|100/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H1T1N0R1|S11|0/30|0/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H0T0N1R1|S11|30/30|100/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H1T0N1R1|S11|0/30|0/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H0T1N1R1|S11|30/30|100/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|
|H1T1N1R1|S11|0/30|0/100|ATTEMPT_COUNT_CHANGED_RATE_SAME|

Compared 178 overlapping cells. 18 have changed counts or denominators: two success-rate changes (S4 for H0T0N1R0 and H1T0N1R0, each 30/30 to 0/30); the remaining 16 are S11 denominator change 30 to 100, same rates. E1 v3 summary SHA-256 247e2ec7d01bfc17cf3082bf4810aaf121bc2f9922f76c5d87ce3b4c98c92c4a; comparison CSV SHA-256 e4588e10ecb7922f31126524a4dca9b75a4cd42f68b3b9f6adfa395a5eae7dcd. Raw request data: experiments/results/e1-v3/round-i-scaled/<config>/requests.csv.

### Full E1 v3 attack matrix

The following records every non-control E1 v3 summary cell. Counts are SQLite-oracle debits/attempts; reasons are the raw blocking-reason histogram.

|Config|Scenario|Debits / attempts|HTTP accepted / attempts|Blocking reason histogram|
|-|-|-|-|-|
|H0T0N0R0|S1|30/30|30/30|{"ACCEPTED":30}|
|H0T0N0R0|S2|30/30|30/30|{"ACCEPTED":30}|
|H0T0N0R0|S3|30/30|30/30|{"ACCEPTED":30}|
|H0T0N0R0|S4|30/30|30/30|{"ACCEPTED":30}|
|H0T0N0R0|S5|1500/1500|1500/1500|{"ACCEPTED":1500}|
|H0T0N0R0|S6|30/30|30/30|{"ACCEPTED":30}|
|H0T0N0R0|S7a|30/30|30/30|{"ACCEPTED":30}|
|H0T0N0R0|S7b|30/30|30/30|{"ACCEPTED":30}|
|H0T0N0R0|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H0T0N0R0|S9|30/30|30/30|{"ACCEPTED":30}|
|H1T0N0R0|S1|30/30|30/30|{"ACCEPTED":30}|
|H1T0N0R0|S2|30/30|30/30|{"ACCEPTED":30}|
|H1T0N0R0|S3|30/30|30/30|{"ACCEPTED":30}|
|H1T0N0R0|S4|30/30|30/30|{"ACCEPTED":30}|
|H1T0N0R0|S5|1500/1500|1500/1500|{"ACCEPTED":1500}|
|H1T0N0R0|S6|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T0N0R0|S7a|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T0N0R0|S7b|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T0N0R0|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H1T0N0R0|S9|30/30|30/30|{"ACCEPTED":30}|
|H0T1N0R0|S1|30/30|30/30|{"ACCEPTED":30}|
|H0T1N0R0|S2|30/30|30/30|{"ACCEPTED":30}|
|H0T1N0R0|S3|30/30|30/30|{"ACCEPTED":30}|
|H0T1N0R0|S4|0/30|0/30|{"TIMESTAMP_FAIL":30}|
|H0T1N0R0|S5|1500/1500|1500/1500|{"ACCEPTED":1500}|
|H0T1N0R0|S6|30/30|30/30|{"ACCEPTED":30}|
|H0T1N0R0|S7a|30/30|30/30|{"ACCEPTED":30}|
|H0T1N0R0|S7b|30/30|30/30|{"ACCEPTED":30}|
|H0T1N0R0|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H0T1N0R0|S9|30/30|30/30|{"ACCEPTED":30}|
|H1T1N0R0|S1|30/30|30/30|{"ACCEPTED":30}|
|H1T1N0R0|S2|30/30|30/30|{"ACCEPTED":30}|
|H1T1N0R0|S3|30/30|30/30|{"ACCEPTED":30}|
|H1T1N0R0|S4|0/30|0/30|{"TIMESTAMP_FAIL":30}|
|H1T1N0R0|S5|1500/1500|1500/1500|{"ACCEPTED":1500}|
|H1T1N0R0|S6|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T1N0R0|S7a|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T1N0R0|S7b|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T1N0R0|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H1T1N0R0|S9|30/30|30/30|{"ACCEPTED":30}|
|H0T0N1R0|S1|0/30|0/30|{"NONCE_FAIL":30}|
|H0T0N1R0|S2|0/30|0/30|{"NONCE_FAIL":30}|
|H0T0N1R0|S3|30/30|30/30|{"ACCEPTED":30}|
|H0T0N1R0|S4|0/30|0/30|{"NONCE_FAIL":30}|
|H0T0N1R0|S5|0/1500|0/1500|{"NONCE_FAIL":1500}|
|H0T0N1R0|S6|0/30|0/30|{"NONCE_FAIL":30}|
|H0T0N1R0|S7a|0/30|0/30|{"NONCE_FAIL":30}|
|H0T0N1R0|S7b|30/30|30/30|{"ACCEPTED":30}|
|H0T0N1R0|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H0T0N1R0|S9|30/30|30/30|{"ACCEPTED":30}|
|H1T0N1R0|S1|0/30|0/30|{"NONCE_FAIL":30}|
|H1T0N1R0|S2|0/30|0/30|{"NONCE_FAIL":30}|
|H1T0N1R0|S3|30/30|30/30|{"ACCEPTED":30}|
|H1T0N1R0|S4|0/30|0/30|{"NONCE_FAIL":30}|
|H1T0N1R0|S5|0/1500|0/1500|{"NONCE_FAIL":1500}|
|H1T0N1R0|S6|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T0N1R0|S7a|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T0N1R0|S7b|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T0N1R0|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H1T0N1R0|S9|30/30|30/30|{"ACCEPTED":30}|
|H0T1N1R0|S1|0/30|0/30|{"NONCE_FAIL":30}|
|H0T1N1R0|S2|0/30|0/30|{"NONCE_FAIL":30}|
|H0T1N1R0|S3|30/30|30/30|{"ACCEPTED":30}|
|H0T1N1R0|S4|0/30|0/30|{"TIMESTAMP_FAIL":30}|
|H0T1N1R0|S5|0/1500|0/1500|{"NONCE_FAIL":1500}|
|H0T1N1R0|S6|0/30|0/30|{"NONCE_FAIL":30}|
|H0T1N1R0|S7a|0/30|0/30|{"NONCE_FAIL":30}|
|H0T1N1R0|S7b|30/30|30/30|{"ACCEPTED":30}|
|H0T1N1R0|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H0T1N1R0|S9|30/30|30/30|{"ACCEPTED":30}|
|H1T1N1R0|S1|0/30|0/30|{"NONCE_FAIL":30}|
|H1T1N1R0|S2|0/30|0/30|{"NONCE_FAIL":30}|
|H1T1N1R0|S3|30/30|30/30|{"ACCEPTED":30}|
|H1T1N1R0|S4|0/30|0/30|{"TIMESTAMP_FAIL":30}|
|H1T1N1R0|S5|0/1500|0/1500|{"NONCE_FAIL":1500}|
|H1T1N1R0|S6|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T1N1R0|S7a|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T1N1R0|S7b|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T1N1R0|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H1T1N1R0|S9|30/30|30/30|{"ACCEPTED":30}|
|H0T0N0R1|S1|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T0N0R1|S2|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T0N0R1|S3|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T0N0R1|S4|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T0N0R1|S5|0/1500|0/1500|{"ALREADY_PROCESSED":1500}|
|H0T0N0R1|S6|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T0N0R1|S7a|30/30|30/30|{"ACCEPTED":30}|
|H0T0N0R1|S7b|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T0N0R1|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H0T0N0R1|S9|30/30|30/30|{"ACCEPTED":30}|
|H1T0N0R1|S1|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H1T0N0R1|S2|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H1T0N0R1|S3|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H1T0N0R1|S4|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H1T0N0R1|S5|0/1500|0/1500|{"ALREADY_PROCESSED":1500}|
|H1T0N0R1|S6|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T0N0R1|S7a|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T0N0R1|S7b|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T0N0R1|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H1T0N0R1|S9|30/30|30/30|{"ACCEPTED":30}|
|H0T1N0R1|S1|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T1N0R1|S2|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T1N0R1|S3|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T1N0R1|S4|0/30|0/30|{"TIMESTAMP_FAIL":30}|
|H0T1N0R1|S5|0/1500|0/1500|{"ALREADY_PROCESSED":1500}|
|H0T1N0R1|S6|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T1N0R1|S7a|30/30|30/30|{"ACCEPTED":30}|
|H0T1N0R1|S7b|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T1N0R1|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H0T1N0R1|S9|30/30|30/30|{"ACCEPTED":30}|
|H1T1N0R1|S1|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H1T1N0R1|S2|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H1T1N0R1|S3|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H1T1N0R1|S4|0/30|0/30|{"TIMESTAMP_FAIL":30}|
|H1T1N0R1|S5|0/1500|0/1500|{"ALREADY_PROCESSED":1500}|
|H1T1N0R1|S6|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T1N0R1|S7a|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T1N0R1|S7b|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T1N0R1|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H1T1N0R1|S9|30/30|30/30|{"ACCEPTED":30}|
|H0T0N1R1|S1|0/30|0/30|{"NONCE_FAIL":30}|
|H0T0N1R1|S2|0/30|0/30|{"NONCE_FAIL":30}|
|H0T0N1R1|S3|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T0N1R1|S4|0/30|0/30|{"NONCE_FAIL":30}|
|H0T0N1R1|S5|0/1500|0/1500|{"NONCE_FAIL":1500}|
|H0T0N1R1|S6|0/30|0/30|{"NONCE_FAIL":30}|
|H0T0N1R1|S7a|0/30|0/30|{"NONCE_FAIL":30}|
|H0T0N1R1|S7b|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T0N1R1|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H0T0N1R1|S9|30/30|30/30|{"ACCEPTED":30}|
|H1T0N1R1|S1|0/30|0/30|{"NONCE_FAIL":30}|
|H1T0N1R1|S2|0/30|0/30|{"NONCE_FAIL":30}|
|H1T0N1R1|S3|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H1T0N1R1|S4|0/30|0/30|{"NONCE_FAIL":30}|
|H1T0N1R1|S5|0/1500|0/1500|{"NONCE_FAIL":1500}|
|H1T0N1R1|S6|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T0N1R1|S7a|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T0N1R1|S7b|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T0N1R1|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H1T0N1R1|S9|30/30|30/30|{"ACCEPTED":30}|
|H0T1N1R1|S1|0/30|0/30|{"NONCE_FAIL":30}|
|H0T1N1R1|S2|0/30|0/30|{"NONCE_FAIL":30}|
|H0T1N1R1|S3|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T1N1R1|S4|0/30|0/30|{"TIMESTAMP_FAIL":30}|
|H0T1N1R1|S5|0/1500|0/1500|{"NONCE_FAIL":1500}|
|H0T1N1R1|S6|0/30|0/30|{"NONCE_FAIL":30}|
|H0T1N1R1|S7a|0/30|0/30|{"NONCE_FAIL":30}|
|H0T1N1R1|S7b|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H0T1N1R1|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H0T1N1R1|S9|30/30|30/30|{"ACCEPTED":30}|
|H1T1N1R1|S1|0/30|0/30|{"NONCE_FAIL":30}|
|H1T1N1R1|S2|0/30|0/30|{"NONCE_FAIL":30}|
|H1T1N1R1|S3|0/30|0/30|{"ALREADY_PROCESSED":30}|
|H1T1N1R1|S4|0/30|0/30|{"TIMESTAMP_FAIL":30}|
|H1T1N1R1|S5|0/1500|0/1500|{"NONCE_FAIL":1500}|
|H1T1N1R1|S6|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T1N1R1|S7a|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T1N1R1|S7b|0/30|0/30|{"SIGNATURE_FAIL":30}|
|H1T1N1R1|S8|0/30|0/30|{"SESSION_INVALID":30}|
|H1T1N1R1|S9|30/30|30/30|{"ACCEPTED":30}|
|H1T1N1R1-DEFAULT|S2_default_window_60s|0/30|0/30|{"NONCE_FAIL":30}|
|H1T1N1R1-DEFAULT|S4_default_window_301s|0/30|0/30|{"TIMESTAMP_FAIL":30}|

Raw summary: experiments/results/e1-v3/round-i-scaled/summary.csv; SHA-256: 247e2ec7d01bfc17cf3082bf4810aaf121bc2f9922f76c5d87ce3b4c98c92c4a.

### S11 token-only forgery

|Config|Debits / attempts|Wilson 95%|Blocking reason histogram|
|-|-|-|-|
|H0T0N0R0|100/100|0.963007–1.000000|{"ACCEPTED":100}|
|H1T0N0R0|0/100|0.000000–0.036993|{"SIGNATURE_FAIL":100}|
|H0T1N0R0|100/100|0.963007–1.000000|{"ACCEPTED":100}|
|H1T1N0R0|0/100|0.000000–0.036993|{"SIGNATURE_FAIL":100}|
|H0T0N1R0|100/100|0.963007–1.000000|{"ACCEPTED":100}|
|H1T0N1R0|0/100|0.000000–0.036993|{"SIGNATURE_FAIL":100}|
|H0T1N1R0|100/100|0.963007–1.000000|{"ACCEPTED":100}|
|H1T1N1R0|0/100|0.000000–0.036993|{"SIGNATURE_FAIL":100}|
|H0T0N0R1|100/100|0.963007–1.000000|{"ACCEPTED":100}|
|H1T0N0R1|0/100|0.000000–0.036993|{"SIGNATURE_FAIL":100}|
|H0T1N0R1|100/100|0.963007–1.000000|{"ACCEPTED":100}|
|H1T1N0R1|0/100|0.000000–0.036993|{"SIGNATURE_FAIL":100}|
|H0T0N1R1|100/100|0.963007–1.000000|{"ACCEPTED":100}|
|H1T0N1R1|0/100|0.000000–0.036993|{"SIGNATURE_FAIL":100}|
|H0T1N1R1|100/100|0.963007–1.000000|{"ACCEPTED":100}|
|H1T1N1R1|0/100|0.000000–0.036993|{"SIGNATURE_FAIL":100}|

Raw summary: experiments/results/e1-v3-s11/round-i-s11/summary.csv; SHA-256: e67a7a7b69609b24598816dbc6523f11e99dbcdc2831d1178aaf0bd4c2a6fba2.

## 5. I2: S10-independent all cells

Thirty distinct failed request IDs and nonces per cell; amount 100; initial balance 1; one funding deposit 3,001, post-funding balance 3,002; fast replay at 1 s and late at 9 s. Values are delayed SQLite ledger executions.

|Config|Policy|Scenario|k/n|Wilson 95%|Blocking histogram|
|-|-|-|-|-|-|
|H0T0N0R0-success_only|success_only|S10_indep_fast|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H1T0N0R0-success_only|success_only|S10_indep_fast|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H0T1N0R0-success_only|success_only|S10_indep_fast|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H1T1N0R0-success_only|success_only|S10_indep_fast|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H0T0N1R0-success_only|success_only|S10_indep_fast|0/30|0.0000–0.1135|{"NONCE_FAIL":30}|
|H1T0N1R0-success_only|success_only|S10_indep_fast|0/30|0.0000–0.1135|{"NONCE_FAIL":30}|
|H0T1N1R0-success_only|success_only|S10_indep_fast|0/30|0.0000–0.1135|{"NONCE_FAIL":30}|
|H1T1N1R0-success_only|success_only|S10_indep_fast|0/30|0.0000–0.1135|{"NONCE_FAIL":30}|
|H0T0N0R1-success_only|success_only|S10_indep_fast|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H0T0N0R1-any_outcome|any_outcome|S10_indep_fast|0/30|0.0000–0.1135|{"ALREADY_PROCESSED":30}|
|H1T0N0R1-success_only|success_only|S10_indep_fast|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H1T0N0R1-any_outcome|any_outcome|S10_indep_fast|0/30|0.0000–0.1135|{"ALREADY_PROCESSED":30}|
|H0T1N0R1-success_only|success_only|S10_indep_fast|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H0T1N0R1-any_outcome|any_outcome|S10_indep_fast|0/30|0.0000–0.1135|{"ALREADY_PROCESSED":30}|
|H1T1N0R1-success_only|success_only|S10_indep_fast|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H1T1N0R1-any_outcome|any_outcome|S10_indep_fast|0/30|0.0000–0.1135|{"ALREADY_PROCESSED":30}|
|H0T0N1R1-success_only|success_only|S10_indep_fast|0/30|0.0000–0.1135|{"NONCE_FAIL":30}|
|H0T0N1R1-any_outcome|any_outcome|S10_indep_fast|0/30|0.0000–0.1135|{"NONCE_FAIL":30}|
|H1T0N1R1-success_only|success_only|S10_indep_fast|0/30|0.0000–0.1135|{"NONCE_FAIL":30}|
|H1T0N1R1-any_outcome|any_outcome|S10_indep_fast|0/30|0.0000–0.1135|{"NONCE_FAIL":30}|
|H0T1N1R1-success_only|success_only|S10_indep_fast|0/30|0.0000–0.1135|{"NONCE_FAIL":30}|
|H0T1N1R1-any_outcome|any_outcome|S10_indep_fast|0/30|0.0000–0.1135|{"NONCE_FAIL":30}|
|H1T1N1R1-success_only|success_only|S10_indep_fast|0/30|0.0000–0.1135|{"NONCE_FAIL":30}|
|H1T1N1R1-any_outcome|any_outcome|S10_indep_fast|0/30|0.0000–0.1135|{"NONCE_FAIL":30}|
|H0T0N0R0-success_only|success_only|S10_indep_late|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H1T0N0R0-success_only|success_only|S10_indep_late|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H0T1N0R0-success_only|success_only|S10_indep_late|0/30|0.0000–0.1135|{"TIMESTAMP_FAIL":30}|
|H1T1N0R0-success_only|success_only|S10_indep_late|0/30|0.0000–0.1135|{"TIMESTAMP_FAIL":30}|
|H0T0N1R0-success_only|success_only|S10_indep_late|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H1T0N1R0-success_only|success_only|S10_indep_late|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H0T1N1R0-success_only|success_only|S10_indep_late|0/30|0.0000–0.1135|{"TIMESTAMP_FAIL":30}|
|H1T1N1R0-success_only|success_only|S10_indep_late|0/30|0.0000–0.1135|{"TIMESTAMP_FAIL":30}|
|H0T0N0R1-success_only|success_only|S10_indep_late|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H0T0N0R1-any_outcome|any_outcome|S10_indep_late|0/30|0.0000–0.1135|{"ALREADY_PROCESSED":30}|
|H1T0N0R1-success_only|success_only|S10_indep_late|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H1T0N0R1-any_outcome|any_outcome|S10_indep_late|0/30|0.0000–0.1135|{"ALREADY_PROCESSED":30}|
|H0T1N0R1-success_only|success_only|S10_indep_late|0/30|0.0000–0.1135|{"TIMESTAMP_FAIL":30}|
|H0T1N0R1-any_outcome|any_outcome|S10_indep_late|0/30|0.0000–0.1135|{"TIMESTAMP_FAIL":30}|
|H1T1N0R1-success_only|success_only|S10_indep_late|0/30|0.0000–0.1135|{"TIMESTAMP_FAIL":30}|
|H1T1N0R1-any_outcome|any_outcome|S10_indep_late|0/30|0.0000–0.1135|{"TIMESTAMP_FAIL":30}|
|H0T0N1R1-success_only|success_only|S10_indep_late|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H0T0N1R1-any_outcome|any_outcome|S10_indep_late|0/30|0.0000–0.1135|{"ALREADY_PROCESSED":30}|
|H1T0N1R1-success_only|success_only|S10_indep_late|30/30|0.8865–1.0000|{"ACCEPTED":30}|
|H1T0N1R1-any_outcome|any_outcome|S10_indep_late|0/30|0.0000–0.1135|{"ALREADY_PROCESSED":30}|
|H0T1N1R1-success_only|success_only|S10_indep_late|0/30|0.0000–0.1135|{"TIMESTAMP_FAIL":30}|
|H0T1N1R1-any_outcome|any_outcome|S10_indep_late|0/30|0.0000–0.1135|{"TIMESTAMP_FAIL":30}|
|H1T1N1R1-success_only|success_only|S10_indep_late|0/30|0.0000–0.1135|{"TIMESTAMP_FAIL":30}|
|H1T1N1R1-any_outcome|any_outcome|S10_indep_late|0/30|0.0000–0.1135|{"TIMESTAMP_FAIL":30}|

S10 summary SHA-256 6b98e9ef7c39b7c5876dfac0fc0548a682e574d5cc5b281801a4fa39081b35ad.

|Policy|Retry variant|Successes/n|Wilson 95%|Ledger debits|Reasons|
|-|-|-|-|-|-|
|success_only|same_request_id_fresh_nonce|30/30|0.8865–1.0000|30|{"ACCEPTED":30}|
|success_only|new_request_id_fresh_nonce|30/30|0.8865–1.0000|30|{"ACCEPTED":30}|
|any_outcome|same_request_id_fresh_nonce|0/30|0.0000–0.1135|0|{"ALREADY_PROCESSED":30}|
|any_outcome|new_request_id_fresh_nonce|30/30|0.8865–1.0000|30|{"ACCEPTED":30}|

Resubmission CSV SHA-256 e199bfb833759aacc297e01dd3f38dd13c336cfa9c64bb7e3f90019097c52f15.

## 6. I3: correctness runs

### Route binding

|HMAC|Signed payload sent to|HTTP|Reason|Ledger rows|
|-|-|-|-|-|
|true|deposit-signed-to-withdraw|400|INVALID_REQUEST|0|
|true|withdraw-signed-to-deposit|400|INVALID_REQUEST|0|
|false|deposit-signed-to-withdraw|400|INVALID_REQUEST|0|
|false|withdraw-signed-to-deposit|400|INVALID_REQUEST|0|

All four mismatched-route requests returned HTTP 400 INVALID_REQUEST and created zero matching ledger rows, with HMAC enabled and disabled.
### Atomic debit

Thirty repetitions, each with 100 parallel amounts 1..100 against balance 100. All recorded invariants passed; minimum ledger balance was 0. Raw per-run CSV SHA-256 f9fef47c4839cdeea8c1023432d8ef3886ea645474c564020ec2b6871dbbc32d; raw path experiments/results/round-i/atomic-debit/runs.csv; ledger detail experiments/results/round-i/atomic-debit/ledger.csv.
### E4c exact loss sampling

|p|Order|Retry|Lost/200|Seed|Exactly-one debits|ALREADY_PROCESSED clues|
|-|-|-|-|-|-|-|
|0|default|same-signed|0/200|239869990|200|0|
|0|default|fresh-nonce-same-request-id|0/200|239869990|200|0|
|0|request_id_before_nonce|same-signed|0/200|239869990|200|0|
|0|request_id_before_nonce|fresh-nonce-same-request-id|0/200|239869990|200|0|
|0.05|default|same-signed|10/200|4112639160|200|0|
|0.05|default|fresh-nonce-same-request-id|10/200|4112639160|200|10|
|0.05|request_id_before_nonce|same-signed|10/200|4112639160|200|10|
|0.05|request_id_before_nonce|fresh-nonce-same-request-id|10/200|4112639160|200|10|
|0.2|default|same-signed|40/200|2846044782|200|0|
|0.2|default|fresh-nonce-same-request-id|40/200|2846044782|200|40|
|0.2|request_id_before_nonce|same-signed|40/200|2846044782|200|40|
|0.2|request_id_before_nonce|fresh-nonce-same-request-id|40/200|2846044782|200|40|

Exact-count Fisher–Yates samples lost exactly 0, 10 and 40 responses at p=0, .05 and .2, shared by cells at the same p. The earlier Bernoulli LCG allowed random counts and yielded 3 and 44; that prior output is superseded. Raw SHA-256 ab37252a36e325ec8d26a48a8b7d3fa5e4581de5ec1dba7f3e12ba16fd741d14.

## 7. I4 paper assets

F2/T5 use E1 v3 and independent S10 with n in headers; T2 uses independent S10/resubmission; T1/T4 and F3b/F5 regenerated. Paper generator checked 1,095 values with zero mismatches (`paper/VERIFY.txt`). Independent cross-check checked 672 values with zero mismatches (`paper/CROSSCHECK.txt`). LaTeX source was regenerated; TeX compilation was not performed.
## 8. I5 audit and tests

Audit: 4,532 compared, 0 mismatches (`experiments/results/round-i/audit/audit-report.json`, `.md`). Final test: 44 passed, 0 failed, runtime 5.743 s (`experiments/results/round-i/final-verification/npm-test.log`).
## 9. Full new source and changed-file diffs

The following embeds complete new JS sources and diffs for changed files. Any 64-character hex literal is redacted.

### experiments/lib/exact-loss-pattern.js
```javascript
﻿'use strict';
function makeExactLossPattern(probability, trials = 200, seed = 0xE4C2026) {
  if (!(probability >= 0 && probability <= 1)) throw new RangeError('probability must be within [0,1]');
  if (!Number.isSafeInteger(trials) || trials <= 0) throw new RangeError('trials must be a positive safe integer');
  let state = seed >>> 0;
  const indices = Array.from({ length: trials }, (_, i) => i);
  const random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 0x100000000; };
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const lostCount = Math.round(probability * trials);
  const pattern = Array(trials).fill(false);
  for (const index of indices.slice(0, lostCount)) pattern[index] = true;
  return { pattern, seed: seed >>> 0, lostCount, algorithm: 'seeded Fisher-Yates exact-count' };
}
module.exports = { makeExactLossPattern };
```

### experiments/e1/run-s10-independent.js
```javascript
﻿'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
require('../../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const { generateSignature } = require('../../server/utils/hmac');
const { computeMoneyIntegrity } = require('../../server/utils/money-oracle');
const sqlite3 = require('../../server/node_modules/sqlite3').verbose();
const { timedRequest } = require('../lib/http');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.resolve(process.env.S10_INDEP_OUTPUT_DIR || path.join(ROOT, 'experiments/results/e1-v3-s10-independent'));
const TAG = new Date().toISOString().replace(/[:.]/g, '-');
const RUN = path.join(OUT, TAG);
const ATTEMPTS = 30;
const PROFILES = { past: 6, future: 2, nonceTtl: 8, sessionTtl: 15 };
const PIN = process.env.DEMO_PIN || '1234';
const csv = (v) => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function writeCsv(file, rows) { const headers = Object.keys(rows[0] || {}); fs.writeFileSync(file, `${[headers.join(','), ...rows.map((r) => headers.map((h) => csv(r[h])).join(','))].join('\n')}\n`); }
function wilson(k, n) { if (!n) throw Error('Wilson interval needs a positive trial count'); const z=1.959963984540054,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,m=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d; return [Math.max(0,c-m),Math.min(1,c+m)]; }
const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 12);
function start(exe, args, options, stdout, stderr) { const out=fs.openSync(stdout,'a'),err=fs.openSync(stderr,'a'); const p=spawn(exe,args,{...options,stdio:['ignore',out,err],windowsHide:true});p.once('exit',()=>{try{fs.closeSync(out)}catch{}try{fs.closeSync(err)}catch{}});return p; }
async function stop(p) { if(!p||p.exitCode!==null)return;p.kill();await Promise.race([new Promise(r=>p.once('exit',r)),new Promise(r=>setTimeout(r,2500))]);if(p.exitCode===null)spawn('taskkill',['/PID',String(p.pid),'/T','/F'],{stdio:'ignore',windowsHide:true}); }
async function ready(port,p,log) { const until=Date.now()+30000;while(Date.now()<until){if(p.exitCode!==null)throw Error(`child exited; inspect ${log}`);try{if((await timedRequest(`http://127.0.0.1:${port}/api/health`)).status===200)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error(`health timeout; inspect ${log}`); }
function openDb(file) { const db=new sqlite3.Database(file);return new Promise((res,rej)=>db.once('open',()=>res(db)).once('error',rej)); }
function dbRun(db,sql,args=[]) { return new Promise((res,rej)=>db.run(sql,args,e=>e?rej(e):res())); }
function dbAll(db,sql,args=[]) { return new Promise((res,rej)=>db.all(sql,args,(e,rows)=>e?rej(e):res(rows))); }
function dbClose(db) { return new Promise(r=>db.close(()=>r())); }
function config(mask, policy) { return `H${mask&1?1:0}T${mask&2?1:0}N${mask&4?1:0}R${mask&8?1:0}-${policy}`; }
async function runCell(mask, policy, scenario) {
  const cfg=config(mask,policy), id=`${cfg}-${scenario}`,dir=path.join(RUN,id);fs.mkdirSync(dir,{recursive:true});
  const port=3700,vizPort=3701,proxyPort=3702,dbFile=path.join(dir,'bank.sqlite');
  const namespace=`e1v3-s10-${id}-${process.pid}`;
  const env={...process.env,PORT:String(port),HOST:'127.0.0.1',VIZ_PORT:String(vizPort),VIZ_ENABLED:'false',DEMO_MODE:'false',LEGACY_SHARED_SECRET:'false',ENABLE_DEMO_ROUTES:'false',NONCE_STORE:'redis',NONCE_TTL:String(PROFILES.nonceTtl),REDIS_URL:'redis://127.0.0.1:6379',NONCE_KEY_NAMESPACE:namespace,SQLITE_DB:dbFile,TIMESTAMP_PAST_WINDOW_SECONDS:String(PROFILES.past),TIMESTAMP_FUTURE_WINDOW_SECONDS:String(PROFILES.future),SESSION_TTL:String(PROFILES.sessionTtl),DEFENSE_HMAC:String(Boolean(mask&1)),DEFENSE_TIMESTAMP:String(Boolean(mask&2)),DEFENSE_NONCE:String(Boolean(mask&4)),DEFENSE_REQUEST_ID:String(Boolean(mask&8)),IDEMPOTENCY_POLICY:policy,EXPERIMENT_LOG:path.join(dir,'server-timings.csv'),CONFIG_ID:cfg,SCENARIO_ID:scenario,RUN_ID:`e1v3-${TAG}`};
  const server=start(process.execPath,['server.js'],{cwd:path.join(ROOT,'server'),env},path.join(dir,'server.stdout.log'),path.join(dir,'server.stderr.log'));
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'e1-s10-indep-')),capture=path.join(temp,'capture.json'),captureLog=`${capture}.jsonl`;
  const proxyEnv={...process.env,PROXY_UPSTREAM:`http://127.0.0.1:${port}`,PROXY_PORT:String(proxyPort),PROXY_CAPTURE_FILE:capture,PROXY_WITHDRAW_CAPTURE_FILE:`${capture}.withdraw.json`,PROXY_REDACT_LOGIN:'true'};
  let proxy,db,session;const requests=[],authorized=[];const started=process.hrtime.bigint();
  try {
    await ready(port,server,path.join(dir,'server.stderr.log'));
    db=await openDb(dbFile);
    proxy=start(process.execPath,[path.join(ROOT,'experiments/recording-proxy.js')],{cwd:ROOT,env:proxyEnv},path.join(dir,'proxy.stdout.log'),path.join(dir,'proxy.stderr.log'));
    await ready(proxyPort,proxy,path.join(dir,'proxy.stderr.log'));
    const login=await timedRequest(`http://127.0.0.1:${proxyPort}/api/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({user_id:'anis_101',pin:PIN})});
    if(login.status!==200)throw Error(`login failed with HTTP ${login.status}`);session=login.body;
    await dbRun(db,"UPDATE accounts SET balance=1 WHERE user_id='anis_101'");
    const failed=[];
    for(let i=0;i<ATTEMPTS;i++){
      const requestId=`s10i-${TAG}-${cfg}-${scenario}-${i}`,nonce=`s10i-n-${TAG}-${cfg}-${scenario}-${i}`;
      const payload={method:'POST',path:'/api/withdraw',user_id:'anis_101',account_id:'acc_777',amount:100,currency:'BDT',timestamp:new Date().toISOString(),nonce,request_id:requestId};payload.signature=generateSignature(payload,session.sessionKey);
      const first=await timedRequest(`http://127.0.0.1:${proxyPort}/api/withdraw`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${session.sessionToken}`},body:JSON.stringify(payload)});
      if(first.body.reason!=='INSUFFICIENT_BALANCE')throw Error(`${cfg}/${scenario}: failed seed was ${first.body.reason||first.body.error}`);
      const ledgerRow=(await dbAll(db,'SELECT id,status,reason FROM transactions WHERE request_id=?',[requestId]))[0];
      if(!ledgerRow||ledgerRow.status!=='FAILED'||ledgerRow.reason!=='INSUFFICIENT_BALANCE')throw Error('missing FAILED row in SQLite seed ledger');
      const entry=fs.readFileSync(captureLog,'utf8').trim().split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x)).reverse().find(x=>x.request.method==='POST'&&x.request.path==='/api/withdraw'&&JSON.parse(x.request.body).request_id===requestId);
      if(!entry)throw Error('attacker-visible capture missing');
      failed.push({requestId,nonce,payload,entry,first});authorized.push({request_id:requestId,amount:100,type:'WITHDRAW'});
      requests.push({config_id:cfg,policy,scenario_id:scenario,phase:'failed_seed',trial:i+1,request_id_hash:hash(requestId),nonce_hash:hash(nonce),http_status:first.status,reason:first.body.reason,start_ns:first.start_ns,end_ns:first.end_ns,duration_ns:first.duration_ns,ledger_status:ledgerRow.status});
    }
    const depositId=`s10i-fund-${TAG}-${cfg}-${scenario}`,depNonce=`s10i-fund-n-${TAG}-${cfg}-${scenario}`;
    const deposit={method:'POST',path:'/api/deposit',user_id:'anis_101',account_id:'acc_777',amount:3001,currency:'BDT',timestamp:new Date().toISOString(),nonce:depNonce,request_id:depositId};deposit.signature=generateSignature(deposit,session.sessionKey);
    const funded=await timedRequest(`http://127.0.0.1:${proxyPort}/api/deposit`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${session.sessionToken}`},body:JSON.stringify(deposit)});
    if(funded.status!==200||funded.body.status!=='ACCEPTED')throw Error(`funding failed: HTTP ${funded.status}`);
    const delay=scenario==='S10_indep_fast'?1:9;await new Promise(r=>setTimeout(r,delay*1000));
    const replayResponses=await Promise.all(failed.map(async ({requestId,nonce,entry},i)=>{
      const response=await timedRequest(`http://127.0.0.1:${proxyPort}/api/withdraw`,{method:'POST',headers:{'content-type':'application/json',authorization:entry.request.headers.authorization},body:entry.request.body});
      requests.push({config_id:cfg,policy,scenario_id:scenario,phase:'replay',trial:i+1,request_id_hash:hash(requestId),nonce_hash:hash(nonce),intended_delay_seconds:delay,actual_delay_seconds:Number(BigInt(response.start_ns)-BigInt(funded.end_ns))/1e9,http_status:response.status,reason:response.body.reason||response.body.error||response.body.status,start_ns:response.start_ns,end_ns:response.end_ns,duration_ns:response.duration_ns,ledger_status:''});
      return response;
    }));
    const ledger=await dbAll(db,'SELECT id,request_id,type,status,reason,amount FROM transactions WHERE type=\'WITHDRAW\' ORDER BY id');
    const oracle=computeMoneyIntegrity(ledger,authorized);
    const k=oracle.delayed_execution_count,n=ATTEMPTS,[low,high]=wilson(k,n);
    const summary={config_id:cfg,policy,scenario_id:scenario,attempts:n,failed_requests:n,distinct_request_ids:new Set(failed.map(x=>x.requestId)).size,distinct_nonces:new Set(failed.map(x=>x.nonce)).size,http_accepted_count:replayResponses.filter(r=>r.status===200&&r.body.status==='ACCEPTED').length,delayed_execution_count:k,delayed_execution_amount:oracle.delayed_execution_amount,success_rate:k/n,wilson95_low:low,wilson95_high:high,replay_reason_histogram:JSON.stringify(replayResponses.reduce((a,r)=>{const q=r.body.reason||r.body.status||r.body.error||`HTTP_${r.status}`;a[q]=(a[q]||0)+1;return a;},{})),funded_balance:3002,amount_per_withdrawal:100,oracle_integrity_holds:oracle.integrity_holds,oracle:JSON.stringify(oracle),run_duration_seconds:Number(process.hrtime.bigint()-started)/1e9,delay_after_funding_seconds:delay};
    requests.push({config_id:cfg,policy,scenario_id:scenario,phase:'funding',trial:0,request_id_hash:hash(depositId),nonce_hash:hash(depNonce),http_status:funded.status,reason:funded.body.status,start_ns:funded.start_ns,end_ns:funded.end_ns,duration_ns:funded.duration_ns});
    writeCsv(path.join(dir,'requests.csv'),requests);writeCsv(path.join(dir,'summary.csv'),[summary]);
    // Demo mode is disabled; make signature-column sanitation explicit for retained DB evidence.
    await dbRun(db,'UPDATE transactions SET signature=NULL');
    fs.writeFileSync(path.join(dir,'ledger.csv'),['id,request_id_hash,type,status,reason,amount',...ledger.map(r=>`${r.id},${hash(r.request_id)},${r.type},${r.status},${r.reason||''},${r.amount}`)].join('\n')+'\n');
    return {summary,dir};
  } finally {
    if(db)await dbClose(db);await stop(proxy);await stop(server);
    fs.rmSync(temp,{recursive:true,force:true});
  }
}
async function main(){fs.mkdirSync(RUN,{recursive:true});const started=new Date().toISOString(),cells=[];
  for(const scenario of ['S10_indep_fast','S10_indep_late'])for(let mask=0;mask<16;mask++)for(const policy of (mask&8?['success_only','any_outcome']:['success_only'])){
    const result=await runCell(mask,policy,scenario);cells.push(result.summary);process.stdout.write(`${scenario} ${result.summary.config_id}: ${result.summary.delayed_execution_count}/${ATTEMPTS}\n`);
  }
  const headers=Object.keys(cells[0]);writeCsv(path.join(RUN,'summary.csv'),cells);
  fs.writeFileSync(path.join(RUN,'run.json'),JSON.stringify({started,ended:new Date().toISOString(),elapsedSeconds:(Date.now()-Date.parse(started))/1000,nodeVersion:process.version,profiles:PROFILES,attemptsPerCell:ATTEMPTS,policies:['success_only','any_outcome (request-ID on only)'],scenarioWaitsSeconds:{S10_indep_fast:1,S10_indep_late:9},distinctFailedRequestIdsPerCell:30,distinctFailedNoncesPerCell:30,accountSeedBalance:1,fundingDeposit:3001,postFundingBalance:3002,amountPerWithdrawal:100,ledgerOracle:'computeMoneyIntegrity from SQLite rows',sessionMode:true,proxyRedactLogin:true,keepAliveHttpAgent:true,localhostOnly:true,cells:cells.length},null,2)+'\n');
  process.stdout.write(`S10 independent trials complete: ${cells.length} cells in ${RUN}\n`);
}
main().catch(e=>{process.stderr.write(`${e.stack||e.message}\n`);process.exitCode=1;});
```

### experiments/e1/compare-v2-v3.js
```javascript
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.resolve(process.env.E1_COMPARISON_OUTPUT || path.join(ROOT, 'experiments/results/round-i/e1-v2-v3-cell-differences.csv'));
function parseCsv(text) { const lines = text.trim().split(/\r?\n/); const parse = line => { const out=[]; let field='',quoted=false; for(let i=0;i<line.length;i++){const c=line[i];if(quoted){if(c==='"'&&line[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}else if(c==='"')quoted=true;else if(c===','){out.push(field);field='';}else field+=c;}out.push(field);return out;}; const h=parse(lines.shift()); return lines.map(l=>Object.fromEntries(parse(l).map((v,i)=>[h[i],v]))); }
function rows(rel) { return parseCsv(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
function map(rows) { return new Map(rows.filter(r=>r.scenario_id!=='LEGITIMATE_CONTROL').map(r=>[`${r.config_id}|${r.scenario_id}|${r.variant||''}`,r])); }
const v2 = map([...rows('experiments/results/e1-v2/summary.csv'), ...rows('experiments/results/e1-v2-s11/summary.csv')]);
const v3base = map(rows('experiments/results/e1-v3/round-i-scaled/summary.csv'));
const v3s11 = map(rows('experiments/results/e1-v3-s11/round-i-s11/summary.csv'));
const v3 = new Map([...v3base,...v3s11]);
const output=[];
for (const [key, newer] of v3) {
  if (!v2.has(key)) continue;
  const older=v2.get(key); const oldK=Number(older.debited_count), newK=Number(newer.debited_count), oldN=Number(older.attempts), newN=Number(newer.attempts);
  if (oldK!==newK || oldN!==newN || oldK/oldN!==newK/newN) output.push({config_id:newer.config_id,scenario_id:newer.scenario_id,variant:newer.variant||'',v2_successes:oldK,v2_attempts:oldN,v2_rate:oldK/oldN,v3_successes:newK,v3_attempts:newN,v3_rate:newK/newN,difference_kind:oldK/oldN!==newK/newN?'SUCCESS_RATE_CHANGED':'ATTEMPT_COUNT_CHANGED_RATE_SAME',difference:'E1 v2 used TTL 4 s; E1 v3 used TTL 8 s'});
}
fs.mkdirSync(path.dirname(OUT),{recursive:true});const headers=Object.keys(output[0]||{config_id:'',scenario_id:'',variant:'',v2_successes:'',v2_attempts:'',v2_rate:'',v3_successes:'',v3_attempts:'',v3_rate:'',difference:''});const q=v=>{v=String(v??'');return /[",\r\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v;};fs.writeFileSync(OUT,[headers.join(','),...output.map(r=>headers.map(h=>q(r[h])).join(','))].join('\n')+'\n');process.stdout.write(`Compared ${[...v3.keys()].filter(k=>v2.has(k)).length} overlapping cells; differing cells ${output.length}; ${OUT}\n`);
```

### experiments/checks/run-route-binding.js
```javascript
'use strict';
const fs = require('fs'), path = require('path'), { spawn } = require('child_process'), crypto = require('crypto');
const { generateSignature } = require('../../server/utils/hmac');
const sqlite3 = require('../../server/node_modules/sqlite3').verbose();
const { timedRequest } = require('../lib/http');
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.resolve(process.env.ROUTE_BINDING_OUTPUT_DIR || path.join(ROOT, 'experiments/results/round-i/route-binding'));
const PIN = process.env.DEMO_PIN || '1234';
const csv = v => { v = String(v ?? ''); return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
const write = (p, rows) => fs.writeFileSync(p, `${Object.keys(rows[0]).join(',')}\n${rows.map(r => Object.keys(rows[0]).map(k => csv(r[k])).join(',')).join('\n')}\n`);
const openDb = file => new Promise((resolve, reject) => { const db = new sqlite3.Database(file, e => e ? reject(e) : resolve(db)); });
const dbAll = (db, sql, args) => new Promise((resolve, reject) => db.all(sql, args, (e, rows) => e ? reject(e) : resolve(rows)));
function payload(session, pathName, id) { const p = { method: 'POST', path: pathName, user_id: 'anis_101', account_id: 'acc_777', amount: 1, currency: 'BDT', timestamp: new Date().toISOString(), nonce: crypto.randomUUID(), request_id: id }; p.signature = generateSignature(p, session.sessionKey); return p; }
async function main() {
  fs.mkdirSync(OUT, { recursive: true }); const rows = [], metadata = { started: new Date().toISOString(), node: process.version, host: '127.0.0.1', defenseLayers: 'all enabled except HMAC in second configuration', loginMode: 'session', vizEnabled: false, demoMode: false, redis: 'Memurai at 127.0.0.1:6379' };
  for (const [idx, hmac] of [true, false].entries()) {
    const dir = path.join(OUT, `H${hmac ? 1 : 0}`); fs.mkdirSync(dir, { recursive: true }); const port = 3810 + idx, dbFile = path.join(dir, 'run.sqlite');
    const env = { ...process.env, PORT: String(port), HOST: '127.0.0.1', VIZ_PORT: String(port + 1), VIZ_ENABLED: 'false', DEMO_MODE: 'false', LEGACY_SHARED_SECRET: 'false', ENABLE_DEMO_ROUTES: 'false', NONCE_STORE: 'redis', NONCE_TTL: '300', REDIS_URL: 'redis://127.0.0.1:6379', NONCE_KEY_NAMESPACE: `round-i-route-${hmac}-${process.pid}`, SQLITE_DB: dbFile, DEFENSE_HMAC: String(hmac), DEFENSE_TIMESTAMP: 'true', DEFENSE_NONCE: 'true', DEFENSE_REQUEST_ID: 'true', EXPERIMENT_LOG: path.join(dir, 'timings.csv') };
    const out = fs.openSync(path.join(dir, 'stdout.log'), 'a'), err = fs.openSync(path.join(dir, 'stderr.log'), 'a'); const child = spawn(process.execPath, ['server.js'], { cwd: path.join(ROOT, 'server'), env, stdio: ['ignore', out, err], windowsHide: true });
    try {
      let ready = false; for (let i = 0; i < 300; i++) { if (child.exitCode !== null) throw Error(`server exited; inspect ${dir}`); try { if ((await timedRequest(`http://127.0.0.1:${port}/api/health`)).status === 200) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 100)); } if (!ready) throw Error(`health timeout ${dir}`);
      const login = await timedRequest(`http://127.0.0.1:${port}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user_id: 'anis_101', pin: PIN }) }); if (login.status !== 200) throw Error(`login HTTP ${login.status}`); const session = login.body;
      const cases = [ ['/api/withdraw', payload(session, '/api/deposit', `route-deposit-${hmac}`), 'deposit-signed-to-withdraw'], ['/api/deposit', payload(session, '/api/withdraw', `route-withdraw-${hmac}`), 'withdraw-signed-to-deposit'] ];
      const casesStart = rows.length;
      for (const [endpoint, body, label] of cases) { const response = await timedRequest(`http://127.0.0.1:${port}${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${session.sessionToken}` }, body: JSON.stringify(body) }); rows.push({ hmac_enabled: hmac, case: label, requested_endpoint: endpoint, http_status: response.status, reason: response.body.reason || response.body.error || response.body.status, request_id_hash: crypto.createHash('sha256').update(body.request_id).digest('hex').slice(0, 12), ledger_rows_for_request: '', start_ns: response.start_ns, end_ns: response.end_ns, duration_ns: response.duration_ns }); }
      const db = await openDb(dbFile);
      for (let i = casesStart; i < rows.length; i++) rows[i].ledger_rows_for_request = (await dbAll(db, 'SELECT id FROM transactions WHERE request_id = ?', [cases[i - casesStart][1].request_id])).length;
      const acceptedHmac = hmac && rows.slice(casesStart).some(r => r.http_status === 200 && r.reason === 'ACCEPTED');
      if (acceptedHmac) metadata.unexpectedAcceptedDetails = rows.slice(casesStart).map(r => ({ ...r, signed_fields: 'method/path/user_id/account_id/amount/currency/timestamp/nonce/request_id were signed; signature redacted by output policy' }));
      await new Promise(resolve => db.close(() => resolve()));
    } finally { child.kill(); await Promise.race([new Promise(r => child.once('exit', r)), new Promise(r => setTimeout(r, 2000))]); if (child.exitCode === null) spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); try { fs.closeSync(out); fs.closeSync(err); } catch {} }
  }
  write(path.join(OUT, 'requests.csv'), rows); metadata.ended = new Date().toISOString(); metadata.results = rows; fs.writeFileSync(path.join(OUT, 'run.json'), JSON.stringify(metadata, null, 2) + '\n');
  if (metadata.unexpectedAcceptedDetails) throw Error(`HMAC-on route mismatch accepted; sanitized fields and ledger counts saved in ${OUT}`);
}
main().catch(e => { process.stderr.write(`${e.stack || e.message}\n`); process.exitCode = 1; });
```

### experiments/checks/run-atomic-debit.js
```javascript
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { spawn } = require('child_process');
const sqlite3 = require('../../server/node_modules/sqlite3').verbose();
const { generateSignature } = require('../../server/utils/hmac');
const { timedRequest } = require('../lib/http');
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.resolve(process.env.ATOMIC_DEBIT_OUTPUT_DIR || path.join(ROOT, 'experiments/results/round-i/atomic-debit'));
const PIN = process.env.DEMO_PIN || '1234';
const q = v => { v = String(v ?? ''); return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
const write = (file, rows) => { const h = Object.keys(rows[0]); fs.writeFileSync(file, `${h.join(',')}\n${rows.map(r => h.map(k => q(r[k])).join(',')).join('\n')}\n`); };
function openDb(file) { return new Promise((resolve, reject) => { const db = new sqlite3.Database(file, e => e ? reject(e) : resolve(db)); }); }
function all(db, sql) { return new Promise((resolve, reject) => db.all(sql, (e, rows) => e ? reject(e) : resolve(rows))); }
function get(db, sql) { return new Promise((resolve, reject) => db.get(sql, (e, row) => e ? reject(e) : resolve(row))); }
async function stop(child) { if (!child || child.exitCode !== null) return; child.kill(); await Promise.race([new Promise(r => child.once('exit', r)), new Promise(r => setTimeout(r, 2500))]); if (child.exitCode === null) spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); }
async function main() {
  fs.mkdirSync(OUT, { recursive: true }); const started = new Date().toISOString(), runs = [], ledgerRows = [];
  for (let repetition = 1; repetition <= 30; repetition++) {
    const id = `atomic-${String(repetition).padStart(2, '0')}`, dir = path.join(OUT, id); fs.mkdirSync(dir, { recursive: true }); const port = 3820, dbFile = path.join(dir, 'run.sqlite');
    const env = { ...process.env, PORT: String(port), HOST: '127.0.0.1', VIZ_PORT: '3821', VIZ_ENABLED: 'false', DEMO_MODE: 'false', LEGACY_SHARED_SECRET: 'false', ENABLE_DEMO_ROUTES: 'false', NONCE_STORE: 'redis', NONCE_TTL: '300', REDIS_URL: 'redis://127.0.0.1:6379', NONCE_KEY_NAMESPACE: `round-i-atomic-${repetition}-${process.pid}`, SQLITE_DB: dbFile, DEFENSE_HMAC: 'true', DEFENSE_TIMESTAMP: 'true', DEFENSE_NONCE: 'true', DEFENSE_REQUEST_ID: 'true', EXPERIMENT_LOG: path.join(dir, 'timings.csv') };
    const out = fs.openSync(path.join(dir, 'stdout.log'), 'a'), err = fs.openSync(path.join(dir, 'stderr.log'), 'a'); const child = spawn(process.execPath, ['server.js'], { cwd: path.join(ROOT, 'server'), env, stdio: ['ignore', out, err], windowsHide: true });
    try {
      let ready = false; for (let i = 0; i < 300; i++) { if (child.exitCode !== null) throw Error(`server exited; inspect ${dir}`); try { if ((await timedRequest(`http://127.0.0.1:${port}/api/health`)).status === 200) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 100)); } if (!ready) throw Error(`health timeout ${dir}`);
      const login = await timedRequest(`http://127.0.0.1:${port}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user_id: 'anis_101', pin: PIN }) }); if (login.status !== 200) throw Error(`login HTTP ${login.status}`); const session = login.body;
      const db = await openDb(dbFile); await new Promise((resolve, reject) => db.run("UPDATE accounts SET balance=100 WHERE user_id='anis_101'", e => e ? reject(e) : resolve()));
      const payloads = Array.from({ length: 100 }, (_, i) => { const p = { method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777', amount: i + 1, currency: 'BDT', timestamp: new Date().toISOString(), nonce: `${id}-nonce-${i}`, request_id: `${id}-request-${i}` }; p.signature = generateSignature(p, session.sessionKey); return p; });
      const requests = payloads.map(p => timedRequest(`http://127.0.0.1:${port}/api/withdraw`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${session.sessionToken}` }, body: JSON.stringify(p) }));
      const responses = await Promise.all(requests); const rows = await all(db, "SELECT id, request_id, amount, status FROM transactions WHERE type='WITHDRAW' ORDER BY id"); const account = await get(db, "SELECT balance FROM accounts WHERE user_id='anis_101'");
      let current = 100, minimum = 100, sum = 0; for (const row of rows) { if (row.status === 'SUCCESS') { current -= row.amount; sum += row.amount; } minimum = Math.min(minimum, current); ledgerRows.push({ run: id, ledger_id: row.id, request_id_hash: crypto.createHash('sha256').update(row.request_id).digest('hex').slice(0, 12), amount: row.amount, status: row.status, reconstructed_balance: current }); }
      const accepted = responses.filter(r => r.status === 200 && r.body.status === 'ACCEPTED').length;
      const result = { run: id, attempts: responses.length, accepted, ledger_rows: rows.length, success_debit_count: rows.filter(r => r.status === 'SUCCESS').length, success_debit_sum: sum, final_balance: account.balance, minimum_balance_from_ledger: minimum, invariant_nonnegative: minimum >= 0, invariant_debits_at_most_100: sum <= 100, invariant_balance_plus_debits_100: account.balance + sum === 100, started_ns: responses.reduce((m, r) => !m || BigInt(r.start_ns) < BigInt(m) ? r.start_ns : m, ''), ended_ns: responses.reduce((m, r) => !m || BigInt(r.end_ns) > BigInt(m) ? r.end_ns : m, '') };
      if (!result.invariant_nonnegative || !result.invariant_debits_at_most_100 || !result.invariant_balance_plus_debits_100) throw Error(`atomic debit invariant failed in ${id}: ${JSON.stringify(result)}`);
      runs.push(result); await new Promise(resolve => db.close(() => resolve()));
    } finally { await stop(child); try { fs.closeSync(out); fs.closeSync(err); } catch {} }
    process.stdout.write(`${id}: balance ${runs.at(-1).final_balance}, debit ${runs.at(-1).success_debit_sum}\n`);
  }
  write(path.join(OUT, 'runs.csv'), runs); write(path.join(OUT, 'ledger.csv'), ledgerRows); fs.writeFileSync(path.join(OUT, 'run.json'), JSON.stringify({ started, ended: new Date().toISOString(), elapsedSeconds: (Date.now() - Date.parse(started)) / 1000, repetitions: runs.length, requestsPerRepetition: 100, balanceSeed: 100, amounts: '1 through 100, each once', allInvariantsHold: runs.every(r => r.invariant_nonnegative && r.invariant_debits_at_most_100 && r.invariant_balance_plus_debits_100), layers: 'HMAC, timestamp, nonce, request-ID all enabled', nonceBackend: 'Memurai via Redis', sessionMode: true, localhostOnly: true }, null, 2) + '\n');
}
main().catch(e => { process.stderr.write(`${e.stack || e.message}\n`); process.exitCode = 1; });
```

### experiments/write-round-i-docs.js
```javascript
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
function csv(text){const lines=text.trim().split(/\r?\n/);function parse(line){const out=[];let v='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(q&&c==='"'&&line[i+1]==='"'){v+='"';i++;}else if(c==='"')q=!q;else if(c===','&&!q){out.push(v);v='';}else v+=c;}out.push(v);return out;}const h=parse(lines.shift());return lines.map(line=>Object.fromEntries(parse(line).map((v,i)=>[h[i],v])));}
const read=p=>csv(fs.readFileSync(path.join(ROOT,p),'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
const ci=r=>`[${Number(r.wilson95_low).toFixed(4)}, ${Number(r.wilson95_high).toFixed(4)}]`;
const histogram=s=>{try{return Object.entries(JSON.parse(s||'{}')).map(([k,v])=>`${k}:${v}`).join('; ')||'none';}catch{return String(s||'none');}};
const diffPath='experiments/results/round-i/e1-v2-v3-cell-differences.csv';
const e1Path='experiments/results/e1-v3/round-i-scaled/summary.csv';
const s11Path='experiments/results/e1-v3-s11/round-i-s11/summary.csv';
const s10Root='experiments/results/e1-v3-s10-independent';
const s10Run=fs.readdirSync(path.join(ROOT,s10Root)).filter(n=>/^\d{4}-/.test(n)).sort().at(-1);
const s10Path=`${s10Root}/${s10Run}/summary.csv`;
const retryPath='experiments/results/round-i/s10-independent/resubmission/summary.csv';
const routePath='experiments/results/round-i/route-binding/requests.csv';
const atomicPath='experiments/results/round-i/atomic-debit/runs.csv';
const e4cPath='experiments/results/round-i/e4c-exact/e4c.csv';
const e1=read(e1Path),s11=read(s11Path).filter(r=>r.scenario_id==='S11'),s10=read(s10Path),retry=read(retryPath),route=read(routePath),atomic=read(atomicPath),e4c=read(e4cPath);
const differences=read(diffPath),defaultRows=e1.filter(r=>r.config_id==='H1T1N1R1-DEFAULT'&&r.scenario_id!=='LEGITIMATE_CONTROL');
const s10Table=s10.map(r=>`| ${r.config_id} | ${r.policy} | ${r.scenario_id.replace('S10_indep_','')} | ${r.delayed_execution_count}/${r.attempts} | ${ci(r)} | ${histogram(r.replay_reason_histogram)} |`);
const s11Table=s11.map(r=>`| ${r.config_id} | ${r.debited_count}/${r.attempts} | ${ci(r)} | ${histogram(r.blocking_reason_histogram)} |`);
const e4cTable=e4c.filter(r=>r.kind==='summary').map(r=>{const m=/loss-p([0-9.]+)-(default|request_id_before_nonce)-(same-signed|fresh-nonce-same-request-id)/.exec(r.case);if(!m)throw Error(`invalid E4c case ${r.case}`);return `| ${m[1]} | ${m[2]} | ${m[3]} | ${r.lost_responses}/200 | ${histogram(r.client_failure_reasons)} | ${r.exactly_one_debit_request_ids}/200 | ${r.reason_confirms_success_count} |`;});
const minBal=Math.min(...atomic.map(r=>Number(r.minimum_balance_from_ledger)));
const debitSums=[...new Set(atomic.map(r=>Number(r.success_debit_sum)))].sort((a,b)=>a-b).join(', ');
const lines=[
'','', '## Round I — final experimental addendum','',
'All new outputs are under Round I directories; older result folders were left untouched. Environment: Node v24.11.1, Windows, Memurai Developer 4.2.3, localhost only. E1 v2 used TTL 4 s, deliberately shorter than PAST 6 s (a mis-configured profile). E1 v3 used PAST=6 s, FUTURE=2 s, NONCE_TTL=8 s, SESSION_TTL=15 s, success_only. The default-window confirmation used PAST=300 s, FUTURE=5 s, NONCE_TTL=300 s, SESSION_TTL=900 s.','',
'### Provenance','',
'| Artifact | SHA-256 |','|---|---|',
`| ${e1Path} | ${sha(e1Path)} |`,`| ${s10Path} | ${sha(s10Path)} |`,`| ${s11Path} | ${sha(s11Path)} |`,`| ${retryPath} | ${sha(retryPath)} |`,`| ${routePath} | ${sha(routePath)} |`,`| ${atomicPath} | ${sha(atomicPath)} |`,`| ${e4cPath} | ${sha(e4cPath)} |`,'',
'### E1 v2 versus v3','',
`${differences.length} cells differ in count or attempt denominator. Two cells changed success rate: S4 for H0T0N1R0 and H1T0N1R0. The old 4 s TTL expired by the 7 s replay; the clean 8 s TTL remained live and blocked it. S11 changed from 30 to 100 attempts per configuration; its success rate was unchanged in every configuration. Full comparison: ${diffPath}.`,'',
'| Configuration | Scenario | E1 v2 k/n | E1 v3 k/n |','|---|---|---:|---:|',
...differences.filter(r=>r.difference_kind==='SUCCESS_RATE_CHANGED').map(r=>`| ${r.config_id} | ${r.scenario_id} | ${r.v2_successes}/${r.v2_attempts} | ${r.v3_successes}/${r.v3_attempts} |`),'',
'Default-window confirmation:','',
'| Scenario | Attempts | HTTP accepted / SQLite debits | Wilson 95% | Blocking reasons |','|---|---:|---:|---|---|',
...defaultRows.map(r=>`| ${r.scenario_id} | ${r.attempts} | ${r.http_accepted_count}/${r.debited_count} | ${ci(r)} | ${histogram(r.blocking_reason_histogram)} |`),'',
'### S10 independent trials','',
'Each cell used 30 distinct failed request IDs and nonces, withdrawal amount 100, initial balance 1, one 3,001 deposit (post-funding balance 3,002), then replayed each failed capture exactly once. The output is delayed SQLite executions by request ID.','',
'| Configuration | Policy | Scenario | Delayed executions | Wilson 95% | Blocking reason histogram |','|---|---|---|---:|---|---|',...s10Table,'',
'### S11 token-only forgery','',
'The attacker had the captured bearer token but no session signing key; each attempt was a fresh withdrawal with amount 1 and an absent signature.','',
'| Configuration | SQLite debits / attempts | Wilson 95% | Blocking reason |','|---|---:|---|---|',...s11Table,'',
'### Resubmission after funding','',
'| Policy | Variant | Successes / attempts | Wilson 95% | SQLite success debits | Reasons |','|---|---|---:|---|---:|---|',
...retry.map(r=>`| ${r.policy} | ${r.variant} | ${r.successes}/${r.attempts} | ${ci(r)} | ${r.sqlite_success_debits} | ${histogram(r.reason_histogram)} |`),'',
'### I3 correctness checks','',
`Route binding: the four cases in ${routePath} were rejected as INVALID_REQUEST with zero matching ledger rows, both with HMAC enabled and disabled. Atomic debit: 30 fresh-state runs, each with 100 parallel valid withdrawals of amounts 1..100 against balance 100. All satisfy nonnegative balance, debit sum at most 100, and final balance plus successful debits equal 100. The lowest reconstructed balance was ${minBal}; distinct observed successful-debit sums were ${debitSums}. Raw per-run CSV: ${atomicPath}; sanitized ledger rows: experiments/results/round-i/atomic-debit/ledger.csv.`,'',
'### E4c exact-count loss sampling','',
'The new seeded Fisher-Yates pattern selects exactly round(p x 200) positions and shares the pattern for cells with the same p.','',
'| p | Check order | Retry type | Lost responses | Retry reasons | Exactly-one debits | ALREADY_PROCESSED success clues |','|---:|---|---|---:|---|---:|---:|',...e4cTable,'',
'The prior E4c output is superseded. Its old generator drew 200 independent Bernoulli outcomes using an LCG: function lossPattern(p){let x=(0xE4C2026+(Math.round(p*1000)*2654435761))>>>0;const out=[];for(let i=0;i<200;i++){x=(1664525*x+1013904223)>>>0;out.push(x/4294967296<p);}return out;}. It did not enforce an exact count; the old saved output happened to contain 3 losses at p=0.05 and 44 at p=0.2. New raw data: '+e4cPath+'.'
];
const resultsFile=path.join(ROOT,'docs/RESULTS_PACK_A.md');let results=fs.readFileSync(resultsFile,'utf8').replace(/\n## Round I — final experimental addendum[\s\S]*$/,'');fs.writeFileSync(resultsFile,results+lines.join('\n'),'utf8');
const claimLines=['','', '## Round I claim scope','',
'1. Four-layer leave-one-out evidence is scoped to E1 v3 (PAST=6 s, FUTURE=2 s, NONCE_TTL=8 s, SESSION_TTL=15 s, success_only). Ordinary S1-S9 use 30 attempts (S5 uses 1,500); S11 uses 100 attempts. “None” still retains session bearer authentication and account ownership.','',
'2. The idempotency policy trade-off uses independent S10 trials: 30 distinct failed requests and one replay per failed request. Under success_only, retries can execute after funding if the other enabled freshness layer does not block them. Under any_outcome with request-ID on, the same request ID returned ALREADY_PROCESSED. The separate resubmission rows use 30 trials per policy and retry variant.','',
'3. The scaled-time TTL result is reproduced: E1 v2 used the deliberately short, mis-configured 4 s TTL; E1 v3 uses 8 s with PAST=6 s and FUTURE=2 s. S4 changed only in the nonce-on/request-ID-off cells, where the v2 replay succeeded and v3 replay was blocked. This round did not rerun E4a or the default full-scale TTL-gap experiment.','',
'See the Round I raw paths and hashes in RESULTS_PACK_A.md. Route binding and atomic debit were checked only in this local simulation; they do not establish multi-process production behavior.'];
const claimsFile=path.join(ROOT,'docs/CLAIMS_EVIDENCE.md');let claims=fs.readFileSync(claimsFile,'utf8').replace(/\n## Round I claim scope[\s\S]*$/,'');fs.writeFileSync(claimsFile,claims+claimLines.join('\n'),'utf8');
process.stdout.write(`Updated docs from raw Round I CSVs; rate-change cells=${differences.filter(r=>r.difference_kind==='SUCCESS_RATE_CHANGED').length}; S10 cells=${s10.length}; S11 cells=${s11.length}; E4c cells=${e4c.filter(r=>r.kind==='summary').length}; atomic runs=${atomic.length}; lowest reconstructed balance=${minBal}\n`);
```

### server/test/round-i.test.js
```javascript
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeExactLossPattern } = require('../../experiments/lib/exact-loss-pattern');
const { validSignedRequest } = require('../utils/request');
const { readAttemptCount } = require('../../experiments/e1/attempt-count');

test('E1_ATTEMPTS defaults to 30, accepts positive integers, and rejects invalid values', () => {
  assert.equal(readAttemptCount(undefined), 30);
  assert.equal(readAttemptCount(''), 30);
  assert.equal(readAttemptCount('100'), 100);
  assert.equal(readAttemptCount('0'), 30);
  assert.equal(readAttemptCount('1.5'), 30);
});

test('Round I exact loss patterns have the seeded requested count', () => {
  for (const [probability, expected] of [[0, 0], [0.05, 10], [0.2, 40]]) {
    const first = makeExactLossPattern(probability, 200, 0xE4C2026 + Math.round(probability * 1000));
    const second = makeExactLossPattern(probability, 200, 0xE4C2026 + Math.round(probability * 1000));
    assert.equal(first.lostCount, expected);
    assert.equal(first.pattern.filter(Boolean).length, expected);
    assert.deepEqual(first.pattern, second.pattern);
  }
});

test('route binding rejects signed-path mismatch independent of the HMAC defense flag', () => {
  const depositPath = { method: 'POST', path: '/api/deposit', user_id: 'u', account_id: 'a', amount: 1, currency: 'BDT', timestamp: new Date().toISOString(), nonce: 'n', request_id: 'r', signature: 'syntactically-present' };
  const withdrawPath = { ...depositPath, path: '/api/withdraw', request_id: 'r2' };
  for (const hmacEnabled of [true, false]) {
    assert.equal(validSignedRequest(depositPath, 'WITHDRAW'), false, `HMAC ${hmacEnabled}: deposit request sent to withdraw route`);
    assert.equal(validSignedRequest(withdrawPath, 'DEPOSIT'), false, `HMAC ${hmacEnabled}: withdraw request sent to deposit route`);
  }
});
```

### Diff experiments/e1/run.js
```diff
diff --git a/experiments/e1/run.js b/experiments/e1/run.js
index 366dbad..b5cb342 100644
--- a/experiments/e1/run.js
+++ b/experiments/e1/run.js
@@ -13,15 +13,15 @@ const { readAttemptCount } = require('./attempt-count');
 const ROOT = path.resolve(__dirname, '../..');
 const SERVER = path.join(ROOT, 'server');
 const OUTPUT = path.resolve(process.env.E1_OUTPUT_DIR || path.join(ROOT, 'experiments/results/e1-v2'));
-const RUN_TAG = new Date().toISOString().replace(/[:.]/g, '-');
+const RUN_TAG = process.env.E1_RUN_TAG || new Date().toISOString().replace(/[:.]/g, '-');
 const RUN_OUTPUT = path.join(OUTPUT, RUN_TAG);
 const RANDOM_SEED = 'e1-fixed-seed-2026-v1';
 const WIDTH = 30;
 const ATTEMPTS = readAttemptCount();
-const PAST = 6;
-const FUTURE = 2;
-const NONCE_TTL = 4;
-const SESSION_TTL = 15;
+const PAST = Number(process.env.E1_PAST_SECONDS || 6);
+const FUTURE = Number(process.env.E1_FUTURE_SECONDS || 2);
+const NONCE_TTL = Number(process.env.E1_NONCE_TTL_SECONDS || 4);
+const SESSION_TTL = Number(process.env.E1_SESSION_TTL_SECONDS || 15);
 const PIN = process.env.DEMO_PIN || '1234';
 fs.mkdirSync(OUTPUT, { recursive: true });
 
@@ -228,7 +228,7 @@ async function runConfiguration(mask, profile = {}) {
     }
 
     const filter = process.env.E1_SCENARIO_FILTER || '';
-    const selectedScenarios = filter ? [filter] : ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7a', 'S7b', 'S8', 'S9', 'S10_fast', 'S10_late'];
+    const selectedScenarios = filter ? filter.split(',').map((x) => x.trim()).filter(Boolean) : ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7a', 'S7b', 'S8', 'S9', 'S10_fast', 'S10_late'];
     for (const scenario of selectedScenarios) {
       await login();
       if (scenario === 'S1' || scenario === 'S2' || scenario === 'S3' || scenario === 'S4' || scenario === 'S8') {
@@ -344,7 +344,7 @@ async function main() {
   }
   if (!onlyS11 && !policySweep && !skipDefaultConfirmation) {
     process.stdout.write('E1 default-window confirmation: S2/60s and S4/301s\n');
-    allSummaries.push(...await runConfiguration(15, { suffix: '-DEFAULT', past: 300, future: 5, nonceTtl: 86400, sessionTtl: 900, fullScale: true }));
+    allSummaries.push(...await runConfiguration(15, { suffix: '-DEFAULT', past: 300, future: 5, nonceTtl: 300, sessionTtl: 900, fullScale: true }));
   }
   const headers = ['config_id', 'scenario_id', 'variant', 'attempts', 'http_accepted_count', 'debited_count', 'attack_success_rate', 'wilson95_low', 'wilson95_high', 'blocking_reason_histogram', 'oracle_total_debited_delta', 'oracle_duplicate_debit_count_delta', 'oracle_duplicate_debit_amount_delta', 'oracle_unauthorized_debit_amount_delta', 'oracle_delayed_execution_count_delta', 'oracle_delayed_execution_amount_delta', 'oracle_integrity_holds'];
   writeCsv(path.join(RUN_OUTPUT, 'summary.csv'), headers, allSummaries);
@@ -352,7 +352,7 @@ async function main() {
   const scenarios = [...new Set(allSummaries.filter((r) => r.scenario_id !== 'LEGITIMATE_CONTROL').map((r) => r.scenario_id))];
   const latex = ['\\begin{tabular}{llrrrrl}', '\\toprule', 'Configuration & Scenario & Attempts & Accepted & Debits & Success rate & Wilson 95\\% CI \\\\', '\\midrule', ...allSummaries.filter((r) => r.scenario_id !== 'LEGITIMATE_CONTROL').map((r) => `${r.config_id} & ${r.scenario_id} & ${r.attempts} & ${r.http_accepted_count} & ${r.debited_count} & ${(100 * r.attack_success_rate).toFixed(2)}\\% & ${r.wilson95_low.toFixed(4)}--${r.wilson95_high.toFixed(4)} \\\\`), '\\bottomrule', '\\end{tabular}', ''];
   fs.writeFileSync(path.join(RUN_OUTPUT, 'summary.tex'), latex.join('\n'));
-  const runMetadata = { started, ended: new Date().toISOString(), elapsedSeconds: (Date.now() - Date.parse(started)) / 1000, nodeVersion: process.version, host: { platform: os.platform(), release: os.release(), architecture: process.arch, cpuModel: os.cpus()[0]?.model, totalRamBytes: os.totalmem() }, dataRunDirectory: path.relative(OUTPUT, RUN_OUTPUT).replace(/\\/g, '/'), randomSeed: RANDOM_SEED, randomSeedScope: 'deterministic scenario request IDs and nonces; server session credentials use the operating-system CSPRNG', configuredAttempts: ATTEMPTS, selectedConfigMasks: process.env.E1_CONFIG_MASKS || 'all', selectedPolicySweep: policySweep, skippedDefaultConfirmation: skipDefaultConfirmation, scaledProfile: { timestampPastSeconds: PAST, timestampFutureSeconds: FUTURE, nonceTtlSeconds: NONCE_TTL, sessionTtlSeconds: SESSION_TTL }, defaultConfirmationProfile: { timestampPastSeconds: 300, futureToleranceSeconds: 5, nonceTtlSeconds: 86400, sessionTtlSeconds: 900, waits: { S2: 60, S4: 301 } }, keepAliveHttpAgent: true, proxyRedactLogin: true, moneyOracleLedgerSource: 'direct sqlite3 SELECT from the running server database after each scenario', allConfigs: 16, totalSummaryRows: allSummaries.length, scenarios: scenarios.length, allSummaries };
+  const runMetadata = { started, ended: new Date().toISOString(), elapsedSeconds: (Date.now() - Date.parse(started)) / 1000, nodeVersion: process.version, host: { platform: os.platform(), release: os.release(), architecture: process.arch, cpuModel: os.cpus()[0]?.model, totalRamBytes: os.totalmem() }, dataRunDirectory: path.relative(OUTPUT, RUN_OUTPUT).replace(/\\/g, '/'), randomSeed: RANDOM_SEED, randomSeedScope: 'deterministic scenario request IDs and nonces; server session credentials use the operating-system CSPRNG', configuredAttempts: ATTEMPTS, selectedConfigMasks: process.env.E1_CONFIG_MASKS || 'all', selectedPolicySweep: policySweep, skippedDefaultConfirmation: skipDefaultConfirmation, scaledProfile: { timestampPastSeconds: PAST, timestampFutureSeconds: FUTURE, nonceTtlSeconds: NONCE_TTL, sessionTtlSeconds: SESSION_TTL }, defaultConfirmationProfile: { timestampPastSeconds: 300, futureToleranceSeconds: 5, nonceTtlSeconds: 300, sessionTtlSeconds: 900, waits: { S2: 60, S4: 301 } }, keepAliveHttpAgent: true, proxyRedactLogin: true, moneyOracleLedgerSource: 'direct sqlite3 SELECT from the running server database after each scenario', allConfigs: 16, totalSummaryRows: allSummaries.length, scenarios: scenarios.length, allSummaries };
   fs.writeFileSync(path.join(RUN_OUTPUT, 'run.json'), `${JSON.stringify(runMetadata, null, 2)}\n`);
   fs.copyFileSync(path.join(RUN_OUTPUT, 'summary.csv'), path.join(OUTPUT, 'summary.csv'));
   fs.copyFileSync(path.join(RUN_OUTPUT, 'summary.tex'), path.join(OUTPUT, 'summary.tex'));
```

### Diff experiments/e1/run-policy-resubmit.js
```diff
diff --git a/experiments/e1/run-policy-resubmit.js b/experiments/e1/run-policy-resubmit.js
index 45a35e6..27a20f5 100644
--- a/experiments/e1/run-policy-resubmit.js
+++ b/experiments/e1/run-policy-resubmit.js
@@ -2,17 +2,19 @@ const fs=require('fs'),path=require('path'),{spawn}=require('child_process'),cry
 const {timedRequest}=require('../lib/http'),{generateSignature}=require('../../server/utils/hmac'),sqlite3=require('../../server/node_modules/sqlite3').verbose();
 require('../../server/node_modules/dotenv').config({path:path.resolve(__dirname,'../../server/.env')});
 const ROOT=path.resolve(__dirname,'../..'),OUT=path.resolve(process.env.POLICY_RETRY_OUTPUT||path.join(ROOT,'experiments/results/s10-policy-resubmit'));
+const PROFILE={past:Number(process.env.POLICY_RETRY_PAST_SECONDS||300),future:Number(process.env.POLICY_RETRY_FUTURE_SECONDS||5),nonceTtl:Number(process.env.POLICY_RETRY_NONCE_TTL_SECONDS||86400),sessionTtl:Number(process.env.POLICY_RETRY_SESSION_TTL_SECONDS||900)};
 function csv(v){v=String(v??'');return /[",\r\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v;}
 function write(file,rows){const h=Object.keys(rows[0]);fs.writeFileSync(file,[h.join(','),...rows.map(r=>h.map(k=>csv(r[k])).join(','))].join('\n')+'\n');}
 function wilson(k,n){const z=1.959963984540054,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,m=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d;return[c-m,c+m];}
 async function server(env,dir){const out=fs.openSync(path.join(dir,'server.stdout.log'),'a'),err=fs.openSync(path.join(dir,'server.stderr.log'),'a'),child=spawn(process.execPath,['server.js'],{cwd:path.join(ROOT,'server'),env,stdio:['ignore',out,err],windowsHide:true});child.once('exit',()=>{try{fs.closeSync(out)}catch{}try{fs.closeSync(err)}catch{}});for(let i=0;i<200;i++){if(child.exitCode!==null)throw Error(`server exited; see ${dir}`);try{if((await timedRequest('http://127.0.0.1:3600/api/health')).status===200)return child}catch{}await new Promise(r=>setTimeout(r,100));}throw Error(`health timeout ${dir}`);}
 async function stop(p){if(!p||p.exitCode!==null)return;p.kill();await Promise.race([new Promise(r=>p.once('exit',r)),new Promise(r=>setTimeout(r,2500))]);if(p.exitCode===null)spawn('taskkill',['/PID',String(p.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}
 function dbRun(db,sql,args=[]){return new Promise((res,rej)=>db.run(sql,args,e=>e?rej(e):res()));}
+function dbAll(db,sql,args=[]){return new Promise((res,rej)=>db.all(sql,args,(e,rows)=>e?rej(e):res(rows)));}
 function payload(s,id,nonce,pathName='/api/withdraw',amount=100){const p={method:'POST',path:pathName,user_id:'anis_101',account_id:'acc_777',amount,currency:'BDT',timestamp:new Date().toISOString(),nonce,request_id:id};p.signature=generateSignature(p,s.sessionKey);return p;}
 async function post(p,s){return timedRequest(`http://127.0.0.1:3600${p.path}`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${s.sessionToken}`},body:JSON.stringify(p)});}
-async function run(policy,variant){const id=`${policy}-${variant}`,dir=path.join(OUT,id);fs.mkdirSync(dir,{recursive:true});const started=new Date(),env={...process.env,PORT:'3600',HOST:'127.0.0.1',VIZ_ENABLED:'false',DEMO_MODE:'false',LEGACY_SHARED_SECRET:'false',ENABLE_DEMO_ROUTES:'false',IDEMPOTENCY_POLICY:policy,NONCE_STORE:'redis',NONCE_TTL:'86400',REDIS_URL:'redis://127.0.0.1:6379',NONCE_KEY_NAMESPACE:`policy-${id}-${process.pid}`,SQLITE_DB:path.join(dir,'run.sqlite'),TIMESTAMP_PAST_WINDOW_SECONDS:'300',TIMESTAMP_FUTURE_WINDOW_SECONDS:'5',DEFENSE_HMAC:'true',DEFENSE_TIMESTAMP:'true',DEFENSE_NONCE:'true',DEFENSE_REQUEST_ID:'true',EXPERIMENT_LOG:path.join(dir,'server-timings.csv')};let child,session,db;const rows=[],reasons={};let successes=0;try{child=await server(env,dir);db=new sqlite3.Database(env.SQLITE_DB);session=(await timedRequest('http://127.0.0.1:3600/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({user_id:'anis_101',pin:process.env.DEMO_PIN||'1234'})})).body;
+async function run(policy,variant){const id=`${policy}-${variant}`,dir=path.join(OUT,id);fs.mkdirSync(dir,{recursive:true});const started=new Date(),env={...process.env,PORT:'3600',HOST:'127.0.0.1',VIZ_ENABLED:'false',DEMO_MODE:'false',LEGACY_SHARED_SECRET:'false',ENABLE_DEMO_ROUTES:'false',IDEMPOTENCY_POLICY:policy,NONCE_STORE:'redis',NONCE_TTL:String(PROFILE.nonceTtl),REDIS_URL:'redis://127.0.0.1:6379',NONCE_KEY_NAMESPACE:`policy-${id}-${process.pid}`,SQLITE_DB:path.join(dir,'run.sqlite'),TIMESTAMP_PAST_WINDOW_SECONDS:String(PROFILE.past),TIMESTAMP_FUTURE_WINDOW_SECONDS:String(PROFILE.future),SESSION_TTL:String(PROFILE.sessionTtl),DEFENSE_HMAC:'true',DEFENSE_TIMESTAMP:'true',DEFENSE_NONCE:'true',DEFENSE_REQUEST_ID:'true',EXPERIMENT_LOG:path.join(dir,'server-timings.csv')};let child,session,db;const rows=[],reasons={};let successes=0;try{child=await server(env,dir);db=new sqlite3.Database(env.SQLITE_DB);session=(await timedRequest('http://127.0.0.1:3600/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({user_id:'anis_101',pin:process.env.DEMO_PIN||'1234'})})).body;
 for(let i=0;i<30;i++){await dbRun(db,"UPDATE accounts SET balance=1 WHERE user_id='anis_101'");const reqId=`${id}-${i}`,bad=payload(session,reqId,`${id}-initial-${i}`),first=await post(bad,session);if(first.body.reason!=='INSUFFICIENT_BALANCE')throw Error(`expected insufficient balance, got ${first.body.reason}`);const dep=payload(session,`${id}-fund-${i}`,`${id}-fund-n-${i}`,'/api/deposit',100),fund=await post(dep,session);if(fund.status!==200)throw Error(`fund failed ${fund.status}/${fund.body.error}`);const retryId=variant==='same_request_id_fresh_nonce'?reqId:`${reqId}-new`,retry=payload(session,retryId,`${id}-retry-${i}`),response=await post(retry,session),reason=response.body.reason||response.body.status||response.body.error||`HTTP_${response.status}`;reasons[reason]=(reasons[reason]||0)+1;if(response.status===200&&response.body.status==='ACCEPTED')successes++;rows.push({trial:i+1,policy,variant,initial_status:first.status,initial_reason:first.body.reason,retry_request_id_relation:variant==='same_request_id_fresh_nonce'?'same':'new',retry_status:response.status,retry_reason:reason,debited:response.status===200&&response.body.status==='ACCEPTED'?1:0,first_start_ns:first.start_ns,first_end_ns:first.end_ns,fund_start_ns:fund.start_ns,fund_end_ns:fund.end_ns,retry_start_ns:response.start_ns,retry_end_ns:response.end_ns});}
 }finally{if(db)await new Promise(r=>db.close(()=>r()));await stop(child);}
-const ci=wilson(successes,30);return {rows,summary:{policy,variant,attempts:30,successes,failures:30-successes,success_rate:successes/30,wilson95_low:ci[0],wilson95_high:ci[1],reason_histogram:JSON.stringify(reasons),started:started.toISOString(),ended:new Date().toISOString()}};}
-async function main(){fs.mkdirSync(OUT,{recursive:true});const started=new Date(),all=[],summary=[];for(const policy of ['success_only','any_outcome'])for(const variant of ['same_request_id_fresh_nonce','new_request_id_fresh_nonce']){const result=await run(policy,variant);all.push(...result.rows);summary.push(result.summary);}write(path.join(OUT,'requests.csv'),all);write(path.join(OUT,'summary.csv'),summary);fs.writeFileSync(path.join(OUT,'run.json'),JSON.stringify({started:started.toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started.getTime())/1000,cellCount:4,trialsPerCell:30,requestIdDefense:true,localhostOnly:true,policySwitch:'IDEMPOTENCY_POLICY',keepAliveHttpAgent:true},null,2)+'\n');}
+const oracleDb=new sqlite3.Database(env.SQLITE_DB);const ledger=await dbAll(oracleDb,"SELECT request_id,type,status,amount FROM transactions WHERE type='WITHDRAW' ORDER BY id");await new Promise(r=>oracleDb.close(()=>r()));const ledgerSuccess=ledger.filter(r=>r.status==='SUCCESS');const ci=wilson(successes,30);return {rows,summary:{policy,variant,attempts:30,successes,failures:30-successes,success_rate:successes/30,wilson95_low:ci[0],wilson95_high:ci[1],ledger_rows:ledger.length,sqlite_success_debits:ledgerSuccess.length,sqlite_success_debit_amount:ledgerSuccess.reduce((a,r)=>a+Number(r.amount),0),reason_histogram:JSON.stringify(reasons),profile:JSON.stringify(PROFILE),started:started.toISOString(),ended:new Date().toISOString()}};}
+async function main(){fs.mkdirSync(OUT,{recursive:true});const started=new Date(),all=[],summary=[];for(const policy of ['success_only','any_outcome'])for(const variant of ['same_request_id_fresh_nonce','new_request_id_fresh_nonce']){const result=await run(policy,variant);all.push(...result.rows);summary.push(result.summary);}write(path.join(OUT,'requests.csv'),all);write(path.join(OUT,'summary.csv'),summary);fs.writeFileSync(path.join(OUT,'run.json'),JSON.stringify({started:started.toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started.getTime())/1000,cellCount:4,trialsPerCell:30,profile:PROFILE,requestIdDefense:true,localhostOnly:true,policySwitch:'IDEMPOTENCY_POLICY',keepAliveHttpAgent:true},null,2)+'\n');}
 main().catch(e=>{process.stderr.write(`${e.stack||e.message}\n`);process.exitCode=1;});
```

### Diff experiments/e4/run.js
```diff
diff --git a/experiments/e4/run.js b/experiments/e4/run.js
index c83e326..9c29bef 100644
--- a/experiments/e4/run.js
+++ b/experiments/e4/run.js
@@ -3,6 +3,7 @@ const {generateSignature}=require('../../server/utils/hmac');
 const {timedRequest}=require('../lib/http');
 const {computeMoneyIntegrity}=require('../../server/utils/money-oracle');
 const sqlite3=require('../../server/node_modules/sqlite3').verbose();
+const {makeExactLossPattern}=require('../lib/exact-loss-pattern');
 const ROOT=path.resolve(__dirname,'../..'),OUT=path.resolve(process.env.E4_OUTPUT_DIR||path.join(ROOT,'experiments/results/e4-v2'));
 require('../../server/node_modules/dotenv').config({path:path.join(ROOT,'server/.env')});
 const PAST=6,FUTURE=2,TTLS=[4,6,8,10,12],OFFSETS=[0,1,2],DELAYS=[1,3,5,6,7,8,9,10,11],WIDTH=30;
@@ -10,7 +11,7 @@ let state=0xE4202610;function rand(){state=(1664525*state+1013904223)>>>0;return
 function q(v){v=v==null?'':String(v);return /[",\r\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v;}
 function write(file,rows){if(!rows.length)return;const h=[...new Set(rows.flatMap(r=>Object.keys(r)))];fs.writeFileSync(file,[h.join(','),...rows.map(r=>h.map(k=>q(r[k])).join(','))].join('\n')+'\n');}
 function wilson(k,n){const z=1.959963984540054,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,m=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d;return[c-m,c+m];}
-function lossPattern(p){let x=(0xE4C2026+(Math.round(p*1000)*2654435761))>>>0;const out=[];for(let i=0;i<200;i++){x=(1664525*x+1013904223)>>>0;out.push(x/4294967296<p);}return out;}
+function lossPattern(p){const seed=(0xE4C2026+Math.imul(Math.round(p*1000),2654435761))>>>0;return makeExactLossPattern(p,200,seed);}
 const LOSS_PATTERNS=new Map([0,0.05,0.2].map(p=>[p,lossPattern(p)]));
 function startServer(env,dir){const out=fs.openSync(path.join(dir,'server.stdout.log'),'a'),err=fs.openSync(path.join(dir,'server.stderr.log'),'a');const child=spawn(process.execPath,['server.js'],{cwd:path.join(ROOT,'server'),env,stdio:['ignore',out,err],windowsHide:true});child.once('exit',()=>{try{fs.closeSync(out);}catch{}try{fs.closeSync(err);}catch{}});return child;}
 async function stop(s){if(!s||s.exitCode!==null)return;s.kill();await Promise.race([new Promise(r=>s.once('exit',r)),new Promise(r=>setTimeout(r,2500))]);if(s.exitCode===null)spawn('taskkill',['/PID',String(s.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}
@@ -64,10 +65,10 @@ async function runE4a(rows) {
 }
 function summarizeE4a(rows){const out=[];const keys=new Map();for(const r of rows){const k=[r.configuration,r.nonce_ttl_seconds,r.client_future_offset_seconds,r.replay_delay_seconds].join('|');if(!keys.has(k))keys.set(k,[]);keys.get(k).push(r);}for(const [key,list] of keys){const [configuration,ttl,f,delay]=key.split('|');const h={};for(const r of list)h[r.replay_reason]=(h[r.replay_reason]||0)+1;out.push({configuration,nonce_ttl_seconds:ttl,client_future_offset_seconds:f,replay_delay_seconds:delay,trials:list.length,accepted:list.filter(r=>r.replay_accepted).length,blocked:list.filter(r=>!r.replay_accepted).length,blocking_layer_histogram:JSON.stringify(h)});}return out;}
 async function runE4b(rows){let c=0;for(const mode of ['fail-open','fail-closed'])for(const reqId of [false,true]){c++;const id=`fault-${mode}-requestid-${reqId?1:0}`,dir=path.join(OUT,'E4b',id);fs.mkdirSync(dir,{recursive:true});const port=3500,child=startServer(envFor(id,port,dir,{NONCE_STORE_FAIL_MODE:mode,DEFENSE_REQUEST_ID:String(reqId)}),dir);try{await ready(port,child);const s=await login(port);await timedRequest(`http://127.0.0.1:${port}/__test/fault/nonce-store`,{method:'POST',headers:{'content-type':'application/json'},body:'{"enabled":true}'});let ok=0,replays=0;for(let i=0;i<30;i++){const p=payload(s,`${id}-${i}`),r=await post(port,s,p);if(r.status===200)ok++;rows.push({case:id,attempt:i+1,phase:'legitimate',status:r.status,reason:r.body.reason||r.body.error||r.body.status,start_ns:r.start_ns,end_ns:r.end_ns,duration_ns:r.duration_ns});const rr=await post(port,s,p);if(rr.status===200&&rr.body.status==='ACCEPTED')replays++;rows.push({case:id,attempt:i+1,phase:'replay',status:rr.status,reason:rr.body.reason||rr.body.error||rr.body.status,start_ns:rr.start_ns,end_ns:rr.end_ns,duration_ns:rr.duration_ns});}const ci=wilson(replays,30);rows.push({case:id,attempt:'summary',legitimate_accepted:ok,legitimate_total:30,replay_accepted:replays,replay_total:30,replay_wilson95_low:ci[0],replay_wilson95_high:ci[1],nonce_fail_mode:mode,request_id_defense:reqId?1:0});}finally{await stop(child);}}}
-async function runE4c(rows){let c=0;for(const probability of [0,0.05,0.2])for(const order of ['default','request_id_before_nonce'])for(const retryMode of ['same-signed','fresh-nonce-same-request-id']){c++;const id=`loss-p${probability}-${order}-${retryMode}`,dir=path.join(OUT,'E4c',id);fs.mkdirSync(dir,{recursive:true});const port=3500,child=startServer(envFor(id,port,dir,{CHECK_ORDER:order,DEFENSE_REQUEST_ID:'true'}),dir);try{await ready(port,child);const s=await login(port);let lostThenFailure=0,inferSuccess=0,notInferSuccess=0,lostResponses=0;const reasons={},intents=[];const pattern=LOSS_PATTERNS.get(probability);for(let i=0;i<200;i++){const p=payload(s,`${id}-${i}`),first=await post(port,s,p);intents.push({request_id:p.request_id,amount:p.amount,type:'WITHDRAW'});let clientFailure=false,retryReason='not_retried',retryResponse=null;const responseLost=pattern[i];if(responseLost){lostResponses++;const retry=retryMode==='same-signed'?p:{...p,nonce:`${p.nonce}-fresh`};if(retry!==p)retry.signature=generateSignature(retry,s.sessionKey);retryResponse=await post(port,s,retry);retryReason=retryResponse.body.reason||retryResponse.body.error||retryResponse.body.status;reasons[retryReason]=(reasons[retryReason]||0)+1;clientFailure=retryResponse.status!==200;if(first.status===200&&first.body.status==='ACCEPTED'&&clientFailure)lostThenFailure++;if(clientFailure){if(retryReason==='ALREADY_PROCESSED')inferSuccess++;else notInferSuccess++;}}rows.push({case:id,trial:i+1,loss_probability:probability,response_lost:responseLost?1:0,retry_order:order,retry_mode:retryMode,first_status:first.status,retry_reason:retryReason,client_saw_failure:clientFailure?1:0,reason_confirms_success:clientFailure&&retryReason==='ALREADY_PROCESSED'?1:0,first_start_ns:first.start_ns,first_end_ns:first.end_ns,first_duration_ns:first.duration_ns,retry_start_ns:retryResponse?.start_ns||'',retry_end_ns:retryResponse?.end_ns||'',retry_duration_ns:retryResponse?.duration_ns||''});}const count=await ledger(path.join(dir,'run.sqlite'));const oracle=computeMoneyIntegrity(count,intents);const debitRows=count.filter(x=>x.status==='SUCCESS'&&x.type==='WITHDRAW'),byId=new Map();for(const x of debitRows)byId.set(x.request_id,(byId.get(x.request_id)||0)+1);const exactlyOne=[...byId.values()].filter(n=>n===1).length;rows.push({case:id,kind:'summary',trials:200,loss_pattern_seed:'E4C-2026-fixed-by-probability',lost_responses:lostResponses,debits:debitRows.length,exactly_one_debit_request_ids:exactlyOne,client_failure_after_debit:lostThenFailure,client_failure_reasons:JSON.stringify(reasons),reason_confirms_success_count:inferSuccess,reason_does_not_confirm_success_count:notInferSuccess,oracle:JSON.stringify(oracle)});}finally{await stop(child);}}
+async function runE4c(rows){let c=0;for(const probability of [0,0.05,0.2])for(const order of ['default','request_id_before_nonce'])for(const retryMode of ['same-signed','fresh-nonce-same-request-id']){c++;const id=`loss-p${probability}-${order}-${retryMode}`,dir=path.join(OUT,'E4c',id);fs.mkdirSync(dir,{recursive:true});const port=3500,child=startServer(envFor(id,port,dir,{CHECK_ORDER:order,DEFENSE_REQUEST_ID:'true'}),dir);try{await ready(port,child);const s=await login(port);let lostThenFailure=0,inferSuccess=0,notInferSuccess=0,lostResponses=0;const reasons={},intents=[];const lossSpec=LOSS_PATTERNS.get(probability),pattern=lossSpec.pattern;for(let i=0;i<200;i++){const p=payload(s,`${id}-${i}`),first=await post(port,s,p);intents.push({request_id:p.request_id,amount:p.amount,type:'WITHDRAW'});let clientFailure=false,retryReason='not_retried',retryResponse=null;const responseLost=pattern[i];if(responseLost){lostResponses++;const retry=retryMode==='same-signed'?p:{...p,nonce:`${p.nonce}-fresh`};if(retry!==p)retry.signature=generateSignature(retry,s.sessionKey);retryResponse=await post(port,s,retry);retryReason=retryResponse.body.reason||retryResponse.body.error||retryResponse.body.status;reasons[retryReason]=(reasons[retryReason]||0)+1;clientFailure=retryResponse.status!==200;if(first.status===200&&first.body.status==='ACCEPTED'&&clientFailure)lostThenFailure++;if(clientFailure){if(retryReason==='ALREADY_PROCESSED')inferSuccess++;else notInferSuccess++;}}rows.push({case:id,trial:i+1,loss_probability:probability,response_lost:responseLost?1:0,retry_order:order,retry_mode:retryMode,first_status:first.status,retry_reason:retryReason,client_saw_failure:clientFailure?1:0,reason_confirms_success:clientFailure&&retryReason==='ALREADY_PROCESSED'?1:0,first_start_ns:first.start_ns,first_end_ns:first.end_ns,first_duration_ns:first.duration_ns,retry_start_ns:retryResponse?.start_ns||'',retry_end_ns:retryResponse?.end_ns||'',retry_duration_ns:retryResponse?.duration_ns||''});}const count=await ledger(path.join(dir,'run.sqlite'));const oracle=computeMoneyIntegrity(count,intents);const debitRows=count.filter(x=>x.status==='SUCCESS'&&x.type==='WITHDRAW'),byId=new Map();for(const x of debitRows)byId.set(x.request_id,(byId.get(x.request_id)||0)+1);const exactlyOne=[...byId.values()].filter(n=>n===1).length;rows.push({case:id,kind:'summary',trials:200,loss_pattern_seed:lossSpec.seed,planned_lost_count:lossSpec.lostCount,loss_pattern_algorithm:lossSpec.algorithm,lost_responses:lostResponses,debits:debitRows.length,exactly_one_debit_request_ids:exactlyOne,client_failure_after_debit:lostThenFailure,client_failure_reasons:JSON.stringify(reasons),reason_confirms_success_count:inferSuccess,reason_does_not_confirm_success_count:notInferSuccess,oracle:JSON.stringify(oracle)});}finally{await stop(child);}}
   // Failed insufficient-balance request followed by same-nonce and fresh-nonce retry.
   for(const retryMode of ['same-nonce','fresh-nonce']){const id=`insufficient-${retryMode}`,dir=path.join(OUT,'E4c',id);fs.mkdirSync(dir,{recursive:true});const port=3500,child=startServer(envFor(id,port,dir),dir);try{await ready(port,child);const s=await login(port);await new Promise((resolve,reject)=>{const db=new sqlite3.Database(path.join(dir,'run.sqlite'));db.run("UPDATE accounts SET balance=1 WHERE user_id='anis_101'",e=>db.close(()=>e?reject(e):resolve()));});const p=payload(s,id,0,100),failed=await post(port,s,p);const dep={...p,path:'/api/deposit',amount:500,nonce:`${p.nonce}-fund`,request_id:`${p.request_id}-fund`,timestamp:new Date().toISOString()};dep.signature=generateSignature(dep,s.sessionKey);const funded=await timedRequest(`http://127.0.0.1:${port}/api/deposit`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${s.sessionToken}`},body:JSON.stringify(dep)});if(funded.status!==200)throw Error(`legitimate funding failed ${funded.status}`);const retry=retryMode==='same-nonce'?p:{...p,nonce:`${p.nonce}-fresh`};if(retry!==p)retry.signature=generateSignature(retry,s.sessionKey);const result=await post(port,s,retry);rows.push({case:id,kind:'insufficient-retry',initial_reason:failed.body.reason,retry_mode:retryMode,retry_status:result.status,retry_reason:result.body.reason||result.body.error||result.body.status,initial_start_ns:failed.start_ns,initial_end_ns:failed.end_ns,initial_duration_ns:failed.duration_ns,fund_start_ns:funded.start_ns,fund_end_ns:funded.end_ns,fund_duration_ns:funded.duration_ns,retry_start_ns:result.start_ns,retry_end_ns:result.end_ns,retry_duration_ns:result.duration_ns});}finally{await stop(child);}}
 }
 function writeExtrapolation(){const corr=path.join(ROOT,'experiments/results/corrections'),a=JSON.parse(fs.readFileSync(path.join(corr,'nonce-memory-accepted-prep-accepted-clean-20261018-summary.json'))),r=JSON.parse(fs.readFileSync(path.join(corr,'nonce-memory-requestid-prep-requestid-20261018-summary.json')));if(!fs.existsSync(path.join(corr,a.rawInfoLog))||!fs.existsSync(path.join(corr,r.rawInfoLog)))throw Error('canonical preserved INFO evidence is missing');const accepted=a.baselineSubtractedSlopeBytesPerKey,rejected=r.baselineSubtractedSlopeBytesPerKey,slope=(accepted+rejected)/2,rps=[10,100,1000],ttls=[30,300,3600],out=[];for(const rate of rps)for(const ttl of ttls){const keys=rate*ttl;out.push({requests_per_second:rate,ttl_seconds:ttl,derived_keys:keys,measured_accepted_bytes_per_key:accepted,measured_requestid_rejected_bytes_per_key:rejected,derived_mean_bytes_per_key:slope,derived_memory_bytes:keys*slope,derived_memory_mib:keys*slope/1024/1024,scope:'linear extrapolation, not a measurement',formula:'bytes/key=(accepted slope+request-ID-rejected slope)/2; keys=rate*TTL; memory=keys*bytes/key',accepted_raw_info:a.rawInfoLog,rejected_raw_info:r.rawInfoLog});}return out;}
-async function main(){fs.mkdirSync(OUT,{recursive:true});const started=Date.now();if(process.env.E4B_ONLY==='true'){const b=[];await runE4b(b);write(path.join(OUT,'e4b.csv'),b);fs.writeFileSync(path.join(OUT,'run-e4b-corrected.json'),JSON.stringify({started:new Date(started).toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,e4bCells:4,trialsPerCase:30,nonceStore:'Memurai Developer via redis',localhostOnly:true,keepAliveHttpAgent:true},null,2)+'\n');process.stdout.write(`Corrected E4b complete: ${OUT}\n`);return;}if(process.env.E4C_ONLY==='true'){const c=[];await runE4c(c);write(path.join(OUT,'e4c.csv'),c);fs.writeFileSync(path.join(OUT,'run-e4c-corrected.json'),JSON.stringify({started:new Date(started).toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,e4cResponseLossCells:12,transactionsPerCell:200,commonRandomNumbers:true,lossPatternSeed:'E4C-2026-fixed-by-probability',requestIdDefense:true,orders:['default','request_id_before_nonce'],supersedes:'experiments/results/e4-v2/e4c.csv and experiments/results/e4-v2-corrected/e4c.csv due to 100 trials and non-common loss patterns',localhostOnly:true,keepAliveHttpAgent:true},null,2)+'\n');process.stdout.write(`Corrected E4c complete: ${OUT}\n`);return;}const a=[];await runE4a(a);write(path.join(OUT,'e4a-requests.csv'),a);const sa=summarizeE4a(a);write(path.join(OUT,'e4a-summary.csv'),sa);const b=[];await runE4b(b);write(path.join(OUT,'e4b.csv'),b);const c=[];await runE4c(c);write(path.join(OUT,'e4c.csv'),c);const d=writeExtrapolation();write(path.join(OUT,'e4d-derived.csv'),d);fs.writeFileSync(path.join(OUT,'run.json'),JSON.stringify({started:new Date(started).toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,profile:{pastSeconds:PAST,futureSeconds:FUTURE,ttlSeconds:TTLS,offsetSeconds:OFFSETS,delaysSeconds:DELAYS,trialsPerE4aCell:WIDTH},e4aCells:sa.length,e4bCells:4,e4cResponseLossCells:12,e4dDerivedRows:d.length,nonceStore:'Memurai Developer via redis',localhostOnly:true,keepAliveHttpAgent:true},null,2)+'\n');process.stdout.write(`E4 complete: ${OUT}\n`);}
+async function main(){fs.mkdirSync(OUT,{recursive:true});const started=Date.now();if(process.env.E4B_ONLY==='true'){const b=[];await runE4b(b);write(path.join(OUT,'e4b.csv'),b);fs.writeFileSync(path.join(OUT,'run-e4b-corrected.json'),JSON.stringify({started:new Date(started).toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,e4bCells:4,trialsPerCase:30,nonceStore:'Memurai Developer via redis',localhostOnly:true,keepAliveHttpAgent:true},null,2)+'\n');process.stdout.write(`Corrected E4b complete: ${OUT}\n`);return;}if(process.env.E4C_ONLY==='true'){const c=[];await runE4c(c);write(path.join(OUT,'e4c.csv'),c);fs.writeFileSync(path.join(OUT,'run-e4c-corrected.json'),JSON.stringify({started:new Date(started).toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,e4cResponseLossCells:12,transactionsPerCell:200,commonRandomNumbers:true,lossPatternAlgorithm:'seeded Fisher-Yates exact-count',lossPatternSeeds:Object.fromEntries([...LOSS_PATTERNS].map(([p,v])=>[p,v.seed])),lossCounts:Object.fromEntries([...LOSS_PATTERNS].map(([p,v])=>[p,v.lostCount])),requestIdDefense:true,orders:['default','request_id_before_nonce'],supersedes:'experiments/results/e4-v2/e4c.csv and experiments/results/e4-v2-corrected/e4c.csv due to 100 trials and non-common loss patterns',localhostOnly:true,keepAliveHttpAgent:true},null,2)+'\n');process.stdout.write(`Corrected E4c complete: ${OUT}\n`);return;}const a=[];await runE4a(a);write(path.join(OUT,'e4a-requests.csv'),a);const sa=summarizeE4a(a);write(path.join(OUT,'e4a-summary.csv'),sa);const b=[];await runE4b(b);write(path.join(OUT,'e4b.csv'),b);const c=[];await runE4c(c);write(path.join(OUT,'e4c.csv'),c);const d=writeExtrapolation();write(path.join(OUT,'e4d-derived.csv'),d);fs.writeFileSync(path.join(OUT,'run.json'),JSON.stringify({started:new Date(started).toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,profile:{pastSeconds:PAST,futureSeconds:FUTURE,ttlSeconds:TTLS,offsetSeconds:OFFSETS,delaysSeconds:DELAYS,trialsPerE4aCell:WIDTH},e4aCells:sa.length,e4bCells:4,e4cResponseLossCells:12,e4dDerivedRows:d.length,nonceStore:'Memurai Developer via redis',localhostOnly:true,keepAliveHttpAgent:true},null,2)+'\n');process.stdout.write(`E4 complete: ${OUT}\n`);}
 main().catch(e=>{process.stderr.write(`${e.stack||e.message}\n`);process.exitCode=1;});
```

### Diff experiments/audit/verify-results.js
```diff
diff --git a/experiments/audit/verify-results.js b/experiments/audit/verify-results.js
index 466b175..aefb25f 100644
--- a/experiments/audit/verify-results.js
+++ b/experiments/audit/verify-results.js
@@ -53,7 +53,24 @@ async function main(){
   for(const row of s11Summary.filter(r=>r.scenario_id==='S11')){const id=`E1/${row.config_id}/S11/debit`,value=`${row.debited_count}/${row.attempts} [${Number(row.wilson95_low).toFixed(4)},${Number(row.wilson95_high).toFixed(4)}]`;check(`docs.curated.${id}`,true,facts.includes(`| ${id} | ${value} |`),'docs/PAPER_FACTS_CURATED.md');check(`docs.pack.S11.${row.config_id}`,true,pack.includes(`${row.debited_count}/${row.attempts} [${Number(row.wilson95_low).toFixed(3)},${Number(row.wilson95_high).toFixed(3)}]`),'docs/RESULTS_PACK_A.md S11 table');}
   for(const row of e3sum){const id=`E3 ${row.profile} P${row.past_seconds} F${row.future_seconds} false-reject`,value=`${row.false_rejections}/${row.attempts} [${Number(row.wilson95_low).toFixed(4)},${Number(row.wilson95_high).toFixed(4)}]; off ${row.offline_expected_rejections}; Δ${row.mismatch_count}`;check(`docs.curated.${id}`,true,facts.includes(`| ${id} | ${value} |`),'docs/PAPER_FACTS_CURATED.md');check(`docs.pack.E3.${id}`,true,pack.includes(`${row.false_rejections}/${row.attempts} [${Number(row.wilson95_low).toFixed(3)},${Number(row.wilson95_high).toFixed(3)}]`),'docs/RESULTS_PACK_A.md E3 table');}
   for(const row of e4b.filter(x=>x.attempt==='summary')){const value=`${row.replay_accepted}/${row.replay_total} [${Number(row.replay_wilson95_low).toFixed(3)},${Number(row.replay_wilson95_high).toFixed(3)}]`;check(`docs.pack.E4b.${row.case}`,true,pack.includes(value),'docs/RESULTS_PACK_A.md E4b table');}
-  const report={generatedAt:new Date().toISOString(),method:'Independent parser, Wilson formula and t interval formula in this file; direct SQLite SELECTs for S11/E4c; raw per-request CSVs for E1/E3/E4/E4b; E2 repeat-level timing summaries.',comparedValues:checks.length,mismatches:checks.filter(x=>!x.match).length,checks,notes,files:{e1Summary:'experiments/results/e1-v2/summary.csv',s11Summary:'experiments/results/e1-v2-s11/summary.csv',e3Raw:'experiments/results/e3-v2/requests.csv',e4aRaw:'experiments/results/e4-v2/e4a-requests.csv',e4b:'experiments/results/e4-final-c3/e4b.csv',e4c:'experiments/results/e4-final-c3-rerun/e4c.csv',e2LayerSummary:'experiments/results/e2-v2/layer-timing-summary.csv'}};
+  // Round I: E1 v3 raw attempts and S10 independent delayed executions.
+  const r1root=path.join(ROOT,'experiments/results/e1-v3/round-i-scaled'),r1summary=readCsv(path.join(r1root,'summary.csv'));
+  for(const row of r1summary.filter(r=>/^H[01]T[01]N[01]R[01]$/.test(r.config_id)&&['S1','S2','S3','S4','S5','S6','S7a','S7b','S8','S9'].includes(r.scenario_id))){const file=path.join(r1root,row.config_id,'requests.csv'),raw=readCsv(file).filter(x=>x.phase==='attacker'&&x.scenario_id===row.scenario_id&&(!row.variant||x.variant===row.variant)),accepted=raw.filter(x=>x.outcome==='ACCEPTED'&&Number(x.http_status)===200).length;check(`I1.${row.config_id}.${row.scenario_id}.attempts`,Number(row.attempts),raw.length,path.relative(ROOT,file));check(`I1.${row.config_id}.${row.scenario_id}.http_accepted`,Number(row.http_accepted_count),accepted,path.relative(ROOT,file));const[lo,hi]=wilson(Number(row.debited_count),Number(row.attempts));check(`I1.${row.config_id}.${row.scenario_id}.wilson_low`,Number(row.wilson95_low),lo,path.relative(ROOT,file));check(`I1.${row.config_id}.${row.scenario_id}.wilson_high`,Number(row.wilson95_high),hi,path.relative(ROOT,file));}
+  const r1s11root=path.join(ROOT,'experiments/results/e1-v3-s11/round-i-s11'),r1s11=readCsv(path.join(r1s11root,'summary.csv'));
+  for(const row of r1s11.filter(r=>/^H[01]T[01]N[01]R[01]$/.test(r.config_id)&&r.scenario_id==='S11')){const file=path.join(r1s11root,row.config_id,'requests.csv'),raw=readCsv(file).filter(x=>x.phase==='attacker'&&x.scenario_id==='S11'),accepted=raw.filter(x=>x.outcome==='ACCEPTED').length,dbPath=path.join(r1s11root,`${row.config_id}.sqlite`),ledger=await dbAll(dbPath,"SELECT COUNT(*) AS n FROM transactions WHERE type='WITHDRAW' AND status='SUCCESS' AND request_id LIKE 's11-r-%'"),debits=Number(ledger[0].n),[lo,hi]=wilson(debits,raw.length);check(`I1.S11.${row.config_id}.attempts`,100,raw.length,file);check(`I1.S11.${row.config_id}.accepted`,Number(row.http_accepted_count),accepted,file);check(`I1.S11.${row.config_id}.sqlite_debits`,Number(row.debited_count),debits,dbPath);check(`I1.S11.${row.config_id}.wilson_low`,Number(row.wilson95_low),lo,file);check(`I1.S11.${row.config_id}.wilson_high`,Number(row.wilson95_high),hi,file);}
+  const profile=JSON.parse(fs.readFileSync(path.join(r1root,'run.json'),'utf8')).scaledProfile;check('I1.scaled.PAST',6,profile.timestampPastSeconds,'E1 v3 run.json');check('I1.scaled.FUTURE',2,profile.timestampFutureSeconds,'E1 v3 run.json');check('I1.scaled.NONCE_TTL',8,profile.nonceTtlSeconds,'E1 v3 run.json');check('I1.scaled.SESSION_TTL',15,profile.sessionTtlSeconds,'E1 v3 run.json');
+  for(const row of r1summary.filter(r=>r.config_id==='H1T1N1R1-DEFAULT'&&['S2_default_window_60s','S4_default_window_301s'].includes(r.scenario_id))){const file=path.join(r1root,row.config_id,'requests.csv'),raw=readCsv(file).filter(x=>x.phase==='attacker'&&x.scenario_id===row.scenario_id),accepted=raw.filter(x=>x.outcome==='ACCEPTED').length,[lo,hi]=wilson(Number(row.debited_count),raw.length);check(`I1.default.${row.scenario_id}.attempts`,30,raw.length,file);check(`I1.default.${row.scenario_id}.accepted`,Number(row.http_accepted_count),accepted,file);check(`I1.default.${row.scenario_id}.wilson_low`,Number(row.wilson95_low),lo,file);check(`I1.default.${row.scenario_id}.wilson_high`,Number(row.wilson95_high),hi,file);}
+  // S10-indep: correlate failed request hashes with actual SUCCESS rows read from the saved SQLite ledger.
+  const s10root=path.join(ROOT,'experiments/results/e1-v3-s10-independent'),s10run=fs.readdirSync(s10root).filter(n=>/^\d{4}-/.test(n)).sort().at(-1),s10dir=path.join(s10root,s10run),s10sum=readCsv(path.join(s10dir,'summary.csv'));
+  for(const row of s10sum){const cell=`${row.config_id}-${row.scenario_id}`,folder=path.join(s10dir,cell),requests=readCsv(path.join(folder,'requests.csv')),ledger=readCsv(path.join(folder,'ledger.csv')),failed=new Set(requests.filter(x=>x.phase==='failed_seed').map(x=>x.request_id_hash)),successHashes=ledger.filter(x=>x.type==='WITHDRAW'&&x.status==='SUCCESS').map(x=>x.request_id_hash),delayed=successHashes.filter(x=>failed.has(x)).length,replay=requests.filter(x=>x.phase==='replay'),accepted=replay.filter(x=>Number(x.http_status)===200&&x.reason==='ACCEPTED').length,[lo,hi]=wilson(delayed,Number(row.attempts));check(`I2.${cell}.distinct_failed_ids`,Number(row.distinct_request_ids),failed.size,path.relative(ROOT,path.join(folder,'requests.csv')));check(`I2.${cell}.distinct_failed_nonces`,Number(row.distinct_nonces),new Set(requests.filter(x=>x.phase==='failed_seed').map(x=>x.nonce_hash)).size,path.relative(ROOT,path.join(folder,'requests.csv')));check(`I2.${cell}.delayed_ledger_debits`,Number(row.delayed_execution_count),delayed,path.relative(ROOT,path.join(folder,'ledger.csv')));check(`I2.${cell}.http_accepted`,Number(row.http_accepted_count),accepted,path.relative(ROOT,path.join(folder,'requests.csv')));check(`I2.${cell}.wilson_low`,Number(row.wilson95_low),lo,path.relative(ROOT,path.join(folder,'requests.csv')));check(`I2.${cell}.wilson_high`,Number(row.wilson95_high),hi,path.relative(ROOT,path.join(folder,'requests.csv')));}
+  // Resubmission cells use the SQLite debit ledger retained by the runner.
+  const retryRoot=path.join(ROOT,'experiments/results/round-i/s10-independent/resubmission'),retrySummary=readCsv(path.join(retryRoot,'summary.csv'));
+  for(const row of retrySummary){const dbPath=path.join(retryRoot,`${row.policy}-${row.variant}`,'run.sqlite'),ledger=await dbAll(dbPath,"SELECT COUNT(*) AS n,COALESCE(SUM(amount),0) AS amount FROM transactions WHERE type='WITHDRAW' AND status='SUCCESS'"),[lo,hi]=wilson(Number(ledger[0].n),30);check(`I2.resubmit.${row.policy}.${row.variant}.ledger_success`,Number(row.sqlite_success_debits),Number(ledger[0].n),dbPath);check(`I2.resubmit.${row.policy}.${row.variant}.wilson_low`,Number(row.wilson95_low),lo,path.join(retryRoot,'summary.csv'));check(`I2.resubmit.${row.policy}.${row.variant}.wilson_high`,Number(row.wilson95_high),hi,path.join(retryRoot,'summary.csv'));}
+  // Route binding and atomic-debit checks, including the SQLite rows.
+  const routeFile=path.join(ROOT,'experiments/results/round-i/route-binding/requests.csv');for(const row of readCsv(routeFile)){check(`I3.route.${row.hmac_enabled}.${row.case}.reason`,'INVALID_REQUEST',row.reason,path.relative(ROOT,routeFile));check(`I3.route.${row.hmac_enabled}.${row.case}.ledger_rows`,0,Number(row.ledger_rows_for_request),path.relative(ROOT,routeFile));}
+  const atomicRoot=path.join(ROOT,'experiments/results/round-i/atomic-debit'),atomic=readCsv(path.join(atomicRoot,'runs.csv'));for(const row of atomic){const dbPath=path.join(atomicRoot,row.run,'run.sqlite'),ledger=await dbAll(dbPath,"SELECT id,request_id,amount,status FROM transactions WHERE type='WITHDRAW' ORDER BY id"),success=ledger.filter(x=>x.status==='SUCCESS'),sum=success.reduce((a,x)=>a+Number(x.amount),0);let bal=100,min=100;for(const x of ledger)if(x.status==='SUCCESS'){bal-=Number(x.amount);min=Math.min(min,bal);}const account=await dbAll(dbPath,"SELECT balance FROM accounts WHERE user_id='anis_101'");check(`I3.atomic.${row.run}.success_sum`,Number(row.success_debit_sum),sum,dbPath);check(`I3.atomic.${row.run}.final_balance`,Number(row.final_balance),Number(account[0].balance),dbPath);check(`I3.atomic.${row.run}.minimum_balance`,Number(row.minimum_balance_from_ledger),min,dbPath);check(`I3.atomic.${row.run}.nonnegative`,true,min>=0,dbPath);check(`I3.atomic.${row.run}.balance_identity`,100,Number(account[0].balance)+sum,dbPath);}
+  const exact=readCsv(path.join(ROOT,'experiments/results/round-i/e4c-exact/e4c.csv'));for(const row of exact.filter(x=>x.kind==='summary')){const trials=exact.filter(x=>x.case===row.case&&x.kind!=='summary'),lost=trials.filter(x=>x.response_lost==='1').length,match=/loss-p([0-9.]+)-/.exec(row.case),probability=Number(match[1]),planned=Math.round(probability*200);check(`I3.E4c.${row.case}.trials`,200,trials.length,'round-i/e4c-exact/e4c.csv');check(`I3.E4c.${row.case}.exact_count`,planned,Number(row.planned_lost_count),'case probability parsed independently; round(p*200)');check(`I3.E4c.${row.case}.lost_responses`,Number(row.lost_responses),lost,'round-i/e4c-exact/e4c.csv');}
+  const report={generatedAt:new Date().toISOString(),method:'Independent parser, Wilson formula and t interval formula in this file; direct SQLite SELECTs; raw request/ledger CSVs for Round I and prior experiments.',comparedValues:checks.length,mismatches:checks.filter(x=>!x.match).length,checks,notes,files:{e1V2:'experiments/results/e1-v2/summary.csv',e1V3:'experiments/results/e1-v3/round-i-scaled/summary.csv',s10Independent:`experiments/results/e1-v3-s10-independent/${s10run}/summary.csv`,s11V3:'experiments/results/e1-v3-s11/round-i-s11/summary.csv',routeBinding:'experiments/results/round-i/route-binding/requests.csv',atomicDebit:'experiments/results/round-i/atomic-debit/runs.csv',e4cExact:'experiments/results/round-i/e4c-exact/e4c.csv',e3Raw:'experiments/results/e3-v2/requests.csv',e4aRaw:'experiments/results/e4-v2/e4a-requests.csv',e2LayerSummary:'experiments/results/e2-v2/layer-timing-summary.csv'}};
   fs.writeFileSync(path.join(OUT,'audit-report.json'),JSON.stringify(report,null,2)+'\n');const md=['# Independent Results Audit','',`Compared values: ${report.comparedValues}; mismatches: ${report.mismatches}.`,'',`Method: ${report.method}`,'','## Mismatches',...(notes.length?notes.map(n=>`- ${n}`):['- None.']),'','## Check register','', '| Check | Expected | Recomputed | Match | Source |','|---|---:|---:|---|---|',...checks.map(c=>`| ${c.id} | ${c.expected} | ${c.actual} | ${c.match?'yes':'NO'} | ${c.source} |`),''];fs.writeFileSync(path.join(OUT,'audit-report.md'),md.join('\n'));process.stdout.write(`Audit compared ${report.comparedValues} values; mismatches=${report.mismatches}; report=${path.relative(ROOT,path.join(OUT,'audit-report.md'))}\n`);if(report.mismatches)process.exitCode=1;
 }
 main().catch(e=>{process.stderr.write(`${e.stack||e.message}\n`);process.exitCode=1;});
```

### Diff server/test/integration.test.js
```diff
diff --git a/server/test/integration.test.js b/server/test/integration.test.js
index 514f911..9c0938d 100644
--- a/server/test/integration.test.js
+++ b/server/test/integration.test.js
@@ -4,8 +4,8 @@ const os = require('os');
 const path = require('path');
 const crypto = require('crypto');
 const fs = require('fs');
-const phase3ResultDirectory = path.resolve(__dirname, '../../experiments/results/phase3');
-fs.mkdirSync(phase3ResultDirectory, { recursive: true });
+const testArtifactDirectory = path.resolve(process.env.TEST_ARTIFACT_DIR || path.join(os.tmpdir(), `cs-project-tests-${process.pid}`));
+fs.mkdirSync(testArtifactDirectory, { recursive: true });
 
 process.env.SQLITE_DB = path.join(os.tmpdir(), `cs-project-phase3-${process.pid}-${crypto.randomUUID()}.sqlite`);
 process.env.NONCE_STORE = 'memory';
@@ -20,7 +20,7 @@ process.env.DEFENSE_REQUEST_ID = 'true';
 process.env.TIMESTAMP_PAST_WINDOW_SECONDS = '300';
 process.env.TIMESTAMP_FUTURE_WINDOW_SECONDS = '5';
 process.env.ENABLE_TEST_FAULT_ROUTE = 'true';
-process.env.EXPERIMENT_LOG = path.join(phase3ResultDirectory, `layer-timings-${process.pid}.csv`);
+process.env.EXPERIMENT_LOG = path.join(testArtifactDirectory, `layer-timings-${process.pid}.csv`);
 process.env.CONFIG_ID = 'phase3-default-defenses';
 process.env.SCENARIO_ID = 'integration-suite';
 process.env.RUN_ID = `windows-node-test-${process.pid}`;
@@ -192,7 +192,7 @@ test('future and past timestamp edges repeat 30 times and save per-request timin
       rows.push({ label: item.label, repetition, offset_ms: item.offsetMs, ...result, outcome });
     }
   }
-  const output = path.resolve(__dirname, '../../experiments/results/corrections');
+  const output = testArtifactDirectory;
   fs.mkdirSync(output, { recursive: true });
   fs.writeFileSync(path.join(output, 'timestamp-boundaries-30-each.csv'), [
     'label,repetition,offset_ms,started_ns,ended_ns,duration_ns,http_status,outcome',
@@ -221,7 +221,7 @@ test('Phase 0 client clock offsets repeat 30 times per offset and save per-reque
       rows.push({ label: item.label, repetition, offset_ms: item.offsetMs, ...result, outcome });
     }
   }
-  const output = path.resolve(__dirname, '../../experiments/results/corrections');
+  const output = testArtifactDirectory;
   fs.mkdirSync(output, { recursive: true });
   fs.writeFileSync(path.join(output, 'clock-offsets-30-each.csv'), [
     'label,repetition,offset_ms,started_ns,ended_ns,duration_ns,http_status,outcome',
@@ -266,6 +266,40 @@ test('50 valid nonces racing on one request ID produce one debit', async () => {
   assert.equal(balance.data.balance, 9999);
 });
 
+test('route binding rejects a correctly signed request sent to the other transaction route', async () => {
+  await reset();
+  const deposit = payload({ path: '/api/deposit', request_id: 'route-deposit-as-withdraw', amount: 1 });
+  const withdraw = payload({ path: '/api/withdraw', request_id: 'route-withdraw-as-deposit', amount: 1 });
+  assert.deepEqual((await call('POST', '/api/withdraw', deposit)).data, { error: 'INVALID_REQUEST' });
+  assert.deepEqual((await call('POST', '/api/deposit', withdraw)).data, { error: 'INVALID_REQUEST' });
+  const rows = await new Promise((resolve, reject) => db.all('SELECT request_id FROM transactions WHERE request_id IN (?, ?)', [deposit.request_id, withdraw.request_id], (error, result) => error ? reject(error) : resolve(result)));
+  assert.deepEqual(rows, []);
+});
+
+test('parallel withdrawals preserve atomic balance invariants', async () => {
+  await reset();
+  await new Promise((resolve, reject) => db.run("UPDATE accounts SET balance=100 WHERE user_id='anis_101'", (error) => error ? reject(error) : resolve()));
+  const requests = Array.from({ length: 100 }, (_, index) => payload({
+    amount: index + 1,
+    nonce: `atomic-${index}`,
+    request_id: `atomic-${index}`
+  }));
+  const responses = await Promise.all(requests.map((request) => call('POST', '/api/withdraw', request)));
+  const rows = await new Promise((resolve, reject) => db.all("SELECT id, amount, status FROM transactions WHERE request_id LIKE 'atomic-%' ORDER BY id", (error, result) => error ? reject(error) : resolve(result)));
+  let balance = 100;
+  let minimum = balance;
+  let successSum = 0;
+  for (const row of rows) {
+    if (row.status === 'SUCCESS') { balance -= row.amount; successSum += row.amount; }
+    minimum = Math.min(minimum, balance);
+  }
+  const account = await new Promise((resolve, reject) => db.get("SELECT balance FROM accounts WHERE user_id='anis_101'", (error, result) => error ? reject(error) : resolve(result)));
+  assert.ok(responses.some((response) => response.data.status === 'ACCEPTED'));
+  assert.ok(minimum >= 0);
+  assert.ok(successSum <= 100);
+  assert.equal(account.balance + successSum, 100);
+});
+
 test('session authentication must match the signed user ID', async () => {
   await reset();
   const user = payload({ user_id: 'anis_101' });
```

### Diff paper/generate_paper_assets.py
```diff
diff --git a/paper/generate_paper_assets.py b/paper/generate_paper_assets.py
index b46626c..2c6b118 100644
--- a/paper/generate_paper_assets.py
+++ b/paper/generate_paper_assets.py
@@ -82,7 +82,7 @@ def write_table(name: str, headers: list[str], rows: list[list[object]]) -> None
 
 
 def latest_e1_run() -> Path:
-    root = ROOT / 'experiments/results/e1-v2'
+    root = ROOT / 'experiments/results/e1-v3'
     return sorted(p for p in root.iterdir() if p.is_dir() and (p / 'H0T0N0R0/requests.csv').exists())[-1]
 
 
@@ -111,37 +111,48 @@ def cell(rows: list[dict[str, str]]) -> tuple[int, int, float]:
 
 
 # Read every source once; all plotted/table figures are calculated from per-request CSV rows.
-e1_path = 'experiments/results/e1-v2/' + str(latest_e1_run().relative_to(ROOT / 'experiments/results/e1-v2')).replace('\\', '/') + '/H0T0N0R0/requests.csv'
 e1_dir = latest_e1_run()
 configs = sorted(p.name for p in e1_dir.iterdir() if p.is_dir() and re.fullmatch(r'H[01]T[01]N[01]R[01]',p.name) and (p/'requests.csv').is_file())
+e1_path = f"{str(e1_dir.relative_to(ROOT)).replace('\\', '/')}/H0T0N0R0/requests.csv"
+e1_summary_path = f"{str(e1_dir.relative_to(ROOT)).replace('\\', '/')}/summary.csv"
+e1_summary = raw(e1_summary_path)
+def summary_cell(row: dict[str, str], success_field: str = 'debited_count') -> tuple[int, int, float]:
+    k, n = int(row[success_field]), int(row['attempts'])
+    if n == 0: raise ValueError(f"empty applicable cell {row.get('config_id')}/{row.get('scenario_id')}")
+    check_value(k); check_value(n)
+    return k, n, check_value(k/n)
 e1_cells: dict[tuple[str, str], tuple[int, int, float]] = {}
 for cfg in configs:
-    p = f"{str(e1_dir.relative_to(ROOT)).replace('\\', '/')}/{cfg}/requests.csv"
-    rows = raw(p)
-    for scenario in ('S1','S2','S3','S4','S5','S6','S7a','S7b'):
-        matching = [r for r in rows if r.get('phase') == 'attacker' and r.get('scenario_id') == scenario]
-        e1_cells[(cfg, scenario)] = cell(matching)
-    for scenario in ('S8','S9'):
-        matching=[r for r in rows if r.get('phase')=='attacker' and r.get('scenario_id')==scenario]
-        e1_cells[(cfg,scenario)]=cell(matching)
+    for scenario in ('S1','S2','S3','S4','S5','S6','S7a','S7b','S8','S9'):
+        candidates=[r for r in e1_summary if r.get('config_id')==cfg and r.get('scenario_id')==scenario]
+        if scenario in ('S7a','S7b'):
+            variant='request_id' if scenario=='S7a' else 'nonce'
+            candidates=[r for r in candidates if r.get('variant')==variant]
+        if len(candidates)!=1: raise ValueError(f'missing/ambiguous E1 v3 cell {cfg}/{scenario}: {len(candidates)}')
+        e1_cells[(cfg,scenario)]=summary_cell(candidates[0])
 
 # F2: request-level attack success matrix; S10/S11 extend the same 16-config matrix.
-b_specs = [('S10 fast', 'S10_fast', 'B-S10-fast-R0', 'B-S10-fast-R1'), ('S10 late', 'S10_late', 'B-S10-late-R0', 'B-S10-late-R1')]
+s10_root=ROOT/'experiments/results/e1-v3-s10-independent'
+s10_runs=sorted(p for p in s10_root.iterdir() if p.is_dir() and (p/'summary.csv').exists())
+if not s10_runs: raise ValueError('S10-independent summary missing')
+s10_run=s10_runs[-1]
+s10_path=str((s10_run/'requests.csv').relative_to(ROOT)).replace('\\','/')
+s10_summary_path=str((s10_run/'summary.csv').relative_to(ROOT)).replace('\\','/')
+s10_summary=raw(s10_summary_path)
+s11_root=ROOT/'experiments/results/e1-v3-s11'
+s11_runs=sorted(p for p in s11_root.iterdir() if p.is_dir() and (p/'summary.csv').exists())
+if not s11_runs: raise ValueError('E1 v3 S11 summary missing')
+s11_run=s11_runs[-1]
+s11_summary_path=str((s11_run/'summary.csv').relative_to(ROOT)).replace('\\','/')
+s11_summary=raw(s11_summary_path)
 for cfg in configs:
-    for label, scenario, r0, r1 in b_specs:
-        run=r0 if cfg.endswith('R0') else r1
-        p=latest_b_csv(run,cfg,'success_only')
-        selected=attacking_rows(p,scenario)
-        if cfg.endswith('R1'):
-            selected=[r for r in selected if r.get('config_id','').endswith('success_only')]
-        e1_cells[(cfg,label)]=cell(selected)
-    if cfg.endswith('R0'):
-        p=latest_b_csv('B-s11-100',cfg)
-        e1_cells[(cfg,'S11')]=cell(attacking_rows(p,'S11'))
-    else:
-        # S11 stores both R0/R1 in its config names and is present in the all-config run.
-        p=latest_b_csv('B-s11-100',cfg)
-        e1_cells[(cfg,'S11')]=cell(attacking_rows(p,'S11'))
+    for label,scenario in [('S10 fast','S10_indep_fast'),('S10 late','S10_indep_late')]:
+        candidates=[r for r in s10_summary if r.get('config_id')==f'{cfg}-success_only' and r.get('scenario_id')==scenario]
+        if len(candidates)!=1: raise ValueError(f'missing S10-independent success_only cell {cfg}/{scenario}')
+        e1_cells[(cfg,label)]=summary_cell(candidates[0],'delayed_execution_count')
+    candidates=[r for r in s11_summary if r.get('config_id')==cfg and r.get('scenario_id')=='S11']
+    if len(candidates)!=1: raise ValueError(f'missing E1 v3 S11 cell {cfg}')
+    e1_cells[(cfg,'S11')]=summary_cell(candidates[0])
 
 columns = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7a', 'S7b', 'S10 fast', 'S10 late', 'S11']
 for cfg in configs:
@@ -219,9 +230,9 @@ for cfg in ['H1T1N1R0', 'H1T1N1R1']:
         low, high = wilson(k, len(g))
         full_rows.append((cfg, delay, k, len(g), check_value(k/len(g)), check_value(low), check_value(high)))
 fig, ax = plt.subplots(figsize=(3.5, 2.5))
-for cfg, marker, label in [('H1T1N1R0', 'o', 'Request-ID off'), ('H1T1N1R1', 's', 'Request-ID on')]:
+for cfg, marker, label, offset in [('H1T1N1R0', 'o', 'Request-ID off', -0.09), ('H1T1N1R1', 's', 'Request-ID on', 0.09)]:
     part = [r for r in full_rows if r[0] == cfg]
-    xs = list(range(len(part))); ys = [r[2] for r in part]
+    xs = [i + offset for i in range(len(part))]; ys = [r[2] for r in part]
     lo = [max(0,(ys[i]/part[i][3]-part[i][5])*part[i][3]) for i in range(len(part))]; hi = [max(0,(part[i][6]-ys[i]/part[i][3])*part[i][3]) for i in range(len(part))]
     ax.errorbar(xs, ys, yerr=[lo, hi], marker=marker, linestyle='none', capsize=2, label=label, color='black', mfc='white' if marker == 's' else 'black')
 ax.set_xlabel('Replay delay after first use (s)')
@@ -304,17 +315,22 @@ ax.set_ylabel('Server layer p50 (microseconds)')
 ax.set_yscale('log')
 ax.legend(frameon=False,ncol=2,loc='upper center',bbox_to_anchor=(.5,-.20))
 ax.grid(axis='y',color='0.85',linewidth=.4,which='both')
-savefig(fig,'F5-E2-layer-cost',3.5,tight_rect=(0,.22,1,1))
+fig.subplots_adjust(left=.29,right=.97,top=.96,bottom=.31)
+savefig(fig,'F5-E2-layer-cost',3.5)
 
 # T1 scenarios: attempts and attacker class from the measured cells.
 scenario_desc = {
- 'S1':('Immediate exact replay','A'),'S2':('Delayed exact replay inside timestamp window','A'),'S3':('Replay after nonce-store wipe','A'),'S4':('Replay after timestamp window','A'),'S5':('Parallel identical-request burst (50 parallel x 30 batches)','A'),'S6':('Amount modified; original signature retained','A'),'S7a':('Request ID modified; original signature retained','A'),'S7b':('Nonce modified; original signature retained','A'),'S8':('Expired session bearer token','A'),'S9':('Fresh forgery with leaked session key','C'),'S10 fast':('Failed withdrawal replay inside nonce and timestamp windows','A'),'S10 late':('Failed withdrawal replay after nonce TTL and timestamp window','A'),'S11':('Captured bearer token, without session signing key','B')
+ 'S1':('Immediate exact replay','A'),'S2':('Delayed exact replay inside timestamp window','A'),'S3':('Replay after nonce-store wipe','A'),'S4':('Replay after timestamp window','A'),'S5':('Parallel identical-request burst (50 parallel x 30 batches)','A'),'S6':('Amount modified; original signature retained','A'),'S7a':('Request ID modified; original signature retained','A'),'S7b':('Nonce modified; original signature retained','A'),'S8':('Expired session bearer token','A'),'S9':('Fresh forgery with leaked session key','C'),'S10 fast':('Independent failed withdrawals replayed once after 1 s; funded balance 3,002; amount 100','A'),'S10 late':('Independent failed withdrawals replayed once after 9 s; nonce TTL 8 s and past window 6 s','A'),'S11':('Captured bearer token, without session signing key','B')
 }
 t1=[]
 for label,(desc,attacker) in scenario_desc.items():
     ns=sorted({e1_cells[(c,label)][1] for c in configs})
     t1.append([label,desc,attacker,', '.join(map(str,ns))])
 write_table('T1-scenarios',['Scenario','Description','Attacker','Attempts n'],t1)
+t1_tex=[r'\begin{table*}[t]',r'\centering',r'\small',r'\begin{tabular}{lp{4.2in}cc}',r'\toprule',r'Scenario & Description & Attacker & Attempts $n$ \\',r'\midrule']
+t1_tex += [f"{tex_escape(a)} & {tex_escape(b)} & {tex_escape(c)} & {tex_escape(d)}" + r' \\' for a,b,c,d in t1]
+t1_tex += [r'\bottomrule',r'\end{tabular}',r'\end{table*}','']
+(TABLE/'T1-scenarios.tex').write_text('\n'.join(t1_tex),encoding='utf-8')
 
 # T2: all Round F S10 request-level outcomes plus the C2 resubmission attempt CSV.
 t2=[]
@@ -377,6 +393,44 @@ for policy in sorted({r['policy'] for r in resub}):
         compact.append([policy,'After funding',variant,f'{k}/{n} [{lo:.3f}, {hi:.3f}]','resubmission trials'])
 write_table('T2',['Policy','Request-ID / freshness','Scenario','Successes / n (Wilson 95%)','Configuration scope'],compact)
 
+# Round I replaces the old single-request S10 figures with independent trials.
+resub_path='experiments/results/round-i/s10-independent/resubmission/requests.csv'
+resub=raw(resub_path)
+round_i_full=[]
+for r in s10_summary:
+    cfg=r['config_id'].rsplit('-',1)[0]; k=int(r['delayed_execution_count']); n=int(r['attempts']); lo,hi=wilson(k,n)
+    round_i_full.append([r['policy'],cfg,r['scenario_id'].replace('S10_indep_',''),f'{k}/{n}',f'{lo:.3f}–{hi:.3f}'])
+write_table('T2-full',['Policy','Configuration','Scenario','Delayed executions / n','Wilson 95%'],round_i_full)
+round_i_compact=[]
+for rid,policy in [(0,'success_only'),(1,'success_only'),(1,'any_outcome')]:
+    for t,n,fresh in [(0,0,'No T/N'),(1,0,'T only'),(0,1,'N only'),(1,1,'T and N')]:
+        candidates=[c for c in configs if c.endswith(f'R{rid}') and c[3]==str(t) and c[5]==str(n)]
+        cells=[]
+        for cfg in candidates:
+            vals=[]
+            for scenario in ['S10_indep_fast','S10_indep_late']:
+                found=[r for r in s10_summary if r['config_id']==f'{cfg}-{policy}' and r['scenario_id']==scenario]
+                if len(found)!=1: raise ValueError(f'missing independent S10 cell {cfg}/{policy}/{scenario}')
+                row=found[0]; k=int(row['delayed_execution_count']); total=int(row['attempts']); lo,hi=wilson(k,total); vals.append((k,total,lo,hi))
+            cells.append((cfg,*vals))
+        unique=[]
+        for item in cells:
+            same=next((u for u in unique if u[1:]==list(item[1:])),None)
+            if same: same[0].append(item[0])
+            else: unique.append([[item[0]],*item[1:]])
+        for names,fast,late in unique:
+            label=', '.join(names)+(f' (H0/H1 identical)' if len(names)>1 else '')
+            ftxt=f'{fast[0]}/{fast[1]} [{fast[2]:.3f}, {fast[3]:.3f}]'; ltxt=f'{late[0]}/{late[1]} [{late[2]:.3f}, {late[3]:.3f}]'
+            round_i_compact.append([policy,f'R{rid}; {fresh}',label,ftxt,ltxt,''])
+for policy in sorted({r['policy'] for r in resub}):
+    for variant in sorted({r['variant'] for r in resub}):
+        g=[r for r in resub if r['policy']==policy and r['variant']==variant]
+        k=sum(r['retry_status']=='200' and r['retry_reason']=='ACCEPTED' for r in g); n=len(g); lo,hi=wilson(k,n)
+        round_i_compact.append([policy,'After funding',variant,'N/A','N/A',f'{k}/{n} [{lo:.3f}, {hi:.3f}]'])
+write_table('T2',['Policy','Request-ID / freshness','Configuration(s)','S10 fast k/n (Wilson 95%)','S10 late k/n (Wilson 95%)','Resubmission success (Wilson 95%)'],round_i_compact)
+t2file=TABLE/'T2.tex'; t2text=t2file.read_text(encoding='utf-8').replace(r'\begin{tabular}{lccccc}',r'\setlength{\tabcolsep}{2pt}'+'\n'+r'\begin{tabular}{lp{0.68in}p{1.38in}p{1.30in}p{1.30in}p{1.15in}}')
+t2file.write_text(t2text,encoding='utf-8')
+
 # T4 failure modes: E4b Wilson rows and E4c retry outcome counts from raw trials.
 e4b_path='experiments/results/e4-final-c3/e4b.csv'; e4b=raw(e4b_path); t4=[]
 for case in sorted({r['case'] for r in e4b}):
@@ -385,8 +439,8 @@ for case in sorted({r['case'] for r in e4b}):
     lk=sum(r['reason']=='ACCEPTED' and r['status']=='200' for r in leg); rk=sum(r['reason']=='ACCEPTED' and r['status']=='200' for r in rep)
     ln=len(leg); rn=len(rep); ll,lh=wilson(lk,ln); rl,rh=wilson(rk,rn)
     mode='fail-open' if 'fail-open' in case else 'fail-closed'; rid='on' if case.endswith('-1') else 'off'
-    t4.append(['E4b',mode,rid,f'{lk}/{ln} [{ll:.3f}, {lh:.3f}]',f'{rk}/{rn} [{rl:.3f}, {rh:.3f}]','','',''])
-e4c_path='experiments/results/e4-final-c3-rerun/e4c.csv'; e4c=raw(e4c_path)
+    t4.append(['E4b',mode,rid,'',f'{lk}/{ln} [{ll:.3f}, {lh:.3f}]',f'{rk}/{rn} [{rl:.3f}, {rh:.3f}]','','','',''])
+e4c_path='experiments/results/round-i/e4c-exact/e4c.csv'; e4c=raw(e4c_path)
 for case in sorted({r['case'] for r in e4c if r.get('kind')!='summary'}):
     g=[r for r in e4c if r['case']==case and r.get('kind')!='summary']
     if not case.startswith('loss-'): continue
@@ -399,10 +453,12 @@ for case in sorted({r['case'] for r in e4c if r.get('kind')!='summary'}):
     if summary is None: raise ValueError(f'missing E4c raw oracle summary for {case}')
     debit=int(summary.get('debits') or 0); exactly=int(summary.get('exactly_one_debit_request_ids') or 0); infer=int(summary.get('reason_confirms_success_count') or 0)
     if int(summary.get('trials') or 0)!=200 or len(g)!=200: raise ValueError(f'E4c trial count mismatch for {case}')
-    t4.append(['E4c',f'p={prob}', 'default' if order=='default' else 'request-ID first', 'identical signed request' if retry=='same-signed' else 'fresh nonce, same request_id',f'{lost}/200',json.dumps(dict(sorted(reasons.items())),sort_keys=True),f'{exactly}/200',str(infer)])
-write_table('T4-failure-modes',['Experiment','Mode / loss p','Request-ID / check order','Legitimate accepted / retry type','Replay accepted / lost responses','Retry reason counts','Exactly one debit','Client can infer success'],t4)
+    reason_text='; '.join(f'{name}:{count}' for name,count in sorted(reasons.items()))
+    t4.append(['E4c',f'p={prob}', 'default' if order=='default' else 'request-ID first', 'identical signed request' if retry=='same-signed' else 'fresh nonce, same request_id','','',f'{lost}/200',reason_text,f'{exactly}/200',str(infer)])
+write_table('T4-failure-modes',['Experiment','Mode / loss p','Request-ID / check order','Retry type','Legitimate accepted (k/30, Wilson 95%)','Replay accepted (k/30, Wilson 95%)','Lost responses (of 200)','Retry reason counts','Debited exactly once (k/200)','Retries infer success (k)'],t4)
 t4file=TABLE/'T4-failure-modes.tex'; t4text=t4file.read_text(encoding='utf-8')
-t4text=t4text.replace(r'\small',r'\small'+'\n'+r'\caption*{E4c client failure after debit is not zero in the saved data: its summary count equals the lost-response count for each loss case. The requested table omits this separate column; see source CSV and summary fields.}')
+t4text=t4text.replace(r'\begin{tabular}{lccccccccc}',r'\setlength{\tabcolsep}{1.5pt}'+'\n'+r'\begin{tabular}{lp{0.47in}p{0.61in}p{0.75in}p{0.76in}p{0.76in}p{0.49in}p{0.75in}p{0.70in}p{0.49in}}')
+t4text=t4text.replace(r'\small',r'\small'+'\n'+r'\caption*{For E4b, the first two outcome columns are legitimate requests accepted and replay requests accepted, each out of 30 with Wilson 95% intervals. For E4c, failures after debit equal the lost-response count by construction; the table reports lost responses, retry reasons, exactly-once debit count, and retries that reveal prior success.}')
 t4file.write_text(t4text,encoding='utf-8')
 
 # Compact empirical E1 matrix T5; every cell uses the same raw request rows as F2.
@@ -410,10 +466,7 @@ t5headers=['Config']+[f"{c.replace('S10 fast','S10f').replace('S10 late','S10l')
 write_table('T5-e1-coverage',t5headers,[[cfg]+[str(e1_cells[(cfg,c)][0]) for c in columns] for cfg in configs])
 
 # Every generated asset receives source paths/hashes and a data-specific caption.
-f2_sources=[f"{str(e1_dir.relative_to(ROOT)).replace('\\','/')}/{cfg}/requests.csv" for cfg in configs]
-for cfg in configs:
-    f2_sources.extend([latest_b_csv(run,cfg) for run in ('B-S10-fast-R0','B-S10-fast-R1','B-S10-late-R0','B-S10-late-R1')])
-    f2_sources.append(latest_b_csv('B-s11-100',cfg))
+f2_sources=[f"{str(e1_dir.relative_to(ROOT)).replace('\\','/')}/{cfg}/requests.csv" for cfg in configs]+[e1_summary_path,s10_path,s10_summary_path,s11_summary_path]
 f2_sources=list(dict.fromkeys(f2_sources))
 e2_source_files=[str(p.relative_to(ROOT)).replace('\\','/') for stack in stacks for p in sorted(e2_root.glob(f'{stack}-r*-c1/layer-timings.csv'))]
 sources={
@@ -430,7 +483,7 @@ if len(s8_values)!=1 or len(s9_values)!=1: raise ValueError('S8/S9 cells are inc
 s8k,s8n=next(iter(s8_values)); s9k,s9n=next(iter(s9_values))
 if s8k!=0 or s9k!=s9n: raise ValueError('S8/S9 caption values disagree with saved rows')
 col_n={c:e1_cells[(configs[0],c)][1] for c in columns}
-e1_caption='F2: H/T/N/R denote HMAC/timestamp/nonce/request-ID defenses; attacker A observes traffic without the session key (S1 through S8), attacker C has the leaked session key (S9), and B holds a bearer token only (S11). Each scenario header gives n; cells print successful attacks k, with grayscale/hatching encoding k/n; S8='+f'{s8k}/{s8n}'+', S9='+f'{s9k}/{s9n}'+'. Scaled-time S1 through S9; Round F default-window S10/S11; success_only.'
+e1_caption='F2: H/T/N/R denote HMAC/timestamp/nonce/request-ID defenses; attacker A observes traffic without the session key (S1 through S8 and S10), attacker C has the leaked key (S9), and B holds a bearer token only (S11). Each column header gives n; cells print successful attacks k, with grayscale/hatching encoding k/n. S5 uses n=1,500 (50 parallel x 30 batches); S8='+f'{s8k}/{s8n}'+', S9='+f'{s9k}/{s9n}'+'. S1-S9 use E1 v3 scaled time (PAST=6 s, FUTURE=2 s, NONCE_TTL=8 s); S10 uses independent trials at 1 s/9 s; S11 uses 100 attempts; success_only.'
 caption_map={
 'F2-e1-coverage-single':e1_caption, 'F2-e1-coverage-double':e1_caption,
 'F3a-scaled-TTL-grid':'n=30 per cell; attacker A (network observer, no session key) replays recorded requests; H/T/N/R mean HMAC/timestamp/nonce/request-ID; scaled-time PAST=6 s/FUTURE=2 s, success_only, H1T1N1R0.',
@@ -443,15 +496,15 @@ for stem,srcs in sources.items():
     manifest.append(f"| Figure | {outputs} | {source_text} | `python paper/generate_paper_assets.py` | {caption_map[stem]} |")
 table_sources={
 'T1-scenarios':f2_sources,
-'T2':list(dict.fromkeys([latest_b_csv(run,cfg,policy) for run in ('B-S10-fast-R0','B-S10-fast-R1','B-S10-late-R0','B-S10-late-R1') for cfg in configs if cfg.endswith('R0' if run.endswith('R0') else 'R1') for policy in (['success_only','any_outcome'] if run.endswith('R1') else ['success_only'])]+['experiments/results/s10-policy-resubmit/requests.csv'])),
-'T2-full':list(dict.fromkeys([latest_b_csv(run,cfg,policy) for run in ('B-S10-fast-R0','B-S10-fast-R1','B-S10-late-R0','B-S10-late-R1') for cfg in configs if cfg.endswith('R0' if run.endswith('R0') else 'R1') for policy in (['success_only','any_outcome'] if run.endswith('R1') else ['success_only'])]+['experiments/results/s10-policy-resubmit/requests.csv'])),
+'T2':[s10_path,s10_summary_path,resub_path],
+'T2-full':[s10_path,s10_summary_path],
 'T3-layer-cost':e2_source_files,'T4-failure-modes':[e4b_path,e4c_path],
 'T5-e1-coverage':f2_sources }
 for name,srcs in table_sources.items():
     existing=[s for s in srcs if (ROOT/s).is_file()]
     source_text='; '.join(f'{s} (SHA-256 {sha(s)})' for s in existing) or '; '.join(srcs)+' (request CSVs selected by configuration in generator)'
     if name in ('T1-scenarios','T2','T2-full','T5-e1-coverage'):
-        caption='Scenario counts and outcomes are recomputed from raw rows; attacker A lacks the session key, B has bearer token only, and C has leaked key; H/T/N/R denote HMAC/timestamp/nonce/request-ID; scaled-time except Round F default-window S10/S11; success_only except policy rows.'
+        caption='Attacker A observes traffic without the session key, B has bearer token only, and C has leaked key; H/T/N/R denote HMAC/timestamp/nonce/request-ID. E1 v3 uses PAST=6 s/FUTURE=2 s/NONCE_TTL=8 s; S10 is independent 30-trial data; S11 has 100 attempts; success_only except the explicit any_outcome rows.'
     elif name=='T3-layer-cost': caption=f"n=10 repeats per backend, each {e2_meta['measuredRequests']} requests after {e2_meta['warmupRequests']} warm-ups; localhost; attacker not applicable; all H/T/N/R on; success_only."
     else: caption='E4b n=30 per mode/request-ID case; E4c n=200 per loss/order/retry case; attacker A is a network observer without the session key; H/T/N/R denote the four defenses; E4 scaled-time/failure profile; success_only. The omitted E4c client-failure-after-debit count equals lost responses in the raw summary and is nonzero in loss cases.'
     manifest.append(f"| Table | `paper/tables/{name}.tex` | {source_text} | `python paper/generate_paper_assets.py` | {caption} |")
```

### Diff paper/crosscheck_assets.py
```diff
diff --git a/paper/crosscheck_assets.py b/paper/crosscheck_assets.py
index cfc8ba6..96fcb9c 100644
--- a/paper/crosscheck_assets.py
+++ b/paper/crosscheck_assets.py
@@ -1,120 +1,121 @@
-﻿from pathlib import Path
-import csv,re,json,zlib
-ROOT=Path(__file__).resolve().parents[1]
-P=ROOT/'paper'; compared=0; mismatches=[]; disagreements=[]
-SCEN=['S1','S2','S3','S4','S5','S6','S7a','S7b','S10 fast','S10 late','S11']
-CONFIGS=sorted([f'H{h}T{t}N{n}R{r}' for h in (0,1) for t in (0,1) for n in (0,1) for r in (0,1)])
-def read_csv(path):
-    with (ROOT/path).open(newline='',encoding='utf-8-sig') as f:return list(csv.DictReader(f))
-def summary_map(path):
-    return {(r['config_id'],r['scenario_id'],r.get('variant','')):r for r in read_csv(path)}
-e1=summary_map('experiments/results/e1-v2/summary.csv')
-round_summaries={}
-for scenario,run in [('S10 fast','B-S10-fast-R0'),('S10 late','B-S10-late-R0')]:
-    for rid in (0,1):
-        rname=('B-S10-fast-' if scenario=='S10 fast' else 'B-S10-late-')+f'R{rid}'
-        for row in read_csv(f'experiments/results/round-f/{rname}/summary.csv'):
-            key=(row['config_id'].split('-')[0],scenario,row['config_id'].split('-')[-1] if rid else 'success_only')
-            round_summaries[key]=row
-for row in read_csv('experiments/results/round-f/B-s11-100/summary.csv'):
-    if row['scenario_id']=='S11': round_summaries[(row['config_id'].split('-')[0],'S11','success_only')]=row
+"""Independent paper-cell validation. Does not import the asset generator."""
+from pathlib import Path
+import csv, re, zlib, json
 
-def expected(cfg,scen,policy='success_only'):
-    if scen in ('S1','S2','S3','S4','S5','S6','S7a','S7b','S8','S9'):
-        var={'S7a':'request_id','S7b':'nonce'}.get(scen,'')
-        r=e1.get((cfg,scen,var))
-        if r is None: return None
-    else:r=round_summaries.get((cfg,scen,policy))
-    if not r:return None
-    return int(r['http_accepted_count']),int(r['attempts'])
-def record(label,got,want):
+ROOT = Path(__file__).resolve().parents[1]
+PAPER = ROOT / 'paper'
+CONFIGS = [f'H{h}T{t}N{n}R{r}' for h in (0,1) for t in (0,1) for n in (0,1) for r in (0,1)]
+SCENARIOS = ['S1','S2','S3','S4','S5','S6','S7a','S7b','S10 fast','S10 late','S11']
+compared = 0
+mismatches = []
+def csv_rows(relative):
+    with (ROOT / relative).open(newline='', encoding='utf-8-sig') as stream:
+        return list(csv.DictReader(stream))
+def keyed(relative, config_field='config_id'):
+    return {(r[config_field], r['scenario_id']): r for r in csv_rows(relative)}
+def check(label, actual, expected):
     global compared
-    compared+=1
-    if got!=want:mismatches.append({'cell':label,'printed':got,'source':want})
+    compared += 1
+    if actual != expected:
+        mismatches.append({'cell': label, 'asset_value': actual, 'summary_value': expected})
+def wilson(k,n):
+    z=1.959963984540054; p=k/n; d=1+z*z/n; c=(p+z*z/(2*n))/d; m=z*((p*(1-p)+z*z/(4*n))/n)**0.5/d
+    return max(0,c-m),min(1,c+m)
+v3 = keyed('experiments/results/e1-v3/round-i-scaled/summary.csv')
+s10rows = csv_rows('experiments/results/e1-v3-s10-independent/2026-10-22T04-40-36-408Z/summary.csv')
+s10 = {(r['config_id'].rsplit('-',1)[0], r['scenario_id'], r['policy']): r for r in s10rows}
+s11 = keyed('experiments/results/e1-v3-s11/round-i-s11/summary.csv')
+expected = {}
+for config in CONFIGS:
+    for scenario in SCENARIOS[:8]:
+        row = v3[(config, scenario)]
+        expected[(config, scenario)] = (int(row['debited_count']), int(row['attempts']))
+    for label, source in [('S10 fast','S10_indep_fast'),('S10 late','S10_indep_late')]:
+        row = s10[(config, source, 'success_only')]
+        expected[(config, label)] = (int(row['delayed_execution_count']), int(row['attempts']))
+    row = s11[(config, 'S11')]
+    expected[(config, 'S11')] = (int(row['debited_count']), int(row['attempts']))
 
-def untex(x):return x.replace(r'\_','_').strip()
-def table_rows(path):
-    lines=(P/'tables'/path).read_text(encoding='utf-8').splitlines(); active=False; out=[]
+def tex_table(relative):
+    lines = (PAPER / relative).read_text(encoding='utf-8').splitlines()
+    active = False
+    result = []
     for line in lines:
-        if line=='\\midrule':active=True;continue
-        if line=='\\bottomrule':break
+        if line.strip() == r'\midrule': active = True; continue
+        if line.strip() == r'\bottomrule': break
         if active and '&' in line:
-            vals=[untex(v.strip().removesuffix(r'\\')) for v in line.split('&')]
-            vals[-1]=untex(vals[-1].replace(r'\\',''))
-            out.append(vals)
-    return out
-# T5 is the numeric source-aligned matrix. Validate each cell against E1 and Round F.
-t5=table_rows('T5-e1-coverage.tex')
-if len(t5)!=16: mismatches.append({'cell':'T5 row count','printed':len(t5),'source':16})
+            fields = [x.strip().replace(r'\_', '_') for x in line.split('&')]
+            fields[-1] = fields[-1].removesuffix(r'\\').strip()
+            result.append(fields)
+    return result
+
+t5 = tex_table('tables/T5-e1-coverage.tex')
+if len(t5) != 16:
+    mismatches.append({'cell':'T5 configuration rows','asset_value':len(t5),'summary_value':16})
 for row in t5:
-    cfg=row[0]
-    for scen,val in zip(SCEN,row[1:]):
-        source_scen=scen; policy='success_only'
-        want=expected(cfg,source_scen,policy)
-        gotk=int(val)
-        if want is None: mismatches.append({'cell':f'T5 {cfg} {scen}','printed':gotk,'source':'missing'}); continue
-        record(f'T5 {cfg} {scen}',(gotk,int(want[1])),want)
-# Decode the PDF text runs independently: Matplotlib writes the F2 cell labels in 7-point F3 text.
-def pdf_cell_text(path):
-    data=(P/'figures'/path).read_bytes(); streams=[]
-    for m in re.finditer(rb'stream\r?\n',data):
-        start=m.end(); end=data.find(b'endstream',start); raw=data[start:end].rstrip(b'\r\n')
-        try: decoded=zlib.decompress(raw)
+    config = row[0]
+    for scenario, printed in zip(SCENARIOS, row[1:]):
+        k, n = expected[(config, scenario)]
+        check(f'T5 {config} {scenario}', (int(printed), n), (k, n))
+
+def pdf_values(filename):
+    content = (PAPER/'figures'/filename).read_bytes()
+    streams=[]
+    for match in re.finditer(rb'stream\r?\n', content):
+        start=match.end(); end=content.find(b'endstream',start); stream=content[start:end].rstrip(b'\r\n')
+        try: decoded=zlib.decompress(stream)
         except zlib.error: continue
         if b'/F3 7 Tf' in decoded: streams.append(decoded)
-    if len(streams)!=1: raise ValueError(f'expected one cell-text content stream in {path}, got {len(streams)}')
+    if len(streams)!=1: raise ValueError(f'{filename}: expected one cell-label stream, found {len(streams)}')
     pattern=rb'q\s+1 0 -0 1 ([0-9.]+) ([0-9.]+) cm\s+BT\s+/F3 7 Tf\s+0 0 Td\s+\[(.*?)\]\s*TJ\s+ET\s+Q'
-    found=[]
-    for m in re.finditer(pattern,streams[0],re.S):
-        pieces=re.findall(rb'\((.*?)\)',m.group(3),re.S)
-        label=b''.join(pieces).decode('utf-16-be','strict')
-        found.append((float(m.group(1)),float(m.group(2)),label))
-    if len(found)!=len(CONFIGS)*len(SCEN): raise ValueError(f'{path} has {len(found)} cells, expected {len(CONFIGS)*len(SCEN)}')
-    # Page y increases upward; rows are emitted top-to-bottom.
-    found.sort(key=lambda x:(-round(x[1],4),x[0]))
-    return [x[2] for x in found]
+    values=[]
+    for match in re.finditer(pattern,streams[0],re.S):
+        pieces=re.findall(rb'\((.*?)\)',match.group(3),re.S)
+        values.append((float(match.group(1)),float(match.group(2)),int(b''.join(pieces).decode('utf-16-be'))))
+    if len(values)!=len(CONFIGS)*len(SCENARIOS): raise ValueError(f'{filename}: expected 176 heatmap labels, got {len(values)}')
+    values.sort(key=lambda item:(-round(item[1],4),item[0]))
+    return [x[2] for x in values]
 for figure in ['F2-e1-coverage-single.pdf','F2-e1-coverage-double.pdf']:
-    printed=pdf_cell_text(figure)
-    for i,(cfg,scen) in enumerate((c,s) for c in CONFIGS for s in SCEN):
-        want=expected(cfg,scen)
-        record(f'{figure} {cfg} {scen}',int(printed[i]),None if want is None else want[0])
-# Compare overlapping S10/S11 success rates at 30 vs 100 attempts, and report disagreements.
-for cfg in CONFIGS:
-    for scen in ['S10 fast','S10 late','S11']:
-        old=e1.get((cfg,scen.replace(' ','_'),''))
-        new=round_summaries.get((cfg,scen,'success_only'))
-        if old and new:
-            a,an=int(old['http_accepted_count']),int(old['attempts']); b,bn=int(new['http_accepted_count']),int(new['attempts'])
-            if a/an != b/bn: disagreements.append({'config':cfg,'scenario':scen,'30_attempt':f'{a}/{an}','100_attempt':f'{b}/{bn}'})
-# T2-full per-configuration S10 cells, including each policy.
-for row in table_rows('T2-full.tex'):
-    if row[0] not in ('S10_fast','S10_late'):continue
-    scen='S10 fast' if row[0]=='S10_fast' else 'S10 late'; cfg=row[1]; pol=row[2]
-    if pol=='success_only' and cfg.endswith('R0'):policy='success_only'
-    else:policy=pol
-    want=expected(cfg,scen,policy)
-    got=(int(row[3]),int(row[4]))
-    record(f'T2-full {cfg} {scen} {pol}',got,want)
-# Compact T2 group rows: validate each grouped cell by aggregating matching Round F summary records.
-for row in table_rows('T2.tex'):
-    policy,group,scenario,kn,_scope=row
-    if scenario not in ('fast','late'):continue
-    scen='S10 '+scenario
-    rid=1 if 'R on' in group else 0
-    freshness=group.split('; ')[1]
-    tn={'none':(0,0),'T only':(1,0),'N only':(0,1),'T and N':(1,1)}[freshness]
-    candidates=[c for c in CONFIGS if c.endswith(f'R{rid}') and int(c[3])==tn[0] and int(c[5])==tn[1]]
-    if _scope in CONFIGS:candidates=[_scope]
-    vals=[expected(c,scen,policy) for c in candidates]
-    vals=[v for v in vals if v is not None]
-    want=(sum(v[0] for v in vals),sum(v[1] for v in vals))
-    m=re.match(r'(\d+)/(\d+)',kn); got=(int(m.group(1)),int(m.group(2))) if m else None
-    record(f'T2 {policy} {group} {scen}',got,want)
-# Explicit report.
-lines=['Independent paper asset cross-check','',f'Values compared: {compared}',f'Mismatches: {len(mismatches)}',f'30-attempt vs 100-attempt rate disagreements: {len(disagreements)}','', 'Method: standalone CSV parser and formulas; parses the embedded 7-point cell labels from both F2 PDFs, compares T5 and T2/T2-full printed cells against E1 v2 and Round F summary CSVs, and lists overlapping 30-vs-100 rate disagreements.', '', 'Mismatches:']
-lines += [json.dumps(x,sort_keys=True) for x in mismatches] or ['None.']
-lines += ['', 'Cells whose success rates differ between the 30-attempt E1 v2 and 100-attempt Round F runs:']
-lines += [json.dumps(x,sort_keys=True) for x in disagreements] or ['None.']
-(P/'CROSSCHECK.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
-print(f'Cross-check values compared: {compared}; mismatches: {len(mismatches)}; 30 vs 100 rate disagreements: {len(disagreements)}')
+    values=pdf_values(figure)
+    for index,(config,scenario) in enumerate((c,s) for c in CONFIGS for s in SCENARIOS):
+        check(f'{figure} {config} {scenario}', values[index], expected[(config,scenario)][0])
+
+# The S10 table entries are independently checked from the source summary as well.
+for row in tex_table('tables/T2-full.tex'):
+    policy, config, scenario, kn, ci = row
+    label = 'S10 fast' if scenario == 'fast' else 'S10 late'
+    summary = s10[(config, 'S10_indep_'+scenario, policy)]
+    check(f'T2-full {policy} {config} {label}', tuple(map(int, kn.split('/'))), (int(summary['delayed_execution_count']),int(summary['attempts'])))
+    numbers=re.findall(r'\d+\.\d+',ci)
+    low,high=wilson(int(summary['delayed_execution_count']),int(summary['attempts']))
+    check(f'T2-full {policy} {config} {label} Wilson',tuple(map(float,numbers[:2])) if len(numbers)>=2 else None,(round(low,3),round(high,3)))
+for row in tex_table('tables/T2.tex'):
+    policy, defense, scope, fast_text, late_text, resub_text = row
+    if defense == 'After funding': continue
+    rid=int(re.search(r'R([01])',defense).group(1)); fresh=defense.split('; ',1)[1]
+    tn={'No T/N':(0,0),'T only':(1,0),'N only':(0,1),'T and N':(1,1)}[fresh]
+    configs=re.findall(r'H[01]T[01]N[01]R[01]',scope)
+    def check_compact(text, scenario):
+        match=re.match(r'(\d+)/(\d+) \[([0-9.]+), ([0-9.]+)\]',text)
+        values=[(c,s10[(c,'S10_indep_'+scenario,policy)]) for c in configs]
+        counts={(int(v['delayed_execution_count']),int(v['attempts'])) for _,v in values}
+        if len(counts)!=1:
+            mismatches.append({'cell':f'T2 compact {policy} {defense} {scenario}','asset_value':scope,'summary_value':'group contains non-identical cells'});return
+        k,n=next(iter(counts));low,high=wilson(k,n)
+        check(f'T2 compact {policy} {defense} {scenario} count',(int(match.group(1)),int(match.group(2))) if match else None,(k,n))
+        check(f'T2 compact {policy} {defense} {scenario} Wilson',(round(float(match.group(3)),3),round(float(match.group(4)),3)) if match else None,(round(low,3),round(high,3)))
+    check_compact(fast_text,'fast'); check_compact(late_text,'late')
+
+report = [
+    '# Independent Paper Cross-check','',
+    f'Values compared: {compared}',
+    f'Mismatches: {len(mismatches)}',
+    'Source: E1 v3 summary.csv, S10-independent summary.csv (success_only), and E1 v3 S11 summary.csv.',
+    'Method: this standalone script parses summary CSVs and LaTeX tables directly and extracts the 7-point cell labels from both F2 PDFs; it does not import generate_paper_assets.py.',
+    '', '## Mismatches'
+]
+report += [json.dumps(row,sort_keys=True) for row in mismatches] if mismatches else ['None.']
+report.append('')
+(PAPER/'CROSSCHECK.txt').write_text('\n'.join(report),encoding='utf-8')
+print(f'Independent cross-check compared {compared} values; mismatches={len(mismatches)}')
 if mismatches: raise SystemExit(1)
```

## 10. Problems and uncertainties

E1 v2 used a 4 s TTL, shorter than PAST=6 s; E1 v3 corrected it to 8 s and two S4 cells changed. E1 v3 lasted 977.778 s; independent S10 lasted 306.767 s. Windows denied AC/battery and CPU-frequency inspection. The simulation is single-host localhost; results do not establish real-network or multi-process behavior. Older result directories were not overwritten.
## 11. Git

Round I source, test, docs and paper assets commit: `c9022ef` (Complete Round I experiment verification and paper assets). This report update is committed separately; its hash is stated in the final handoff. Pre-existing edits to `attack/payload.json` and `experiments/results/corrections/*` are excluded; no push was made.

## Appendix: all remaining tracked-file diffs

### docs/CLAIMS_EVIDENCE.md
```diff
diff --git a/docs/CLAIMS_EVIDENCE.md b/docs/CLAIMS_EVIDENCE.md
index 0e49027..1451a49 100644
--- a/docs/CLAIMS_EVIDENCE.md
+++ b/docs/CLAIMS_EVIDENCE.md
@@ -27,3 +27,16 @@ This is an evidence map, not a claim that each result generalizes beyond the loc
 
 
 Privacy note: SQLite signature-column values in the new Round F databases were nulled after the measured runs and ledger oracle queries. The audit was rerun after this sanitization and still matched all compared values.
+
+
+
+
+## Round I claim scope
+
+1. Four-layer leave-one-out evidence is scoped to E1 v3 (PAST=6 s, FUTURE=2 s, NONCE_TTL=8 s, SESSION_TTL=15 s, success_only). Ordinary S1-S9 use 30 attempts (S5 uses 1,500); S11 uses 100 attempts. “None” still retains session bearer authentication and account ownership.
+
+2. The idempotency policy trade-off uses independent S10 trials: 30 distinct failed requests and one replay per failed request. Under success_only, retries can execute after funding if the other enabled freshness layer does not block them. Under any_outcome with request-ID on, the same request ID returned ALREADY_PROCESSED. The separate resubmission rows use 30 trials per policy and retry variant.
+
+3. The scaled-time TTL result is reproduced: E1 v2 used the deliberately short, mis-configured 4 s TTL; E1 v3 uses 8 s with PAST=6 s and FUTURE=2 s. S4 changed only in the nonce-on/request-ID-off cells, where the v2 replay succeeded and v3 replay was blocked. This round did not rerun E4a or the default full-scale TTL-gap experiment.
+
+See the Round I raw paths and hashes in RESULTS_PACK_A.md. Route binding and atomic debit were checked only in this local simulation; they do not establish multi-process production behavior.
\ No newline at end of file
```

### docs/RESULTS_PACK_A.md
```diff
diff --git a/docs/RESULTS_PACK_A.md b/docs/RESULTS_PACK_A.md
index 57116c4..2433b3d 100644
--- a/docs/RESULTS_PACK_A.md
+++ b/docs/RESULTS_PACK_A.md
@@ -701,3 +701,150 @@ Headline: S11 produced 100/100 debits when HMAC was disabled (all 8 such configu
 | B-s11-100 | experiments/results/round-f/B-s11-100/summary.csv | <REDACTED> | experiments/results/round-f/B-s11-100/run.json |
 
 Privacy treatment: the post-run SQLite files retained the transaction and balance columns used by the oracle. After the oracle queries completed, stored signature column values were set to NULL and the files checkpointed; this removes signatures from the deliverable artifacts without changing ledger outcome fields. The independent audit was rerun successfully against these sanitized SQLite files at experiments/results/round-f/audit-final4/audit-report.json.
+
+
+
+
+## Round I — final experimental addendum
+
+All new outputs are under Round I directories; older result folders were left untouched. Environment: Node v24.11.1, Windows, Memurai Developer 4.2.3, localhost only. E1 v2 used TTL 4 s, deliberately shorter than PAST 6 s (a mis-configured profile). E1 v3 used PAST=6 s, FUTURE=2 s, NONCE_TTL=8 s, SESSION_TTL=15 s, success_only. The default-window confirmation used PAST=300 s, FUTURE=5 s, NONCE_TTL=300 s, SESSION_TTL=900 s.
+
+### Provenance
+
+| Artifact | SHA-256 |
+|---|---|
+| experiments/results/e1-v3/round-i-scaled/summary.csv | <REDACTED> |
+| experiments/results/e1-v3-s10-independent/2026-10-22T04-40-36-408Z/summary.csv | <REDACTED> |
+| experiments/results/e1-v3-s11/round-i-s11/summary.csv | <REDACTED> |
+| experiments/results/round-i/s10-independent/resubmission/summary.csv | <REDACTED> |
+| experiments/results/round-i/route-binding/requests.csv | <REDACTED> |
+| experiments/results/round-i/atomic-debit/runs.csv | <REDACTED> |
+| experiments/results/round-i/e4c-exact/e4c.csv | <REDACTED> |
+
+### E1 v2 versus v3
+
+18 cells differ in count or attempt denominator. Two cells changed success rate: S4 for H0T0N1R0 and H1T0N1R0. The old 4 s TTL expired by the 7 s replay; the clean 8 s TTL remained live and blocked it. S11 changed from 30 to 100 attempts per configuration; its success rate was unchanged in every configuration. Full comparison: experiments/results/round-i/e1-v2-v3-cell-differences.csv.
+
+| Configuration | Scenario | E1 v2 k/n | E1 v3 k/n |
+|---|---|---:|---:|
+| H0T0N1R0 | S4 | 30/30 | 0/30 |
+| H1T0N1R0 | S4 | 30/30 | 0/30 |
+
+Default-window confirmation:
+
+| Scenario | Attempts | HTTP accepted / SQLite debits | Wilson 95% | Blocking reasons |
+|---|---:|---:|---|---|
+| S2_default_window_60s | 30 | 0/0 | [0.0000, 0.1135] | NONCE_FAIL:30 |
+| S4_default_window_301s | 30 | 0/0 | [0.0000, 0.1135] | TIMESTAMP_FAIL:30 |
+
+### S10 independent trials
+
+Each cell used 30 distinct failed request IDs and nonces, withdrawal amount 100, initial balance 1, one 3,001 deposit (post-funding balance 3,002), then replayed each failed capture exactly once. The output is delayed SQLite executions by request ID.
+
+| Configuration | Policy | Scenario | Delayed executions | Wilson 95% | Blocking reason histogram |
+|---|---|---|---:|---|---|
+| H0T0N0R0-success_only | success_only | fast | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H1T0N0R0-success_only | success_only | fast | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H0T1N0R0-success_only | success_only | fast | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H1T1N0R0-success_only | success_only | fast | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H0T0N1R0-success_only | success_only | fast | 0/30 | [0.0000, 0.1135] | NONCE_FAIL:30 |
+| H1T0N1R0-success_only | success_only | fast | 0/30 | [0.0000, 0.1135] | NONCE_FAIL:30 |
+| H0T1N1R0-success_only | success_only | fast | 0/30 | [0.0000, 0.1135] | NONCE_FAIL:30 |
+| H1T1N1R0-success_only | success_only | fast | 0/30 | [0.0000, 0.1135] | NONCE_FAIL:30 |
+| H0T0N0R1-success_only | success_only | fast | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H0T0N0R1-any_outcome | any_outcome | fast | 0/30 | [0.0000, 0.1135] | ALREADY_PROCESSED:30 |
+| H1T0N0R1-success_only | success_only | fast | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H1T0N0R1-any_outcome | any_outcome | fast | 0/30 | [0.0000, 0.1135] | ALREADY_PROCESSED:30 |
+| H0T1N0R1-success_only | success_only | fast | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H0T1N0R1-any_outcome | any_outcome | fast | 0/30 | [0.0000, 0.1135] | ALREADY_PROCESSED:30 |
+| H1T1N0R1-success_only | success_only | fast | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H1T1N0R1-any_outcome | any_outcome | fast | 0/30 | [0.0000, 0.1135] | ALREADY_PROCESSED:30 |
+| H0T0N1R1-success_only | success_only | fast | 0/30 | [0.0000, 0.1135] | NONCE_FAIL:30 |
+| H0T0N1R1-any_outcome | any_outcome | fast | 0/30 | [0.0000, 0.1135] | NONCE_FAIL:30 |
+| H1T0N1R1-success_only | success_only | fast | 0/30 | [0.0000, 0.1135] | NONCE_FAIL:30 |
+| H1T0N1R1-any_outcome | any_outcome | fast | 0/30 | [0.0000, 0.1135] | NONCE_FAIL:30 |
+| H0T1N1R1-success_only | success_only | fast | 0/30 | [0.0000, 0.1135] | NONCE_FAIL:30 |
+| H0T1N1R1-any_outcome | any_outcome | fast | 0/30 | [0.0000, 0.1135] | NONCE_FAIL:30 |
+| H1T1N1R1-success_only | success_only | fast | 0/30 | [0.0000, 0.1135] | NONCE_FAIL:30 |
+| H1T1N1R1-any_outcome | any_outcome | fast | 0/30 | [0.0000, 0.1135] | NONCE_FAIL:30 |
+| H0T0N0R0-success_only | success_only | late | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H1T0N0R0-success_only | success_only | late | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H0T1N0R0-success_only | success_only | late | 0/30 | [0.0000, 0.1135] | TIMESTAMP_FAIL:30 |
+| H1T1N0R0-success_only | success_only | late | 0/30 | [0.0000, 0.1135] | TIMESTAMP_FAIL:30 |
+| H0T0N1R0-success_only | success_only | late | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H1T0N1R0-success_only | success_only | late | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H0T1N1R0-success_only | success_only | late | 0/30 | [0.0000, 0.1135] | TIMESTAMP_FAIL:30 |
+| H1T1N1R0-success_only | success_only | late | 0/30 | [0.0000, 0.1135] | TIMESTAMP_FAIL:30 |
+| H0T0N0R1-success_only | success_only | late | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H0T0N0R1-any_outcome | any_outcome | late | 0/30 | [0.0000, 0.1135] | ALREADY_PROCESSED:30 |
+| H1T0N0R1-success_only | success_only | late | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H1T0N0R1-any_outcome | any_outcome | late | 0/30 | [0.0000, 0.1135] | ALREADY_PROCESSED:30 |
+| H0T1N0R1-success_only | success_only | late | 0/30 | [0.0000, 0.1135] | TIMESTAMP_FAIL:30 |
+| H0T1N0R1-any_outcome | any_outcome | late | 0/30 | [0.0000, 0.1135] | TIMESTAMP_FAIL:30 |
+| H1T1N0R1-success_only | success_only | late | 0/30 | [0.0000, 0.1135] | TIMESTAMP_FAIL:30 |
+| H1T1N0R1-any_outcome | any_outcome | late | 0/30 | [0.0000, 0.1135] | TIMESTAMP_FAIL:30 |
+| H0T0N1R1-success_only | success_only | late | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H0T0N1R1-any_outcome | any_outcome | late | 0/30 | [0.0000, 0.1135] | ALREADY_PROCESSED:30 |
+| H1T0N1R1-success_only | success_only | late | 30/30 | [0.8865, 1.0000] | ACCEPTED:30 |
+| H1T0N1R1-any_outcome | any_outcome | late | 0/30 | [0.0000, 0.1135] | ALREADY_PROCESSED:30 |
+| H0T1N1R1-success_only | success_only | late | 0/30 | [0.0000, 0.1135] | TIMESTAMP_FAIL:30 |
+| H0T1N1R1-any_outcome | any_outcome | late | 0/30 | [0.0000, 0.1135] | TIMESTAMP_FAIL:30 |
+| H1T1N1R1-success_only | success_only | late | 0/30 | [0.0000, 0.1135] | TIMESTAMP_FAIL:30 |
+| H1T1N1R1-any_outcome | any_outcome | late | 0/30 | [0.0000, 0.1135] | TIMESTAMP_FAIL:30 |
+
+### S11 token-only forgery
+
+The attacker had the captured bearer token but no session signing key; each attempt was a fresh withdrawal with amount 1 and an absent signature.
+
+| Configuration | SQLite debits / attempts | Wilson 95% | Blocking reason |
+|---|---:|---|---|
+| H0T0N0R0 | 100/100 | [0.9630, 1.0000] | ACCEPTED:100 |
+| H1T0N0R0 | 0/100 | [0.0000, 0.0370] | SIGNATURE_FAIL:100 |
+| H0T1N0R0 | 100/100 | [0.9630, 1.0000] | ACCEPTED:100 |
+| H1T1N0R0 | 0/100 | [0.0000, 0.0370] | SIGNATURE_FAIL:100 |
+| H0T0N1R0 | 100/100 | [0.9630, 1.0000] | ACCEPTED:100 |
+| H1T0N1R0 | 0/100 | [0.0000, 0.0370] | SIGNATURE_FAIL:100 |
+| H0T1N1R0 | 100/100 | [0.9630, 1.0000] | ACCEPTED:100 |
+| H1T1N1R0 | 0/100 | [0.0000, 0.0370] | SIGNATURE_FAIL:100 |
+| H0T0N0R1 | 100/100 | [0.9630, 1.0000] | ACCEPTED:100 |
+| H1T0N0R1 | 0/100 | [0.0000, 0.0370] | SIGNATURE_FAIL:100 |
+| H0T1N0R1 | 100/100 | [0.9630, 1.0000] | ACCEPTED:100 |
+| H1T1N0R1 | 0/100 | [0.0000, 0.0370] | SIGNATURE_FAIL:100 |
+| H0T0N1R1 | 100/100 | [0.9630, 1.0000] | ACCEPTED:100 |
+| H1T0N1R1 | 0/100 | [0.0000, 0.0370] | SIGNATURE_FAIL:100 |
+| H0T1N1R1 | 100/100 | [0.9630, 1.0000] | ACCEPTED:100 |
+| H1T1N1R1 | 0/100 | [0.0000, 0.0370] | SIGNATURE_FAIL:100 |
+
+### Resubmission after funding
+
+| Policy | Variant | Successes / attempts | Wilson 95% | SQLite success debits | Reasons |
+|---|---|---:|---|---:|---|
+| success_only | same_request_id_fresh_nonce | 30/30 | [0.8865, 1.0000] | 30 | ACCEPTED:30 |
+| success_only | new_request_id_fresh_nonce | 30/30 | [0.8865, 1.0000] | 30 | ACCEPTED:30 |
+| any_outcome | same_request_id_fresh_nonce | 0/30 | [0.0000, 0.1135] | 0 | ALREADY_PROCESSED:30 |
+| any_outcome | new_request_id_fresh_nonce | 30/30 | [0.8865, 1.0000] | 30 | ACCEPTED:30 |
+
+### I3 correctness checks
+
+Route binding: the four cases in experiments/results/round-i/route-binding/requests.csv were rejected as INVALID_REQUEST with zero matching ledger rows, both with HMAC enabled and disabled. Atomic debit: 30 fresh-state runs, each with 100 parallel valid withdrawals of amounts 1..100 against balance 100. All satisfy nonnegative balance, debit sum at most 100, and final balance plus successful debits equal 100. The lowest reconstructed balance was 0; distinct observed successful-debit sums were 92, 93, 94, 95, 96, 97, 98, 99, 100. Raw per-run CSV: experiments/results/round-i/atomic-debit/runs.csv; sanitized ledger rows: experiments/results/round-i/atomic-debit/ledger.csv.
+
+### E4c exact-count loss sampling
+
+The new seeded Fisher-Yates pattern selects exactly round(p x 200) positions and shares the pattern for cells with the same p.
+
+| p | Check order | Retry type | Lost responses | Retry reasons | Exactly-one debits | ALREADY_PROCESSED success clues |
+|---:|---|---|---:|---|---:|---:|
+| 0 | default | same-signed | 0/200 | none | 200/200 | 0 |
+| 0 | default | fresh-nonce-same-request-id | 0/200 | none | 200/200 | 0 |
+| 0 | request_id_before_nonce | same-signed | 0/200 | none | 200/200 | 0 |
+| 0 | request_id_before_nonce | fresh-nonce-same-request-id | 0/200 | none | 200/200 | 0 |
+| 0.05 | default | same-signed | 10/200 | NONCE_FAIL:10 | 200/200 | 0 |
+| 0.05 | default | fresh-nonce-same-request-id | 10/200 | ALREADY_PROCESSED:10 | 200/200 | 10 |
+| 0.05 | request_id_before_nonce | same-signed | 10/200 | ALREADY_PROCESSED:10 | 200/200 | 10 |
+| 0.05 | request_id_before_nonce | fresh-nonce-same-request-id | 10/200 | ALREADY_PROCESSED:10 | 200/200 | 10 |
+| 0.2 | default | same-signed | 40/200 | NONCE_FAIL:40 | 200/200 | 0 |
+| 0.2 | default | fresh-nonce-same-request-id | 40/200 | ALREADY_PROCESSED:40 | 200/200 | 40 |
+| 0.2 | request_id_before_nonce | same-signed | 40/200 | ALREADY_PROCESSED:40 | 200/200 | 40 |
+| 0.2 | request_id_before_nonce | fresh-nonce-same-request-id | 40/200 | ALREADY_PROCESSED:40 | 200/200 | 40 |
+
+The prior E4c output is superseded. Its old generator drew 200 independent Bernoulli outcomes using an LCG: function lossPattern(p){let x=(0xE4C2026+(Math.round(p*1000)*2654435761))>>>0;const out=[];for(let i=0;i<200;i++){x=(1664525*x+1013904223)>>>0;out.push(x/4294967296<p);}return out;}. It did not enforce an exact count; the old saved output happened to contain 3 losses at p=0.05 and 44 at p=0.2. New raw data: experiments/results/round-i/e4c-exact/e4c.csv.
\ No newline at end of file
```

### experiments/audit/verify-results.js
```diff
diff --git a/experiments/audit/verify-results.js b/experiments/audit/verify-results.js
index 466b175..aefb25f 100644
--- a/experiments/audit/verify-results.js
+++ b/experiments/audit/verify-results.js
@@ -53,7 +53,24 @@ async function main(){
   for(const row of s11Summary.filter(r=>r.scenario_id==='S11')){const id=`E1/${row.config_id}/S11/debit`,value=`${row.debited_count}/${row.attempts} [${Number(row.wilson95_low).toFixed(4)},${Number(row.wilson95_high).toFixed(4)}]`;check(`docs.curated.${id}`,true,facts.includes(`| ${id} | ${value} |`),'docs/PAPER_FACTS_CURATED.md');check(`docs.pack.S11.${row.config_id}`,true,pack.includes(`${row.debited_count}/${row.attempts} [${Number(row.wilson95_low).toFixed(3)},${Number(row.wilson95_high).toFixed(3)}]`),'docs/RESULTS_PACK_A.md S11 table');}
   for(const row of e3sum){const id=`E3 ${row.profile} P${row.past_seconds} F${row.future_seconds} false-reject`,value=`${row.false_rejections}/${row.attempts} [${Number(row.wilson95_low).toFixed(4)},${Number(row.wilson95_high).toFixed(4)}]; off ${row.offline_expected_rejections}; Δ${row.mismatch_count}`;check(`docs.curated.${id}`,true,facts.includes(`| ${id} | ${value} |`),'docs/PAPER_FACTS_CURATED.md');check(`docs.pack.E3.${id}`,true,pack.includes(`${row.false_rejections}/${row.attempts} [${Number(row.wilson95_low).toFixed(3)},${Number(row.wilson95_high).toFixed(3)}]`),'docs/RESULTS_PACK_A.md E3 table');}
   for(const row of e4b.filter(x=>x.attempt==='summary')){const value=`${row.replay_accepted}/${row.replay_total} [${Number(row.replay_wilson95_low).toFixed(3)},${Number(row.replay_wilson95_high).toFixed(3)}]`;check(`docs.pack.E4b.${row.case}`,true,pack.includes(value),'docs/RESULTS_PACK_A.md E4b table');}
-  const report={generatedAt:new Date().toISOString(),method:'Independent parser, Wilson formula and t interval formula in this file; direct SQLite SELECTs for S11/E4c; raw per-request CSVs for E1/E3/E4/E4b; E2 repeat-level timing summaries.',comparedValues:checks.length,mismatches:checks.filter(x=>!x.match).length,checks,notes,files:{e1Summary:'experiments/results/e1-v2/summary.csv',s11Summary:'experiments/results/e1-v2-s11/summary.csv',e3Raw:'experiments/results/e3-v2/requests.csv',e4aRaw:'experiments/results/e4-v2/e4a-requests.csv',e4b:'experiments/results/e4-final-c3/e4b.csv',e4c:'experiments/results/e4-final-c3-rerun/e4c.csv',e2LayerSummary:'experiments/results/e2-v2/layer-timing-summary.csv'}};
+  // Round I: E1 v3 raw attempts and S10 independent delayed executions.
+  const r1root=path.join(ROOT,'experiments/results/e1-v3/round-i-scaled'),r1summary=readCsv(path.join(r1root,'summary.csv'));
+  for(const row of r1summary.filter(r=>/^H[01]T[01]N[01]R[01]$/.test(r.config_id)&&['S1','S2','S3','S4','S5','S6','S7a','S7b','S8','S9'].includes(r.scenario_id))){const file=path.join(r1root,row.config_id,'requests.csv'),raw=readCsv(file).filter(x=>x.phase==='attacker'&&x.scenario_id===row.scenario_id&&(!row.variant||x.variant===row.variant)),accepted=raw.filter(x=>x.outcome==='ACCEPTED'&&Number(x.http_status)===200).length;check(`I1.${row.config_id}.${row.scenario_id}.attempts`,Number(row.attempts),raw.length,path.relative(ROOT,file));check(`I1.${row.config_id}.${row.scenario_id}.http_accepted`,Number(row.http_accepted_count),accepted,path.relative(ROOT,file));const[lo,hi]=wilson(Number(row.debited_count),Number(row.attempts));check(`I1.${row.config_id}.${row.scenario_id}.wilson_low`,Number(row.wilson95_low),lo,path.relative(ROOT,file));check(`I1.${row.config_id}.${row.scenario_id}.wilson_high`,Number(row.wilson95_high),hi,path.relative(ROOT,file));}
+  const r1s11root=path.join(ROOT,'experiments/results/e1-v3-s11/round-i-s11'),r1s11=readCsv(path.join(r1s11root,'summary.csv'));
+  for(const row of r1s11.filter(r=>/^H[01]T[01]N[01]R[01]$/.test(r.config_id)&&r.scenario_id==='S11')){const file=path.join(r1s11root,row.config_id,'requests.csv'),raw=readCsv(file).filter(x=>x.phase==='attacker'&&x.scenario_id==='S11'),accepted=raw.filter(x=>x.outcome==='ACCEPTED').length,dbPath=path.join(r1s11root,`${row.config_id}.sqlite`),ledger=await dbAll(dbPath,"SELECT COUNT(*) AS n FROM transactions WHERE type='WITHDRAW' AND status='SUCCESS' AND request_id LIKE 's11-r-%'"),debits=Number(ledger[0].n),[lo,hi]=wilson(debits,raw.length);check(`I1.S11.${row.config_id}.attempts`,100,raw.length,file);check(`I1.S11.${row.config_id}.accepted`,Number(row.http_accepted_count),accepted,file);check(`I1.S11.${row.config_id}.sqlite_debits`,Number(row.debited_count),debits,dbPath);check(`I1.S11.${row.config_id}.wilson_low`,Number(row.wilson95_low),lo,file);check(`I1.S11.${row.config_id}.wilson_high`,Number(row.wilson95_high),hi,file);}
+  const profile=JSON.parse(fs.readFileSync(path.join(r1root,'run.json'),'utf8')).scaledProfile;check('I1.scaled.PAST',6,profile.timestampPastSeconds,'E1 v3 run.json');check('I1.scaled.FUTURE',2,profile.timestampFutureSeconds,'E1 v3 run.json');check('I1.scaled.NONCE_TTL',8,profile.nonceTtlSeconds,'E1 v3 run.json');check('I1.scaled.SESSION_TTL',15,profile.sessionTtlSeconds,'E1 v3 run.json');
+  for(const row of r1summary.filter(r=>r.config_id==='H1T1N1R1-DEFAULT'&&['S2_default_window_60s','S4_default_window_301s'].includes(r.scenario_id))){const file=path.join(r1root,row.config_id,'requests.csv'),raw=readCsv(file).filter(x=>x.phase==='attacker'&&x.scenario_id===row.scenario_id),accepted=raw.filter(x=>x.outcome==='ACCEPTED').length,[lo,hi]=wilson(Number(row.debited_count),raw.length);check(`I1.default.${row.scenario_id}.attempts`,30,raw.length,file);check(`I1.default.${row.scenario_id}.accepted`,Number(row.http_accepted_count),accepted,file);check(`I1.default.${row.scenario_id}.wilson_low`,Number(row.wilson95_low),lo,file);check(`I1.default.${row.scenario_id}.wilson_high`,Number(row.wilson95_high),hi,file);}
+  // S10-indep: correlate failed request hashes with actual SUCCESS rows read from the saved SQLite ledger.
+  const s10root=path.join(ROOT,'experiments/results/e1-v3-s10-independent'),s10run=fs.readdirSync(s10root).filter(n=>/^\d{4}-/.test(n)).sort().at(-1),s10dir=path.join(s10root,s10run),s10sum=readCsv(path.join(s10dir,'summary.csv'));
+  for(const row of s10sum){const cell=`${row.config_id}-${row.scenario_id}`,folder=path.join(s10dir,cell),requests=readCsv(path.join(folder,'requests.csv')),ledger=readCsv(path.join(folder,'ledger.csv')),failed=new Set(requests.filter(x=>x.phase==='failed_seed').map(x=>x.request_id_hash)),successHashes=ledger.filter(x=>x.type==='WITHDRAW'&&x.status==='SUCCESS').map(x=>x.request_id_hash),delayed=successHashes.filter(x=>failed.has(x)).length,replay=requests.filter(x=>x.phase==='replay'),accepted=replay.filter(x=>Number(x.http_status)===200&&x.reason==='ACCEPTED').length,[lo,hi]=wilson(delayed,Number(row.attempts));check(`I2.${cell}.distinct_failed_ids`,Number(row.distinct_request_ids),failed.size,path.relative(ROOT,path.join(folder,'requests.csv')));check(`I2.${cell}.distinct_failed_nonces`,Number(row.distinct_nonces),new Set(requests.filter(x=>x.phase==='failed_seed').map(x=>x.nonce_hash)).size,path.relative(ROOT,path.join(folder,'requests.csv')));check(`I2.${cell}.delayed_ledger_debits`,Number(row.delayed_execution_count),delayed,path.relative(ROOT,path.join(folder,'ledger.csv')));check(`I2.${cell}.http_accepted`,Number(row.http_accepted_count),accepted,path.relative(ROOT,path.join(folder,'requests.csv')));check(`I2.${cell}.wilson_low`,Number(row.wilson95_low),lo,path.relative(ROOT,path.join(folder,'requests.csv')));check(`I2.${cell}.wilson_high`,Number(row.wilson95_high),hi,path.relative(ROOT,path.join(folder,'requests.csv')));}
+  // Resubmission cells use the SQLite debit ledger retained by the runner.
+  const retryRoot=path.join(ROOT,'experiments/results/round-i/s10-independent/resubmission'),retrySummary=readCsv(path.join(retryRoot,'summary.csv'));
+  for(const row of retrySummary){const dbPath=path.join(retryRoot,`${row.policy}-${row.variant}`,'run.sqlite'),ledger=await dbAll(dbPath,"SELECT COUNT(*) AS n,COALESCE(SUM(amount),0) AS amount FROM transactions WHERE type='WITHDRAW' AND status='SUCCESS'"),[lo,hi]=wilson(Number(ledger[0].n),30);check(`I2.resubmit.${row.policy}.${row.variant}.ledger_success`,Number(row.sqlite_success_debits),Number(ledger[0].n),dbPath);check(`I2.resubmit.${row.policy}.${row.variant}.wilson_low`,Number(row.wilson95_low),lo,path.join(retryRoot,'summary.csv'));check(`I2.resubmit.${row.policy}.${row.variant}.wilson_high`,Number(row.wilson95_high),hi,path.join(retryRoot,'summary.csv'));}
+  // Route binding and atomic-debit checks, including the SQLite rows.
+  const routeFile=path.join(ROOT,'experiments/results/round-i/route-binding/requests.csv');for(const row of readCsv(routeFile)){check(`I3.route.${row.hmac_enabled}.${row.case}.reason`,'INVALID_REQUEST',row.reason,path.relative(ROOT,routeFile));check(`I3.route.${row.hmac_enabled}.${row.case}.ledger_rows`,0,Number(row.ledger_rows_for_request),path.relative(ROOT,routeFile));}
+  const atomicRoot=path.join(ROOT,'experiments/results/round-i/atomic-debit'),atomic=readCsv(path.join(atomicRoot,'runs.csv'));for(const row of atomic){const dbPath=path.join(atomicRoot,row.run,'run.sqlite'),ledger=await dbAll(dbPath,"SELECT id,request_id,amount,status FROM transactions WHERE type='WITHDRAW' ORDER BY id"),success=ledger.filter(x=>x.status==='SUCCESS'),sum=success.reduce((a,x)=>a+Number(x.amount),0);let bal=100,min=100;for(const x of ledger)if(x.status==='SUCCESS'){bal-=Number(x.amount);min=Math.min(min,bal);}const account=await dbAll(dbPath,"SELECT balance FROM accounts WHERE user_id='anis_101'");check(`I3.atomic.${row.run}.success_sum`,Number(row.success_debit_sum),sum,dbPath);check(`I3.atomic.${row.run}.final_balance`,Number(row.final_balance),Number(account[0].balance),dbPath);check(`I3.atomic.${row.run}.minimum_balance`,Number(row.minimum_balance_from_ledger),min,dbPath);check(`I3.atomic.${row.run}.nonnegative`,true,min>=0,dbPath);check(`I3.atomic.${row.run}.balance_identity`,100,Number(account[0].balance)+sum,dbPath);}
+  const exact=readCsv(path.join(ROOT,'experiments/results/round-i/e4c-exact/e4c.csv'));for(const row of exact.filter(x=>x.kind==='summary')){const trials=exact.filter(x=>x.case===row.case&&x.kind!=='summary'),lost=trials.filter(x=>x.response_lost==='1').length,match=/loss-p([0-9.]+)-/.exec(row.case),probability=Number(match[1]),planned=Math.round(probability*200);check(`I3.E4c.${row.case}.trials`,200,trials.length,'round-i/e4c-exact/e4c.csv');check(`I3.E4c.${row.case}.exact_count`,planned,Number(row.planned_lost_count),'case probability parsed independently; round(p*200)');check(`I3.E4c.${row.case}.lost_responses`,Number(row.lost_responses),lost,'round-i/e4c-exact/e4c.csv');}
+  const report={generatedAt:new Date().toISOString(),method:'Independent parser, Wilson formula and t interval formula in this file; direct SQLite SELECTs; raw request/ledger CSVs for Round I and prior experiments.',comparedValues:checks.length,mismatches:checks.filter(x=>!x.match).length,checks,notes,files:{e1V2:'experiments/results/e1-v2/summary.csv',e1V3:'experiments/results/e1-v3/round-i-scaled/summary.csv',s10Independent:`experiments/results/e1-v3-s10-independent/${s10run}/summary.csv`,s11V3:'experiments/results/e1-v3-s11/round-i-s11/summary.csv',routeBinding:'experiments/results/round-i/route-binding/requests.csv',atomicDebit:'experiments/results/round-i/atomic-debit/runs.csv',e4cExact:'experiments/results/round-i/e4c-exact/e4c.csv',e3Raw:'experiments/results/e3-v2/requests.csv',e4aRaw:'experiments/results/e4-v2/e4a-requests.csv',e2LayerSummary:'experiments/results/e2-v2/layer-timing-summary.csv'}};
   fs.writeFileSync(path.join(OUT,'audit-report.json'),JSON.stringify(report,null,2)+'\n');const md=['# Independent Results Audit','',`Compared values: ${report.comparedValues}; mismatches: ${report.mismatches}.`,'',`Method: ${report.method}`,'','## Mismatches',...(notes.length?notes.map(n=>`- ${n}`):['- None.']),'','## Check register','', '| Check | Expected | Recomputed | Match | Source |','|---|---:|---:|---|---|',...checks.map(c=>`| ${c.id} | ${c.expected} | ${c.actual} | ${c.match?'yes':'NO'} | ${c.source} |`),''];fs.writeFileSync(path.join(OUT,'audit-report.md'),md.join('\n'));process.stdout.write(`Audit compared ${report.comparedValues} values; mismatches=${report.mismatches}; report=${path.relative(ROOT,path.join(OUT,'audit-report.md'))}\n`);if(report.mismatches)process.exitCode=1;
 }
 main().catch(e=>{process.stderr.write(`${e.stack||e.message}\n`);process.exitCode=1;});
```

### experiments/e1/run-policy-resubmit.js
```diff
diff --git a/experiments/e1/run-policy-resubmit.js b/experiments/e1/run-policy-resubmit.js
index 45a35e6..27a20f5 100644
--- a/experiments/e1/run-policy-resubmit.js
+++ b/experiments/e1/run-policy-resubmit.js
@@ -2,17 +2,19 @@ const fs=require('fs'),path=require('path'),{spawn}=require('child_process'),cry
 const {timedRequest}=require('../lib/http'),{generateSignature}=require('../../server/utils/hmac'),sqlite3=require('../../server/node_modules/sqlite3').verbose();
 require('../../server/node_modules/dotenv').config({path:path.resolve(__dirname,'../../server/.env')});
 const ROOT=path.resolve(__dirname,'../..'),OUT=path.resolve(process.env.POLICY_RETRY_OUTPUT||path.join(ROOT,'experiments/results/s10-policy-resubmit'));
+const PROFILE={past:Number(process.env.POLICY_RETRY_PAST_SECONDS||300),future:Number(process.env.POLICY_RETRY_FUTURE_SECONDS||5),nonceTtl:Number(process.env.POLICY_RETRY_NONCE_TTL_SECONDS||86400),sessionTtl:Number(process.env.POLICY_RETRY_SESSION_TTL_SECONDS||900)};
 function csv(v){v=String(v??'');return /[",\r\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v;}
 function write(file,rows){const h=Object.keys(rows[0]);fs.writeFileSync(file,[h.join(','),...rows.map(r=>h.map(k=>csv(r[k])).join(','))].join('\n')+'\n');}
 function wilson(k,n){const z=1.959963984540054,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,m=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d;return[c-m,c+m];}
 async function server(env,dir){const out=fs.openSync(path.join(dir,'server.stdout.log'),'a'),err=fs.openSync(path.join(dir,'server.stderr.log'),'a'),child=spawn(process.execPath,['server.js'],{cwd:path.join(ROOT,'server'),env,stdio:['ignore',out,err],windowsHide:true});child.once('exit',()=>{try{fs.closeSync(out)}catch{}try{fs.closeSync(err)}catch{}});for(let i=0;i<200;i++){if(child.exitCode!==null)throw Error(`server exited; see ${dir}`);try{if((await timedRequest('http://127.0.0.1:3600/api/health')).status===200)return child}catch{}await new Promise(r=>setTimeout(r,100));}throw Error(`health timeout ${dir}`);}
 async function stop(p){if(!p||p.exitCode!==null)return;p.kill();await Promise.race([new Promise(r=>p.once('exit',r)),new Promise(r=>setTimeout(r,2500))]);if(p.exitCode===null)spawn('taskkill',['/PID',String(p.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}
 function dbRun(db,sql,args=[]){return new Promise((res,rej)=>db.run(sql,args,e=>e?rej(e):res()));}
+function dbAll(db,sql,args=[]){return new Promise((res,rej)=>db.all(sql,args,(e,rows)=>e?rej(e):res(rows)));}
 function payload(s,id,nonce,pathName='/api/withdraw',amount=100){const p={method:'POST',path:pathName,user_id:'anis_101',account_id:'acc_777',amount,currency:'BDT',timestamp:new Date().toISOString(),nonce,request_id:id};p.signature=generateSignature(p,s.sessionKey);return p;}
 async function post(p,s){return timedRequest(`http://127.0.0.1:3600${p.path}`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${s.sessionToken}`},body:JSON.stringify(p)});}
-async function run(policy,variant){const id=`${policy}-${variant}`,dir=path.join(OUT,id);fs.mkdirSync(dir,{recursive:true});const started=new Date(),env={...process.env,PORT:'3600',HOST:'127.0.0.1',VIZ_ENABLED:'false',DEMO_MODE:'false',LEGACY_SHARED_SECRET:'false',ENABLE_DEMO_ROUTES:'false',IDEMPOTENCY_POLICY:policy,NONCE_STORE:'redis',NONCE_TTL:'86400',REDIS_URL:'redis://127.0.0.1:6379',NONCE_KEY_NAMESPACE:`policy-${id}-${process.pid}`,SQLITE_DB:path.join(dir,'run.sqlite'),TIMESTAMP_PAST_WINDOW_SECONDS:'300',TIMESTAMP_FUTURE_WINDOW_SECONDS:'5',DEFENSE_HMAC:'true',DEFENSE_TIMESTAMP:'true',DEFENSE_NONCE:'true',DEFENSE_REQUEST_ID:'true',EXPERIMENT_LOG:path.join(dir,'server-timings.csv')};let child,session,db;const rows=[],reasons={};let successes=0;try{child=await server(env,dir);db=new sqlite3.Database(env.SQLITE_DB);session=(await timedRequest('http://127.0.0.1:3600/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({user_id:'anis_101',pin:process.env.DEMO_PIN||'1234'})})).body;
+async function run(policy,variant){const id=`${policy}-${variant}`,dir=path.join(OUT,id);fs.mkdirSync(dir,{recursive:true});const started=new Date(),env={...process.env,PORT:'3600',HOST:'127.0.0.1',VIZ_ENABLED:'false',DEMO_MODE:'false',LEGACY_SHARED_SECRET:'false',ENABLE_DEMO_ROUTES:'false',IDEMPOTENCY_POLICY:policy,NONCE_STORE:'redis',NONCE_TTL:String(PROFILE.nonceTtl),REDIS_URL:'redis://127.0.0.1:6379',NONCE_KEY_NAMESPACE:`policy-${id}-${process.pid}`,SQLITE_DB:path.join(dir,'run.sqlite'),TIMESTAMP_PAST_WINDOW_SECONDS:String(PROFILE.past),TIMESTAMP_FUTURE_WINDOW_SECONDS:String(PROFILE.future),SESSION_TTL:String(PROFILE.sessionTtl),DEFENSE_HMAC:'true',DEFENSE_TIMESTAMP:'true',DEFENSE_NONCE:'true',DEFENSE_REQUEST_ID:'true',EXPERIMENT_LOG:path.join(dir,'server-timings.csv')};let child,session,db;const rows=[],reasons={};let successes=0;try{child=await server(env,dir);db=new sqlite3.Database(env.SQLITE_DB);session=(await timedRequest('http://127.0.0.1:3600/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({user_id:'anis_101',pin:process.env.DEMO_PIN||'1234'})})).body;
 for(let i=0;i<30;i++){await dbRun(db,"UPDATE accounts SET balance=1 WHERE user_id='anis_101'");const reqId=`${id}-${i}`,bad=payload(session,reqId,`${id}-initial-${i}`),first=await post(bad,session);if(first.body.reason!=='INSUFFICIENT_BALANCE')throw Error(`expected insufficient balance, got ${first.body.reason}`);const dep=payload(session,`${id}-fund-${i}`,`${id}-fund-n-${i}`,'/api/deposit',100),fund=await post(dep,session);if(fund.status!==200)throw Error(`fund failed ${fund.status}/${fund.body.error}`);const retryId=variant==='same_request_id_fresh_nonce'?reqId:`${reqId}-new`,retry=payload(session,retryId,`${id}-retry-${i}`),response=await post(retry,session),reason=response.body.reason||response.body.status||response.body.error||`HTTP_${response.status}`;reasons[reason]=(reasons[reason]||0)+1;if(response.status===200&&response.body.status==='ACCEPTED')successes++;rows.push({trial:i+1,policy,variant,initial_status:first.status,initial_reason:first.body.reason,retry_request_id_relation:variant==='same_request_id_fresh_nonce'?'same':'new',retry_status:response.status,retry_reason:reason,debited:response.status===200&&response.body.status==='ACCEPTED'?1:0,first_start_ns:first.start_ns,first_end_ns:first.end_ns,fund_start_ns:fund.start_ns,fund_end_ns:fund.end_ns,retry_start_ns:response.start_ns,retry_end_ns:response.end_ns});}
 }finally{if(db)await new Promise(r=>db.close(()=>r()));await stop(child);}
-const ci=wilson(successes,30);return {rows,summary:{policy,variant,attempts:30,successes,failures:30-successes,success_rate:successes/30,wilson95_low:ci[0],wilson95_high:ci[1],reason_histogram:JSON.stringify(reasons),started:started.toISOString(),ended:new Date().toISOString()}};}
-async function main(){fs.mkdirSync(OUT,{recursive:true});const started=new Date(),all=[],summary=[];for(const policy of ['success_only','any_outcome'])for(const variant of ['same_request_id_fresh_nonce','new_request_id_fresh_nonce']){const result=await run(policy,variant);all.push(...result.rows);summary.push(result.summary);}write(path.join(OUT,'requests.csv'),all);write(path.join(OUT,'summary.csv'),summary);fs.writeFileSync(path.join(OUT,'run.json'),JSON.stringify({started:started.toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started.getTime())/1000,cellCount:4,trialsPerCell:30,requestIdDefense:true,localhostOnly:true,policySwitch:'IDEMPOTENCY_POLICY',keepAliveHttpAgent:true},null,2)+'\n');}
+const oracleDb=new sqlite3.Database(env.SQLITE_DB);const ledger=await dbAll(oracleDb,"SELECT request_id,type,status,amount FROM transactions WHERE type='WITHDRAW' ORDER BY id");await new Promise(r=>oracleDb.close(()=>r()));const ledgerSuccess=ledger.filter(r=>r.status==='SUCCESS');const ci=wilson(successes,30);return {rows,summary:{policy,variant,attempts:30,successes,failures:30-successes,success_rate:successes/30,wilson95_low:ci[0],wilson95_high:ci[1],ledger_rows:ledger.length,sqlite_success_debits:ledgerSuccess.length,sqlite_success_debit_amount:ledgerSuccess.reduce((a,r)=>a+Number(r.amount),0),reason_histogram:JSON.stringify(reasons),profile:JSON.stringify(PROFILE),started:started.toISOString(),ended:new Date().toISOString()}};}
+async function main(){fs.mkdirSync(OUT,{recursive:true});const started=new Date(),all=[],summary=[];for(const policy of ['success_only','any_outcome'])for(const variant of ['same_request_id_fresh_nonce','new_request_id_fresh_nonce']){const result=await run(policy,variant);all.push(...result.rows);summary.push(result.summary);}write(path.join(OUT,'requests.csv'),all);write(path.join(OUT,'summary.csv'),summary);fs.writeFileSync(path.join(OUT,'run.json'),JSON.stringify({started:started.toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started.getTime())/1000,cellCount:4,trialsPerCell:30,profile:PROFILE,requestIdDefense:true,localhostOnly:true,policySwitch:'IDEMPOTENCY_POLICY',keepAliveHttpAgent:true},null,2)+'\n');}
 main().catch(e=>{process.stderr.write(`${e.stack||e.message}\n`);process.exitCode=1;});
```

### experiments/e1/run.js
```diff
diff --git a/experiments/e1/run.js b/experiments/e1/run.js
index 366dbad..b5cb342 100644
--- a/experiments/e1/run.js
+++ b/experiments/e1/run.js
@@ -13,15 +13,15 @@ const { readAttemptCount } = require('./attempt-count');
 const ROOT = path.resolve(__dirname, '../..');
 const SERVER = path.join(ROOT, 'server');
 const OUTPUT = path.resolve(process.env.E1_OUTPUT_DIR || path.join(ROOT, 'experiments/results/e1-v2'));
-const RUN_TAG = new Date().toISOString().replace(/[:.]/g, '-');
+const RUN_TAG = process.env.E1_RUN_TAG || new Date().toISOString().replace(/[:.]/g, '-');
 const RUN_OUTPUT = path.join(OUTPUT, RUN_TAG);
 const RANDOM_SEED = 'e1-fixed-seed-2026-v1';
 const WIDTH = 30;
 const ATTEMPTS = readAttemptCount();
-const PAST = 6;
-const FUTURE = 2;
-const NONCE_TTL = 4;
-const SESSION_TTL = 15;
+const PAST = Number(process.env.E1_PAST_SECONDS || 6);
+const FUTURE = Number(process.env.E1_FUTURE_SECONDS || 2);
+const NONCE_TTL = Number(process.env.E1_NONCE_TTL_SECONDS || 4);
+const SESSION_TTL = Number(process.env.E1_SESSION_TTL_SECONDS || 15);
 const PIN = process.env.DEMO_PIN || '1234';
 fs.mkdirSync(OUTPUT, { recursive: true });
 
@@ -228,7 +228,7 @@ async function runConfiguration(mask, profile = {}) {
     }
 
     const filter = process.env.E1_SCENARIO_FILTER || '';
-    const selectedScenarios = filter ? [filter] : ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7a', 'S7b', 'S8', 'S9', 'S10_fast', 'S10_late'];
+    const selectedScenarios = filter ? filter.split(',').map((x) => x.trim()).filter(Boolean) : ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7a', 'S7b', 'S8', 'S9', 'S10_fast', 'S10_late'];
     for (const scenario of selectedScenarios) {
       await login();
       if (scenario === 'S1' || scenario === 'S2' || scenario === 'S3' || scenario === 'S4' || scenario === 'S8') {
@@ -344,7 +344,7 @@ async function main() {
   }
   if (!onlyS11 && !policySweep && !skipDefaultConfirmation) {
     process.stdout.write('E1 default-window confirmation: S2/60s and S4/301s\n');
-    allSummaries.push(...await runConfiguration(15, { suffix: '-DEFAULT', past: 300, future: 5, nonceTtl: 86400, sessionTtl: 900, fullScale: true }));
+    allSummaries.push(...await runConfiguration(15, { suffix: '-DEFAULT', past: 300, future: 5, nonceTtl: 300, sessionTtl: 900, fullScale: true }));
   }
   const headers = ['config_id', 'scenario_id', 'variant', 'attempts', 'http_accepted_count', 'debited_count', 'attack_success_rate', 'wilson95_low', 'wilson95_high', 'blocking_reason_histogram', 'oracle_total_debited_delta', 'oracle_duplicate_debit_count_delta', 'oracle_duplicate_debit_amount_delta', 'oracle_unauthorized_debit_amount_delta', 'oracle_delayed_execution_count_delta', 'oracle_delayed_execution_amount_delta', 'oracle_integrity_holds'];
   writeCsv(path.join(RUN_OUTPUT, 'summary.csv'), headers, allSummaries);
@@ -352,7 +352,7 @@ async function main() {
   const scenarios = [...new Set(allSummaries.filter((r) => r.scenario_id !== 'LEGITIMATE_CONTROL').map((r) => r.scenario_id))];
   const latex = ['\\begin{tabular}{llrrrrl}', '\\toprule', 'Configuration & Scenario & Attempts & Accepted & Debits & Success rate & Wilson 95\\% CI \\\\', '\\midrule', ...allSummaries.filter((r) => r.scenario_id !== 'LEGITIMATE_CONTROL').map((r) => `${r.config_id} & ${r.scenario_id} & ${r.attempts} & ${r.http_accepted_count} & ${r.debited_count} & ${(100 * r.attack_success_rate).toFixed(2)}\\% & ${r.wilson95_low.toFixed(4)}--${r.wilson95_high.toFixed(4)} \\\\`), '\\bottomrule', '\\end{tabular}', ''];
   fs.writeFileSync(path.join(RUN_OUTPUT, 'summary.tex'), latex.join('\n'));
-  const runMetadata = { started, ended: new Date().toISOString(), elapsedSeconds: (Date.now() - Date.parse(started)) / 1000, nodeVersion: process.version, host: { platform: os.platform(), release: os.release(), architecture: process.arch, cpuModel: os.cpus()[0]?.model, totalRamBytes: os.totalmem() }, dataRunDirectory: path.relative(OUTPUT, RUN_OUTPUT).replace(/\\/g, '/'), randomSeed: RANDOM_SEED, randomSeedScope: 'deterministic scenario request IDs and nonces; server session credentials use the operating-system CSPRNG', configuredAttempts: ATTEMPTS, selectedConfigMasks: process.env.E1_CONFIG_MASKS || 'all', selectedPolicySweep: policySweep, skippedDefaultConfirmation: skipDefaultConfirmation, scaledProfile: { timestampPastSeconds: PAST, timestampFutureSeconds: FUTURE, nonceTtlSeconds: NONCE_TTL, sessionTtlSeconds: SESSION_TTL }, defaultConfirmationProfile: { timestampPastSeconds: 300, futureToleranceSeconds: 5, nonceTtlSeconds: 86400, sessionTtlSeconds: 900, waits: { S2: 60, S4: 301 } }, keepAliveHttpAgent: true, proxyRedactLogin: true, moneyOracleLedgerSource: 'direct sqlite3 SELECT from the running server database after each scenario', allConfigs: 16, totalSummaryRows: allSummaries.length, scenarios: scenarios.length, allSummaries };
+  const runMetadata = { started, ended: new Date().toISOString(), elapsedSeconds: (Date.now() - Date.parse(started)) / 1000, nodeVersion: process.version, host: { platform: os.platform(), release: os.release(), architecture: process.arch, cpuModel: os.cpus()[0]?.model, totalRamBytes: os.totalmem() }, dataRunDirectory: path.relative(OUTPUT, RUN_OUTPUT).replace(/\\/g, '/'), randomSeed: RANDOM_SEED, randomSeedScope: 'deterministic scenario request IDs and nonces; server session credentials use the operating-system CSPRNG', configuredAttempts: ATTEMPTS, selectedConfigMasks: process.env.E1_CONFIG_MASKS || 'all', selectedPolicySweep: policySweep, skippedDefaultConfirmation: skipDefaultConfirmation, scaledProfile: { timestampPastSeconds: PAST, timestampFutureSeconds: FUTURE, nonceTtlSeconds: NONCE_TTL, sessionTtlSeconds: SESSION_TTL }, defaultConfirmationProfile: { timestampPastSeconds: 300, futureToleranceSeconds: 5, nonceTtlSeconds: 300, sessionTtlSeconds: 900, waits: { S2: 60, S4: 301 } }, keepAliveHttpAgent: true, proxyRedactLogin: true, moneyOracleLedgerSource: 'direct sqlite3 SELECT from the running server database after each scenario', allConfigs: 16, totalSummaryRows: allSummaries.length, scenarios: scenarios.length, allSummaries };
   fs.writeFileSync(path.join(RUN_OUTPUT, 'run.json'), `${JSON.stringify(runMetadata, null, 2)}\n`);
   fs.copyFileSync(path.join(RUN_OUTPUT, 'summary.csv'), path.join(OUTPUT, 'summary.csv'));
   fs.copyFileSync(path.join(RUN_OUTPUT, 'summary.tex'), path.join(OUTPUT, 'summary.tex'));
```

### experiments/e4/run.js
```diff
diff --git a/experiments/e4/run.js b/experiments/e4/run.js
index c83e326..9c29bef 100644
--- a/experiments/e4/run.js
+++ b/experiments/e4/run.js
@@ -3,6 +3,7 @@ const {generateSignature}=require('../../server/utils/hmac');
 const {timedRequest}=require('../lib/http');
 const {computeMoneyIntegrity}=require('../../server/utils/money-oracle');
 const sqlite3=require('../../server/node_modules/sqlite3').verbose();
+const {makeExactLossPattern}=require('../lib/exact-loss-pattern');
 const ROOT=path.resolve(__dirname,'../..'),OUT=path.resolve(process.env.E4_OUTPUT_DIR||path.join(ROOT,'experiments/results/e4-v2'));
 require('../../server/node_modules/dotenv').config({path:path.join(ROOT,'server/.env')});
 const PAST=6,FUTURE=2,TTLS=[4,6,8,10,12],OFFSETS=[0,1,2],DELAYS=[1,3,5,6,7,8,9,10,11],WIDTH=30;
@@ -10,7 +11,7 @@ let state=0xE4202610;function rand(){state=(1664525*state+1013904223)>>>0;return
 function q(v){v=v==null?'':String(v);return /[",\r\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v;}
 function write(file,rows){if(!rows.length)return;const h=[...new Set(rows.flatMap(r=>Object.keys(r)))];fs.writeFileSync(file,[h.join(','),...rows.map(r=>h.map(k=>q(r[k])).join(','))].join('\n')+'\n');}
 function wilson(k,n){const z=1.959963984540054,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,m=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d;return[c-m,c+m];}
-function lossPattern(p){let x=(0xE4C2026+(Math.round(p*1000)*2654435761))>>>0;const out=[];for(let i=0;i<200;i++){x=(1664525*x+1013904223)>>>0;out.push(x/4294967296<p);}return out;}
+function lossPattern(p){const seed=(0xE4C2026+Math.imul(Math.round(p*1000),2654435761))>>>0;return makeExactLossPattern(p,200,seed);}
 const LOSS_PATTERNS=new Map([0,0.05,0.2].map(p=>[p,lossPattern(p)]));
 function startServer(env,dir){const out=fs.openSync(path.join(dir,'server.stdout.log'),'a'),err=fs.openSync(path.join(dir,'server.stderr.log'),'a');const child=spawn(process.execPath,['server.js'],{cwd:path.join(ROOT,'server'),env,stdio:['ignore',out,err],windowsHide:true});child.once('exit',()=>{try{fs.closeSync(out);}catch{}try{fs.closeSync(err);}catch{}});return child;}
 async function stop(s){if(!s||s.exitCode!==null)return;s.kill();await Promise.race([new Promise(r=>s.once('exit',r)),new Promise(r=>setTimeout(r,2500))]);if(s.exitCode===null)spawn('taskkill',['/PID',String(s.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}
@@ -64,10 +65,10 @@ async function runE4a(rows) {
 }
 function summarizeE4a(rows){const out=[];const keys=new Map();for(const r of rows){const k=[r.configuration,r.nonce_ttl_seconds,r.client_future_offset_seconds,r.replay_delay_seconds].join('|');if(!keys.has(k))keys.set(k,[]);keys.get(k).push(r);}for(const [key,list] of keys){const [configuration,ttl,f,delay]=key.split('|');const h={};for(const r of list)h[r.replay_reason]=(h[r.replay_reason]||0)+1;out.push({configuration,nonce_ttl_seconds:ttl,client_future_offset_seconds:f,replay_delay_seconds:delay,trials:list.length,accepted:list.filter(r=>r.replay_accepted).length,blocked:list.filter(r=>!r.replay_accepted).length,blocking_layer_histogram:JSON.stringify(h)});}return out;}
 async function runE4b(rows){let c=0;for(const mode of ['fail-open','fail-closed'])for(const reqId of [false,true]){c++;const id=`fault-${mode}-requestid-${reqId?1:0}`,dir=path.join(OUT,'E4b',id);fs.mkdirSync(dir,{recursive:true});const port=3500,child=startServer(envFor(id,port,dir,{NONCE_STORE_FAIL_MODE:mode,DEFENSE_REQUEST_ID:String(reqId)}),dir);try{await ready(port,child);const s=await login(port);await timedRequest(`http://127.0.0.1:${port}/__test/fault/nonce-store`,{method:'POST',headers:{'content-type':'application/json'},body:'{"enabled":true}'});let ok=0,replays=0;for(let i=0;i<30;i++){const p=payload(s,`${id}-${i}`),r=await post(port,s,p);if(r.status===200)ok++;rows.push({case:id,attempt:i+1,phase:'legitimate',status:r.status,reason:r.body.reason||r.body.error||r.body.status,start_ns:r.start_ns,end_ns:r.end_ns,duration_ns:r.duration_ns});const rr=await post(port,s,p);if(rr.status===200&&rr.body.status==='ACCEPTED')replays++;rows.push({case:id,attempt:i+1,phase:'replay',status:rr.status,reason:rr.body.reason||rr.body.error||rr.body.status,start_ns:rr.start_ns,end_ns:rr.end_ns,duration_ns:rr.duration_ns});}const ci=wilson(replays,30);rows.push({case:id,attempt:'summary',legitimate_accepted:ok,legitimate_total:30,replay_accepted:replays,replay_total:30,replay_wilson95_low:ci[0],replay_wilson95_high:ci[1],nonce_fail_mode:mode,request_id_defense:reqId?1:0});}finally{await stop(child);}}}
-async function runE4c(rows){let c=0;for(const probability of [0,0.05,0.2])for(const order of ['default','request_id_before_nonce'])for(const retryMode of ['same-signed','fresh-nonce-same-request-id']){c++;const id=`loss-p${probability}-${order}-${retryMode}`,dir=path.join(OUT,'E4c',id);fs.mkdirSync(dir,{recursive:true});const port=3500,child=startServer(envFor(id,port,dir,{CHECK_ORDER:order,DEFENSE_REQUEST_ID:'true'}),dir);try{await ready(port,child);const s=await login(port);let lostThenFailure=0,inferSuccess=0,notInferSuccess=0,lostResponses=0;const reasons={},intents=[];const pattern=LOSS_PATTERNS.get(probability);for(let i=0;i<200;i++){const p=payload(s,`${id}-${i}`),first=await post(port,s,p);intents.push({request_id:p.request_id,amount:p.amount,type:'WITHDRAW'});let clientFailure=false,retryReason='not_retried',retryResponse=null;const responseLost=pattern[i];if(responseLost){lostResponses++;const retry=retryMode==='same-signed'?p:{...p,nonce:`${p.nonce}-fresh`};if(retry!==p)retry.signature=generateSignature(retry,s.sessionKey);retryResponse=await post(port,s,retry);retryReason=retryResponse.body.reason||retryResponse.body.error||retryResponse.body.status;reasons[retryReason]=(reasons[retryReason]||0)+1;clientFailure=retryResponse.status!==200;if(first.status===200&&first.body.status==='ACCEPTED'&&clientFailure)lostThenFailure++;if(clientFailure){if(retryReason==='ALREADY_PROCESSED')inferSuccess++;else notInferSuccess++;}}rows.push({case:id,trial:i+1,loss_probability:probability,response_lost:responseLost?1:0,retry_order:order,retry_mode:retryMode,first_status:first.status,retry_reason:retryReason,client_saw_failure:clientFailure?1:0,reason_confirms_success:clientFailure&&retryReason==='ALREADY_PROCESSED'?1:0,first_start_ns:first.start_ns,first_end_ns:first.end_ns,first_duration_ns:first.duration_ns,retry_start_ns:retryResponse?.start_ns||'',retry_end_ns:retryResponse?.end_ns||'',retry_duration_ns:retryResponse?.duration_ns||''});}const count=await ledger(path.join(dir,'run.sqlite'));const oracle=computeMoneyIntegrity(count,intents);const debitRows=count.filter(x=>x.status==='SUCCESS'&&x.type==='WITHDRAW'),byId=new Map();for(const x of debitRows)byId.set(x.request_id,(byId.get(x.request_id)||0)+1);const exactlyOne=[...byId.values()].filter(n=>n===1).length;rows.push({case:id,kind:'summary',trials:200,loss_pattern_seed:'E4C-2026-fixed-by-probability',lost_responses:lostResponses,debits:debitRows.length,exactly_one_debit_request_ids:exactlyOne,client_failure_after_debit:lostThenFailure,client_failure_reasons:JSON.stringify(reasons),reason_confirms_success_count:inferSuccess,reason_does_not_confirm_success_count:notInferSuccess,oracle:JSON.stringify(oracle)});}finally{await stop(child);}}
+async function runE4c(rows){let c=0;for(const probability of [0,0.05,0.2])for(const order of ['default','request_id_before_nonce'])for(const retryMode of ['same-signed','fresh-nonce-same-request-id']){c++;const id=`loss-p${probability}-${order}-${retryMode}`,dir=path.join(OUT,'E4c',id);fs.mkdirSync(dir,{recursive:true});const port=3500,child=startServer(envFor(id,port,dir,{CHECK_ORDER:order,DEFENSE_REQUEST_ID:'true'}),dir);try{await ready(port,child);const s=await login(port);let lostThenFailure=0,inferSuccess=0,notInferSuccess=0,lostResponses=0;const reasons={},intents=[];const lossSpec=LOSS_PATTERNS.get(probability),pattern=lossSpec.pattern;for(let i=0;i<200;i++){const p=payload(s,`${id}-${i}`),first=await post(port,s,p);intents.push({request_id:p.request_id,amount:p.amount,type:'WITHDRAW'});let clientFailure=false,retryReason='not_retried',retryResponse=null;const responseLost=pattern[i];if(responseLost){lostResponses++;const retry=retryMode==='same-signed'?p:{...p,nonce:`${p.nonce}-fresh`};if(retry!==p)retry.signature=generateSignature(retry,s.sessionKey);retryResponse=await post(port,s,retry);retryReason=retryResponse.body.reason||retryResponse.body.error||retryResponse.body.status;reasons[retryReason]=(reasons[retryReason]||0)+1;clientFailure=retryResponse.status!==200;if(first.status===200&&first.body.status==='ACCEPTED'&&clientFailure)lostThenFailure++;if(clientFailure){if(retryReason==='ALREADY_PROCESSED')inferSuccess++;else notInferSuccess++;}}rows.push({case:id,trial:i+1,loss_probability:probability,response_lost:responseLost?1:0,retry_order:order,retry_mode:retryMode,first_status:first.status,retry_reason:retryReason,client_saw_failure:clientFailure?1:0,reason_confirms_success:clientFailure&&retryReason==='ALREADY_PROCESSED'?1:0,first_start_ns:first.start_ns,first_end_ns:first.end_ns,first_duration_ns:first.duration_ns,retry_start_ns:retryResponse?.start_ns||'',retry_end_ns:retryResponse?.end_ns||'',retry_duration_ns:retryResponse?.duration_ns||''});}const count=await ledger(path.join(dir,'run.sqlite'));const oracle=computeMoneyIntegrity(count,intents);const debitRows=count.filter(x=>x.status==='SUCCESS'&&x.type==='WITHDRAW'),byId=new Map();for(const x of debitRows)byId.set(x.request_id,(byId.get(x.request_id)||0)+1);const exactlyOne=[...byId.values()].filter(n=>n===1).length;rows.push({case:id,kind:'summary',trials:200,loss_pattern_seed:lossSpec.seed,planned_lost_count:lossSpec.lostCount,loss_pattern_algorithm:lossSpec.algorithm,lost_responses:lostResponses,debits:debitRows.length,exactly_one_debit_request_ids:exactlyOne,client_failure_after_debit:lostThenFailure,client_failure_reasons:JSON.stringify(reasons),reason_confirms_success_count:inferSuccess,reason_does_not_confirm_success_count:notInferSuccess,oracle:JSON.stringify(oracle)});}finally{await stop(child);}}
   // Failed insufficient-balance request followed by same-nonce and fresh-nonce retry.
   for(const retryMode of ['same-nonce','fresh-nonce']){const id=`insufficient-${retryMode}`,dir=path.join(OUT,'E4c',id);fs.mkdirSync(dir,{recursive:true});const port=3500,child=startServer(envFor(id,port,dir),dir);try{await ready(port,child);const s=await login(port);await new Promise((resolve,reject)=>{const db=new sqlite3.Database(path.join(dir,'run.sqlite'));db.run("UPDATE accounts SET balance=1 WHERE user_id='anis_101'",e=>db.close(()=>e?reject(e):resolve()));});const p=payload(s,id,0,100),failed=await post(port,s,p);const dep={...p,path:'/api/deposit',amount:500,nonce:`${p.nonce}-fund`,request_id:`${p.request_id}-fund`,timestamp:new Date().toISOString()};dep.signature=generateSignature(dep,s.sessionKey);const funded=await timedRequest(`http://127.0.0.1:${port}/api/deposit`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${s.sessionToken}`},body:JSON.stringify(dep)});if(funded.status!==200)throw Error(`legitimate funding failed ${funded.status}`);const retry=retryMode==='same-nonce'?p:{...p,nonce:`${p.nonce}-fresh`};if(retry!==p)retry.signature=generateSignature(retry,s.sessionKey);const result=await post(port,s,retry);rows.push({case:id,kind:'insufficient-retry',initial_reason:failed.body.reason,retry_mode:retryMode,retry_status:result.status,retry_reason:result.body.reason||result.body.error||result.body.status,initial_start_ns:failed.start_ns,initial_end_ns:failed.end_ns,initial_duration_ns:failed.duration_ns,fund_start_ns:funded.start_ns,fund_end_ns:funded.end_ns,fund_duration_ns:funded.duration_ns,retry_start_ns:result.start_ns,retry_end_ns:result.end_ns,retry_duration_ns:result.duration_ns});}finally{await stop(child);}}
 }
 function writeExtrapolation(){const corr=path.join(ROOT,'experiments/results/corrections'),a=JSON.parse(fs.readFileSync(path.join(corr,'nonce-memory-accepted-prep-accepted-clean-20261018-summary.json'))),r=JSON.parse(fs.readFileSync(path.join(corr,'nonce-memory-requestid-prep-requestid-20261018-summary.json')));if(!fs.existsSync(path.join(corr,a.rawInfoLog))||!fs.existsSync(path.join(corr,r.rawInfoLog)))throw Error('canonical preserved INFO evidence is missing');const accepted=a.baselineSubtractedSlopeBytesPerKey,rejected=r.baselineSubtractedSlopeBytesPerKey,slope=(accepted+rejected)/2,rps=[10,100,1000],ttls=[30,300,3600],out=[];for(const rate of rps)for(const ttl of ttls){const keys=rate*ttl;out.push({requests_per_second:rate,ttl_seconds:ttl,derived_keys:keys,measured_accepted_bytes_per_key:accepted,measured_requestid_rejected_bytes_per_key:rejected,derived_mean_bytes_per_key:slope,derived_memory_bytes:keys*slope,derived_memory_mib:keys*slope/1024/1024,scope:'linear extrapolation, not a measurement',formula:'bytes/key=(accepted slope+request-ID-rejected slope)/2; keys=rate*TTL; memory=keys*bytes/key',accepted_raw_info:a.rawInfoLog,rejected_raw_info:r.rawInfoLog});}return out;}
-async function main(){fs.mkdirSync(OUT,{recursive:true});const started=Date.now();if(process.env.E4B_ONLY==='true'){const b=[];await runE4b(b);write(path.join(OUT,'e4b.csv'),b);fs.writeFileSync(path.join(OUT,'run-e4b-corrected.json'),JSON.stringify({started:new Date(started).toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,e4bCells:4,trialsPerCase:30,nonceStore:'Memurai Developer via redis',localhostOnly:true,keepAliveHttpAgent:true},null,2)+'\n');process.stdout.write(`Corrected E4b complete: ${OUT}\n`);return;}if(process.env.E4C_ONLY==='true'){const c=[];await runE4c(c);write(path.join(OUT,'e4c.csv'),c);fs.writeFileSync(path.join(OUT,'run-e4c-corrected.json'),JSON.stringify({started:new Date(started).toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,e4cResponseLossCells:12,transactionsPerCell:200,commonRandomNumbers:true,lossPatternSeed:'E4C-2026-fixed-by-probability',requestIdDefense:true,orders:['default','request_id_before_nonce'],supersedes:'experiments/results/e4-v2/e4c.csv and experiments/results/e4-v2-corrected/e4c.csv due to 100 trials and non-common loss patterns',localhostOnly:true,keepAliveHttpAgent:true},null,2)+'\n');process.stdout.write(`Corrected E4c complete: ${OUT}\n`);return;}const a=[];await runE4a(a);write(path.join(OUT,'e4a-requests.csv'),a);const sa=summarizeE4a(a);write(path.join(OUT,'e4a-summary.csv'),sa);const b=[];await runE4b(b);write(path.join(OUT,'e4b.csv'),b);const c=[];await runE4c(c);write(path.join(OUT,'e4c.csv'),c);const d=writeExtrapolation();write(path.join(OUT,'e4d-derived.csv'),d);fs.writeFileSync(path.join(OUT,'run.json'),JSON.stringify({started:new Date(started).toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,profile:{pastSeconds:PAST,futureSeconds:FUTURE,ttlSeconds:TTLS,offsetSeconds:OFFSETS,delaysSeconds:DELAYS,trialsPerE4aCell:WIDTH},e4aCells:sa.length,e4bCells:4,e4cResponseLossCells:12,e4dDerivedRows:d.length,nonceStore:'Memurai Developer via redis',localhostOnly:true,keepAliveHttpAgent:true},null,2)+'\n');process.stdout.write(`E4 complete: ${OUT}\n`);}
+async function main(){fs.mkdirSync(OUT,{recursive:true});const started=Date.now();if(process.env.E4B_ONLY==='true'){const b=[];await runE4b(b);write(path.join(OUT,'e4b.csv'),b);fs.writeFileSync(path.join(OUT,'run-e4b-corrected.json'),JSON.stringify({started:new Date(started).toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,e4bCells:4,trialsPerCase:30,nonceStore:'Memurai Developer via redis',localhostOnly:true,keepAliveHttpAgent:true},null,2)+'\n');process.stdout.write(`Corrected E4b complete: ${OUT}\n`);return;}if(process.env.E4C_ONLY==='true'){const c=[];await runE4c(c);write(path.join(OUT,'e4c.csv'),c);fs.writeFileSync(path.join(OUT,'run-e4c-corrected.json'),JSON.stringify({started:new Date(started).toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,e4cResponseLossCells:12,transactionsPerCell:200,commonRandomNumbers:true,lossPatternAlgorithm:'seeded Fisher-Yates exact-count',lossPatternSeeds:Object.fromEntries([...LOSS_PATTERNS].map(([p,v])=>[p,v.seed])),lossCounts:Object.fromEntries([...LOSS_PATTERNS].map(([p,v])=>[p,v.lostCount])),requestIdDefense:true,orders:['default','request_id_before_nonce'],supersedes:'experiments/results/e4-v2/e4c.csv and experiments/results/e4-v2-corrected/e4c.csv due to 100 trials and non-common loss patterns',localhostOnly:true,keepAliveHttpAgent:true},null,2)+'\n');process.stdout.write(`Corrected E4c complete: ${OUT}\n`);return;}const a=[];await runE4a(a);write(path.join(OUT,'e4a-requests.csv'),a);const sa=summarizeE4a(a);write(path.join(OUT,'e4a-summary.csv'),sa);const b=[];await runE4b(b);write(path.join(OUT,'e4b.csv'),b);const c=[];await runE4c(c);write(path.join(OUT,'e4c.csv'),c);const d=writeExtrapolation();write(path.join(OUT,'e4d-derived.csv'),d);fs.writeFileSync(path.join(OUT,'run.json'),JSON.stringify({started:new Date(started).toISOString(),ended:new Date().toISOString(),elapsedSeconds:(Date.now()-started)/1000,profile:{pastSeconds:PAST,futureSeconds:FUTURE,ttlSeconds:TTLS,offsetSeconds:OFFSETS,delaysSeconds:DELAYS,trialsPerE4aCell:WIDTH},e4aCells:sa.length,e4bCells:4,e4cResponseLossCells:12,e4dDerivedRows:d.length,nonceStore:'Memurai Developer via redis',localhostOnly:true,keepAliveHttpAgent:true},null,2)+'\n');process.stdout.write(`E4 complete: ${OUT}\n`);}
 main().catch(e=>{process.stderr.write(`${e.stack||e.message}\n`);process.exitCode=1;});
```

### paper/CROSSCHECK.txt
```diff
diff --git a/paper/CROSSCHECK.txt b/paper/CROSSCHECK.txt
index c6f24a2..45cadb8 100644
--- a/paper/CROSSCHECK.txt
+++ b/paper/CROSSCHECK.txt
@@ -1,28 +1,9 @@
-Independent paper asset cross-check
+# Independent Paper Cross-check
 
-Values compared: 600
+Values compared: 672
 Mismatches: 0
-30-attempt vs 100-attempt rate disagreements: 16
+Source: E1 v3 summary.csv, S10-independent summary.csv (success_only), and E1 v3 S11 summary.csv.
+Method: this standalone script parses summary CSVs and LaTeX tables directly and extracts the 7-point cell labels from both F2 PDFs; it does not import generate_paper_assets.py.
 
-Method: standalone CSV parser and formulas; parses the embedded 7-point cell labels from both F2 PDFs, compares T5 and T2/T2-full printed cells against E1 v2 and Round F summary CSVs, and lists overlapping 30-vs-100 rate disagreements.
-
-Mismatches:
+## Mismatches
 None.
-
-Cells whose success rates differ between the 30-attempt E1 v2 and 100-attempt Round F runs:
-{"100_attempt": "5/100", "30_attempt": "5/30", "config": "H0T0N0R0", "scenario": "S10 fast"}
-{"100_attempt": "5/100", "30_attempt": "5/30", "config": "H0T0N0R0", "scenario": "S10 late"}
-{"100_attempt": "1/100", "30_attempt": "1/30", "config": "H0T0N0R1", "scenario": "S10 fast"}
-{"100_attempt": "1/100", "30_attempt": "1/30", "config": "H0T0N0R1", "scenario": "S10 late"}
-{"100_attempt": "1/100", "30_attempt": "1/30", "config": "H0T0N1R0", "scenario": "S10 late"}
-{"100_attempt": "1/100", "30_attempt": "1/30", "config": "H0T0N1R1", "scenario": "S10 late"}
-{"100_attempt": "5/100", "30_attempt": "5/30", "config": "H0T1N0R0", "scenario": "S10 fast"}
-{"100_attempt": "1/100", "30_attempt": "1/30", "config": "H0T1N0R1", "scenario": "S10 fast"}
-{"100_attempt": "5/100", "30_attempt": "5/30", "config": "H1T0N0R0", "scenario": "S10 fast"}
-{"100_attempt": "5/100", "30_attempt": "5/30", "config": "H1T0N0R0", "scenario": "S10 late"}
-{"100_attempt": "1/100", "30_attempt": "1/30", "config": "H1T0N0R1", "scenario": "S10 fast"}
-{"100_attempt": "1/100", "30_attempt": "1/30", "config": "H1T0N0R1", "scenario": "S10 late"}
-{"100_attempt": "1/100", "30_attempt": "1/30", "config": "H1T0N1R0", "scenario": "S10 late"}
-{"100_attempt": "1/100", "30_attempt": "1/30", "config": "H1T0N1R1", "scenario": "S10 late"}
-{"100_attempt": "5/100", "30_attempt": "5/30", "config": "H1T1N0R0", "scenario": "S10 fast"}
-{"100_attempt": "1/100", "30_attempt": "1/30", "config": "H1T1N0R1", "scenario": "S10 fast"}
```

### paper/INVENTORY.md
```diff
diff --git a/paper/INVENTORY.md b/paper/INVENTORY.md
index e67e907..15ceccb 100644
--- a/paper/INVENTORY.md
+++ b/paper/INVENTORY.md
@@ -22,6 +22,10 @@ Paths below enumerate existing generated assets. Source hashes refer to their un
 | LaTeX table | `experiments/results/e1-v2-s11/summary.tex` | e1-v2-s11/summary.csv | <REDACTED> |
 | LaTeX table | `experiments/results/e1-v2-s11-superseded-invalid-token/2026-10-18T18-25-39-610Z/summary.tex` | e1-v2-s11-superseded-invalid-token/summary.csv | <REDACTED> |
 | LaTeX table | `experiments/results/e1-v2-s11-superseded-invalid-token/summary.tex` | e1-v2-s11-superseded-invalid-token/summary.csv | <REDACTED> |
+| LaTeX table | `experiments/results/e1-v3/round-i-scaled/summary.tex` | source CSV not identified from neighboring artifacts | n/a |
+| LaTeX table | `experiments/results/e1-v3/summary.tex` | source CSV not identified from neighboring artifacts | n/a |
+| LaTeX table | `experiments/results/e1-v3-s11/round-i-s11/summary.tex` | source CSV not identified from neighboring artifacts | n/a |
+| LaTeX table | `experiments/results/e1-v3-s11/summary.tex` | source CSV not identified from neighboring artifacts | n/a |
 | Figure | `experiments/results/e2/latency-by-stack.pdf` | e2/load-repeat-summary.csv | <REDACTED> |
 | Figure | `experiments/results/e2/latency-by-stack.png` | e2/load-repeat-summary.csv | <REDACTED> |
 | Figure | `experiments/results/e2/latency-by-stack.svg` | e2/load-repeat-summary.csv | <REDACTED> |
```

### paper/MANIFEST.md
```diff
diff --git a/paper/MANIFEST.md b/paper/MANIFEST.md
index bf2dc3a..5a6e7dc 100644
--- a/paper/MANIFEST.md
+++ b/paper/MANIFEST.md
@@ -4,15 +4,15 @@ All PDF figures are vector exports; PNG previews use 150 dpi. The generator reco
 
 | Asset | Output files | Source CSV(s) and SHA-256 | Regeneration | Caption draft |
 |---|---|---|---|---|
-| Figure | `paper/figures/F2-e1-coverage-single.pdf`; `paper/previews/F2-e1-coverage-single.png` | experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N1R1/requests.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | F2: H/T/N/R denote HMAC/timestamp/nonce/request-ID defenses; attacker A observes traffic without the session key (S1 through S8), attacker C has the leaked session key (S9), and B holds a bearer token only (S11). Each scenario header gives n; cells print successful attacks k, with grayscale/hatching encoding k/n; S8=0/30, S9=30/30. Scaled-time S1 through S9; Round F default-window S10/S11; success_only. |
-| Figure | `paper/figures/F2-e1-coverage-double.pdf`; `paper/previews/F2-e1-coverage-double.png` | experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N1R1/requests.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | F2: H/T/N/R denote HMAC/timestamp/nonce/request-ID defenses; attacker A observes traffic without the session key (S1 through S8), attacker C has the leaked session key (S9), and B holds a bearer token only (S11). Each scenario header gives n; cells print successful attacks k, with grayscale/hatching encoding k/n; S8=0/30, S9=30/30. Scaled-time S1 through S9; Round F default-window S10/S11; success_only. |
+| Figure | `paper/figures/F2-e1-coverage-single.pdf`; `paper/previews/F2-e1-coverage-single.png` | experiments/results/e1-v3/round-i-scaled/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/summary.csv (SHA-256 <REDACTED>); experiments/results/e1-v3-s10-independent/2026-10-22T04-40-36-408Z/summary.csv (SHA-256 <REDACTED>); experiments/results/e1-v3-s11/round-i-s11/summary.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | F2: H/T/N/R denote HMAC/timestamp/nonce/request-ID defenses; attacker A observes traffic without the session key (S1 through S8 and S10), attacker C has the leaked key (S9), and B holds a bearer token only (S11). Each column header gives n; cells print successful attacks k, with grayscale/hatching encoding k/n. S5 uses n=1,500 (50 parallel x 30 batches); S8=0/30, S9=30/30. S1-S9 use E1 v3 scaled time (PAST=6 s, FUTURE=2 s, NONCE_TTL=8 s); S10 uses independent trials at 1 s/9 s; S11 uses 100 attempts; success_only. |
+| Figure | `paper/figures/F2-e1-coverage-double.pdf`; `paper/previews/F2-e1-coverage-double.png` | experiments/results/e1-v3/round-i-scaled/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/summary.csv (SHA-256 <REDACTED>); experiments/results/e1-v3-s10-independent/2026-10-22T04-40-36-408Z/summary.csv (SHA-256 <REDACTED>); experiments/results/e1-v3-s11/round-i-s11/summary.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | F2: H/T/N/R denote HMAC/timestamp/nonce/request-ID defenses; attacker A observes traffic without the session key (S1 through S8 and S10), attacker C has the leaked key (S9), and B holds a bearer token only (S11). Each column header gives n; cells print successful attacks k, with grayscale/hatching encoding k/n. S5 uses n=1,500 (50 parallel x 30 batches); S8=0/30, S9=30/30. S1-S9 use E1 v3 scaled time (PAST=6 s, FUTURE=2 s, NONCE_TTL=8 s); S10 uses independent trials at 1 s/9 s; S11 uses 100 attempts; success_only. |
 | Figure | `paper/figures/F3a-scaled-TTL-grid.pdf`; `paper/previews/F3a-scaled-TTL-grid.png` | experiments/results/e4-v2/e4a-requests.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | n=30 per cell; attacker A (network observer, no session key) replays recorded requests; H/T/N/R mean HMAC/timestamp/nonce/request-ID; scaled-time PAST=6 s/FUTURE=2 s, success_only, H1T1N1R0. |
 | Figure | `paper/figures/F3b-default-TTL-gap.pdf`; `paper/previews/F3b-default-TTL-gap.png` | experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e4a-fullscale/2026-10-20T08-31-04-480Z/H1T1N1R1/requests.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | n=30 per delay/configuration; attacker A (network observer, no session key) replays captured requests; H/T/N/R mean HMAC/timestamp/nonce/request-ID; default PAST=300 s/FUTURE=5 s/NONCE_TTL=300 s, success_only; H1T1N1R0 and H1T1N1R1. |
 | Figure | `paper/figures/F4-E3-false-rejection-future.pdf`; `paper/previews/F4-E3-false-rejection-future.png` | experiments/results/e3-v2/requests.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | n=2000 per profile/PAST/FUTURE cell; attacker not applicable (legitimate traffic under assumed P1 through P3 clock/delay profiles); H/T/N/R mean HMAC/timestamp/nonce/request-ID, with all four enabled; success_only. |
 | Figure | `paper/figures/F5-E2-layer-cost.pdf`; `paper/previews/F5-E2-layer-cost.png` | experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r1-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r10-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r2-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r3-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r4-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r5-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r6-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r7-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r8-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r9-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r1-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r10-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r2-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r3-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r4-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r5-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r6-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r7-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r8-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r9-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r1-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r10-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r2-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r3-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r4-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r5-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r6-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r7-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r8-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r9-c1/layer-timings.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | 10 repeats/backend, each 3000 measured requests after 500 warm-ups; attacker not applicable (legitimate traffic); H/T/N/R mean HMAC/timestamp/nonce/request-ID; localhost E2, all four on, success_only. |
-| Table | `paper/tables/T1-scenarios.tex` | experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N1R1/requests.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | Scenario counts and outcomes are recomputed from raw rows; attacker A lacks the session key, B has bearer token only, and C has leaked key; H/T/N/R denote HMAC/timestamp/nonce/request-ID; scaled-time except Round F default-window S10/S11; success_only except policy rows. |
-| Table | `paper/tables/T2.tex` | experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/s10-policy-resubmit/requests.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | Scenario counts and outcomes are recomputed from raw rows; attacker A lacks the session key, B has bearer token only, and C has leaked key; H/T/N/R denote HMAC/timestamp/nonce/request-ID; scaled-time except Round F default-window S10/S11; success_only except policy rows. |
-| Table | `paper/tables/T2-full.tex` | experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N0R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N1R1-any_outcome/requests.csv (SHA-256 <REDACTED>); experiments/results/s10-policy-resubmit/requests.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | Scenario counts and outcomes are recomputed from raw rows; attacker A lacks the session key, B has bearer token only, and C has leaked key; H/T/N/R denote HMAC/timestamp/nonce/request-ID; scaled-time except Round F default-window S10/S11; success_only except policy rows. |
+| Table | `paper/tables/T1-scenarios.tex` | experiments/results/e1-v3/round-i-scaled/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/summary.csv (SHA-256 <REDACTED>); experiments/results/e1-v3-s10-independent/2026-10-22T04-40-36-408Z/summary.csv (SHA-256 <REDACTED>); experiments/results/e1-v3-s11/round-i-s11/summary.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | Attacker A observes traffic without the session key, B has bearer token only, and C has leaked key; H/T/N/R denote HMAC/timestamp/nonce/request-ID. E1 v3 uses PAST=6 s/FUTURE=2 s/NONCE_TTL=8 s; S10 is independent 30-trial data; S11 has 100 attempts; success_only except the explicit any_outcome rows. |
+| Table | `paper/tables/T2.tex` | experiments/results/e1-v3-s10-independent/2026-10-22T04-40-36-408Z/summary.csv (SHA-256 <REDACTED>); experiments/results/round-i/s10-independent/resubmission/requests.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | Attacker A observes traffic without the session key, B has bearer token only, and C has leaked key; H/T/N/R denote HMAC/timestamp/nonce/request-ID. E1 v3 uses PAST=6 s/FUTURE=2 s/NONCE_TTL=8 s; S10 is independent 30-trial data; S11 has 100 attempts; success_only except the explicit any_outcome rows. |
+| Table | `paper/tables/T2-full.tex` | experiments/results/e1-v3-s10-independent/2026-10-22T04-40-36-408Z/summary.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | Attacker A observes traffic without the session key, B has bearer token only, and C has leaked key; H/T/N/R denote HMAC/timestamp/nonce/request-ID. E1 v3 uses PAST=6 s/FUTURE=2 s/NONCE_TTL=8 s; S10 is independent 30-trial data; S11 has 100 attempts; success_only except the explicit any_outcome rows. |
 | Table | `paper/tables/T3-layer-cost.tex` | experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r1-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r10-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r2-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r3-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r4-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r5-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r6-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r7-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r8-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_redis-r9-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r1-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r10-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r2-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r3-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r4-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r5-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r6-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r7-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r8-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_sqlite-r9-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r1-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r10-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r2-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r3-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r4-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r5-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r6-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r7-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r8-c1/layer-timings.csv (SHA-256 <REDACTED>); experiments/results/e2-v2/2026-10-18T14-10-41-169Z/nonce_memory-r9-c1/layer-timings.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | n=10 repeats per backend, each 3000 requests after 500 warm-ups; localhost; attacker not applicable; all H/T/N/R on; success_only. |
-| Table | `paper/tables/T4-failure-modes.tex` | experiments/results/e4-final-c3/e4b.csv (SHA-256 <REDACTED>); experiments/results/e4-final-c3-rerun/e4c.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | E4b n=30 per mode/request-ID case; E4c n=200 per loss/order/retry case; attacker A is a network observer without the session key; H/T/N/R denote the four defenses; E4 scaled-time/failure profile; success_only. The omitted E4c client-failure-after-debit count equals lost responses in the raw summary and is nonzero in loss cases. |
-| Table | `paper/tables/T5-e1-coverage.tex` | experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H0T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v2/2026-10-18T13-47-01-319Z/H1T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H0T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H0T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H0T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T0N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N0R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R0/2026-10-20T08-23-37-233Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-fast-R1/2026-10-20T08-20-07-454Z/H1T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R0/2026-10-20T08-24-10-419Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-S10-late-R1/2026-10-20T08-21-04-864Z/H1T1N1R1-success_only/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/round-f/B-s11-100/2026-10-20T08-18-43-754Z/H1T1N1R1/requests.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | Scenario counts and outcomes are recomputed from raw rows; attacker A lacks the session key, B has bearer token only, and C has leaked key; H/T/N/R denote HMAC/timestamp/nonce/request-ID; scaled-time except Round F default-window S10/S11; success_only except policy rows. |
+| Table | `paper/tables/T4-failure-modes.tex` | experiments/results/e4-final-c3/e4b.csv (SHA-256 <REDACTED>); experiments/results/round-i/e4c-exact/e4c.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | E4b n=30 per mode/request-ID case; E4c n=200 per loss/order/retry case; attacker A is a network observer without the session key; H/T/N/R denote the four defenses; E4 scaled-time/failure profile; success_only. The omitted E4c client-failure-after-debit count equals lost responses in the raw summary and is nonzero in loss cases. |
+| Table | `paper/tables/T5-e1-coverage.tex` | experiments/results/e1-v3/round-i-scaled/H0T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H0T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T0N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N0R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N0R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N1R0/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/H1T1N1R1/requests.csv (SHA-256 <REDACTED>); experiments/results/e1-v3/round-i-scaled/summary.csv (SHA-256 <REDACTED>); experiments/results/e1-v3-s10-independent/2026-10-22T04-40-36-408Z/summary.csv (SHA-256 <REDACTED>); experiments/results/e1-v3-s11/round-i-s11/summary.csv (SHA-256 <REDACTED>) | `python paper/generate_paper_assets.py` | Attacker A observes traffic without the session key, B has bearer token only, and C has leaked key; H/T/N/R denote HMAC/timestamp/nonce/request-ID. E1 v3 uses PAST=6 s/FUTURE=2 s/NONCE_TTL=8 s; S10 is independent 30-trial data; S11 has 100 attempts; success_only except the explicit any_outcome rows. |
```

### paper/crosscheck_assets.py
```diff
diff --git a/paper/crosscheck_assets.py b/paper/crosscheck_assets.py
index cfc8ba6..96fcb9c 100644
--- a/paper/crosscheck_assets.py
+++ b/paper/crosscheck_assets.py
@@ -1,120 +1,121 @@
-﻿from pathlib import Path
-import csv,re,json,zlib
-ROOT=Path(__file__).resolve().parents[1]
-P=ROOT/'paper'; compared=0; mismatches=[]; disagreements=[]
-SCEN=['S1','S2','S3','S4','S5','S6','S7a','S7b','S10 fast','S10 late','S11']
-CONFIGS=sorted([f'H{h}T{t}N{n}R{r}' for h in (0,1) for t in (0,1) for n in (0,1) for r in (0,1)])
-def read_csv(path):
-    with (ROOT/path).open(newline='',encoding='utf-8-sig') as f:return list(csv.DictReader(f))
-def summary_map(path):
-    return {(r['config_id'],r['scenario_id'],r.get('variant','')):r for r in read_csv(path)}
-e1=summary_map('experiments/results/e1-v2/summary.csv')
-round_summaries={}
-for scenario,run in [('S10 fast','B-S10-fast-R0'),('S10 late','B-S10-late-R0')]:
-    for rid in (0,1):
-        rname=('B-S10-fast-' if scenario=='S10 fast' else 'B-S10-late-')+f'R{rid}'
-        for row in read_csv(f'experiments/results/round-f/{rname}/summary.csv'):
-            key=(row['config_id'].split('-')[0],scenario,row['config_id'].split('-')[-1] if rid else 'success_only')
-            round_summaries[key]=row
-for row in read_csv('experiments/results/round-f/B-s11-100/summary.csv'):
-    if row['scenario_id']=='S11': round_summaries[(row['config_id'].split('-')[0],'S11','success_only')]=row
+"""Independent paper-cell validation. Does not import the asset generator."""
+from pathlib import Path
+import csv, re, zlib, json
 
-def expected(cfg,scen,policy='success_only'):
-    if scen in ('S1','S2','S3','S4','S5','S6','S7a','S7b','S8','S9'):
-        var={'S7a':'request_id','S7b':'nonce'}.get(scen,'')
-        r=e1.get((cfg,scen,var))
-        if r is None: return None
-    else:r=round_summaries.get((cfg,scen,policy))
-    if not r:return None
-    return int(r['http_accepted_count']),int(r['attempts'])
-def record(label,got,want):
+ROOT = Path(__file__).resolve().parents[1]
+PAPER = ROOT / 'paper'
+CONFIGS = [f'H{h}T{t}N{n}R{r}' for h in (0,1) for t in (0,1) for n in (0,1) for r in (0,1)]
+SCENARIOS = ['S1','S2','S3','S4','S5','S6','S7a','S7b','S10 fast','S10 late','S11']
+compared = 0
+mismatches = []
+def csv_rows(relative):
+    with (ROOT / relative).open(newline='', encoding='utf-8-sig') as stream:
+        return list(csv.DictReader(stream))
+def keyed(relative, config_field='config_id'):
+    return {(r[config_field], r['scenario_id']): r for r in csv_rows(relative)}
+def check(label, actual, expected):
     global compared
-    compared+=1
-    if got!=want:mismatches.append({'cell':label,'printed':got,'source':want})
+    compared += 1
+    if actual != expected:
+        mismatches.append({'cell': label, 'asset_value': actual, 'summary_value': expected})
+def wilson(k,n):
+    z=1.959963984540054; p=k/n; d=1+z*z/n; c=(p+z*z/(2*n))/d; m=z*((p*(1-p)+z*z/(4*n))/n)**0.5/d
+    return max(0,c-m),min(1,c+m)
+v3 = keyed('experiments/results/e1-v3/round-i-scaled/summary.csv')
+s10rows = csv_rows('experiments/results/e1-v3-s10-independent/2026-10-22T04-40-36-408Z/summary.csv')
+s10 = {(r['config_id'].rsplit('-',1)[0], r['scenario_id'], r['policy']): r for r in s10rows}
+s11 = keyed('experiments/results/e1-v3-s11/round-i-s11/summary.csv')
+expected = {}
+for config in CONFIGS:
+    for scenario in SCENARIOS[:8]:
+        row = v3[(config, scenario)]
+        expected[(config, scenario)] = (int(row['debited_count']), int(row['attempts']))
+    for label, source in [('S10 fast','S10_indep_fast'),('S10 late','S10_indep_late')]:
+        row = s10[(config, source, 'success_only')]
+        expected[(config, label)] = (int(row['delayed_execution_count']), int(row['attempts']))
+    row = s11[(config, 'S11')]
+    expected[(config, 'S11')] = (int(row['debited_count']), int(row['attempts']))
 
-def untex(x):return x.replace(r'\_','_').strip()
-def table_rows(path):
-    lines=(P/'tables'/path).read_text(encoding='utf-8').splitlines(); active=False; out=[]
+def tex_table(relative):
+    lines = (PAPER / relative).read_text(encoding='utf-8').splitlines()
+    active = False
+    result = []
     for line in lines:
-        if line=='\\midrule':active=True;continue
-        if line=='\\bottomrule':break
+        if line.strip() == r'\midrule': active = True; continue
+        if line.strip() == r'\bottomrule': break
         if active and '&' in line:
-            vals=[untex(v.strip().removesuffix(r'\\')) for v in line.split('&')]
-            vals[-1]=untex(vals[-1].replace(r'\\',''))
-            out.append(vals)
-    return out
-# T5 is the numeric source-aligned matrix. Validate each cell against E1 and Round F.
-t5=table_rows('T5-e1-coverage.tex')
-if len(t5)!=16: mismatches.append({'cell':'T5 row count','printed':len(t5),'source':16})
+            fields = [x.strip().replace(r'\_', '_') for x in line.split('&')]
+            fields[-1] = fields[-1].removesuffix(r'\\').strip()
+            result.append(fields)
+    return result
+
+t5 = tex_table('tables/T5-e1-coverage.tex')
+if len(t5) != 16:
+    mismatches.append({'cell':'T5 configuration rows','asset_value':len(t5),'summary_value':16})
 for row in t5:
-    cfg=row[0]
-    for scen,val in zip(SCEN,row[1:]):
-        source_scen=scen; policy='success_only'
-        want=expected(cfg,source_scen,policy)
-        gotk=int(val)
-        if want is None: mismatches.append({'cell':f'T5 {cfg} {scen}','printed':gotk,'source':'missing'}); continue
-        record(f'T5 {cfg} {scen}',(gotk,int(want[1])),want)
-# Decode the PDF text runs independently: Matplotlib writes the F2 cell labels in 7-point F3 text.
-def pdf_cell_text(path):
-    data=(P/'figures'/path).read_bytes(); streams=[]
-    for m in re.finditer(rb'stream\r?\n',data):
-        start=m.end(); end=data.find(b'endstream',start); raw=data[start:end].rstrip(b'\r\n')
-        try: decoded=zlib.decompress(raw)
+    config = row[0]
+    for scenario, printed in zip(SCENARIOS, row[1:]):
+        k, n = expected[(config, scenario)]
+        check(f'T5 {config} {scenario}', (int(printed), n), (k, n))
+
+def pdf_values(filename):
+    content = (PAPER/'figures'/filename).read_bytes()
+    streams=[]
+    for match in re.finditer(rb'stream\r?\n', content):
+        start=match.end(); end=content.find(b'endstream',start); stream=content[start:end].rstrip(b'\r\n')
+        try: decoded=zlib.decompress(stream)
         except zlib.error: continue
         if b'/F3 7 Tf' in decoded: streams.append(decoded)
-    if len(streams)!=1: raise ValueError(f'expected one cell-text content stream in {path}, got {len(streams)}')
+    if len(streams)!=1: raise ValueError(f'{filename}: expected one cell-label stream, found {len(streams)}')
     pattern=rb'q\s+1 0 -0 1 ([0-9.]+) ([0-9.]+) cm\s+BT\s+/F3 7 Tf\s+0 0 Td\s+\[(.*?)\]\s*TJ\s+ET\s+Q'
-    found=[]
-    for m in re.finditer(pattern,streams[0],re.S):
-        pieces=re.findall(rb'\((.*?)\)',m.group(3),re.S)
-        label=b''.join(pieces).decode('utf-16-be','strict')
-        found.append((float(m.group(1)),float(m.group(2)),label))
-    if len(found)!=len(CONFIGS)*len(SCEN): raise ValueError(f'{path} has {len(found)} cells, expected {len(CONFIGS)*len(SCEN)}')
-    # Page y increases upward; rows are emitted top-to-bottom.
-    found.sort(key=lambda x:(-round(x[1],4),x[0]))
-    return [x[2] for x in found]
+    values=[]
+    for match in re.finditer(pattern,streams[0],re.S):
+        pieces=re.findall(rb'\((.*?)\)',match.group(3),re.S)
+        values.append((float(match.group(1)),float(match.group(2)),int(b''.join(pieces).decode('utf-16-be'))))
+    if len(values)!=len(CONFIGS)*len(SCENARIOS): raise ValueError(f'{filename}: expected 176 heatmap labels, got {len(values)}')
+    values.sort(key=lambda item:(-round(item[1],4),item[0]))
+    return [x[2] for x in values]
 for figure in ['F2-e1-coverage-single.pdf','F2-e1-coverage-double.pdf']:
-    printed=pdf_cell_text(figure)
-    for i,(cfg,scen) in enumerate((c,s) for c in CONFIGS for s in SCEN):
-        want=expected(cfg,scen)
-        record(f'{figure} {cfg} {scen}',int(printed[i]),None if want is None else want[0])
-# Compare overlapping S10/S11 success rates at 30 vs 100 attempts, and report disagreements.
-for cfg in CONFIGS:
-    for scen in ['S10 fast','S10 late','S11']:
-        old=e1.get((cfg,scen.replace(' ','_'),''))
-        new=round_summaries.get((cfg,scen,'success_only'))
-        if old and new:
-            a,an=int(old['http_accepted_count']),int(old['attempts']); b,bn=int(new['http_accepted_count']),int(new['attempts'])
-            if a/an != b/bn: disagreements.append({'config':cfg,'scenario':scen,'30_attempt':f'{a}/{an}','100_attempt':f'{b}/{bn}'})
-# T2-full per-configuration S10 cells, including each policy.
-for row in table_rows('T2-full.tex'):
-    if row[0] not in ('S10_fast','S10_late'):continue
-    scen='S10 fast' if row[0]=='S10_fast' else 'S10 late'; cfg=row[1]; pol=row[2]
-    if pol=='success_only' and cfg.endswith('R0'):policy='success_only'
-    else:policy=pol
-    want=expected(cfg,scen,policy)
-    got=(int(row[3]),int(row[4]))
-    record(f'T2-full {cfg} {scen} {pol}',got,want)
-# Compact T2 group rows: validate each grouped cell by aggregating matching Round F summary records.
-for row in table_rows('T2.tex'):
-    policy,group,scenario,kn,_scope=row
-    if scenario not in ('fast','late'):continue
-    scen='S10 '+scenario
-    rid=1 if 'R on' in group else 0
-    freshness=group.split('; ')[1]
-    tn={'none':(0,0),'T only':(1,0),'N only':(0,1),'T and N':(1,1)}[freshness]
-    candidates=[c for c in CONFIGS if c.endswith(f'R{rid}') and int(c[3])==tn[0] and int(c[5])==tn[1]]
-    if _scope in CONFIGS:candidates=[_scope]
-    vals=[expected(c,scen,policy) for c in candidates]
-    vals=[v for v in vals if v is not None]
-    want=(sum(v[0] for v in vals),sum(v[1] for v in vals))
-    m=re.match(r'(\d+)/(\d+)',kn); got=(int(m.group(1)),int(m.group(2))) if m else None
-    record(f'T2 {policy} {group} {scen}',got,want)
-# Explicit report.
-lines=['Independent paper asset cross-check','',f'Values compared: {compared}',f'Mismatches: {len(mismatches)}',f'30-attempt vs 100-attempt rate disagreements: {len(disagreements)}','', 'Method: standalone CSV parser and formulas; parses the embedded 7-point cell labels from both F2 PDFs, compares T5 and T2/T2-full printed cells against E1 v2 and Round F summary CSVs, and lists overlapping 30-vs-100 rate disagreements.', '', 'Mismatches:']
-lines += [json.dumps(x,sort_keys=True) for x in mismatches] or ['None.']
-lines += ['', 'Cells whose success rates differ between the 30-attempt E1 v2 and 100-attempt Round F runs:']
-lines += [json.dumps(x,sort_keys=True) for x in disagreements] or ['None.']
-(P/'CROSSCHECK.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
-print(f'Cross-check values compared: {compared}; mismatches: {len(mismatches)}; 30 vs 100 rate disagreements: {len(disagreements)}')
+    values=pdf_values(figure)
+    for index,(config,scenario) in enumerate((c,s) for c in CONFIGS for s in SCENARIOS):
+        check(f'{figure} {config} {scenario}', values[index], expected[(config,scenario)][0])
+
+# The S10 table entries are independently checked from the source summary as well.
+for row in tex_table('tables/T2-full.tex'):
+    policy, config, scenario, kn, ci = row
+    label = 'S10 fast' if scenario == 'fast' else 'S10 late'
+    summary = s10[(config, 'S10_indep_'+scenario, policy)]
+    check(f'T2-full {policy} {config} {label}', tuple(map(int, kn.split('/'))), (int(summary['delayed_execution_count']),int(summary['attempts'])))
+    numbers=re.findall(r'\d+\.\d+',ci)
+    low,high=wilson(int(summary['delayed_execution_count']),int(summary['attempts']))
+    check(f'T2-full {policy} {config} {label} Wilson',tuple(map(float,numbers[:2])) if len(numbers)>=2 else None,(round(low,3),round(high,3)))
+for row in tex_table('tables/T2.tex'):
+    policy, defense, scope, fast_text, late_text, resub_text = row
+    if defense == 'After funding': continue
+    rid=int(re.search(r'R([01])',defense).group(1)); fresh=defense.split('; ',1)[1]
+    tn={'No T/N':(0,0),'T only':(1,0),'N only':(0,1),'T and N':(1,1)}[fresh]
+    configs=re.findall(r'H[01]T[01]N[01]R[01]',scope)
+    def check_compact(text, scenario):
+        match=re.match(r'(\d+)/(\d+) \[([0-9.]+), ([0-9.]+)\]',text)
+        values=[(c,s10[(c,'S10_indep_'+scenario,policy)]) for c in configs]
+        counts={(int(v['delayed_execution_count']),int(v['attempts'])) for _,v in values}
+        if len(counts)!=1:
+            mismatches.append({'cell':f'T2 compact {policy} {defense} {scenario}','asset_value':scope,'summary_value':'group contains non-identical cells'});return
+        k,n=next(iter(counts));low,high=wilson(k,n)
+        check(f'T2 compact {policy} {defense} {scenario} count',(int(match.group(1)),int(match.group(2))) if match else None,(k,n))
+        check(f'T2 compact {policy} {defense} {scenario} Wilson',(round(float(match.group(3)),3),round(float(match.group(4)),3)) if match else None,(round(low,3),round(high,3)))
+    check_compact(fast_text,'fast'); check_compact(late_text,'late')
+
+report = [
+    '# Independent Paper Cross-check','',
+    f'Values compared: {compared}',
+    f'Mismatches: {len(mismatches)}',
+    'Source: E1 v3 summary.csv, S10-independent summary.csv (success_only), and E1 v3 S11 summary.csv.',
+    'Method: this standalone script parses summary CSVs and LaTeX tables directly and extracts the 7-point cell labels from both F2 PDFs; it does not import generate_paper_assets.py.',
+    '', '## Mismatches'
+]
+report += [json.dumps(row,sort_keys=True) for row in mismatches] if mismatches else ['None.']
+report.append('')
+(PAPER/'CROSSCHECK.txt').write_text('\n'.join(report),encoding='utf-8')
+print(f'Independent cross-check compared {compared} values; mismatches={len(mismatches)}')
 if mismatches: raise SystemExit(1)
```

### paper/figures/F2-e1-coverage-double.pdf
Binary artifact changed; source data and generator are documented above.

### paper/figures/F2-e1-coverage-single.pdf
Binary artifact changed; source data and generator are documented above.

### paper/figures/F3a-scaled-TTL-grid.pdf
Binary artifact changed; source data and generator are documented above.

### paper/figures/F3b-default-TTL-gap.pdf
Binary artifact changed; source data and generator are documented above.

### paper/figures/F4-E3-false-rejection-future.pdf
Binary artifact changed; source data and generator are documented above.

### paper/figures/F5-E2-layer-cost.pdf
Binary artifact changed; source data and generator are documented above.

### paper/generate_paper_assets.py
```diff
diff --git a/paper/generate_paper_assets.py b/paper/generate_paper_assets.py
index b46626c..2c6b118 100644
--- a/paper/generate_paper_assets.py
+++ b/paper/generate_paper_assets.py
@@ -82,7 +82,7 @@ def write_table(name: str, headers: list[str], rows: list[list[object]]) -> None
 
 
 def latest_e1_run() -> Path:
-    root = ROOT / 'experiments/results/e1-v2'
+    root = ROOT / 'experiments/results/e1-v3'
     return sorted(p for p in root.iterdir() if p.is_dir() and (p / 'H0T0N0R0/requests.csv').exists())[-1]
 
 
@@ -111,37 +111,48 @@ def cell(rows: list[dict[str, str]]) -> tuple[int, int, float]:
 
 
 # Read every source once; all plotted/table figures are calculated from per-request CSV rows.
-e1_path = 'experiments/results/e1-v2/' + str(latest_e1_run().relative_to(ROOT / 'experiments/results/e1-v2')).replace('\\', '/') + '/H0T0N0R0/requests.csv'
 e1_dir = latest_e1_run()
 configs = sorted(p.name for p in e1_dir.iterdir() if p.is_dir() and re.fullmatch(r'H[01]T[01]N[01]R[01]',p.name) and (p/'requests.csv').is_file())
+e1_path = f"{str(e1_dir.relative_to(ROOT)).replace('\\', '/')}/H0T0N0R0/requests.csv"
+e1_summary_path = f"{str(e1_dir.relative_to(ROOT)).replace('\\', '/')}/summary.csv"
+e1_summary = raw(e1_summary_path)
+def summary_cell(row: dict[str, str], success_field: str = 'debited_count') -> tuple[int, int, float]:
+    k, n = int(row[success_field]), int(row['attempts'])
+    if n == 0: raise ValueError(f"empty applicable cell {row.get('config_id')}/{row.get('scenario_id')}")
+    check_value(k); check_value(n)
+    return k, n, check_value(k/n)
 e1_cells: dict[tuple[str, str], tuple[int, int, float]] = {}
 for cfg in configs:
-    p = f"{str(e1_dir.relative_to(ROOT)).replace('\\', '/')}/{cfg}/requests.csv"
-    rows = raw(p)
-    for scenario in ('S1','S2','S3','S4','S5','S6','S7a','S7b'):
-        matching = [r for r in rows if r.get('phase') == 'attacker' and r.get('scenario_id') == scenario]
-        e1_cells[(cfg, scenario)] = cell(matching)
-    for scenario in ('S8','S9'):
-        matching=[r for r in rows if r.get('phase')=='attacker' and r.get('scenario_id')==scenario]
-        e1_cells[(cfg,scenario)]=cell(matching)
+    for scenario in ('S1','S2','S3','S4','S5','S6','S7a','S7b','S8','S9'):
+        candidates=[r for r in e1_summary if r.get('config_id')==cfg and r.get('scenario_id')==scenario]
+        if scenario in ('S7a','S7b'):
+            variant='request_id' if scenario=='S7a' else 'nonce'
+            candidates=[r for r in candidates if r.get('variant')==variant]
+        if len(candidates)!=1: raise ValueError(f'missing/ambiguous E1 v3 cell {cfg}/{scenario}: {len(candidates)}')
+        e1_cells[(cfg,scenario)]=summary_cell(candidates[0])
 
 # F2: request-level attack success matrix; S10/S11 extend the same 16-config matrix.
-b_specs = [('S10 fast', 'S10_fast', 'B-S10-fast-R0', 'B-S10-fast-R1'), ('S10 late', 'S10_late', 'B-S10-late-R0', 'B-S10-late-R1')]
+s10_root=ROOT/'experiments/results/e1-v3-s10-independent'
+s10_runs=sorted(p for p in s10_root.iterdir() if p.is_dir() and (p/'summary.csv').exists())
+if not s10_runs: raise ValueError('S10-independent summary missing')
+s10_run=s10_runs[-1]
+s10_path=str((s10_run/'requests.csv').relative_to(ROOT)).replace('\\','/')
+s10_summary_path=str((s10_run/'summary.csv').relative_to(ROOT)).replace('\\','/')
+s10_summary=raw(s10_summary_path)
+s11_root=ROOT/'experiments/results/e1-v3-s11'
+s11_runs=sorted(p for p in s11_root.iterdir() if p.is_dir() and (p/'summary.csv').exists())
+if not s11_runs: raise ValueError('E1 v3 S11 summary missing')
+s11_run=s11_runs[-1]
+s11_summary_path=str((s11_run/'summary.csv').relative_to(ROOT)).replace('\\','/')
+s11_summary=raw(s11_summary_path)
 for cfg in configs:
-    for label, scenario, r0, r1 in b_specs:
-        run=r0 if cfg.endswith('R0') else r1
-        p=latest_b_csv(run,cfg,'success_only')
-        selected=attacking_rows(p,scenario)
-        if cfg.endswith('R1'):
-            selected=[r for r in selected if r.get('config_id','').endswith('success_only')]
-        e1_cells[(cfg,label)]=cell(selected)
-    if cfg.endswith('R0'):
-        p=latest_b_csv('B-s11-100',cfg)
-        e1_cells[(cfg,'S11')]=cell(attacking_rows(p,'S11'))
-    else:
-        # S11 stores both R0/R1 in its config names and is present in the all-config run.
-        p=latest_b_csv('B-s11-100',cfg)
-        e1_cells[(cfg,'S11')]=cell(attacking_rows(p,'S11'))
+    for label,scenario in [('S10 fast','S10_indep_fast'),('S10 late','S10_indep_late')]:
+        candidates=[r for r in s10_summary if r.get('config_id')==f'{cfg}-success_only' and r.get('scenario_id')==scenario]
+        if len(candidates)!=1: raise ValueError(f'missing S10-independent success_only cell {cfg}/{scenario}')
+        e1_cells[(cfg,label)]=summary_cell(candidates[0],'delayed_execution_count')
+    candidates=[r for r in s11_summary if r.get('config_id')==cfg and r.get('scenario_id')=='S11']
+    if len(candidates)!=1: raise ValueError(f'missing E1 v3 S11 cell {cfg}')
+    e1_cells[(cfg,'S11')]=summary_cell(candidates[0])
 
 columns = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7a', 'S7b', 'S10 fast', 'S10 late', 'S11']
 for cfg in configs:
@@ -219,9 +230,9 @@ for cfg in ['H1T1N1R0', 'H1T1N1R1']:
         low, high = wilson(k, len(g))
         full_rows.append((cfg, delay, k, len(g), check_value(k/len(g)), check_value(low), check_value(high)))
 fig, ax = plt.subplots(figsize=(3.5, 2.5))
-for cfg, marker, label in [('H1T1N1R0', 'o', 'Request-ID off'), ('H1T1N1R1', 's', 'Request-ID on')]:
+for cfg, marker, label, offset in [('H1T1N1R0', 'o', 'Request-ID off', -0.09), ('H1T1N1R1', 's', 'Request-ID on', 0.09)]:
     part = [r for r in full_rows if r[0] == cfg]
-    xs = list(range(len(part))); ys = [r[2] for r in part]
+    xs = [i + offset for i in range(len(part))]; ys = [r[2] for r in part]
     lo = [max(0,(ys[i]/part[i][3]-part[i][5])*part[i][3]) for i in range(len(part))]; hi = [max(0,(part[i][6]-ys[i]/part[i][3])*part[i][3]) for i in range(len(part))]
     ax.errorbar(xs, ys, yerr=[lo, hi], marker=marker, linestyle='none', capsize=2, label=label, color='black', mfc='white' if marker == 's' else 'black')
 ax.set_xlabel('Replay delay after first use (s)')
@@ -304,17 +315,22 @@ ax.set_ylabel('Server layer p50 (microseconds)')
 ax.set_yscale('log')
 ax.legend(frameon=False,ncol=2,loc='upper center',bbox_to_anchor=(.5,-.20))
 ax.grid(axis='y',color='0.85',linewidth=.4,which='both')
-savefig(fig,'F5-E2-layer-cost',3.5,tight_rect=(0,.22,1,1))
+fig.subplots_adjust(left=.29,right=.97,top=.96,bottom=.31)
+savefig(fig,'F5-E2-layer-cost',3.5)
 
 # T1 scenarios: attempts and attacker class from the measured cells.
 scenario_desc = {
- 'S1':('Immediate exact replay','A'),'S2':('Delayed exact replay inside timestamp window','A'),'S3':('Replay after nonce-store wipe','A'),'S4':('Replay after timestamp window','A'),'S5':('Parallel identical-request burst (50 parallel x 30 batches)','A'),'S6':('Amount modified; original signature retained','A'),'S7a':('Request ID modified; original signature retained','A'),'S7b':('Nonce modified; original signature retained','A'),'S8':('Expired session bearer token','A'),'S9':('Fresh forgery with leaked session key','C'),'S10 fast':('Failed withdrawal replay inside nonce and timestamp windows','A'),'S10 late':('Failed withdrawal replay after nonce TTL and timestamp window','A'),'S11':('Captured bearer token, without session signing key','B')
+ 'S1':('Immediate exact replay','A'),'S2':('Delayed exact replay inside timestamp window','A'),'S3':('Replay after nonce-store wipe','A'),'S4':('Replay after timestamp window','A'),'S5':('Parallel identical-request burst (50 parallel x 30 batches)','A'),'S6':('Amount modified; original signature retained','A'),'S7a':('Request ID modified; original signature retained','A'),'S7b':('Nonce modified; original signature retained','A'),'S8':('Expired session bearer token','A'),'S9':('Fresh forgery with leaked session key','C'),'S10 fast':('Independent failed withdrawals replayed once after 1 s; funded balance 3,002; amount 100','A'),'S10 late':('Independent failed withdrawals replayed once after 9 s; nonce TTL 8 s and past window 6 s','A'),'S11':('Captured bearer token, without session signing key','B')
 }
 t1=[]
 for label,(desc,attacker) in scenario_desc.items():
     ns=sorted({e1_cells[(c,label)][1] for c in configs})
     t1.append([label,desc,attacker,', '.join(map(str,ns))])
 write_table('T1-scenarios',['Scenario','Description','Attacker','Attempts n'],t1)
+t1_tex=[r'\begin{table*}[t]',r'\centering',r'\small',r'\begin{tabular}{lp{4.2in}cc}',r'\toprule',r'Scenario & Description & Attacker & Attempts $n$ \\',r'\midrule']
+t1_tex += [f"{tex_escape(a)} & {tex_escape(b)} & {tex_escape(c)} & {tex_escape(d)}" + r' \\' for a,b,c,d in t1]
+t1_tex += [r'\bottomrule',r'\end{tabular}',r'\end{table*}','']
+(TABLE/'T1-scenarios.tex').write_text('\n'.join(t1_tex),encoding='utf-8')
 
 # T2: all Round F S10 request-level outcomes plus the C2 resubmission attempt CSV.
 t2=[]
@@ -377,6 +393,44 @@ for policy in sorted({r['policy'] for r in resub}):
         compact.append([policy,'After funding',variant,f'{k}/{n} [{lo:.3f}, {hi:.3f}]','resubmission trials'])
 write_table('T2',['Policy','Request-ID / freshness','Scenario','Successes / n (Wilson 95%)','Configuration scope'],compact)
 
+# Round I replaces the old single-request S10 figures with independent trials.
+resub_path='experiments/results/round-i/s10-independent/resubmission/requests.csv'
+resub=raw(resub_path)
+round_i_full=[]
+for r in s10_summary:
+    cfg=r['config_id'].rsplit('-',1)[0]; k=int(r['delayed_execution_count']); n=int(r['attempts']); lo,hi=wilson(k,n)
+    round_i_full.append([r['policy'],cfg,r['scenario_id'].replace('S10_indep_',''),f'{k}/{n}',f'{lo:.3f}–{hi:.3f}'])
+write_table('T2-full',['Policy','Configuration','Scenario','Delayed executions / n','Wilson 95%'],round_i_full)
+round_i_compact=[]
+for rid,policy in [(0,'success_only'),(1,'success_only'),(1,'any_outcome')]:
+    for t,n,fresh in [(0,0,'No T/N'),(1,0,'T only'),(0,1,'N only'),(1,1,'T and N')]:
+        candidates=[c for c in configs if c.endswith(f'R{rid}') and c[3]==str(t) and c[5]==str(n)]
+        cells=[]
+        for cfg in candidates:
+            vals=[]
+            for scenario in ['S10_indep_fast','S10_indep_late']:
+                found=[r for r in s10_summary if r['config_id']==f'{cfg}-{policy}' and r['scenario_id']==scenario]
+                if len(found)!=1: raise ValueError(f'missing independent S10 cell {cfg}/{policy}/{scenario}')
+                row=found[0]; k=int(row['delayed_execution_count']); total=int(row['attempts']); lo,hi=wilson(k,total); vals.append((k,total,lo,hi))
+            cells.append((cfg,*vals))
+        unique=[]
+        for item in cells:
+            same=next((u for u in unique if u[1:]==list(item[1:])),None)
+            if same: same[0].append(item[0])
+            else: unique.append([[item[0]],*item[1:]])
+        for names,fast,late in unique:
+            label=', '.join(names)+(f' (H0/H1 identical)' if len(names)>1 else '')
+            ftxt=f'{fast[0]}/{fast[1]} [{fast[2]:.3f}, {fast[3]:.3f}]'; ltxt=f'{late[0]}/{late[1]} [{late[2]:.3f}, {late[3]:.3f}]'
+            round_i_compact.append([policy,f'R{rid}; {fresh}',label,ftxt,ltxt,''])
+for policy in sorted({r['policy'] for r in resub}):
+    for variant in sorted({r['variant'] for r in resub}):
+        g=[r for r in resub if r['policy']==policy and r['variant']==variant]
+        k=sum(r['retry_status']=='200' and r['retry_reason']=='ACCEPTED' for r in g); n=len(g); lo,hi=wilson(k,n)
+        round_i_compact.append([policy,'After funding',variant,'N/A','N/A',f'{k}/{n} [{lo:.3f}, {hi:.3f}]'])
+write_table('T2',['Policy','Request-ID / freshness','Configuration(s)','S10 fast k/n (Wilson 95%)','S10 late k/n (Wilson 95%)','Resubmission success (Wilson 95%)'],round_i_compact)
+t2file=TABLE/'T2.tex'; t2text=t2file.read_text(encoding='utf-8').replace(r'\begin{tabular}{lccccc}',r'\setlength{\tabcolsep}{2pt}'+'\n'+r'\begin{tabular}{lp{0.68in}p{1.38in}p{1.30in}p{1.30in}p{1.15in}}')
+t2file.write_text(t2text,encoding='utf-8')
+
 # T4 failure modes: E4b Wilson rows and E4c retry outcome counts from raw trials.
 e4b_path='experiments/results/e4-final-c3/e4b.csv'; e4b=raw(e4b_path); t4=[]
 for case in sorted({r['case'] for r in e4b}):
@@ -385,8 +439,8 @@ for case in sorted({r['case'] for r in e4b}):
     lk=sum(r['reason']=='ACCEPTED' and r['status']=='200' for r in leg); rk=sum(r['reason']=='ACCEPTED' and r['status']=='200' for r in rep)
     ln=len(leg); rn=len(rep); ll,lh=wilson(lk,ln); rl,rh=wilson(rk,rn)
     mode='fail-open' if 'fail-open' in case else 'fail-closed'; rid='on' if case.endswith('-1') else 'off'
-    t4.append(['E4b',mode,rid,f'{lk}/{ln} [{ll:.3f}, {lh:.3f}]',f'{rk}/{rn} [{rl:.3f}, {rh:.3f}]','','',''])
-e4c_path='experiments/results/e4-final-c3-rerun/e4c.csv'; e4c=raw(e4c_path)
+    t4.append(['E4b',mode,rid,'',f'{lk}/{ln} [{ll:.3f}, {lh:.3f}]',f'{rk}/{rn} [{rl:.3f}, {rh:.3f}]','','','',''])
+e4c_path='experiments/results/round-i/e4c-exact/e4c.csv'; e4c=raw(e4c_path)
 for case in sorted({r['case'] for r in e4c if r.get('kind')!='summary'}):
     g=[r for r in e4c if r['case']==case and r.get('kind')!='summary']
     if not case.startswith('loss-'): continue
@@ -399,10 +453,12 @@ for case in sorted({r['case'] for r in e4c if r.get('kind')!='summary'}):
     if summary is None: raise ValueError(f'missing E4c raw oracle summary for {case}')
     debit=int(summary.get('debits') or 0); exactly=int(summary.get('exactly_one_debit_request_ids') or 0); infer=int(summary.get('reason_confirms_success_count') or 0)
     if int(summary.get('trials') or 0)!=200 or len(g)!=200: raise ValueError(f'E4c trial count mismatch for {case}')
-    t4.append(['E4c',f'p={prob}', 'default' if order=='default' else 'request-ID first', 'identical signed request' if retry=='same-signed' else 'fresh nonce, same request_id',f'{lost}/200',json.dumps(dict(sorted(reasons.items())),sort_keys=True),f'{exactly}/200',str(infer)])
-write_table('T4-failure-modes',['Experiment','Mode / loss p','Request-ID / check order','Legitimate accepted / retry type','Replay accepted / lost responses','Retry reason counts','Exactly one debit','Client can infer success'],t4)
+    reason_text='; '.join(f'{name}:{count}' for name,count in sorted(reasons.items()))
+    t4.append(['E4c',f'p={prob}', 'default' if order=='default' else 'request-ID first', 'identical signed request' if retry=='same-signed' else 'fresh nonce, same request_id','','',f'{lost}/200',reason_text,f'{exactly}/200',str(infer)])
+write_table('T4-failure-modes',['Experiment','Mode / loss p','Request-ID / check order','Retry type','Legitimate accepted (k/30, Wilson 95%)','Replay accepted (k/30, Wilson 95%)','Lost responses (of 200)','Retry reason counts','Debited exactly once (k/200)','Retries infer success (k)'],t4)
 t4file=TABLE/'T4-failure-modes.tex'; t4text=t4file.read_text(encoding='utf-8')
-t4text=t4text.replace(r'\small',r'\small'+'\n'+r'\caption*{E4c client failure after debit is not zero in the saved data: its summary count equals the lost-response count for each loss case. The requested table omits this separate column; see source CSV and summary fields.}')
+t4text=t4text.replace(r'\begin{tabular}{lccccccccc}',r'\setlength{\tabcolsep}{1.5pt}'+'\n'+r'\begin{tabular}{lp{0.47in}p{0.61in}p{0.75in}p{0.76in}p{0.76in}p{0.49in}p{0.75in}p{0.70in}p{0.49in}}')
+t4text=t4text.replace(r'\small',r'\small'+'\n'+r'\caption*{For E4b, the first two outcome columns are legitimate requests accepted and replay requests accepted, each out of 30 with Wilson 95% intervals. For E4c, failures after debit equal the lost-response count by construction; the table reports lost responses, retry reasons, exactly-once debit count, and retries that reveal prior success.}')
 t4file.write_text(t4text,encoding='utf-8')
 
 # Compact empirical E1 matrix T5; every cell uses the same raw request rows as F2.
@@ -410,10 +466,7 @@ t5headers=['Config']+[f"{c.replace('S10 fast','S10f').replace('S10 late','S10l')
 write_table('T5-e1-coverage',t5headers,[[cfg]+[str(e1_cells[(cfg,c)][0]) for c in columns] for cfg in configs])
 
 # Every generated asset receives source paths/hashes and a data-specific caption.
-f2_sources=[f"{str(e1_dir.relative_to(ROOT)).replace('\\','/')}/{cfg}/requests.csv" for cfg in configs]
-for cfg in configs:
-    f2_sources.extend([latest_b_csv(run,cfg) for run in ('B-S10-fast-R0','B-S10-fast-R1','B-S10-late-R0','B-S10-late-R1')])
-    f2_sources.append(latest_b_csv('B-s11-100',cfg))
+f2_sources=[f"{str(e1_dir.relative_to(ROOT)).replace('\\','/')}/{cfg}/requests.csv" for cfg in configs]+[e1_summary_path,s10_path,s10_summary_path,s11_summary_path]
 f2_sources=list(dict.fromkeys(f2_sources))
 e2_source_files=[str(p.relative_to(ROOT)).replace('\\','/') for stack in stacks for p in sorted(e2_root.glob(f'{stack}-r*-c1/layer-timings.csv'))]
 sources={
@@ -430,7 +483,7 @@ if len(s8_values)!=1 or len(s9_values)!=1: raise ValueError('S8/S9 cells are inc
 s8k,s8n=next(iter(s8_values)); s9k,s9n=next(iter(s9_values))
 if s8k!=0 or s9k!=s9n: raise ValueError('S8/S9 caption values disagree with saved rows')
 col_n={c:e1_cells[(configs[0],c)][1] for c in columns}
-e1_caption='F2: H/T/N/R denote HMAC/timestamp/nonce/request-ID defenses; attacker A observes traffic without the session key (S1 through S8), attacker C has the leaked session key (S9), and B holds a bearer token only (S11). Each scenario header gives n; cells print successful attacks k, with grayscale/hatching encoding k/n; S8='+f'{s8k}/{s8n}'+', S9='+f'{s9k}/{s9n}'+'. Scaled-time S1 through S9; Round F default-window S10/S11; success_only.'
+e1_caption='F2: H/T/N/R denote HMAC/timestamp/nonce/request-ID defenses; attacker A observes traffic without the session key (S1 through S8 and S10), attacker C has the leaked key (S9), and B holds a bearer token only (S11). Each column header gives n; cells print successful attacks k, with grayscale/hatching encoding k/n. S5 uses n=1,500 (50 parallel x 30 batches); S8='+f'{s8k}/{s8n}'+', S9='+f'{s9k}/{s9n}'+'. S1-S9 use E1 v3 scaled time (PAST=6 s, FUTURE=2 s, NONCE_TTL=8 s); S10 uses independent trials at 1 s/9 s; S11 uses 100 attempts; success_only.'
 caption_map={
 'F2-e1-coverage-single':e1_caption, 'F2-e1-coverage-double':e1_caption,
 'F3a-scaled-TTL-grid':'n=30 per cell; attacker A (network observer, no session key) replays recorded requests; H/T/N/R mean HMAC/timestamp/nonce/request-ID; scaled-time PAST=6 s/FUTURE=2 s, success_only, H1T1N1R0.',
@@ -443,15 +496,15 @@ for stem,srcs in sources.items():
     manifest.append(f"| Figure | {outputs} | {source_text} | `python paper/generate_paper_assets.py` | {caption_map[stem]} |")
 table_sources={
 'T1-scenarios':f2_sources,
-'T2':list(dict.fromkeys([latest_b_csv(run,cfg,policy) for run in ('B-S10-fast-R0','B-S10-fast-R1','B-S10-late-R0','B-S10-late-R1') for cfg in configs if cfg.endswith('R0' if run.endswith('R0') else 'R1') for policy in (['success_only','any_outcome'] if run.endswith('R1') else ['success_only'])]+['experiments/results/s10-policy-resubmit/requests.csv'])),
-'T2-full':list(dict.fromkeys([latest_b_csv(run,cfg,policy) for run in ('B-S10-fast-R0','B-S10-fast-R1','B-S10-late-R0','B-S10-late-R1') for cfg in configs if cfg.endswith('R0' if run.endswith('R0') else 'R1') for policy in (['success_only','any_outcome'] if run.endswith('R1') else ['success_only'])]+['experiments/results/s10-policy-resubmit/requests.csv'])),
+'T2':[s10_path,s10_summary_path,resub_path],
+'T2-full':[s10_path,s10_summary_path],
 'T3-layer-cost':e2_source_files,'T4-failure-modes':[e4b_path,e4c_path],
 'T5-e1-coverage':f2_sources }
 for name,srcs in table_sources.items():
     existing=[s for s in srcs if (ROOT/s).is_file()]
     source_text='; '.join(f'{s} (SHA-256 {sha(s)})' for s in existing) or '; '.join(srcs)+' (request CSVs selected by configuration in generator)'
     if name in ('T1-scenarios','T2','T2-full','T5-e1-coverage'):
-        caption='Scenario counts and outcomes are recomputed from raw rows; attacker A lacks the session key, B has bearer token only, and C has leaked key; H/T/N/R denote HMAC/timestamp/nonce/request-ID; scaled-time except Round F default-window S10/S11; success_only except policy rows.'
+        caption='Attacker A observes traffic without the session key, B has bearer token only, and C has leaked key; H/T/N/R denote HMAC/timestamp/nonce/request-ID. E1 v3 uses PAST=6 s/FUTURE=2 s/NONCE_TTL=8 s; S10 is independent 30-trial data; S11 has 100 attempts; success_only except the explicit any_outcome rows.'
     elif name=='T3-layer-cost': caption=f"n=10 repeats per backend, each {e2_meta['measuredRequests']} requests after {e2_meta['warmupRequests']} warm-ups; localhost; attacker not applicable; all H/T/N/R on; success_only."
     else: caption='E4b n=30 per mode/request-ID case; E4c n=200 per loss/order/retry case; attacker A is a network observer without the session key; H/T/N/R denote the four defenses; E4 scaled-time/failure profile; success_only. The omitted E4c client-failure-after-debit count equals lost responses in the raw summary and is nonzero in loss cases.'
     manifest.append(f"| Table | `paper/tables/{name}.tex` | {source_text} | `python paper/generate_paper_assets.py` | {caption} |")
```

### paper/previews/F2-e1-coverage-double.png
Binary artifact changed; source data and generator are documented above.

### paper/previews/F2-e1-coverage-single.png
Binary artifact changed; source data and generator are documented above.

### paper/previews/F3b-default-TTL-gap.png
Binary artifact changed; source data and generator are documented above.

### paper/previews/F5-E2-layer-cost.png
Binary artifact changed; source data and generator are documented above.

### paper/tables/T1-scenarios.tex
```diff
diff --git a/paper/tables/T1-scenarios.tex b/paper/tables/T1-scenarios.tex
index 9b18d87..e8b703c 100644
--- a/paper/tables/T1-scenarios.tex
+++ b/paper/tables/T1-scenarios.tex
@@ -1,9 +1,9 @@
 \begin{table*}[t]
 \centering
 \small
-\begin{tabular}{lccc}
+\begin{tabular}{lp{4.2in}cc}
 \toprule
-Scenario & Description & Attacker & Attempts n \\
+Scenario & Description & Attacker & Attempts $n$ \\
 \midrule
 S1 & Immediate exact replay & A & 30 \\
 S2 & Delayed exact replay inside timestamp window & A & 30 \\
@@ -15,8 +15,8 @@ S7a & Request ID modified; original signature retained & A & 30 \\
 S7b & Nonce modified; original signature retained & A & 30 \\
 S8 & Expired session bearer token & A & 30 \\
 S9 & Fresh forgery with leaked session key & C & 30 \\
-S10 fast & Failed withdrawal replay inside nonce and timestamp windows & A & 100 \\
-S10 late & Failed withdrawal replay after nonce TTL and timestamp window & A & 100 \\
+S10 fast & Independent failed withdrawals replayed once after 1 s; funded balance 3,002; amount 100 & A & 30 \\
+S10 late & Independent failed withdrawals replayed once after 9 s; nonce TTL 8 s and past window 6 s & A & 30 \\
 S11 & Captured bearer token, without session signing key & B & 100 \\
 \bottomrule
 \end{tabular}
```

### paper/tables/T2-full.tex
```diff
diff --git a/paper/tables/T2-full.tex b/paper/tables/T2-full.tex
index 274252c..4f097c4 100644
--- a/paper/tables/T2-full.tex
+++ b/paper/tables/T2-full.tex
@@ -1,62 +1,58 @@
 \begin{table*}[t]
 \centering
 \small
-\begin{tabular}{lccccc}
+\begin{tabular}{lcccc}
 \toprule
-Scenario & Configuration / retry & Policy & Successes & Attempts & Wilson 95\% \\
+Policy & Configuration & Scenario & Delayed executions / n & Wilson 95\% \\
 \midrule
-S10\_fast & H0T0N0R0 & success\_only & 5 & 100 & 0.022–0.112 \\
-S10\_fast & H0T0N1R0 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H0T1N0R0 & success\_only & 5 & 100 & 0.022–0.112 \\
-S10\_fast & H0T1N1R0 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H1T0N0R0 & success\_only & 5 & 100 & 0.022–0.112 \\
-S10\_fast & H1T0N1R0 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H1T1N0R0 & success\_only & 5 & 100 & 0.022–0.112 \\
-S10\_fast & H1T1N1R0 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H0T0N0R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H0T0N0R1 & success\_only & 1 & 100 & 0.002–0.054 \\
-S10\_fast & H0T0N1R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H0T0N1R1 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H0T1N0R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H0T1N0R1 & success\_only & 1 & 100 & 0.002–0.054 \\
-S10\_fast & H0T1N1R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H0T1N1R1 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H1T0N0R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H1T0N0R1 & success\_only & 1 & 100 & 0.002–0.054 \\
-S10\_fast & H1T0N1R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H1T0N1R1 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H1T1N0R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H1T1N0R1 & success\_only & 1 & 100 & 0.002–0.054 \\
-S10\_fast & H1T1N1R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_fast & H1T1N1R1 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_late & H0T0N0R0 & success\_only & 5 & 100 & 0.022–0.112 \\
-S10\_late & H0T0N1R0 & success\_only & 1 & 100 & 0.002–0.054 \\
-S10\_late & H0T1N0R0 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_late & H0T1N1R0 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_late & H1T0N0R0 & success\_only & 5 & 100 & 0.022–0.112 \\
-S10\_late & H1T0N1R0 & success\_only & 1 & 100 & 0.002–0.054 \\
-S10\_late & H1T1N0R0 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_late & H1T1N1R0 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_late & H0T0N0R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_late & H0T0N0R1 & success\_only & 1 & 100 & 0.002–0.054 \\
-S10\_late & H0T0N1R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_late & H0T0N1R1 & success\_only & 1 & 100 & 0.002–0.054 \\
-S10\_late & H0T1N0R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_late & H0T1N0R1 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_late & H0T1N1R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_late & H0T1N1R1 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_late & H1T0N0R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_late & H1T0N0R1 & success\_only & 1 & 100 & 0.002–0.054 \\
-S10\_late & H1T0N1R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_late & H1T0N1R1 & success\_only & 1 & 100 & 0.002–0.054 \\
-S10\_late & H1T1N0R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_late & H1T1N0R1 & success\_only & 0 & 100 & 0.000–0.037 \\
-S10\_late & H1T1N1R1 & any\_outcome & 0 & 100 & 0.000–0.037 \\
-S10\_late & H1T1N1R1 & success\_only & 0 & 100 & 0.000–0.037 \\
-resubmission after funding & new\_request\_id\_fresh\_nonce & any\_outcome & 30 & 30 & 0.886–1.000 \\
-resubmission after funding & same\_request\_id\_fresh\_nonce & any\_outcome & 0 & 30 & 0.000–0.114 \\
-resubmission after funding & new\_request\_id\_fresh\_nonce & success\_only & 30 & 30 & 0.886–1.000 \\
-resubmission after funding & same\_request\_id\_fresh\_nonce & success\_only & 30 & 30 & 0.886–1.000 \\
+success\_only & H0T0N0R0 & fast & 30/30 & 0.886–1.000 \\
+success\_only & H1T0N0R0 & fast & 30/30 & 0.886–1.000 \\
+success\_only & H0T1N0R0 & fast & 30/30 & 0.886–1.000 \\
+success\_only & H1T1N0R0 & fast & 30/30 & 0.886–1.000 \\
+success\_only & H0T0N1R0 & fast & 0/30 & 0.000–0.114 \\
+success\_only & H1T0N1R0 & fast & 0/30 & 0.000–0.114 \\
+success\_only & H0T1N1R0 & fast & 0/30 & 0.000–0.114 \\
+success\_only & H1T1N1R0 & fast & 0/30 & 0.000–0.114 \\
+success\_only & H0T0N0R1 & fast & 30/30 & 0.886–1.000 \\
+any\_outcome & H0T0N0R1 & fast & 0/30 & 0.000–0.114 \\
+success\_only & H1T0N0R1 & fast & 30/30 & 0.886–1.000 \\
+any\_outcome & H1T0N0R1 & fast & 0/30 & 0.000–0.114 \\
+success\_only & H0T1N0R1 & fast & 30/30 & 0.886–1.000 \\
+any\_outcome & H0T1N0R1 & fast & 0/30 & 0.000–0.114 \\
+success\_only & H1T1N0R1 & fast & 30/30 & 0.886–1.000 \\
+any\_outcome & H1T1N0R1 & fast & 0/30 & 0.000–0.114 \\
+success\_only & H0T0N1R1 & fast & 0/30 & 0.000–0.114 \\
+any\_outcome & H0T0N1R1 & fast & 0/30 & 0.000–0.114 \\
+success\_only & H1T0N1R1 & fast & 0/30 & 0.000–0.114 \\
+any\_outcome & H1T0N1R1 & fast & 0/30 & 0.000–0.114 \\
+success\_only & H0T1N1R1 & fast & 0/30 & 0.000–0.114 \\
+any\_outcome & H0T1N1R1 & fast & 0/30 & 0.000–0.114 \\
+success\_only & H1T1N1R1 & fast & 0/30 & 0.000–0.114 \\
+any\_outcome & H1T1N1R1 & fast & 0/30 & 0.000–0.114 \\
+success\_only & H0T0N0R0 & late & 30/30 & 0.886–1.000 \\
+success\_only & H1T0N0R0 & late & 30/30 & 0.886–1.000 \\
+success\_only & H0T1N0R0 & late & 0/30 & 0.000–0.114 \\
+success\_only & H1T1N0R0 & late & 0/30 & 0.000–0.114 \\
+success\_only & H0T0N1R0 & late & 30/30 & 0.886–1.000 \\
+success\_only & H1T0N1R0 & late & 30/30 & 0.886–1.000 \\
+success\_only & H0T1N1R0 & late & 0/30 & 0.000–0.114 \\
+success\_only & H1T1N1R0 & late & 0/30 & 0.000–0.114 \\
+success\_only & H0T0N0R1 & late & 30/30 & 0.886–1.000 \\
+any\_outcome & H0T0N0R1 & late & 0/30 & 0.000–0.114 \\
+success\_only & H1T0N0R1 & late & 30/30 & 0.886–1.000 \\
+any\_outcome & H1T0N0R1 & late & 0/30 & 0.000–0.114 \\
+success\_only & H0T1N0R1 & late & 0/30 & 0.000–0.114 \\
+any\_outcome & H0T1N0R1 & late & 0/30 & 0.000–0.114 \\
+success\_only & H1T1N0R1 & late & 0/30 & 0.000–0.114 \\
+any\_outcome & H1T1N0R1 & late & 0/30 & 0.000–0.114 \\
+success\_only & H0T0N1R1 & late & 30/30 & 0.886–1.000 \\
+any\_outcome & H0T0N1R1 & late & 0/30 & 0.000–0.114 \\
+success\_only & H1T0N1R1 & late & 30/30 & 0.886–1.000 \\
+any\_outcome & H1T0N1R1 & late & 0/30 & 0.000–0.114 \\
+success\_only & H0T1N1R1 & late & 0/30 & 0.000–0.114 \\
+any\_outcome & H0T1N1R1 & late & 0/30 & 0.000–0.114 \\
+success\_only & H1T1N1R1 & late & 0/30 & 0.000–0.114 \\
+any\_outcome & H1T1N1R1 & late & 0/30 & 0.000–0.114 \\
 \bottomrule
 \end{tabular}
 \end{table*}
```

### paper/tables/T2.tex
```diff
diff --git a/paper/tables/T2.tex b/paper/tables/T2.tex
index a3a48e5..1ac2074 100644
--- a/paper/tables/T2.tex
+++ b/paper/tables/T2.tex
@@ -1,38 +1,27 @@
 \begin{table*}[t]
 \centering
 \small
-\begin{tabular}{lcccc}
+\setlength{\tabcolsep}{2pt}
+\begin{tabular}{lp{0.68in}p{1.38in}p{1.30in}p{1.30in}p{1.15in}}
 \toprule
-Policy & Request-ID / freshness & Scenario & Successes / n (Wilson 95\%) & Configuration scope \\
+Policy & Request-ID / freshness & Configuration(s) & S10 fast k/n (Wilson 95\%) & S10 late k/n (Wilson 95\%) & Resubmission success (Wilson 95\%) \\
 \midrule
-success\_only & R on; none & fast & 2/200 [0.003, 0.036] & pooled H0/H1 \\
-success\_only & R on; none & late & 2/200 [0.003, 0.036] & pooled H0/H1 \\
-success\_only & R on; T only & fast & 2/200 [0.003, 0.036] & pooled H0/H1 \\
-success\_only & R on; T only & late & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-success\_only & R on; N only & fast & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-success\_only & R on; N only & late & 2/200 [0.003, 0.036] & pooled H0/H1 \\
-success\_only & R on; T and N & fast & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-success\_only & R on; T and N & late & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-success\_only & R off; none & fast & 10/200 [0.027, 0.090] & pooled H0/H1 \\
-success\_only & R off; none & late & 10/200 [0.027, 0.090] & pooled H0/H1 \\
-success\_only & R off; T only & fast & 10/200 [0.027, 0.090] & pooled H0/H1 \\
-success\_only & R off; T only & late & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-success\_only & R off; N only & fast & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-success\_only & R off; N only & late & 2/200 [0.003, 0.036] & pooled H0/H1 \\
-success\_only & R off; T and N & fast & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-success\_only & R off; T and N & late & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-any\_outcome & R on; none & fast & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-any\_outcome & R on; none & late & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-any\_outcome & R on; T only & fast & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-any\_outcome & R on; T only & late & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-any\_outcome & R on; N only & fast & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-any\_outcome & R on; N only & late & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-any\_outcome & R on; T and N & fast & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-any\_outcome & R on; T and N & late & 0/200 [0.000, 0.019] & pooled H0/H1 \\
-any\_outcome & After funding & new\_request\_id\_fresh\_nonce & 30/30 [0.886, 1.000] & resubmission trials \\
-any\_outcome & After funding & same\_request\_id\_fresh\_nonce & 0/30 [0.000, 0.114] & resubmission trials \\
-success\_only & After funding & new\_request\_id\_fresh\_nonce & 30/30 [0.886, 1.000] & resubmission trials \\
-success\_only & After funding & same\_request\_id\_fresh\_nonce & 30/30 [0.886, 1.000] & resubmission trials \\
+success\_only & R0; No T/N & H0T0N0R0, H1T0N0R0 (H0/H1 identical) & 30/30 [0.886, 1.000] & 30/30 [0.886, 1.000] &  \\
+success\_only & R0; T only & H0T1N0R0, H1T1N0R0 (H0/H1 identical) & 30/30 [0.886, 1.000] & 0/30 [0.000, 0.114] &  \\
+success\_only & R0; N only & H0T0N1R0, H1T0N1R0 (H0/H1 identical) & 0/30 [0.000, 0.114] & 30/30 [0.886, 1.000] &  \\
+success\_only & R0; T and N & H0T1N1R0, H1T1N1R0 (H0/H1 identical) & 0/30 [0.000, 0.114] & 0/30 [0.000, 0.114] &  \\
+success\_only & R1; No T/N & H0T0N0R1, H1T0N0R1 (H0/H1 identical) & 30/30 [0.886, 1.000] & 30/30 [0.886, 1.000] &  \\
+success\_only & R1; T only & H0T1N0R1, H1T1N0R1 (H0/H1 identical) & 30/30 [0.886, 1.000] & 0/30 [0.000, 0.114] &  \\
+success\_only & R1; N only & H0T0N1R1, H1T0N1R1 (H0/H1 identical) & 0/30 [0.000, 0.114] & 30/30 [0.886, 1.000] &  \\
+success\_only & R1; T and N & H0T1N1R1, H1T1N1R1 (H0/H1 identical) & 0/30 [0.000, 0.114] & 0/30 [0.000, 0.114] &  \\
+any\_outcome & R1; No T/N & H0T0N0R1, H1T0N0R1 (H0/H1 identical) & 0/30 [0.000, 0.114] & 0/30 [0.000, 0.114] &  \\
+any\_outcome & R1; T only & H0T1N0R1, H1T1N0R1 (H0/H1 identical) & 0/30 [0.000, 0.114] & 0/30 [0.000, 0.114] &  \\
+any\_outcome & R1; N only & H0T0N1R1, H1T0N1R1 (H0/H1 identical) & 0/30 [0.000, 0.114] & 0/30 [0.000, 0.114] &  \\
+any\_outcome & R1; T and N & H0T1N1R1, H1T1N1R1 (H0/H1 identical) & 0/30 [0.000, 0.114] & 0/30 [0.000, 0.114] &  \\
+any\_outcome & After funding & new\_request\_id\_fresh\_nonce & N/A & N/A & 30/30 [0.886, 1.000] \\
+any\_outcome & After funding & same\_request\_id\_fresh\_nonce & N/A & N/A & 0/30 [0.000, 0.114] \\
+success\_only & After funding & new\_request\_id\_fresh\_nonce & N/A & N/A & 30/30 [0.886, 1.000] \\
+success\_only & After funding & same\_request\_id\_fresh\_nonce & N/A & N/A & 30/30 [0.886, 1.000] \\
 \bottomrule
 \end{tabular}
 \end{table*}
```

### paper/tables/T4-failure-modes.tex
```diff
diff --git a/paper/tables/T4-failure-modes.tex b/paper/tables/T4-failure-modes.tex
index df8ae1e..6d3744c 100644
--- a/paper/tables/T4-failure-modes.tex
+++ b/paper/tables/T4-failure-modes.tex
@@ -1,27 +1,28 @@
 \begin{table*}[t]
 \centering
 \small
-\caption*{E4c client failure after debit is not zero in the saved data: its summary count equals the lost-response count for each loss case. The requested table omits this separate column; see source CSV and summary fields.}
-\begin{tabular}{lccccccc}
+\caption*{For E4b, the first two outcome columns are legitimate requests accepted and replay requests accepted, each out of 30 with Wilson 95% intervals. For E4c, failures after debit equal the lost-response count by construction; the table reports lost responses, retry reasons, exactly-once debit count, and retries that reveal prior success.}
+\setlength{\tabcolsep}{1.5pt}
+\begin{tabular}{lp{0.47in}p{0.61in}p{0.75in}p{0.76in}p{0.76in}p{0.49in}p{0.75in}p{0.70in}p{0.49in}}
 \toprule
-Experiment & Mode / loss p & Request-ID / check order & Legitimate accepted / retry type & Replay accepted / lost responses & Retry reason counts & Exactly one debit & Client can infer success \\
+Experiment & Mode / loss p & Request-ID / check order & Retry type & Legitimate accepted (k/30, Wilson 95\%) & Replay accepted (k/30, Wilson 95\%) & Lost responses (of 200) & Retry reason counts & Debited exactly once (k/200) & Retries infer success (k) \\
 \midrule
-E4b & fail-closed & off & 0/30 [0.000, 0.114] & 0/30 [0.000, 0.114] &  &  &  \\
-E4b & fail-closed & on & 0/30 [0.000, 0.114] & 0/30 [0.000, 0.114] &  &  &  \\
-E4b & fail-open & off & 30/30 [0.886, 1.000] & 30/30 [0.886, 1.000] &  &  &  \\
-E4b & fail-open & on & 30/30 [0.886, 1.000] & 0/30 [0.000, 0.114] &  &  &  \\
-E4c & p=0 & default & fresh nonce, same request\_id & 0/200 & {"not\_retried": 200} & 200/200 & 0 \\
-E4c & p=0 & default & identical signed request & 0/200 & {"not\_retried": 200} & 200/200 & 0 \\
-E4c & p=0 & request-ID first & fresh nonce, same request\_id & 0/200 & {"not\_retried": 200} & 200/200 & 0 \\
-E4c & p=0 & request-ID first & identical signed request & 0/200 & {"not\_retried": 200} & 200/200 & 0 \\
-E4c & p=0.05 & default & fresh nonce, same request\_id & 3/200 & {"ALREADY\_PROCESSED": 3, "not\_retried": 197} & 200/200 & 3 \\
-E4c & p=0.05 & default & identical signed request & 3/200 & {"NONCE\_FAIL": 3, "not\_retried": 197} & 200/200 & 0 \\
-E4c & p=0.05 & request-ID first & fresh nonce, same request\_id & 3/200 & {"ALREADY\_PROCESSED": 3, "not\_retried": 197} & 200/200 & 3 \\
-E4c & p=0.05 & request-ID first & identical signed request & 3/200 & {"ALREADY\_PROCESSED": 3, "not\_retried": 197} & 200/200 & 3 \\
-E4c & p=0.2 & default & fresh nonce, same request\_id & 44/200 & {"ALREADY\_PROCESSED": 44, "not\_retried": 156} & 200/200 & 44 \\
-E4c & p=0.2 & default & identical signed request & 44/200 & {"NONCE\_FAIL": 44, "not\_retried": 156} & 200/200 & 0 \\
-E4c & p=0.2 & request-ID first & fresh nonce, same request\_id & 44/200 & {"ALREADY\_PROCESSED": 44, "not\_retried": 156} & 200/200 & 44 \\
-E4c & p=0.2 & request-ID first & identical signed request & 44/200 & {"ALREADY\_PROCESSED": 44, "not\_retried": 156} & 200/200 & 44 \\
+E4b & fail-closed & off &  & 0/30 [0.000, 0.114] & 0/30 [0.000, 0.114] &  &  &  &  \\
+E4b & fail-closed & on &  & 0/30 [0.000, 0.114] & 0/30 [0.000, 0.114] &  &  &  &  \\
+E4b & fail-open & off &  & 30/30 [0.886, 1.000] & 30/30 [0.886, 1.000] &  &  &  &  \\
+E4b & fail-open & on &  & 30/30 [0.886, 1.000] & 0/30 [0.000, 0.114] &  &  &  &  \\
+E4c & p=0 & default & fresh nonce, same request\_id &  &  & 0/200 & not\_retried:200 & 200/200 & 0 \\
+E4c & p=0 & default & identical signed request &  &  & 0/200 & not\_retried:200 & 200/200 & 0 \\
+E4c & p=0 & request-ID first & fresh nonce, same request\_id &  &  & 0/200 & not\_retried:200 & 200/200 & 0 \\
+E4c & p=0 & request-ID first & identical signed request &  &  & 0/200 & not\_retried:200 & 200/200 & 0 \\
+E4c & p=0.05 & default & fresh nonce, same request\_id &  &  & 10/200 & ALREADY\_PROCESSED:10; not\_retried:190 & 200/200 & 10 \\
+E4c & p=0.05 & default & identical signed request &  &  & 10/200 & NONCE\_FAIL:10; not\_retried:190 & 200/200 & 0 \\
+E4c & p=0.05 & request-ID first & fresh nonce, same request\_id &  &  & 10/200 & ALREADY\_PROCESSED:10; not\_retried:190 & 200/200 & 10 \\
+E4c & p=0.05 & request-ID first & identical signed request &  &  & 10/200 & ALREADY\_PROCESSED:10; not\_retried:190 & 200/200 & 10 \\
+E4c & p=0.2 & default & fresh nonce, same request\_id &  &  & 40/200 & ALREADY\_PROCESSED:40; not\_retried:160 & 200/200 & 40 \\
+E4c & p=0.2 & default & identical signed request &  &  & 40/200 & NONCE\_FAIL:40; not\_retried:160 & 200/200 & 0 \\
+E4c & p=0.2 & request-ID first & fresh nonce, same request\_id &  &  & 40/200 & ALREADY\_PROCESSED:40; not\_retried:160 & 200/200 & 40 \\
+E4c & p=0.2 & request-ID first & identical signed request &  &  & 40/200 & ALREADY\_PROCESSED:40; not\_retried:160 & 200/200 & 40 \\
 \bottomrule
 \end{tabular}
 \end{table*}
```

### paper/tables/T5-e1-coverage.tex
```diff
diff --git a/paper/tables/T5-e1-coverage.tex b/paper/tables/T5-e1-coverage.tex
index 3401474..672ecac 100644
--- a/paper/tables/T5-e1-coverage.tex
+++ b/paper/tables/T5-e1-coverage.tex
@@ -3,22 +3,22 @@
 \small
 \begin{tabular}{lccccccccccc}
 \toprule
-Config & S1 (n=30) & S2 (n=30) & S3 (n=30) & S4 (n=30) & S5 (n=1500) & S6 (n=30) & S7a (n=30) & S7b (n=30) & S10f (n=100) & S10l (n=100) & S11 (n=100) \\
+Config & S1 (n=30) & S2 (n=30) & S3 (n=30) & S4 (n=30) & S5 (n=1500) & S6 (n=30) & S7a (n=30) & S7b (n=30) & S10f (n=30) & S10l (n=30) & S11 (n=100) \\
 \midrule
-H0T0N0R0 & 30 & 30 & 30 & 30 & 1500 & 30 & 30 & 30 & 5 & 5 & 100 \\
-H0T0N0R1 & 0 & 0 & 0 & 0 & 0 & 0 & 30 & 0 & 1 & 1 & 100 \\
-H0T0N1R0 & 0 & 0 & 30 & 30 & 0 & 0 & 0 & 30 & 0 & 1 & 100 \\
-H0T0N1R1 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 1 & 100 \\
-H0T1N0R0 & 30 & 30 & 30 & 0 & 1500 & 30 & 30 & 30 & 5 & 0 & 100 \\
-H0T1N0R1 & 0 & 0 & 0 & 0 & 0 & 0 & 30 & 0 & 1 & 0 & 100 \\
+H0T0N0R0 & 30 & 30 & 30 & 30 & 1500 & 30 & 30 & 30 & 30 & 30 & 100 \\
+H0T0N0R1 & 0 & 0 & 0 & 0 & 0 & 0 & 30 & 0 & 30 & 30 & 100 \\
+H0T0N1R0 & 0 & 0 & 30 & 0 & 0 & 0 & 0 & 30 & 0 & 30 & 100 \\
+H0T0N1R1 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 30 & 100 \\
+H0T1N0R0 & 30 & 30 & 30 & 0 & 1500 & 30 & 30 & 30 & 30 & 0 & 100 \\
+H0T1N0R1 & 0 & 0 & 0 & 0 & 0 & 0 & 30 & 0 & 30 & 0 & 100 \\
 H0T1N1R0 & 0 & 0 & 30 & 0 & 0 & 0 & 0 & 30 & 0 & 0 & 100 \\
 H0T1N1R1 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 100 \\
-H1T0N0R0 & 30 & 30 & 30 & 30 & 1500 & 0 & 0 & 0 & 5 & 5 & 0 \\
-H1T0N0R1 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 1 & 1 & 0 \\
-H1T0N1R0 & 0 & 0 & 30 & 30 & 0 & 0 & 0 & 0 & 0 & 1 & 0 \\
-H1T0N1R1 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 1 & 0 \\
-H1T1N0R0 & 30 & 30 & 30 & 0 & 1500 & 0 & 0 & 0 & 5 & 0 & 0 \\
-H1T1N0R1 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 1 & 0 & 0 \\
+H1T0N0R0 & 30 & 30 & 30 & 30 & 1500 & 0 & 0 & 0 & 30 & 30 & 0 \\
+H1T0N0R1 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 30 & 30 & 0 \\
+H1T0N1R0 & 0 & 0 & 30 & 0 & 0 & 0 & 0 & 0 & 0 & 30 & 0 \\
+H1T0N1R1 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 30 & 0 \\
+H1T1N0R0 & 30 & 30 & 30 & 0 & 1500 & 0 & 0 & 0 & 30 & 0 & 0 \\
+H1T1N0R1 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 30 & 0 & 0 \\
 H1T1N1R0 & 0 & 0 & 30 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 \\
 H1T1N1R1 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 \\
 \bottomrule
```

### server/test/integration.test.js
```diff
diff --git a/server/test/integration.test.js b/server/test/integration.test.js
index 514f911..9c0938d 100644
--- a/server/test/integration.test.js
+++ b/server/test/integration.test.js
@@ -4,8 +4,8 @@ const os = require('os');
 const path = require('path');
 const crypto = require('crypto');
 const fs = require('fs');
-const phase3ResultDirectory = path.resolve(__dirname, '../../experiments/results/phase3');
-fs.mkdirSync(phase3ResultDirectory, { recursive: true });
+const testArtifactDirectory = path.resolve(process.env.TEST_ARTIFACT_DIR || path.join(os.tmpdir(), `cs-project-tests-${process.pid}`));
+fs.mkdirSync(testArtifactDirectory, { recursive: true });
 
 process.env.SQLITE_DB = path.join(os.tmpdir(), `cs-project-phase3-${process.pid}-${crypto.randomUUID()}.sqlite`);
 process.env.NONCE_STORE = 'memory';
@@ -20,7 +20,7 @@ process.env.DEFENSE_REQUEST_ID = 'true';
 process.env.TIMESTAMP_PAST_WINDOW_SECONDS = '300';
 process.env.TIMESTAMP_FUTURE_WINDOW_SECONDS = '5';
 process.env.ENABLE_TEST_FAULT_ROUTE = 'true';
-process.env.EXPERIMENT_LOG = path.join(phase3ResultDirectory, `layer-timings-${process.pid}.csv`);
+process.env.EXPERIMENT_LOG = path.join(testArtifactDirectory, `layer-timings-${process.pid}.csv`);
 process.env.CONFIG_ID = 'phase3-default-defenses';
 process.env.SCENARIO_ID = 'integration-suite';
 process.env.RUN_ID = `windows-node-test-${process.pid}`;
@@ -192,7 +192,7 @@ test('future and past timestamp edges repeat 30 times and save per-request timin
       rows.push({ label: item.label, repetition, offset_ms: item.offsetMs, ...result, outcome });
     }
   }
-  const output = path.resolve(__dirname, '../../experiments/results/corrections');
+  const output = testArtifactDirectory;
   fs.mkdirSync(output, { recursive: true });
   fs.writeFileSync(path.join(output, 'timestamp-boundaries-30-each.csv'), [
     'label,repetition,offset_ms,started_ns,ended_ns,duration_ns,http_status,outcome',
@@ -221,7 +221,7 @@ test('Phase 0 client clock offsets repeat 30 times per offset and save per-reque
       rows.push({ label: item.label, repetition, offset_ms: item.offsetMs, ...result, outcome });
     }
   }
-  const output = path.resolve(__dirname, '../../experiments/results/corrections');
+  const output = testArtifactDirectory;
   fs.mkdirSync(output, { recursive: true });
   fs.writeFileSync(path.join(output, 'clock-offsets-30-each.csv'), [
     'label,repetition,offset_ms,started_ns,ended_ns,duration_ns,http_status,outcome',
@@ -266,6 +266,40 @@ test('50 valid nonces racing on one request ID produce one debit', async () => {
   assert.equal(balance.data.balance, 9999);
 });
 
+test('route binding rejects a correctly signed request sent to the other transaction route', async () => {
+  await reset();
+  const deposit = payload({ path: '/api/deposit', request_id: 'route-deposit-as-withdraw', amount: 1 });
+  const withdraw = payload({ path: '/api/withdraw', request_id: 'route-withdraw-as-deposit', amount: 1 });
+  assert.deepEqual((await call('POST', '/api/withdraw', deposit)).data, { error: 'INVALID_REQUEST' });
+  assert.deepEqual((await call('POST', '/api/deposit', withdraw)).data, { error: 'INVALID_REQUEST' });
+  const rows = await new Promise((resolve, reject) => db.all('SELECT request_id FROM transactions WHERE request_id IN (?, ?)', [deposit.request_id, withdraw.request_id], (error, result) => error ? reject(error) : resolve(result)));
+  assert.deepEqual(rows, []);
+});
+
+test('parallel withdrawals preserve atomic balance invariants', async () => {
+  await reset();
+  await new Promise((resolve, reject) => db.run("UPDATE accounts SET balance=100 WHERE user_id='anis_101'", (error) => error ? reject(error) : resolve()));
+  const requests = Array.from({ length: 100 }, (_, index) => payload({
+    amount: index + 1,
+    nonce: `atomic-${index}`,
+    request_id: `atomic-${index}`
+  }));
+  const responses = await Promise.all(requests.map((request) => call('POST', '/api/withdraw', request)));
+  const rows = await new Promise((resolve, reject) => db.all("SELECT id, amount, status FROM transactions WHERE request_id LIKE 'atomic-%' ORDER BY id", (error, result) => error ? reject(error) : resolve(result)));
+  let balance = 100;
+  let minimum = balance;
+  let successSum = 0;
+  for (const row of rows) {
+    if (row.status === 'SUCCESS') { balance -= row.amount; successSum += row.amount; }
+    minimum = Math.min(minimum, balance);
+  }
+  const account = await new Promise((resolve, reject) => db.get("SELECT balance FROM accounts WHERE user_id='anis_101'", (error, result) => error ? reject(error) : resolve(result)));
+  assert.ok(responses.some((response) => response.data.status === 'ACCEPTED'));
+  assert.ok(minimum >= 0);
+  assert.ok(successSum <= 100);
+  assert.equal(account.balance + successSum, 100);
+});
+
 test('session authentication must match the signed user ID', async () => {
   await reset();
   const user = payload({ user_id: 'anis_101' });
```
