# Complete Experiment Dossier

Generated from the current `experiments/` tree. It includes the complete folder structure, a file inventory, measured interpretation, and a full text/code listing of every file currently under `experiments/`.

## Scope and evidence rules

- Phase 0 baseline artifacts and Phase 1–3 implementation/test artifacts are recorded here. The full Phase 4 experiment matrix and Phase 5 USSD evaluation have not been run.
- Every numeric finding below is read from a saved run artifact. No unrun experiment is represented as a result.
- Phase 0 CSVs predate per-request monotonic timing; their missing durations are called out rather than reconstructed. Updated scripts record `process.hrtime.bigint()` start, end, and duration fields.
- The WSL-only Bash attacker does not require Node.js; its client-side timing CSV uses WSL `date +%s%N`. The Windows server experiment log records monotonic `process.hrtime.bigint()` request and layer timings for those same requests.
- Request HMAC signature values are redacted in this document because they are replay-capable authentication artifacts. Their source files remain unchanged in `experiments/results/`; the recorded hashes refer to those original files.
- Every result file is inventoried with current path, byte size, and SHA-256. For a result over 200 KB or 1,000 rows, only its first 20 rows, last 20 rows, and aggregate statistics are shown; the complete file remains on disk. Source code and harness scripts stay in full.
- The generated document itself is outside `experiments/`, so it is not included in the experiment tree or its result manifest.

## Reproduction environment

- Captured at: `2026-10-17T19:00:15.066Z` UTC.
- Operating system: Windows 11 Pro (win32 10.0.26200).
- CPU: Intel(R) Core(TM) i5-8365U CPU @ 1.60GHz; 8 logical CPUs.
- RAM: 8395841536 bytes (7.82 GiB).
- Node.js: v24.11.1.
- SQLite Node package: 5.1.7; SQLite library: 3.44.2.
- Nonce store: Memurai Developer (not stock Redis), version 4.2.3; Redis protocol 7.4.9. Memurai, not stock Redis, was used.
- Memurai listens on IPv4 only. The configured URL is `redis://127.0.0.1:6379`; `localhost` may resolve to `::1` and fail.
- Native Windows ports 3000, 3001, and 6379 were reachable. WSL reached the Windows API at `http://localhost:3000/api/health` with HTTP 200 and body `OK`.
- Git commit captured in environment metadata: `4d9eceec78b0474bfad4e8711584268882697561`; status snapshot clean: false. The snapshot is preserved verbatim in `results/environment.json`.
- The attacker shell ran in WSL. All server, Node, SQLite, Memurai, and measurement traffic ran on Windows and targeted only the local simulation.

## Phase 0 run method

1. Start the Windows Memurai service and verify it with `C:\Applications\memurai-cli.exe ping`.
2. Set `REDIS_URL=redis://127.0.0.1:6379` in the ignored `server/.env` file.
3. Start the server natively from `server/`; its startup log reports the bank API on 3000 and Socket.IO on 3001.
4. From WSL, check `curl http://localhost:3000/api/health` before running attacks.
5. Start `experiments/recording-proxy.js` on Windows and route a local client through port 3002; keep the exact request recording in a private temp directory outside the repository.
6. Set WSL `CAPTURE_FILE` to the Windows recording path mounted into WSL, then run `attack/attack.sh --capture`, replay, tamper, stale-payload, and nonce-crash cases.
7. A native Windows Node script sent 50 parallel copies of one valid payload, tested request-ID tampering and clock offsets, reset the demo state, created one successful seed transaction, cleared its nonce, then sent 10,000 sequential requests with fresh nonces and that already-successful request ID. They were rejected at request-ID after nonce consumption.
8. `C:\Applications\memurai-cli.exe --scan --pattern used_nonce:*` counted nonce keys; `INFO memory` supplied `used_memory`.

The Phase 0 parallel run used one batch of 50. Each Phase 0 clock offset was measured once. The Phase 0 10,000-request run is “nonce-store growth from requests rejected at the request-ID check,” not legitimate transactions.

## Measured findings

| Measurement | Observed result | Evidence |
|---|---|---|
| 50 identical parallel valid requests | 1 accepted; 49 returned NONCE_FAIL. | `baseline/parallel-50-responses.json` |
| Changed request ID, original signature | HTTP 401, SIGNATURE_FAIL. | `baseline/measured-cases.json` |
| Clock skew -10m | TIMESTAMP_FAIL. | `baseline/measured-cases.json` |
| Clock skew -1m | ACCEPTED. | `baseline/measured-cases.json` |
| Clock skew +10s, +1m, +10m | +10s: TIMESTAMP_FAIL; +1m: TIMESTAMP_FAIL; +10m: TIMESTAMP_FAIL. | `baseline/measured-cases.json` |
| Exact in-window replay | NONCE_FAIL. | `baseline/immediate-replay.log` |
| Replay after nonce store clear | ALREADY_PROCESSED; crash endpoint deleted 1 key. | `baseline/replay-after-nonce-crash.log`, `baseline/nonce-crash.json` |
| Nonce-store growth from requests rejected at the request-ID check | 10000 keys; `2519240` bytes used_memory (2.40M). | `baseline/nonce-growth-measured.json`, `baseline/unique-nonce-10000-responses.csv` |
| Tampered amount with a fresh signed source | SIGNATURE_FAIL. | `baseline/tamper-fresh.log` |
| Correctly signed payload older than 300 seconds | TIMESTAMP_FAIL. | `baseline/stale-replay.log` |
| WSL to Windows health check | HTTP 200; body `OK`, before and after server restart. | `baseline/wsl-health.log`, `baseline/wsl-health-postrotation.log` |

### Section 5 comparison

The Phase 0 comparison recorded 0 mismatches among measured cases. Tested response descriptions matched the report for health, accepted withdrawal, fresh tampering, stale signed request, reused nonce, request-ID replay after nonce clearing, and capture mode.

Section 5 responses in `PROJECT_AUDIT_REPORT.md` are labeled as measured or code-derived. The Phase 0 10,000-request artifact represents requests rejected at the request-ID check; nonce records were written before that check.

### Future timestamp tolerance hypothesis for E3

E3 should sweep future tolerance values of 0 s, 5 s, 30 s, and 60 s and measure false rejections for fast legitimate client clocks. Phase 0 observed rejection at +10 s under the 5 s default. The sweep is a hypothesis to test; no false-rejection rate is claimed yet.

### On-path capture procedure

`recording-proxy.js` is a local Node proxy restricted to a localhost upstream. Route the UI/API client to port 3002 and set `PROXY_CAPTURE_FILE` to a private path outside the repository. The proxy saves the exact request method, path, headers, and body it forwards. `attack/attack.sh --replay` reads the proxy envelope from `CAPTURE_FILE`; it does not use a payload file written by the server. Capture files include a signature and authorization header, so keep them outside `experiments/`, `docs/`, and version control.

### Tests and build

- Server unit and integration tests use Node’s built-in test runner on Windows. Their captured output is inventoried below.
- The bank UI production build was run after removing the global signing secret from browser code. Client requests use a per-session signing key held in memory.
- Legacy shared-secret verification remains behind `LEGACY_SHARED_SECRET=true`; the browser bundle contains no global shared key.

## Experiment directory structure

```text
experiments/
├── lib/
│   └── http.js
├── recording-proxy.js
├── render-documentation.js
├── results/
│   ├── baseline/
│   │   ├── capture-trigger.json
│   │   ├── capture.log
│   │   ├── check-ports-postrotation.js
│   │   ├── collect-environment.js
│   │   ├── immediate-replay-trigger.json
│   │   ├── immediate-replay.log
│   │   ├── make-stale-payload.js
│   │   ├── make-tamper-source.js
│   │   ├── measured-cases.json
│   │   ├── nonce-crash.json
│   │   ├── nonce-growth-measured.json
│   │   ├── npm-test-client-bank.log
│   │   ├── npm-test-client-viz.log
│   │   ├── npm-test-server.log
│   │   ├── npm-test-status.json
│   │   ├── parallel-50-responses.json
│   │   ├── payload.before-capture.json
│   │   ├── phase0-summary.json
│   │   ├── postrotation-port-check.json
│   │   ├── replay-after-nonce-crash.log
│   │   ├── replay.log
│   │   ├── reset.json
│   │   ├── run-measured-cases.js
│   │   ├── server.restart.stderr.log
│   │   ├── server.restart.stdout.log
│   │   ├── server.stderr.log
│   │   ├── server.stdout.log
│   │   ├── stale-payload.json
│   │   ├── stale-replay.log
│   │   ├── tamper-fresh.log
│   │   ├── tamper-source.json
│   │   ├── tamper.log
│   │   ├── trigger-capture.js
│   │   ├── unique-nonce-10000-responses.csv
│   │   ├── wsl-health-postrotation.log
│   │   └── wsl-health.log
│   ├── corrections/
│   │   ├── c2-accepted-server.stderr.log
│   │   ├── c2-accepted-server.stderr.log.copy
│   │   ├── c2-accepted-server.stdout.log
│   │   ├── c2-accepted-server.stdout.log.copy
│   │   ├── c2-rejectclean-server.stderr.log
│   │   ├── c2-rejectclean-server.stderr.log.copy
│   │   ├── c2-rejectclean-server.stdout.log
│   │   ├── c2-rejectclean-server.stdout.log.copy
│   │   ├── c2-requestid-server.stderr.log
│   │   ├── c2-requestid-server.stderr.log.partial-copy
│   │   ├── c2-requestid-server.stdout.log
│   │   ├── c2-requestid-server.stdout.log.partial-copy
│   │   ├── c3-races-server.stderr.log
│   │   ├── c3-races-server.stdout.log
│   │   ├── c4-proxy.stderr.log
│   │   ├── c4-proxy.stdout.log
│   │   ├── clock-offsets-30-each.csv
│   │   ├── clock-offsets-30-each.json
│   │   ├── final-server.stderr.log
│   │   ├── final-server.stderr.log.copy
│   │   ├── final-server.stdout.log
│   │   ├── final-server.stdout.log.copy
│   │   ├── nonce-memory-accepted-c2-accepted-100k-requests.csv
│   │   ├── nonce-memory-accepted-c2-accepted-100k-summary.json
│   │   ├── nonce-memory-accepted-c2-smoke-accepted-requests.csv
│   │   ├── nonce-memory-accepted-c2-smoke-accepted-summary.json
│   │   ├── nonce-memory-requestid-c2-requestid-100k-clean-control.csv
│   │   ├── nonce-memory-requestid-c2-requestid-100k-clean-requests.csv
│   │   ├── nonce-memory-requestid-c2-requestid-100k-clean-summary.json
│   │   ├── proxy-replay-verification-first.json
│   │   ├── proxy-replay-verification-second.json
│   │   ├── proxy-replay-verification.json
│   │   ├── race-identical-50x1000-batches.csv
│   │   ├── race-identical-50x1000-requests.csv
│   │   ├── race-same-request-id-50-requests.csv
│   │   ├── race-summary-1000-batches.json
│   │   ├── server-layer-timings-c2-accepted.csv
│   │   ├── server.restart.stderr.log.copy
│   │   ├── server.restart.stdout.log.copy
│   │   ├── server.stderr.log.copy
│   │   ├── server.stdout.log.copy
│   │   ├── timestamp-boundaries-30-each.csv
│   │   ├── timestamp-boundaries-30-each.json
│   │   ├── viz-enabled-nonce-scan-requests.csv
│   │   ├── viz-enabled-nonce-scan-summary.json
│   │   ├── viz-run.log
│   │   ├── vizcurve-server.stderr.log
│   │   ├── vizcurve-server.stderr.log.copy
│   │   ├── vizcurve-server.stdout.log
│   │   ├── vizcurve-server.stdout.log.copy
│   │   ├── wsl-attack-timings.csv
│   │   ├── wsl-capture-mode.log
│   │   ├── wsl-capture-mode.stderr.log
│   │   ├── wsl-cli-cases.log
│   │   ├── wsl-invalid-cases.log
│   │   ├── wsl-replay.log
│   │   └── wsl-timing-verification.log
│   ├── environment.json
│   ├── phase3/
│   │   ├── client-build.log
│   │   ├── layer-timings-1212.csv
│   │   ├── layer-timings-32508.csv
│   │   ├── layer-timings-33040.csv
│   │   ├── layer-timings-9412.csv
│   │   ├── npm-test.log
│   │   └── wsl-server-layer-timings.csv
│   └── SHA256SUMS.json
├── run-nonce-memory.js
├── run-races.js
├── run-viz-curve.js
└── send-through-proxy.js
```

## File inventory

| File | Bytes | SHA-256 |
|---|---:|---|
| `experiments/lib/http.js` | 478 | `fe6a4eb60013f22a24b7e0ea71c8934f6c16774d1d1657648250514338def1ac` |
| `experiments/recording-proxy.js` | 2883 | `1bc22b51a2d4f8e8603de2f2ce362d1b2c3defb8c7bc5304e0b3c042bff0a100` |
| `experiments/render-documentation.js` | 21591 | `3f722e7c94b9d345ade9353b0a1607ee6ed58e9d5305dbc7b2d8dee5da6ac467` |
| `experiments/results/baseline/capture-trigger.json` | 424 | `f700cd2e5a2a749e3a472e3eec502cc4951818466e4e4894acc815f571b6f19a` |
| `experiments/results/baseline/capture.log` | 492 | `1cab16306fde8e4e0b2e95040fc600bd1c1d89df6e012924197f85fa4daaa656` |
| `experiments/results/baseline/check-ports-postrotation.js` | 586 | `3868c6828fcdbee1d861276e61014e8d92218d1853ebd99b8fc94dfa6b133043` |
| `experiments/results/baseline/collect-environment.js` | 3595 | `e77a2fa7cc56f1f55f3ee4d504098199a5ce9f6dec4329088827e2380dd6d8ba` |
| `experiments/results/baseline/immediate-replay-trigger.json` | 110 | `d9034a2dd43861cbd2d3ab5066bf0654deac12d2a1c3dd7eed3ad76b3d25d96f` |
| `experiments/results/baseline/immediate-replay.log` | 257 | `3363bff4e80a9133d637236cfe5017c9994c1ea5d3658be4e1a339c0b28788d5` |
| `experiments/results/baseline/make-stale-payload.js` | 728 | `f82ad38fc79eb0a6b7fbcf9fb134614bb0cece2bc03415c23e7082cb5d8f2494` |
| `experiments/results/baseline/make-tamper-source.js` | 675 | `ca566a8824d0cbe6746b900396834a3a7600bb4da9e35bf13da5b8e9dabd3946` |
| `experiments/results/baseline/measured-cases.json` | 1598 | `9ef5e75670fca61eceffcd14ef023038a887be7978435df1395108023088106d` |
| `experiments/results/baseline/nonce-crash.json` | 33 | `b58f475bf46783a6b01f59e1c665e161efaccdd05cc577f7d87282ab3904cfaa` |
| `experiments/results/baseline/nonce-growth-measured.json` | 560 | `61a85e7fb13d80833fc6882d2e36d3533bd5a19234111bd1c8c5dc51d8050d47` |
| `experiments/results/baseline/npm-test-client-bank.log` | 322 | `490434ce49cd2e4453c626c22daecb12f3e8c19c4f35ed58569a318b89398832` |
| `experiments/results/baseline/npm-test-client-viz.log` | 322 | `490434ce49cd2e4453c626c22daecb12f3e8c19c4f35ed58569a318b89398832` |
| `experiments/results/baseline/npm-test-server.log` | 322 | `490434ce49cd2e4453c626c22daecb12f3e8c19c4f35ed58569a318b89398832` |
| `experiments/results/baseline/npm-test-status.json` | 456 | `0f0faa7de5a562e2f78ec780adc2ddb1eb4d0b2a90941ac856cea6341b642339` |
| `experiments/results/baseline/parallel-50-responses.json` | 4266 | `49e842ef8fb686d8a2cf7c308049d3103ab0f87a3306b32908dd9a2455d484c0` |
| `experiments/results/baseline/payload.before-capture.json` | 359 | `e38c70b834363e9ecce8e5f6d250a76ffdfc56b22e67d28c4fcf3aa22b8e2add` |
| `experiments/results/baseline/phase0-summary.json` | 3028 | `89650cca53dba6031e943cb44184d7ed2cbe9b501663b64ef2423a686e7aaa43` |
| `experiments/results/baseline/postrotation-port-check.json` | 236 | `8578b80c198c9367c3ae2c3b2b2b0276397f4aae3ab66837bbd1cc0db0ce3d76` |
| `experiments/results/baseline/replay-after-nonce-crash.log` | 264 | `2171424860aaa034ca58bce8625a48c0a9881860a0194d4117133c75690e7daf` |
| `experiments/results/baseline/replay.log` | 1020 | `512839c3112ccb2f2d921f717ba42165caeadd8856ca585bec6562a2a502cda5` |
| `experiments/results/baseline/reset.json` | 521 | `f46476d565e16f2eab8e000b4a76e6473bd1d5bff978e002c977c9803000e10d` |
| `experiments/results/baseline/run-measured-cases.js` | 4375 | `629b1a3e464de26d08b78e1c6cb13538dafa8583eb237b84d1a85289a0e28560` |
| `experiments/results/baseline/server.restart.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/baseline/server.restart.stdout.log` | 82 | `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45` |
| `experiments/results/baseline/server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/baseline/server.stdout.log` | 82 | `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45` |
| `experiments/results/baseline/stale-payload.json` | 374 | `618b3128fe17db9c0717c072c5e0dbacbaeebec2e52b32fcf8cc45528eed8afb` |
| `experiments/results/baseline/stale-replay.log` | 263 | `7717d0b34282a1d17aae3f51c240b40d09883f0cb7b5874e4151245d886d6947` |
| `experiments/results/baseline/tamper-fresh.log` | 347 | `849b3cc3684f16b96652f25da34024ae98fa99b55bf3a5b070c0abdc495ed432` |
| `experiments/results/baseline/tamper-source.json` | 374 | `620e8526692f55afaae7c616c5793b3241ef56ff9960b3645e452ae6a58a1298` |
| `experiments/results/baseline/tamper.log` | 347 | `04126d7d5a2badabab2c0340a7a71f05611e4c7e9975ea8e47026a0e5617f5d3` |
| `experiments/results/baseline/trigger-capture.js` | 1298 | `3bb6fcb9affd28868af089e8abb1ccce091e85fb660dc427bf9381d7481ea5c0` |
| `experiments/results/baseline/unique-nonce-10000-responses.csv` | 358925 | `89065441f9cf65a08d8ac0bc8784c3814958ef5c2fda8c2d4863705d4dab1ff3` |
| `experiments/results/baseline/wsl-health-postrotation.log` | 261 | `363001e83d622cd35db26fc30e5d0b54ddffb74fdf5e40a51de28e29b86c5959` |
| `experiments/results/baseline/wsl-health.log` | 261 | `cbc38d7f69199d37b3cec901116c5acbb5252c89141520bc111280c880cf45cb` |
| `experiments/results/corrections/c2-accepted-server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/c2-accepted-server.stderr.log.copy` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/c2-accepted-server.stdout.log` | 82 | `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45` |
| `experiments/results/corrections/c2-accepted-server.stdout.log.copy` | 82 | `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45` |
| `experiments/results/corrections/c2-rejectclean-server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/c2-rejectclean-server.stderr.log.copy` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/c2-rejectclean-server.stdout.log` | 82 | `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45` |
| `experiments/results/corrections/c2-rejectclean-server.stdout.log.copy` | 82 | `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45` |
| `experiments/results/corrections/c2-requestid-server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/c2-requestid-server.stderr.log.partial-copy` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/c2-requestid-server.stdout.log` | 82 | `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45` |
| `experiments/results/corrections/c2-requestid-server.stdout.log.partial-copy` | 82 | `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45` |
| `experiments/results/corrections/c3-races-server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/c3-races-server.stdout.log` | 82 | `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45` |
| `experiments/results/corrections/c4-proxy.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/c4-proxy.stdout.log` | 151 | `68fcb13a62468640e2e492c921ec996a0dc6162ac324e1c5076748b5f4ee8450` |
| `experiments/results/corrections/clock-offsets-30-each.csv` | 11826 | `92a4c0ccf67f84bd26013a81a07914c6807575fabd1e9a87a0de97395f5653d4` |
| `experiments/results/corrections/clock-offsets-30-each.json` | 52764 | `e29e7e0a401439a12905e625ed21cffed170b8b85bba77450e42d026a118279d` |
| `experiments/results/corrections/final-server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/final-server.stderr.log.copy` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/final-server.stdout.log` | 84 | `908141bc87754c6ee425f0d27e42d8d8ff6360d72c54defc8b09537b3c340052` |
| `experiments/results/corrections/final-server.stdout.log.copy` | 84 | `908141bc87754c6ee425f0d27e42d8d8ff6360d72c54defc8b09537b3c340052` |
| `experiments/results/corrections/nonce-memory-accepted-c2-accepted-100k-requests.csv` | 6111075 | `fcc2c23ff3e0f3b20f6aa8b0442ea4c9668cb3f569ad3620d1b5107032c0ce4e` |
| `experiments/results/corrections/nonce-memory-accepted-c2-accepted-100k-summary.json` | 1859 | `b9fa30951ff8dbba4a978ff18a2ceabcc7a22676bc44e555c4c301c58306f1a2` |
| `experiments/results/corrections/nonce-memory-accepted-c2-smoke-accepted-requests.csv` | 634 | `6f9475847d255d7be09fd853b005c39e488d7a0809873da9e073684179ed03f0` |
| `experiments/results/corrections/nonce-memory-accepted-c2-smoke-accepted-summary.json` | 1125 | `e89106676d1949f0bbbe78a3548632a5b256a2faaa84443ad63f016f147abf8d` |
| `experiments/results/corrections/nonce-memory-requestid-c2-requestid-100k-clean-control.csv` | 246 | `0c0befa14d3ddf2f26f4d9f3fdc1abc4ae4a6a4efe05e51ec8fc7e89d3f5c571` |
| `experiments/results/corrections/nonce-memory-requestid-c2-requestid-100k-clean-requests.csv` | 6989116 | `f1415c207f8ed7d22acb5c5a6daf0d6bd57b9f9528dae84b964e770b7bb56c82` |
| `experiments/results/corrections/nonce-memory-requestid-c2-requestid-100k-clean-summary.json` | 2036 | `cfdd5cdc38f61e1dde1fa05e949b2805d767c274b21ef632c3b9a9550059d28d` |
| `experiments/results/corrections/proxy-replay-verification-first.json` | 735 | `f612317b1ad4331821363f418876347943b6d4e5b80ee2d9680518ab714ab074` |
| `experiments/results/corrections/proxy-replay-verification-second.json` | 735 | `c38b32ffe903c043e26cfec27702ac7b3921c063b854cdfb27f828c5f3f3e5dd` |
| `experiments/results/corrections/proxy-replay-verification.json` | 735 | `c38b32ffe903c043e26cfec27702ac7b3921c063b854cdfb27f828c5f3f3e5dd` |
| `experiments/results/corrections/race-identical-50x1000-batches.csv` | 60018 | `7aa79c1128a64b8a312c6923f6ef739f24bb8832a6019b3596bf09fb2b27480f` |
| `experiments/results/corrections/race-identical-50x1000-requests.csv` | 3233722 | `3943e243efa1460148ffb7c1fc104a563ac6ec37d050888a63c4e94124da9df4` |
| `experiments/results/corrections/race-same-request-id-50-requests.csv` | 3469 | `0cf4e976e66615bb1b0c98fe88f6f47f4dc257c69be64a05739afe22486961a1` |
| `experiments/results/corrections/race-summary-1000-batches.json` | 1264 | `f4be98fa94363ce6378b1b23de93524116f3d472d3c058d4b8d1d1c4ad13c458` |
| `experiments/results/corrections/server-layer-timings-c2-accepted.csv` | 12635825 | `56d5278c0d82b0e7625a494e430c92de8928b0d3b0d4e80b71cc732f183270e7` |
| `experiments/results/corrections/server.restart.stderr.log.copy` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/server.restart.stdout.log.copy` | 82 | `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45` |
| `experiments/results/corrections/server.stderr.log.copy` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/server.stdout.log.copy` | 82 | `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45` |
| `experiments/results/corrections/timestamp-boundaries-30-each.csv` | 16478 | `30e39211195246be5294ad7298345aef199090004eb6639253cb22b88c92e57a` |
| `experiments/results/corrections/timestamp-boundaries-30-each.json` | 66846 | `5840b7fca6ef565bec2bf3253637d25d23d608feed50baca53277c5355ba85eb` |
| `experiments/results/corrections/viz-enabled-nonce-scan-requests.csv` | 326830 | `e3c661220900d0275d82bfd3f79c10ff7ef555485d3b5eef7a742f6fc8c22d2e` |
| `experiments/results/corrections/viz-enabled-nonce-scan-summary.json` | 1263 | `6c88f36d665722af0df0d32d06153cc965c59610c9eb986638da1b7835dcd006` |
| `experiments/results/corrections/viz-run.log` | 2636 | `3acdd4f04fdc694534b2e7c1487a5c77e151b6cb1656f4497e3ea20ac2b5ef5a` |
| `experiments/results/corrections/vizcurve-server.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/vizcurve-server.stderr.log.copy` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/vizcurve-server.stdout.log` | 84 | `908141bc87754c6ee425f0d27e42d8d8ff6360d72c54defc8b09537b3c340052` |
| `experiments/results/corrections/vizcurve-server.stdout.log.copy` | 84 | `908141bc87754c6ee425f0d27e42d8d8ff6360d72c54defc8b09537b3c340052` |
| `experiments/results/corrections/wsl-attack-timings.csv` | 284 | `72b26f129fbd13a2207e936b71f4041c44e12c775684bcfc339aa702a48b1285` |
| `experiments/results/corrections/wsl-capture-mode.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/wsl-capture-mode.stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `experiments/results/corrections/wsl-cli-cases.log` | 4328 | `1f521630242389dacf4c6b0e1d524458d2341ab40719306b44fa39bc1c346c5b` |
| `experiments/results/corrections/wsl-invalid-cases.log` | 2702 | `f3bc728225a7dc9e81e3a342c5bab19f6e7989696222988c0918f8840c19590c` |
| `experiments/results/corrections/wsl-replay.log` | 828 | `885fe86c7df5eb37ea53f0a65a56bbdbc76868a295e104e8a02990ecaa50eaf0` |
| `experiments/results/corrections/wsl-timing-verification.log` | 1570 | `7961fa3b8d4c055f64ba3e65cd45c8adef40d088b8653ffa3c29a4a56076b710` |
| `experiments/results/environment.json` | 1529 | `3a7b4483f57f212c278b6008cd9a43c171e128367469944a8a123bfcf7514019` |
| `experiments/results/phase3/client-build.log` | 778 | `e6721975888edf390bb33de45b368b6dc4147afd58a8c9973f66b19d92230bd4` |
| `experiments/results/phase3/layer-timings-1212.csv` | 46625 | `a416b36935c313f3838390d6d768fed970a7fcd9a7e0bf2e1c168bc669a224ab` |
| `experiments/results/phase3/layer-timings-32508.csv` | 46674 | `6c9a38715bf46921ec40048feb66707492e34aa7fab7ea13061c0f1adfd754b3` |
| `experiments/results/phase3/layer-timings-33040.csv` | 70886 | `5e06aa645a818a0d91ad5b6a1738ec456912740b1960a6252d2f3a268d76d574` |
| `experiments/results/phase3/layer-timings-9412.csv` | 46402 | `bd27b57160ba85bd80583d4d1a51630d856bc4e9d14508663e7bc83b2374b9a9` |
| `experiments/results/phase3/npm-test.log` | 4206 | `5c954643f630754c6ce5a1dec2867b934db9e842ffa84451ca8ac96d369ef49d` |
| `experiments/results/phase3/wsl-server-layer-timings.csv` | 401 | `f280433bc4a6859667b40650346b9a5d3142017042baf57d16264b31871567cc` |
| `experiments/results/SHA256SUMS.json` | 18739 | `241f358ffd467a8ad5abe93953a4147f6c1bfa0fab5dc357a0f69575f6108923` |
| `experiments/run-nonce-memory.js` | 6837 | `0cfd333ac7c09a2ae9378425a7ade9e4fc9724ac6c9bdeb55fe3359acb19496a` |
| `experiments/run-races.js` | 5313 | `0d2882e56b85887b9dd966ea102b9c5578bcf5ea95e8521fecd4eaae7e2fe8e7` |
| `experiments/run-viz-curve.js` | 2710 | `fd8170f37e44cdb7b2e2106a49eac81d9154fd5e1b90aa614bb7b08ff50c1869` |
| `experiments/send-through-proxy.js` | 2882 | `62890986624f5a34c2d69b354bfbba00e4441e85eda46eb25ea9ecffdf85a587` |

## Phase 0 correction measurements

These are scoped correction checks, not the full Phase 4 experiment matrix.

### nonce-store growth from accepted requests

- Mode: accepted; requests: 100000.
- NONCE_TTL: 86400 seconds; duration: 915.017261 seconds (0.01059047755787037 of TTL).
- Empty namespace memory baseline: 1047648 bytes.
- Baseline-subtracted slope at 100,000 keys: 164.9632 bytes/key.
- Request timings: `corrections/nonce-memory-accepted-c2-accepted-100k-requests.csv`.

- 0 keys: 1047648 bytes; delta 0; baseline-subtracted n/a bytes/key; elapsed 0 seconds.
- 1000 keys: 1207648 bytes; delta 160000; baseline-subtracted 160 bytes/key; elapsed 6.7174853 seconds.
- 10000 keys: 2749408 bytes; delta 1701760; baseline-subtracted 170.176 bytes/key; elapsed 65.7088704 seconds.
- 100000 keys: 17543968 bytes; delta 16496320; baseline-subtracted 164.9632 bytes/key; elapsed 913.8555574 seconds.

### Race repeatability

- 50000 identical replay requests over 1000 batches of 50; accepted-count distribution: {"1":1000}.
- Secret-holder same-request-ID race: 50 different signed payloads; 1 accepted; debit 1; oracle {"totalDebited":1,"authorizedTotal":50,"duplicateDebitAmount":0,"duplicateDebitCount":0,"integrityHolds":true}.

### Clock boundary repetitions

- Repetitions per edge/case: 30.
- First rejected past age: 301s; first rejected future offset: +6s.
- Raw per-request timing CSV: `corrections/timestamp-boundaries-30-each.csv`.

### Repeated Phase 0 client clock offsets

- Repetitions per offset: 30; all rows record request start/end/duration.
- Outcomes: minus_10m -600000ms => TIMESTAMP_FAIL (30/30); minus_1m -60000ms => ACCEPTED (30/30); plus_10s 10000ms => TIMESTAMP_FAIL (30/30); plus_1m 60000ms => TIMESTAMP_FAIL (30/30); plus_10m 600000ms => TIMESTAMP_FAIL (30/30).
- Raw per-request timing CSV: `corrections/clock-offsets-30-each.csv`.

### Dashboard scan overhead

- Measured once with VIZ_ENABLED=true. This is an implementation artifact of demo key scanning, not a defense property.
- Samples: 1 keys: 17.6464 ms; 100 keys: 6.579 ms; 1000 keys: 21.2299 ms; 5000 keys: 23.0343 ms.


## Complete file contents

Source code is included in full. Small result files are included in full. For any result over 200 KB or 1,000 rows, only the first 20 rows, last 20 rows, and aggregate statistics are included; the full result stays on disk. Signature values are redacted in this dossier.

### `experiments/lib/http.js`

Bytes: 478. SHA-256: `fe6a4eb60013f22a24b7e0ea71c8934f6c16774d1d1657648250514338def1ac`.

```js
async function timedRequest(url, options = {}) {
  const start = process.hrtime.bigint();
  const response = await fetch(url, options);
  const text = await response.text();
  const end = process.hrtime.bigint();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return {
    start_ns: start.toString(),
    end_ns: end.toString(),
    duration_ns: (end - start).toString(),
    status: response.status,
    body
  };
}

module.exports = { timedRequest };
```

### `experiments/recording-proxy.js`

Bytes: 2883. SHA-256: `1bc22b51a2d4f8e8603de2f2ce362d1b2c3defb8c7bc5304e0b3c042bff0a100`.

```js
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const upstream = new URL(process.env.PROXY_UPSTREAM || 'http://127.0.0.1:3000');
if (!['127.0.0.1', 'localhost'].includes(upstream.hostname)) throw new Error('Recording proxy only permits a localhost upstream');
const port = Number(process.env.PROXY_PORT || 3002);
const outputPath = process.env.PROXY_CAPTURE_FILE || path.join(os.tmpdir(), 'cs-project-onpath-capture.json');
const captureLogPath = `${outputPath}.jsonl`;

const server = http.createServer((request, response) => {
  const started = process.hrtime.bigint();
  const chunks = [];
  request.on('data', (chunk) => chunks.push(chunk));
  request.on('end', () => {
    const bodyBuffer = Buffer.concat(chunks);
    const headers = { ...request.headers };
    delete headers.host;
    delete headers['content-length'];
    const proxyRequest = http.request({
      hostname: upstream.hostname,
      port: Number(upstream.port || 80),
      method: request.method,
      path: request.url,
      headers: { ...headers, 'content-length': bodyBuffer.length }
    }, (upstreamResponse) => {
      const responseChunks = [];
      upstreamResponse.on('data', (chunk) => responseChunks.push(chunk));
      upstreamResponse.on('end', () => {
        const responseBody = Buffer.concat(responseChunks);
        const ended = process.hrtime.bigint();
        const record = {
          capturedAt: new Date().toISOString(),
          start_ns: started.toString(),
          end_ns: ended.toString(),
          duration_ns: (ended - started).toString(),
          request: {
            method: request.method,
            path: request.url,
            headers: request.headers,
            body: bodyBuffer.toString('utf8')
          },
          response: { statusCode: upstreamResponse.statusCode, body: responseBody.toString('utf8') }
        };
        fs.appendFileSync(captureLogPath, `${JSON.stringify(record)}\n`, { mode: 0o600 });
        const tempPath = `${outputPath}.${process.pid}.tmp`;
        fs.writeFileSync(tempPath, `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
        fs.renameSync(tempPath, outputPath);
        response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
        response.end(responseBody);
      });
    });
    proxyRequest.on('error', (error) => {
      response.writeHead(502, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'UPSTREAM_UNAVAILABLE', message: error.message }));
    });
    proxyRequest.end(bodyBuffer);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Recording proxy listening on http://127.0.0.1:${port}; capture file: ${outputPath}`);
});

function shutdown() { server.close(() => process.exit(0)); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

### `experiments/render-documentation.js`

Bytes: 21591. SHA-256: `3f722e7c94b9d345ade9353b0a1607ee6ed58e9d5305dbc7b2d8dee5da6ac467`.

````js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = path.resolve(__dirname, '..');
const experimentRoot = path.join(projectRoot, 'experiments');
const resultRoot = path.join(experimentRoot, 'results');
const outputPath = path.join(projectRoot, 'docs', 'EXPERIMENTS.md');
const manifestPath = path.join(resultRoot, 'SHA256SUMS.json');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const absolutePath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
    });
}

function refreshResultManifest() {
  const files = walk(resultRoot).filter((filePath) => path.resolve(filePath) !== path.resolve(manifestPath));
  const entries = files.map((filePath) => ({
    path: relativePath(filePath),
    sizeBytes: fs.statSync(filePath).size,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
  }));
  fs.writeFileSync(manifestPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

function relativePath(absolutePath) {
  return path.relative(projectRoot, absolutePath).split(path.sep).join('/');
}

function sha256(absolutePath) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
  } catch (error) {
    return `unavailable while file is open: ${error.code || error.message}`;
  }
}

function fenceFor(text) {
  const longest = Math.max(0, ...Array.from(text.matchAll(/`+/g), (match) => match[0].length));
  return '`'.repeat(Math.max(3, longest + 1));
}

function languageFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return ({ '.js': 'js', '.json': 'json', '.csv': 'csv', '.log': 'text' })[extension] || 'text';
}

function percentile(sorted, percent) {
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * percent;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function aggregate(values) {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (!sorted.length) return { count: 0, min: null, max: null, mean: null, p50: null, p95: null, p99: null };
  return { count: sorted.length, min: sorted[0], max: sorted[sorted.length - 1],
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    p50: percentile(sorted, 0.5), p95: percentile(sorted, 0.95), p99: percentile(sorted, 0.99) };
}

function parseCsv(line) {
  const cells = []; let cell = ''; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { cells.push(cell); cell = ''; }
    else cell += char;
  }
  cells.push(cell); return cells;
}

function largeFileSummary(filePath, text, rows) {
  const aggregates = {};
  if (path.extname(filePath).toLowerCase() === '.csv' && rows.length > 1) {
    const headers = parseCsv(rows[0]); const columns = headers.map(() => []);
    for (const row of rows.slice(1)) parseCsv(row).forEach((value, index) => {
      if (value !== '' && Number.isFinite(Number(value))) columns[index].push(Number(value));
    });
    headers.forEach((header, index) => { if (columns[index].length) aggregates[header] = aggregate(columns[index]); });
  } else {
    const numbers = [...text.matchAll(/(?<![A-Za-z0-9_])[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g)].map((match) => Number(match[0]));
    aggregates.numericValues = aggregate(numbers);
  }
  return { totalRows: rows.length, first20: rows.slice(0, 20), last20: rows.slice(-20), aggregates };
}

function redactAuthenticationArtifacts(filePath, text) {
  if (/\.json$/i.test(filePath)) {
    text = text.replace(/("signature"\s*:\s*")[^"]*(")/gi, '$1[REDACTED SIGNATURE]$2');
  }
  if (/\.(json|log)$/i.test(filePath)) {
    text = text.replace(/((?:preserved )?signature:\s*)[0-9a-f]{16,}/gi, '$1[REDACTED SIGNATURE]');
  }
  return text;
}

function buildTree(files) {
  const nodes = new Map();
  for (const absolutePath of files) {
    const rel = path.relative(experimentRoot, absolutePath).split(path.sep);
    let current = '';
    for (let index = 0; index < rel.length; index += 1) {
      current = current ? `${current}/${rel[index]}` : rel[index];
      if (!nodes.has(current)) nodes.set(current, { name: rel[index], isDirectory: index < rel.length - 1 });
    }
  }
  const children = new Map();
  for (const [key, node] of nodes) {
    const parent = key.includes('/') ? key.slice(0, key.lastIndexOf('/')) : '';
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push({ ...node, key });
  }
  const lines = ['experiments/'];
  function emit(parent, prefix) {
    const entries = (children.get(parent) || []).sort((a, b) => a.name.localeCompare(b.name));
    entries.forEach((entry, index) => {
      const last = index === entries.length - 1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${entry.name}${entry.isDirectory ? '/' : ''}`);
      if (entry.isDirectory) emit(entry.key, `${prefix}${last ? '    ' : '│   '}`);
    });
  }
  emit('', '');
  return lines.join('\n');
}

refreshResultManifest();
const allFiles = walk(experimentRoot);
const resultFiles = allFiles.filter((filePath) => filePath.startsWith(`${resultRoot}${path.sep}`));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const manifestHashes = new Map(manifest.map((entry) => [entry.path, entry.sha256]));
const summary = JSON.parse(fs.readFileSync(path.join(resultRoot, 'baseline', 'phase0-summary.json'), 'utf8'));
const environment = JSON.parse(fs.readFileSync(path.join(resultRoot, 'environment.json'), 'utf8'));
const cases = JSON.parse(fs.readFileSync(path.join(resultRoot, 'baseline', 'measured-cases.json'), 'utf8'));
const nonceGrowth = JSON.parse(fs.readFileSync(path.join(resultRoot, 'baseline', 'nonce-growth-measured.json'), 'utf8'));

const lines = [];
const add = (...items) => lines.push(...items);
const code = String.fromCharCode(96);
add(
  '# Complete Experiment Dossier',
  '',
  'Generated from the current `experiments/` tree. It includes the complete folder structure, a file inventory, measured interpretation, and a full text/code listing of every file currently under `experiments/`.',
  '',
  '## Scope and evidence rules',
  '',
  '- Phase 0 baseline artifacts and Phase 1–3 implementation/test artifacts are recorded here. The full Phase 4 experiment matrix and Phase 5 USSD evaluation have not been run.',
  '- Every numeric finding below is read from a saved run artifact. No unrun experiment is represented as a result.',
  '- Phase 0 CSVs predate per-request monotonic timing; their missing durations are called out rather than reconstructed. Updated scripts record `process.hrtime.bigint()` start, end, and duration fields.',
  '- The WSL-only Bash attacker does not require Node.js; its client-side timing CSV uses WSL `date +%s%N`. The Windows server experiment log records monotonic `process.hrtime.bigint()` request and layer timings for those same requests.',
  '- Request HMAC signature values are redacted in this document because they are replay-capable authentication artifacts. Their source files remain unchanged in `experiments/results/`; the recorded hashes refer to those original files.',
  '- Every result file is inventoried with current path, byte size, and SHA-256. For a result over 200 KB or 1,000 rows, only its first 20 rows, last 20 rows, and aggregate statistics are shown; the complete file remains on disk. Source code and harness scripts stay in full.',
  '- The generated document itself is outside `experiments/`, so it is not included in the experiment tree or its result manifest.',
  '',
  '## Reproduction environment',
  '',
  `- Captured at: ${code}${environment.capturedAt}${code} UTC.`,
  `- Operating system: ${environment.host.osVersion} (${environment.host.os}).`,
  `- CPU: ${environment.host.cpuModel}; ${environment.host.logicalCpuCount} logical CPUs.`,
  `- RAM: ${environment.host.totalRamBytes} bytes (${environment.host.totalRamGiB} GiB).`,
  `- Node.js: ${environment.runtime.node}.`,
  `- SQLite Node package: ${environment.runtime.sqlite3NodePackage}; SQLite library: ${environment.runtime.sqliteLibrary}.`,
  `- Nonce store: ${environment.nonceBackend.product}, version ${environment.nonceBackend.memuraiVersion}; Redis protocol ${environment.nonceBackend.redisProtocolVersion}. Memurai, not stock Redis, was used.`,
  '- Memurai listens on IPv4 only. The configured URL is `redis://127.0.0.1:6379`; `localhost` may resolve to `::1` and fail.',
  '- Native Windows ports 3000, 3001, and 6379 were reachable. WSL reached the Windows API at `http://localhost:3000/api/health` with HTTP 200 and body `OK`.',
  `- Git commit captured in environment metadata: ${code}${environment.audit?.commitHash || 'not recorded'}${code}; status snapshot clean: ${environment.audit?.gitStatusClean ?? 'not recorded'}. The snapshot is preserved verbatim in ${code}results/environment.json${code}.`,
  '- The attacker shell ran in WSL. All server, Node, SQLite, Memurai, and measurement traffic ran on Windows and targeted only the local simulation.',
  '',
  '## Phase 0 run method',
  '',
  '1. Start the Windows Memurai service and verify it with `C:\\Applications\\memurai-cli.exe ping`.',
  '2. Set `REDIS_URL=redis://127.0.0.1:6379` in the ignored `server/.env` file.',
  '3. Start the server natively from `server/`; its startup log reports the bank API on 3000 and Socket.IO on 3001.',
  '4. From WSL, check `curl http://localhost:3000/api/health` before running attacks.',
  '5. Start `experiments/recording-proxy.js` on Windows and route a local client through port 3002; keep the exact request recording in a private temp directory outside the repository.',
  '6. Set WSL `CAPTURE_FILE` to the Windows recording path mounted into WSL, then run `attack/attack.sh --capture`, replay, tamper, stale-payload, and nonce-crash cases.',
  '7. A native Windows Node script sent 50 parallel copies of one valid payload, tested request-ID tampering and clock offsets, reset the demo state, created one successful seed transaction, cleared its nonce, then sent 10,000 sequential requests with fresh nonces and that already-successful request ID. They were rejected at request-ID after nonce consumption.',
  '8. `C:\\Applications\\memurai-cli.exe --scan --pattern used_nonce:*` counted nonce keys; `INFO memory` supplied `used_memory`.',
  '',
  'The Phase 0 parallel run used one batch of 50. Each Phase 0 clock offset was measured once. The Phase 0 10,000-request run is “nonce-store growth from requests rejected at the request-ID check,” not legitimate transactions.',
  '',
  '## Measured findings',
  '',
  '| Measurement | Observed result | Evidence |',
  '|---|---|---|',
  `| 50 identical parallel valid requests | ${cases.parallel50.counts.ACCEPTED} accepted; ${cases.parallel50.counts.NONCE_FAIL} returned NONCE_FAIL. | ${code}baseline/parallel-50-responses.json${code} |`,
  `| Changed request ID, original signature | HTTP ${cases.changedRequestIdWithOldSignature.httpStatus}, ${cases.changedRequestIdWithOldSignature.reason}. | ${code}baseline/measured-cases.json${code} |`,
  `| Clock skew -10m | ${cases.clockSkew.find((entry) => entry.label === '-10m').result.reason}. | ${code}baseline/measured-cases.json${code} |`,
  `| Clock skew -1m | ${cases.clockSkew.find((entry) => entry.label === '-1m').result.status}. | ${code}baseline/measured-cases.json${code} |`,
  `| Clock skew +10s, +1m, +10m | ${cases.clockSkew.filter((entry) => entry.label.startsWith('+')).map((entry) => `${entry.label}: ${entry.result.reason}`).join('; ')}. | ${code}baseline/measured-cases.json${code} |`,
  `| Exact in-window replay | ${readLog('immediate-replay.log').match(/"reason": "([^"]+)"/)?.[1] || 'see raw log'}. | ${code}baseline/immediate-replay.log${code} |`,
  `| Replay after nonce store clear | ${readLog('replay-after-nonce-crash.log').match(/"reason": "([^"]+)"/)?.[1] || 'see raw log'}; crash endpoint deleted ${JSON.parse(fs.readFileSync(path.join(resultRoot, 'baseline', 'nonce-crash.json'), 'utf8')).deleted} key. | ${code}baseline/replay-after-nonce-crash.log${code}, ${code}baseline/nonce-crash.json${code} |`,
  `| Nonce-store growth from requests rejected at the request-ID check | ${nonceGrowth.usedNonceKeys} keys; ${code}${nonceGrowth.usedMemoryBytes}${code} bytes used_memory (${nonceGrowth.usedMemoryHuman}). | ${code}baseline/nonce-growth-measured.json${code}, ${code}baseline/unique-nonce-10000-responses.csv${code} |`,
  '| Tampered amount with a fresh signed source | SIGNATURE_FAIL. | `baseline/tamper-fresh.log` |',
  '| Correctly signed payload older than 300 seconds | TIMESTAMP_FAIL. | `baseline/stale-replay.log` |',
  '| WSL to Windows health check | HTTP 200; body `OK`, before and after server restart. | `baseline/wsl-health.log`, `baseline/wsl-health-postrotation.log` |',
  '',
  '### Section 5 comparison',
  '',
  `The Phase 0 comparison recorded ${summary.section5Comparison.mismatchesAmongMeasuredCases.length} mismatches among measured cases. Tested response descriptions matched the report for health, accepted withdrawal, fresh tampering, stale signed request, reused nonce, request-ID replay after nonce clearing, and capture mode.`,
  '',
  'Section 5 responses in `PROJECT_AUDIT_REPORT.md` are labeled as measured or code-derived. The Phase 0 10,000-request artifact represents requests rejected at the request-ID check; nonce records were written before that check.',
  '',
  '### Future timestamp tolerance hypothesis for E3',
  '',
  'E3 should sweep future tolerance values of 0 s, 5 s, 30 s, and 60 s and measure false rejections for fast legitimate client clocks. Phase 0 observed rejection at +10 s under the 5 s default. The sweep is a hypothesis to test; no false-rejection rate is claimed yet.',
  '',
  '### On-path capture procedure',
  '',
  '`recording-proxy.js` is a local Node proxy restricted to a localhost upstream. Route the UI/API client to port 3002 and set `PROXY_CAPTURE_FILE` to a private path outside the repository. The proxy saves the exact request method, path, headers, and body it forwards. `attack/attack.sh --replay` reads the proxy envelope from `CAPTURE_FILE`; it does not use a payload file written by the server. Capture files include a signature and authorization header, so keep them outside `experiments/`, `docs/`, and version control.',
  '',
  '### Tests and build',
  '',
  '- Server unit and integration tests use Node’s built-in test runner on Windows. Their captured output is inventoried below.',
  '- The bank UI production build was run after removing the global signing secret from browser code. Client requests use a per-session signing key held in memory.',
  '- Legacy shared-secret verification remains behind `LEGACY_SHARED_SECRET=true`; the browser bundle contains no global shared key.',
  '',
  '## Experiment directory structure',
  '',
  '```text',
  buildTree(allFiles),
  '```',
  '',
  '## File inventory',
  '',
  '| File | Bytes | SHA-256 |',
  '|---|---:|---|'
);

for (const absolutePath of allFiles) {
  const rel = relativePath(absolutePath);
  const stat = fs.statSync(absolutePath);
  const listedHash = manifestHashes.get(rel);
  const digest = listedHash || sha256(absolutePath);
  add(`| ${code}${rel}${code} | ${stat.size} | ${code}${digest}${code} |`);
}

const correctionArtifacts = path.join(resultRoot, 'corrections');
if (fs.existsSync(correctionArtifacts)) {
  add('', '## Phase 0 correction measurements', '', 'These are scoped correction checks, not the full Phase 4 experiment matrix.', '');
  const memoryFiles = fs.readdirSync(correctionArtifacts).filter((name) => /^nonce-memory-(accepted|requestid)-.*100k-summary\.json$/.test(name));
  for (const name of memoryFiles) {
    const result = JSON.parse(fs.readFileSync(path.join(correctionArtifacts, name), 'utf8'));
    add(`### ${result.label}`, '', `- Mode: ${result.mode}; requests: ${result.requestCount}.`, `- NONCE_TTL: ${result.nonceTtlSeconds} seconds; duration: ${result.durationSeconds} seconds (${result.durationVsTtl} of TTL).`, `- Empty namespace memory baseline: ${result.baselineUsedMemoryBytes} bytes.`, `- Baseline-subtracted slope at 100,000 keys: ${result.baselineSubtractedSlopeBytesPerKey} bytes/key.`, `- Request timings: ${code}corrections/${result.requestRowsCsv}${code}.`, '');
    for (const snapshot of result.snapshots) add(`- ${snapshot.measuredKeys} keys: ${snapshot.usedMemoryBytes} bytes; delta ${snapshot.deltaBytes}; baseline-subtracted ${snapshot.bytesPerKeyAboveBaseline ?? 'n/a'} bytes/key; elapsed ${snapshot.elapsedSeconds ?? 0} seconds.`);
    add('');
  }
  const racePath = path.join(correctionArtifacts, 'race-summary-1000-batches.json');
  if (fs.existsSync(racePath)) {
    const race = JSON.parse(fs.readFileSync(racePath, 'utf8'));
    add('### Race repeatability', '', `- ${race.identicalPayloadRace.totalRequests} identical replay requests over ${race.identicalPayloadRace.batches} batches of ${race.identicalPayloadRace.parallelWidth}; accepted-count distribution: ${JSON.stringify(race.identicalPayloadRace.acceptedCountDistribution)}.`, `- Secret-holder same-request-ID race: ${race.secretHolderSameRequestIdRace.parallelWidth} different signed payloads; ${race.secretHolderSameRequestIdRace.acceptedCount} accepted; debit ${race.secretHolderSameRequestIdRace.debitAmount}; oracle ${JSON.stringify(race.secretHolderSameRequestIdRace.oracle)}.`, '');
  }
  const boundaryPath = path.join(correctionArtifacts, 'timestamp-boundaries-30-each.json');
  if (fs.existsSync(boundaryPath)) {
    const boundary = JSON.parse(fs.readFileSync(boundaryPath, 'utf8'));
    add('### Clock boundary repetitions', '', `- Repetitions per edge/case: ${boundary.repetitionsPerCase}.`, `- First rejected past age: ${boundary.firstRejectedPastAgeSeconds}s; first rejected future offset: +${boundary.firstRejectedFutureOffsetSeconds}s.`, `- Raw per-request timing CSV: ${code}corrections/timestamp-boundaries-30-each.csv${code}.`, '');
  }
  const clockOffsetsPath = path.join(correctionArtifacts, 'clock-offsets-30-each.json');
  if (fs.existsSync(clockOffsetsPath)) {
    const clockOffsets = JSON.parse(fs.readFileSync(clockOffsetsPath, 'utf8'));
    add('### Repeated Phase 0 client clock offsets', '', `- Repetitions per offset: ${clockOffsets.repetitionsPerOffset}; all rows record request start/end/duration.`, `- Outcomes: ${clockOffsets.cases.map((item) => `${item.label} ${item.offsetMs}ms => ${item.expected} (${item.measuredCount}/${clockOffsets.repetitionsPerOffset})`).join('; ')}.`, `- Raw per-request timing CSV: ${code}corrections/clock-offsets-30-each.csv${code}.`, '');
  }
  const vizPath = path.join(correctionArtifacts, 'viz-enabled-nonce-scan-summary.json');
  if (fs.existsSync(vizPath)) {
    const viz = JSON.parse(fs.readFileSync(vizPath, 'utf8'));
    add('### Dashboard scan overhead', '', '- Measured once with VIZ_ENABLED=true. This is an implementation artifact of demo key scanning, not a defense property.', `- Samples: ${viz.nonceKeySamples.map((sample) => `${sample.nonceKeysAtDashboardScan} keys: ${sample.duration_ms} ms`).join('; ')}.`, '');
  }
}

add('', '## Complete file contents', '', 'Source code is included in full. Small result files are included in full. For any result over 200 KB or 1,000 rows, only the first 20 rows, last 20 rows, and aggregate statistics are included; the full result stays on disk. Signature values are redacted in this dossier.', '');

for (const absolutePath of allFiles) {
  const rel = relativePath(absolutePath);
  const stat = fs.statSync(absolutePath);
  add(`### ${code}${rel}${code}`, '', `Bytes: ${stat.size}. SHA-256: ${code}${manifestHashes.get(rel) || sha256(absolutePath)}${code}.`, '');
  if (stat.size === 0) {
    add('_Empty file (0 bytes)._','');
    continue;
  }
  let text = fs.readFileSync(absolutePath, 'utf8');
  text = redactAuthenticationArtifacts(rel, text);
  const rows = text.replace(/\r\n/g, '\n').split('\n');
  if (rows.at(-1) === '') rows.pop();
  const isResult = absolutePath.startsWith(`${resultRoot}${path.sep}`) && rel !== 'experiments/results/SHA256SUMS.json';
  if (isResult && (stat.size > 200 * 1024 || rows.length > 1000)) {
    const summary = largeFileSummary(absolutePath, text, rows);
    const excerpt = [...summary.first20, '... omitted rows ...', ...summary.last20].join('\n');
    add('Large-result rule applied. The complete result remains on disk.', '', `Total rows: ${summary.totalRows}.`, '', 'Aggregate statistics (counts, min, max, mean, p50, p95, and p99 for numeric columns):', '', `${code.repeat(3)}json`, JSON.stringify(summary.aggregates, null, 2), code.repeat(3), '', `${code.repeat(3)}${languageFor(rel)}`, excerpt, code.repeat(3), '');
    continue;
  }
  const fence = fenceFor(text);
  add(`${fence}${languageFor(rel)}`, text.endsWith('\n') ? text.slice(0, -1) : text, fence, '');
}

function readLog(name) {
  return fs.readFileSync(path.join(resultRoot, 'baseline', name), 'utf8');
}

fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
process.stdout.write(`Wrote ${relativePath(outputPath)} with ${allFiles.length} experiment files.\n`);
````

### `experiments/results/baseline/capture-trigger.json`

Bytes: 424. SHA-256: `f700cd2e5a2a749e3a472e3eec502cc4951818466e4e4894acc815f571b6f19a`.

```json
[
    {
        "body":  {
                     "amount":  1000,
                     "status":  "ACCEPTED",
                     "newBalance":  9000
                 },
        "httpStatus":  200
    },
    {
        "body":  {
                     "amount":  1000,
                     "status":  "ACCEPTED",
                     "newBalance":  8000
                 },
        "httpStatus":  200
    }
]
```

### `experiments/results/baseline/capture.log`

Bytes: 492. SHA-256: `1cab16306fde8e4e0b2e95040fc600bd1c1d89df6e012924197f85fa4daaa656`.

```text
[EVE] Waiting for Anis's next withdraw...
[EVE] Monitoring captured request...
[EVE] NEW WITHDRAW PACKET CAPTURED
[EVE] method: POST
[EVE] path: /api/withdraw
[EVE] user_id: anis_101
[EVE] amount: 1000
[EVE] timestamp: 2026-10-17T18:48:50.152Z
[EVE] nonce: f03439f8-6a03-4b77-b892-43b21fd0494d
[EVE] request_id: f25fb3c0-c7bb-4a1d-8175-dc4cecad091a
[EVE] signature: [REDACTED SIGNATURE]
[EVE] Exact captured request saved to /tmp/eve-captured.json
```

### `experiments/results/baseline/check-ports-postrotation.js`

Bytes: 586. SHA-256: `3868c6828fcdbee1d861276e61014e8d92218d1853ebd99b8fc94dfa6b133043`.

```js
const net=require("net"),fs=require("fs"),path=require("path");
const ports=[3000,3001,6379];
Promise.all(ports.map(port=>new Promise(resolve=>{const s=net.createConnection({host:"127.0.0.1",port});s.once("connect",()=>{s.destroy();resolve({port,reachable:true})});s.once("error",e=>resolve({port,reachable:false,error:e.message}))}))).then(results=>{const out=path.resolve(process.cwd(),"../experiments/results/baseline/postrotation-port-check.json");fs.writeFileSync(out,JSON.stringify({checkedAt:new Date().toISOString(),results},null,2)+"\n");console.log(JSON.stringify(results))});
```

### `experiments/results/baseline/collect-environment.js`

Bytes: 3595. SHA-256: `e77a2fa7cc56f1f55f3ee4d504098199a5ce9f6dec4329088827e2380dd6d8ba`.

```js
const fs = require("fs");
const os = require("os");
const path = require("path");
const net = require("net");
const { execFileSync } = require("child_process");
require(path.join(process.cwd(), "node_modules/dotenv")).config({ path: path.join(process.cwd(), ".env") });
const outDir = path.resolve(process.cwd(), "../experiments/results");
const cli = "C:/Applications/memurai-cli.exe";
const info = execFileSync(cli, ["INFO", "server"], { encoding: "utf8" });
const mem = execFileSync(cli, ["INFO", "memory"], { encoding: "utf8" });
const scan = execFileSync(cli, ["--scan", "--pattern", "used_nonce:*"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
const parse = text => Object.fromEntries(text.split(/\r?\n/).filter(line => line && !line.startsWith("#") && line.includes(":" )).map(line => { const i=line.indexOf(":"); return [line.slice(0,i),line.slice(i+1)]; }));
const probe = port => new Promise(resolve => { const socket = net.createConnection({ host: "127.0.0.1", port }); socket.once("connect", () => { socket.destroy(); resolve(true); }); socket.once("error", () => resolve(false)); });
(async () => {
  const dbVersion = await new Promise((resolve, reject) => { const sqlite3 = require(path.join(process.cwd(), "node_modules/sqlite3")); const db = new sqlite3.Database(":memory:", error => { if (error) return reject(error); db.get("SELECT sqlite_version() AS version", (queryError,row) => { db.close(); queryError ? reject(queryError) : resolve(row.version); }); }); });
  const ports = { "3000": await probe(3000), "3001": await probe(3001), "6379": await probe(6379) };
  const redis = parse(info), memory = parse(mem);
  const result = {
    capturedAt: new Date().toISOString(),
    host: { os: `${os.platform()} ${os.release()}`, osVersion: os.version(), cpuModel: os.cpus()[0]?.model || "unknown", logicalCpuCount: os.cpus().length, totalRamBytes: os.totalmem(), totalRamGiB: Number((os.totalmem()/1024**3).toFixed(2)) },
    runtime: { node: process.version, sqlite3NodePackage: require(path.join(process.cwd(), "node_modules/sqlite3/package.json")).version, sqliteLibrary: dbVersion },
    nonceBackend: { product: "Memurai Developer (not stock Redis)", memuraiVersion: redis.memurai_version, edition: redis.memurai_edition, redisProtocolVersion: redis.redis_version, bind: redis.listener0, usedNonceKeys: scan.split(/\r?\n/).filter(Boolean).length, usedMemoryBytes: Number(memory.used_memory), usedMemoryHuman: memory.used_memory_human },
    portsReachableFromNativeNode: ports,
    apiHealth: await (async()=>{ try { const start=process.hrtime.bigint(); const response=await fetch("http://127.0.0.1:3000/api/health"); const body=await response.text(); const end=process.hrtime.bigint(); return { status: response.status, body, started_ns:start.toString(), ended_ns:end.toString(), duration_ns:(end-start).toString() }; } catch(error) { return { error: error.message }; } })(),
    redisUrl: process.env.REDIS_URL
  };
  fs.writeFileSync(path.join(outDir, "environment.json"), JSON.stringify(result, null, 2)+"\n");
  fs.writeFileSync(path.join(outDir, "baseline/nonce-growth-measured.json"), JSON.stringify({ capturedAt: result.capturedAt, usedNonceKeys: result.nonceBackend.usedNonceKeys, usedMemoryBytes: result.nonceBackend.usedMemoryBytes, usedMemoryHuman: result.nonceBackend.usedMemoryHuman, memuraiVersion: result.nonceBackend.memuraiVersion, nonceTtlSeconds: 300, requestsWithUniqueNonces: 10000 }, null, 2)+"\n");
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
```

### `experiments/results/baseline/immediate-replay-trigger.json`

Bytes: 110. SHA-256: `d9034a2dd43861cbd2d3ab5066bf0654deac12d2a1c3dd7eed3ad76b3d25d96f`.

```json
{
  "httpStatus": 200,
  "body": {
    "status": "ACCEPTED",
    "amount": 1000,
    "newBalance": 7000
  }
}
```

### `experiments/results/baseline/immediate-replay.log`

Bytes: 257. SHA-256: `3363bff4e80a9133d637236cfe5017c9994c1ea5d3658be4e1a339c0b28788d5`.

```text
[EVE] Using attacker-side captured request: /tmp/eve-captured.json
[EVE] Starting Replay Attack on localhost:3000...
[EVE] Payload: /tmp/eve-captured.json
[EVE] Payload age: 1s
[EVE] Replay attempt #1...
{
  "status": "REJECTED",
  "reason": "NONCE_FAIL"
}
```

### `experiments/results/baseline/make-stale-payload.js`

Bytes: 728. SHA-256: `f82ad38fc79eb0a6b7fbcf9fb134614bb0cece2bc03415c23e7082cb5d8f2494`.

```js
const path = require("path");
require(path.join(process.cwd(), "node_modules/dotenv")).config({ path: path.join(process.cwd(), ".env") });
const { generateSignature } = require(path.join(process.cwd(), "utils/hmac"));
const crypto = require("crypto");
const payload = { method: "POST", path: "/api/withdraw", user_id: "anis_101", account_id: "acc_777", amount: 1000, currency: "BDT", timestamp: new Date(Date.now() - 301000).toISOString(), nonce: crypto.randomUUID(), request_id: crypto.randomUUID() };
payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
require("fs").writeFileSync(path.resolve(process.cwd(), "../experiments/results/baseline/stale-payload.json"), JSON.stringify(payload, null, 2) + "\n");
```

### `experiments/results/baseline/make-tamper-source.js`

Bytes: 675. SHA-256: `ca566a8824d0cbe6746b900396834a3a7600bb4da9e35bf13da5b8e9dabd3946`.

```js
const fs = require("fs"), path = require("path"), crypto = require("crypto");
require(path.join(process.cwd(), "node_modules/dotenv")).config({path:path.join(process.cwd(), ".env")});
const {generateSignature}=require(path.join(process.cwd(), "utils/hmac"));
const payload={method:"POST",path:"/api/withdraw",user_id:"anis_101",account_id:"acc_777",amount:1000,currency:"BDT",timestamp:new Date().toISOString(),nonce:crypto.randomUUID(),request_id:crypto.randomUUID()};
payload.signature=generateSignature(payload,process.env.HMAC_SECRET);
fs.writeFileSync(path.resolve(process.cwd(),"../experiments/results/baseline/tamper-source.json"),JSON.stringify(payload,null,2)+"\n");
```

### `experiments/results/baseline/measured-cases.json`

Bytes: 1598. SHA-256: `9ef5e75670fca61eceffcd14ef023038a887be7978435df1395108023088106d`.

```json
{
  "parallel50": {
    "total": 50,
    "counts": {
      "ACCEPTED": 1,
      "NONCE_FAIL": 49
    }
  },
  "changedRequestIdWithOldSignature": {
    "httpStatus": 401,
    "status": "REJECTED",
    "reason": "SIGNATURE_FAIL"
  },
  "clockSkew": [
    {
      "label": "-10m",
      "offsetMs": -600000,
      "result": {
        "httpStatus": 400,
        "status": "REJECTED",
        "reason": "TIMESTAMP_FAIL"
      }
    },
    {
      "label": "-1m",
      "offsetMs": -60000,
      "result": {
        "httpStatus": 200,
        "status": "ACCEPTED",
        "amount": 1,
        "newBalance": 6998
      }
    },
    {
      "label": "+10s",
      "offsetMs": 10000,
      "result": {
        "httpStatus": 400,
        "status": "REJECTED",
        "reason": "TIMESTAMP_FAIL"
      }
    },
    {
      "label": "+1m",
      "offsetMs": 60000,
      "result": {
        "httpStatus": 400,
        "status": "REJECTED",
        "reason": "TIMESTAMP_FAIL"
      }
    },
    {
      "label": "+10m",
      "offsetMs": 600000,
      "result": {
        "httpStatus": 400,
        "status": "REJECTED",
        "reason": "TIMESTAMP_FAIL"
      }
    }
  ],
  "nonceGrowth": {
    "resetPerformed": true,
    "seedResult": {
      "httpStatus": 200,
      "status": "ACCEPTED",
      "amount": 1,
      "newBalance": 9999
    },
    "nonceStoreClearedBeforeLoop": {
      "ok": true,
      "deleted": 1
    },
    "requests": 10000,
    "uniqueNonces": 10000,
    "reusedRequestId": "41b4e07f-4190-4eed-af01-ba2298912b5f",
    "responseCounts": {
      "ALREADY_PROCESSED": 10000
    }
  }
}
```

### `experiments/results/baseline/nonce-crash.json`

Bytes: 33. SHA-256: `b58f475bf46783a6b01f59e1c665e161efaccdd05cc577f7d87282ab3904cfaa`.

```json
{
  "ok": true,
  "deleted": 1
}
```

### `experiments/results/baseline/nonce-growth-measured.json`

Bytes: 560. SHA-256: `61a85e7fb13d80833fc6882d2e36d3533bd5a19234111bd1c8c5dc51d8050d47`.

```json
{
  "capturedAt": "2026-10-17T19:00:15.066Z",
  "usedNonceKeys": 10000,
  "usedMemoryBytes": 2519240,
  "usedMemoryHuman": "2.40M",
  "memuraiVersion": "4.2.3",
  "nonceTtlSeconds": 300,
  "requestsWithUniqueNonces": 10000,
  "label": "nonce-store growth from requests rejected at the request-ID check",
  "disposition": "Each request had a fresh nonce and reused a request_id already stored as SUCCESS; it was rejected after nonce acceptance.",
  "requestsAccepted": 0,
  "durationSeconds": null,
  "durationVsNonceTtl": null,
  "durationWasRecorded": false
}
```

### `experiments/results/baseline/npm-test-client-bank.log`

Bytes: 322. SHA-256: `490434ce49cd2e4453c626c22daecb12f3e8c19c4f35ed58569a318b89398832`.

```text
npm error Missing script: "test"
npm error
npm error To see a list of scripts, run:
npm error   npm run
npm error Log files were not written due to an error writing to the directory: C:\Users\Home\AppData\Local\npm-cache\_logs
npm error You can rerun the command with `--loglevel=verbose` to see the logs in your terminal
```

### `experiments/results/baseline/npm-test-client-viz.log`

Bytes: 322. SHA-256: `490434ce49cd2e4453c626c22daecb12f3e8c19c4f35ed58569a318b89398832`.

```text
npm error Missing script: "test"
npm error
npm error To see a list of scripts, run:
npm error   npm run
npm error Log files were not written due to an error writing to the directory: C:\Users\Home\AppData\Local\npm-cache\_logs
npm error You can rerun the command with `--loglevel=verbose` to see the logs in your terminal
```

### `experiments/results/baseline/npm-test-server.log`

Bytes: 322. SHA-256: `490434ce49cd2e4453c626c22daecb12f3e8c19c4f35ed58569a318b89398832`.

```text
npm error Missing script: "test"
npm error
npm error To see a list of scripts, run:
npm error   npm run
npm error Log files were not written due to an error writing to the directory: C:\Users\Home\AppData\Local\npm-cache\_logs
npm error You can rerun the command with `--loglevel=verbose` to see the logs in your terminal
```

### `experiments/results/baseline/npm-test-status.json`

Bytes: 456. SHA-256: `0f0faa7de5a562e2f78ec780adc2ddb1eb4d0b2a90941ac856cea6341b642339`.

```json
[
    {
        "package":  "server",
        "exitCode":  1,
        "passed":  false,
        "outputFile":  "npm-test-server.log"
    },
    {
        "package":  "client\\bank",
        "exitCode":  1,
        "passed":  false,
        "outputFile":  "npm-test-client-bank.log"
    },
    {
        "package":  "client\\viz",
        "exitCode":  1,
        "passed":  false,
        "outputFile":  "npm-test-client-viz.log"
    }
]
```

### `experiments/results/baseline/parallel-50-responses.json`

Bytes: 4266. SHA-256: `49e842ef8fb686d8a2cf7c308049d3103ab0f87a3306b32908dd9a2455d484c0`.

```json
[
  {
    "httpStatus": 200,
    "status": "ACCEPTED",
    "amount": 1,
    "newBalance": 6999
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  },
  {
    "httpStatus": 409,
    "status": "REJECTED",
    "reason": "NONCE_FAIL"
  }
]
```

### `experiments/results/baseline/payload.before-capture.json`

Bytes: 359. SHA-256: `e38c70b834363e9ecce8e5f6d250a76ffdfc56b22e67d28c4fcf3aa22b8e2add`.

```json
{
  "method": "POST",
  "path": "/api/withdraw",
  "user_id": "anis_101",
  "account_id": "acc_777",
  "amount": 1000,
  "currency": "BDT",
  "timestamp": "2026-10-03T06:11:29.470Z",
  "nonce": "nonce_5a453b3c87fed50da5f33189",
  "request_id": "wd_9ba7baf89308d4cc49a3d39e",
  "signature": "[REDACTED SIGNATURE]"
}
```

### `experiments/results/baseline/phase0-summary.json`

Bytes: 3028. SHA-256: `89650cca53dba6031e943cb44184d7ed2cbe9b501663b64ef2423a686e7aaa43`.

```json
{
  "phase": 0,
  "status": "measured",
  "environment": "../environment.json",
  "ports": {
    "windowsNative": {
      "3000": "reachable",
      "3001": "reachable",
      "6379": "reachable"
    },
    "wslToWindowsHealth": "HTTP 200, body OK"
  },
  "measuredAnswers": {
    "parallelIdenticalRequests": {
      "total": 50,
      "accepted": 1,
      "rejected": 49,
      "reasons": {
        "NONCE_FAIL": 49
      },
      "raw": "parallel-50-responses.json"
    },
    "inWindowReplayAfterNonceCrash": {
      "blocked": true,
      "reason": "ALREADY_PROCESSED",
      "raw": "replay-after-nonce-crash.log"
    },
    "changedRequestIdWithOldSignature": {
      "httpStatus": 401,
      "reason": "SIGNATURE_FAIL",
      "raw": "../measured-cases.json"
    },
    "uniqueNonceGrowth": {
      "requests": 10000,
      "uniqueNonces": 10000,
      "redisCompatibleKeys": 10000,
      "usedMemoryBytes": 2519240,
      "usedMemoryHuman": "2.40M",
      "product": "Memurai Developer 4.2.3, not stock Redis",
      "raw": "nonce-growth-measured.json",
      "label": "nonce-store growth from requests rejected at the request-ID check",
      "disposition": "Each request had a fresh nonce and reused a request_id already stored as SUCCESS; it was rejected after nonce acceptance.",
      "durationRecorded": false
    },
    "clockOffsets": {
      "-10m": "TIMESTAMP_FAIL",
      "-1m": "ACCEPTED",
      "+10s": "TIMESTAMP_FAIL",
      "+1m": "TIMESTAMP_FAIL",
      "+10m": "TIMESTAMP_FAIL",
      "raw": "../measured-cases.json"
    }
  },
  "attackFlows": {
    "capture": "capture.log",
    "immediateReplay": "immediate-replay.log",
    "tamper": "tamper-fresh.log",
    "stalePayloadOver300Seconds": "stale-replay.log",
    "replayAfterNonceCrash": "replay-after-nonce-crash.log"
  },
  "section5Comparison": {
    "mismatchesAmongMeasuredCases": [],
    "measuredMatches": [
      "health returned HTTP 200 and plain-text OK",
      "valid withdrawal returned ACCEPTED with amount and newBalance",
      "fresh amount tampering returned SIGNATURE_FAIL",
      "stale signed payload returned TIMESTAMP_FAIL",
      "exact in-window replay returned NONCE_FAIL",
      "replay after nonce-store clearing returned ALREADY_PROCESSED",
      "capture mode printed the watched payload fields and saved the capture"
    ],
    "remainingRowsUnmeasured": [
      "known and unknown account lookup and transaction history",
      "deposit success and rejection cases",
      "unknown account and insufficient balance",
      "malformed requests and unhandled server errors",
      "default attack and continuous-loop modes",
      "invalid CLI, payload, and missing-jq cases"
    ],
    "note": "Section 5 describes implementation-derived outputs. The listed remaining rows were not treated as experimentally verified."
  },
  "tests": {
    "passed": 0,
    "failed": 3,
    "reason": "npm test was attempted in server, client/bank, and client/viz; none defines a test script. Logs are saved beside this summary."
  }
}
```

### `experiments/results/baseline/postrotation-port-check.json`

Bytes: 236. SHA-256: `8578b80c198c9367c3ae2c3b2b2b0276397f4aae3ab66837bbd1cc0db0ce3d76`.

```json
{
  "checkedAt": "2026-10-17T19:06:25.991Z",
  "results": [
    {
      "port": 3000,
      "reachable": true
    },
    {
      "port": 3001,
      "reachable": true
    },
    {
      "port": 6379,
      "reachable": true
    }
  ]
}
```

### `experiments/results/baseline/replay-after-nonce-crash.log`

Bytes: 264. SHA-256: `2171424860aaa034ca58bce8625a48c0a9881860a0194d4117133c75690e7daf`.

```text
[EVE] Using attacker-side captured request: /tmp/eve-captured.json
[EVE] Starting Replay Attack on localhost:3000...
[EVE] Payload: /tmp/eve-captured.json
[EVE] Payload age: 2s
[EVE] Replay attempt #1...
{
  "status": "REJECTED",
  "reason": "ALREADY_PROCESSED"
}
```

### `experiments/results/baseline/replay.log`

Bytes: 1020. SHA-256: `512839c3112ccb2f2d921f717ba42165caeadd8856ca585bec6562a2a502cda5`.

```text
[EVE] Using attacker-side captured request: /tmp/eve-captured.json
[EVE] Starting Replay Attack on localhost:3000...
[EVE] Payload: /tmp/eve-captured.json
[EVE] Payload age: 400s
[EVE] Replay attempt #1...
{
  "status": "REJECTED",
  "reason": "TIMESTAMP_FAIL"
}
[EVE] Replay attempt #2...
{
  "status": "REJECTED",
  "reason": "TIMESTAMP_FAIL"
}
[EVE] Replay attempt #3...
{
  "status": "REJECTED",
  "reason": "TIMESTAMP_FAIL"
}
[EVE] Replay attempt #4...
{
  "status": "REJECTED",
  "reason": "TIMESTAMP_FAIL"
}
[EVE] Replay attempt #5...
{
  "status": "REJECTED",
  "reason": "TIMESTAMP_FAIL"
}
[EVE] Replay attempt #6...
{
  "status": "REJECTED",
  "reason": "TIMESTAMP_FAIL"
}
[EVE] Replay attempt #7...
{
  "status": "REJECTED",
  "reason": "TIMESTAMP_FAIL"
}
[EVE] Replay attempt #8...
{
  "status": "REJECTED",
  "reason": "TIMESTAMP_FAIL"
}
[EVE] Replay attempt #9...
{
  "status": "REJECTED",
  "reason": "TIMESTAMP_FAIL"
}
[EVE] Replay attempt #10...
{
  "status": "REJECTED",
  "reason": "TIMESTAMP_FAIL"
}
```

### `experiments/results/baseline/reset.json`

Bytes: 521. SHA-256: `f46476d565e16f2eab8e000b4a76e6473bd1d5bff978e002c977c9803000e10d`.

```json
{
    "status":  "RESET",
    "accounts":  [
                     {
                         "user_id":  "anis_101",
                         "username":  "Anis Ahmed",
                         "balance":  10000,
                         "currency":  "BDT",
                         "created_at":  "2026-09-21 05:30:11"
                     }
                 ],
    "transactions":  [

                     ],
    "clearedNonceKeys":  [

                         ],
    "keys":  [

             ]
}
```

### `experiments/results/baseline/run-measured-cases.js`

Bytes: 4375. SHA-256: `629b1a3e464de26d08b78e1c6cb13538dafa8583eb237b84d1a85289a0e28560`.

```js
const fs = require("fs");
const path = require("path");
require(path.join(process.cwd(), "node_modules/dotenv")).config({ path: path.join(process.cwd(), ".env") });
const crypto = require("crypto");
const { generateSignature } = require(path.join(process.cwd(), "utils/hmac"));
const outDir = path.resolve(process.cwd(), "../experiments/results/baseline");
const base = () => ({ method: "POST", path: "/api/withdraw", user_id: "anis_101", account_id: "acc_777", amount: 1, currency: "BDT", timestamp: new Date().toISOString(), nonce: crypto.randomUUID(), request_id: crypto.randomUUID() });
const sign = payload => { payload.signature = generateSignature(payload, process.env.HMAC_SECRET); return payload; };
const post = async payload => { const start = process.hrtime.bigint(); const response = await fetch("http://127.0.0.1:3000/api/withdraw", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); const body = await response.json(); const end = process.hrtime.bigint(); return { started_ns: start.toString(), ended_ns: end.toString(), duration_ns: (end-start).toString(), httpStatus: response.status, ...body }; };
const key = result => result.status === "ACCEPTED" ? "ACCEPTED" : (result.reason || result.error || "UNKNOWN");
(async () => {
  const parallelPayload = sign(base());
  const parallel = await Promise.all(Array.from({ length: 50 }, () => post(parallelPayload)));
  const parallelCounts = parallel.reduce((acc, result) => { const k = key(result); acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  fs.writeFileSync(path.join(outDir, "parallel-50-responses.json"), JSON.stringify(parallel, null, 2) + "\n");
  const changedIdPayload = sign(base());
  changedIdPayload.request_id = crypto.randomUUID();
  const changedId = await post(changedIdPayload);
  const skew = [];
  for (const [label, offsetMs] of [["-10m", -600000], ["-1m", -60000], ["+10s", 10000], ["+1m", 60000], ["+10m", 600000]]) {
    const payload = sign(base());
    payload.timestamp = new Date(Date.now() + offsetMs).toISOString();
    payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
    skew.push({ label, offsetMs, result: await post(payload) });
  }
  const resetStart = process.hrtime.bigint();
  const resetResponse = await fetch("http://127.0.0.1:3000/api/reset", { method: "POST" });
  const resetEnd = process.hrtime.bigint();
  const resetTiming = { started_ns: resetStart.toString(), ended_ns: resetEnd.toString(), duration_ns: (resetEnd-resetStart).toString(), httpStatus: resetResponse.status };
  const seed = sign(base());
  const seedResult = await post(seed);
  const crashStart = process.hrtime.bigint();
  const crashResponse = await fetch("http://127.0.0.1:3000/api/demo/nonce-crash", { method: "POST" });
  const nonceCrash = await crashResponse.json();
  const crashEnd = process.hrtime.bigint();
  nonceCrash.timing = { started_ns: crashStart.toString(), ended_ns: crashEnd.toString(), duration_ns: (crashEnd-crashStart).toString(), httpStatus: crashResponse.status };
  const duplicateId = seed.request_id;
  const rows = ["index,started_ns,ended_ns,duration_ns,httpStatus,status,reason"];
  const counts = {};
  for (let i = 1; i <= 10000; i++) {
    const payload = sign({ ...base(), request_id: duplicateId });
    const result = await post(payload);
    const k = key(result); counts[k] = (counts[k] || 0) + 1;
    rows.push([i, result.started_ns, result.ended_ns, result.duration_ns, result.httpStatus, result.status || "", result.reason || ""].join(","));
  }
  fs.writeFileSync(path.join(outDir, "unique-nonce-10000-responses.csv"), rows.join("\n") + "\n");
  const result = { parallel50: { total: parallel.length, counts: parallelCounts, perRequestTiming: parallel.map(({ started_ns, ended_ns, duration_ns }) => ({ started_ns, ended_ns, duration_ns })) }, changedRequestIdWithOldSignature: changedId, clockSkew: skew, controlRequests: { reset: resetTiming }, nonceGrowth: { resetPerformed: true, seedResult, nonceStoreClearedBeforeLoop: nonceCrash, requests: 10000, uniqueNonces: 10000, reusedRequestId: duplicateId, responseCounts: counts } };
  fs.writeFileSync(path.join(outDir, "measured-cases.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
```

### `experiments/results/baseline/server.restart.stderr.log`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/baseline/server.restart.stdout.log`

Bytes: 82. SHA-256: `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 0.0.0.0:3000
```

### `experiments/results/baseline/server.stderr.log`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/baseline/server.stdout.log`

Bytes: 82. SHA-256: `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 0.0.0.0:3000
```

### `experiments/results/baseline/stale-payload.json`

Bytes: 374. SHA-256: `618b3128fe17db9c0717c072c5e0dbacbaeebec2e52b32fcf8cc45528eed8afb`.

```json
{
  "method": "POST",
  "path": "/api/withdraw",
  "user_id": "anis_101",
  "account_id": "acc_777",
  "amount": 1000,
  "currency": "BDT",
  "timestamp": "2026-10-17T18:42:21.561Z",
  "nonce": "5190c432-421c-4ca6-ad75-bbd2c9d05e79",
  "request_id": "126f6ec0-c622-4a00-bd0a-e9491b4b9dc5",
  "signature": "[REDACTED SIGNATURE]"
}
```

### `experiments/results/baseline/stale-replay.log`

Bytes: 263. SHA-256: `7717d0b34282a1d17aae3f51c240b40d09883f0cb7b5874e4151245d886d6947`.

```text
[EVE] Using attacker-side captured request: /tmp/eve-captured.json
[EVE] Starting Replay Attack on localhost:3000...
[EVE] Payload: /tmp/eve-captured.json
[EVE] Payload age: 800s
[EVE] Replay attempt #1...
{
  "status": "REJECTED",
  "reason": "TIMESTAMP_FAIL"
}
```

### `experiments/results/baseline/tamper-fresh.log`

Bytes: 347. SHA-256: `849b3cc3684f16b96652f25da34024ae98fa99b55bf3a5b070c0abdc495ed432`.

```text
[EVE] TAMPERING WITH CAPTURED PACKET
[EVE] Source payload: /tmp/eve-captured.json
[EVE] Original amount: 1000
[EVE] Modified amount: 2000
[EVE] Signature: UNCHANGED
[EVE] Preserved signature: [REDACTED SIGNATURE]
[EVE] Sending modified packet...
{
  "status": "REJECTED",
  "reason": "SIGNATURE_FAIL"
}
```

### `experiments/results/baseline/tamper-source.json`

Bytes: 374. SHA-256: `620e8526692f55afaae7c616c5793b3241ef56ff9960b3645e452ae6a58a1298`.

```json
{
  "method": "POST",
  "path": "/api/withdraw",
  "user_id": "anis_101",
  "account_id": "acc_777",
  "amount": 1000,
  "currency": "BDT",
  "timestamp": "2026-10-17T19:01:23.612Z",
  "nonce": "d21d8bb7-3240-4da0-ad74-1cbc5145504c",
  "request_id": "f2d9e105-9010-4bd9-8ddb-8d8f6af70943",
  "signature": "[REDACTED SIGNATURE]"
}
```

### `experiments/results/baseline/tamper.log`

Bytes: 347. SHA-256: `04126d7d5a2badabab2c0340a7a71f05611e4c7e9975ea8e47026a0e5617f5d3`.

```text
[EVE] TAMPERING WITH CAPTURED PACKET
[EVE] Source payload: /tmp/eve-captured.json
[EVE] Original amount: 1000
[EVE] Modified amount: 2000
[EVE] Signature: UNCHANGED
[EVE] Preserved signature: [REDACTED SIGNATURE]
[EVE] Sending modified packet...
{
  "status": "REJECTED",
  "reason": "SIGNATURE_FAIL"
}
```

### `experiments/results/baseline/trigger-capture.js`

Bytes: 1298. SHA-256: `3bb6fcb9affd28868af089e8abb1ccce091e85fb660dc427bf9381d7481ea5c0`.

```js
const fs = require("fs");
const path = require("path");
require(path.join(process.cwd(), "node_modules/dotenv")).config({ path: path.join(process.cwd(), ".env") });
const crypto = require("crypto");
const { generateSignature } = require(path.join(process.cwd(), "utils/hmac"));
const payload = { method: "POST", path: "/api/withdraw", user_id: "anis_101", account_id: "acc_777", amount: 1000, currency: "BDT", timestamp: new Date().toISOString(), nonce: crypto.randomUUID(), request_id: crypto.randomUUID() };
payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
const started = process.hrtime.bigint();
fetch("http://127.0.0.1:3000/api/withdraw", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }).then(async response => {
  const body = await response.json();
  const ended = process.hrtime.bigint();
  const result = { started_ns: started.toString(), ended_ns: ended.toString(), duration_ns: (ended-started).toString(), httpStatus: response.status, body };
  fs.writeFileSync(path.resolve(process.cwd(), "../experiments/results/baseline/immediate-replay-trigger.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result));
}).catch(error => { console.error(error.message); process.exitCode = 1; });
```

### `experiments/results/baseline/unique-nonce-10000-responses.csv`

Bytes: 358925. SHA-256: `89065441f9cf65a08d8ac0bc8784c3814958ef5c2fda8c2d4863705d4dab1ff3`.

Large-result rule applied. The complete result remains on disk.

Total rows: 10001.

Aggregate statistics (counts, min, max, mean, p50, p95, and p99 for numeric columns):

```json
{
  "index": {
    "count": 10000,
    "min": 1,
    "max": 10000,
    "mean": 5000.5,
    "p50": 5000.5,
    "p95": 9500.05,
    "p99": 9900.01
  },
  "httpStatus": {
    "count": 10000,
    "min": 409,
    "max": 409,
    "mean": 409,
    "p50": 409,
    "p95": 409,
    "p99": 409
  }
}
```

```csv
index,httpStatus,status,reason
1,409,REJECTED,ALREADY_PROCESSED
2,409,REJECTED,ALREADY_PROCESSED
3,409,REJECTED,ALREADY_PROCESSED
4,409,REJECTED,ALREADY_PROCESSED
5,409,REJECTED,ALREADY_PROCESSED
6,409,REJECTED,ALREADY_PROCESSED
7,409,REJECTED,ALREADY_PROCESSED
8,409,REJECTED,ALREADY_PROCESSED
9,409,REJECTED,ALREADY_PROCESSED
10,409,REJECTED,ALREADY_PROCESSED
11,409,REJECTED,ALREADY_PROCESSED
12,409,REJECTED,ALREADY_PROCESSED
13,409,REJECTED,ALREADY_PROCESSED
14,409,REJECTED,ALREADY_PROCESSED
15,409,REJECTED,ALREADY_PROCESSED
16,409,REJECTED,ALREADY_PROCESSED
17,409,REJECTED,ALREADY_PROCESSED
18,409,REJECTED,ALREADY_PROCESSED
19,409,REJECTED,ALREADY_PROCESSED
... omitted rows ...
9981,409,REJECTED,ALREADY_PROCESSED
9982,409,REJECTED,ALREADY_PROCESSED
9983,409,REJECTED,ALREADY_PROCESSED
9984,409,REJECTED,ALREADY_PROCESSED
9985,409,REJECTED,ALREADY_PROCESSED
9986,409,REJECTED,ALREADY_PROCESSED
9987,409,REJECTED,ALREADY_PROCESSED
9988,409,REJECTED,ALREADY_PROCESSED
9989,409,REJECTED,ALREADY_PROCESSED
9990,409,REJECTED,ALREADY_PROCESSED
9991,409,REJECTED,ALREADY_PROCESSED
9992,409,REJECTED,ALREADY_PROCESSED
9993,409,REJECTED,ALREADY_PROCESSED
9994,409,REJECTED,ALREADY_PROCESSED
9995,409,REJECTED,ALREADY_PROCESSED
9996,409,REJECTED,ALREADY_PROCESSED
9997,409,REJECTED,ALREADY_PROCESSED
9998,409,REJECTED,ALREADY_PROCESSED
9999,409,REJECTED,ALREADY_PROCESSED
10000,409,REJECTED,ALREADY_PROCESSED
```

### `experiments/results/baseline/wsl-health-postrotation.log`

Bytes: 261. SHA-256: `363001e83d622cd35db26fc30e5d0b54ddffb74fdf5e40a51de28e29b86c5959`.

```text
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: text/plain; charset=utf-8
Content-Length: 2
ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
Date: Sat, 17 Oct 2026 19:04:38 GMT
Connection: keep-alive
Keep-Alive: timeout=5

OK
```

### `experiments/results/baseline/wsl-health.log`

Bytes: 261. SHA-256: `cbc38d7f69199d37b3cec901116c5acbb5252c89141520bc111280c880cf45cb`.

```text
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: text/plain; charset=utf-8
Content-Length: 2
ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
Date: Sat, 17 Oct 2026 19:01:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

OK
```

### `experiments/results/corrections/c2-accepted-server.stderr.log`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/c2-accepted-server.stderr.log.copy`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/c2-accepted-server.stdout.log`

Bytes: 82. SHA-256: `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 0.0.0.0:3000
```

### `experiments/results/corrections/c2-accepted-server.stdout.log.copy`

Bytes: 82. SHA-256: `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 0.0.0.0:3000
```

### `experiments/results/corrections/c2-rejectclean-server.stderr.log`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/c2-rejectclean-server.stderr.log.copy`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/c2-rejectclean-server.stdout.log`

Bytes: 82. SHA-256: `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 0.0.0.0:3000
```

### `experiments/results/corrections/c2-rejectclean-server.stdout.log.copy`

Bytes: 82. SHA-256: `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 0.0.0.0:3000
```

### `experiments/results/corrections/c2-requestid-server.stderr.log`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/c2-requestid-server.stderr.log.partial-copy`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/c2-requestid-server.stdout.log`

Bytes: 82. SHA-256: `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 0.0.0.0:3000
```

### `experiments/results/corrections/c2-requestid-server.stdout.log.partial-copy`

Bytes: 82. SHA-256: `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 0.0.0.0:3000
```

### `experiments/results/corrections/c3-races-server.stderr.log`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/c3-races-server.stdout.log`

Bytes: 82. SHA-256: `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 0.0.0.0:3000
```

### `experiments/results/corrections/c4-proxy.stderr.log`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/c4-proxy.stdout.log`

Bytes: 151. SHA-256: `68fcb13a62468640e2e492c921ec996a0dc6162ac324e1c5076748b5f4ee8450`.

```text
Recording proxy listening on http://127.0.0.1:3002; capture file: C:\Users\Home\AppData\Local\Temp\cs-project-c4-5c1b286e016c47e281c0e67945b9b3ac.json
```

### `experiments/results/corrections/clock-offsets-30-each.csv`

Bytes: 11826. SHA-256: `92a4c0ccf67f84bd26013a81a07914c6807575fabd1e9a87a0de97395f5653d4`.

```csv
label,repetition,offset_ms,started_ns,ended_ns,duration_ns,http_status,outcome
minus_10m,1,-600000,1269746438995500,1269746442686800,3691300,400,TIMESTAMP_FAIL
minus_10m,2,-600000,1269746442860700,1269746445924400,3063700,400,TIMESTAMP_FAIL
minus_10m,3,-600000,1269746446174200,1269746449809400,3635200,400,TIMESTAMP_FAIL
minus_10m,4,-600000,1269746450000600,1269746454039800,4039200,400,TIMESTAMP_FAIL
minus_10m,5,-600000,1269746454224900,1269746458383100,4158200,400,TIMESTAMP_FAIL
minus_10m,6,-600000,1269746458491800,1269746462366800,3875000,400,TIMESTAMP_FAIL
minus_10m,7,-600000,1269746462573400,1269746467390800,4817400,400,TIMESTAMP_FAIL
minus_10m,8,-600000,1269746467509400,1269746470192400,2683000,400,TIMESTAMP_FAIL
minus_10m,9,-600000,1269746470305000,1269746472842700,2537700,400,TIMESTAMP_FAIL
minus_10m,10,-600000,1269746472926000,1269746475819000,2893000,400,TIMESTAMP_FAIL
minus_10m,11,-600000,1269746475932100,1269746478556500,2624400,400,TIMESTAMP_FAIL
minus_10m,12,-600000,1269746478646200,1269746481173000,2526800,400,TIMESTAMP_FAIL
minus_10m,13,-600000,1269746481267000,1269746483883400,2616400,400,TIMESTAMP_FAIL
minus_10m,14,-600000,1269746483978400,1269746486797600,2819200,400,TIMESTAMP_FAIL
minus_10m,15,-600000,1269746486906000,1269746489386200,2480200,400,TIMESTAMP_FAIL
minus_10m,16,-600000,1269746489518500,1269746492321500,2803000,400,TIMESTAMP_FAIL
minus_10m,17,-600000,1269746492418700,1269746494972800,2554100,400,TIMESTAMP_FAIL
minus_10m,18,-600000,1269746495090600,1269746497394800,2304200,400,TIMESTAMP_FAIL
minus_10m,19,-600000,1269746497488400,1269746499859000,2370600,400,TIMESTAMP_FAIL
minus_10m,20,-600000,1269746499955500,1269746502484800,2529300,400,TIMESTAMP_FAIL
minus_10m,21,-600000,1269746502581500,1269746505348100,2766600,400,TIMESTAMP_FAIL
minus_10m,22,-600000,1269746505477800,1269746508482700,3004900,400,TIMESTAMP_FAIL
minus_10m,23,-600000,1269746508629200,1269746511147900,2518700,400,TIMESTAMP_FAIL
minus_10m,24,-600000,1269746511234100,1269746513640000,2405900,400,TIMESTAMP_FAIL
minus_10m,25,-600000,1269746513710000,1269746516207700,2497700,400,TIMESTAMP_FAIL
minus_10m,26,-600000,1269746516297000,1269746518766200,2469200,400,TIMESTAMP_FAIL
minus_10m,27,-600000,1269746518840200,1269746521424900,2584700,400,TIMESTAMP_FAIL
minus_10m,28,-600000,1269746521565200,1269746524747000,3181800,400,TIMESTAMP_FAIL
minus_10m,29,-600000,1269746524863800,1269746527307400,2443600,400,TIMESTAMP_FAIL
minus_10m,30,-600000,1269746527378100,1269746529958000,2579900,400,TIMESTAMP_FAIL
minus_1m,1,-60000,1269746530037600,1269746539236400,9198800,200,ACCEPTED
minus_1m,2,-60000,1269746539321900,1269746545394200,6072300,200,ACCEPTED
minus_1m,3,-60000,1269746545481400,1269746550849200,5367800,200,ACCEPTED
minus_1m,4,-60000,1269746550970000,1269746556500200,5530200,200,ACCEPTED
minus_1m,5,-60000,1269746556637000,1269746562010800,5373800,200,ACCEPTED
minus_1m,6,-60000,1269746562132600,1269746567432000,5299400,200,ACCEPTED
minus_1m,7,-60000,1269746567524500,1269746573316700,5792200,200,ACCEPTED
minus_1m,8,-60000,1269746573415500,1269746578847300,5431800,200,ACCEPTED
minus_1m,9,-60000,1269746578931300,1269746584206500,5275200,200,ACCEPTED
minus_1m,10,-60000,1269746584323100,1269746590320900,5997800,200,ACCEPTED
minus_1m,11,-60000,1269746590419800,1269746595926800,5507000,200,ACCEPTED
minus_1m,12,-60000,1269746596014100,1269746601440700,5426600,200,ACCEPTED
minus_1m,13,-60000,1269746601561600,1269746607493400,5931800,200,ACCEPTED
minus_1m,14,-60000,1269746607587700,1269746613449000,5861300,200,ACCEPTED
minus_1m,15,-60000,1269746613562100,1269746618864800,5302700,200,ACCEPTED
minus_1m,16,-60000,1269746618952000,1269746624608500,5656500,200,ACCEPTED
minus_1m,17,-60000,1269746624766500,1269746630987400,6220900,200,ACCEPTED
minus_1m,18,-60000,1269746631134600,1269746637156700,6022100,200,ACCEPTED
minus_1m,19,-60000,1269746637317500,1269746643903200,6585700,200,ACCEPTED
minus_1m,20,-60000,1269746643979600,1269746649590500,5610900,200,ACCEPTED
minus_1m,21,-60000,1269746649678300,1269746655920200,6241900,200,ACCEPTED
minus_1m,22,-60000,1269746656066700,1269746662687500,6620800,200,ACCEPTED
minus_1m,23,-60000,1269746662790900,1269746668891800,6100900,200,ACCEPTED
minus_1m,24,-60000,1269746669015000,1269746674963100,5948100,200,ACCEPTED
minus_1m,25,-60000,1269746675076400,1269746681202100,6125700,200,ACCEPTED
minus_1m,26,-60000,1269746681291900,1269746691808700,10516800,200,ACCEPTED
minus_1m,27,-60000,1269746691939500,1269746701430700,9491200,200,ACCEPTED
minus_1m,28,-60000,1269746701631700,1269746710593700,8962000,200,ACCEPTED
minus_1m,29,-60000,1269746710750900,1269746739889700,29138800,200,ACCEPTED
minus_1m,30,-60000,1269746740011400,1269746749023300,9011900,200,ACCEPTED
plus_10s,1,10000,1269746749174600,1269746753543600,4369000,400,TIMESTAMP_FAIL
plus_10s,2,10000,1269746753716000,1269746757888900,4172900,400,TIMESTAMP_FAIL
plus_10s,3,10000,1269746758060700,1269746762663400,4602700,400,TIMESTAMP_FAIL
plus_10s,4,10000,1269746762828200,1269746767671200,4843000,400,TIMESTAMP_FAIL
plus_10s,5,10000,1269746767846700,1269746772128600,4281900,400,TIMESTAMP_FAIL
plus_10s,6,10000,1269746772350700,1269746777081600,4730900,400,TIMESTAMP_FAIL
plus_10s,7,10000,1269746777273900,1269746781184600,3910700,400,TIMESTAMP_FAIL
plus_10s,8,10000,1269746781284400,1269746785630100,4345700,400,TIMESTAMP_FAIL
plus_10s,9,10000,1269746785780900,1269746790132100,4351200,400,TIMESTAMP_FAIL
plus_10s,10,10000,1269746790245400,1269746793871200,3625800,400,TIMESTAMP_FAIL
plus_10s,11,10000,1269746794019200,1269746797984700,3965500,400,TIMESTAMP_FAIL
plus_10s,12,10000,1269746798166000,1269746802642000,4476000,400,TIMESTAMP_FAIL
plus_10s,13,10000,1269746802766500,1269746807341500,4575000,400,TIMESTAMP_FAIL
plus_10s,14,10000,1269746807503700,1269746811686600,4182900,400,TIMESTAMP_FAIL
plus_10s,15,10000,1269746811801600,1269746815724100,3922500,400,TIMESTAMP_FAIL
plus_10s,16,10000,1269746815841200,1269746819628500,3787300,400,TIMESTAMP_FAIL
plus_10s,17,10000,1269746819729400,1269746823487400,3758000,400,TIMESTAMP_FAIL
plus_10s,18,10000,1269746823591600,1269746827238300,3646700,400,TIMESTAMP_FAIL
plus_10s,19,10000,1269746827365200,1269746831046400,3681200,400,TIMESTAMP_FAIL
plus_10s,20,10000,1269746831159200,1269746834952800,3793600,400,TIMESTAMP_FAIL
plus_10s,21,10000,1269746835068600,1269746839406200,4337600,400,TIMESTAMP_FAIL
plus_10s,22,10000,1269746839580800,1269746843286100,3705300,400,TIMESTAMP_FAIL
plus_10s,23,10000,1269746843418100,1269746846782200,3364100,400,TIMESTAMP_FAIL
plus_10s,24,10000,1269746846909500,1269746850882400,3972900,400,TIMESTAMP_FAIL
plus_10s,25,10000,1269746851012100,1269746855432100,4420000,400,TIMESTAMP_FAIL
plus_10s,26,10000,1269746855615800,1269746860186600,4570800,400,TIMESTAMP_FAIL
plus_10s,27,10000,1269746860380100,1269746864935300,4555200,400,TIMESTAMP_FAIL
plus_10s,28,10000,1269746865143400,1269746869684400,4541000,400,TIMESTAMP_FAIL
plus_10s,29,10000,1269746869900300,1269746874927200,5026900,400,TIMESTAMP_FAIL
plus_10s,30,10000,1269746875107700,1269746879957200,4849500,400,TIMESTAMP_FAIL
plus_1m,1,60000,1269746880114900,1269746883293800,3178900,400,TIMESTAMP_FAIL
plus_1m,2,60000,1269746883446400,1269746888093500,4647100,400,TIMESTAMP_FAIL
plus_1m,3,60000,1269746888227500,1269746891755800,3528300,400,TIMESTAMP_FAIL
plus_1m,4,60000,1269746891836300,1269746895504000,3667700,400,TIMESTAMP_FAIL
plus_1m,5,60000,1269746895621100,1269746899298400,3677300,400,TIMESTAMP_FAIL
plus_1m,6,60000,1269746899397900,1269746902791400,3393500,400,TIMESTAMP_FAIL
plus_1m,7,60000,1269746902889700,1269746906061400,3171700,400,TIMESTAMP_FAIL
plus_1m,8,60000,1269746906261900,1269746910250000,3988100,400,TIMESTAMP_FAIL
plus_1m,9,60000,1269746910368600,1269746913653300,3284700,400,TIMESTAMP_FAIL
plus_1m,10,60000,1269746913790400,1269746917128700,3338300,400,TIMESTAMP_FAIL
plus_1m,11,60000,1269746917239100,1269746920398000,3158900,400,TIMESTAMP_FAIL
plus_1m,12,60000,1269746920491300,1269746923544800,3053500,400,TIMESTAMP_FAIL
plus_1m,13,60000,1269746923625500,1269746926426600,2801100,400,TIMESTAMP_FAIL
plus_1m,14,60000,1269746926545100,1269746929718200,3173100,400,TIMESTAMP_FAIL
plus_1m,15,60000,1269746929845000,1269746933070400,3225400,400,TIMESTAMP_FAIL
plus_1m,16,60000,1269746933183900,1269746936537300,3353400,400,TIMESTAMP_FAIL
plus_1m,17,60000,1269746936659400,1269746940456000,3796600,400,TIMESTAMP_FAIL
plus_1m,18,60000,1269746940606400,1269746943919000,3312600,400,TIMESTAMP_FAIL
plus_1m,19,60000,1269746943994300,1269746946390600,2396300,400,TIMESTAMP_FAIL
plus_1m,20,60000,1269746946479000,1269746949484000,3005000,400,TIMESTAMP_FAIL
plus_1m,21,60000,1269746949597200,1269746951941500,2344300,400,TIMESTAMP_FAIL
plus_1m,22,60000,1269746952008800,1269746954404300,2395500,400,TIMESTAMP_FAIL
plus_1m,23,60000,1269746954507700,1269746957944300,3436600,400,TIMESTAMP_FAIL
plus_1m,24,60000,1269746958078800,1269746961133400,3054600,400,TIMESTAMP_FAIL
plus_1m,25,60000,1269746961241800,1269746964815900,3574100,400,TIMESTAMP_FAIL
plus_1m,26,60000,1269746964941200,1269746968502900,3561700,400,TIMESTAMP_FAIL
plus_1m,27,60000,1269746968616900,1269746972470000,3853100,400,TIMESTAMP_FAIL
plus_1m,28,60000,1269746972584600,1269746976258200,3673600,400,TIMESTAMP_FAIL
plus_1m,29,60000,1269746976396400,1269746980068900,3672500,400,TIMESTAMP_FAIL
plus_1m,30,60000,1269746980211900,1269746983792700,3580800,400,TIMESTAMP_FAIL
plus_10m,1,600000,1269746983899800,1269746988245900,4346100,400,TIMESTAMP_FAIL
plus_10m,2,600000,1269746988387100,1269746991632900,3245800,400,TIMESTAMP_FAIL
plus_10m,3,600000,1269746991750700,1269746994665500,2914800,400,TIMESTAMP_FAIL
plus_10m,4,600000,1269746994758100,1269746998708900,3950800,400,TIMESTAMP_FAIL
plus_10m,5,600000,1269746998840100,1269747002433900,3593800,400,TIMESTAMP_FAIL
plus_10m,6,600000,1269747002556400,1269747005571000,3014600,400,TIMESTAMP_FAIL
plus_10m,7,600000,1269747005643600,1269747009227200,3583600,400,TIMESTAMP_FAIL
plus_10m,8,600000,1269747009362300,1269747013071300,3709000,400,TIMESTAMP_FAIL
plus_10m,9,600000,1269747013196500,1269747017389400,4192900,400,TIMESTAMP_FAIL
plus_10m,10,600000,1269747017528900,1269747020615000,3086100,400,TIMESTAMP_FAIL
plus_10m,11,600000,1269747020750300,1269747023934400,3184100,400,TIMESTAMP_FAIL
plus_10m,12,600000,1269747024039400,1269747026695400,2656000,400,TIMESTAMP_FAIL
plus_10m,13,600000,1269747026776100,1269747029881700,3105600,400,TIMESTAMP_FAIL
plus_10m,14,600000,1269747030041200,1269747032874600,2833400,400,TIMESTAMP_FAIL
plus_10m,15,600000,1269747032963600,1269747035943200,2979600,400,TIMESTAMP_FAIL
plus_10m,16,600000,1269747036028700,1269747039083800,3055100,400,TIMESTAMP_FAIL
plus_10m,17,600000,1269747039212900,1269747043226900,4014000,400,TIMESTAMP_FAIL
plus_10m,18,600000,1269747043348900,1269747046876800,3527900,400,TIMESTAMP_FAIL
plus_10m,19,600000,1269747046953100,1269747049990000,3036900,400,TIMESTAMP_FAIL
plus_10m,20,600000,1269747050116700,1269747053727500,3610800,400,TIMESTAMP_FAIL
plus_10m,21,600000,1269747053835600,1269747056702900,2867300,400,TIMESTAMP_FAIL
plus_10m,22,600000,1269747056835900,1269747060621500,3785600,400,TIMESTAMP_FAIL
plus_10m,23,600000,1269747060791900,1269747063856800,3064900,400,TIMESTAMP_FAIL
plus_10m,24,600000,1269747063951600,1269747066700100,2748500,400,TIMESTAMP_FAIL
plus_10m,25,600000,1269747066854900,1269747070979000,4124100,400,TIMESTAMP_FAIL
plus_10m,26,600000,1269747071100800,1269747075403700,4302900,400,TIMESTAMP_FAIL
plus_10m,27,600000,1269747075574300,1269747080156600,4582300,400,TIMESTAMP_FAIL
plus_10m,28,600000,1269747080358000,1269747084956000,4598000,400,TIMESTAMP_FAIL
plus_10m,29,600000,1269747085147900,1269747089481800,4333900,400,TIMESTAMP_FAIL
plus_10m,30,600000,1269747089862600,1269747093905800,4043200,400,TIMESTAMP_FAIL
```

### `experiments/results/corrections/clock-offsets-30-each.json`

Bytes: 52764. SHA-256: `e29e7e0a401439a12905e625ed21cffed170b8b85bba77450e42d026a118279d`.

Large-result rule applied. The complete result remains on disk.

Total rows: 2168.

Aggregate statistics (counts, min, max, mean, p50, p95, and p99 for numeric columns):

```json
{
  "numericValues": {
    "count": 971,
    "min": -600000,
    "max": 1269747093905800,
    "mean": 392300756305392.06,
    "p50": 60000,
    "p95": 1269747004063700,
    "p99": 1269747071015540
  }
}
```

```json
{
  "repetitionsPerOffset": 30,
  "vizEnabled": false,
  "cases": [
    {
      "label": "minus_10m",
      "offsetMs": -600000,
      "expected": "TIMESTAMP_FAIL",
      "measuredCount": 30
    },
    {
      "label": "minus_1m",
      "offsetMs": -60000,
      "expected": "ACCEPTED",
      "measuredCount": 30
    },
    {
      "label": "plus_10s",
      "offsetMs": 10000,
      "expected": "TIMESTAMP_FAIL",
... omitted rows ...
      "ended_ns": "1269747089481800",
      "duration_ns": "4333900",
      "outcome": "TIMESTAMP_FAIL"
    },
    {
      "label": "plus_10m",
      "repetition": 30,
      "offset_ms": 600000,
      "status": 400,
      "data": {
        "status": "REJECTED",
        "reason": "TIMESTAMP_FAIL"
      },
      "started_ns": "1269747089862600",
      "ended_ns": "1269747093905800",
      "duration_ns": "4043200",
      "outcome": "TIMESTAMP_FAIL"
    }
  ]
}
```

### `experiments/results/corrections/final-server.stderr.log`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/final-server.stderr.log.copy`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/final-server.stdout.log`

Bytes: 84. SHA-256: `908141bc87754c6ee425f0d27e42d8d8ff6360d72c54defc8b09537b3c340052`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 127.0.0.1:3000
```

### `experiments/results/corrections/final-server.stdout.log.copy`

Bytes: 84. SHA-256: `908141bc87754c6ee425f0d27e42d8d8ff6360d72c54defc8b09537b3c340052`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 127.0.0.1:3000
```

### `experiments/results/corrections/nonce-memory-accepted-c2-accepted-100k-requests.csv`

Bytes: 6111075. SHA-256: `fcc2c23ff3e0f3b20f6aa8b0442ea4c9668cb3f569ad3620d1b5107032c0ce4e`.

Large-result rule applied. The complete result remains on disk.

Total rows: 100001.

Aggregate statistics (counts, min, max, mean, p50, p95, and p99 for numeric columns):

```json
{
  "index": {
    "count": 100000,
    "min": 1,
    "max": 100000,
    "mean": 50000.5,
    "p50": 50000.5,
    "p95": 95000.04999999999,
    "p99": 99000.01
  },
  "started_ns": {
    "count": 100000,
    "min": 1267759465864900,
    "max": 1268673308507000,
    "mean": 1268199132794112.5,
    "p50": 1268196719966200,
    "p95": 1268626631962195,
    "p99": 1268664247281117
  },
  "ended_ns": {
    "count": 100000,
    "min": 1267759483903000,
    "max": 1268673318378800,
    "mean": 1268199141783559.8,
    "p50": 1268196729869550,
    "p95": 1268626643976715,
    "p99": 1268664254878447
  },
  "duration_ns": {
    "count": 100000,
    "min": 4163200,
    "max": 255941800,
    "mean": 8989465.582,
    "p50": 8503700,
    "p95": 13185559.999999985,
    "p99": 19170939.999999925
  },
  "http_status": {
    "count": 100000,
    "min": 200,
    "max": 200,
    "mean": 200,
    "p50": 200,
    "p95": 200,
    "p99": 200
  }
}
```

```csv
index,started_ns,ended_ns,duration_ns,http_status,outcome
1,1267759465864900,1267759483903000,18038100,200,ACCEPTED
2,1267759484206100,1267759495780600,11574500,200,ACCEPTED
3,1267759496011800,1267759506733900,10722100,200,ACCEPTED
4,1267759507058300,1267759517135800,10077500,200,ACCEPTED
5,1267759517343900,1267759530548600,13204700,200,ACCEPTED
6,1267759530705300,1267759539190800,8485500,200,ACCEPTED
7,1267759539416700,1267759549537600,10120900,200,ACCEPTED
8,1267759549773700,1267759559015400,9241700,200,ACCEPTED
9,1267759559281000,1267759567367500,8086500,200,ACCEPTED
10,1267759567547500,1267759576484600,8937100,200,ACCEPTED
11,1267759576619900,1267759582658900,6039000,200,ACCEPTED
12,1267759582859900,1267759589037800,6177900,200,ACCEPTED
13,1267759589184900,1267759595198500,6013600,200,ACCEPTED
14,1267759595310500,1267759601635800,6325300,200,ACCEPTED
15,1267759601754500,1267759607812000,6057500,200,ACCEPTED
16,1267759607943700,1267759613885500,5941800,200,ACCEPTED
17,1267759613994500,1267759620928600,6934100,200,ACCEPTED
18,1267759621073300,1267759627257400,6184100,200,ACCEPTED
19,1267759627395900,1267759633692600,6296700,200,ACCEPTED
... omitted rows ...
99981,1268673139450300,1268673147135600,7685300,200,ACCEPTED
99982,1268673147267700,1268673155041600,7773900,200,ACCEPTED
99983,1268673155143200,1268673164493000,9349800,200,ACCEPTED
99984,1268673164608500,1268673174512200,9903700,200,ACCEPTED
99985,1268673174654300,1268673182729900,8075600,200,ACCEPTED
99986,1268673182846700,1268673192161300,9314600,200,ACCEPTED
99987,1268673192258200,1268673200845300,8587100,200,ACCEPTED
99988,1268673200967300,1268673210673900,9706600,200,ACCEPTED
99989,1268673210810100,1268673219101300,8291200,200,ACCEPTED
99990,1268673219196800,1268673227368800,8172000,200,ACCEPTED
99991,1268673227540400,1268673236328400,8788000,200,ACCEPTED
99992,1268673236472900,1268673244800000,8327100,200,ACCEPTED
99993,1268673244945500,1268673254407900,9462400,200,ACCEPTED
99994,1268673254513800,1268673263578100,9064300,200,ACCEPTED
99995,1268673263657000,1268673271413300,7756300,200,ACCEPTED
99996,1268673271499700,1268673279366400,7866700,200,ACCEPTED
99997,1268673279464000,1268673289770300,10306300,200,ACCEPTED
99998,1268673289877700,1268673300457400,10579700,200,ACCEPTED
99999,1268673300561300,1268673308432400,7871100,200,ACCEPTED
100000,1268673308507000,1268673318378800,9871800,200,ACCEPTED
```

### `experiments/results/corrections/nonce-memory-accepted-c2-accepted-100k-summary.json`

Bytes: 1859. SHA-256: `b9fa30951ff8dbba4a978ff18a2ceabcc7a22676bc44e555c4c301c58306f1a2`.

```json
{
  "runId": "c2-accepted-100k",
  "mode": "accepted",
  "label": "nonce-store growth from accepted requests",
  "createdAt": "2026-10-17T21:51:54.255Z",
  "nonceTtlSeconds": 86400,
  "duration_ns": "915017261000",
  "durationSeconds": 915.017261,
  "durationVsTtl": 0.01059047755787037,
  "baselineUsedMemoryBytes": 1047648,
  "baselineNonceKeys": 0,
  "snapshots": [
    {
      "targetKeys": 0,
      "measuredKeys": 0,
      "usedMemoryBytes": 1047648,
      "baselineUsedMemoryBytes": 1047648,
      "deltaBytes": 0,
      "bytesPerKeyAboveBaseline": null,
      "elapsed_ns": "0",
      "ttlSeconds": 86400
    },
    {
      "targetKeys": 1000,
      "measuredKeys": 1000,
      "usedMemoryBytes": 1207648,
      "baselineUsedMemoryBytes": 1047648,
      "deltaBytes": 160000,
      "bytesPerKeyAboveBaseline": 160,
      "elapsed_ns": "6717485300",
      "elapsedSeconds": 6.7174853,
      "ttlSeconds": 86400,
      "ttlFractionUsed": 0.0000777486724537037
    },
    {
      "targetKeys": 10000,
      "measuredKeys": 10000,
      "usedMemoryBytes": 2749408,
      "baselineUsedMemoryBytes": 1047648,
      "deltaBytes": 1701760,
      "bytesPerKeyAboveBaseline": 170.176,
      "elapsed_ns": "65708870400",
      "elapsedSeconds": 65.7088704,
      "ttlSeconds": 86400,
      "ttlFractionUsed": 0.0007605193333333332
    },
    {
      "targetKeys": 100000,
      "measuredKeys": 100000,
      "usedMemoryBytes": 17543968,
      "baselineUsedMemoryBytes": 1047648,
      "deltaBytes": 16496320,
      "bytesPerKeyAboveBaseline": 164.9632,
      "elapsed_ns": "913855557400",
      "elapsedSeconds": 913.8555574,
      "ttlSeconds": 86400,
      "ttlFractionUsed": 0.010577031914351852
    }
  ],
  "baselineSubtractedSlopeBytesPerKey": 164.9632,
  "requestRowsCsv": "nonce-memory-accepted-c2-accepted-100k-requests.csv",
  "requestCount": 100000
}
```

### `experiments/results/corrections/nonce-memory-accepted-c2-smoke-accepted-requests.csv`

Bytes: 634. SHA-256: `6f9475847d255d7be09fd853b005c39e488d7a0809873da9e073684179ed03f0`.

```csv
index,started_ns,ended_ns,duration_ns,http_status,outcome
1,1267753469523900,1267753487903700,18379800,200,ACCEPTED
2,1267753488206700,1267753501544600,13337900,200,ACCEPTED
3,1267753501689900,1267753512405300,10715400,200,ACCEPTED
4,1267753512654200,1267753523549600,10895400,200,ACCEPTED
5,1267753523802200,1267753534606700,10804500,200,ACCEPTED
6,1267753534773900,1267753544701700,9927800,200,ACCEPTED
7,1267753544889500,1267753554395200,9505700,200,ACCEPTED
8,1267753554542900,1267753563358800,8815900,200,ACCEPTED
9,1267753563596000,1267753573504800,9908800,200,ACCEPTED
10,1267753573864800,1267753582567200,8702400,200,ACCEPTED
```

### `experiments/results/corrections/nonce-memory-accepted-c2-smoke-accepted-summary.json`

Bytes: 1125. SHA-256: `e89106676d1949f0bbbe78a3548632a5b256a2faaa84443ad63f016f147abf8d`.

```json
{
  "runId": "c2-smoke-accepted",
  "mode": "accepted",
  "label": "nonce-store growth from accepted requests",
  "createdAt": "2026-10-17T21:36:33.274Z",
  "nonceTtlSeconds": 86400,
  "duration_ns": "177076700",
  "durationSeconds": 0.1770767,
  "durationVsTtl": 0.0000020494988425925926,
  "baselineUsedMemoryBytes": 1047328,
  "baselineNonceKeys": 0,
  "snapshots": [
    {
      "targetKeys": 0,
      "measuredKeys": 0,
      "usedMemoryBytes": 1047328,
      "baselineUsedMemoryBytes": 1047328,
      "deltaBytes": 0,
      "bytesPerKeyAboveBaseline": null,
      "elapsed_ns": "0",
      "ttlSeconds": 86400
    },
    {
      "targetKeys": 10,
      "measuredKeys": 10,
      "usedMemoryBytes": 1048960,
      "baselineUsedMemoryBytes": 1047328,
      "deltaBytes": 1632,
      "bytesPerKeyAboveBaseline": 163.2,
      "elapsed_ns": "116431800",
      "elapsedSeconds": 0.1164318,
      "ttlSeconds": 86400,
      "ttlFractionUsed": 0.0000013475902777777779
    }
  ],
  "baselineSubtractedSlopeBytesPerKey": 0.01632,
  "requestRowsCsv": "nonce-memory-accepted-c2-smoke-accepted-requests.csv",
  "requestCount": 10
}
```

### `experiments/results/corrections/nonce-memory-requestid-c2-requestid-100k-clean-control.csv`

Bytes: 246. SHA-256: `0c0befa14d3ddf2f26f4d9f3fdc1abc4ae4a6a4efe05e51ec8fc7e89d3f5c571`.

```csv
name,started_ns,ended_ns,duration_ns,http_status,outcome
reset,1268772597472300,1268772674974800,77502500,200,RESET
seed,1268772676897900,1268772688118700,11220800,200,ACCEPTED
nonce-store-clear,1268772688160100,1268772693212400,5052300,200,true
```

### `experiments/results/corrections/nonce-memory-requestid-c2-requestid-100k-clean-requests.csv`

Bytes: 6989116. SHA-256: `f1415c207f8ed7d22acb5c5a6daf0d6bd57b9f9528dae84b964e770b7bb56c82`.

Large-result rule applied. The complete result remains on disk.

Total rows: 100001.

Aggregate statistics (counts, min, max, mean, p50, p95, and p99 for numeric columns):

```json
{
  "index": {
    "count": 100000,
    "min": 1,
    "max": 100000,
    "mean": 50000.5,
    "p50": 50000.5,
    "p95": 95000.04999999999,
    "p99": 99000.01
  },
  "started_ns": {
    "count": 100000,
    "min": 1268772763143800,
    "max": 1268980372271000,
    "mean": 1268878178304716.2,
    "p50": 1268878575379400,
    "p95": 1268969926995425,
    "p99": 1268978347003135
  },
  "ended_ns": {
    "count": 100000,
    "min": 1268772767507300,
    "max": 1268980373594500,
    "mean": 1268878180306106.5,
    "p50": 1268878576764200,
    "p95": 1268969928334425,
    "p99": 1268978349071378
  },
  "duration_ns": {
    "count": 100000,
    "min": 1176600,
    "max": 28719800,
    "mean": 2001395.034,
    "p50": 1839500,
    "p95": 3097609.9999999977,
    "p99": 4104004.999999997
  },
  "http_status": {
    "count": 100000,
    "min": 409,
    "max": 409,
    "mean": 409,
    "p50": 409,
    "p95": 409,
    "p99": 409
  }
}
```

```csv
index,started_ns,ended_ns,duration_ns,http_status,outcome
1,1268772763143800,1268772767507300,4363500,409,ALREADY_PROCESSED
2,1268772767637800,1268772772024000,4386200,409,ALREADY_PROCESSED
3,1268772772132300,1268772775864300,3732000,409,ALREADY_PROCESSED
4,1268772776003700,1268772779675300,3671600,409,ALREADY_PROCESSED
5,1268772779786600,1268772783260500,3473900,409,ALREADY_PROCESSED
6,1268772783370800,1268772787705400,4334600,409,ALREADY_PROCESSED
7,1268772787808000,1268772791616500,3808500,409,ALREADY_PROCESSED
8,1268772791764700,1268772795065900,3301200,409,ALREADY_PROCESSED
9,1268772795270400,1268772798858000,3587600,409,ALREADY_PROCESSED
10,1268772798956200,1268772802082500,3126300,409,ALREADY_PROCESSED
11,1268772802170300,1268772804760000,2589700,409,ALREADY_PROCESSED
12,1268772804845700,1268772807394900,2549200,409,ALREADY_PROCESSED
13,1268772807501900,1268772810332200,2830300,409,ALREADY_PROCESSED
14,1268772810436500,1268772813393700,2957200,409,ALREADY_PROCESSED
15,1268772813492500,1268772817042000,3549500,409,ALREADY_PROCESSED
16,1268772817167900,1268772820043900,2876000,409,ALREADY_PROCESSED
17,1268772820132900,1268772822695800,2562900,409,ALREADY_PROCESSED
18,1268772822797700,1268772825784400,2986700,409,ALREADY_PROCESSED
19,1268772825875000,1268772829370900,3495900,409,ALREADY_PROCESSED
... omitted rows ...
99981,1268980341603800,1268980343642700,2038900,409,ALREADY_PROCESSED
99982,1268980343699200,1268980345618300,1919100,409,ALREADY_PROCESSED
99983,1268980345673700,1268980347044100,1370400,409,ALREADY_PROCESSED
99984,1268980347086800,1268980348440000,1353200,409,ALREADY_PROCESSED
99985,1268980348483700,1268980349857200,1373500,409,ALREADY_PROCESSED
99986,1268980349902200,1268980351510800,1608600,409,ALREADY_PROCESSED
99987,1268980351587300,1268980353046000,1458700,409,ALREADY_PROCESSED
99988,1268980353088200,1268980354435400,1347200,409,ALREADY_PROCESSED
99989,1268980354482700,1268980355824100,1341400,409,ALREADY_PROCESSED
99990,1268980355865700,1268980357193700,1328000,409,ALREADY_PROCESSED
99991,1268980357235100,1268980358719800,1484700,409,ALREADY_PROCESSED
99992,1268980358805000,1268980360815300,2010300,409,ALREADY_PROCESSED
99993,1268980360894200,1268980363021300,2127100,409,ALREADY_PROCESSED
99994,1268980363071000,1268980364458400,1387400,409,ALREADY_PROCESSED
99995,1268980364529700,1268980365828500,1298800,409,ALREADY_PROCESSED
99996,1268980365884100,1268980367607400,1723300,409,ALREADY_PROCESSED
99997,1268980367684000,1268980369190700,1506700,409,ALREADY_PROCESSED
99998,1268980369278500,1268980370696700,1418200,409,ALREADY_PROCESSED
99999,1268980370742400,1268980372217400,1475000,409,ALREADY_PROCESSED
100000,1268980372271000,1268980373594500,1323500,409,ALREADY_PROCESSED
```

### `experiments/results/corrections/nonce-memory-requestid-c2-requestid-100k-clean-summary.json`

Bytes: 2036. SHA-256: `cfdd5cdc38f61e1dde1fa05e949b2805d767c274b21ef632c3b9a9550059d28d`.

```json
{
  "runId": "c2-requestid-100k-clean",
  "mode": "requestid",
  "nonceBackend": "redis",
  "vizEnabled": false,
  "label": "nonce-store growth from requests rejected at the request-ID check",
  "createdAt": "2026-10-17T21:57:01.193Z",
  "nonceTtlSeconds": 86400,
  "duration_ns": "208648364200",
  "durationSeconds": 208.6483642,
  "durationVsTtl": 0.002414911622685185,
  "baselineUsedMemoryBytes": 1046880,
  "baselineNonceKeys": 0,
  "snapshots": [
    {
      "targetKeys": 0,
      "measuredKeys": 0,
      "usedMemoryBytes": 1046880,
      "baselineUsedMemoryBytes": 1046880,
      "deltaBytes": 0,
      "bytesPerKeyAboveBaseline": null,
      "elapsed_ns": "0",
      "ttlSeconds": 86400
    },
    {
      "targetKeys": 1000,
      "measuredKeys": 1000,
      "usedMemoryBytes": 1207200,
      "baselineUsedMemoryBytes": 1046880,
      "deltaBytes": 160320,
      "bytesPerKeyAboveBaseline": 160.32,
      "elapsed_ns": "2824209600",
      "elapsedSeconds": 2.8242096,
      "ttlSeconds": 86400,
      "ttlFractionUsed": 0.00003268761111111111
    },
    {
      "targetKeys": 10000,
      "measuredKeys": 10000,
      "usedMemoryBytes": 2748960,
      "baselineUsedMemoryBytes": 1046880,
      "deltaBytes": 1702080,
      "bytesPerKeyAboveBaseline": 170.208,
      "elapsed_ns": "22523927300",
      "elapsedSeconds": 22.5239273,
      "ttlSeconds": 86400,
      "ttlFractionUsed": 0.00026069360300925927
    },
    {
      "targetKeys": 100000,
      "measuredKeys": 100000,
      "usedMemoryBytes": 17543968,
      "baselineUsedMemoryBytes": 1046880,
      "deltaBytes": 16497088,
      "bytesPerKeyAboveBaseline": 164.97088,
      "elapsed_ns": "207610616700",
      "elapsedSeconds": 207.6106167,
      "ttlSeconds": 86400,
      "ttlFractionUsed": 0.00240290065625
    }
  ],
  "baselineSubtractedSlopeBytesPerKey": 164.97088,
  "requestRowsCsv": "nonce-memory-requestid-c2-requestid-100k-clean-requests.csv",
  "controlRowsCsv": "nonce-memory-requestid-c2-requestid-100k-clean-control.csv",
  "requestCount": 100000
}
```

### `experiments/results/corrections/proxy-replay-verification-first.json`

Bytes: 735. SHA-256: `f612317b1ad4331821363f418876347943b6d4e5b80ee2d9680518ab714ab074`.

```json
{
  "measuredAt": "2026-10-17T21:59:06.975Z",
  "capturePath": "C:\\Users\\Home\\AppData\\Local\\Temp\\cs-project-c4-5c1b286e016c47e281c0e67945b9b3ac.json",
  "captureSha256": "bc66977926f46d674163bd15dd37fc27369a45c631c1f85dc78bbe4b0dda97b6",
  "capturedRequestMatchedForwardedBody": true,
  "attackerReplaySource": "on-path proxy recording file; no server-written payload file read",
  "original": {
    "httpStatus": 200,
    "outcome": "ACCEPTED",
    "started_ns": "1269107268380200",
    "ended_ns": "1269107339059400",
    "duration_ns": "70679200"
  },
  "replay": {
    "httpStatus": 409,
    "reason": "NONCE_FAIL",
    "started_ns": "1269107339334900",
    "ended_ns": "1269107344709800",
    "duration_ns": "5374900"
  }
}
```

### `experiments/results/corrections/proxy-replay-verification-second.json`

Bytes: 735. SHA-256: `c38b32ffe903c043e26cfec27702ac7b3921c063b854cdfb27f828c5f3f3e5dd`.

```json
{
  "measuredAt": "2026-10-17T21:59:41.429Z",
  "capturePath": "C:\\Users\\Home\\AppData\\Local\\Temp\\cs-project-c4-5c1b286e016c47e281c0e67945b9b3ac.json",
  "captureSha256": "ed1c41bd15d95420cf6c186492945b08dee9c52da6a6a77fe5d27b39071a84ae",
  "capturedRequestMatchedForwardedBody": true,
  "attackerReplaySource": "on-path proxy recording file; no server-written payload file read",
  "original": {
    "httpStatus": 200,
    "outcome": "ACCEPTED",
    "started_ns": "1269141729088300",
    "ended_ns": "1269141792489200",
    "duration_ns": "63400900"
  },
  "replay": {
    "httpStatus": 409,
    "reason": "NONCE_FAIL",
    "started_ns": "1269141792807200",
    "ended_ns": "1269141798140100",
    "duration_ns": "5332900"
  }
}
```

### `experiments/results/corrections/proxy-replay-verification.json`

Bytes: 735. SHA-256: `c38b32ffe903c043e26cfec27702ac7b3921c063b854cdfb27f828c5f3f3e5dd`.

```json
{
  "measuredAt": "2026-10-17T21:59:41.429Z",
  "capturePath": "C:\\Users\\Home\\AppData\\Local\\Temp\\cs-project-c4-5c1b286e016c47e281c0e67945b9b3ac.json",
  "captureSha256": "ed1c41bd15d95420cf6c186492945b08dee9c52da6a6a77fe5d27b39071a84ae",
  "capturedRequestMatchedForwardedBody": true,
  "attackerReplaySource": "on-path proxy recording file; no server-written payload file read",
  "original": {
    "httpStatus": 200,
    "outcome": "ACCEPTED",
    "started_ns": "1269141729088300",
    "ended_ns": "1269141792489200",
    "duration_ns": "63400900"
  },
  "replay": {
    "httpStatus": 409,
    "reason": "NONCE_FAIL",
    "started_ns": "1269141792807200",
    "ended_ns": "1269141798140100",
    "duration_ns": "5332900"
  }
}
```

### `experiments/results/corrections/race-identical-50x1000-batches.csv`

Bytes: 60018. SHA-256: `7aa79c1128a64b8a312c6923f6ef739f24bb8832a6019b3596bf09fb2b27480f`.

Large-result rule applied. The complete result remains on disk.

Total rows: 1001.

Aggregate statistics (counts, min, max, mean, p50, p95, and p99 for numeric columns):

```json
{
  "batch": {
    "count": 1000,
    "min": 1,
    "max": 1000,
    "mean": 500.5,
    "p50": 500.5,
    "p95": 950.05,
    "p99": 990.01
  },
  "accepted_count": {
    "count": 1000,
    "min": 1,
    "max": 1,
    "mean": 1,
    "p50": 1,
    "p95": 1,
    "p99": 1
  },
  "nonce_fail_count": {
    "count": 1000,
    "min": 49,
    "max": 49,
    "mean": 49,
    "p50": 49,
    "p95": 49,
    "p99": 49
  },
  "batch_duration_ns": {
    "count": 1000,
    "min": 22368600,
    "max": 93263800,
    "mean": 33615923,
    "p50": 31822650,
    "p95": 47793370,
    "p99": 57268837
  },
  "reset_started_ns": {
    "count": 1000,
    "min": 1269004318035200,
    "max": 1269043370446400,
    "mean": 1269023514120685.2,
    "p50": 1269023369409050,
    "p95": 1269041340846335,
    "p99": 1269042926466052
  },
  "reset_ended_ns": {
    "count": 1000,
    "min": 1269004390151200,
    "max": 1269043378080200,
    "mean": 1269023519437234.2,
    "p50": 1269023374118150,
    "p95": 1269041345463620,
    "p99": 1269042931797643
  },
  "reset_duration_ns": {
    "count": 1000,
    "min": 3530700,
    "max": 72116000,
    "mean": 5316547.3,
    "p50": 4987750,
    "p95": 7925540,
    "p99": 11837422.999999998
  }
}
```

```csv
batch,accepted_count,nonce_fail_count,batch_duration_ns,reset_started_ns,reset_ended_ns,reset_duration_ns
1,1,49,90353100,1269004318035200,1269004390151200,72116000
2,1,49,48243500,1269004482651500,1269004490585400,7933900
3,1,49,41408900,1269004539027100,1269004545167900,6140800
4,1,49,40216500,1269004586761300,1269004592299300,5538000
5,1,49,41918500,1269004632711400,1269004638112100,5400700
6,1,49,39811400,1269004680266800,1269004687156500,6889700
7,1,49,31856800,1269004727160700,1269004732102300,4941600
8,1,49,40709400,1269004764155500,1269004769903800,5748300
9,1,49,36710900,1269004810798200,1269004816034900,5236700
10,1,49,40099900,1269004852941100,1269004857831500,4890400
11,1,49,44271800,1269004898120100,1269004914944400,16824300
12,1,49,32085200,1269004959549900,1269004964870500,5320600
13,1,49,31555900,1269004997281900,1269005003311000,6029100
14,1,49,26411600,1269005035020100,1269005039980900,4960800
15,1,49,28689800,1269005066511500,1269005071299400,4787900
16,1,49,31440200,1269005100129200,1269005106950700,6821500
17,1,49,31234800,1269005138536300,1269005143753600,5217300
18,1,49,35479600,1269005175133400,1269005179921100,4787700
19,1,49,31786900,1269005215544200,1269005220538500,4994300
... omitted rows ...
981,1,49,38644500,1269042558525300,1269042563368000,4842700
982,1,49,33658300,1269042602233800,1269042607789600,5555800
983,1,49,36074000,1269042641672100,1269042646551800,4879700
984,1,49,41136000,1269042682785200,1269042687458400,4673200
985,1,49,34872300,1269042728767100,1269042733828600,5061500
986,1,49,33909500,1269042768901100,1269042773789400,4888300
987,1,49,31425300,1269042807909300,1269042812484100,4574800
988,1,49,39604200,1269042844101700,1269042849150800,5049100
989,1,49,32116700,1269042888899100,1269042893780500,4881400
990,1,49,34968600,1269042926061300,1269042931390400,5329100
991,1,49,37010900,1269042966536500,1269042972114700,5578200
992,1,49,30594700,1269043009361200,1269043014385200,5024000
993,1,49,42873400,1269043045157100,1269043050284100,5127000
994,1,49,36650000,1269043093330300,1269043098275700,4945400
995,1,49,40959500,1269043135113400,1269043140772900,5659500
996,1,49,38634400,1269043181944000,1269043187424400,5480400
997,1,49,48125000,1269043226268800,1269043231615600,5346800
998,1,49,34790200,1269043279930400,1269043285316400,5386000
999,1,49,43827500,1269043320379700,1269043326418200,6038500
1000,1,49,49602200,1269043370446400,1269043378080200,7633800
```

### `experiments/results/corrections/race-identical-50x1000-requests.csv`

Bytes: 3233722. SHA-256: `3943e243efa1460148ffb7c1fc104a563ac6ec37d050888a63c4e94124da9df4`.

Large-result rule applied. The complete result remains on disk.

Total rows: 50001.

Aggregate statistics (counts, min, max, mean, p50, p95, and p99 for numeric columns):

```json
{
  "batch": {
    "count": 50000,
    "min": 1,
    "max": 1000,
    "mean": 500.5,
    "p50": 500.5,
    "p95": 950.0499999999956,
    "p99": 990.010000000002
  },
  "request_index": {
    "count": 50000,
    "min": 1,
    "max": 50,
    "mean": 25.5,
    "p50": 25.5,
    "p95": 48,
    "p99": 50
  },
  "started_ns": {
    "count": 50000,
    "min": 1269004392110600,
    "max": 1269043381715400,
    "mean": 1269023520857175,
    "p50": 1269023375137700,
    "p95": 1269041347228655,
    "p99": 1269042933927201
  },
  "ended_ns": {
    "count": 50000,
    "min": 1269004452227100,
    "max": 1269043427803500,
    "mean": 1269023547377824.5,
    "p50": 1269023399593900,
    "p95": 1269041373603005,
    "p99": 1269042966766532
  },
  "duration_ns": {
    "count": 50000,
    "min": 15854600,
    "max": 93218300,
    "mean": 26520660.226,
    "p50": 24950100,
    "p95": 38707694.99999996,
    "p99": 48990644.00000001
  },
  "http_status": {
    "count": 50000,
    "min": 200,
    "max": 409,
    "mean": 404.82,
    "p50": 409,
    "p95": 409,
    "p99": 409
  }
}
```

```csv
batch,request_index,started_ns,ended_ns,duration_ns,http_status,outcome
1,1,1269004392110600,1269004452956400,60845800,409,NONCE_FAIL
1,2,1269004392836900,1269004454145200,61308300,409,NONCE_FAIL
1,3,1269004393361000,1269004482387500,89026500,200,ACCEPTED
1,4,1269004393838800,1269004452227100,58388300,409,NONCE_FAIL
1,5,1269004394206100,1269004458223700,64017600,409,NONCE_FAIL
1,6,1269004394503600,1269004458951600,64448000,409,NONCE_FAIL
1,7,1269004394922800,1269004459464800,64542000,409,NONCE_FAIL
1,8,1269004395378900,1269004460300800,64921900,409,NONCE_FAIL
1,9,1269004395903400,1269004461103100,65199700,409,NONCE_FAIL
1,10,1269004396370900,1269004461826400,65455500,409,NONCE_FAIL
1,11,1269004396642600,1269004462698300,66055700,409,NONCE_FAIL
1,12,1269004396818700,1269004463658900,66840200,409,NONCE_FAIL
1,13,1269004396999000,1269004463129400,66130400,409,NONCE_FAIL
1,14,1269004397149100,1269004469681200,72532100,409,NONCE_FAIL
1,15,1269004397323900,1269004464802000,67478100,409,NONCE_FAIL
1,16,1269004397518300,1269004464121100,66602800,409,NONCE_FAIL
1,17,1269004397692800,1269004465412000,67719200,409,NONCE_FAIL
1,18,1269004397910500,1269004466553800,68643300,409,NONCE_FAIL
1,19,1269004398066700,1269004466228800,68162100,409,NONCE_FAIL
... omitted rows ...
1000,31,1269043380439500,1269043420079500,39640000,409,NONCE_FAIL
1000,32,1269043380506900,1269043419933100,39426200,409,NONCE_FAIL
1000,33,1269043380577100,1269043420403900,39826800,409,NONCE_FAIL
1000,34,1269043380648400,1269043421424300,40775900,409,NONCE_FAIL
1000,35,1269043380714700,1269043420230600,39515900,409,NONCE_FAIL
1000,36,1269043380779400,1269043421774800,40995400,409,NONCE_FAIL
1000,37,1269043380844500,1269043420553800,39709300,409,NONCE_FAIL
1000,38,1269043380913600,1269043420789000,39875400,409,NONCE_FAIL
1000,39,1269043380980000,1269043420951300,39971300,409,NONCE_FAIL
1000,40,1269043381053400,1269043421221900,40168500,409,NONCE_FAIL
1000,41,1269043381118700,1269043423452900,42334200,409,NONCE_FAIL
1000,42,1269043381184100,1269043422076600,40892500,409,NONCE_FAIL
1000,43,1269043381248600,1269043422396800,41148200,409,NONCE_FAIL
1000,44,1269043381317000,1269043421928400,40611400,409,NONCE_FAIL
1000,45,1269043381382900,1269043423293900,41911000,409,NONCE_FAIL
1000,46,1269043381455100,1269043422228100,40773000,409,NONCE_FAIL
1000,47,1269043381521100,1269043422643800,41122700,409,NONCE_FAIL
1000,48,1269043381586100,1269043422966500,41380400,409,NONCE_FAIL
1000,49,1269043381650100,1269043422816500,41166400,409,NONCE_FAIL
1000,50,1269043381715400,1269043423135900,41420500,409,NONCE_FAIL
```

### `experiments/results/corrections/race-same-request-id-50-requests.csv`

Bytes: 3469. SHA-256: `0cf4e976e66615bb1b0c98fe88f6f47f4dc257c69be64a05739afe22486961a1`.

```csv
request_index,started_ns,ended_ns,duration_ns,http_status,outcome
1,1269043458926000,1269043517125200,58199200,200,ACCEPTED
2,1269043459159100,1269043518588100,59429000,409,ALREADY_PROCESSED
3,1269043459287300,1269043523914200,64626900,409,ALREADY_PROCESSED
4,1269043459365000,1269043584720700,125355700,409,ALREADY_PROCESSED
5,1269043459434700,1269043541897800,82463100,409,ALREADY_PROCESSED
6,1269043459499600,1269043529102700,69603100,409,ALREADY_PROCESSED
7,1269043459563100,1269043536655000,77091900,409,ALREADY_PROCESSED
8,1269043459629100,1269043530607400,70978300,409,ALREADY_PROCESSED
9,1269043459694400,1269043519841900,60147500,409,ALREADY_PROCESSED
10,1269043459761400,1269043521206200,61444800,409,ALREADY_PROCESSED
11,1269043459823500,1269043522683600,62860100,409,ALREADY_PROCESSED
12,1269043459885100,1269043532652300,72767200,409,ALREADY_PROCESSED
13,1269043459946600,1269043526059700,66113100,409,ALREADY_PROCESSED
14,1269043460009200,1269043534233000,74223800,409,ALREADY_PROCESSED
15,1269043460072100,1269043545703200,85631100,409,ALREADY_PROCESSED
16,1269043460133800,1269043539869900,79736100,409,ALREADY_PROCESSED
17,1269043460196300,1269043535450200,75253900,409,ALREADY_PROCESSED
18,1269043460258500,1269043538142900,77884400,409,ALREADY_PROCESSED
19,1269043460319800,1269043548692600,88372800,409,ALREADY_PROCESSED
20,1269043460387800,1269043555714200,95326400,409,ALREADY_PROCESSED
21,1269043460450900,1269043550196400,89745500,409,ALREADY_PROCESSED
22,1269043460511900,1269043570114000,109602100,409,ALREADY_PROCESSED
23,1269043460573200,1269043543218000,82644800,409,ALREADY_PROCESSED
24,1269043460657800,1269043544589600,83931800,409,ALREADY_PROCESSED
25,1269043460749500,1269043553775000,93025500,409,ALREADY_PROCESSED
26,1269043460848200,1269043546755400,85907200,409,ALREADY_PROCESSED
27,1269043460933200,1269043547701500,86768300,409,ALREADY_PROCESSED
28,1269043460998300,1269043565969300,104971000,409,ALREADY_PROCESSED
29,1269043461061600,1269043564218700,103157100,409,ALREADY_PROCESSED
30,1269043461123600,1269043552078800,90955200,409,ALREADY_PROCESSED
31,1269043461192400,1269043559211500,98019100,409,ALREADY_PROCESSED
32,1269043461255100,1269043557540200,96285100,409,ALREADY_PROCESSED
33,1269043461317300,1269043560837700,99520400,409,ALREADY_PROCESSED
34,1269043461378600,1269043562509900,101131300,409,ALREADY_PROCESSED
35,1269043461443600,1269043572136500,110692900,409,ALREADY_PROCESSED
36,1269043461505500,1269043576921300,115415800,409,ALREADY_PROCESSED
37,1269043461576500,1269043567690700,106114200,409,ALREADY_PROCESSED
38,1269043461637900,1269043568937100,107299200,409,ALREADY_PROCESSED
39,1269043461700800,1269043575427300,113726500,409,ALREADY_PROCESSED
40,1269043461764500,1269043580969600,119205100,409,ALREADY_PROCESSED
41,1269043461829400,1269043585874100,124044700,409,ALREADY_PROCESSED
42,1269043461895800,1269043591055600,129159800,409,ALREADY_PROCESSED
43,1269043461975700,1269043582300300,120324600,409,ALREADY_PROCESSED
44,1269043462038200,1269043588507100,126468900,409,ALREADY_PROCESSED
45,1269043462102400,1269043578184300,116081900,409,ALREADY_PROCESSED
46,1269043462164100,1269043579347800,117183700,409,ALREADY_PROCESSED
47,1269043462226900,1269043583549300,121322400,409,ALREADY_PROCESSED
48,1269043462320700,1269043589922400,127601700,409,ALREADY_PROCESSED
49,1269043462441500,1269043586982600,124541100,409,ALREADY_PROCESSED
50,1269043462539300,1269043592315600,129776300,409,ALREADY_PROCESSED
```

### `experiments/results/corrections/race-summary-1000-batches.json`

Bytes: 1264. SHA-256: `f4be98fa94363ce6378b1b23de93524116f3d472d3c058d4b8d1d1c4ad13c458`.

```json
{
  "vizEnabled": false,
  "identicalPayloadRace": {
    "batches": 1000,
    "parallelWidth": 50,
    "acceptedCountDistribution": {
      "1": 1000
    },
    "acceptedPerBatch": 1,
    "totalRequests": 50000
  },
  "secretHolderSameRequestIdRace": {
    "parallelWidth": 50,
    "acceptedCount": 1,
    "requestIdShared": true,
    "distinctValidNonces": 50,
    "debitAmount": 1,
    "duration_ns": "133438200",
    "beforeBalanceTiming": {
      "start_ns": "1269043455696700",
      "end_ns": "1269043458880200",
      "duration_ns": "3183500",
      "status": 200,
      "body": {
        "user_id": "anis_101",
        "username": "Anis Ahmed",
        "balance": 10000,
        "currency": "BDT",
        "account_id": "acc_777"
      }
    },
    "afterBalanceTiming": {
      "start_ns": "1269043592349000",
      "end_ns": "1269043594349200",
      "duration_ns": "2000200",
      "status": 200,
      "body": {
        "user_id": "anis_101",
        "username": "Anis Ahmed",
        "balance": 9999,
        "currency": "BDT",
        "account_id": "acc_777"
      }
    },
    "oracle": {
      "totalDebited": 1,
      "authorizedTotal": 50,
      "duplicateDebitAmount": 0,
      "duplicateDebitCount": 0,
      "integrityHolds": true
    }
  }
}
```

### `experiments/results/corrections/server-layer-timings-c2-accepted.csv`

Bytes: 12635825. SHA-256: `56d5278c0d82b0e7625a494e430c92de8928b0d3b0d4e80b71cc732f183270e7`.

Large-result rule applied. The complete result remains on disk.

Total rows: 100011.

Aggregate statistics (counts, min, max, mean, p50, p95, and p99 for numeric columns):

```json
{
  "started_ns": {
    "count": 100010,
    "min": 1267753475672500,
    "max": 1268673309150900,
    "mean": 1268199089033084.8,
    "p50": 1268196670673300,
    "p95": 1268626627912860,
    "p99": 1268664247191567
  },
  "ended_ns": {
    "count": 100010,
    "min": 1267753486536300,
    "max": 1268673317993800,
    "mean": 1268199096789615.8,
    "p50": 1268196681303600,
    "p95": 1268626637560275,
    "p99": 1268664253801486
  },
  "duration_ns": {
    "count": 100010,
    "min": 3345100,
    "max": 253671200,
    "mean": 7756526.801319868,
    "p50": 7339100,
    "p95": 11517084.999999993,
    "p99": 16269529.000000007
  },
  "hmac_ns": {
    "count": 100010,
    "min": 24100,
    "max": 599000,
    "mean": 53206.77232276772,
    "p50": 47500,
    "p95": 94600,
    "p99": 139900
  },
  "timestamp_ns": {
    "count": 100010,
    "min": 2300,
    "max": 480700,
    "mean": 7314.958504149585,
    "p50": 6100,
    "p95": 15100,
    "p99": 24991.00000000035
  },
  "nonce_ns": {
    "count": 100010,
    "min": 133000,
    "max": 22768000,
    "mean": 401147.51724827517,
    "p50": 367300,
    "p95": 637054.9999999988,
    "p99": 1031582.0000000007
  },
  "request_id_ns": {
    "count": 100010,
    "min": 178700,
    "max": 33086100,
    "mean": 418585.4334566543,
    "p50": 368700,
    "p95": 707100,
    "p99": 1172791.0000000005
  },
  "balance_ns": {
    "count": 100010,
    "min": 100,
    "max": 51500,
    "mean": 359.64003599640034,
    "p50": 300,
    "p95": 700,
    "p99": 1100
  },
  "http_status": {
    "count": 100010,
    "min": 200,
    "max": 200,
    "mean": 200,
    "p50": 200,
    "p95": 200,
    "p99": 200
  }
}
```

```csv
config_id,scenario_id,run_id,started_ns,ended_ns,duration_ns,hmac_ns,timestamp_ns,nonce_ns,request_id_ns,balance_ns,outcome,http_status
nonce-memory-accepted,accepted,c2accepted,1267753475672500,1267753486536300,10863800,599000,167800,1806200,1462200,1300,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267753491388200,1267753500415200,9027000,239900,45000,1260400,835000,800,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267753504395300,1267753510600000,6204700,164800,25800,739700,429300,2000,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267753515178100,1267753522003100,6825000,260600,30800,1056800,537600,1100,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267753526465200,1267753533393100,6927900,122000,21100,682800,480500,1300,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267753536473500,1267753543556500,7083000,97000,20500,1848500,586100,900,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267753547388900,1267753553296800,5907900,185100,27200,762100,437600,1500,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267753556310900,1267753562170800,5859900,154200,23300,529700,562400,2100,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267753565818300,1267753571560000,5741700,153200,23100,605300,440500,1100,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267753575916800,1267753581690300,5773500,248100,48800,655600,433200,600,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267759474334100,1267759481958500,7624400,168400,23900,1011300,680100,900,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267759487091400,1267759494220000,7128600,159000,14300,634700,734100,700,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267759498380000,1267759504754900,6374900,92500,11800,699100,510100,800,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267759509652400,1267759515449500,5797100,149300,16500,814300,537600,600,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267759519394100,1267759529314800,9920700,110400,16900,585700,1405700,1200,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267759532715100,1267759537830300,5115200,112600,9400,435100,293200,600,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267759541811200,1267759548084500,6273300,124100,14900,678700,531100,800,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267759551902800,1267759557623800,5721000,126300,24300,671900,533200,400,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1267759561537800,1267759566037200,4499400,64000,8400,456500,320400,300,ACCEPTED,200
... omitted rows ...
nonce-memory-accepted,accepted,c2accepted,1268673140264700,1268673146766000,6501300,36600,4500,351900,376300,300,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673147976300,1268673154695700,6719400,74500,6000,397000,442900,1600,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673155785600,1268673164141200,8355600,37600,4900,296500,365800,200,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673165352300,1268673174131500,8779200,43600,6000,343100,355200,300,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673175345100,1268673182344500,6999400,51300,7500,452700,364200,300,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673183574300,1268673191822400,8248100,45800,6900,355700,414500,300,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673193083300,1268673200464900,7381600,50500,7700,386400,433700,200,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673201801200,1268673210326200,8525000,64200,21100,350900,377700,200,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673211679400,1268673218783100,7103700,76000,7700,405500,426200,300,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673219782400,1268673226736700,6954300,32200,4200,296300,295700,300,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673228552000,1268673235892500,7340500,203700,8400,354000,379000,300,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673237453300,1268673244424800,6971500,42100,13700,346300,422000,200,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673245646400,1268673254032200,8385800,37800,5300,288500,316500,200,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673255341200,1268673263280600,7939400,53100,7600,404000,495700,400,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673264291900,1268673271123400,6831500,54100,19400,324500,455600,300,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673272149900,1268673279085300,6935400,54300,5600,333700,356300,300,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673280086400,1268673289410500,9324100,41600,5300,326900,350700,200,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673290485800,1268673300110400,9624600,42000,6100,329900,363200,300,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673301234200,1268673308146000,6911800,44200,5600,337900,377400,400,ACCEPTED,200
nonce-memory-accepted,accepted,c2accepted,1268673309150900,1268673317993800,8842900,50500,7400,317100,803200,800,ACCEPTED,200
```

### `experiments/results/corrections/server.restart.stderr.log.copy`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/server.restart.stdout.log.copy`

Bytes: 82. SHA-256: `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 0.0.0.0:3000
```

### `experiments/results/corrections/server.stderr.log.copy`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/server.stdout.log.copy`

Bytes: 82. SHA-256: `25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 0.0.0.0:3000
```

### `experiments/results/corrections/timestamp-boundaries-30-each.csv`

Bytes: 16478. SHA-256: `30e39211195246be5294ad7298345aef199090004eb6639253cb22b88c92e57a`.

```csv
label,repetition,offset_ms,started_ns,ended_ns,duration_ns,http_status,outcome
past_tolerance_edge_minus_5s,1,-5000,1269745293161100,1269745302813100,9652000,200,ACCEPTED
past_tolerance_edge_minus_5s,2,-5000,1269745303099200,1269745313864100,10764900,200,ACCEPTED
past_tolerance_edge_minus_5s,3,-5000,1269745314137400,1269745324424300,10286900,200,ACCEPTED
past_tolerance_edge_minus_5s,4,-5000,1269745324650600,1269745335180600,10530000,200,ACCEPTED
past_tolerance_edge_minus_5s,5,-5000,1269745335437400,1269745345545600,10108200,200,ACCEPTED
past_tolerance_edge_minus_5s,6,-5000,1269745345728100,1269745354652100,8924000,200,ACCEPTED
past_tolerance_edge_minus_5s,7,-5000,1269745354885700,1269745365152600,10266900,200,ACCEPTED
past_tolerance_edge_minus_5s,8,-5000,1269745365366900,1269745374142400,8775500,200,ACCEPTED
past_tolerance_edge_minus_5s,9,-5000,1269745374292000,1269745382171800,7879800,200,ACCEPTED
past_tolerance_edge_minus_5s,10,-5000,1269745382322300,1269745389649100,7326800,200,ACCEPTED
past_tolerance_edge_minus_5s,11,-5000,1269745389836900,1269745398780800,8943900,200,ACCEPTED
past_tolerance_edge_minus_5s,12,-5000,1269745398984300,1269745407857200,8872900,200,ACCEPTED
past_tolerance_edge_minus_5s,13,-5000,1269745408059900,1269745416961700,8901800,200,ACCEPTED
past_tolerance_edge_minus_5s,14,-5000,1269745417122400,1269745425401700,8279300,200,ACCEPTED
past_tolerance_edge_minus_5s,15,-5000,1269745425654800,1269745433035800,7381000,200,ACCEPTED
past_tolerance_edge_minus_5s,16,-5000,1269745433209300,1269745441270300,8061000,200,ACCEPTED
past_tolerance_edge_minus_5s,17,-5000,1269745441482800,1269745450563700,9080900,200,ACCEPTED
past_tolerance_edge_minus_5s,18,-5000,1269745450694900,1269745457292500,6597600,200,ACCEPTED
past_tolerance_edge_minus_5s,19,-5000,1269745457459300,1269745464223300,6764000,200,ACCEPTED
past_tolerance_edge_minus_5s,20,-5000,1269745464324900,1269745470172200,5847300,200,ACCEPTED
past_tolerance_edge_minus_5s,21,-5000,1269745470315400,1269745476662600,6347200,200,ACCEPTED
past_tolerance_edge_minus_5s,22,-5000,1269745476865500,1269745482728200,5862700,200,ACCEPTED
past_tolerance_edge_minus_5s,23,-5000,1269745482846900,1269745489169300,6322400,200,ACCEPTED
past_tolerance_edge_minus_5s,24,-5000,1269745489264900,1269745496900100,7635200,200,ACCEPTED
past_tolerance_edge_minus_5s,25,-5000,1269745497045600,1269745505183700,8138100,200,ACCEPTED
past_tolerance_edge_minus_5s,26,-5000,1269745505396400,1269745512920700,7524300,200,ACCEPTED
past_tolerance_edge_minus_5s,27,-5000,1269745513046200,1269745520040500,6994300,200,ACCEPTED
past_tolerance_edge_minus_5s,28,-5000,1269745520160000,1269745527525300,7365300,200,ACCEPTED
past_tolerance_edge_minus_5s,29,-5000,1269745527680500,1269745534672600,6992100,200,ACCEPTED
past_tolerance_edge_minus_5s,30,-5000,1269745534790600,1269745541914500,7123900,200,ACCEPTED
future_tolerance_edge_plus_5s,1,5000,1269745542078100,1269745548282200,6204100,200,ACCEPTED
future_tolerance_edge_plus_5s,2,5000,1269745548365600,1269745554852100,6486500,200,ACCEPTED
future_tolerance_edge_plus_5s,3,5000,1269745555001800,1269745562628400,7626600,200,ACCEPTED
future_tolerance_edge_plus_5s,4,5000,1269745562754200,1269745569466400,6712200,200,ACCEPTED
future_tolerance_edge_plus_5s,5,5000,1269745569618900,1269745577747400,8128500,200,ACCEPTED
future_tolerance_edge_plus_5s,6,5000,1269745577870100,1269745583912700,6042600,200,ACCEPTED
future_tolerance_edge_plus_5s,7,5000,1269745584046000,1269745591359900,7313900,200,ACCEPTED
future_tolerance_edge_plus_5s,8,5000,1269745591556400,1269745599404000,7847600,200,ACCEPTED
future_tolerance_edge_plus_5s,9,5000,1269745599530700,1269745606034100,6503400,200,ACCEPTED
future_tolerance_edge_plus_5s,10,5000,1269745606125100,1269745612919700,6794600,200,ACCEPTED
future_tolerance_edge_plus_5s,11,5000,1269745613046200,1269745619416500,6370300,200,ACCEPTED
future_tolerance_edge_plus_5s,12,5000,1269745619605500,1269745628778100,9172600,200,ACCEPTED
future_tolerance_edge_plus_5s,13,5000,1269745628868300,1269745634408300,5540000,200,ACCEPTED
future_tolerance_edge_plus_5s,14,5000,1269745634532100,1269745640487300,5955200,200,ACCEPTED
future_tolerance_edge_plus_5s,15,5000,1269745640606500,1269745646527300,5920800,200,ACCEPTED
future_tolerance_edge_plus_5s,16,5000,1269745646616500,1269745652440700,5824200,200,ACCEPTED
future_tolerance_edge_plus_5s,17,5000,1269745652547600,1269745659247500,6699900,200,ACCEPTED
future_tolerance_edge_plus_5s,18,5000,1269745659340500,1269745665694200,6353700,200,ACCEPTED
future_tolerance_edge_plus_5s,19,5000,1269745665799500,1269745672651300,6851800,200,ACCEPTED
future_tolerance_edge_plus_5s,20,5000,1269745672788600,1269745679172600,6384000,200,ACCEPTED
future_tolerance_edge_plus_5s,21,5000,1269745679262900,1269745686363200,7100300,200,ACCEPTED
future_tolerance_edge_plus_5s,22,5000,1269745686455100,1269745692854900,6399800,200,ACCEPTED
future_tolerance_edge_plus_5s,23,5000,1269745693032500,1269745698713100,5680600,200,ACCEPTED
future_tolerance_edge_plus_5s,24,5000,1269745698859300,1269745705219800,6360500,200,ACCEPTED
future_tolerance_edge_plus_5s,25,5000,1269745705393000,1269745712121000,6728000,200,ACCEPTED
future_tolerance_edge_plus_5s,26,5000,1269745712251600,1269745718581200,6329600,200,ACCEPTED
future_tolerance_edge_plus_5s,27,5000,1269745718715500,1269745725510300,6794800,200,ACCEPTED
future_tolerance_edge_plus_5s,28,5000,1269745725634600,1269745731349300,5714700,200,ACCEPTED
future_tolerance_edge_plus_5s,29,5000,1269745731480600,1269745738145000,6664400,200,ACCEPTED
future_tolerance_edge_plus_5s,30,5000,1269745738253800,1269745744520500,6266700,200,ACCEPTED
age_299s,1,-299000,1269745744613200,1269745752861100,8247900,200,ACCEPTED
age_299s,2,-299000,1269745753037000,1269745763047500,10010500,200,ACCEPTED
age_299s,3,-299000,1269745763255700,1269745774446500,11190800,200,ACCEPTED
age_299s,4,-299000,1269745774620100,1269745783102500,8482400,200,ACCEPTED
age_299s,5,-299000,1269745783303500,1269745791255500,7952000,200,ACCEPTED
age_299s,6,-299000,1269745791433800,1269745815492600,24058800,200,ACCEPTED
age_299s,7,-299000,1269745815612600,1269745822895500,7282900,200,ACCEPTED
age_299s,8,-299000,1269745823048700,1269745831018800,7970100,200,ACCEPTED
age_299s,9,-299000,1269745831166400,1269745838747500,7581100,200,ACCEPTED
age_299s,10,-299000,1269745838901100,1269745847023700,8122600,200,ACCEPTED
age_299s,11,-299000,1269745847171800,1269745855371000,8199200,200,ACCEPTED
age_299s,12,-299000,1269745855518100,1269745868045400,12527300,200,ACCEPTED
age_299s,13,-299000,1269745868180400,1269745877847500,9667100,200,ACCEPTED
age_299s,14,-299000,1269745878030700,1269745893199600,15168900,200,ACCEPTED
age_299s,15,-299000,1269745893402400,1269745901716900,8314500,200,ACCEPTED
age_299s,16,-299000,1269745901928400,1269745919605000,17676600,200,ACCEPTED
age_299s,17,-299000,1269745919800300,1269745925940100,6139800,200,ACCEPTED
age_299s,18,-299000,1269745926038100,1269745931704200,5666100,200,ACCEPTED
age_299s,19,-299000,1269745931850300,1269745938010500,6160200,200,ACCEPTED
age_299s,20,-299000,1269745938121800,1269745944143500,6021700,200,ACCEPTED
age_299s,21,-299000,1269745944232400,1269745949879300,5646900,200,ACCEPTED
age_299s,22,-299000,1269745949981200,1269745955843700,5862500,200,ACCEPTED
age_299s,23,-299000,1269745955928900,1269745961737000,5808100,200,ACCEPTED
age_299s,24,-299000,1269745961871200,1269745967305500,5434300,200,ACCEPTED
age_299s,25,-299000,1269745967412700,1269745973003000,5590300,200,ACCEPTED
age_299s,26,-299000,1269745973217700,1269745979467800,6250100,200,ACCEPTED
age_299s,27,-299000,1269745979553200,1269745984863700,5310500,200,ACCEPTED
age_299s,28,-299000,1269745984953000,1269745990714300,5761300,200,ACCEPTED
age_299s,29,-299000,1269745990860300,1269745996279800,5419500,200,ACCEPTED
age_299s,30,-299000,1269745996392000,1269746002060600,5668600,200,ACCEPTED
age_300s,1,-300000,1269746002182000,1269746007687700,5505700,200,ACCEPTED
age_300s,2,-300000,1269746007775200,1269746013596000,5820800,200,ACCEPTED
age_300s,3,-300000,1269746013733800,1269746029448500,15714700,200,ACCEPTED
age_300s,4,-300000,1269746029575800,1269746035391100,5815300,200,ACCEPTED
age_300s,5,-300000,1269746035492800,1269746041502900,6010100,200,ACCEPTED
age_300s,6,-300000,1269746041658800,1269746047989600,6330800,200,ACCEPTED
age_300s,7,-300000,1269746048094900,1269746057030400,8935500,200,ACCEPTED
age_300s,8,-300000,1269746057176700,1269746067738300,10561600,200,ACCEPTED
age_300s,9,-300000,1269746067910400,1269746075062700,7152300,200,ACCEPTED
age_300s,10,-300000,1269746075162800,1269746082427100,7264300,200,ACCEPTED
age_300s,11,-300000,1269746082538600,1269746089708000,7169400,200,ACCEPTED
age_300s,12,-300000,1269746089994900,1269746096769900,6775000,200,ACCEPTED
age_300s,13,-300000,1269746096859200,1269746102531900,5672700,200,ACCEPTED
age_300s,14,-300000,1269746102644100,1269746108167300,5523200,200,ACCEPTED
age_300s,15,-300000,1269746108284400,1269746114342900,6058500,200,ACCEPTED
age_300s,16,-300000,1269746114490400,1269746119986500,5496100,200,ACCEPTED
age_300s,17,-300000,1269746120098100,1269746126310200,6212100,200,ACCEPTED
age_300s,18,-300000,1269746126418700,1269746132071900,5653200,200,ACCEPTED
age_300s,19,-300000,1269746132166800,1269746137939400,5772600,200,ACCEPTED
age_300s,20,-300000,1269746138030700,1269746143807100,5776400,200,ACCEPTED
age_300s,21,-300000,1269746143929000,1269746149325100,5396100,200,ACCEPTED
age_300s,22,-300000,1269746149416700,1269746155387900,5971200,200,ACCEPTED
age_300s,23,-300000,1269746155475900,1269746161580000,6104100,200,ACCEPTED
age_300s,24,-300000,1269746161664600,1269746167134800,5470200,200,ACCEPTED
age_300s,25,-300000,1269746167221500,1269746172690200,5468700,200,ACCEPTED
age_300s,26,-300000,1269746172794600,1269746178922300,6127700,200,ACCEPTED
age_300s,27,-300000,1269746179041400,1269746185281200,6239800,200,ACCEPTED
age_300s,28,-300000,1269746185387600,1269746191446700,6059100,200,ACCEPTED
age_300s,29,-300000,1269746191691700,1269746198380000,6688300,200,ACCEPTED
age_300s,30,-300000,1269746198475900,1269746204989800,6513900,200,ACCEPTED
age_301s_first_rejected_past_side,1,-301000,1269746205113300,1269746208519100,3405800,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,2,-301000,1269746208627100,1269746211466700,2839600,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,3,-301000,1269746211569900,1269746214453300,2883400,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,4,-301000,1269746214576100,1269746217678500,3102400,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,5,-301000,1269746217794200,1269746220828800,3034600,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,6,-301000,1269746220917000,1269746223988700,3071700,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,7,-301000,1269746224097100,1269746227347900,3250800,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,8,-301000,1269746227434400,1269746230284400,2850000,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,9,-301000,1269746230446700,1269746233658700,3212000,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,10,-301000,1269746233769600,1269746236959500,3189900,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,11,-301000,1269746237061500,1269746240443500,3382000,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,12,-301000,1269746240537400,1269746243212100,2674700,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,13,-301000,1269746243294500,1269746246131300,2836800,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,14,-301000,1269746246235300,1269746249265400,3030100,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,15,-301000,1269746249346100,1269746252080000,2733900,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,16,-301000,1269746252170000,1269746255739700,3569700,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,17,-301000,1269746255845900,1269746259422500,3576600,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,18,-301000,1269746259587700,1269746263133700,3546000,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,19,-301000,1269746263279900,1269746267416300,4136400,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,20,-301000,1269746267504800,1269746270776500,3271700,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,21,-301000,1269746270908400,1269746274044400,3136000,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,22,-301000,1269746274207700,1269746278751300,4543600,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,23,-301000,1269746278918900,1269746282245600,3326700,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,24,-301000,1269746282337400,1269746286340400,4003000,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,25,-301000,1269746286491800,1269746290540800,4049000,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,26,-301000,1269746290682400,1269746294646100,3963700,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,27,-301000,1269746294769200,1269746299024400,4255200,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,28,-301000,1269746299112400,1269746303090200,3977800,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,29,-301000,1269746303216200,1269746307479900,4263700,400,TIMESTAMP_FAIL
age_301s_first_rejected_past_side,30,-301000,1269746307587400,1269746310602300,3014900,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,1,6000,1269746310723100,1269746314594900,3871800,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,2,6000,1269746314739700,1269746319093200,4353500,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,3,6000,1269746319295600,1269746323668600,4373000,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,4,6000,1269746323874400,1269746328104700,4230300,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,5,6000,1269746328217700,1269746331637900,3420200,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,6,6000,1269746331778600,1269746335343800,3565200,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,7,6000,1269746335482800,1269746338956300,3473500,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,8,6000,1269746339085500,1269746343088200,4002700,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,9,6000,1269746343187600,1269746346488000,3300400,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,10,6000,1269746346751300,1269746351950500,5199200,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,11,6000,1269746352070300,1269746355753200,3682900,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,12,6000,1269746355895300,1269746360341800,4446500,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,13,6000,1269746360465100,1269746363714700,3249600,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,14,6000,1269746364043300,1269746368031700,3988400,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,15,6000,1269746368147500,1269746373227400,5079900,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,16,6000,1269746373384700,1269746377424700,4040000,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,17,6000,1269746377596300,1269746380936000,3339700,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,18,6000,1269746381023600,1269746384826100,3802500,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,19,6000,1269746384989000,1269746388218900,3229900,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,20,6000,1269746388331100,1269746391619000,3287900,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,21,6000,1269746391717600,1269746394517800,2800200,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,22,6000,1269746394636000,1269746398091000,3455000,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,23,6000,1269746398211300,1269746401209700,2998400,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,24,6000,1269746401286500,1269746404555400,3268900,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,25,6000,1269746404652600,1269746408616900,3964300,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,26,6000,1269746408780100,1269746412037400,3257300,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,27,6000,1269746412176900,1269746415648200,3471300,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,28,6000,1269746415741100,1269746418926100,3185000,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,29,6000,1269746419074200,1269746422624400,3550200,400,TIMESTAMP_FAIL
future_6s_first_rejected_future_side,30,6000,1269746422757400,1269746427037500,4280100,400,TIMESTAMP_FAIL
```

### `experiments/results/corrections/timestamp-boundaries-30-each.json`

Bytes: 66846. SHA-256: `5840b7fca6ef565bec2bf3253637d25d23d608feed50baca53277c5355ba85eb`.

Large-result rule applied. The complete result remains on disk.

Total rows: 2686.

Aggregate statistics (counts, min, max, mean, p50, p95, and p99 for numeric columns):

```json
{
  "numericValues": {
    "count": 1335,
    "min": -301000,
    "max": 1269746427037500,
    "mean": 342403402992628.4,
    "p50": 6000,
    "p95": 1269746296045760,
    "p99": 1269746401260388
  }
}
```

```json
{
  "repetitionsPerCase": 30,
  "vizEnabled": false,
  "cases": [
    {
      "label": "past_tolerance_edge_minus_5s",
      "offsetMs": -5000,
      "expected": "ACCEPTED",
      "measuredCount": 30
    },
    {
      "label": "future_tolerance_edge_plus_5s",
      "offsetMs": 5000,
      "expected": "ACCEPTED",
      "measuredCount": 30
    },
    {
      "label": "age_299s",
      "offsetMs": -299000,
      "expected": "ACCEPTED",
... omitted rows ...
      "ended_ns": "1269746422624400",
      "duration_ns": "3550200",
      "outcome": "TIMESTAMP_FAIL"
    },
    {
      "label": "future_6s_first_rejected_future_side",
      "repetition": 30,
      "offset_ms": 6000,
      "status": 400,
      "data": {
        "status": "REJECTED",
        "reason": "TIMESTAMP_FAIL"
      },
      "started_ns": "1269746422757400",
      "ended_ns": "1269746427037500",
      "duration_ns": "4280100",
      "outcome": "TIMESTAMP_FAIL"
    }
  ]
}
```

### `experiments/results/corrections/viz-enabled-nonce-scan-requests.csv`

Bytes: 326830. SHA-256: `e3c661220900d0275d82bfd3f79c10ff7ef555485d3b5eef7a742f6fc8c22d2e`.

Large-result rule applied. The complete result remains on disk.

Total rows: 5001.

Aggregate statistics (counts, min, max, mean, p50, p95, and p99 for numeric columns):

```json
{
  "index": {
    "count": 5000,
    "min": 1,
    "max": 5000,
    "mean": 2500.5,
    "p50": 2500.5,
    "p95": 4750.05,
    "p99": 4950.01
  },
  "nonce_keys_at_dashboard_scan": {
    "count": 5000,
    "min": 1,
    "max": 5000,
    "mean": 2500.5,
    "p50": 2500.5,
    "p95": 4750.05,
    "p99": 4950.01
  },
  "started_ns": {
    "count": 5000,
    "min": 1269319816088900,
    "max": 1269400293231700,
    "mean": 1269352081884484.5,
    "p50": 1269348130148050,
    "p95": 1269393867666240,
    "p99": 1269399045581218
  },
  "ended_ns": {
    "count": 5000,
    "min": 1269319833735300,
    "max": 1269400316266000,
    "mean": 1269352097873957.2,
    "p50": 1269348144775250,
    "p95": 1269393904925470,
    "p99": 1269399068843042
  },
  "duration_ns": {
    "count": 5000,
    "min": 5390100,
    "max": 68376400,
    "mean": 15989474.26,
    "p50": 14481200,
    "p95": 29020525.000000007,
    "p99": 37207269.00000001
  },
  "http_status": {
    "count": 5000,
    "min": 200,
    "max": 200,
    "mean": 200,
    "p50": 200,
    "p95": 200,
    "p99": 200
  }
}
```

```csv
index,nonce_keys_at_dashboard_scan,started_ns,ended_ns,duration_ns,http_status,outcome
1,1,1269319816088900,1269319833735300,17646400,200,ACCEPTED
2,2,1269319833933500,1269319844845600,10912100,200,ACCEPTED
3,3,1269319844982500,1269319855866800,10884300,200,ACCEPTED
4,4,1269319855991000,1269319865069600,9078600,200,ACCEPTED
5,5,1269319865303500,1269319875443600,10140100,200,ACCEPTED
6,6,1269319875566700,1269319882621200,7054500,200,ACCEPTED
7,7,1269319882733400,1269319891015800,8282400,200,ACCEPTED
8,8,1269319891195300,1269319900271400,9076100,200,ACCEPTED
9,9,1269319900440400,1269319908454300,8013900,200,ACCEPTED
10,10,1269319908611300,1269319915191200,6579900,200,ACCEPTED
11,11,1269319915281600,1269319921865800,6584200,200,ACCEPTED
12,12,1269319921962700,1269319928463100,6500400,200,ACCEPTED
13,13,1269319928604400,1269319935461300,6856900,200,ACCEPTED
14,14,1269319935575100,1269319942339200,6764100,200,ACCEPTED
15,15,1269319942468500,1269319948807300,6338800,200,ACCEPTED
16,16,1269319948922700,1269319955564800,6642100,200,ACCEPTED
17,17,1269319955677100,1269319961700100,6023000,200,ACCEPTED
18,18,1269319961806900,1269319971523300,9716400,200,ACCEPTED
19,19,1269319971815600,1269319985790900,13975300,200,ACCEPTED
... omitted rows ...
4981,4981,1269399815490800,1269399837530700,22039900,200,ACCEPTED
4982,4982,1269399837645600,1269399858639300,20993700,200,ACCEPTED
4983,4983,1269399858742600,1269399881308400,22565800,200,ACCEPTED
4984,4984,1269399881579500,1269399932375000,50795500,200,ACCEPTED
4985,4985,1269399932456200,1269399956132100,23675900,200,ACCEPTED
4986,4986,1269399956227400,1269399979895000,23667600,200,ACCEPTED
4987,4987,1269399979982300,1269400005884600,25902300,200,ACCEPTED
4988,4988,1269400005984400,1269400026923400,20939000,200,ACCEPTED
4989,4989,1269400027015800,1269400049398900,22383100,200,ACCEPTED
4990,4990,1269400049496900,1269400072553400,23056500,200,ACCEPTED
4991,4991,1269400072655300,1269400098639400,25984100,200,ACCEPTED
4992,4992,1269400098798000,1269400123591000,24793000,200,ACCEPTED
4993,4993,1269400123750900,1269400146250000,22499100,200,ACCEPTED
4994,4994,1269400146351100,1269400171513500,25162400,200,ACCEPTED
4995,4995,1269400171663900,1269400195744800,24080900,200,ACCEPTED
4996,4996,1269400195903100,1269400221474400,25571300,200,ACCEPTED
4997,4997,1269400221548100,1269400243396700,21848600,200,ACCEPTED
4998,4998,1269400243472700,1269400267165400,23692700,200,ACCEPTED
4999,4999,1269400267249300,1269400293150700,25901400,200,ACCEPTED
5000,5000,1269400293231700,1269400316266000,23034300,200,ACCEPTED
```

### `experiments/results/corrections/viz-enabled-nonce-scan-summary.json`

Bytes: 1263. SHA-256: `6c88f36d665722af0df0d32d06153cc965c59610c9eb986638da1b7835dcd006`.

```json
{
  "measuredOnce": true,
  "vizEnabled": true,
  "resetTiming": {
    "start_ns": "1269319730281500",
    "end_ns": "1269319814337200",
    "duration_ns": "84055700",
    "status": 200,
    "body": {
      "status": "RESET",
      "accounts": [
        {
          "user_id": "anis_101",
          "username": "Anis Ahmed",
          "balance": 10000,
          "currency": "BDT",
          "account_id": "acc_777",
          "created_at": "2026-10-17 22:01:53"
        }
      ],
      "transactions": [],
      "clearedNonceKeys": [],
      "keys": []
    }
  },
  "label": "dashboard per-request key-scan implementation artifact, not a defense property",
  "nonceKeySamples": [
    {
      "nonceKeysAtDashboardScan": 1,
      "duration_ns": "17646400",
      "duration_ms": 17.6464,
      "httpStatus": 200
    },
    {
      "nonceKeysAtDashboardScan": 100,
      "duration_ns": "6579000",
      "duration_ms": 6.579,
      "httpStatus": 200
    },
    {
      "nonceKeysAtDashboardScan": 1000,
      "duration_ns": "21229900",
      "duration_ms": 21.2299,
      "httpStatus": 200
    },
    {
      "nonceKeysAtDashboardScan": 5000,
      "duration_ns": "23034300",
      "duration_ms": 23.0343,
      "httpStatus": 200
    }
  ],
  "allRequests": 5000
}
```

### `experiments/results/corrections/viz-run.log`

Bytes: 2636. SHA-256: `3acdd4f04fdc694534b2e7c1487a5c77e151b6cb1656f4497e3ea20ac2b5ef5a`.

```text
��{  
     " m e a s u r e d O n c e " :   t r u e ,  
     " v i z E n a b l e d " :   t r u e ,  
     " r e s e t T i m i n g " :   {  
         " s t a r t _ n s " :   " 1 2 6 9 3 1 9 7 3 0 2 8 1 5 0 0 " ,  
         " e n d _ n s " :   " 1 2 6 9 3 1 9 8 1 4 3 3 7 2 0 0 " ,  
         " d u r a t i o n _ n s " :   " 8 4 0 5 5 7 0 0 " ,  
         " s t a t u s " :   2 0 0 ,  
         " b o d y " :   {  
             " s t a t u s " :   " R E S E T " ,  
             " a c c o u n t s " :   [  
                 {  
                     " u s e r _ i d " :   " a n i s _ 1 0 1 " ,  
                     " u s e r n a m e " :   " A n i s   A h m e d " ,  
                     " b a l a n c e " :   1 0 0 0 0 ,  
                     " c u r r e n c y " :   " B D T " ,  
                     " a c c o u n t _ i d " :   " a c c _ 7 7 7 " ,  
                     " c r e a t e d _ a t " :   " 2 0 2 6 - 1 0 - 1 7   2 2 : 0 1 : 5 3 "  
                 }  
             ] ,  
             " t r a n s a c t i o n s " :   [ ] ,  
             " c l e a r e d N o n c e K e y s " :   [ ] ,  
             " k e y s " :   [ ]  
         }  
     } ,  
     " l a b e l " :   " d a s h b o a r d   p e r - r e q u e s t   k e y - s c a n   i m p l e m e n t a t i o n   a r t i f a c t ,   n o t   a   d e f e n s e   p r o p e r t y " ,  
     " n o n c e K e y S a m p l e s " :   [  
         {  
             " n o n c e K e y s A t D a s h b o a r d S c a n " :   1 ,  
             " d u r a t i o n _ n s " :   " 1 7 6 4 6 4 0 0 " ,  
             " d u r a t i o n _ m s " :   1 7 . 6 4 6 4 ,  
             " h t t p S t a t u s " :   2 0 0  
         } ,  
         {  
             " n o n c e K e y s A t D a s h b o a r d S c a n " :   1 0 0 ,  
             " d u r a t i o n _ n s " :   " 6 5 7 9 0 0 0 " ,  
             " d u r a t i o n _ m s " :   6 . 5 7 9 ,  
             " h t t p S t a t u s " :   2 0 0  
         } ,  
         {  
             " n o n c e K e y s A t D a s h b o a r d S c a n " :   1 0 0 0 ,  
             " d u r a t i o n _ n s " :   " 2 1 2 2 9 9 0 0 " ,  
             " d u r a t i o n _ m s " :   2 1 . 2 2 9 9 ,  
             " h t t p S t a t u s " :   2 0 0  
         } ,  
         {  
             " n o n c e K e y s A t D a s h b o a r d S c a n " :   5 0 0 0 ,  
             " d u r a t i o n _ n s " :   " 2 3 0 3 4 3 0 0 " ,  
             " d u r a t i o n _ m s " :   2 3 . 0 3 4 3 ,  
             " h t t p S t a t u s " :   2 0 0  
         }  
     ] ,  
     " a l l R e q u e s t s " :   5 0 0 0  
 }  
 
```

### `experiments/results/corrections/vizcurve-server.stderr.log`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/vizcurve-server.stderr.log.copy`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/vizcurve-server.stdout.log`

Bytes: 84. SHA-256: `908141bc87754c6ee425f0d27e42d8d8ff6360d72c54defc8b09537b3c340052`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 127.0.0.1:3000
```

### `experiments/results/corrections/vizcurve-server.stdout.log.copy`

Bytes: 84. SHA-256: `908141bc87754c6ee425f0d27e42d8d8ff6360d72c54defc8b09537b3c340052`.

```text
Viz Socket.io server listening on port 3001
Bank server listening on 127.0.0.1:3000
```

### `experiments/results/corrections/wsl-attack-timings.csv`

Bytes: 284. SHA-256: `72b26f129fbd13a2207e936b71f4041c44e12c775684bcfc339aa702a48b1285`.

```csv
run_id,scenario_id,request_index,started_ns,ended_ns,duration_ns,http_status,outcome
20261017T220829Z-1858,replay,1,1792274909415212342,1792274909608436453,193224111,400,TIMESTAMP_FAIL
20261017T220830Z-1848,tamper,1,1792274910793435525,1792274910821002527,27567002,401,SIGNATURE_FAIL
```

### `experiments/results/corrections/wsl-capture-mode.log`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/wsl-capture-mode.stderr.log`

Bytes: 0. SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

_Empty file (0 bytes)._

### `experiments/results/corrections/wsl-cli-cases.log`

Bytes: 4328. SHA-256: `1f521630242389dacf4c6b0e1d524458d2341ab40719306b44fa39bc1c346c5b`.

```text
��[ E V E ]   U s i n g   a t t a c k e r - s i d e   c a p t u r e d   r e q u e s t :   / m n t / c / U s e r s / H o m e / A p p D a t a / L o c a l / T e m p / c s - p r o j e c t - c 4 - 5 c 1 b 2 8 6 e 0 1 6 c 4 7 e 2 8 1 c 0 e 6 7 9 4 5 b 9 b 3 a c . j s o n  
 [ E V E ]   S t a r t i n g   R e p l a y   A t t a c k   o n   l o c a l h o s t : 3 0 0 0 . . .  
 [ E V E ]   P a y l o a d :   / m n t / c / U s e r s / H o m e / A p p D a t a / L o c a l / T e m p / c s - p r o j e c t - c 4 - 5 c 1 b 2 8 6 e 0 1 6 c 4 7 e 2 8 1 c 0 e 6 7 9 4 5 b 9 b 3 a c . j s o n  
 [ E V E ]   P a y l o a d   a g e :   3 0 7 s  
 [ E V E ]   R e p l a y   a t t e m p t   # 1 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " T I M E S T A M P _ F A I L "  
 }  
 R E P L A Y 2 _ E X I T : 0  
 [ E V E ]   T A M P E R I N G   W I T H   C A P T U R E D   P A C K E T  
 [ E V E ]   S o u r c e   p a y l o a d :   / m n t / c / U s e r s / H o m e / A p p D a t a / L o c a l / T e m p / c s - p r o j e c t - c 4 - 5 c 1 b 2 8 6 e 0 1 6 c 4 7 e 2 8 1 c 0 e 6 7 9 4 5 b 9 b 3 a c . j s o n  
 [ E V E ]   O r i g i n a l   a m o u n t :   1  
 [ E V E ]   M o d i f i e d   a m o u n t :   2  
 [ E V E ]   S i g n a t u r e :   U N C H A N G E D  
 [ E V E ]   S i g n a t u r e :   p r e s e r v e d   w i t h o u t   p r i n t i n g   i t s   v a l u e  
 [ E V E ]   S e n d i n g   m o d i f i e d   p a c k e t . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 T A M P E R _ E X I T : 0  
 U s a g e :  
     b a s h   a t t a c k / a t t a c k . s h  
     b a s h   a t t a c k / a t t a c k . s h   - - c a p t u r e       ( w a i t   f o r   e x p e r i m e n t s / r e c o r d i n g - p r o x y . j s   c a p t u r e )  
     b a s h   a t t a c k / a t t a c k . s h   - - r e p l a y   [ c o u n t ]  
     b a s h   a t t a c k / a t t a c k . s h   - - t a m p e r - a m o u n t   A M O U N T  
 I N V A L I D _ C L I _ E X I T : 1  
 [ E V E ]   A b o r t :   r e p l a y   c o u n t   m u s t   b e   a   p o s i t i v e   i n t e g e r .  
 I N V A L I D _ C O U N T _ E X I T : 1  
 w s l . e x e   :   / m n t / d / C S _ P r o j e c t / a t t a c k / a t t a c k . s h :   l i n e   5 :   d i r n a m e :   c o m m a n d   n o t   f o u n d  
 A t   l i n e : 2   c h a r : 1  
 +   w s l . e x e   - e   b a s h   - l c   ' s e t   + e ;   C A P T U R E _ F I L E = / m n t / c / U s e r s / H o m e / A p p D a t a / L   . . .  
 +   ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  
         +   C a t e g o r y I n f o                     :   N o t S p e c i f i e d :   ( / m n t / d / C S _ P r o j e . . . m m a n d   n o t   f o u n d : S t r i n g )   [ ] ,   R e m o t e E x c e p t i o n  
         +   F u l l y Q u a l i f i e d E r r o r I d   :   N a t i v e C o m m a n d E r r o r  
    
 / m n t / d / C S _ P r o j e c t / a t t a c k / a t t a c k . s h :   l i n e   5 :   c d :   n u l l   d i r e c t o r y  
 M I S S I N G _ J Q _ E X I T : 1  
 [ E V E ]   C o n t i n u o u s   r e p l a y   r o u n d   # 1  
 [ E V E ]   S t a r t i n g   R e p l a y   A t t a c k   o n   l o c a l h o s t : 3 0 0 0 . . .  
 [ E V E ]   P a y l o a d :   / m n t / d / C S _ P r o j e c t / a t t a c k / p a y l o a d . j s o n  
 [ E V E ]   P a y l o a d   a g e :   1 2 6 6 8 0 0 s  
 [ E V E ]   R e p l a y   a t t e m p t   # 1 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 [ E V E ]   R e p l a y   a t t e m p t   # 2 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 [ E V E ]   R e p l a y   a t t e m p t   # 3 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 [ E V E ]   R e p l a y   a t t e m p t   # 4 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 L O O P _ T I M E O U T _ E X I T : 1 2 4  
 
```

### `experiments/results/corrections/wsl-invalid-cases.log`

Bytes: 2702. SHA-256: `f3bc728225a7dc9e81e3a342c5bab19f6e7989696222988c0918f8840c19590c`.

```text
��[ E V E ]   U s i n g   a t t a c k e r - s i d e   c a p t u r e d   r e q u e s t :   / t m p / e v e - c a p t u r e d . j s o n  
 [ E V E ]   A b o r t :   j q   i s   r e q u i r e d   i n   E v e ' s   s h e l l .  
 M I S S I N G _ J Q _ E X I T : 1  
 [ E V E ]   U s i n g   a t t a c k e r - s i d e   c a p t u r e d   r e q u e s t :   / t m p / c s - i n v a l i d - p a y l o a d . j s o n  
 [ E V E ]   A b o r t :   p a y l o a d   f i l e   i s   n o t   v a l i d   J S O N :   / t m p / c s - i n v a l i d - p a y l o a d . j s o n  
 I N V A L I D _ J S O N _ E X I T : 1  
 [ E V E ]   S t a r t i n g   R e p l a y   A t t a c k   o n   l o c a l h o s t : 3 0 0 0 . . .  
 [ E V E ]   P a y l o a d :   / m n t / d / C S _ P r o j e c t / a t t a c k / p a y l o a d . j s o n  
 [ E V E ]   P a y l o a d   a g e :   1 2 6 6 8 1 1 s  
 [ E V E ]   R e p l a y   a t t e m p t   # 1 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 [ E V E ]   R e p l a y   a t t e m p t   # 2 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 [ E V E ]   R e p l a y   a t t e m p t   # 3 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 [ E V E ]   R e p l a y   a t t e m p t   # 4 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 [ E V E ]   R e p l a y   a t t e m p t   # 5 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 [ E V E ]   R e p l a y   a t t e m p t   # 6 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 [ E V E ]   R e p l a y   a t t e m p t   # 7 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 [ E V E ]   R e p l a y   a t t e m p t   # 8 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 [ E V E ]   R e p l a y   a t t e m p t   # 9 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 [ E V E ]   R e p l a y   a t t e m p t   # 1 0 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 D E F A U L T _ A T T A C K _ E X I T : 0  
 
```

### `experiments/results/corrections/wsl-replay.log`

Bytes: 828. SHA-256: `885fe86c7df5eb37ea53f0a65a56bbdbc76868a295e104e8a02990ecaa50eaf0`.

```text
��[ E V E ]   U s i n g   a t t a c k e r - s i d e   c a p t u r e d   r e q u e s t :   / m n t / c / U s e r s / H o m e / A p p D a t a / L o c a l / T e m p / c s - p r o j e c t - c 4 - 5 c 1 b 2 8 6 e 0 1 6 c 4 7 e 2 8 1 c 0 e 6 7 9 4 5 b 9 b 3 a c . j s o n  
 [ E V E ]   S t a r t i n g   R e p l a y   A t t a c k   o n   l o c a l h o s t : 3 0 0 0 . . .  
 [ E V E ]   P a y l o a d :   / m n t / c / U s e r s / H o m e / A p p D a t a / L o c a l / T e m p / c s - p r o j e c t - c 4 - 5 c 1 b 2 8 6 e 0 1 6 c 4 7 e 2 8 1 c 0 e 6 7 9 4 5 b 9 b 3 a c . j s o n  
 [ E V E ]   P a y l o a d   a g e :   2 9 1 s  
 [ E V E ]   R e p l a y   a t t e m p t   # 1 . . .  
 {  
     " s t a t u s " :   " A C C E P T E D " ,  
     " a m o u n t " :   1 ,  
     " n e w B a l a n c e " :   1 4 9 9 9  
 }  
 
```

### `experiments/results/corrections/wsl-timing-verification.log`

Bytes: 1570. SHA-256: `7961fa3b8d4c055f64ba3e65cd45c8adef40d088b8653ffa3c29a4a56076b710`.

```text
��[ E V E ]   U s i n g   a t t a c k e r - s i d e   c a p t u r e d   r e q u e s t :   / m n t / c / U s e r s / H o m e / A p p D a t a / L o c a l / T e m p / c s - p r o j e c t - c 4 - 5 c 1 b 2 8 6 e 0 1 6 c 4 7 e 2 8 1 c 0 e 6 7 9 4 5 b 9 b 3 a c . j s o n  
 [ E V E ]   S t a r t i n g   R e p l a y   A t t a c k   o n   l o c a l h o s t : 3 0 0 0 . . .  
 [ E V E ]   P a y l o a d :   / m n t / c / U s e r s / H o m e / A p p D a t a / L o c a l / T e m p / c s - p r o j e c t - c 4 - 5 c 1 b 2 8 6 e 0 1 6 c 4 7 e 2 8 1 c 0 e 6 7 9 4 5 b 9 b 3 a c . j s o n  
 [ E V E ]   P a y l o a d   a g e :   5 2 8 s  
 [ E V E ]   R e p l a y   a t t e m p t   # 1 . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " T I M E S T A M P _ F A I L "  
 }  
 [ E V E ]   T A M P E R I N G   W I T H   C A P T U R E D   P A C K E T  
 [ E V E ]   S o u r c e   p a y l o a d :   / m n t / c / U s e r s / H o m e / A p p D a t a / L o c a l / T e m p / c s - p r o j e c t - c 4 - 5 c 1 b 2 8 6 e 0 1 6 c 4 7 e 2 8 1 c 0 e 6 7 9 4 5 b 9 b 3 a c . j s o n  
 [ E V E ]   O r i g i n a l   a m o u n t :   1  
 [ E V E ]   M o d i f i e d   a m o u n t :   2  
 [ E V E ]   S i g n a t u r e :   U N C H A N G E D  
 [ E V E ]   S i g n a t u r e :   p r e s e r v e d   w i t h o u t   p r i n t i n g   i t s   v a l u e  
 [ E V E ]   S e n d i n g   m o d i f i e d   p a c k e t . . .  
 {  
     " s t a t u s " :   " R E J E C T E D " ,  
     " r e a s o n " :   " S I G N A T U R E _ F A I L "  
 }  
 
```

### `experiments/results/environment.json`

Bytes: 1529. SHA-256: `3a7b4483f57f212c278b6008cd9a43c171e128367469944a8a123bfcf7514019`.

```json
{
  "capturedAt": "2026-10-17T19:00:15.066Z",
  "host": {
    "os": "win32 10.0.26200",
    "osVersion": "Windows 11 Pro",
    "cpuModel": "Intel(R) Core(TM) i5-8365U CPU @ 1.60GHz",
    "logicalCpuCount": 8,
    "totalRamBytes": 8395841536,
    "totalRamGiB": 7.82
  },
  "runtime": {
    "node": "v24.11.1",
    "sqlite3NodePackage": "5.1.7",
    "sqliteLibrary": "3.44.2"
  },
  "nonceBackend": {
    "product": "Memurai Developer (not stock Redis)",
    "memuraiVersion": "4.2.3",
    "edition": "Memurai Developer",
    "redisProtocolVersion": "7.4.9",
    "bind": "name=tcp,bind=127.0.0.1,port=6379",
    "usedNonceKeys": 10000,
    "usedMemoryBytes": 2519240,
    "usedMemoryHuman": "2.40M"
  },
  "portsReachableFromNativeNode": {
    "3000": true,
    "3001": true,
    "6379": true
  },
  "apiHealth": {
    "status": 200,
    "body": "OK"
  },
  "redisUrl": "redis://127.0.0.1:6379",
  "audit": {
    "commitHash": "4d9eceec78b0474bfad4e8711584268882697561",
    "gitStatusShort": " M attack/payload.json\n M client/bank/src/App.jsx\n M client/bank/src/api.js\n M server/package.json\n M server/server.js\n M server/utils/hmac.js\n M server/utils/idempotency.js\n M server/utils/nonce.js\n?? package.json\n?? server/core.js\n?? server/test/\n?? server/utils/money-oracle.js\n",
    "gitStatusClean": false,
    "gitStatusCaptureNote": "Captured after the Phase 0 artifacts commit and before environment-metadata finalization; Phase 1-3 implementation changes remain uncommitted. Status is reported as observed."
  }
}
```

### `experiments/results/phase3/client-build.log`

Bytes: 778. SHA-256: `e6721975888edf390bb33de45b368b6dc4147afd58a8c9973f66b19d92230bd4`.

```text
�� 
 >   b a n k i n g - r e p l a y - b a n k - c l i e n t @ 1 . 0 . 0   b u i l d  
 >   v i t e   b u i l d  
  
 v i t e   v 5 . 4 . 8   b u i l d i n g   f o r   p r o d u c t i o n . . .  
 t r a n s f o r m i n g . . .  
 '  1 1 1   m o d u l e s   t r a n s f o r m e d .  
 r e n d e r i n g   c h u n k s . . .  
 c o m p u t i n g   g z i p   s i z e . . .  
 d i s t / i n d e x . h t m l                                       0 . 4 2   k B   %  g z i p :     0 . 2 8   k B  
 d i s t / a s s e t s / i n d e x - C k - T o P x A . c s s         2 . 1 0   k B   %  g z i p :     0 . 8 5   k B  
 d i s t / a s s e t s / i n d e x - B s s I y O m 9 . j s       2 2 4 . 5 7   k B   %  g z i p :   7 4 . 0 8   k B  
 '  b u i l t   i n   4 . 2 1 s  
 
```

### `experiments/results/phase3/layer-timings-1212.csv`

Bytes: 46625. SHA-256: `a416b36935c313f3838390d6d768fed970a7fcd9a7e0bf2e1c168bc669a224ab`.

```csv
config_id,scenario_id,run_id,started_ns,ended_ns,duration_ns,hmac_ns,timestamp_ns,nonce_ns,request_id_ns,balance_ns,outcome,http_status
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712705496100,1269712711465600,5969500,256900,97000,320000,469300,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712718829900,1269712720664700,1834800,143800,13700,36000,252100,skipped,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712724403400,1269712726013500,1610100,121700,skipped,skipped,skipped,skipped,SIGNATURE_FAIL,401
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712737667600,1269712738730400,1062800,82000,skipped,skipped,skipped,skipped,SIGNATURE_FAIL,401
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712741837400,1269712742991600,1154200,90500,14500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712745301000,1269712745849300,548300,skipped,skipped,skipped,skipped,skipped,ACCOUNT_OWNERSHIP_FAIL,403
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712748696500,1269712749475200,778700,skipped,skipped,skipped,skipped,skipped,ACCOUNT_NOT_FOUND,404
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712756557500,1269712761689000,5131500,108100,28900,40600,323100,2400,INSUFFICIENT_BALANCE,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712764617300,1269712771023000,6405700,84200,15100,40500,261100,15300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712784512500,1269712789082100,4569600,87100,18800,49700,298600,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712793646200,1269712795568600,1922400,123000,19700,48400,508300,skipped,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712814657600,1269712819049700,4392100,154800,20800,54800,336700,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712821257100,1269712825429400,4172300,93200,37300,51800,272800,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712827908000,1269712832462800,4554800,84000,21900,59300,272600,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712834428100,1269712838954200,4526100,76800,46600,66300,326400,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712840879100,1269712845184800,4305700,50000,8200,39600,372600,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712847233000,1269712851289900,4056900,49200,8200,61500,236700,2900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712853102100,1269712857158400,4056300,50500,7900,41800,232300,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712859128800,1269712863336000,4207200,49400,7800,46000,245000,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712866097400,1269712870556100,4458700,56900,8800,231900,261200,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712872783600,1269712876986800,4203200,51900,10800,54300,244200,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712878954200,1269712883182700,4228500,49600,7400,35800,249100,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712885264100,1269712889275600,4011500,59400,9000,36400,279700,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712891135400,1269712896124600,4989200,109600,18400,79800,462400,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712898210300,1269712902602200,4391900,67100,8500,35900,254000,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712904264100,1269712908129400,3865300,76900,7200,30300,235900,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712910635500,1269712915032700,4397200,107900,10700,38800,374200,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712916880900,1269712921247700,4366800,55000,8300,37100,242800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712923001100,1269712926951300,3950200,50600,7000,32700,239400,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712928752800,1269712932495900,3743100,48200,15800,35700,196900,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712934242900,1269712938306100,4063200,59800,10500,47400,357500,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712939953700,1269712943979400,4025700,53800,8100,38100,232100,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712945592800,1269712949392900,3800100,41400,6300,34000,257600,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712951270500,1269712958184700,6914200,82000,8300,35700,209300,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712960347100,1269712967290300,6943200,48600,7700,37700,210500,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712969713200,1269712973432600,3719400,65500,7400,49300,229600,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712975094300,1269712978794000,3699700,45100,6700,33700,218700,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712980395900,1269712984140000,3744100,52600,7400,35300,221300,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712986285600,1269712990377600,4092000,80000,7900,47100,228000,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712992254400,1269712996423100,4168700,51300,8200,38800,271200,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269712998218700,1269713002587000,4368300,61400,7600,38500,232300,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713004249800,1269713008491500,4241700,44300,6800,38400,214200,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713010091400,1269713014470900,4379500,38900,6800,37100,234400,300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713022012700,1269713029648100,7635400,111300,17800,92000,531500,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713035572600,1269713043816700,8244100,124100,19400,125200,602600,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713047552200,1269713054606700,7054500,92900,13900,73400,474100,1500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713057519500,1269713062654300,5134800,71500,19500,60900,327600,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713065282000,1269713070441800,5159800,85300,10400,54200,321300,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713072677400,1269713077296100,4618700,69900,11000,55200,299300,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713079286000,1269713083481400,4195400,61300,8600,64000,273000,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713085656600,1269713089580600,3924000,53500,41900,44000,229100,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713091520500,1269713095302700,3782200,60000,7600,44300,203200,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713097450900,1269713101316800,3865900,78500,7200,41200,203800,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713103226200,1269713107573700,4347500,51700,7200,67000,230600,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713109290500,1269713113379100,4088600,79500,8700,59700,280100,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713115415100,1269713119576300,4161200,60800,25700,49900,253400,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713121578000,1269713125580900,4002900,49700,7100,44500,243000,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713127426400,1269713132031500,4605100,50100,6900,45300,232000,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713138190900,1269713146985900,8795000,116100,19100,99900,1058700,1900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713149913400,1269713155825900,5912500,112200,14500,84800,423100,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713158950100,1269713163875600,4925500,64500,13100,60400,294000,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713166022800,1269713170854200,4831400,90300,9900,57600,300300,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713173112000,1269713177005800,3893800,51800,7400,61500,222800,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713178854400,1269713182796700,3942300,62300,6900,49900,207000,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713184540600,1269713188594100,4053500,48300,7600,49300,239400,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713190334700,1269713194044100,3709400,65600,6700,46900,229300,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713195715000,1269713199154300,3439300,41800,6900,47100,230100,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713200818600,1269713205306000,4487400,56900,9400,55400,326200,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713207043900,1269713210927900,3884000,47500,8000,47000,271000,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713212624100,1269713216364100,3740000,43700,6300,46900,190500,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713218272500,1269713222002900,3730400,52600,7900,53700,225800,300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713223891800,1269713228186100,4294300,52800,7800,62700,276700,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713230253700,1269713234736900,4483200,91800,7500,53700,269700,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713237632900,1269713241750100,4117200,51000,7700,99400,279400,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713244187500,1269713248021600,3834100,57400,14500,57800,229000,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713250045400,1269713253866600,3821200,70200,12000,70100,298900,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713255814000,1269713259637600,3823600,55600,8200,48000,244200,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713261852200,1269713265636800,3784600,54600,8200,67000,241000,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713267850800,1269713272711500,4860700,74100,11400,65500,407600,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713274868800,1269713279595900,4727100,89100,9900,59400,314400,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713282306400,1269713287650600,5344200,68800,9900,75700,308000,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713290070500,1269713294980500,4910000,68500,14600,67100,346000,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713297757200,1269713303502800,5745600,151500,14400,84900,542300,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713305398400,1269713309906500,4508100,55500,9000,56800,281100,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713312224600,1269713317279000,5054400,79800,10700,67300,407800,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713319362800,1269713324347800,4985000,57900,13800,65600,331000,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713326593200,1269713331878000,5284800,61600,10500,61400,356000,2800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713334126800,1269713338786200,4659400,74800,12200,69900,364800,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713341055600,1269713346205800,5150200,116600,9300,60700,349400,2100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713348455600,1269713363992300,15536700,63500,9300,68000,11008400,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713366681900,1269713371467700,4785800,70900,9500,39600,347200,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713373783900,1269713379189800,5405900,65800,9200,47000,356400,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713381468500,1269713389023300,7554800,59600,8200,34800,329200,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713391228200,1269713399042600,7814400,73800,9500,38700,293300,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713401467300,1269713406999900,5532600,81700,11200,47300,413500,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713410765000,1269713416443400,5678400,123800,15900,60700,480600,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713419329500,1269713425244800,5915300,81300,11600,52400,405300,1700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713428174000,1269713433611300,5437300,97800,12500,55800,403400,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713437057700,1269713442727800,5670100,86300,13000,66100,467900,1400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713445961600,1269713451863100,5901500,78500,11600,48400,414700,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713454648500,1269713460164800,5516300,89800,10200,43200,423100,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713462766800,1269713469092300,6325500,71300,10000,47100,391200,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713473574600,1269713480112600,6538000,113300,27000,51900,481700,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713485170500,1269713493152000,7981500,129100,17500,70700,584500,2600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713497366200,1269713507080200,9714000,119200,32400,101500,815400,3800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713511890900,1269713530067300,18176400,341500,34000,153200,4104400,3700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713536688100,1269713547507300,10819200,191100,18300,93500,807500,2500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713554072100,1269713564170600,10098500,125500,35100,119000,777400,2200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713568546500,1269713575687000,7140500,145100,17200,98900,818000,1900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713579058500,1269713588284200,9225700,173100,16600,106600,943700,1600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713591809200,1269713598648400,6839200,111300,17900,95300,669800,1700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713602344500,1269713609158300,6813800,107500,44300,81100,521300,2400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713612792000,1269713619481600,6689600,124000,32300,97400,552000,2100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713622982700,1269713628867500,5884800,107500,13100,60100,494400,1400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713632480100,1269713640045600,7565500,82400,11800,101600,1051900,2400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713645118300,1269713655863100,10744800,251800,31900,91000,1238800,2300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713660715700,1269713668434500,7718800,251300,17400,109300,629100,1900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713672717500,1269713682300900,9583400,162700,16600,93600,616700,3700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713688955000,1269713699559000,10604000,201100,178600,118500,822600,2300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713709296500,1269713719309500,10013000,108400,14300,64600,1050400,5600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713724256500,1269713731204200,6947700,114100,16800,110600,683800,1500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713734774500,1269713751258800,16484300,169700,26100,134900,887900,2500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713755942900,1269713765728700,9785800,231700,15400,93800,684000,1900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713770029700,1269713777424400,7394700,140300,17500,103600,635100,1400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713781286500,1269713789639300,8352800,155900,21700,95300,620400,1800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713792845800,1269713798844200,5998400,111200,11800,71000,434900,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713803197900,1269713810102000,6904100,126900,15500,113600,633800,1500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713813398800,1269713828515200,15116400,269100,19900,134300,908800,2900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713832468900,1269713842608300,10139400,159700,18700,128100,820400,1600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713846261700,1269713859804000,13542300,192400,78200,153700,1076800,3300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713864307700,1269713874709900,10402200,119000,17900,139800,809400,2600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713881470900,1269713883648700,2177800,121000,17300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713889618600,1269713891491200,1872600,122800,32300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713895549000,1269713897967000,2418000,152700,38100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713901552900,1269713902987700,1434800,103800,11900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713906685200,1269713908142200,1457000,96100,12800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713912510000,1269713915242700,2732700,128600,16100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713918868900,1269713920543300,1674400,114600,30000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713923323000,1269713925068600,1745600,123800,16300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713928119700,1269713929206800,1087100,105800,8800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713931216300,1269713932490200,1273900,157300,11400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713935085300,1269713936480200,1394900,60900,9700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713938386500,1269713939347000,960500,53600,7400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713941875400,1269713942830100,954700,70500,7500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713944860100,1269713945955600,1095500,57500,9000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713948184400,1269713949337700,1153300,68800,11400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713951617400,1269713952628200,1010800,54300,9900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713955069600,1269713956438600,1369000,90500,25400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713959302100,1269713960407900,1105800,75100,8600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713962338500,1269713963605600,1267100,91700,9700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713966348100,1269713967748500,1400400,113800,16100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713970573700,1269713971446600,872900,49700,6900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713974337100,1269713976106500,1769400,96500,14900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713979371300,1269713980701100,1329800,174100,14400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713983735200,1269713985788200,2053000,129200,19600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713988396100,1269713990038200,1642100,95600,15300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713992336500,1269713993362400,1025900,60900,8200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713995928300,1269713997515800,1587500,59400,8900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269713999496300,1269714000916400,1420100,94400,18400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714003544700,1269714004638800,1094100,54700,7900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714008232200,1269714009781000,1548800,89900,14300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714013126900,1269714014947000,1820100,116500,17900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714018290400,1269714020513100,2222700,139600,19900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714023268700,1269714024784600,1515900,100700,13100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714027986400,1269714029403900,1417500,108400,13800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714032398500,1269714033690400,1291900,90700,8500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714036787700,1269714038221100,1433400,121200,15800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714041127500,1269714051344700,10217200,180300,22700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714053711900,1269714056766800,3054900,112000,12100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714059365800,1269714073255500,13889700,93000,14000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714076067400,1269714077869800,1802400,114200,12500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714081035900,1269714082658500,1622600,123100,25800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714085581600,1269714087168800,1587200,93000,11500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714089915300,1269714091318400,1403100,108300,12800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714094615600,1269714095918100,1302500,71200,11800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714099013500,1269714100916100,1902600,242400,17100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714103907700,1269714105508700,1601000,74100,18300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714108467700,1269714110253300,1785600,87800,15200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714114719000,1269714117615400,2896400,135900,40300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714122498500,1269714124317900,1819400,86800,18400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714127368100,1269714128756700,1388600,85400,13300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714131436500,1269714132627300,1190800,75800,9800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714136414700,1269714138490400,2075700,118500,19100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714143450000,1269714145501600,2051600,117700,15700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714149227600,1269714151097100,1869500,140800,16000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714155081600,1269714156066500,984900,51700,8500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714158263200,1269714159280900,1017700,49300,8600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714161626600,1269714163023700,1397100,65000,10900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714165098600,1269714166125000,1026400,53600,20300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714168484800,1269714169839900,1355100,106600,15200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714172873300,1269714173914000,1040700,50200,9600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714185738400,1269714186040500,302100,skipped,skipped,skipped,skipped,skipped,INVALID_REQUEST,400
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714188186800,1269714188784800,598000,skipped,skipped,skipped,skipped,skipped,ACCOUNT_NOT_FOUND,404
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714309787400,1269714336033600,26246200,1402200,364200,1933700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714309081200,1269714337191000,28109800,1355600,362400,3152800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714310376000,1269714338311000,27935000,1328100,360600,4449500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714310888800,1269714339011000,28122200,1304200,366200,5340000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714311390000,1269714339602900,28212900,1286700,360000,5956500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714307498500,1269714340142600,32644100,1268900,367700,6503600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714312038600,1269714340983500,28944900,1251700,375900,7056100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714312506100,1269714342222200,29716100,1186400,383100,8124200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714313927400,1269714343682400,29755000,1163500,391400,9380600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714314381800,1269714344896000,30514200,1143000,400300,10865100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714314843600,1269714345595700,30752100,1128600,407900,11844400,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714315301100,1269714346052900,30751800,1114800,415300,12381900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714315765000,1269714346433800,30668800,1043600,422500,12781200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714316270900,1269714346826400,30555500,1008400,431900,13145700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714316651200,1269714347226600,30575400,936500,439700,13515200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714313461000,1269714347643000,34182000,903500,447500,13900600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714317884400,1269714348343900,30459500,887100,481300,14319900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714312986700,1269714349562100,36575400,869200,513500,15460000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714320021400,1269714351284500,31263100,854800,524000,16676200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714320490100,1269714352368700,31878600,840500,531600,18266000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714319529700,1269714353220200,33690500,829800,540200,19124000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714318936200,1269714353890000,34953800,816800,547800,19948900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714321419300,1269714354490100,33070800,804200,557000,20492500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714321696400,1269714355068700,33372300,790100,686300,20925700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714322010500,1269714355670800,33660300,779100,793300,21397400,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714322290600,1269714356405500,34114900,766300,920000,22009100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714322564600,1269714357257600,34693000,753900,944200,22705200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714320849600,1269714357963700,37114100,741000,958700,23499900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714322853100,1269714358646500,35793400,708300,969200,24234100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714323148800,1269714359252600,36103800,692600,980800,24811300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714323699200,1269714359936600,36237400,653800,997400,25431000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714323991500,1269714360546600,36555100,637500,1018400,26059400,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714324283800,1269714361186900,36903100,621600,1029500,26682300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714324556300,1269714361786100,37229800,605900,1041400,27297500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714321146600,1269714362313000,41166400,593000,1053300,27811600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714325134400,1269714363036100,37901700,578800,1066700,28385300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714325411900,1269714363763500,38351600,564500,1080900,29123600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714325682800,1269714364521400,38838600,549700,1097100,29859000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714308402400,1269714365437300,57034900,535400,1109400,30631700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714325978100,1269714366145900,40167800,521200,1121700,31442000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714323429600,1269714366737700,43308100,508500,1138600,32099700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714324828500,1269714367700500,42872000,494600,1155000,32794600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714327075500,1269714368786800,41711300,480000,1184800,33706700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714327349600,1269714369973900,42624300,465100,1213800,34910300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714327618600,1269714371579900,43961300,451200,1264100,36020500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714327923900,1269714372538600,44614700,437700,1321400,37405000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714326248100,1269714373391400,47143300,424900,1373400,38270100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714326793700,1269714374265800,47472100,411100,1429500,39066600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714326521800,1269714374983500,48461700,398500,1475100,39912300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714223094600,1269714408541300,185446700,157200,9200,36200,72877900,7700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714450917100,1269714490542400,39625300,1006100,214700,815200,7869600,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714451813200,1269714493300200,41487000,842300,271700,1285800,7601800,4300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714452662800,1269714495664800,43002000,817000,282900,1394900,7661900,5000,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714450285500,1269714497726200,47440700,798400,297100,1493000,7573500,2600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714454770500,1269714500095700,45325200,767600,318800,1673300,7380000,2500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714455271200,1269714503123500,47852300,752100,329300,1757600,7444200,9800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714449765900,1269714506569400,56803500,904000,245900,1086200,8282300,4600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714452246500,1269714508860400,56613900,671200,351600,1964600,7286800,4700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714456603700,1269714511253600,54649900,655900,361100,2067300,7199700,11200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714451377800,1269714513364500,61986700,862300,258700,1193400,8259500,4300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714458382200,1269714515023000,56640800,626000,379600,2359000,6942400,4200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714453084200,1269714516575800,63491600,597600,389300,2476600,6836500,3600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714454213900,1269714518415700,64201800,782000,307900,1587500,7878900,3500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714459067900,1269714520042300,60974400,532300,419500,2641500,6688100,3600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714457691800,1269714522022900,64331100,641000,370100,2187600,7236100,3000,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714459995000,1269714523777500,63782500,489200,457500,2802100,6526400,3700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714460358400,1269714525353000,64994600,471900,469200,2890100,6469700,4400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714460669700,1269714526912600,66242900,452600,479300,2984100,6387500,3600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714461003000,1269714528571900,67568900,411100,494700,3083900,6290700,3700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714459672800,1269714530234000,70561200,506900,432100,2726300,6753400,3300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714461595300,1269714532007800,70412500,337200,516600,3261500,6127200,3400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714455774700,1269714533649800,77875100,700500,341600,1843400,7835300,3900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714462207700,1269714535595800,73388100,307500,540200,3429400,5980900,6500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714458688500,1269714538129400,79440900,578200,406200,2558800,7087200,3300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714462795300,1269714540052200,77256900,295700,548100,3601200,5826500,2700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714463100900,1269714541703700,78602800,281600,560000,3737000,5687900,2600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714459371100,1269714543277400,83906300,310700,528800,3345900,6180400,2800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714463391300,1269714544874200,81482900,250800,585100,4058900,5365700,2400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714461904000,1269714546506000,84602000,235000,596200,4167300,5257700,2300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714458053900,1269714548145900,90092000,364200,65800,329400,4140200,2700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714463982700,1269714549696600,85713900,301100,95300,463200,3980200,2400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714453529700,1269714551720000,98190300,357300,505700,3173800,6472100,3500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714464297900,1269714554687900,90390000,263900,109400,662000,3800800,3600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714461299600,1269714557031800,95732200,266100,572600,3887600,5668200,3400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714464590700,1269714558801300,94210600,235600,124700,857500,3633800,3800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714466248900,1269714560547900,94299000,226300,132600,947600,3559900,3400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714462506300,1269714562174300,99668000,305300,540400,3516600,6186400,4400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714466846200,1269714563816200,96970000,204000,155200,1186600,3357100,3500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714465546200,1269714565449300,99903100,250300,117200,755100,3868400,3800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714467209200,1269714567247600,100038400,180100,172500,1396300,3191900,3000,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714464894800,1269714570161800,105267000,282100,102000,564600,4143400,3400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714468656900,1269714571977700,103320800,161300,188500,1710800,2902800,3500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714465198100,1269714573613500,108415400,151800,196500,1835600,2790300,3000,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714466548600,1269714575216500,108667900,217800,140000,1049700,3671700,3500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714468241600,1269714576910800,108669200,133900,212700,2017000,2631800,3200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714463682900,1269714578742200,115059300,190800,164400,1278500,3457400,3400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714469160000,1269714580358200,111198200,79700,239500,2218000,2441000,3000,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714465929600,1269714581973900,116044300,142700,204700,1926800,2851600,5300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714470334500,1269714583917900,113583400,116600,231200,2122600,2708000,8600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714467648800,1269714586279600,118630800,170600,180500,1548000,3396400,2900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714595246500,1269714596155100,908600,skipped,skipped,skipped,skipped,skipped,SESSION_INVALID,401
phase3-default-defenses,integration-suite,windows-node-test-1212,1269714597957900,1269714598628500,670600,skipped,skipped,skipped,skipped,skipped,AUTHENTICATION_REQUIRED,401
```

### `experiments/results/phase3/layer-timings-32508.csv`

Bytes: 46674. SHA-256: `6c9a38715bf46921ec40048feb66707492e34aa7fab7ea13061c0f1adfd754b3`.

```csv
config_id,scenario_id,run_id,started_ns,ended_ns,duration_ns,hmac_ns,timestamp_ns,nonce_ns,request_id_ns,balance_ns,outcome,http_status
phase3-default-defenses,integration-suite,windows-node-test-32508,1269223804565400,1269223815065600,10500200,669900,181000,670200,874100,1700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269223827600700,1269223831832800,4232100,350000,41300,77900,795800,skipped,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269223838137500,1269223840821600,2684100,212500,skipped,skipped,skipped,skipped,SIGNATURE_FAIL,401
phase3-default-defenses,integration-suite,windows-node-test-32508,1269223860999400,1269223863799000,2799600,197100,skipped,skipped,skipped,skipped,SIGNATURE_FAIL,401
phase3-default-defenses,integration-suite,windows-node-test-32508,1269223869957800,1269223872565200,2607400,216900,33600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269223876705200,1269223877714700,1009500,skipped,skipped,skipped,skipped,skipped,ACCOUNT_OWNERSHIP_FAIL,403
phase3-default-defenses,integration-suite,windows-node-test-32508,1269223881875200,1269223883095600,1220400,skipped,skipped,skipped,skipped,skipped,ACCOUNT_NOT_FOUND,404
phase3-default-defenses,integration-suite,windows-node-test-32508,1269223897522600,1269223904706200,7183600,150100,33900,74300,873000,2700,INSUFFICIENT_BALANCE,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269223908748700,1269223916489900,7741200,222300,35800,82600,672300,3400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269223931676500,1269223939270700,7594200,164200,33800,78800,733600,3100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269223949505700,1269223953189700,3684000,248400,34300,67300,853700,skipped,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269223982597300,1269223989191700,6594400,203500,31900,76400,607400,4800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269223993307600,1269224001347500,8039900,119900,73700,85900,757200,2300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224005109400,1269224015563200,10453800,155200,45200,122000,601600,4800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224019578600,1269224026159000,6580400,167000,82700,95700,636000,2500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224030296500,1269224036796400,6499900,121700,14100,70600,682500,1700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224040746300,1269224049226100,8479800,154800,21100,66300,1186000,7500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224053544600,1269224061355200,7810600,127700,14700,62500,608000,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224065865400,1269224073503500,7638100,133400,19900,85400,745600,2100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224079268300,1269224087958300,8690000,167900,20500,117900,747400,1600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224092203400,1269224103102700,10899300,141700,17800,70700,611500,2000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224108160500,1269224118086100,9925600,159700,18400,72800,738600,1700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224121788200,1269224128059600,6271400,118000,12700,64200,461300,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224131890400,1269224137081300,5190900,88100,12600,56100,331200,3400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224140806700,1269224147554900,6748200,119700,16300,68000,612800,1700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224150462800,1269224156124700,5661900,138700,13900,58500,504000,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224158864700,1269224164415900,5551200,97200,14200,64800,481600,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224167795900,1269224173960100,6164200,100600,12700,55300,448300,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224177416600,1269224183528300,6111700,101800,16600,62700,418200,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224187591100,1269224194284700,6693600,123300,17900,98700,640700,1500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224198079700,1269224202771700,4692000,87200,12600,56600,430900,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224205198900,1269224209465200,4266300,64000,10500,63400,293000,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224212122700,1269224216551900,4429200,61800,8700,42300,365400,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224219429600,1269224224800100,5370500,120300,36500,69800,493700,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224228969600,1269224234533300,5563700,98100,14400,60700,515500,1400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224237205200,1269224243261000,6055800,141200,16200,75200,506000,2000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224247062700,1269224252661100,5598400,102500,18100,72200,504700,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224255226600,1269224260113500,4886900,73400,10400,71000,412100,1400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224262704100,1269224268100500,5396400,196900,16600,68900,443800,6900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224270079000,1269224274450300,4371300,58700,8900,41300,351900,2200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224276571100,1269224280499800,3928700,63800,10400,53800,276200,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224282494900,1269224285877100,3382200,48600,6700,38200,214600,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224287916300,1269224291136100,3219800,44400,6400,38400,182800,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224292807400,1269224296176500,3369100,49400,7000,37300,178700,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224297909300,1269224301585600,3676300,62000,8000,50100,220600,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224303850400,1269224307327300,3476900,46900,7500,40600,205000,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224309045000,1269224312383200,3338200,54700,6900,39000,182900,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224314205800,1269224318100100,3894300,54600,7300,40400,199000,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224320870500,1269224328972500,8102000,101100,18800,64800,360900,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224331364500,1269224335506300,4141800,44600,7500,46400,211200,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224337461700,1269224341359000,3897300,82800,7900,43000,208000,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224343718100,1269224347091300,3373200,49200,6800,50700,186900,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224349074500,1269224352666800,3592300,50500,9400,65600,221700,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224354386500,1269224358032300,3645800,51600,8400,62700,276800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224359703200,1269224363303700,3600500,47500,6900,63600,200900,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224365691100,1269224370259200,4568100,70800,10200,79800,368500,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224372213000,1269224375776200,3563200,56500,7800,64000,232600,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224377828800,1269224381943200,4114400,67900,9400,60400,274000,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224384123000,1269224387534000,3411000,49300,7400,50600,219800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224389170400,1269224392505000,3334600,61500,7000,50200,208300,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224394381200,1269224398518100,4136900,74400,10600,75500,293400,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224400786800,1269224407476100,6689300,102700,12100,91500,332500,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224409341300,1269224415879400,6538100,66700,7200,50900,214600,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224418259400,1269224422333200,4073800,59300,6700,55200,251300,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224424451900,1269224429460100,5008200,55600,12400,78600,333500,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224433513500,1269224438331500,4818000,144600,12600,88000,409700,3400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224441164000,1269224445667600,4503600,81100,9000,88800,271300,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224448909900,1269224454838200,5928300,104000,26500,141700,468500,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224457284800,1269224461777300,4492500,78200,18100,82300,350100,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224464667500,1269224468544100,3876600,57300,9000,70900,307000,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224470771100,1269224474635300,3864200,53900,19100,64800,270700,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224477266200,1269224481434200,4168000,94900,11900,86400,399500,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224484137500,1269224489307800,5170300,78600,14200,111700,385100,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224491330800,1269224495891500,4560700,71500,8500,113500,261100,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224498037100,1269224501503000,3465900,47100,7200,53100,226400,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224503255700,1269224506780300,3524600,62200,7900,81300,222000,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224508455900,1269224516809900,8354000,106900,12300,88600,425800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224518765000,1269224522276000,3511000,55800,6900,68700,219000,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224524023300,1269224527929000,3905700,80600,15700,70300,305900,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224530059200,1269224533549100,3489900,50700,15100,59800,274700,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224535416700,1269224538816700,3400000,44300,11900,54200,208900,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224540989900,1269224544520500,3530600,79100,14400,65100,209700,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224546243300,1269224549869900,3626600,107300,15700,61100,292200,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224551482700,1269224555068400,3585700,40700,13300,58300,203700,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224557428500,1269224561207400,3778900,58100,9500,90800,240900,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224563519100,1269224567271900,3752800,56900,8400,78600,228800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224577115700,1269224582861300,5745600,53300,8100,44900,262500,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224584724100,1269224588454100,3730000,42400,5800,43700,203900,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224590032500,1269224593602300,3569800,55700,6600,29300,250500,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224595526300,1269224599403400,3877100,64600,9000,38600,309300,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224601372500,1269224605422400,4049900,54000,8200,47700,252300,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224607357400,1269224610923200,3565800,66600,6000,36600,207800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224613100100,1269224616822700,3722600,49900,17000,29300,228000,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224619449100,1269224623660500,4211400,52400,6900,32500,306800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224625303900,1269224629182900,3879000,48600,7200,30200,257200,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224630990400,1269224634450500,3460100,47000,7200,30000,212900,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224635988700,1269224639970600,3981900,51300,8100,32900,245400,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224641584400,1269224645258500,3674100,43700,6900,44100,204800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224647142700,1269224650973800,3831100,42600,6800,30300,230800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224652646300,1269224656095100,3448800,42400,6900,32900,235400,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224657619500,1269224661399000,3779500,55900,6300,42800,221000,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224663439700,1269224667859300,4419600,56300,8000,35900,267400,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224669440800,1269224673203200,3762400,50400,6200,28400,238000,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224674743000,1269224678237900,3494900,49200,5900,31300,193300,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224680147600,1269224683693100,3545500,53200,7000,36500,233400,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224685268600,1269224688889500,3620900,42200,6800,32400,231400,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224690673000,1269224694622400,3949400,51200,5600,34700,207200,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224696886700,1269224701109500,4222800,48900,7400,34000,256100,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224702882700,1269224706929900,4047200,74500,6700,36100,277100,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224708575700,1269224712668800,4093100,49500,7600,36100,268700,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224714334400,1269224718289200,3954800,65000,8000,34100,208700,1800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224720018500,1269224724303500,4285000,45100,7200,37500,276300,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224726976600,1269224731973500,4996900,46500,11200,36800,350700,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224733572200,1269224737193000,3620800,62300,6100,32900,204400,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224738911600,1269224743565300,4653700,43400,11200,50000,216400,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224745725100,1269224750309000,4583900,73000,6900,37600,219300,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224752131900,1269224756530800,4398900,86100,7000,41000,251600,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224758383100,1269224762636200,4253100,68100,6900,38800,227200,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224764747300,1269224769254000,4506700,56200,7300,57500,310400,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224771573700,1269224776391500,4817800,68200,8500,54700,279700,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224778357400,1269224782661800,4304400,52600,8200,46800,241700,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224784545100,1269224789054500,4509400,43200,7600,43700,256200,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224791126100,1269224795670200,4544100,98500,8000,46900,334100,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224797819500,1269224802822300,5002800,51500,7600,44800,246800,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224804925900,1269224809785900,4860000,57200,8300,57500,244100,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224811995500,1269224816911400,4915900,56300,28300,48600,298200,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224818912300,1269224823743800,4831500,62300,7600,65400,253400,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224825756700,1269224830830800,5074100,105400,8500,73000,331400,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224832677400,1269224837565500,4888100,51000,7800,65800,299100,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224839862100,1269224844571800,4709700,53100,7900,67800,293500,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224846708100,1269224851327900,4619800,47200,8500,68000,307800,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224853433800,1269224854428000,994200,51300,8600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224856314600,1269224857356900,1042300,48500,23100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224859143200,1269224860178200,1035000,62900,8400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224862250800,1269224863408400,1157600,60200,9000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224865372100,1269224866434100,1062000,67900,8500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224868672600,1269224869574400,901800,65600,8700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224871393700,1269224872365900,972200,53600,10400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224874261300,1269224875168600,907300,47600,8400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224877293300,1269224878457900,1164600,78300,12100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224881178800,1269224882442200,1263400,134100,20900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224885431800,1269224887213100,1781300,103000,44100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224898464000,1269224899679000,1215000,47600,6400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224901143300,1269224901844000,700700,36300,5900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224903309900,1269224904143100,833200,41100,6300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224905654300,1269224906438400,784100,36400,6100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224907927900,1269224908711700,783800,46100,5300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224910087100,1269224910878600,791500,39100,6100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224912558900,1269224913268400,709500,36700,5300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224915320000,1269224916287400,967400,54900,7800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224917850100,1269224918534200,684100,43700,5200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224919972600,1269224920699100,726500,47800,6000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224922240200,1269224923030400,790200,43500,8800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224924622000,1269224925481900,859900,44500,6800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224927068200,1269224927991900,923700,46400,6900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224930391900,1269224931193700,801800,43800,6400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224932658400,1269224933499900,841500,48500,6100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224935108200,1269224936176800,1068600,46000,6900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224937851200,1269224938586500,735300,37200,5200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224940066400,1269224940881300,814900,46200,5600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224942666500,1269224943412100,745600,37600,6000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224944920500,1269224946011600,1091100,44800,6700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224947407500,1269224948165200,757700,45100,5700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224949813800,1269224950541600,727800,37000,5400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224951888900,1269224952638800,749900,34800,5900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224954111500,1269224954985100,873600,53900,6600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224956469900,1269224957276100,806200,46600,6600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224958652700,1269224959389300,736600,35000,6200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224960754100,1269224961965100,1211000,88200,11500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224963821100,1269224964579900,758800,41800,5600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224966175900,1269224966982400,806500,56600,6800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224968392500,1269224969114700,722200,36000,5600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224970427900,1269224971141700,713800,35600,5500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224972446900,1269224973168000,721100,39400,6100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224974730300,1269224975497000,766700,36300,6200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224977136700,1269224978308600,1171900,75600,11500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224979944100,1269224980749300,805200,37300,6700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224982227500,1269224982954100,726600,32900,6600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224984491800,1269224985309000,817200,36200,6200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224986779900,1269224987534700,754800,44400,13300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224988956900,1269224989701500,744600,47000,6200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224991142400,1269224991862800,720400,32300,6600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224993583900,1269224994346000,762100,36400,5600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224996095900,1269224996911500,815600,43500,22800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269224998253800,1269224998936800,683000,32200,6000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225000228600,1269225000916400,687800,35200,6100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225002443900,1269225003206700,762800,49900,6300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225004644300,1269225005438600,794300,35700,6100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225006987400,1269225007682600,695200,31600,5400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225009284600,1269225010066100,781500,34800,6300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225011557000,1269225012290200,733200,37300,6100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225023545300,1269225023731500,186200,skipped,skipped,skipped,skipped,skipped,INVALID_REQUEST,400
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225026288600,1269225027114500,825900,skipped,skipped,skipped,skipped,skipped,ACCOUNT_NOT_FOUND,404
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225082372700,1269225100468400,18095700,516000,121000,449600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225083594600,1269225100939000,17344400,495900,132700,962700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225082757200,1269225101332600,18575400,466200,137400,1334900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225083947800,1269225101970700,18022900,458100,142300,1859300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225084276500,1269225102371900,18095400,450900,146900,2355500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225084984300,1269225102759200,17774900,444700,150600,2781100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225085312100,1269225103067200,17755100,437500,154900,3087300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225084638500,1269225103343300,18704800,430200,159700,3393200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225085637800,1269225103644700,18006900,420600,165800,3684200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225081921700,1269225103942600,22020900,409500,177700,3959400,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225086177800,1269225104257000,18079200,402000,182400,4261200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225087133600,1269225104594100,17460500,394900,186800,4562200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225087827000,1269225104885800,17058800,388300,190800,4888600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225088166200,1269225105178900,17012700,381600,194600,5170300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225088402200,1269225105587100,17184900,374500,199000,5522800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225088628300,1269225105923500,17295200,368000,202700,5882800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225088877900,1269225106231000,17353100,361200,207400,6179900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225089117000,1269225106559800,17442800,354500,211600,6468400,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225089355200,1269225107023500,17668300,348000,215700,6887900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225089585300,1269225107435800,17850500,341100,219500,7356200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225089823500,1269225107839000,18015500,335000,223500,7727500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225090063800,1269225108139700,18075900,328400,227500,8065600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225090284800,1269225108494000,18209200,321200,231500,8370100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225090536100,1269225108798400,18262300,314600,235900,8703900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225090763200,1269225109115400,18352200,307800,241000,9008400,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225083161900,1269225109419500,26257600,301300,250200,9306500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225086745400,1269225109711100,22965700,294300,255700,9598600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225091495200,1269225109994800,18499600,287600,259400,9881100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225087494700,1269225110281300,22786600,288000,255300,10157000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225092078400,1269225110608000,18529600,277600,259500,10464800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225092335400,1269225110899800,18564400,269300,263700,10759900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225092562600,1269225111204400,18641800,262700,268500,11038600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225092803100,1269225111623300,18820200,256100,272600,11392500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225093058500,1269225111925200,18866700,249500,276600,11771300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225093294000,1269225112204900,18910900,242700,281000,12049900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225093513800,1269225112483900,18970100,235300,285800,12315800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225093724800,1269225112745700,19020900,228600,290900,12586400,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225093955600,1269225113107600,19152000,221700,295900,12898500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225094171200,1269225113414900,19243700,214500,303600,13221100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225094380700,1269225113691100,19310400,208700,308100,13497300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225094713900,1269225113975600,19261700,202100,312200,13775800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225095024800,1269225114250700,19225900,195100,316000,14043100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225095388600,1269225114562500,19173900,189000,319400,14317300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225095696700,1269225114896500,19199800,182500,323000,14663000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225096039600,1269225115207800,19168200,176300,326800,14983500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225096472300,1269225115593800,19121500,169500,331500,15329600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225090992300,1269225115999500,25007200,161900,336100,15717500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225091793400,1269225116368800,24575400,138200,340000,16073300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225091261100,1269225116840700,25579600,129400,344400,16523500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225061868600,1269225134832700,72964100,43100,7100,23800,31577800,3100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225157116500,1269225187103700,29987200,509500,86900,348000,5702300,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225158894700,1269225193165400,34270700,428900,113800,763700,5455700,2100,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225158175300,1269225199350600,41175300,464500,100300,495000,5905700,7500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225159389000,1269225202900500,43511500,411600,123300,922400,5488800,2300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225159619900,1269225206828400,47208500,404200,127800,1000800,5435900,1800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225158406100,1269225210714800,52308700,454600,105500,597800,5883000,2200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225158649800,1269225214591500,55941700,446800,109900,677000,5810000,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225159867000,1269225217408300,57541300,397000,132400,1081400,5403100,1800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225160710900,1269225219801200,59090300,370100,149300,1311800,5161300,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225160955900,1269225222563800,61607900,363000,154300,1392200,5084900,1900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225161182300,1269225224994400,63812100,342100,159400,1487300,4993200,4800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225161490800,1269225227156400,65665600,334700,164100,1586400,4909100,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225161742900,1269225230241000,68498100,323200,168300,1668600,4830800,1800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225162089200,1269225232377700,70288500,264100,172200,1771100,4746600,2100,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225162375300,1269225234090900,71715600,255600,174100,1851200,4669100,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225162662300,1269225235723900,73061600,249100,178800,1951800,4572300,1800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225157453500,1269225238622800,81169300,220800,181500,2033400,4495500,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225163408900,1269225240198800,76789900,199400,185900,2097500,4434300,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225163769700,1269225241780100,78010400,190900,189800,2178500,4356100,1900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225164107200,1269225243738100,79630900,180500,195400,2259500,4277700,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225160147400,1269225245684100,85536700,386500,140400,1157300,5482400,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225157690200,1269225247394100,89703900,152800,219400,2415000,4115800,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225165081100,1269225249200500,84119400,146600,224100,2498400,4034400,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225165556000,1269225251773600,86217600,139700,229100,2574300,3961800,1800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225166083000,1269225254265200,88182200,133100,237700,2689300,3846600,1400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225166709100,1269225256291000,89581900,126500,242300,2819100,3727900,2300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225167069400,1269225257898100,90828700,110500,247200,2881500,3671200,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225167348000,1269225259790300,92442300,103000,253600,2941200,3615200,2700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225167618900,1269225261434600,93815700,96700,257700,3025500,3539900,2100,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225160442700,1269225263557600,103114900,377600,145400,1235200,5512300,1900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225168165500,1269225265083000,96917500,167800,71200,306800,2761300,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225168425900,1269225266619300,98193400,159400,76300,397200,2673000,1400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225159131600,1269225268241200,109109600,419300,119100,840600,5975700,1900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225157933000,1269225269924500,111991500,145400,88800,591100,2483000,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225169913200,1269225271647000,101733800,138300,93900,714300,2362000,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225167891000,1269225273786000,105895000,192700,55600,221100,2920500,1900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225171052800,1269225276186600,105133800,124800,104600,971500,2110900,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225171444600,1269225279588100,108143500,118600,110400,1059100,2032700,1900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225171738900,1269225281663900,109925000,112100,123300,1128500,1958800,2000,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225171969400,1269225283243900,111274500,105500,131000,1188800,1899200,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225172193900,1269225285352300,113158400,101100,134800,1266100,1823700,1400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225172480300,1269225287244300,114764000,97700,136300,1341200,1751000,2100,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225168779100,1269225289571100,120792000,152100,82300,471600,2711100,1400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225173090500,1269225291298500,118208000,89700,156000,1474300,1616100,3900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225169264100,1269225293881000,124616900,83000,162500,1541800,1554600,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225164598200,1269225296525100,131926900,70800,168500,1644800,1454300,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225170407800,1269225298196100,127788300,63500,174300,1722500,1378900,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225164334000,1269225299800100,135466100,159300,211800,2338900,4521200,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225163008700,1269225301385300,138376600,131300,99200,865600,2379500,2400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225172830300,1269225303091800,130261500,92300,148900,1413000,1772300,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225312789800,1269225313866800,1077000,skipped,skipped,skipped,skipped,skipped,SESSION_INVALID,401
phase3-default-defenses,integration-suite,windows-node-test-32508,1269225315798500,1269225316388300,589800,skipped,skipped,skipped,skipped,skipped,AUTHENTICATION_REQUIRED,401
```

### `experiments/results/phase3/layer-timings-33040.csv`

Bytes: 70886. SHA-256: `5e06aa645a818a0d91ad5b6a1738ec456912740b1960a6252d2f3a268d76d574`.

```csv
config_id,scenario_id,run_id,started_ns,ended_ns,duration_ns,hmac_ns,timestamp_ns,nonce_ns,request_id_ns,balance_ns,outcome,http_status
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745153326700,1269745162435700,9109000,504600,186700,500900,948500,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745173333600,1269745176425100,3091500,242200,26000,61100,552900,skipped,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745182042200,1269745184348300,2306100,208900,skipped,skipped,skipped,skipped,SIGNATURE_FAIL,401
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745201611500,1269745203447600,1836100,162300,skipped,skipped,skipped,skipped,SIGNATURE_FAIL,401
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745208027700,1269745209927300,1899600,177000,22000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745214080800,1269745214949000,868200,skipped,skipped,skipped,skipped,skipped,ACCOUNT_OWNERSHIP_FAIL,403
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745218595200,1269745219495600,900400,skipped,skipped,skipped,skipped,skipped,ACCOUNT_NOT_FOUND,404
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745230000500,1269745235502900,5502400,126400,46600,61400,430700,1800,INSUFFICIENT_BALANCE,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745239478200,1269745245551300,6073100,98100,21300,59400,364000,1500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745258008700,1269745264390300,6381600,148800,23200,57500,459700,2100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745270745800,1269745273889300,3143500,173900,25900,63400,737900,skipped,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745295161100,1269745301350600,6189500,169700,44500,92100,515100,1700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745305212400,1269745312129000,6916600,117800,67600,137500,666700,1900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745316298600,1269745322825600,6527000,168900,46000,141100,612600,2000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745326856100,1269745333207400,6351300,142200,46200,87700,549000,2000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745337528000,1269745343946700,6418700,133600,18800,79800,645000,1800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745347049400,1269745353273200,6223800,99500,13400,62300,426300,3800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745356769700,1269745363654700,6885000,129400,21300,73600,573500,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745367349700,1269745372636500,5286800,78700,22300,44800,631700,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745375627400,1269745381073100,5445700,99200,10600,82700,421500,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745383643400,1269745388307200,4663800,65900,9700,63400,343300,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745391695100,1269745397233500,5538400,125900,10400,49300,424700,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745400430700,1269745406278600,5847900,96100,9300,37400,359500,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745409913900,1269745415463900,5550000,84000,11800,71300,413100,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745418846300,1269745423937200,5090900,119800,15100,54600,375900,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745426746700,1269745431532900,4786200,67300,8100,38200,324500,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745434715200,1269745439754000,5038800,70200,9500,40500,432800,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745443351000,1269745449607200,6256200,166900,22300,105200,651600,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745451964700,1269745456206900,4242200,87700,10400,65300,233500,300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745458931900,1269745463320100,4388200,73000,8700,68700,267900,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745465554300,1269745469189700,3635400,53800,8300,38900,249700,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745471308200,1269745475667600,4359400,92800,11500,46000,293700,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745477995500,1269745481882900,3887400,56600,19100,43400,333200,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745484068400,1269745488070800,4002400,86200,9300,42000,260600,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745490599900,1269745495752100,5152200,77800,9800,49800,460500,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745498892000,1269745503874800,4982800,91200,10200,51600,498700,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745507213900,1269745511758800,4544900,71300,11200,54400,300400,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745514263100,1269745518889300,4626200,78000,10300,55500,335300,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745521504200,1269745526390100,4885900,81900,8900,67900,296600,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745529009200,1269745533417600,4408400,82800,8900,49200,286900,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745536105300,1269745540758900,4653600,77200,11300,56500,379900,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745543486800,1269745547417900,3931100,67900,9500,45100,274300,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745549447600,1269745553667800,4220200,83700,11100,45800,288000,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745556403300,1269745561672100,5268800,136600,16700,92700,556000,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745564061500,1269745568289200,4227700,65400,8000,45600,287100,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745571105000,1269745576176300,5071300,74200,10400,58500,351500,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745578851900,1269745582702100,3850200,52200,7300,47900,283500,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745585409700,1269745589684500,4274800,82400,13900,66300,340800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745593768100,1269745598329600,4561500,106900,12400,76100,358600,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745600750000,1269745604953000,4203000,55500,11600,61000,259800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745607333200,1269745611368400,4035200,67300,10000,59400,310800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745614785400,1269745618391300,3605900,67700,8200,73700,241800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745620728600,1269745627970400,7241800,89200,12500,58100,329400,300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745629766600,1269745633537100,3770500,57300,24800,49100,315400,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745635386700,1269745639226600,3839900,48300,7000,47300,246200,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745641577800,1269745645526500,3948700,74600,8200,46400,257700,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745647810400,1269745651547500,3737100,90700,7600,49600,262800,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745654155300,1269745658204300,4049000,72000,7700,49400,253500,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745660514400,1269745664754000,4239600,80700,11600,72800,378300,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745666855200,1269745671434300,4579100,58200,8600,52400,282700,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745674285500,1269745678289400,4003900,71700,26200,49900,261900,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745680575700,1269745685405000,4829300,124700,12900,78700,437900,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745687582500,1269745691874800,4292300,78200,8900,55200,292600,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745693920800,1269745697774500,3853700,72000,9100,52400,241500,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745699798500,1269745704136500,4338000,62200,24900,53400,316900,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745707029100,1269745711148900,4119800,57200,7700,70900,227100,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745713242000,1269745717503400,4261400,50800,7600,63300,224400,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745719706900,1269745724028500,4321600,57900,14000,96700,282800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745726679600,1269745730247700,3568100,50600,8100,85600,217700,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745732826000,1269745737059300,4233300,60800,24700,82700,305700,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745739180900,1269745743526800,4345900,166000,17500,179900,349900,300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745745933700,1269745751335000,5401300,81200,9200,78400,362100,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745755080600,1269745761371600,6291000,247800,16900,216400,593200,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745765745300,1269745772495300,6750000,101400,13600,188000,508800,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745776211300,1269745781510500,5299200,83300,14100,139100,454900,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745785020200,1269745789687000,4666800,67600,9500,130600,373300,300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745793542700,1269745814338800,20796100,97400,14500,121300,3288500,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745816816200,1269745821698200,4882000,71700,10200,146900,362900,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745824867500,1269745829921000,5053500,81600,12300,112600,369300,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745832516700,1269745837436900,4920200,66600,26300,110000,324900,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745840558900,1269745845835800,5276900,73000,12000,106600,350500,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745848815600,1269745854198700,5383100,94400,12200,117500,394900,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745857552400,1269745867024100,9471700,197500,15600,335000,1444900,2200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745870292500,1269745876487100,6194600,133200,15600,215300,487300,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745879848700,1269745891624600,11775900,104600,14300,138700,485700,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745895085600,1269745900501700,5416100,91700,12900,135800,403000,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745912139300,1269745918598300,6459000,55700,8100,33800,297900,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745920832800,1269745925024300,4191500,51100,7200,30300,257400,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745926911900,1269745930831000,3919100,69900,7700,32100,325800,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745932961100,1269745936721000,3759900,68200,7500,31100,241900,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745939352000,1269745943288700,3936700,83800,10500,36600,270600,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745945315100,1269745949053800,3738700,55900,8200,34400,256600,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745951054000,1269745955000400,3946400,76700,7600,32400,295300,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745956862900,1269745960859300,3996400,65700,10800,39200,286200,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745962739700,1269745966459100,3719400,52000,7500,50800,212500,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745968280000,1269745972224500,3944500,52600,8100,33500,245200,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745974274500,1269745978645800,4371300,71900,11500,62900,363900,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745980382500,1269745984068700,3686200,47800,6800,32700,222500,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745985983500,1269745989702000,3718500,69700,8000,61600,241500,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745991915100,1269745995487100,3572000,53100,7500,33500,226600,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269745997241900,1269746000774200,3532300,47300,7200,51900,201100,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746003116600,1269746006952400,3835800,77100,6600,35000,240200,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746008545100,1269746012470900,3925800,46400,6600,43500,195500,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746015096700,1269746028443800,13347100,72000,11400,89100,407100,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746030654800,1269746034570700,3915900,54700,8400,39000,275500,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746036543300,1269746040714300,4171000,55700,7400,32000,267200,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746042795300,1269746047011800,4216500,52600,7300,31000,349200,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746049171600,1269746055817600,6646000,66100,7300,33100,227400,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746058382100,1269746066418800,8036700,127000,13500,65300,398700,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746069261100,1269746074151100,4890000,78200,22400,74300,384500,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746076247800,1269746081139000,4891200,59800,10900,36500,328000,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746083558600,1269746087816600,4258000,81800,8200,44000,287100,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746091353400,1269746095988500,4635100,73300,9600,42200,311000,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746098014900,1269746101732200,3717300,99600,7500,40800,252600,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746103535300,1269746107363500,3828200,90700,8000,36000,231300,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746109312500,1269746113234100,3921600,48200,6500,36200,223200,300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746115487800,1269746119207800,3720000,93500,9400,37500,249300,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746121284300,1269746125484400,4200100,50000,28600,44200,237900,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746127483100,1269746131248200,3765100,80600,9800,51500,312400,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746133234800,1269746137181100,3946300,66200,6800,35200,230700,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746138941100,1269746142902000,3960900,53100,7600,38800,337500,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746144826600,1269746148507100,3680500,47300,7400,64700,243100,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746150660100,1269746154577700,3917600,114400,27800,45600,300900,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746156365800,1269746160824300,4458500,71500,11500,54100,307600,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746162467800,1269746166208000,3740200,52900,7400,40600,258800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746168281000,1269746171943100,3662100,48800,7400,37700,228700,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746173864600,1269746177986000,4121400,79100,8100,66200,305700,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746180021400,1269746184450600,4429200,130200,10100,50700,404400,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746186338800,1269746190330900,3992100,64800,7300,44700,244500,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746192952400,1269746197519500,4567100,56800,8200,45700,277100,1500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746199433600,1269746203971900,4538300,77700,9300,58100,401100,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746206213900,1269746207600700,1386800,63900,9400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746209536000,1269746210627900,1091900,54700,8300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746212439900,1269746213644400,1204500,74600,8500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746215673800,1269746216736000,1062200,67500,8200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746218782200,1269746219984800,1202600,74500,9300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746222021500,1269746222987100,965600,82100,15800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746225342800,1269746226552200,1209400,58400,9000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746228451600,1269746229420400,968800,53900,16100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746231483800,1269746232817600,1333800,62400,8800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746234673600,1269746236030300,1356700,133100,26600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746238293300,1269746239394400,1101100,57900,8900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746241416200,1269746242400000,983800,66600,8100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746244209600,1269746245266300,1056700,54800,8900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746247190900,1269746248204800,1013900,52600,8300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746250236000,1269746251160900,924900,62600,7500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746253513700,1269746254851900,1338200,83700,9300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746256887600,1269746258333600,1446000,70900,10500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746260779800,1269746262030100,1250300,90100,11400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746264878000,1269746266515500,1637500,109100,12500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746268671100,1269746269938800,1267700,57400,8300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746271809000,1269746272853300,1044300,65900,8400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746276163600,1269746277643900,1480300,105300,11900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746280219800,1269746281331800,1112000,88500,9700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746283534000,1269746285147500,1613500,71600,10100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746287893500,1269746289211200,1317700,70300,10800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746292617100,1269746293793200,1176100,102100,11500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746296132100,1269746298121400,1989300,87300,22900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746300470600,1269746301950100,1479500,90200,8900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746304830400,1269746306150300,1319900,68700,10000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746308607100,1269746309509400,902300,49600,7500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746312092500,1269746313482200,1389700,94000,10600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746316240400,1269746317943300,1702900,78100,11500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746320923800,1269746322526600,1602800,90400,12700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746325835100,1269746327230400,1395300,75300,12200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746329364000,1269746330671100,1307100,75000,9200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746333240000,1269746334336300,1096300,53900,8500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746336486900,1269746337973200,1486300,84900,12200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746340542800,1269746342019800,1477000,81000,14100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746344188300,1269746345378600,1190300,60500,9300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746349164300,1269746350820500,1656200,83400,11900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746353345700,1269746354644200,1298500,64000,8000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746357654700,1269746359249900,1595200,103700,12300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746361644900,1269746362682000,1037100,64800,9400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746365774700,1269746366977900,1203200,61800,10400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746370283000,1269746372069100,1786100,102400,14400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746374679500,1269746376257100,1577600,122700,17600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746378899100,1269746380005400,1106300,69900,12000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746382240500,1269746383810800,1570300,92400,13200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746386129900,1269746387215800,1085900,68500,10400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746389519700,1269746390713500,1193800,59100,10600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746392760800,1269746393717300,956500,71400,8900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746395745400,1269746397140500,1395100,66300,11400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746399415100,1269746400410900,995800,72200,8800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746402351800,1269746403620900,1269100,75900,17000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746405833500,1269746407233500,1400000,71300,14300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746409983400,1269746410931200,947800,46900,8800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746413295500,1269746414332700,1037200,60700,8100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746416722200,1269746417853800,1131600,65900,11600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746420479100,1269746421660600,1181500,74500,9800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746424044200,1269746425857200,1813000,107500,13600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746440623400,1269746441818500,1195100,91700,10600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746444044900,1269746444971400,926500,61600,8000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746447609000,1269746448725400,1116400,52800,9900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746451413400,1269746452943100,1529700,84000,10400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746456030200,1269746457468800,1438600,71400,11600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746459849900,1269746461190100,1340200,64300,12200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746464485000,1269746466198000,1713000,95400,17200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746468518100,1269746469361500,843400,73100,7200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746471168500,1269746472102700,934200,60800,8100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746473846900,1269746474802900,956000,45500,9100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746476859200,1269746477809500,950300,65500,8600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746479400000,1269746480369400,969400,54700,13400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746482115900,1269746483070900,955000,59400,8600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746485001300,1269746485914400,913100,45900,9100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746487738200,1269746488632400,894200,43900,8700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746490589900,1269746491569200,979300,58700,8700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746493365900,1269746494217900,852000,46200,7700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746495854100,1269746496643500,789400,41900,8100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746498278300,1269746499102000,823700,45700,8700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746500789700,1269746501648100,858400,44500,7600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746503612400,1269746504553500,941100,47300,7500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746506602500,1269746507603900,1001400,57200,10600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746509458600,1269746510390700,932100,45600,7700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746512057000,1269746512872000,815000,40800,7200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746514540500,1269746515394600,854100,51400,19400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746517126100,1269746517974100,848000,44100,7300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746519680700,1269746520547900,867200,47900,7800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746522744400,1269746523860500,1116100,52200,8800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746525679400,1269746526546500,867100,58600,8400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746528234300,1269746529122200,887900,45500,8600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746531042600,1269746538376600,7334000,44100,7800,28900,251400,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746540314100,1269746544629600,4315500,53300,10300,54800,328700,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746546321500,1269746550021300,3699800,43400,7800,27700,222800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746551814300,1269746555715900,3901600,59300,7800,73100,243900,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746557631600,1269746561200400,3568800,41000,6300,31600,232600,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746562953500,1269746566625300,3671800,54500,7800,30700,212600,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746568374100,1269746572433300,4059200,42300,7200,28800,235100,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746574398200,1269746578097900,3699700,78600,9000,37000,234700,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746579711300,1269746583383100,3671800,42900,7400,86600,266100,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746585266800,1269746589420300,4153500,49600,28400,31400,291500,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746591268500,1269746595138700,3870200,44500,8300,46700,245800,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746596840900,1269746600677700,3836800,45600,8100,31800,249400,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746602604700,1269746606667300,4062600,47000,8700,33500,277700,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746608549300,1269746612593100,4043800,55700,9900,50700,361200,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746614444800,1269746618108300,3663500,60400,12300,33400,230700,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746619739100,1269746623563800,3824700,39200,7200,34100,216800,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746625900600,1269746630158700,4258100,49500,8800,45400,342200,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746632044200,1269746636095700,4051500,46400,15400,34500,306000,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746638975900,1269746643170000,4194100,62400,10500,45900,277100,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746644904900,1269746648812900,3908000,44600,8000,31800,247700,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746650978100,1269746654677600,3699500,44400,7600,33600,218400,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746657821400,1269746661793800,3972400,43500,7700,35500,285200,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746664097500,1269746667963500,3866000,70600,9000,36800,320000,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746669984400,1269746673886600,3902200,42900,7000,52000,244400,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746676406800,1269746680293800,3887000,53700,9000,35900,258500,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746684475300,1269746690736600,6261300,104800,13000,67100,510600,1900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746693908200,1269746700024700,6116500,93400,17800,65600,606700,1700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746703367700,1269746709449600,6081900,94700,12500,60500,443000,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746727255900,1269746738794700,11538800,94100,14300,55400,559900,1700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746741911700,1269746748003900,6092200,83200,11300,60900,414800,1500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746750635700,1269746752364800,1729100,108500,14600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746755112900,1269746756924500,1811600,102600,15900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746759743300,1269746761487900,1744600,103400,15700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746764415600,1269746766372000,1956400,115400,14800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746769687200,1269746771268100,1580900,86100,15300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746774037700,1269746776046100,2008400,156100,39400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746778927100,1269746780281400,1354300,63800,9700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746782717600,1269746784394700,1677100,76100,13500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746787445400,1269746789029200,1583800,79600,12400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746791460700,1269746792829700,1369000,70600,13900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746795513400,1269746796922100,1408700,74400,16000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746799781800,1269746801524200,1742400,111200,17800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746804267600,1269746805874900,1607300,92200,11200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746809485800,1269746810790400,1304600,70900,12600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746813470000,1269746814832300,1362300,68700,11500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746817308900,1269746818754500,1445600,74700,11100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746821068700,1269746822541100,1472400,62500,11600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746824739900,1269746826354400,1614500,89700,11600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746828632500,1269746829982000,1349500,75400,24600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746832565200,1269746833976800,1411600,65800,11500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746836604800,1269746838385100,1780300,114400,17500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746841160400,1269746842483200,1322800,67800,12500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746844684900,1269746845926200,1241300,64700,10500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746848233000,1269746849842300,1609300,99200,19700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746852591900,1269746854306100,1714200,79300,32300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746857280200,1269746858991200,1711000,118300,15000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746862061100,1269746863724100,1663000,92100,14600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746866871000,1269746868395100,1524100,88100,13500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746872097500,1269746873862800,1765300,102400,16200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746877184700,1269746878754900,1570200,86500,18200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746881210800,1269746882204300,993500,45500,8500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746885147700,1269746886957700,1810000,93200,16600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746889416700,1269746890815300,1398600,73900,15200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746893070000,1269746894451100,1381100,70100,11000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746897159900,1269746898497500,1337600,55900,10100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746900451000,1269746901601100,1150100,49000,8600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746904133500,1269746905308200,1174700,63500,9800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746907769200,1269746909264100,1494900,82000,14300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746911485300,1269746912702800,1217500,61700,10300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746914911700,1269746916052000,1140300,101600,10300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746918694900,1269746919664000,969100,58800,8500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746921503600,1269746922633500,1129900,51900,9700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746924408600,1269746925395300,986700,49100,8200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746927604000,1269746928804300,1200300,65000,11200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746931086800,1269746932142500,1055700,55700,9000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746934430600,1269746935463700,1033100,50500,8600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746938102300,1269746939319900,1217600,70600,13200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746942131800,1269746943173800,1042000,50400,9500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746944817500,1269746945695500,878000,44000,8500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746947301200,1269746948483500,1182300,62600,10600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746950387300,1269746951218600,831300,55000,8400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746952792900,1269746953594600,801700,40300,7800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746955496800,1269746956771200,1274400,88400,13700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746959286100,1269746960211400,925300,45300,7600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746962294900,1269746963579800,1284900,57900,28200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746966451400,1269746967641300,1189900,90500,8400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746970028800,1269746971318800,1290000,59600,10100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746973742800,1269746974967700,1224900,91500,10200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746977631100,1269746979020800,1389700,77700,12500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746981647300,1269746982850300,1203000,100300,9800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746985474300,1269746986855600,1381300,61600,9900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746989547300,1269746990821200,1273900,71200,10600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746992826200,1269746993807700,981500,48500,23200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269746996096000,1269746997626700,1530700,104400,13900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747000107700,1269747001322900,1215200,74900,11900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747003913000,1269747004827000,914000,43900,7000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747006628900,1269747008050500,1421600,93200,16000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747010656500,1269747012022200,1365700,80400,10500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747014761600,1269747016302100,1540500,93800,20700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747018673500,1269747019707700,1034200,48900,9500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747021852700,1269747023013300,1160600,50600,8700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747024922700,1269747025867800,945100,45200,7900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747027683600,1269747029030600,1347000,80500,10900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747031035100,1269747032099300,1064200,67300,9600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747034032000,1269747035142800,1110800,72200,8600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747037075900,1269747038224800,1148900,58500,12700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747040744800,1269747042281500,1536700,91400,12800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747044837100,1269747046093800,1256700,63000,12200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747047912600,1269747048922200,1009600,58500,22900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747051412600,1269747052847400,1434800,56800,10700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747054766900,1269747055672700,905800,65200,7800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747058038800,1269747059447600,1408800,65300,24100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747062006300,1269747062992000,985700,47600,8000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747064830900,1269747065680200,849300,40300,7400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747068321000,1269747069810900,1489900,122500,11900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747072464900,1269747074082000,1617100,91500,12200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747077327000,1269747078810800,1483800,98600,12800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747081988600,1269747083685800,1697200,117200,14300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747086523000,1269747088068700,1545700,117300,18200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747091287800,1269747092776600,1488800,76400,12900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747107523900,1269747108126500,602600,skipped,skipped,skipped,skipped,skipped,INVALID_REQUEST,400
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747111336500,1269747112267200,930700,skipped,skipped,skipped,skipped,skipped,ACCOUNT_NOT_FOUND,404
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747196844300,1269747241821800,44977500,1433300,291100,1017800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747197823700,1269747242540300,44716600,1365900,333100,1905800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747200053400,1269747243138700,43085300,1342100,344300,2573700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747198636500,1269747243776600,45140100,1320900,355200,3178500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747201559500,1269747244451300,42891800,1303100,366400,3819700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747202327900,1269747245027100,42699200,1284800,375400,4426600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747200724500,1269747245637300,44912800,1268100,380300,4999000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747202906500,1269747246331000,43424500,1246000,383200,5716800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747199350300,1269747246833600,47483300,1217300,387300,6214900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747203442900,1269747247339400,43896500,1198800,390100,6693500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747203960700,1269747247776100,43815400,1180700,393500,7173300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747204452600,1269747248247000,43794400,1161400,398700,7620100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747205046400,1269747249042000,43995600,1142200,403000,8182500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747205738400,1269747249792300,44053900,1122800,407500,8999700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747206654600,1269747250404000,43749400,1105200,412200,9664300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747207708400,1269747250984900,43276500,1086400,417900,10203300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747209728900,1269747251762700,42033800,1067700,427600,10925600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747210548800,1269747252432200,41883400,1048900,438700,11651600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747211045200,1269747253076400,42031200,1033700,439600,12266100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747211404200,1269747253965900,42561700,1013300,478000,12981600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747211922200,1269747254893600,42971400,985600,486000,13856900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747212963800,1269747255861700,42897900,956200,492100,14785200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747213514000,1269747256798500,43284500,939200,498600,15770100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747212495500,1269747257403500,44908000,913800,504300,16492200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747213972300,1269747258073400,44101100,889000,509900,17101200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747214549200,1269747258722500,44173300,866100,514100,17782700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747215341100,1269747259364200,44023100,845600,518800,18395700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747216205700,1269747259922900,43717200,829200,525300,18987000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747217122100,1269747260444900,43322800,808200,530000,19548300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747218030100,1269747260902900,42872800,789000,535100,20023600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747218794900,1269747261350300,42555400,769500,541200,20467600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747219416500,1269747261980700,42564200,739000,546600,20998400,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747220127500,1269747262574200,42446700,715600,551500,21618100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747220701900,1269747263208800,42506900,696900,557800,22184500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747221314000,1269747264050000,42736000,673900,563100,22885700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747221999300,1269747264932400,42933100,653500,569900,23782100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747223237600,1269747265618400,42380800,627400,578900,24543100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747224397700,1269747266276800,41879100,600500,586500,25193800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747224938200,1269747266855600,41917400,581200,597700,25811700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747222566000,1269747267453600,44887600,556400,610100,26369000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747225457100,1269747268055700,42598600,531500,619800,26962300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747223830100,1269747269263300,45433200,485800,629400,28039300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747225953200,1269747270028800,44075600,460500,638900,28870500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747226468400,1269747270711600,44243200,438500,646700,29518000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747227058900,1269747271384800,44325900,376300,655600,30198300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747227616100,1269747272112400,44496300,354200,664700,30878600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747228173200,1269747273251200,45078000,334500,674400,31675900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747228647900,1269747274133900,45486000,321300,684600,32778000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747229157200,1269747275016200,45859000,309900,694800,33631600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747158054600,1269747277017300,118962700,87400,11800,53000,435400,2300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747369886100,1269747421923900,52037800,1410200,1100800,935800,11547400,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747371538700,1269747425406900,53868200,1299300,1137500,2248400,10605000,9300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747376186500,1269747428032600,51846100,1254100,1150700,2715000,10317300,6500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747374234000,1269747430699100,56465100,1319800,1128600,1758700,11340500,3500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747377865900,1269747433503000,55637100,1211000,1158500,3021000,10050700,2500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747378281500,1269747435947200,57665700,1191000,1163300,3126800,9951900,2200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747376825600,1269747438535200,61709600,1173000,1166000,3230500,9854100,2300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747377416700,1269747441772100,64355400,1231200,1154800,2899400,10244000,2500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747379093400,1269747444644800,65551400,1129000,1175000,3532300,9572300,2600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747379522900,1269747447758300,68235400,1108600,1179300,3794200,9318700,2700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747370790100,1269747450529900,79739800,1348100,1117400,1267200,11991000,2800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747373238800,1269747453385200,80146400,1072800,1188100,4423000,8702300,2600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747378701100,1269747456359300,77658200,1150100,1170300,3340800,9842400,2100,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747372261700,1269747458886000,86624300,1022600,1197200,4830600,8303700,2700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747375186000,1269747461174600,85988600,1279100,1142500,2515200,10778400,2800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747381284100,1269747463531200,82247100,980600,1215000,5193100,7969300,2700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747379900600,1269747466202100,86301500,1091100,1183200,4190100,9045700,1900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747382115200,1269747468907000,86791800,959800,1213700,5578400,7606400,2600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747380321800,1269747472071000,91749200,1053400,1192700,4640800,8628300,3900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747383008200,1269747475032700,92024500,922700,1238000,5941900,7249200,2400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747380730600,1269747478129700,97399100,1004800,1210400,5006300,8272700,2600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747383872100,1269747481233800,97361700,946300,1201300,6313700,6873500,2100,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747381683300,1269747484481800,102798500,968900,1214000,5390900,7895300,3100,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747384699400,1269747487715200,103015800,925700,1201100,6727200,6466000,2200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747382528800,1269747490488500,107959700,942700,1226600,5757600,7527400,2700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747385544000,1269747493529200,107985200,890400,1218800,7104600,6089300,2100,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747383497800,1269747497498100,114000300,910900,1238900,6127600,7159600,2000,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747386538900,1269747500295000,113756100,858000,1234300,7516600,5678200,2200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747384287600,1269747503747500,119459900,939500,1198800,6531900,6750100,2200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747387308100,1269747506602800,119294700,1486900,546700,7919200,5283500,2200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747387749000,1269747509748500,121999500,1480100,551000,8117700,5086400,2300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747388160500,1269747512545400,124384900,1465200,555700,8342800,4864600,2100,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747386088400,1269747515011500,128923100,874000,1228800,7309500,5975800,2100,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747389021300,1269747518576900,129555600,1440300,558900,8726300,4485200,2200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747386934900,1269747521756800,134821900,829000,1238900,7722400,5582200,2700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747390474600,1269747524330200,133855600,1414700,572200,9098500,4126100,2700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747385116100,1269747527164500,142048400,908600,1206500,6915400,6477900,2300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747391659300,1269747529865200,138205900,1374500,606300,9458800,3753500,2500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747388598000,1269747533624500,145026500,1447400,563800,8540500,4770600,2300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747392863600,1269747536365300,143501700,1335600,639600,9812900,3386500,2600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747389749100,1269747539111000,149361900,1432600,559900,8911100,4410000,4200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747394711300,1269747543641400,148930100,1294400,677400,10187200,3011400,2200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747394110400,1269747546840900,152730500,1245900,696000,10368300,2823600,2400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747391043200,1269747551400900,160357700,1396100,588800,9273500,4062700,1900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747396076700,1269747555154800,159078100,1174600,713900,10725700,2468600,2100,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747396661100,1269747561123600,164462500,1150700,735100,10910900,2273600,2100,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747393458200,1269747565587600,172129400,1315200,658900,9974800,3321000,2600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747395370300,1269747568534500,173164200,1218500,704700,10545000,2728900,3000,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747392269100,1269747571819600,179550500,1354800,621600,9634300,3810000,3800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747397269400,1269747575096400,177827000,1130000,749100,11101100,2211700,5300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747597162000,1269747599041000,1879000,skipped,skipped,skipped,skipped,skipped,SESSION_INVALID,401
phase3-default-defenses,integration-suite,windows-node-test-33040,1269747602211400,1269747603356100,1144700,skipped,skipped,skipped,skipped,skipped,AUTHENTICATION_REQUIRED,401
```

### `experiments/results/phase3/layer-timings-9412.csv`

Bytes: 46402. SHA-256: `bd27b57160ba85bd80583d4d1a51630d856bc4e9d14508663e7bc83b2374b9a9`.

```csv
config_id,scenario_id,run_id,started_ns,ended_ns,duration_ns,hmac_ns,timestamp_ns,nonce_ns,request_id_ns,balance_ns,outcome,http_status
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239428827400,1269239438937500,10110100,366800,171900,529900,791700,1600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239450577000,1269239454294400,3717400,277700,63900,97200,816400,skipped,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239459666500,1269239461593900,1927400,158500,skipped,skipped,skipped,skipped,SIGNATURE_FAIL,401
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239478416200,1269239480530300,2114100,123600,skipped,skipped,skipped,skipped,SIGNATURE_FAIL,401
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239483949300,1269239485177800,1228500,100400,14600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239488821900,1269239490008600,1186700,skipped,skipped,skipped,skipped,skipped,ACCOUNT_OWNERSHIP_FAIL,403
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239493774100,1269239494471400,697300,skipped,skipped,skipped,skipped,skipped,ACCOUNT_NOT_FOUND,404
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239504333500,1269239509425800,5092300,117000,23200,53900,314100,1400,INSUFFICIENT_BALANCE,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239512831000,1269239519152900,6321900,211400,44600,121400,512700,6600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239531124500,1269239536052500,4928000,138900,22300,55700,307500,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239539760900,1269239541529800,1768900,82400,18700,39000,367600,skipped,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239554892000,1269239559099100,4207100,79300,27400,35700,229800,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239560837900,1269239565283000,4445100,111800,57900,112900,345000,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239567603300,1269239571885600,4282300,81000,34900,74700,348600,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239574367200,1269239579245900,4878700,109300,24200,108900,368200,1800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239581610500,1269239585942100,4331600,49500,6700,37800,256700,2100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239588548800,1269239592969800,4421000,63800,7500,34200,281300,3000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239595181600,1269239599144500,3962900,61800,22600,31100,216300,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239601882500,1269239606197700,4315200,93200,13700,36300,305000,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239608470700,1269239612613100,4142400,57500,10900,268100,260400,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239616902700,1269239625029100,8126400,107100,12700,50000,477300,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239627522000,1269239633807000,6285000,158900,17300,72600,799400,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239636526100,1269239641452200,4926100,95400,11200,42000,323500,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239643942900,1269239649055900,5113000,54400,24700,35000,228700,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239651517800,1269239656405200,4887400,57500,7600,47900,245300,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239659424000,1269239664210000,4786000,59500,10100,100500,392200,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239666216200,1269239671921100,5704900,70200,8100,35400,306600,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239675691000,1269239681864500,6173500,117600,27200,85500,619100,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239684447200,1269239690320800,5873600,101400,12600,63900,398300,1500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239692914500,1269239697730700,4816200,102300,12500,81100,349300,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239700061400,1269239704436500,4375100,57300,7800,38200,267100,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239706876700,1269239710929000,4052300,58500,8300,37300,226400,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239713080000,1269239717163800,4083800,53800,8100,40600,284700,1800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239719752100,1269239725048100,5296000,130600,16000,74300,381800,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239728026400,1269239732575800,4549400,140300,12800,59500,351000,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239735349100,1269239740956600,5607500,95700,25000,76500,475000,1700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239743835700,1269239748224300,4388600,66300,10600,43300,293600,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239750990100,1269239755457600,4467500,75300,12200,77400,310600,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239757677500,1269239762059800,4382300,136000,10100,46200,367800,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239764702200,1269239768647300,3945100,69000,10900,67200,264400,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239770958000,1269239775349500,4391500,68800,8500,42600,225800,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239777745400,1269239782976400,5231000,104100,15700,78200,566300,1400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239784827500,1269239788614900,3787400,93500,8800,45900,228000,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239790734100,1269239794529900,3795800,73700,9300,44700,377600,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239796511900,1269239800385200,3873300,66400,9800,41300,277300,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239802619400,1269239807160700,4541300,103600,14200,72600,412700,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239809190000,1269239813261300,4071300,56100,9200,45900,226600,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239815696000,1269239820451400,4755400,59900,10100,47300,329100,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239822382000,1269239827446400,5064400,146300,18500,72600,413900,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239829268600,1269239833018600,3750000,54300,7400,59700,194100,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239835576900,1269239839212000,3635100,60200,8400,47000,212100,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239842010300,1269239845655400,3645100,74700,7200,53900,206800,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239848975200,1269239853050500,4075300,59000,7700,66600,279700,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239855143000,1269239863031800,7888800,91800,12200,62600,468700,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239865943100,1269239870271500,4328400,53400,7400,44100,239600,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239872333200,1269239876797200,4464000,88700,33200,80600,386400,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239878651500,1269239882570000,3918500,56700,7900,48600,225700,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239884579900,1269239889015000,4435100,65800,8900,80400,268500,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239891037700,1269239895137200,4099500,57100,7600,63100,251100,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239897294200,1269239901295300,4001100,76300,8700,49900,238300,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239903346200,1269239907522400,4176200,53400,16600,57600,227000,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239909743300,1269239914318200,4574900,91300,9800,52900,249900,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239917067600,1269239920892500,3824900,58300,7600,50500,257500,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239922751800,1269239926706500,3954700,76200,8000,49600,215600,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239928830300,1269239932565700,3735400,70200,19000,50000,201600,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239934653700,1269239938400100,3746400,66200,7800,60700,230900,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239940868600,1269239945243500,4374900,202800,14900,135500,423900,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239947064700,1269239951041300,3976600,46700,7700,80500,204400,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239953047900,1269239956867400,3819500,51100,7700,67900,262500,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239958908100,1269239962788700,3880600,52200,7200,78400,235400,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239964684800,1269239968387600,3702800,51800,7800,62700,235300,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239970419500,1269239974944900,4525400,57900,8600,112300,288800,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239977634200,1269239982278100,4643900,85200,12300,88300,266400,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239984461400,1269239988653800,4192400,52800,7900,121500,290200,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239991309500,1269239995182100,3872600,53300,7800,90900,243200,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269239997132200,1269240001188600,4056400,60400,7100,64600,251600,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240003093200,1269240007678200,4585000,47600,7100,61200,237400,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240011955800,1269240019254800,7299000,126200,22600,149400,606500,2200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240024632000,1269240033296600,8664600,133400,20700,187800,663100,2200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240036897700,1269240046172300,9274600,130200,19200,164700,670800,3300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240050616000,1269240058087500,7471500,165500,18400,137600,628800,1900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240061181000,1269240067070900,5889900,88400,10800,134500,393000,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240070056200,1269240076902700,6846500,201700,19600,141000,745800,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240080431800,1269240088008100,7576300,95200,17200,126900,531000,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240090518200,1269240095561400,5043200,79800,10300,79400,339000,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240098687300,1269240104661400,5974100,159700,19200,155300,423600,1400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240107303100,1269240112948900,5645800,103000,15200,135800,669600,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240115435700,1269240119840800,4405100,76600,26500,75400,272100,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240122336300,1269240127631700,5295400,116700,11400,72000,407900,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240130498800,1269240137371400,6872600,171500,18200,125600,586100,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240149942400,1269240156125700,6183300,56100,7900,34900,260200,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240158693200,1269240163672300,4979100,78300,8700,49800,305800,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240165737700,1269240169729200,3991500,57100,7100,35900,260900,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240171430600,1269240175598100,4167500,47000,7000,37200,246400,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240177791900,1269240181672500,3880600,51500,6900,39500,239100,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240183395600,1269240187323500,3927900,46400,7100,70200,214200,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240188995500,1269240193266700,4271200,97000,14200,64400,299000,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240195106200,1269240199302200,4196000,50400,6900,44600,233400,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240200958600,1269240204688100,3729500,61400,6900,32300,215900,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240206353400,1269240211174300,4820900,92800,16800,77800,563800,1400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240212925300,1269240217043500,4118200,78200,16900,38000,254000,1800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240218956400,1269240226385000,7428600,54800,8300,37500,298700,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240228415700,1269240235524700,7109000,52300,7700,35300,261000,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240237441600,1269240242182500,4740900,65600,10500,73900,339200,800,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240244266700,1269240249214100,4947400,76200,9600,41200,316800,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240251674000,1269240256861000,5187000,104600,10400,60700,372700,1200,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240259465100,1269240263810500,4345400,67600,8400,65500,324200,1400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240265603000,1269240269700600,4097600,75800,14900,40100,240700,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240271477400,1269240275621900,4144500,62800,6600,33700,235000,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240277195800,1269240281030700,3834900,58100,8600,42400,297100,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240283064700,1269240286868400,3803700,44200,5800,48200,224500,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240288451400,1269240292036500,3585100,46100,6800,34000,229200,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240294116700,1269240298185700,4069000,40900,6700,33100,218500,500,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240300006900,1269240303990000,3983100,91900,10200,60000,284500,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240305749400,1269240309885300,4135900,75600,10000,48700,324900,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240311849900,1269240316032900,4183000,51500,6200,36400,241700,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240318304000,1269240322739800,4435800,62600,7900,45900,292300,1100,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240325371600,1269240329808200,4436600,75200,13000,90500,244400,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240332243100,1269240336611300,4368200,70300,7300,41300,296400,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240338378600,1269240342553900,4175300,47300,6300,35700,233500,1300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240343989200,1269240347940700,3951500,47500,7100,37400,238300,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240349799400,1269240353669300,3869900,40400,6400,36100,234800,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240355559500,1269240359631300,4071800,135500,12300,69000,319300,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240361328000,1269240365308700,3980700,56800,6200,37200,247200,1000,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240366905100,1269240370742700,3837600,39900,6200,36800,216100,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240372577700,1269240376924700,4347000,72000,9300,47100,281500,900,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240378641300,1269240382460100,3818800,48100,6400,83600,218800,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240384036000,1269240388232800,4196800,78100,7200,77900,277300,2300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240390103400,1269240393875100,3771700,43200,5900,54000,220500,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240396056700,1269240400092200,4035500,46900,6900,60400,253200,600,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240401841000,1269240405705400,3864400,45000,7500,57800,223200,700,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240408074200,1269240409246200,1172000,84200,15700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240411005700,1269240411762400,756700,42100,11900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240413249500,1269240414186100,936600,54100,8700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240416078800,1269240417148100,1069300,48600,7200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240419038200,1269240420042800,1004600,49000,7500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240421754100,1269240422517000,762900,44500,6700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240424457900,1269240425574600,1116700,71700,10200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240427600600,1269240428463300,862700,58400,6600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240430070000,1269240431164900,1094900,115000,14600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240433048300,1269240434183100,1134800,101200,10000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240436257100,1269240437229100,972000,49200,8000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240439044600,1269240440003100,958500,54900,8500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240443008500,1269240444362400,1353900,55900,8500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240446181200,1269240447017400,836200,68500,6500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240448757100,1269240449633100,876000,44700,7200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240451284600,1269240452098200,813600,60100,6300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240453701200,1269240454514800,813600,41800,6700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240456197700,1269240457641400,1443700,99100,24300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240460131300,1269240461209200,1077900,67100,15000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240464036700,1269240464947000,910300,46900,6700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240466671300,1269240467569500,898200,65600,7500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240469689600,1269240470743800,1054200,58300,8200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240473254100,1269240474617400,1363300,130200,13800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240476756000,1269240477812200,1056200,63600,27500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240479537900,1269240480494900,957000,64900,7300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240482497800,1269240483505900,1008100,64500,10000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240485830800,1269240487327300,1496500,84800,12500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240490290500,1269240491467400,1176900,70500,11300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240494064800,1269240495400500,1335700,68500,10400,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240497775100,1269240498813800,1038700,53000,7300,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240500774500,1269240501819600,1045100,47700,7000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240503598700,1269240504473500,874800,57600,7200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240506461400,1269240507489500,1028100,53900,7100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240508989900,1269240509754600,764700,37900,6600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240511214200,1269240512059900,845700,64500,7000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240513566800,1269240514427600,860800,62400,6900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240515948800,1269240516783100,834300,40400,7000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240518293900,1269240519335100,1041200,55500,8700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240520906700,1269240521770500,863800,41100,7000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240523505600,1269240524412800,907200,50600,7500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240525969800,1269240526787600,817800,38200,7100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240528287000,1269240529116000,829000,38700,6800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240530606200,1269240531396300,790100,42600,6600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240533142100,1269240534209500,1067400,65800,11500,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240537118900,1269240538177700,1058800,62500,6900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240540149200,1269240541633000,1483800,93200,15600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240544397000,1269240545492900,1095900,48000,11100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240547347200,1269240548575000,1227800,57300,10700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240551009400,1269240551951000,941600,64500,7200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240553690800,1269240554577900,887100,46100,8000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240556360100,1269240557390400,1030300,47900,7900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240559290200,1269240560277100,986900,45200,7000,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240561900600,1269240562865800,965200,86100,9700,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240565019200,1269240566038700,1019500,47100,8600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240567735500,1269240568705300,969800,46200,7600,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240570541700,1269240571300200,758500,37800,6100,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240573316000,1269240574829600,1513600,90100,11800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240576981700,1269240577977800,996100,44800,11900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240580429400,1269240581680500,1251100,49300,8900,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240583496200,1269240584377300,881100,48600,7200,skipped,skipped,skipped,TIMESTAMP_FAIL,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240593421700,1269240593711600,289900,skipped,skipped,skipped,skipped,skipped,INVALID_REQUEST,400
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240595565200,1269240596338200,773000,skipped,skipped,skipped,skipped,skipped,ACCOUNT_NOT_FOUND,404
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240676692700,1269240708864600,32171900,760900,159300,521100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240673260500,1269240709395200,36134700,688500,175200,1176000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240677435600,1269240709815300,32379700,660900,179900,1634300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240679028100,1269240710131600,31103500,654100,179200,1984000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240678204500,1269240710449800,32245300,646900,180400,2301800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240679890500,1269240710745600,30855100,640500,181200,2588700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240681533000,1269240711079900,29546900,631300,185000,2874500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240682097300,1269240711461900,29364600,608000,189500,3226900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240682605900,1269240711843600,29237700,599300,194700,3625500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240691678100,1269240712151500,20473400,589300,199100,3956400,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240675844800,1269240712450700,36605900,580000,203600,4263800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240692402400,1269240712728800,20326400,570900,208300,4537700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240692059800,1269240713015400,20955600,562000,213000,4799800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240693054900,1269240713311900,20257000,525400,217600,5079600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240693296800,1269240713613300,20316500,512700,222400,5373400,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240692725900,1269240713885600,21159700,503600,226600,5668200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240693524100,1269240714158600,20634500,493200,233200,5925700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240693744200,1269240714429400,20685200,484000,238300,6198600,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240693966900,1269240714688600,20721700,470500,245300,6445800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240694423800,1269240714994600,20570800,452100,250200,6720000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240694648800,1269240715259300,20610500,430200,253800,6998800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240694184200,1269240715534000,21349800,421400,257900,7263500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240694887000,1269240715803100,20916100,412900,262800,7521800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240695113400,1269240716060400,20947000,389600,265800,7781900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240695357000,1269240716325200,20968200,379000,270100,8030100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240695584900,1269240716587900,21003000,370200,274600,8286700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240695816100,1269240716847100,21031000,361600,279300,8546900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240696047300,1269240717104400,21057100,353900,283100,8797700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240696530000,1269240717370400,20840400,345600,287800,9041200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240680843500,1269240717642100,36798600,337300,292300,9313200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240697013000,1269240717892900,20879900,328600,297000,9566000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240674638200,1269240718155500,43517300,320800,303700,9809500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240697520600,1269240718415600,20895000,311200,312300,10058300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240697271400,1269240718688800,21417400,302700,317100,10315500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240697767100,1269240718976100,21209000,294400,321400,10593900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240698016900,1269240719227600,21210700,286300,325500,10858700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240698274600,1269240719489300,21214700,278100,329900,11107300,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240696292700,1269240720060600,23767900,269100,334600,11420700,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240699060800,1269240720580700,21519900,260000,353400,12059500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240698529300,1269240720891000,22361700,251400,357400,12450100,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240699331500,1269240721273900,21942400,242200,361700,12784900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240699579800,1269240721600000,22020200,233800,365500,13134800,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240698789500,1269240721910200,23120700,225900,369800,13439200,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240700356100,1269240722229900,21873800,217000,373900,13750500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240696766900,1269240722545000,25778100,208600,390800,14067400,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240700070400,1269240722893900,22823500,199300,394900,14359500,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240699823200,1269240723310700,23487500,190600,398700,14718900,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240700602400,1269240723697900,23095500,182500,403700,15133000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240700864100,1269240724000100,23136000,173300,408000,15490000,skipped,skipped,NONCE_FAIL,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240640975500,1269240743958800,102983300,144000,9700,31300,30695800,3300,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240764891900,1269240789275300,24383400,298800,53200,218700,5477700,400,ACCEPTED,200
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240766398200,1269240791240300,24842100,250300,88200,516600,5224500,2600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240765468400,1269240792786400,27318000,225500,102000,682500,5065100,1800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240767133100,1269240794227500,27094400,201700,108600,776800,4974500,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240765224500,1269240795668600,30444100,257700,70700,418500,5404100,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240767811400,1269240797133500,29322100,177200,115500,948000,4848900,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240768094700,1269240798930400,30835700,170100,119400,1045700,4945000,4900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240766621400,1269240800417500,33796100,240400,92000,618300,5438000,2000,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240765698600,1269240801803800,36105200,155800,127000,1209600,4807000,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240765927500,1269240803101800,37174300,267800,65100,332100,5794400,3900,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240768921600,1269240804507900,35586300,141300,134500,1407900,4635100,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240769135800,1269240805768500,36632700,134700,138300,1473700,4574500,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240769375100,1269240807478300,38103200,126700,142200,1570000,4483100,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240768428200,1269240809056600,40628400,162800,123300,1142200,4952100,1800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240769877700,1269240810470400,40592700,95200,151600,1704700,4355600,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240768693700,1269240811943600,43249900,148700,130700,1311700,4792100,1800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240770686600,1269240813241900,42555300,81600,159700,1840900,4227800,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240767517500,1269240814790500,47273000,187600,112500,877100,5278600,1400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240771219500,1269240816706900,45487400,295100,74000,435800,3122100,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240769618200,1269240818571200,48953000,104700,146500,1639300,4481800,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240766852200,1269240820190000,53337800,266700,84200,639400,2924600,1400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240770127000,1269240821550200,51423200,88500,155400,1780500,4346400,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240771970900,1269240823066300,51095400,253100,93600,782600,2788200,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240770964300,1269240824575700,53611400,315800,65000,332600,3290600,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240772203200,1269240826217100,54013900,238900,104500,942900,2633000,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240771492700,1269240827590700,56098000,286700,79200,525200,3095600,1400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240766152300,1269240828956600,62804300,224700,114700,1111400,2470400,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240773418400,1269240830347000,56928600,217900,119200,1188700,2396200,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240770394900,1269240831772300,61377400,207500,126900,1268200,2317100,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240773934400,1269240833052500,59118100,200200,157100,1314200,2248000,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240773149800,1269240834386700,61236900,193900,166300,1384000,2176200,1400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240774504400,1269240835746700,61242300,187000,171300,1450200,2111800,2000,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240774767900,1269240837034600,62266700,180500,176300,1556600,2008000,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240775037900,1269240838393500,63355600,173300,181300,1654900,1912500,1300,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240772433600,1269240839887900,67454300,245800,98800,861100,2818000,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240775631300,1269240841862100,66230800,160100,192800,1815200,1755200,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240775869800,1269240843248200,67378400,153500,198400,1876700,1695700,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240776118300,1269240844635700,68517400,146600,203400,1938400,1636800,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240776607900,1269240846811800,70203900,131600,209200,1999900,1576800,1600,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240776816800,1269240849131800,72315000,122400,215400,2061200,1517500,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240777038100,1269240851050800,74012700,113600,221200,2123400,1457100,2800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240777235700,1269240852586800,75351100,106600,226900,2200100,1384100,4800,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240777454900,1269240854121100,76666200,99800,232400,2263500,1330500,5200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240777699900,1269240855599500,77899600,93300,238100,2323700,1277000,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240772920000,1269240857391100,84471100,87100,244100,2387400,1214300,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240773657800,1269240858781300,85123500,80400,251500,2447200,1154100,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240774268500,1269240860107600,85839100,73600,263700,2502100,1095200,1400,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240772696100,1269240861589100,88893000,232500,109000,1044700,2772200,2200,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240771734900,1269240863016600,91281700,259600,88900,711700,3146500,1500,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240775366900,1269240864337400,88970500,166500,187400,1730900,2011900,1700,ALREADY_PROCESSED,409
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240878011700,1269240879989600,1977900,skipped,skipped,skipped,skipped,skipped,SESSION_INVALID,401
phase3-default-defenses,integration-suite,windows-node-test-9412,1269240883389800,1269240884479100,1089300,skipped,skipped,skipped,skipped,skipped,AUTHENTICATION_REQUIRED,401
```

### `experiments/results/phase3/npm-test.log`

Bytes: 4206. SHA-256: `5c954643f630754c6ce5a1dec2867b934db9e842ffa84451ca8ac96d369ef49d`.

```text
�� 
 >   r e p l a y - a t t a c k - r e s e a r c h - a r t i f a c t @ 1 . 0 . 0   t e s t  
 >   n p m   - - p r e f i x   s e r v e r   t e s t  
  
  
 >   b a n k i n g - r e p l a y - s e r v e r @ 1 . 0 . 0   t e s t  
 >   n o d e   - - t e s t   t e s t / * . t e s t . j s  
  
 '  a c c o u n t   a n d   h i s t o r y   l o o k u p s   r e t u r n   t h e   s e e d e d   a c c o u n t   a n d   a n   e m p t y   l e d g e r   ( 3 0 3 . 3 0 5 9 m s )  
 '  d e p o s i t   u s e s   s i g n a t u r e ,   t i m e s t a m p ,   n o n c e ,   r e q u e s t   I D   a n d   b a l a n c e   p i p e l i n e   ( 5 0 . 1 6 0 8 m s )  
 '  w i t h d r a w   r e j e c t s   b a d   s i g n a t u r e s ,   t i m e s t a m p s ,   a c c o u n t   o w n e r s h i p   a n d   u n k n o w n   u s e r s   ( 3 4 . 7 9 m s )  
 '  i n s u f f i c i e n t   b a l a n c e   i s   r e c o r d e d   a s   f a i l e d   a n d   t h e   r e q u e s t   I D   r e m a i n s   r e t r y a b l e   ( 2 6 . 3 1 7 3 m s )  
 '  s a m e   r e q u e s t   I D   i s   i d e m p o t e n t   a f t e r   s u c c e s s ,   e v e n   w h e n   n o n c e   s t a t e   i s   w i p e d   ( 2 7 . 4 8 7 5 m s )  
 '  m a l f o r m e d   i n p u t   a n d   u n k n o w n   r o u t e s   h a v e   d o c u m e n t e d   J S O N   b o d i e s   ( 8 . 5 3 6 2 m s )  
 '  f u t u r e   a n d   p a s t   t i m e s t a m p   e d g e s   r e p e a t   3 0   t i m e s   a n d   s a v e   p e r - r e q u e s t   t i m i n g s   ( 1 1 4 6 . 1 8 7 5 m s )  
 '  P h a s e   0   c l i e n t   c l o c k   o f f s e t s   r e p e a t   3 0   t i m e s   p e r   o f f s e t   a n d   s a v e   p e r - r e q u e s t   t i m i n g s   ( 6 6 6 . 5 6 8 2 m s )  
 '  d e p o s i t   u n k n o w n   a c c o u n t ,   i n v a l i d   f i e l d s ,   a n d   i n t e r n a l   e r r o r   r e s p o n s e   c o n t r a c t s   a r e   c o v e r e d   ( 1 8 . 2 5 8 6 m s )  
 '  5 0   i d e n t i c a l   c o n c u r r e n t   r e q u e s t s   p r o d u c e   o n e   d e b i t   a n d   o n e   a c c e p t a n c e   ( 2 1 4 . 6 6 9 5 m s )  
 '  5 0   v a l i d   n o n c e s   r a c i n g   o n   o n e   r e q u e s t   I D   p r o d u c e   o n e   d e b i t   ( 2 5 3 . 4 2 8 5 m s )  
 '  s e s s i o n   a u t h e n t i c a t i o n   m u s t   m a t c h   t h e   s i g n e d   u s e r   I D   ( 2 0 . 2 5 9 4 m s )  
 '  C H E C K _ O R D E R   a c c e p t s   t i m e s t a m p - f i r s t   a n d   r e q u e s t - I D - b e f o r e - n o n c e   a l t e r n a t i v e s   ( 0 . 5 8 6 m s )  
 '  m i g r a t i o n   p r e s e r v e s   o l d   r o w s   a n d   r e p l a c e s   g l o b a l   r e q u e s t   I D   u n i q u e n e s s   w i t h   S U C C E S S - o n l y   i n d e x   ( 7 8 4 . 2 3 2 m s )  
 '  F A I L E D   I D   m a y   b e   r e t r i e d   a s   S U C C E S S ,   b u t   a   s e c o n d   S U C C E S S   w i t h   t h a t   I D   i s   b l o c k e d   ( 5 . 7 6 9 m s )  
 '  H M A C   s i g n s   t h e   c a n o n i c a l   p a y l o a d   a n d   r e j e c t s   a   m o d i f i e d   f i e l d   ( 2 . 3 7 5 3 m s )  
 '  m e m o r y   n o n c e   b a c k e n d   a t o m i c a l l y   a c c e p t s   o n c e   a n d   e x p i r e s   e n t r i e s   ( 1 0 5 5 . 9 2 5 2 m s )  
 '  S Q L i t e   n o n c e   b a c k e n d   e n f o r c e s   d u r a b l e   u n i q u e n e s s   a n d   e x p i r e s   e n t r i e s   ( 9 . 4 5 9 9 m s )  
 '  n o n c e - s t o r e   f a i l u r e   p o l i c y   o p e n s   o r   c l o s e s   e x a c t l y   a s   c o n f i g u r e d   ( 2 . 0 3 5 7 m s )  
 '  i d e m p o t e n c y   i s   s c o p e d   t o   s u c c e s s f u l   t r a n s a c t i o n s   s o   f a i l u r e s   m a y   r e t r y   ( 1 . 0 3 9 8 m s )  
 '  m o n e y   i n t e g r i t y   o r a c l e   c o u n t s   d e b i t s   a n d   r e p e a t e d   s i g n e d   p a y l o a d s   ( 1 . 5 6 4 1 m s )  
 9!  t e s t s   2 1  
 9!  s u i t e s   0  
 9!  p a s s   2 1  
 9!  f a i l   0  
 9!  c a n c e l l e d   0  
 9!  s k i p p e d   0  
 9!  t o d o   0  
 9!  d u r a t i o n _ m s   3 7 1 1 . 5 0 1 6  
 
```

### `experiments/results/phase3/wsl-server-layer-timings.csv`

Bytes: 401. SHA-256: `f280433bc4a6859667b40650346b9a5d3142017042baf57d16264b31871567cc`.

```csv
config_id,scenario_id,run_id,started_ns,ended_ns,duration_ns,hmac_ns,timestamp_ns,nonce_ns,request_id_ns,balance_ns,outcome,http_status
default,unspecified,unspecified,1269669943682500,1269669966972700,23290200,2438800,342800,skipped,skipped,skipped,TIMESTAMP_FAIL,400
default,unspecified,unspecified,1269671184185100,1269671185337700,1152600,116200,skipped,skipped,skipped,skipped,SIGNATURE_FAIL,401
```

### `experiments/results/SHA256SUMS.json`

Bytes: 18739. SHA-256: `241f358ffd467a8ad5abe93953a4147f6c1bfa0fab5dc357a0f69575f6108923`.

```json
[
  {
    "path": "experiments/results/baseline/capture-trigger.json",
    "sizeBytes": 424,
    "sha256": "f700cd2e5a2a749e3a472e3eec502cc4951818466e4e4894acc815f571b6f19a"
  },
  {
    "path": "experiments/results/baseline/capture.log",
    "sizeBytes": 492,
    "sha256": "1cab16306fde8e4e0b2e95040fc600bd1c1d89df6e012924197f85fa4daaa656"
  },
  {
    "path": "experiments/results/baseline/check-ports-postrotation.js",
    "sizeBytes": 586,
    "sha256": "3868c6828fcdbee1d861276e61014e8d92218d1853ebd99b8fc94dfa6b133043"
  },
  {
    "path": "experiments/results/baseline/collect-environment.js",
    "sizeBytes": 3595,
    "sha256": "e77a2fa7cc56f1f55f3ee4d504098199a5ce9f6dec4329088827e2380dd6d8ba"
  },
  {
    "path": "experiments/results/baseline/immediate-replay-trigger.json",
    "sizeBytes": 110,
    "sha256": "d9034a2dd43861cbd2d3ab5066bf0654deac12d2a1c3dd7eed3ad76b3d25d96f"
  },
  {
    "path": "experiments/results/baseline/immediate-replay.log",
    "sizeBytes": 257,
    "sha256": "3363bff4e80a9133d637236cfe5017c9994c1ea5d3658be4e1a339c0b28788d5"
  },
  {
    "path": "experiments/results/baseline/make-stale-payload.js",
    "sizeBytes": 728,
    "sha256": "f82ad38fc79eb0a6b7fbcf9fb134614bb0cece2bc03415c23e7082cb5d8f2494"
  },
  {
    "path": "experiments/results/baseline/make-tamper-source.js",
    "sizeBytes": 675,
    "sha256": "ca566a8824d0cbe6746b900396834a3a7600bb4da9e35bf13da5b8e9dabd3946"
  },
  {
    "path": "experiments/results/baseline/measured-cases.json",
    "sizeBytes": 1598,
    "sha256": "9ef5e75670fca61eceffcd14ef023038a887be7978435df1395108023088106d"
  },
  {
    "path": "experiments/results/baseline/nonce-crash.json",
    "sizeBytes": 33,
    "sha256": "b58f475bf46783a6b01f59e1c665e161efaccdd05cc577f7d87282ab3904cfaa"
  },
  {
    "path": "experiments/results/baseline/nonce-growth-measured.json",
    "sizeBytes": 560,
    "sha256": "61a85e7fb13d80833fc6882d2e36d3533bd5a19234111bd1c8c5dc51d8050d47"
  },
  {
    "path": "experiments/results/baseline/npm-test-client-bank.log",
    "sizeBytes": 322,
    "sha256": "490434ce49cd2e4453c626c22daecb12f3e8c19c4f35ed58569a318b89398832"
  },
  {
    "path": "experiments/results/baseline/npm-test-client-viz.log",
    "sizeBytes": 322,
    "sha256": "490434ce49cd2e4453c626c22daecb12f3e8c19c4f35ed58569a318b89398832"
  },
  {
    "path": "experiments/results/baseline/npm-test-server.log",
    "sizeBytes": 322,
    "sha256": "490434ce49cd2e4453c626c22daecb12f3e8c19c4f35ed58569a318b89398832"
  },
  {
    "path": "experiments/results/baseline/npm-test-status.json",
    "sizeBytes": 456,
    "sha256": "0f0faa7de5a562e2f78ec780adc2ddb1eb4d0b2a90941ac856cea6341b642339"
  },
  {
    "path": "experiments/results/baseline/parallel-50-responses.json",
    "sizeBytes": 4266,
    "sha256": "49e842ef8fb686d8a2cf7c308049d3103ab0f87a3306b32908dd9a2455d484c0"
  },
  {
    "path": "experiments/results/baseline/payload.before-capture.json",
    "sizeBytes": 359,
    "sha256": "e38c70b834363e9ecce8e5f6d250a76ffdfc56b22e67d28c4fcf3aa22b8e2add"
  },
  {
    "path": "experiments/results/baseline/phase0-summary.json",
    "sizeBytes": 3028,
    "sha256": "89650cca53dba6031e943cb44184d7ed2cbe9b501663b64ef2423a686e7aaa43"
  },
  {
    "path": "experiments/results/baseline/postrotation-port-check.json",
    "sizeBytes": 236,
    "sha256": "8578b80c198c9367c3ae2c3b2b2b0276397f4aae3ab66837bbd1cc0db0ce3d76"
  },
  {
    "path": "experiments/results/baseline/replay-after-nonce-crash.log",
    "sizeBytes": 264,
    "sha256": "2171424860aaa034ca58bce8625a48c0a9881860a0194d4117133c75690e7daf"
  },
  {
    "path": "experiments/results/baseline/replay.log",
    "sizeBytes": 1020,
    "sha256": "512839c3112ccb2f2d921f717ba42165caeadd8856ca585bec6562a2a502cda5"
  },
  {
    "path": "experiments/results/baseline/reset.json",
    "sizeBytes": 521,
    "sha256": "f46476d565e16f2eab8e000b4a76e6473bd1d5bff978e002c977c9803000e10d"
  },
  {
    "path": "experiments/results/baseline/run-measured-cases.js",
    "sizeBytes": 4375,
    "sha256": "629b1a3e464de26d08b78e1c6cb13538dafa8583eb237b84d1a85289a0e28560"
  },
  {
    "path": "experiments/results/baseline/server.restart.stderr.log",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/baseline/server.restart.stdout.log",
    "sizeBytes": 82,
    "sha256": "25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45"
  },
  {
    "path": "experiments/results/baseline/server.stderr.log",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/baseline/server.stdout.log",
    "sizeBytes": 82,
    "sha256": "25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45"
  },
  {
    "path": "experiments/results/baseline/stale-payload.json",
    "sizeBytes": 374,
    "sha256": "618b3128fe17db9c0717c072c5e0dbacbaeebec2e52b32fcf8cc45528eed8afb"
  },
  {
    "path": "experiments/results/baseline/stale-replay.log",
    "sizeBytes": 263,
    "sha256": "7717d0b34282a1d17aae3f51c240b40d09883f0cb7b5874e4151245d886d6947"
  },
  {
    "path": "experiments/results/baseline/tamper-fresh.log",
    "sizeBytes": 347,
    "sha256": "849b3cc3684f16b96652f25da34024ae98fa99b55bf3a5b070c0abdc495ed432"
  },
  {
    "path": "experiments/results/baseline/tamper-source.json",
    "sizeBytes": 374,
    "sha256": "620e8526692f55afaae7c616c5793b3241ef56ff9960b3645e452ae6a58a1298"
  },
  {
    "path": "experiments/results/baseline/tamper.log",
    "sizeBytes": 347,
    "sha256": "04126d7d5a2badabab2c0340a7a71f05611e4c7e9975ea8e47026a0e5617f5d3"
  },
  {
    "path": "experiments/results/baseline/trigger-capture.js",
    "sizeBytes": 1298,
    "sha256": "3bb6fcb9affd28868af089e8abb1ccce091e85fb660dc427bf9381d7481ea5c0"
  },
  {
    "path": "experiments/results/baseline/unique-nonce-10000-responses.csv",
    "sizeBytes": 358925,
    "sha256": "89065441f9cf65a08d8ac0bc8784c3814958ef5c2fda8c2d4863705d4dab1ff3"
  },
  {
    "path": "experiments/results/baseline/wsl-health-postrotation.log",
    "sizeBytes": 261,
    "sha256": "363001e83d622cd35db26fc30e5d0b54ddffb74fdf5e40a51de28e29b86c5959"
  },
  {
    "path": "experiments/results/baseline/wsl-health.log",
    "sizeBytes": 261,
    "sha256": "cbc38d7f69199d37b3cec901116c5acbb5252c89141520bc111280c880cf45cb"
  },
  {
    "path": "experiments/results/corrections/c2-accepted-server.stderr.log",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/c2-accepted-server.stderr.log.copy",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/c2-accepted-server.stdout.log",
    "sizeBytes": 82,
    "sha256": "25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45"
  },
  {
    "path": "experiments/results/corrections/c2-accepted-server.stdout.log.copy",
    "sizeBytes": 82,
    "sha256": "25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45"
  },
  {
    "path": "experiments/results/corrections/c2-rejectclean-server.stderr.log",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/c2-rejectclean-server.stderr.log.copy",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/c2-rejectclean-server.stdout.log",
    "sizeBytes": 82,
    "sha256": "25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45"
  },
  {
    "path": "experiments/results/corrections/c2-rejectclean-server.stdout.log.copy",
    "sizeBytes": 82,
    "sha256": "25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45"
  },
  {
    "path": "experiments/results/corrections/c2-requestid-server.stderr.log",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/c2-requestid-server.stderr.log.partial-copy",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/c2-requestid-server.stdout.log",
    "sizeBytes": 82,
    "sha256": "25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45"
  },
  {
    "path": "experiments/results/corrections/c2-requestid-server.stdout.log.partial-copy",
    "sizeBytes": 82,
    "sha256": "25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45"
  },
  {
    "path": "experiments/results/corrections/c3-races-server.stderr.log",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/c3-races-server.stdout.log",
    "sizeBytes": 82,
    "sha256": "25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45"
  },
  {
    "path": "experiments/results/corrections/c4-proxy.stderr.log",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/c4-proxy.stdout.log",
    "sizeBytes": 151,
    "sha256": "68fcb13a62468640e2e492c921ec996a0dc6162ac324e1c5076748b5f4ee8450"
  },
  {
    "path": "experiments/results/corrections/clock-offsets-30-each.csv",
    "sizeBytes": 11826,
    "sha256": "92a4c0ccf67f84bd26013a81a07914c6807575fabd1e9a87a0de97395f5653d4"
  },
  {
    "path": "experiments/results/corrections/clock-offsets-30-each.json",
    "sizeBytes": 52764,
    "sha256": "e29e7e0a401439a12905e625ed21cffed170b8b85bba77450e42d026a118279d"
  },
  {
    "path": "experiments/results/corrections/final-server.stderr.log",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/final-server.stderr.log.copy",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/final-server.stdout.log",
    "sizeBytes": 84,
    "sha256": "908141bc87754c6ee425f0d27e42d8d8ff6360d72c54defc8b09537b3c340052"
  },
  {
    "path": "experiments/results/corrections/final-server.stdout.log.copy",
    "sizeBytes": 84,
    "sha256": "908141bc87754c6ee425f0d27e42d8d8ff6360d72c54defc8b09537b3c340052"
  },
  {
    "path": "experiments/results/corrections/nonce-memory-accepted-c2-accepted-100k-requests.csv",
    "sizeBytes": 6111075,
    "sha256": "fcc2c23ff3e0f3b20f6aa8b0442ea4c9668cb3f569ad3620d1b5107032c0ce4e"
  },
  {
    "path": "experiments/results/corrections/nonce-memory-accepted-c2-accepted-100k-summary.json",
    "sizeBytes": 1859,
    "sha256": "b9fa30951ff8dbba4a978ff18a2ceabcc7a22676bc44e555c4c301c58306f1a2"
  },
  {
    "path": "experiments/results/corrections/nonce-memory-accepted-c2-smoke-accepted-requests.csv",
    "sizeBytes": 634,
    "sha256": "6f9475847d255d7be09fd853b005c39e488d7a0809873da9e073684179ed03f0"
  },
  {
    "path": "experiments/results/corrections/nonce-memory-accepted-c2-smoke-accepted-summary.json",
    "sizeBytes": 1125,
    "sha256": "e89106676d1949f0bbbe78a3548632a5b256a2faaa84443ad63f016f147abf8d"
  },
  {
    "path": "experiments/results/corrections/nonce-memory-requestid-c2-requestid-100k-clean-control.csv",
    "sizeBytes": 246,
    "sha256": "0c0befa14d3ddf2f26f4d9f3fdc1abc4ae4a6a4efe05e51ec8fc7e89d3f5c571"
  },
  {
    "path": "experiments/results/corrections/nonce-memory-requestid-c2-requestid-100k-clean-requests.csv",
    "sizeBytes": 6989116,
    "sha256": "f1415c207f8ed7d22acb5c5a6daf0d6bd57b9f9528dae84b964e770b7bb56c82"
  },
  {
    "path": "experiments/results/corrections/nonce-memory-requestid-c2-requestid-100k-clean-summary.json",
    "sizeBytes": 2036,
    "sha256": "cfdd5cdc38f61e1dde1fa05e949b2805d767c274b21ef632c3b9a9550059d28d"
  },
  {
    "path": "experiments/results/corrections/proxy-replay-verification-first.json",
    "sizeBytes": 735,
    "sha256": "f612317b1ad4331821363f418876347943b6d4e5b80ee2d9680518ab714ab074"
  },
  {
    "path": "experiments/results/corrections/proxy-replay-verification-second.json",
    "sizeBytes": 735,
    "sha256": "c38b32ffe903c043e26cfec27702ac7b3921c063b854cdfb27f828c5f3f3e5dd"
  },
  {
    "path": "experiments/results/corrections/proxy-replay-verification.json",
    "sizeBytes": 735,
    "sha256": "c38b32ffe903c043e26cfec27702ac7b3921c063b854cdfb27f828c5f3f3e5dd"
  },
  {
    "path": "experiments/results/corrections/race-identical-50x1000-batches.csv",
    "sizeBytes": 60018,
    "sha256": "7aa79c1128a64b8a312c6923f6ef739f24bb8832a6019b3596bf09fb2b27480f"
  },
  {
    "path": "experiments/results/corrections/race-identical-50x1000-requests.csv",
    "sizeBytes": 3233722,
    "sha256": "3943e243efa1460148ffb7c1fc104a563ac6ec37d050888a63c4e94124da9df4"
  },
  {
    "path": "experiments/results/corrections/race-same-request-id-50-requests.csv",
    "sizeBytes": 3469,
    "sha256": "0cf4e976e66615bb1b0c98fe88f6f47f4dc257c69be64a05739afe22486961a1"
  },
  {
    "path": "experiments/results/corrections/race-summary-1000-batches.json",
    "sizeBytes": 1264,
    "sha256": "f4be98fa94363ce6378b1b23de93524116f3d472d3c058d4b8d1d1c4ad13c458"
  },
  {
    "path": "experiments/results/corrections/server-layer-timings-c2-accepted.csv",
    "sizeBytes": 12635825,
    "sha256": "56d5278c0d82b0e7625a494e430c92de8928b0d3b0d4e80b71cc732f183270e7"
  },
  {
    "path": "experiments/results/corrections/server.restart.stderr.log.copy",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/server.restart.stdout.log.copy",
    "sizeBytes": 82,
    "sha256": "25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45"
  },
  {
    "path": "experiments/results/corrections/server.stderr.log.copy",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/server.stdout.log.copy",
    "sizeBytes": 82,
    "sha256": "25d1cfe98d2251ba6abefe858ac0f98f3e54974f5c85ef086b7356897280cb45"
  },
  {
    "path": "experiments/results/corrections/timestamp-boundaries-30-each.csv",
    "sizeBytes": 16478,
    "sha256": "30e39211195246be5294ad7298345aef199090004eb6639253cb22b88c92e57a"
  },
  {
    "path": "experiments/results/corrections/timestamp-boundaries-30-each.json",
    "sizeBytes": 66846,
    "sha256": "5840b7fca6ef565bec2bf3253637d25d23d608feed50baca53277c5355ba85eb"
  },
  {
    "path": "experiments/results/corrections/viz-enabled-nonce-scan-requests.csv",
    "sizeBytes": 326830,
    "sha256": "e3c661220900d0275d82bfd3f79c10ff7ef555485d3b5eef7a742f6fc8c22d2e"
  },
  {
    "path": "experiments/results/corrections/viz-enabled-nonce-scan-summary.json",
    "sizeBytes": 1263,
    "sha256": "6c88f36d665722af0df0d32d06153cc965c59610c9eb986638da1b7835dcd006"
  },
  {
    "path": "experiments/results/corrections/viz-run.log",
    "sizeBytes": 2636,
    "sha256": "3acdd4f04fdc694534b2e7c1487a5c77e151b6cb1656f4497e3ea20ac2b5ef5a"
  },
  {
    "path": "experiments/results/corrections/vizcurve-server.stderr.log",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/vizcurve-server.stderr.log.copy",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/vizcurve-server.stdout.log",
    "sizeBytes": 84,
    "sha256": "908141bc87754c6ee425f0d27e42d8d8ff6360d72c54defc8b09537b3c340052"
  },
  {
    "path": "experiments/results/corrections/vizcurve-server.stdout.log.copy",
    "sizeBytes": 84,
    "sha256": "908141bc87754c6ee425f0d27e42d8d8ff6360d72c54defc8b09537b3c340052"
  },
  {
    "path": "experiments/results/corrections/wsl-attack-timings.csv",
    "sizeBytes": 284,
    "sha256": "72b26f129fbd13a2207e936b71f4041c44e12c775684bcfc339aa702a48b1285"
  },
  {
    "path": "experiments/results/corrections/wsl-capture-mode.log",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/wsl-capture-mode.stderr.log",
    "sizeBytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "path": "experiments/results/corrections/wsl-cli-cases.log",
    "sizeBytes": 4328,
    "sha256": "1f521630242389dacf4c6b0e1d524458d2341ab40719306b44fa39bc1c346c5b"
  },
  {
    "path": "experiments/results/corrections/wsl-invalid-cases.log",
    "sizeBytes": 2702,
    "sha256": "f3bc728225a7dc9e81e3a342c5bab19f6e7989696222988c0918f8840c19590c"
  },
  {
    "path": "experiments/results/corrections/wsl-replay.log",
    "sizeBytes": 828,
    "sha256": "885fe86c7df5eb37ea53f0a65a56bbdbc76868a295e104e8a02990ecaa50eaf0"
  },
  {
    "path": "experiments/results/corrections/wsl-timing-verification.log",
    "sizeBytes": 1570,
    "sha256": "7961fa3b8d4c055f64ba3e65cd45c8adef40d088b8653ffa3c29a4a56076b710"
  },
  {
    "path": "experiments/results/environment.json",
    "sizeBytes": 1529,
    "sha256": "3a7b4483f57f212c278b6008cd9a43c171e128367469944a8a123bfcf7514019"
  },
  {
    "path": "experiments/results/phase3/client-build.log",
    "sizeBytes": 778,
    "sha256": "e6721975888edf390bb33de45b368b6dc4147afd58a8c9973f66b19d92230bd4"
  },
  {
    "path": "experiments/results/phase3/layer-timings-1212.csv",
    "sizeBytes": 46625,
    "sha256": "a416b36935c313f3838390d6d768fed970a7fcd9a7e0bf2e1c168bc669a224ab"
  },
  {
    "path": "experiments/results/phase3/layer-timings-32508.csv",
    "sizeBytes": 46674,
    "sha256": "6c9a38715bf46921ec40048feb66707492e34aa7fab7ea13061c0f1adfd754b3"
  },
  {
    "path": "experiments/results/phase3/layer-timings-33040.csv",
    "sizeBytes": 70886,
    "sha256": "5e06aa645a818a0d91ad5b6a1738ec456912740b1960a6252d2f3a268d76d574"
  },
  {
    "path": "experiments/results/phase3/layer-timings-9412.csv",
    "sizeBytes": 46402,
    "sha256": "bd27b57160ba85bd80583d4d1a51630d856bc4e9d14508663e7bc83b2374b9a9"
  },
  {
    "path": "experiments/results/phase3/npm-test.log",
    "sizeBytes": 4206,
    "sha256": "5c954643f630754c6ce5a1dec2867b934db9e842ffa84451ca8ac96d369ef49d"
  },
  {
    "path": "experiments/results/phase3/wsl-server-layer-timings.csv",
    "sizeBytes": 401,
    "sha256": "f280433bc4a6859667b40650346b9a5d3142017042baf57d16264b31871567cc"
  }
]
```

### `experiments/run-nonce-memory.js`

Bytes: 6837. SHA-256: `0cfd333ac7c09a2ae9378425a7ade9e4fc9724ac6c9bdeb55fe3359acb19496a`.

```js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const { generateSignature } = require('../server/utils/hmac');
const { timedRequest } = require('./lib/http');

const mode = process.argv[2];
if (!['accepted', 'requestid'].includes(mode)) throw new Error('Usage: node experiments/run-nonce-memory.js accepted|requestid');
const baseUrl = process.env.EXPERIMENT_API || 'http://127.0.0.1:3000';
const runId = process.env.RUN_ID || `${mode}-${Date.now()}`;
const ttlSeconds = Number(process.env.NONCE_TTL || 86400);
const points = (process.env.MEMORY_POINTS || '0,1000,10000,100000').split(',').map(Number);
const output = path.join(__dirname, 'results', 'corrections');
const cli = process.env.MEMURAI_CLI || 'C:/Applications/memurai-cli.exe';
fs.mkdirSync(output, { recursive: true });

function parseInfo(text) {
  return Object.fromEntries(text.split(/\r?\n/).filter((line) => line && !line.startsWith('#') && line.includes(':')).map((line) => {
    const split = line.indexOf(':'); return [line.slice(0, split), line.slice(split + 1)];
  }));
}

function memoryBytes() {
  const info = parseInfo(execFileSync(cli, ['INFO', 'memory'], { encoding: 'utf8' }));
  return Number(info.used_memory);
}

function namespaceKeyCount(namespace) {
  const scan = execFileSync(cli, ['--scan', '--pattern', `used_nonce:${namespace}:*`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return scan.split(/\r?\n/).filter(Boolean).length;
}

function signedPayload(requestId) {
  const payload = {
    method: 'POST', path: '/api/deposit', user_id: 'anis_101', account_id: 'acc_777',
    amount: 1, currency: 'BDT', timestamp: new Date().toISOString(),
    nonce: `nonce_${crypto.randomUUID()}`, request_id: requestId
  };
  payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
  return payload;
}

async function post(payload, runRows, index) {
  const result = await timedRequest(`${baseUrl}/api/deposit`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
  });
  runRows.push({ index, ...result });
  if (mode === 'accepted' && result.body.status !== 'ACCEPTED') throw new Error(`Request ${index} rejected: ${JSON.stringify(result.body)}`);
  if (mode === 'requestid' && index !== 'seed' && result.body.reason !== 'ALREADY_PROCESSED') throw new Error(`Request ${index} did not reach request-ID check: ${JSON.stringify(result.body)}`);
  return result;
}

async function main() {
  const namespace = process.env.NONCE_KEY_NAMESPACE;
  if (!namespace) throw new Error('Set NONCE_KEY_NAMESPACE before starting the server and harness');
  const controlRows = [];
  const reset = await timedRequest(`${baseUrl}/api/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  controlRows.push({ name: 'reset', ...reset });
  let duplicateRequestId = null;
  if (mode === 'requestid') {
    duplicateRequestId = `seed_${runId}`;
    const seed = await post(signedPayload(duplicateRequestId), [], 'seed');
    controlRows.push({ name: 'seed', ...seed });
    const clear = await timedRequest(`${baseUrl}/api/demo/nonce-crash`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    controlRows.push({ name: 'nonce-store-clear', ...clear });
  }

  const baselineMemory = memoryBytes();
  const baselineKeys = namespaceKeyCount(namespace);
  if (baselineKeys !== 0) throw new Error(`Expected an empty run namespace, found ${baselineKeys} keys`);
  const snapshots = [{ targetKeys: 0, measuredKeys: 0, usedMemoryBytes: baselineMemory, baselineUsedMemoryBytes: baselineMemory, deltaBytes: 0, bytesPerKeyAboveBaseline: null, elapsed_ns: '0', ttlSeconds }];
  const csvPath = path.join(output, `nonce-memory-${mode}-${runId}-requests.csv`);
  const rows = ['index,started_ns,ended_ns,duration_ns,http_status,outcome'];
  const requestRows = [];
  const runStart = process.hrtime.bigint();
  let sent = 0;
  for (const target of points.slice(1)) {
    while (sent < target) {
      sent += 1;
      const id = mode === 'requestid' ? duplicateRequestId : `accepted_${runId}_${sent}`;
      await post(signedPayload(id), requestRows, sent);
    }
    const elapsed = process.hrtime.bigint() - runStart;
    const actualKeys = namespaceKeyCount(namespace);
    const usedMemory = memoryBytes();
    if (actualKeys !== target) throw new Error(`Expected ${target} live nonce keys, found ${actualKeys}`);
    if (Number(elapsed) / 1e9 >= ttlSeconds) throw new Error(`Run exceeded NONCE_TTL before snapshot ${target}`);
    snapshots.push({ targetKeys: target, measuredKeys: actualKeys, usedMemoryBytes: usedMemory, baselineUsedMemoryBytes: baselineMemory,
      deltaBytes: usedMemory - baselineMemory, bytesPerKeyAboveBaseline: (usedMemory - baselineMemory) / actualKeys,
      elapsed_ns: elapsed.toString(), elapsedSeconds: Number(elapsed) / 1e9, ttlSeconds, ttlFractionUsed: Number(elapsed) / 1e9 / ttlSeconds });
  }
  const runEnd = process.hrtime.bigint();
  for (const row of requestRows) rows.push([row.index, row.start_ns, row.end_ns, row.duration_ns, row.status, row.body.reason || row.body.status || ''].join(','));
  fs.writeFileSync(csvPath, `${rows.join('\n')}\n`);
  fs.writeFileSync(path.join(output, `nonce-memory-${mode}-${runId}-control.csv`), [
    'name,started_ns,ended_ns,duration_ns,http_status,outcome',
    ...controlRows.map((row) => [row.name, row.start_ns, row.end_ns, row.duration_ns, row.status, row.body.status || row.body.ok || ''].join(','))
  ].join('\n') + '\n');
  const summary = {
    runId, mode, nonceBackend: process.env.NONCE_STORE || 'redis', vizEnabled: process.env.VIZ_ENABLED === 'true', label: mode === 'requestid' ? 'nonce-store growth from requests rejected at the request-ID check' : 'nonce-store growth from accepted requests',
    createdAt: new Date().toISOString(), nonceTtlSeconds: ttlSeconds, duration_ns: (runEnd - runStart).toString(),
    durationSeconds: Number(runEnd - runStart) / 1e9, durationVsTtl: Number(runEnd - runStart) / 1e9 / ttlSeconds,
    baselineUsedMemoryBytes: baselineMemory, baselineNonceKeys: baselineKeys, snapshots,
    baselineSubtractedSlopeBytesPerKey: (snapshots.at(-1).usedMemoryBytes - baselineMemory) / 100000,
    requestRowsCsv: path.basename(csvPath), controlRowsCsv: `nonce-memory-${mode}-${runId}-control.csv`, requestCount: sent
  };
  fs.writeFileSync(path.join(output, `nonce-memory-${mode}-${runId}-summary.json`), `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
```

### `experiments/run-races.js`

Bytes: 5313. SHA-256: `0d2882e56b85887b9dd966ea102b9c5578bcf5ea95e8521fecd4eaae7e2fe8e7`.

```js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const { generateSignature } = require('../server/utils/hmac');
const { computeMoneyIntegrity } = require('../server/utils/money-oracle');
const { timedRequest } = require('./lib/http');

const baseUrl = process.env.EXPERIMENT_API || 'http://127.0.0.1:3000';
const output = path.join(__dirname, 'results', 'corrections');
const batches = Number(process.env.RACE_BATCHES || 1000);
const width = 50;
fs.mkdirSync(output, { recursive: true });

function makePayload(requestId = `request_${crypto.randomUUID()}`, nonce = `nonce_${crypto.randomUUID()}`) {
  const payload = { method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777', amount: 1,
    currency: 'BDT', timestamp: new Date().toISOString(), nonce, request_id: requestId };
  payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
  return payload;
}

async function request(payload) {
  return timedRequest(`${baseUrl}/api/withdraw`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
}

function writeRows(filename, header, rows) {
  fs.writeFileSync(path.join(output, filename), `${[header, ...rows].join('\n')}\n`);
}

async function main() {
  const perRequestRows = [];
  const batchRows = [];
  const acceptedDistribution = {};
  for (let batch = 1; batch <= batches; batch += 1) {
    const reset = await timedRequest(`${baseUrl}/api/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    if (reset.status !== 200) throw new Error(`Reset failed before batch ${batch}`);
    const payload = makePayload();
    const start = process.hrtime.bigint();
    const responses = await Promise.all(Array.from({ length: width }, () => request(payload)));
    const end = process.hrtime.bigint();
    const accepted = responses.filter((response) => response.body.status === 'ACCEPTED').length;
    const reasons = responses.reduce((map, response) => {
      const reason = response.body.reason || response.body.status || 'UNKNOWN'; map[reason] = (map[reason] || 0) + 1; return map;
    }, {});
    acceptedDistribution[accepted] = (acceptedDistribution[accepted] || 0) + 1;
    batchRows.push([batch, accepted, reasons.NONCE_FAIL || 0, (end - start).toString(), reset.start_ns, reset.end_ns, reset.duration_ns].join(','));
    responses.forEach((response, index) => perRequestRows.push([batch, index + 1, response.start_ns, response.end_ns, response.duration_ns, response.status, response.body.reason || response.body.status || ''].join(',')));
    if (accepted !== 1) throw new Error(`Batch ${batch}: expected one acceptance, got ${accepted}`);
  }
  writeRows(`race-identical-50x${batches}-requests.csv`, 'batch,request_index,started_ns,ended_ns,duration_ns,http_status,outcome', perRequestRows);
  writeRows(`race-identical-50x${batches}-batches.csv`, 'batch,accepted_count,nonce_fail_count,batch_duration_ns,reset_started_ns,reset_ended_ns,reset_duration_ns', batchRows);

  await timedRequest(`${baseUrl}/api/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  const sharedRequestId = `secret-holder-${crypto.randomUUID()}`;
  const payloads = Array.from({ length: width }, (_, index) => makePayload(sharedRequestId, `secret-holder-nonce-${index}-${crypto.randomUUID()}`));
  const before = await timedRequest(`${baseUrl}/api/balance/anis_101`);
  const raceStart = process.hrtime.bigint();
  const race = await Promise.all(payloads.map(request));
  const raceEnd = process.hrtime.bigint();
  const after = await timedRequest(`${baseUrl}/api/balance/anis_101`);
  const transactions = race.map((result, index) => result.body.status === 'ACCEPTED' ? ({
    type: 'WITHDRAW', status: 'SUCCESS', amount: 1, signature: payloads[index].signature
  }) : null).filter(Boolean);
  const oracle = computeMoneyIntegrity(transactions, payloads);
  const summary = {
    vizEnabled: process.env.VIZ_ENABLED === 'true',
    identicalPayloadRace: { batches, parallelWidth: width, acceptedCountDistribution: acceptedDistribution, acceptedPerBatch: 1, totalRequests: batches * width },
    secretHolderSameRequestIdRace: {
      parallelWidth: width, acceptedCount: race.filter((result) => result.body.status === 'ACCEPTED').length,
      requestIdShared: true, distinctValidNonces: width, debitAmount: Number(before.body.balance) - Number(after.body.balance),
      duration_ns: (raceEnd - raceStart).toString(), beforeBalanceTiming: before, afterBalanceTiming: after, oracle
    }
  };
  const sameIdRows = race.map((result, index) => [index + 1, result.start_ns, result.end_ns, result.duration_ns, result.status, result.body.reason || result.body.status || ''].join(','));
  writeRows('race-same-request-id-50-requests.csv', 'request_index,started_ns,ended_ns,duration_ns,http_status,outcome', sameIdRows);
  fs.writeFileSync(path.join(output, `race-summary-${batches}-batches.json`), `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
```

### `experiments/run-viz-curve.js`

Bytes: 2710. SHA-256: `fd8170f37e44cdb7b2e2106a49eac81d9154fd5e1b90aa614bb7b08ff50c1869`.

```js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const { generateSignature } = require('../server/utils/hmac');
const { timedRequest } = require('./lib/http');

const baseUrl = process.env.EXPERIMENT_API || 'http://127.0.0.1:3000';
const output = path.join(__dirname, 'results', 'corrections');
const sampleCounts = new Set([1, 100, 1000, 5000]);
const maximum = 5000;
fs.mkdirSync(output, { recursive: true });

function makePayload(index) {
  const payload = { method: 'POST', path: '/api/deposit', user_id: 'anis_101', account_id: 'acc_777', amount: 1,
    currency: 'BDT', timestamp: new Date().toISOString(), nonce: `viz-${index}-${crypto.randomUUID()}`, request_id: `viz-${index}-${crypto.randomUUID()}` };
  payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
  return payload;
}

async function main() {
  if (process.env.VIZ_ENABLED !== 'true') throw new Error('Start the measured server with VIZ_ENABLED=true');
  const reset = await timedRequest(`${baseUrl}/api/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  const requestRows = ['index,nonce_keys_at_dashboard_scan,started_ns,ended_ns,duration_ns,http_status,outcome'];
  const samples = [];
  for (let index = 0; index < maximum; index += 1) {
    const result = await timedRequest(`${baseUrl}/api/deposit`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(makePayload(index))
    });
    if (result.body.status !== 'ACCEPTED') throw new Error(`Visualization curve request ${index} failed: ${JSON.stringify(result.body)}`);
    requestRows.push([index + 1, index + 1, result.start_ns, result.end_ns, result.duration_ns, result.status, result.body.status].join(','));
    if (sampleCounts.has(index + 1)) samples.push({ nonceKeysAtDashboardScan: index + 1, duration_ns: result.duration_ns, duration_ms: Number(result.duration_ns) / 1e6, httpStatus: result.status });
  }
  fs.writeFileSync(path.join(output, 'viz-enabled-nonce-scan-requests.csv'), `${requestRows.join('\n')}\n`);
  const summary = { measuredOnce: true, vizEnabled: true, resetTiming: reset, label: 'dashboard per-request key-scan implementation artifact, not a defense property', nonceKeySamples: samples, allRequests: maximum };
  fs.writeFileSync(path.join(output, 'viz-enabled-nonce-scan-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}
main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
```

### `experiments/send-through-proxy.js`

Bytes: 2882. SHA-256: `62890986624f5a34c2d69b354bfbba00e4441e85eda46eb25ea9ecffdf85a587`.

```js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('../server/node_modules/dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const { generateSignature } = require('../server/utils/hmac');
const { timedRequest } = require('./lib/http');

const proxyUrl = process.env.PROXY_URL || 'http://127.0.0.1:3002';
const serverUrl = process.env.EXPERIMENT_API || 'http://127.0.0.1:3000';
const capturePath = process.env.PROXY_CAPTURE_FILE;
if (!capturePath) throw new Error('Set PROXY_CAPTURE_FILE to a private file outside the repository');

async function main() {
  const payload = {
    method: 'POST', path: '/api/withdraw', user_id: 'anis_101', account_id: 'acc_777', amount: 1,
    currency: 'BDT', timestamp: new Date().toISOString(), nonce: `proxy-${crypto.randomUUID()}`, request_id: `proxy-${crypto.randomUUID()}`
  };
  payload.signature = generateSignature(payload, process.env.HMAC_SECRET);
  const body = JSON.stringify(payload);
  const original = await timedRequest(`${proxyUrl}/api/withdraw`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body
  });
  const capture = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
  if (capture.request.body !== body) throw new Error('Proxy did not record the exact forwarded body');
  const headers = { ...capture.request.headers };
  delete headers.host;
  delete headers['content-length'];
  delete headers.connection;
  const replay = await timedRequest(`${serverUrl}${capture.request.path}`, {
    method: capture.request.method, headers, body: capture.request.body
  });
  if (original.body.status !== 'ACCEPTED' || replay.body.reason !== 'NONCE_FAIL') throw new Error('Capture replay did not produce the expected accepted-then-nonce-rejected result');
  const captureHash = crypto.createHash('sha256').update(fs.readFileSync(capturePath)).digest('hex');
  const result = {
    measuredAt: new Date().toISOString(),
    capturePath,
    captureSha256: captureHash,
    capturedRequestMatchedForwardedBody: true,
    attackerReplaySource: 'on-path proxy recording file; no server-written payload file read',
    original: { httpStatus: original.status, outcome: original.body.status, started_ns: original.start_ns, ended_ns: original.end_ns, duration_ns: original.duration_ns },
    replay: { httpStatus: replay.status, reason: replay.body.reason, started_ns: replay.start_ns, ended_ns: replay.end_ns, duration_ns: replay.duration_ns }
  };
  const output = path.join(__dirname, 'results', 'corrections');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'proxy-replay-verification.json'), `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
```

