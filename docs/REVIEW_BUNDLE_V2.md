# Review Bundle V2

The complete bundle is split because it exceeds 4 MB. Read the parts in numeric order. Each part repeats the shared file and line-count table.

Source HEAD: `6133c6e6984aea0185f1cde37809dc880f68f4dc`
Generated: 2026-10-18T18:58:24.909Z
Parts: [REVIEW_BUNDLE_V2_part1.md](REVIEW_BUNDLE_V2_part1.md), [REVIEW_BUNDLE_V2_part2.md](REVIEW_BUNDLE_V2_part2.md), [REVIEW_BUNDLE_V2_part3.md](REVIEW_BUNDLE_V2_part3.md), [REVIEW_BUNDLE_V2_part4.md](REVIEW_BUNDLE_V2_part4.md), [REVIEW_BUNDLE_V2_part5.md](REVIEW_BUNDLE_V2_part5.md), [REVIEW_BUNDLE_V2_part6.md](REVIEW_BUNDLE_V2_part6.md), [REVIEW_BUNDLE_V2_part7.md](REVIEW_BUNDLE_V2_part7.md)

# Shared table of contents

| File | Source line count | Bundle part and line range |
|---|---:|---|
| `attack/attack.sh` | 287 | REVIEW_BUNDLE_V2_part7.md:6622-6908 |
| `client/bank/src/App.jsx` | 109 | REVIEW_BUNDLE_V2_part7.md:6914-7022 |
| `client/bank/src/api.js` | 135 | REVIEW_BUNDLE_V2_part7.md:7028-7162 |
| `client/bank/src/components/BalanceDisplay.jsx` | 20 | REVIEW_BUNDLE_V2_part7.md:7168-7187 |
| `client/bank/src/components/DepositForm.jsx` | 43 | REVIEW_BUNDLE_V2_part7.md:7193-7235 |
| `client/bank/src/components/TransactionHistory.jsx` | 42 | REVIEW_BUNDLE_V2_part7.md:7241-7282 |
| `client/bank/src/components/WithdrawForm.jsx` | 44 | REVIEW_BUNDLE_V2_part7.md:7288-7331 |
| `client/bank/src/socket.js` | 6 | REVIEW_BUNDLE_V2_part7.md:7337-7342 |
| `client/bank/src/styles.css` | 201 | REVIEW_BUNDLE_V2_part7.md:7348-7548 |
| `docs/CLAIMS_EVIDENCE.md` | 22 | REVIEW_BUNDLE_V2_part7.md:7554-7575 |
| `docs/DEMO.md` | 99 | REVIEW_BUNDLE_V2_part7.md:7581-7679 |
| `docs/LIMITATIONS.md` | 31 | REVIEW_BUNDLE_V2_part7.md:7685-7715 |
| `docs/REPRODUCE.md` | 76 | REVIEW_BUNDLE_V2_part7.md:7721-7796 |
| `docs/THREAT_MODEL.md` | 26 | REVIEW_BUNDLE_V2_part7.md:7802-7827 |
| `experiments/audit-egress.js` | 72 | REVIEW_BUNDLE_V2_part7.md:7833-7904 |
| `experiments/audit/build-curated-facts.js` | 28 | REVIEW_BUNDLE_V2_part7.md:7910-7937 |
| `experiments/audit/build-policy-tradeoff.js` | 6 | REVIEW_BUNDLE_V2_part7.md:7943-7948 |
| `experiments/audit/build-results-pack-final.js` | 16 | REVIEW_BUNDLE_V2_part7.md:7954-7969 |
| `experiments/audit/check-e4a-rule.js` | 45 | REVIEW_BUNDLE_V2_part7.md:7975-8019 |
| `experiments/audit/make-e2-layer-table.js` | 13 | REVIEW_BUNDLE_V2_part7.md:8025-8037 |
| `experiments/audit/make-review-bundle-v2.js` | 196 | REVIEW_BUNDLE_V2_part7.md:8043-8238 |
| `experiments/audit/verify-results.js` | 43 | REVIEW_BUNDLE_V2_part7.md:8244-8286 |
| `experiments/e1/finalize-oracle-summary.js` | 63 | REVIEW_BUNDLE_V2_part7.md:8292-8354 |
| `experiments/e1/reconcile-oracle-amounts.js` | 33 | REVIEW_BUNDLE_V2_part7.md:8360-8392 |
| `experiments/e1/run-policy-resubmit.js` | 19 | REVIEW_BUNDLE_V2_part7.md:8398-8416 |
| `experiments/e1/run.js` | 357 | REVIEW_BUNDLE_V2_part7.md:8422-8778 |
| `experiments/e2/run.js` | 347 | REVIEW_BUNDLE_V2_part7.md:8784-9130 |
| `experiments/e3/run.js` | 56 | REVIEW_BUNDLE_V2_part7.md:9136-9191 |
| `experiments/e4/run.js` | 74 | REVIEW_BUNDLE_V2_part7.md:9197-9270 |
| `experiments/lib/http.js` | 37 | REVIEW_BUNDLE_V2_part7.md:9276-9312 |
| `experiments/recording-proxy.js` | 81 | REVIEW_BUNDLE_V2_part7.md:9318-9398 |
| `experiments/render-documentation.js` | 317 | REVIEW_BUNDLE_V2_part7.md:9404-9720 |
| `experiments/render-pack-a.py` | 80 | REVIEW_BUNDLE_V2_part7.md:9726-9805 |
| `experiments/render-v2-results.py` | 111 | REVIEW_BUNDLE_V2_part7.md:9811-9921 |
| `experiments/run-f1-races.js` | 79 | REVIEW_BUNDLE_V2_part7.md:9927-10005 |
| `experiments/run-nonce-memory.js` | 118 | REVIEW_BUNDLE_V2_part7.md:10011-10128 |
| `experiments/run-phase4.js` | 18 | REVIEW_BUNDLE_V2_part7.md:10134-10151 |
| `experiments/run-races.js` | 117 | REVIEW_BUNDLE_V2_part7.md:10157-10273 |
| `experiments/run-viz-curve.js` | 40 | REVIEW_BUNDLE_V2_part7.md:10279-10318 |
| `experiments/send-through-proxy.js` | 49 | REVIEW_BUNDLE_V2_part7.md:10324-10372 |
| `experiments/verify-demo-session-flow.js` | 49 | REVIEW_BUNDLE_V2_part7.md:10378-10426 |
| `experiments/write-paper-facts.js` | 26 | REVIEW_BUNDLE_V2_part7.md:10432-10457 |
| `experiments/write-results-pack-v2.js` | 115 | REVIEW_BUNDLE_V2_part7.md:10463-10577 |
| `experiments/write-results-pack.js` | 175 | REVIEW_BUNDLE_V2_part7.md:10583-10757 |
| `package.json` | 19 | REVIEW_BUNDLE_V2_part7.md:10763-10781 |
| `server/.env.example` | 23 | REVIEW_BUNDLE_V2_part7.md:10787-10809 |
| `server/core.js` | 601 | REVIEW_BUNDLE_V2_part7.md:10815-11415 |
| `server/package.json` | 25 | REVIEW_BUNDLE_V2_part7.md:11421-11445 |
| `server/server.js` | 10 | REVIEW_BUNDLE_V2_part7.md:11451-11460 |
| `server/test/idempotency-policy.test.js` | 10 | REVIEW_BUNDLE_V2_part7.md:11466-11475 |
| `server/test/integration.test.js` | 296 | REVIEW_BUNDLE_V2_part7.md:11481-11776 |
| `server/test/migration.test.js` | 53 | REVIEW_BUNDLE_V2_part7.md:11782-11834 |
| `server/test/proxy.test.js` | 64 | REVIEW_BUNDLE_V2_part7.md:11840-11903 |
| `server/test/route-gating.test.js` | 35 | REVIEW_BUNDLE_V2_part7.md:11909-11943 |
| `server/test/unit.test.js` | 157 | REVIEW_BUNDLE_V2_part7.md:11949-12105 |
| `server/utils/config-warnings.js` | 13 | REVIEW_BUNDLE_V2_part7.md:12111-12123 |
| `server/utils/hmac.js` | 39 | REVIEW_BUNDLE_V2_part7.md:12129-12167 |
| `server/utils/idempotency.js` | 38 | REVIEW_BUNDLE_V2_part7.md:12173-12210 |
| `server/utils/money-oracle.js` | 66 | REVIEW_BUNDLE_V2_part7.md:12216-12281 |
| `server/utils/nonce.js` | 123 | REVIEW_BUNDLE_V2_part7.md:12287-12409 |
| `server/utils/request.js` | 18 | REVIEW_BUNDLE_V2_part7.md:12415-12432 |
| `server/utils/timestamp.js` | 9 | REVIEW_BUNDLE_V2_part7.md:12438-12446 |
| `server/viz-server.js` | 63 | REVIEW_BUNDLE_V2_part7.md:12452-12514 |
