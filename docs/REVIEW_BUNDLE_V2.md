# Review Bundle V2

The complete bundle is split because it exceeds 4 MB. Read the parts in numeric order. Each part repeats the shared file and line-count table.

Source HEAD: `ac6eefe60aea95aedce38ab52080317e9b274ec6`
Generated: 2026-10-18T19:00:32.955Z
Parts: [REVIEW_BUNDLE_V2_part1.md](REVIEW_BUNDLE_V2_part1.md), [REVIEW_BUNDLE_V2_part2.md](REVIEW_BUNDLE_V2_part2.md), [REVIEW_BUNDLE_V2_part3.md](REVIEW_BUNDLE_V2_part3.md), [REVIEW_BUNDLE_V2_part4.md](REVIEW_BUNDLE_V2_part4.md), [REVIEW_BUNDLE_V2_part5.md](REVIEW_BUNDLE_V2_part5.md), [REVIEW_BUNDLE_V2_part6.md](REVIEW_BUNDLE_V2_part6.md), [REVIEW_BUNDLE_V2_part7.md](REVIEW_BUNDLE_V2_part7.md)

# Shared table of contents

| File | Source line count | Bundle part and line range |
|---|---:|---|
| `attack/attack.sh` | 287 | REVIEW_BUNDLE_V2_part7.md:6630-6916 |
| `client/bank/src/App.jsx` | 109 | REVIEW_BUNDLE_V2_part7.md:6922-7030 |
| `client/bank/src/api.js` | 135 | REVIEW_BUNDLE_V2_part7.md:7036-7170 |
| `client/bank/src/components/BalanceDisplay.jsx` | 20 | REVIEW_BUNDLE_V2_part7.md:7176-7195 |
| `client/bank/src/components/DepositForm.jsx` | 43 | REVIEW_BUNDLE_V2_part7.md:7201-7243 |
| `client/bank/src/components/TransactionHistory.jsx` | 42 | REVIEW_BUNDLE_V2_part7.md:7249-7290 |
| `client/bank/src/components/WithdrawForm.jsx` | 44 | REVIEW_BUNDLE_V2_part7.md:7296-7339 |
| `client/bank/src/socket.js` | 6 | REVIEW_BUNDLE_V2_part7.md:7345-7350 |
| `client/bank/src/styles.css` | 201 | REVIEW_BUNDLE_V2_part7.md:7356-7556 |
| `docs/CLAIMS_EVIDENCE.md` | 22 | REVIEW_BUNDLE_V2_part7.md:7562-7583 |
| `docs/DEMO.md` | 99 | REVIEW_BUNDLE_V2_part7.md:7589-7687 |
| `docs/LIMITATIONS.md` | 31 | REVIEW_BUNDLE_V2_part7.md:7693-7723 |
| `docs/REPRODUCE.md` | 76 | REVIEW_BUNDLE_V2_part7.md:7729-7804 |
| `docs/THREAT_MODEL.md` | 26 | REVIEW_BUNDLE_V2_part7.md:7810-7835 |
| `experiments/audit-egress.js` | 72 | REVIEW_BUNDLE_V2_part7.md:7841-7912 |
| `experiments/audit/build-curated-facts.js` | 28 | REVIEW_BUNDLE_V2_part7.md:7918-7945 |
| `experiments/audit/build-policy-tradeoff.js` | 6 | REVIEW_BUNDLE_V2_part7.md:7951-7956 |
| `experiments/audit/build-results-pack-final.js` | 16 | REVIEW_BUNDLE_V2_part7.md:7962-7977 |
| `experiments/audit/check-e4a-rule.js` | 45 | REVIEW_BUNDLE_V2_part7.md:7983-8027 |
| `experiments/audit/make-e2-layer-table.js` | 13 | REVIEW_BUNDLE_V2_part7.md:8033-8045 |
| `experiments/audit/make-review-bundle-v2.js` | 200 | REVIEW_BUNDLE_V2_part7.md:8051-8250 |
| `experiments/audit/verify-results.js` | 43 | REVIEW_BUNDLE_V2_part7.md:8256-8298 |
| `experiments/e1/finalize-oracle-summary.js` | 63 | REVIEW_BUNDLE_V2_part7.md:8304-8366 |
| `experiments/e1/reconcile-oracle-amounts.js` | 33 | REVIEW_BUNDLE_V2_part7.md:8372-8404 |
| `experiments/e1/run-policy-resubmit.js` | 19 | REVIEW_BUNDLE_V2_part7.md:8410-8428 |
| `experiments/e1/run.js` | 357 | REVIEW_BUNDLE_V2_part7.md:8434-8790 |
| `experiments/e2/run.js` | 347 | REVIEW_BUNDLE_V2_part7.md:8796-9142 |
| `experiments/e3/run.js` | 56 | REVIEW_BUNDLE_V2_part7.md:9148-9203 |
| `experiments/e4/run.js` | 74 | REVIEW_BUNDLE_V2_part7.md:9209-9282 |
| `experiments/lib/http.js` | 37 | REVIEW_BUNDLE_V2_part7.md:9288-9324 |
| `experiments/recording-proxy.js` | 81 | REVIEW_BUNDLE_V2_part7.md:9330-9410 |
| `experiments/render-documentation.js` | 317 | REVIEW_BUNDLE_V2_part7.md:9416-9732 |
| `experiments/render-pack-a.py` | 80 | REVIEW_BUNDLE_V2_part7.md:9738-9817 |
| `experiments/render-v2-results.py` | 111 | REVIEW_BUNDLE_V2_part7.md:9823-9933 |
| `experiments/run-f1-races.js` | 79 | REVIEW_BUNDLE_V2_part7.md:9939-10017 |
| `experiments/run-nonce-memory.js` | 118 | REVIEW_BUNDLE_V2_part7.md:10023-10140 |
| `experiments/run-phase4.js` | 18 | REVIEW_BUNDLE_V2_part7.md:10146-10163 |
| `experiments/run-races.js` | 117 | REVIEW_BUNDLE_V2_part7.md:10169-10285 |
| `experiments/run-viz-curve.js` | 40 | REVIEW_BUNDLE_V2_part7.md:10291-10330 |
| `experiments/send-through-proxy.js` | 49 | REVIEW_BUNDLE_V2_part7.md:10336-10384 |
| `experiments/verify-demo-session-flow.js` | 49 | REVIEW_BUNDLE_V2_part7.md:10390-10438 |
| `experiments/write-paper-facts.js` | 26 | REVIEW_BUNDLE_V2_part7.md:10444-10469 |
| `experiments/write-results-pack-v2.js` | 115 | REVIEW_BUNDLE_V2_part7.md:10475-10589 |
| `experiments/write-results-pack.js` | 175 | REVIEW_BUNDLE_V2_part7.md:10595-10769 |
| `package.json` | 19 | REVIEW_BUNDLE_V2_part7.md:10775-10793 |
| `server/.env.example` | 23 | REVIEW_BUNDLE_V2_part7.md:10799-10821 |
| `server/core.js` | 601 | REVIEW_BUNDLE_V2_part7.md:10827-11427 |
| `server/package.json` | 25 | REVIEW_BUNDLE_V2_part7.md:11433-11457 |
| `server/server.js` | 10 | REVIEW_BUNDLE_V2_part7.md:11463-11472 |
| `server/test/idempotency-policy.test.js` | 10 | REVIEW_BUNDLE_V2_part7.md:11478-11487 |
| `server/test/integration.test.js` | 296 | REVIEW_BUNDLE_V2_part7.md:11493-11788 |
| `server/test/migration.test.js` | 53 | REVIEW_BUNDLE_V2_part7.md:11794-11846 |
| `server/test/proxy.test.js` | 64 | REVIEW_BUNDLE_V2_part7.md:11852-11915 |
| `server/test/route-gating.test.js` | 35 | REVIEW_BUNDLE_V2_part7.md:11921-11955 |
| `server/test/unit.test.js` | 157 | REVIEW_BUNDLE_V2_part7.md:11961-12117 |
| `server/utils/config-warnings.js` | 13 | REVIEW_BUNDLE_V2_part7.md:12123-12135 |
| `server/utils/hmac.js` | 39 | REVIEW_BUNDLE_V2_part7.md:12141-12179 |
| `server/utils/idempotency.js` | 38 | REVIEW_BUNDLE_V2_part7.md:12185-12222 |
| `server/utils/money-oracle.js` | 66 | REVIEW_BUNDLE_V2_part7.md:12228-12293 |
| `server/utils/nonce.js` | 123 | REVIEW_BUNDLE_V2_part7.md:12299-12421 |
| `server/utils/request.js` | 18 | REVIEW_BUNDLE_V2_part7.md:12427-12444 |
| `server/utils/timestamp.js` | 9 | REVIEW_BUNDLE_V2_part7.md:12450-12458 |
| `server/viz-server.js` | 63 | REVIEW_BUNDLE_V2_part7.md:12464-12526 |
