# Review Bundle V2

The complete bundle is split because it exceeds 4 MB. Read the parts in numeric order. Each part repeats the shared file and line-count table.

Source HEAD: `c72333baad0e6af0d189d372680e66f06294d397`
Generated: 2026-10-18T19:01:50.301Z
Parts: [REVIEW_BUNDLE_V2_part1.md](REVIEW_BUNDLE_V2_part1.md), [REVIEW_BUNDLE_V2_part2.md](REVIEW_BUNDLE_V2_part2.md), [REVIEW_BUNDLE_V2_part3.md](REVIEW_BUNDLE_V2_part3.md), [REVIEW_BUNDLE_V2_part4.md](REVIEW_BUNDLE_V2_part4.md), [REVIEW_BUNDLE_V2_part5.md](REVIEW_BUNDLE_V2_part5.md), [REVIEW_BUNDLE_V2_part6.md](REVIEW_BUNDLE_V2_part6.md), [REVIEW_BUNDLE_V2_part7.md](REVIEW_BUNDLE_V2_part7.md), [REVIEW_BUNDLE_V2_part8.md](REVIEW_BUNDLE_V2_part8.md), [REVIEW_BUNDLE_V2_part9.md](REVIEW_BUNDLE_V2_part9.md), [REVIEW_BUNDLE_V2_part10.md](REVIEW_BUNDLE_V2_part10.md), [REVIEW_BUNDLE_V2_part11.md](REVIEW_BUNDLE_V2_part11.md), [REVIEW_BUNDLE_V2_part12.md](REVIEW_BUNDLE_V2_part12.md), [REVIEW_BUNDLE_V2_part13.md](REVIEW_BUNDLE_V2_part13.md)

# Shared table of contents

| File | Source line count | Bundle part and line range |
|---|---:|---|
| `attack/attack.sh` | 287 | REVIEW_BUNDLE_V2_part13.md:19982-20268 |
| `client/bank/src/App.jsx` | 109 | REVIEW_BUNDLE_V2_part13.md:20274-20382 |
| `client/bank/src/api.js` | 135 | REVIEW_BUNDLE_V2_part13.md:20388-20522 |
| `client/bank/src/components/BalanceDisplay.jsx` | 20 | REVIEW_BUNDLE_V2_part13.md:20528-20547 |
| `client/bank/src/components/DepositForm.jsx` | 43 | REVIEW_BUNDLE_V2_part13.md:20553-20595 |
| `client/bank/src/components/TransactionHistory.jsx` | 42 | REVIEW_BUNDLE_V2_part13.md:20601-20642 |
| `client/bank/src/components/WithdrawForm.jsx` | 44 | REVIEW_BUNDLE_V2_part13.md:20648-20691 |
| `client/bank/src/socket.js` | 6 | REVIEW_BUNDLE_V2_part13.md:20697-20702 |
| `client/bank/src/styles.css` | 201 | REVIEW_BUNDLE_V2_part13.md:20708-20908 |
| `docs/CLAIMS_EVIDENCE.md` | 22 | REVIEW_BUNDLE_V2_part13.md:20914-20935 |
| `docs/DEMO.md` | 99 | REVIEW_BUNDLE_V2_part13.md:20941-21039 |
| `docs/LIMITATIONS.md` | 31 | REVIEW_BUNDLE_V2_part13.md:21045-21075 |
| `docs/REPRODUCE.md` | 76 | REVIEW_BUNDLE_V2_part13.md:21081-21156 |
| `docs/THREAT_MODEL.md` | 26 | REVIEW_BUNDLE_V2_part13.md:21162-21187 |
| `experiments/audit-egress.js` | 72 | REVIEW_BUNDLE_V2_part13.md:21193-21264 |
| `experiments/audit/build-curated-facts.js` | 28 | REVIEW_BUNDLE_V2_part13.md:21270-21297 |
| `experiments/audit/build-policy-tradeoff.js` | 6 | REVIEW_BUNDLE_V2_part13.md:21303-21308 |
| `experiments/audit/build-results-pack-final.js` | 16 | REVIEW_BUNDLE_V2_part13.md:21314-21329 |
| `experiments/audit/check-e4a-rule.js` | 45 | REVIEW_BUNDLE_V2_part13.md:21335-21379 |
| `experiments/audit/make-e2-layer-table.js` | 13 | REVIEW_BUNDLE_V2_part13.md:21385-21397 |
| `experiments/audit/make-review-bundle-v2.js` | 200 | REVIEW_BUNDLE_V2_part13.md:21403-21602 |
| `experiments/audit/verify-results.js` | 43 | REVIEW_BUNDLE_V2_part13.md:21608-21650 |
| `experiments/e1/finalize-oracle-summary.js` | 63 | REVIEW_BUNDLE_V2_part13.md:21656-21718 |
| `experiments/e1/reconcile-oracle-amounts.js` | 33 | REVIEW_BUNDLE_V2_part13.md:21724-21756 |
| `experiments/e1/run-policy-resubmit.js` | 19 | REVIEW_BUNDLE_V2_part13.md:21762-21780 |
| `experiments/e1/run.js` | 357 | REVIEW_BUNDLE_V2_part13.md:21786-22142 |
| `experiments/e2/run.js` | 347 | REVIEW_BUNDLE_V2_part13.md:22148-22494 |
| `experiments/e3/run.js` | 56 | REVIEW_BUNDLE_V2_part13.md:22500-22555 |
| `experiments/e4/run.js` | 74 | REVIEW_BUNDLE_V2_part13.md:22561-22634 |
| `experiments/lib/http.js` | 37 | REVIEW_BUNDLE_V2_part13.md:22640-22676 |
| `experiments/recording-proxy.js` | 81 | REVIEW_BUNDLE_V2_part13.md:22682-22762 |
| `experiments/render-documentation.js` | 317 | REVIEW_BUNDLE_V2_part13.md:22768-23084 |
| `experiments/render-pack-a.py` | 80 | REVIEW_BUNDLE_V2_part13.md:23090-23169 |
| `experiments/render-v2-results.py` | 111 | REVIEW_BUNDLE_V2_part13.md:23175-23285 |
| `experiments/run-f1-races.js` | 79 | REVIEW_BUNDLE_V2_part13.md:23291-23369 |
| `experiments/run-nonce-memory.js` | 118 | REVIEW_BUNDLE_V2_part13.md:23375-23492 |
| `experiments/run-phase4.js` | 18 | REVIEW_BUNDLE_V2_part13.md:23498-23515 |
| `experiments/run-races.js` | 117 | REVIEW_BUNDLE_V2_part13.md:23521-23637 |
| `experiments/run-viz-curve.js` | 40 | REVIEW_BUNDLE_V2_part13.md:23643-23682 |
| `experiments/send-through-proxy.js` | 49 | REVIEW_BUNDLE_V2_part13.md:23688-23736 |
| `experiments/verify-demo-session-flow.js` | 49 | REVIEW_BUNDLE_V2_part13.md:23742-23790 |
| `experiments/write-paper-facts.js` | 26 | REVIEW_BUNDLE_V2_part13.md:23796-23821 |
| `experiments/write-results-pack-v2.js` | 115 | REVIEW_BUNDLE_V2_part13.md:23827-23941 |
| `experiments/write-results-pack.js` | 175 | REVIEW_BUNDLE_V2_part13.md:23947-24121 |
| `package.json` | 19 | REVIEW_BUNDLE_V2_part13.md:24127-24145 |
| `server/.env.example` | 23 | REVIEW_BUNDLE_V2_part13.md:24151-24173 |
| `server/core.js` | 601 | REVIEW_BUNDLE_V2_part13.md:24179-24779 |
| `server/package.json` | 25 | REVIEW_BUNDLE_V2_part13.md:24785-24809 |
| `server/server.js` | 10 | REVIEW_BUNDLE_V2_part13.md:24815-24824 |
| `server/test/idempotency-policy.test.js` | 10 | REVIEW_BUNDLE_V2_part13.md:24830-24839 |
| `server/test/integration.test.js` | 296 | REVIEW_BUNDLE_V2_part13.md:24845-25140 |
| `server/test/migration.test.js` | 53 | REVIEW_BUNDLE_V2_part13.md:25146-25198 |
| `server/test/proxy.test.js` | 64 | REVIEW_BUNDLE_V2_part13.md:25204-25267 |
| `server/test/route-gating.test.js` | 35 | REVIEW_BUNDLE_V2_part13.md:25273-25307 |
| `server/test/unit.test.js` | 157 | REVIEW_BUNDLE_V2_part13.md:25313-25469 |
| `server/utils/config-warnings.js` | 13 | REVIEW_BUNDLE_V2_part13.md:25475-25487 |
| `server/utils/hmac.js` | 39 | REVIEW_BUNDLE_V2_part13.md:25493-25531 |
| `server/utils/idempotency.js` | 38 | REVIEW_BUNDLE_V2_part13.md:25537-25574 |
| `server/utils/money-oracle.js` | 66 | REVIEW_BUNDLE_V2_part13.md:25580-25645 |
| `server/utils/nonce.js` | 123 | REVIEW_BUNDLE_V2_part13.md:25651-25773 |
| `server/utils/request.js` | 18 | REVIEW_BUNDLE_V2_part13.md:25779-25796 |
| `server/utils/timestamp.js` | 9 | REVIEW_BUNDLE_V2_part13.md:25802-25810 |
| `server/viz-server.js` | 63 | REVIEW_BUNDLE_V2_part13.md:25816-25878 |
