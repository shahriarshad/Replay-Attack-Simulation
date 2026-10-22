# Claims and Evidence

This is an evidence map, not a claim that each result generalizes beyond the local simulation. Row IDs refer to `PAPER_FACTS_CURATED.md`. Confidence intervals and measurement scope are preserved there and in the cited raw files.

| Candidate claim | Supporting curated fact rows | Evidence sufficient? | Caveats |
|---|---|---|---|
| 1. Each of the four REST layers is necessary (leave-one-out). | `E1/H1T1N1R1/*/debit`; compare to the corresponding leave-one-out configs `H0T1N1R1`, `H1T0N1R1`, `H1T1N0R1`, and `H1T1N1R0`; token-only evidence `E1/H*/S11/debit`. | **Limited, for the tested scenarios only.** The 16-cell ablation identifies cases where removing one layer changes an outcome. | Thirty attempts per ordinary scenario, deterministic local traffic, single Node process, and synthetic attack model. E1 is not a proof that every layer is necessary for every deployment or attacker. “None” still retains bearer authentication and ownership checks. |
| 2. Idempotency alone is insufficient against a replay of a previously failed request; policy trade-off. | E1 `S10_fast`/`S10_late` rows for `R1`; C2 rows `C2 success_only H1T1N1R1 S10_fast`, `... S10_late`, and `C2 any_outcome H1T1N1R1 ...`; resubmission variants `same_request_id_fresh_nonce` and `new_request_id_fresh_nonce`. | **Sufficient for the implemented retry policies and tested request flows.** | The original 30 replay attempts repeat one captured FAILED request. A nonce or timestamp layer may block before the request-ID layer; these outcomes are order dependent. C2 resubmission uses one selected full-defense configuration. |
| 3. Nonce TTL must be at least PAST + FUTURE. | `E4a H1T1N1R0-TTL4/f0..f2 replay_grid`, `E4a ... TTL6 ...`, `E4a ... TTL8 ...`; `E4a/request-ID-off/ttl-window-rule/violating_cells`. | **Moderate support for the tested time model.** The request-ID-off replay grid had zero rule-violating aggregate cells and the checked outcomes follow the sampled rule. | Scaled profile PAST=6 s, server FUTURE=2 s, offsets 0/1/2 s, and only the listed delays. For TTL4, delays 3 and 5 straddle the TTL boundary; delay 4 itself was not sampled. This supports a configuration rule, not a universal formal proof. |
| 4. Defense overhead and nonce backend cost. | `E2/*/legitimate/handler_p50_repeat_median`; `C5/all_four|nonce_redis|nonce_sqlite|nonce_memory/*`; `E2/*/reject-cost`. | **Sufficient for relative comparison in this setup.** | Single Windows machine, localhost, Memurai Developer 4.2.3, one Node process. Repeat medians show skew and outliers. Do not present these as production latency estimates. |
| 5. False rejections are dominated by FUTURE tolerance under the assumed profiles. | All 75 `E3 PAST-* FUTURE-* false-reject` rows plus the assumption rows `E3 P1|P2|P3|assumption|*`. | **Limited.** The sweep provides measured outcomes conditional on three explicit assumptions. | These distributions are assumptions, not empirical network traces. The claim is conditional on the chosen profile parameters, timestamp rule, serialization, and simulator. |
| 6. Fail-open/fail-closed and lost-response retry behavior. | `E4b fault-fail-open-* replay_availability_Wilson`, `E4b fault-fail-closed-* replay_availability_Wilson`, and all `E4c loss-p*` rows. | **Sufficient for the implemented fault toggle and tested retry patterns.** | Fault injection is an in-process test route. Response loss is simulated by dropping the client-observed first response after the server call, not by packet-level network failure. `NONCE_FAIL` alone does not confirm whether a debit occurred; `ALREADY_PROCESSED` follows the duplicate ID check in the tested order. |
| 7. Concurrency safety. | `Race|identical-payload|accepted-count-1`; `Race|secret-holder|one-request-id|accepted_and_balance_delta`. | **Moderate for the tested local concurrency cases.** | Repeated 1,000 times at width 50, plus one 50-request shared-ID secret-holder case. This does not establish safety under multi-process deployment, distributed databases, or arbitrary traffic. |
| 8. Nonce-store state size. | `Memory|accepted|baseline_subtracted_slope`; `Memory|requestid|baseline_subtracted_slope`; `E4d *-rps TTL-* memory`. | **Measured for Memurai 4.2.3 and derived for the table.** | The ~181 B/key slope is a local Memurai measurement. E4d is explicitly a linear extrapolation; it is not a measured deployment footprint. |

## Interpretation limits

- The baseline legitimate request generator holds the signing key. The replay attacker is modeled as a network observer without the key; S9 separately models leaked signing-key capability.
- The S11 token-only attacker holds a bearer token but lacks the session key. It demonstrates why HMAC cannot be disabled when bearer-only forgery is in scope.
- No claim here says anything about a real bank, telecom operator, or mobile financial service.
- Every numeric claim must be tied to the raw artifact path and SHA-256 in `PAPER_FACTS_CURATED.md`.

## Round F evidence update

- Claim 2 (failed-request idempotency trade-off): Round F 100-trial policy sweep reports S10_fast and S10_late for request-ID-on configurations. Under success_only, a delayed failed attempt can execute after later funding when the request-ID defense has not already consumed it as a success; under ny_outcome, failed rows consume the request ID and those tested retries were rejected. See the complete cells and Wilson intervals in [RESULTS_PACK_A.md](RESULTS_PACK_A.md), raw runs under experiments/results/round-f/B-S10-*. This supports the stated policy behavior for these tested conditions; timing and balances are harness-specific.
- Claim 3 (nonce TTL relative to the timestamp window): default-window A reproduces the tested gap only when request-ID is off: all 30 replays were accepted at 301 s and 303 s, while 299 s and 305/307 s were all blocked; A2 with request-ID on had zero accepted. See A/A2 tables and raw CSV hashes in [RESULTS_PACK_A.md](RESULTS_PACK_A.md). This demonstrates behavior at the tested default values; it does not establish a universal TTL inequality independent of defense ordering and request-ID.


Privacy note: SQLite signature-column values in the new Round F databases were nulled after the measured runs and ledger oracle queries. The audit was rerun after this sanitization and still matched all compared values.




## Round I claim scope

1. Four-layer leave-one-out evidence is scoped to E1 v3 (PAST=6 s, FUTURE=2 s, NONCE_TTL=8 s, SESSION_TTL=15 s, success_only). Ordinary S1-S9 use 30 attempts (S5 uses 1,500); S11 uses 100 attempts. “None” still retains session bearer authentication and account ownership.

2. The idempotency policy trade-off uses independent S10 trials: 30 distinct failed requests and one replay per failed request. Under success_only, retries can execute after funding if the other enabled freshness layer does not block them. Under any_outcome with request-ID on, the same request ID returned ALREADY_PROCESSED. The separate resubmission rows use 30 trials per policy and retry variant.

3. The scaled-time TTL result is reproduced: E1 v2 used the deliberately short, mis-configured 4 s TTL; E1 v3 uses 8 s with PAST=6 s and FUTURE=2 s. S4 changed only in the nonce-on/request-ID-off cells, where the v2 replay succeeded and v3 replay was blocked. This round did not rerun E4a or the default full-scale TTL-gap experiment.

See the Round I raw paths and hashes in RESULTS_PACK_A.md. Route binding and atomic debit were checked only in this local simulation; they do not establish multi-process production behavior.