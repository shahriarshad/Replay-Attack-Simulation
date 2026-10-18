# Workspace Handoff and Implementation Record

**Purpose:** give a future contributor or AI assistant a concrete, evidence-linked description of the current repository state, the work already completed, the files changed, how the implementation is wired, what was measured, what remains, and which constraints must be respected.

**Workspace:** `D:\CS_Project`  
**Platform:** native Windows 11 for Node.js, Express, SQLite, Memurai, React, Socket.IO, tests, and experiment harnesses. WSL is only the attacker shell for `attack/attack.sh`.  
**Last documented source/test state:** 2026-10-18 local date. Environment measurements and raw run timestamps are in `experiments/results/environment.json` and the result files.  
**Current task boundary:** Phase 0 corrections plus Phases 1, 2, and 3 have been carried out. The user explicitly asked to stop before the full Phase 4 experiment matrix. Phase 5 USSD has not been implemented.

## Read this first

This file is a guide to the current state; it does not replace the source files or raw evidence. The large, generated experiment dossier is [EXPERIMENTS.md](EXPERIMENTS.md). It lists the experiment tree, file sizes and SHA-256 hashes, includes experiment source code, and shows bounded excerpts and aggregate statistics for large results. The API and response claims are summarized in [PROJECT_AUDIT_REPORT.md](../PROJECT_AUDIT_REPORT.md). The threat assumptions and known limitations are [THREAT_MODEL.md](THREAT_MODEL.md) and [LIMITATIONS.md](LIMITATIONS.md).

Important current-state facts:

- The last recorded Windows test run passed **21 tests, 0 failed**. Its full output is `experiments/results/phase3/npm-test.log`.
- The bank UI production build passed. Its output is `experiments/results/phase3/client-build.log`.
- The server was stopped after measurements. Memurai was the Redis-compatible service used: **Memurai Developer 4.2.3**, not stock Redis. Use `REDIS_URL=redis://127.0.0.1:6379`; this service listens on IPv4 only.
- No full Phase 4 run and no Phase 5 USSD work were performed. Do not describe their proposed scenarios as measured results.
- No remote push or history rewrite was performed. The remote history still contains historical secret-bearing material. A documented cleanup procedure exists in `LIMITATIONS.md`; it was not executed.
- `attack/payload.json` has a pre-existing worktree modification. It was preserved and not staged. Treat its signature as stale; do not overwrite it casually.
- `server/.env` is ignored, contains the current rotated local HMAC secret, and must never be printed, committed, or copied into docs. The live value was rotated after recording the proxy request, invalidating that external capture. The file is not tracked.
- Phase 1–3 source edits are still in the working tree and have not been committed. The final observed `git status --short` is described below and recorded as a snapshot in `experiments/results/environment.json`; it is not clean.

## User requirements and operating constraints

These constraints came from the user and remain in force unless the user changes them:

1. Keep the entire application stack native to Windows. Do not move Node, Redis/Memurai, SQLite, either UI, or the server into WSL.
2. WSL is only for the attacker shell. `attack/attack.sh` must keep working there and still expects `jq` in WSL. It must not require Node in WSL.
3. Attack traffic must target only the local simulation. The recording proxy rejects non-local upstream hosts.
4. Do not invent or estimate measurements. Every claimed number must be backed by a saved run. Do not run the large Phase 4 matrix unless asked.
5. Preserve the existing bank UI, dashboard, and attack workflow. Research switches are environment-driven; the visualization and defense defaults remain enabled.
6. Do not print secrets, do not push, do not rewrite Git history, and do not delete user files. `.env`, generated build outputs, dependencies, and `server/db` runtime state are ignored by Git.
7. Treat raw proxy captures as bearer authentication material. The exact proxy capture was kept in a private temporary path outside the repository and is not in the dossier or checksum manifest.

## Repository and Git state

### Backup

Before source edits, the workspace was copied to:

`D:\CS_Project_backup_20261018_032029`

The backup excluded only `node_modules` and `dist`, as requested. It included `.env` files, `server/db`, `attack/payload.json`, and `experiments/`.

### Local commit history created during this work

| Commit | Purpose |
|---|---|
| `27d37ba613d7ab03a88239f7b44f3466541065b7` | Update `.gitignore` and untrack environment/build/dependency/runtime database paths without deleting their on-disk copies. |
| `42d570d0dc218746750498500dbf568f20562528` | Untrack the local `server/.env.example` while preserving it on disk. |
| `4d9eceec78b0474bfad4e8711584268882697561` | Commit Phase 0 corrections, evidence, documentation, and attacker update. |
| `8e2d949` | Commit Phase 0 environment metadata and refreshed dossier/checksums. |

Branch `main` was four commits ahead of `origin/main` at the last check. The remote exists; no new commit was pushed. The remote still points to the earlier history. The earlier cleanup commit removed paths from the current Git index; it did not rewrite prior commits.

The initial staged deletion set contained 9,027 paths. Review found those paths were environment files, `dist/`, `node_modules/`, and `server/db` runtime files, except for one already-missing generated asset: `client/bank/dist/assets/index-Cl8VrRgW.js`. The requested directories/files were otherwise left on disk. A later `git ls-files` check found no tracked `.env`, `server/db`, `dist/`, or `node_modules` paths.

The final worktree before this handoff document was added showed these remaining changes:

```text
 M attack/payload.json
 M client/bank/src/App.jsx
 M client/bank/src/api.js
 M server/package.json
 M server/server.js
 M server/utils/hmac.js
 M server/utils/idempotency.js
 M server/utils/nonce.js
?? package.json
?? server/core.js
?? server/test/
?? server/utils/money-oracle.js
```

`attack/payload.json` was a pre-existing modification and was not changed in this work. The other paths above are the Phase 1–3 working-tree implementation. This handoff document itself is newly added and may appear as an additional untracked path until the user chooses to commit it.

### Secret audit

- The current tracked workspace, `attack/`, `experiments/`, and `docs/` were scanned without printing secret values. No exact current secret substring and no request signature valid under the current secret were found in `attack/`, `experiments/`, or `docs/` at the check.
- The `attack/payload.json` signature is stale after key rotation; do not use it as a valid capture.
- Historical secret-bearing Git content remains reachable in the pre-cleanup history, including commit `10254aa41eb24db15396891830f6864d57584f17`. The cleanup commit `27d37ba...` did not erase it. Existing remote history could therefore already contain that historical material.
- `docs/LIMITATIONS.md` has a step-by-step safe `git filter-repo` procedure for a future coordinated public-repository cleanup. It was not executed. No force-push was performed.
- The bank bundle was rebuilt and checked for the old shared-secret markers; none were found. Do not infer that the default HTTP transport is safe: the login response contains the per-session key, so a network observer of plaintext login traffic could learn it.

## Architecture and request path

### Main components

- **Bank UI:** `client/bank/`, React/Vite, normally served on port 5173 in development or built into ignored `client/bank/dist/`.
- **Bank API:** `server/server.js` starts the Express application implemented in `server/core.js`, normally on port 3000.
- **Visualization:** existing Socket.IO visualization server, started through `server/viz-server.js`, normally on port 3001. Request-path broadcasts and database scans are gated by `VIZ_ENABLED`.
- **Database:** SQLite account and transaction tables. The production database is under ignored `server/db/`; automated tests use per-process temporary databases.
- **Nonce/session service:** Redis protocol client connected to Memurai at `127.0.0.1:6379` in the measured Windows environment.
- **Attacker:** `attack/attack.sh` runs from WSL against Windows `localhost:3000`.
- **Recording proxy:** `experiments/recording-proxy.js` runs on Windows, listens on localhost port 3002 by default, forwards only to a localhost upstream, and writes an exact request envelope to a private capture path.

### Normal transaction pipeline

The UI creates a request body with method, API path, user ID, account ID, integer amount, currency, ISO timestamp, fresh nonce, fresh request ID, and HMAC signature. The canonical HMAC message is a pipe-joined sequence of those fields, in that order. The session signing key is kept in UI module memory and imported into Web Crypto for each signature.

The API validates request shape, checks the account exists and its `account_id` matches, authenticates the bearer session (or the explicit legacy shared-secret path), and checks the session user ID. It then applies the configured replay defenses, followed by an immediate SQLite transaction. A withdrawal debits the balance only when sufficient funds exist. A deposit credits the balance. A successful transaction row is committed with the balance update. The response body for success includes `status`, `amount`, and `newBalance`; rejection bodies use a consistent JSON error or `status`/`reason` shape.

Default defense order is HMAC, timestamp, nonce, request ID, then balance. Timestamp comparisons are inclusive at the configured past/future limits. Nonce acceptance happens before request-ID rejection by default; this is why a valid duplicate request ID with a new nonce still grows the nonce store.

### Login/session behavior

`POST /api/login` receives `{user_id, pin}`. The PIN is stored as a salted scrypt hash in SQLite. Successful login returns a random session token and a random per-session HMAC key. The server stores the token-to-user/key mapping in Redis with the session TTL; the browser keeps the key in JavaScript memory and sends the token as a bearer header. Logout clears client memory and the default authorization header; the server-side session otherwise expires by TTL.

`LEGACY_SHARED_SECRET=true` preserves the legacy signing path for compatible classroom scripts. It is a compatibility switch, not a safe production mode: possession of the shared key permits request forgery. The browser bundle does not contain this shared key.

## Phase 1 implementation record

### Server files

- **`server/server.js`** — now a small executable entry point: require `core.js`, call `start()` when run directly, and export the core module for tests.
- **`server/core.js`** — central Express, SQLite, Redis, login, session, migration, transaction, instrumentation, visualization gating, and route logic. It contains `/api/health`, `/api/login`, `/api/balance/:user_id`, `/api/transactions/:user_id`, `/api/deposit`, `/api/withdraw`, `/api/reset`, and `/api/demo/nonce-crash`, plus an opt-in test-only fault route. The file also validates account ownership/session user matching, normalizes error responses, handles DB migrations, and controls dashboard emission.
- **`server/utils/hmac.js`** — canonical message construction, HMAC-SHA256 generation, and timing-safe signature comparison.
- **`server/utils/idempotency.js`** — considers only `SUCCESS` rows as processed request IDs. A `FAILED` insufficient-balance attempt does not permanently burn the ID; a successful ID remains idempotent.
- **`server/package.json`** — adds the Node built-in test runner command while retaining start/dev/viz commands.

### Browser files

- **`client/bank/src/api.js`** — removes the browser global shared-secret dependency; adds login/logout/session state in module memory, session-key Web Crypto signing, bearer-token defaults, and signed withdraw/deposit payload helpers.
- **`client/bank/src/App.jsx`** — adds user ID and PIN login form and only loads account data after login. Deposit and withdrawal UI components remain in place.
- **`client/bank/.env`** — removed `VITE_HMAC_SECRET`; this ignored local file is not tracked. The production bundle was rebuilt and string-checked.
- **`client/bank/dist/`** — generated build output, ignored by Git. The final build produced `index.html`, `assets/index-BssIyOm9.js`, and `assets/index-Ck-ToPxA.css`.

### Account, deposit, and retry details

- The server checks that `account_id` belongs to `user_id` and that the session bearer token belongs to the same `user_id`.
- Deposit requests use the same signed timestamp/nonce/request-ID processing path when `DEPOSIT_REPLAY_PROTECTION=true`. The explicit false path is legacy behavior and should not be used for measurements of the protected configuration.
- Missing users return `ACCOUNT_NOT_FOUND`, rather than being misreported as a uniqueness/idempotency conflict.
- Error bodies omit `amount` and `newBalance`; accepted transaction bodies include both.
- A transaction table migration replaces the legacy global `UNIQUE(request_id)` constraint with a partial unique index over `request_id WHERE status='SUCCESS'`. Existing transaction rows are copied in a transaction. Failed IDs can be retried; successful IDs cannot be used to debit/credit twice.
- Existing demo reset and nonce-crash endpoints remain for the classroom simulation. They are not production administrative controls.

## Phase 2 instrumentation and switches

### Defense switches

All four defense flags default on. The balance check remains part of transaction processing regardless of these flags.

| Environment variable | Purpose/default |
|---|---|
| `DEFENSE_HMAC` | Enable HMAC validation; defaults true. |
| `DEFENSE_TIMESTAMP` | Enable timestamp validation; defaults true. |
| `DEFENSE_NONCE` | Enable nonce uniqueness; defaults true. |
| `DEFENSE_REQUEST_ID` | Enable successful-request idempotency; defaults true. |
| `CHECK_ORDER` | Default `hmac,timestamp,nonce,request_id,balance`; aliases include `timestamp-first` and `request-id-before-nonce`. |
| `TIMESTAMP_PAST_WINDOW_SECONDS` | Maximum age; defaults 300 seconds. |
| `TIMESTAMP_FUTURE_WINDOW_SECONDS` | Maximum future offset; defaults 5 seconds. |
| `NONCE_STORE` | `redis`, `sqlite`, or `memory`; defaults `redis`. |
| `NONCE_TTL` | Nonce retention in seconds; defaults 300. |
| `NONCE_STORE_FAIL_MODE` | `fail-open` or `fail-closed`; defaults fail-closed. |
| `VIZ_ENABLED` | Controls dashboard emits and per-request database/nonce key scans; defaults true for the demo. Set false for benchmark traffic. |
| `DEMO_MODE` | Controls whether debug-only expected/stored signature information is exposed to visualization; false suppresses signatures. |
| `DEPOSIT_REPLAY_PROTECTION` | Controls the signed deposit path; defaults true. |
| `LEGACY_SHARED_SECRET` | Allows legacy HMAC fallback; defaults true for compatibility. |
| `SESSION_TTL` | Session lifetime; defaults 900 seconds. |
| `EXPERIMENT_LOG` | Optional CSV destination for request/layer timings. |
| `CONFIG_ID`, `SCENARIO_ID`, `RUN_ID` | Labels written into experiment rows. |
| `REDIS_URL` | Redis-protocol endpoint; use `redis://127.0.0.1:6379` with the IPv4-only Memurai service. |

`CHECK_ORDER` recognizes the default explicit list and the two named alternatives. An arbitrary list is normalized by removing unknown entries and appending missing layers. Each disabled layer is marked `skipped` in instrumentation.

### Nonce stores and timing

- **Redis:** uses an atomic NX write with an expiration. The actual Phase 0 memory runs used Memurai Developer 4.2.3.
- **SQLite:** uses a durable table with `(user_id, nonce)` as a unique key and `expires_at` cleanup.
- **Memory:** a process-local map; it is not durable and is unsuitable for multi-process service guarantees.
- **Failure mode:** a backend exception either accepts the nonce as fail-open or rejects with store-unavailable behavior as fail-closed.
- **Timing:** transaction request and layer timings use `process.hrtime.bigint()`. CSV columns include config/scenario/run labels, request start/end/duration, HMAC/timestamp/nonce/request-ID/balance timing, outcome, and HTTP status. Skipped layers are the string `skipped`.

The money-integrity oracle in `server/utils/money-oracle.js` fingerprints signed payload fields, sums successful withdrawals and authorized payload amounts, and reports repeated debit count/amount. A unique signed payload debited more than once is a duplicate debit.

## Phase 3 tests

`npm.cmd test` at the repository root delegates to `npm --prefix server test`, which runs Node's built-in test runner. No Bash, `jq`, or WSL is needed for the Windows test suite.

- **`server/test/unit.test.js`** — canonical HMAC modification rejection; memory nonce uniqueness/expiry; SQLite nonce uniqueness/expiry; fail-open/fail-closed backend behavior; success-only request ID semantics; money-integrity duplicate detection.
- **`server/test/integration.test.js`** — temporary DB and in-memory nonce store; login; account and history lookup; deposit/withdraw validation and success; signature/time/account/session errors; insufficient-balance retry; nonce-crash replay; malformed input; consistent error bodies and test-only unhandled error; 50 identical concurrent payloads; 50 valid distinct nonces sharing one request ID; alternative check orders; timestamp edge and clock offset repetitions. It writes per-request timing CSV/JSON artifacts under `experiments/results/`.
- **`server/test/migration.test.js`** — creates a legacy schema/database, exercises the safe migration, confirms rows survive, and verifies failed-ID retry and successful-ID uniqueness.
- **`server/utils/money-oracle.js`** — supports both tests and measured race reporting.
- **Root `package.json`** — adds the cross-platform `npm test` entry point.

The final saved test transcript reports 21 tests, all passing. The exact log is authoritative; do not infer that every configuration or external store failure has been exercised simply from that test count.

## Phase 0 measurements and exact evidence

The recorded environment file identifies Windows 11 Pro, Node.js 24.11.1, SQLite library 3.44.2, 8 logical CPUs, 7.82 GiB RAM, and Memurai Developer 4.2.3. The health check from WSL to the Windows API returned HTTP 200 and `OK`. At measurement time native ports 3000, 3001, and 6379 were reachable.

### Baseline observations

The baseline run used a signing script that possessed the secret; that run does not represent the modeled network attacker. Baseline results include:

- 50 identical parallel valid requests: 1 accepted and 49 `NONCE_FAIL`.
- Replay after nonce-crash: rejected at request-ID as `ALREADY_PROCESSED`.
- Changed `request_id` with the old signature: HTTP 401 `SIGNATURE_FAIL`.
- 10,000 fresh nonces sent with a previously successful request ID: 0 accepted, 10,000 `ALREADY_PROCESSED`; baseline Redis-compatible key count 10,000 and `used_memory` 2,519,240 bytes. That original run has no recorded duration.
- Original clock offsets: -10 minutes rejected; -1 minute accepted; +10 seconds, +1 minute, and +10 minutes rejected. The future tolerance was 5 seconds.

Baseline evidence is under `experiments/results/baseline/`; see `measured-cases.json`, `nonce-growth-measured.json`, replay/tamper logs, health logs, and `phase0-summary.json`.

### C2 memory runs

Both 100,000-request correction runs used Memurai, an empty namespace baseline, a 24-hour nonce TTL, and `VIZ_ENABLED=false`.

| Run | Empty-store baseline | 1k keys | 10k keys | 100k keys | 100k baseline-subtracted slope | Duration |
|---|---:|---:|---:|---:|---:|---:|
| Accepted transactions | 1,047,648 B | 1,207,648 B | 2,749,408 B | 17,543,968 B | 164.9632 B/key | 915.017261 s |
| Rejected at request-ID | 1,046,880 B | 1,207,200 B | 2,748,960 B | 17,543,968 B | 164.97088 B/key | 208.6483642 s |

The raw request CSVs, summary JSON files, and timing log are in `experiments/results/corrections/`. These runs are nonce-store growth measurements, not claims about 100,000 successful banking operations in the request-ID-rejected case.

### C3 races

- 1,000 batches × 50 identical valid payloads: all 1,000 batches accepted exactly 1 request (`accepted count distribution: {"1":1000}`).
- Secret-holder race with one shared request ID and 50 distinct valid nonce/signature payloads: one accepted debit of 1. Oracle: total debited 1, authorized total 50, duplicate debit amount/count 0, integrity check held.
- Evidence: `race-summary-1000-batches.json`, `race-identical-50x1000-requests.csv`, `race-identical-50x1000-batches.csv`, and `race-same-request-id-50-requests.csv`.

### C4 capture and replay

The Windows Node recording proxy captured the forwarded local request into a private temporary file. The experiment replayed the exact method/path/headers/body from that attacker-side recording, not from a server-generated payload file. Proxy verification JSON records the request outcome and a capture hash without printing the signature. WSL output and the corrected attacker timing CSV are saved under `experiments/results/corrections/`. A later replay after the payload aged beyond the window returned `TIMESTAMP_FAIL`; the earlier in-window proxy validation showed the reused nonce was rejected. The capture itself is deliberately not in the repository because it contains a signature and authorization data.

### C5 timestamp tests

Each case was repeated 30 times with `VIZ_ENABLED=false`. The -5 s and +5 s edges passed; age 299 s and 300 s passed; age 301 s failed; future offset +6 s failed. Thus the first rejected measured age was 301 s and the first rejected future offset was +6 s under the configured 300 s past / 5 s future limits. The five original offsets were also repeated 30 times each: -10 m rejected, -1 m accepted, +10 s/+1 m/+10 m rejected. Raw CSV/JSON files are `timestamp-boundaries-30-each.*` and `clock-offsets-30-each.*` in `experiments/results/corrections/`.

### C6 visualization measurement

One 5,000-request run used `VIZ_ENABLED=true`; the sampled API request latencies were 17.6464 ms at 1 nonce key, 6.579 ms at 100, 21.2299 ms at 1,000, and 23.0343 ms at 5,000. They are nonmonotonic, so this single run does not establish a smooth latency curve. The source does scan keys for visualization when enabled; this is a demo implementation artifact, not a defense property. The complete per-request CSV and summary are `viz-enabled-nonce-scan-requests.csv` and `viz-enabled-nonce-scan-summary.json`.

### C10 WSL cases

WSL outputs include the default attack, continuous replay loop, replay, tampering, invalid CLI/count, malformed payload, and missing-`jq` behavior. They are in `wsl-cli-cases.log`, `wsl-invalid-cases.log`, `wsl-replay.log`, and `wsl-timing-verification.log`. All HTTP requests target `localhost:3000`. WSL has no Node requirement; its attacker timing CSV uses WSL `date +%s%N`, while the Windows server's experiment log records monotonic `process.hrtime.bigint()` request/layer timing for the requests received.

## Phase 0 correction matrix

| ID | What changed or was verified | State/caveat |
|---|---|---|
| C1 | Timed Node experiment requests and Windows server request/layer instrumentation; WSL attacker also emits a request timing CSV. | Historical CSVs have no recoverable timings. WSL's own CSV is wall-clock because Node must not be required there; server monotonic timing is saved separately. |
| C2 | Empty baseline, memory snapshots at 0/1k/10k/100k, bytes/key, run duration and TTL fraction, accepted and request-ID rejected. | Completed; exact outputs above. |
| C3 | Repeated 50-identical race 1,000 times and one-request-ID/50-valid-nonce race with oracle. | Completed; exact outputs above. |
| C4 | Added localhost-only Node recording proxy and replayed the recorded forwarded request from attacker-side capture. | Completed; raw authentication-bearing capture remains outside the repo. |
| C5 | Boundary values and original clock offsets repeated 30 times each. | Completed; exact outputs above. |
| C6 | One VIZ-on run with 5,000 requests and per-request timings. | Completed once; samples noisy/nonmonotonic. |
| C7 | Corrected label for 10,000 request-ID rejects. | Completed in dossier and baseline artifact interpretation. |
| C8 | Stripped BOM, copied restart logs, hashed results, saved commit/status metadata. | No clean Git status was possible while preserving the payload and leaving Phase 1–3 edits uncommitted; environment file explicitly says not clean. |
| C9 | Added attacker distinction, key-holder capability, Memurai identity, and localhost latency limitations. | Completed in threat and limitation documents. |
| C10 | Marked Section 5 responses measured or code-derived and ran remaining listed response paths as integration tests or WSL records. | Completed; source-derived descriptions remain labeled as such. |
| C11 | Added future tolerance sweep (0/5/30/60 s) as an E3 hypothesis. | Documentation only; sweep has not been run. |
| C12 | Generated full experiment dossier with inventory, hashes, code, and bounded large-result excerpts/statistics. | Completed; full raw files remain on disk. |

## Phase 4 and Phase 5 status

The following are **not implemented/run** and must not be described as completed:

- Full Phase 4 matrix: 16 defense ablations, attack scenarios, 30 repetitions per cell, latency/throughput, network delay distributions, failure-mode sweeps, CI calculations, paper figures/tables, and single-command `npm run experiments` orchestration.
- Phase 4 memory growth at 1k/10k/100k is only partially represented by C2 correction runs. That does not complete E4 or the rest of Phase 4.
- Phase 5 `USSD_MODE`, gateway endpoint, session/PIN/sequence state machine, USSD attack cases, and REST-vs-USSD comparison.
- Manual browser/UI flow verification and real-network/TLS evaluation.

The user explicitly said to stop before full Phase 4. Wait for new authorization before starting it.

## Environment variable reference

The authoritative parsing/defaults are in `server/core.js`; this table is a practical orientation. Environment is captured at process startup, so restart the Windows server after changing it.

```text
REDIS_URL=redis://127.0.0.1:6379
LEGACY_SHARED_SECRET=true                 # compatibility default; key is server-only
DEMO_PIN=1234                              # local demo default; change outside isolated demo
SESSION_TTL=900
TIMESTAMP_PAST_WINDOW_SECONDS=300
TIMESTAMP_FUTURE_WINDOW_SECONDS=5
VIZ_ENABLED=true
DEMO_MODE=true
DEPOSIT_REPLAY_PROTECTION=true
DEFENSE_HMAC=true
DEFENSE_TIMESTAMP=true
DEFENSE_NONCE=true
DEFENSE_REQUEST_ID=true
CHECK_ORDER=hmac,timestamp,nonce,request_id,balance
NONCE_STORE=redis                           # redis | sqlite | memory
NONCE_TTL=300
NONCE_STORE_FAIL_MODE=fail-closed           # fail-open | fail-closed
EXPERIMENT_LOG=                             # optional CSV path
CONFIG_ID=default
SCENARIO_ID=unspecified
RUN_ID=unspecified
```

Do not paste a real `.env` file into this document. `server/.env.example` is the local template, ignored/untracked in this workspace; inspect only its non-secret variable names when needed.

## Test and build reproduction

Run from native Windows PowerShell in `D:\CS_Project`:

```powershell
npm.cmd test
npm.cmd --prefix .\client\bank run build
```

The last saved run logs are under `experiments/results/phase3/`. These commands do not run the full Phase 4 experiment suite. The experiment scripts under `experiments/` are individual Phase 0/correction tools, not a completed full-matrix harness.

For WSL attacker work, first confirm the local Windows server is reachable from WSL, make sure WSL has `jq`, and use only `http://localhost:3000`. No Node.js installation in WSL is required. Do not run `attack.sh` against any external host.

## File-by-file change register

This register describes every authored code file added or modified for Phase 0 corrections and Phases 1–3. Generated result files are individually listed by path, bytes, and SHA-256 in `EXPERIMENTS.md` and `experiments/results/SHA256SUMS.json`.

### Application code

| File | Added/updated | Responsibility and notable behavior |
|---|---|---|
| `server/core.js` | Added | Extracted full API implementation from the entry point. Owns env parsing, SQLite schema/migration, PIN hashing/login, Redis-backed session lookup, configurable defense ordering, Redis/SQLite/memory nonce handling, request validation, account ownership, transaction locking, success-only idempotency, dashboard gates, experiment CSV timing, and API routes. |
| `server/server.js` | Updated | Thin native Windows launcher and test import shim that calls `core.start()` only when executed as the main module. |
| `server/utils/hmac.js` | Updated | Canonical pipe-separated HMAC message, SHA-256 generation, and timing-safe signature comparison shared by UI/server tests. |
| `server/utils/idempotency.js` | Updated | A request ID counts as processed only when a matching `SUCCESS` row exists. |
| `server/utils/nonce.js` | Updated | Redis NX/TTL, durable SQLite and process-memory nonce implementations; namespace-aware Redis scans/clears; fail-open/fail-closed wrapper. |
| `server/utils/money-oracle.js` | Added | Fingerprints authorized payloads and computes total debits, authorized totals, duplicate debit count/amount, and a boolean integrity result. |
| `server/package.json` | Updated | Adds `npm test` via Node's built-in test runner. |
| Root `package.json` | Added | Adds a root `npm test` that delegates to the server package. No full `experiments` script was added because Phase 4 was not implemented. |
| `client/bank/src/api.js` | Updated | Removes browser shared secret; stores login result in module memory; signs with the per-session key; sends bearer session token; signs deposit and withdrawal bodies. |
| `client/bank/src/App.jsx` | Updated | Adds user ID/PIN login UI and delays balance/history loading until login succeeds. |
| `attack/attack.sh` | Updated | Reads proxy capture envelopes for replay/tamper, avoids printing signature bytes, preserves replay/capture/tamper/default use, validates invalid input, and emits request timing rows. Its own WSL-side timing uses wall clock; the Windows server log provides monotonic timings. |

### Automated test code

| File | Added | What it verifies |
|---|---|---|
| `server/test/unit.test.js` | Yes | HMAC tampering, nonce uniqueness/expiry in memory and SQLite, fail-open/fail-closed behavior, successful-request idempotency, money oracle behavior. |
| `server/test/integration.test.js` | Yes | Live in-process HTTP integration against temporary SQLite and memory nonce state: login, account/history, deposit/withdraw, malformed and error bodies, ownership/session checks, insufficient retry, nonce-crash replay, concurrency, alternative check order, clock edges and repeated offsets. Saves timing results. |
| `server/test/migration.test.js` | Yes | Builds an old schema and verifies row-preserving migration to partial success-only uniqueness and retry semantics. |

### Experiment and documentation tooling

| File | Added/updated | Responsibility |
|---|---|---|
| `experiments/lib/http.js` | Added | Shared Node `fetch` helper that records monotonic request start/end/duration and parsed response. |
| `experiments/recording-proxy.js` | Added | Local-only HTTP forwarding proxy; records exact forwarded request method/path/headers/body and response metadata. Rejects non-local upstreams. |
| `experiments/send-through-proxy.js` | Added | Drives a signed local request through the proxy, reads the attacker-side capture, and replays the exact captured request to verify replay defenses. Logs hashes/timings without exposing signature contents. |
| `experiments/run-nonce-memory.js` | Added | Measures empty memory baseline, Redis nonce key counts, memory snapshots, TTL and per-request timings for accepted and request-ID-rejected scenarios. |
| `experiments/run-races.js` | Added | Runs repeated parallel identical payload races and the secret-holder shared-request-ID race; records outputs and integrity oracle data. |
| `experiments/run-viz-curve.js` | Added | Runs the one VIZ-enabled 5,000-request measurement and writes every request's monotonic timing plus summary samples. |
| `experiments/render-documentation.js` | Added/updated | Regenerates `docs/EXPERIMENTS.md`, refreshes `SHA256SUMS.json`, enumerates the experiment tree/results, redacts signatures, and summarizes large results while retaining them on disk. |
| `experiments/results/baseline/*.js` | Updated/added in baseline collection | Environment collection and baseline request scripts; corrected scripts record timing where available. Historical raw CSVs remain unchanged where timing was not captured. |
| `experiments/results/*` | Added | Raw baseline and correction runs, test/build logs, per-request CSV/JSON data, restart-log copies, environment metadata, and checksums. Full paths/hashes are in the dossier/manifest. |
| `docs/EXPERIMENTS.md` | Added/updated | Generated full experiment dossier; see its scope and large-result policy at the beginning. |
| `docs/THREAT_MODEL.md` | Added | Attacker capabilities, assets, trust assumptions, leaked-key case, and explicit HTTP/login limitation. |
| `docs/LIMITATIONS.md` | Added | Simulation limits, Memurai/localhost caveats, and an unexecuted safe history-cleanup procedure. |
| `PROJECT_AUDIT_REPORT.md` | Updated | Response case table now identifies measured/code-derived evidence; historical statements were corrected/superseded and verified-run evidence linked. |
| `docs/WORKSPACE_HANDOFF.md` | Added by this documentation request | This stateful handoff: architecture, behavior, exact files, evidence, Git state, constraints, and unrun work. |

### Local configuration and generated outputs

- **`server/.env`**: local ignored file; HMAC secret rotated; `REDIS_URL` must point to `127.0.0.1`. Never display or commit contents.
- **`server/.env.example`**: local template preserved on disk but removed from the index as requested; includes IPv4 Redis guidance and feature switches. It is currently ignored/untracked.
- **`client/bank/.env`**: local ignored file updated to remove `VITE_HMAC_SECRET`; no secret is embedded in the rebuilt bundle.
- **`client/bank/dist/`**: generated build output from the tested UI build; ignored and not tracked.
- **`experiments/results/baseline/reset.json`**: BOM removed so JSON parsing is consistent.
- **Restart logs**: copied to result files before hashing so open server handles would not make the recorded result unreadable.
- **`attack/payload.json`**: preserved pre-existing worktree modification; not part of the Phase 0 artifact commit.

## Detailed route and response notes

| Route | Current purpose | Protection/response notes |
|---|---|---|
| `GET /api/health` | Reachability check. | Plain-text `OK`; used for WSL-to-Windows check. |
| `POST /api/login` | PIN login and session key/token issue. | Bad/missing credentials return login errors. Session storage requires Redis. HTTP is not encrypted by default. |
| `GET /api/balance/:user_id` | Read account data. | Requires matching session or legacy access; missing account is `ACCOUNT_NOT_FOUND`. |
| `GET /api/transactions/:user_id` | Read history. | Requires matching session or legacy access; returns transactions newest first. |
| `POST /api/withdraw` | Debit a balance. | Validates body, account/session, and configured defense pipeline; transaction debit and success row are atomic. |
| `POST /api/deposit` | Credit a balance. | Same signed pipeline by default. Legacy bypass exists only if replay protection flag is explicitly disabled. |
| `POST /api/reset` | Classroom demo reset. | Resets demo account and clears configured nonce store; not a production admin endpoint. |
| `POST /api/demo/nonce-crash` | Simulated nonce-store loss. | Clears nonce state while preserving SQLite transaction IDs; lets tests distinguish nonce replay defense from request-ID idempotency. |
| `GET /__test/unhandled-error` | Test-only error branch. | Only mounted when `ENABLE_TEST_FAULT_ROUTE=true`; returns consistent JSON 500. |

Typical rejection reasons include `INVALID_REQUEST`, `ACCOUNT_NOT_FOUND`, `ACCOUNT_OWNERSHIP_FAIL`, `AUTHENTICATION_REQUIRED`, `SESSION_INVALID`, `SESSION_USER_MISMATCH`, `SIGNATURE_FAIL`, `TIMESTAMP_FAIL`, `NONCE_FAIL`, `ALREADY_PROCESSED`, `INSUFFICIENT_BALANCE`, `NONCE_STORE_UNAVAILABLE`, and `INTERNAL_SERVER_ERROR`. HTTP mappings and measured/source-derived labels are in `PROJECT_AUDIT_REPORT.md`; raw test outputs remain authoritative.

## Deliberate implementation choices and behavior changes

1. The browser no longer signs with a global Vite-injected HMAC secret. It logs in and uses an in-memory session key. This protects the key from being trivially extractable from the static bundle but does not protect against client compromise or plaintext HTTP observation.
2. Deposits now use signatures and replay defenses by default. That closes the former unsigned credit path; a legacy bypass flag remains for controlled demonstrations.
3. A request ID is burned only by a successful transaction. This fixes the permanent failed-attempt retry problem. Same successful ID is rejected even after nonce loss.
4. Account ID and session user must agree with the signed user. Unknown users are explicitly `ACCOUNT_NOT_FOUND`.
5. Past and future timestamp limits are separate settings, defaulting to 300 seconds and 5 seconds.
6. Visualization emits and key/database scans are disabled when `VIZ_ENABLED=false`. When enabled, the single measured curve is only a dashboard implementation cost.
7. Error response contracts use JSON consistently. Successful transactions include `amount` and `newBalance`; failures carry error/reason without those fields.
8. The nonce store and check order are configurable. E1/E2 source and results are now documented in `docs/EXPERIMENTS.md` and `docs/RESULTS_PACK_A.md` after the current run finishes.

## Known risks, caveats, and questions for the next contributor

- **HTTP session-key delivery:** add TLS or a protected transport before interpreting a network attacker as unable to obtain the per-session key. The local HTTP setup does not satisfy that trust assumption.
- **Legacy shared-key mode:** `LEGACY_SHARED_SECRET` remains true by default for demo compatibility. Do not claim a network attacker cannot forge traffic while using the legacy shared key.
- **Single process / SQLite:** current locking and memory nonce mode do not prove multi-instance or distributed correctness.
- **Memurai vs Redis:** measured key memory and timing are Memurai Developer 4.2.3 results, not stock Redis results.
- **Local latency:** all reported request timings are localhost; they are not Internet/mobile-network performance claims.
- **WSL attacker timestamps:** attacker-side CSV uses wall clock because WSL is not required to have Node. Use the corresponding Windows `EXPERIMENT_LOG` for monotonic processing timings.
- **Visualization:** one VIZ-on run is noisy. It documents instrumentation overhead and does not establish a stable performance trend.
- **E1/E2 state:** E1 has been run with 16 defense configurations plus default-window confirmations; E2 is the current authorized run. Consult `docs/RESULTS_PACK_A.md` and the raw run metadata when complete. The E1/E2 runs must not be confused with Phase 0 or the superseded E1 passes.
- **Unrun experiment phases:** E3, E4, and Phase 5 remain unrun. Do not start them without authorization.
- **No USSD mode:** no endpoint, sequence handling, trusted gateway identity, or USSD security comparison exists yet.
- **Git history:** secrets remain in old reachable commits and remote history. Do not rewrite history or force-push without a separate explicit user authorization and coordinated plan.
- **Working tree:** Phase 1–3 and F1–F8 have local commits. Current E1/E2 source and documentation changes may still be uncommitted; inspect `git status --short` before staging. Keep the pre-existing `attack/payload.json` change separate.

## What a future AI should do next

1. Read this handoff, `docs/EXPERIMENTS.md`, `docs/THREAT_MODEL.md`, `docs/LIMITATIONS.md`, the current `git status --short`, and the relevant code before changing anything.
2. Treat the requested Phase 0 corrections and Phases 1–3 as completed, with the evidence and caveats recorded here. The current authorized follow-up includes F1–F8 and E1/E2 only. Do not start E3, E4, or Phase 5.
3. Preserve current `.env` files, `attack/payload.json`, and runtime DB state. Never output secret values or authentication headers.
4. Do not push, rewrite git history, or stage `attack/payload.json`, `.env` files, runtime databases, `dist/`, or `node_modules/`.
5. Run all server and harness work natively on Windows; use WSL only for the explicitly requested local attacker shell. Every reported number must point to a saved raw run.

