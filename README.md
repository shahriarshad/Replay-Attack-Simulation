# Banking Replay Attack Mitigation Simulator

Interactive demo of a replay attack against a banking withdraw API and a 5-layer defense:

1. HMAC signature
2. Timestamp freshness
3. Redis nonce
4. SQLite request ID
5. Balance check

This project is for a classroom/demo presentation. It is intentionally simple and visual.

## Prerequisites

- Windows host machine
- Node.js 20+ and npm 10+
- Memurai or Redis running on `localhost:6379`
- WSL2 Ubuntu with `curl` and `jq`
- WSL mirrored networking, so `curl http://localhost:3000` from WSL reaches the Windows host

Verified local environment during build:

- Node.js `v24.11.1`
- Memurai CLI: `C:\Applications\memurai-cli.exe`
- WSL Ubuntu with `curl` and `jq`

## Security Warning

This demo shares the HMAC secret with browser code through `.env` files. That is insecure and must never be done in production.

The reset endpoint `POST /api/reset` and the dashboard RESET DEMO button are also demo-only and insecure. A real bank must never expose an endpoint that resets accounts, deletes transactions, or clears anti-replay state.

## Demo-only Nonce Server Crash / Nonce State Loss

The dashboard control `NONCE SERVER CRASH` and backend endpoint `POST /api/demo/nonce-crash` are a classroom fault-injection simulation only. This is not a real Redis crash; it intentionally clears Redis nonce records matching `used_nonce:*` to simulate loss of nonce-store state.

SQLite transaction rows and `request_id` records are preserved. Because of that, a replay of the same captured withdraw packet can pass HMAC, timestamp, and nonce after the simulated nonce-state loss, then still be rejected by the SQLite Request ID layer with `ALREADY_PROCESSED`. This demonstrates why the SQLite request ID layer provides additional defense-in-depth.

This endpoint/toggle is for classroom demonstration only and must never be exposed in a production banking system.

## Install

Run these once from PowerShell in the project root:

```powershell
cd server
npm.cmd install

cd ..\client\bank
npm.cmd install

cd ..\viz
npm.cmd install
```

## Demo Day Startup Order

Terminal 1, verify Memurai:

```powershell
& "C:\Applications\memurai-cli.exe" ping
```

Expected:

```text
PONG
```

Terminal 2, start the bank API and Socket.io visualization server:

```powershell
cd D:\CS_Project\server
npm.cmd start
```

Expected:

```text
Viz Socket.io server listening on port 3001
Bank server listening on 0.0.0.0:3000
```

Terminal 3, start the bank website:

```powershell
cd D:\CS_Project\client\bank
npm.cmd run dev
```

Open the Vite URL, normally:

```text
http://localhost:5173/
```

Terminal 4, start the visualization dashboard:

```powershell
cd D:\CS_Project\client\viz
npm.cmd run dev
```

Open the Vite URL, normally:

```text
http://localhost:5174/
```

Terminal 5, WSL Eve terminal:

```bash
cd /mnt/d/CS_Project
bash attack/attack.sh
```

## Demo Reset

Before a presentation, open the viz dashboard and click RESET DEMO, or run:

```powershell
curl.exe -s -X POST http://localhost:3000/api/reset
```

This restores:

- `anis_101` balance to `10000 BDT`
- transactions table to empty
- Redis `used_nonce:*` keys to empty
- viz dashboard local state to waiting/zero
- bank website balance and history by Socket.io `reset` refresh

Again: this is demo-only and insecure.

## Demo Script

Scene 1: Anis account

- Open the bank website.
- Show Anis Ahmed balance: `10000 BDT`.
- Open the visualization dashboard in a second tab.
- Click RESET DEMO if needed.

Scene 2: Anis withdraw

- In the bank website, withdraw `1000 BDT`.
- The server writes that exact accepted signed request to `attack/payload.json` for Eve.
- Dashboard should show:
  - `request-received`
  - `check-signature` PASS
  - `check-timestamp` PASS
  - `check-nonce` PASS
  - `check-requestid` PASS
  - `check-balance` PASS
  - `transaction-result` ACCEPTED
  - balance `9000 BDT`

Scene 3: Eve prepares

- Open WSL terminal.
- Show `attack/payload.json`.
- Explain it is the exact signed withdraw payload Anis just sent.

Scene 4: Eve attack

- Run:

```bash
bash attack/attack.sh
```

- Dashboard should show 10 replay attempts:
  - signature PASS
  - timestamp PASS when payload age is at most 300 seconds
  - nonce FAIL for the fresh replay
  - all rejected
  - balance unchanged
- To demonstrate timestamp protection, run the same unmodified payload again after it is older than 300 seconds. Dashboard should show signature PASS, timestamp FAIL, and `TIMESTAMP_FAIL`.

Scene 5: Defense summary

- HMAC protects against tampering.
- Timestamp rejects stale captured traffic.
- Redis nonce blocks short-term replay.
- SQLite request ID blocks long-term duplicate processing.
- Balance check enforces business rules.

## Payload Capture Sync

`attack/payload.json` contains a real signed withdraw request. The normal demo flow refreshes it from a real successful Bank UI withdrawal:

1. Click RESET DEMO.
2. Open the bank website in the browser.
3. Submit a `1000 BDT` withdraw request.
4. Confirm the `Last Withdraw Payload` panel appears.
5. The bank server automatically writes that exact accepted request body to `attack/payload.json`.
6. Run immediately for the nonce-defense replay:

```bash
bash attack/attack.sh
```

This preserves the replay semantics: Eve does not create, timestamp, re-sign, or mutate a request. Eve replays the original `method`, `path`, `user_id`, `account_id`, `amount`, `currency`, `timestamp`, `nonce`, `request_id`, and `signature` that Anis actually sent.

If synchronization did not happen, use the `Last Withdraw Payload` panel as the fallback: copy that JSON into `attack/payload.json`. Backup capture method: open DevTools, Network tab, click the `/api/withdraw` request, and copy the JSON request body.

For the scripted build verification, `payload.json` was generated with the same backend HMAC utility, not a hand-written signature.

`attack/attack.sh` prints the payload age but does not refresh, re-sign, or block old payloads. The server decides the result:

- Fresh replay, age at most 300 seconds: HMAC PASS, timestamp PASS, nonce FAIL, result `NONCE_FAIL`.
- Old replay, age over 300 seconds: HMAC PASS, timestamp FAIL, result `TIMESTAMP_FAIL`.

If the exact same payload is replayed after the Redis nonce TTL expires, the nonce key may be gone and the request ID layer will reject it with `ALREADY_PROCESSED` instead of `NONCE_FAIL`. Both outcomes are correct defense behavior.

One protocol caveat is intentionally left visible for the demo: if Eve has a fresh, unused, correctly signed payload and sends it before Anis does, the server can accept it because it is indistinguishable from the legitimate request under this plan's locked defense order and schema.

## Eve Capture / Replay / Tamper Demo

Start Eve's capture watcher from WSL:

```bash
cd /mnt/d/CS_Project
bash attack/attack.sh --capture
```

Then perform a successful Anis withdraw in the Bank UI. Eve watches the existing synchronized capture artifact at `attack/payload.json`; this is a controlled classroom capture simulation, not raw network sniffing. When the server syncs the exact accepted request, Eve prints `NEW WITHDRAW PACKET CAPTURED` and saves an unchanged copy to `/tmp/eve-captured.json`.

Replay the exact captured request:

```bash
bash attack/attack.sh --replay
```

For a fresh capture, the server should show HMAC PASS, timestamp PASS, nonce FAIL, and return `NONCE_FAIL`. After the same unchanged captured request naturally ages beyond 300 seconds, run the same replay command again; the server should show HMAC PASS, timestamp FAIL, and return `TIMESTAMP_FAIL`.

Tamper with the amount while preserving the original signature:

```bash
bash attack/attack.sh --tamper-amount 2000
```

This writes a temporary modified copy to `/tmp/eve-tampered.json`, changes only `amount`, and does not recompute the HMAC. The original `timestamp`, `nonce`, `request_id`, and `signature` are preserved, so the server should reject immediately at HMAC with `SIGNATURE_FAIL`.

## API Endpoints

- `GET /api/health`
- `GET /api/balance/:user_id`
- `GET /api/transactions/:user_id`
- `POST /api/deposit`
- `POST /api/withdraw`
- `POST /api/reset` demo-only/insecure
- `POST /api/demo/nonce-crash` demo-only/insecure

## HMAC Message

The message is pipe-separated with this exact order:

```text
method|path|user_id|account_id|amount|currency|timestamp|nonce|request_id
```

Example:

```text
POST|/api/withdraw|anis_101|acc_777|1000|BDT|2026-09-21T06:19:35.701Z|phase5_nonce_accept_001|phase5_wd_accept_001
```

## Defense Order for POST /api/withdraw

1. HMAC
2. Timestamp, 300 second window
3. Nonce, Redis `SET NX EX 300`
4. Request ID, SQLite `transactions.request_id`
5. Balance

Rejection reasons:

- `SIGNATURE_FAIL`
- `TIMESTAMP_FAIL`
- `NONCE_FAIL`
- `ALREADY_PROCESSED`
- `INSUFFICIENT_BALANCE`

## Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| WSL cannot access localhost | Server bound to `127.0.0.1` | Bank server binds with `app.listen(3000, '0.0.0.0')` |
| Redis connection error | Memurai/Redis is not running | Run `& "C:\Applications\memurai-cli.exe" ping` and start the service |
| CORS error | Frontend-backend on different ports | Server uses `cors()` and Socket.io CORS `origin: '*'` |
| Signature mismatch | Fixed order is not correct | Join with pipe `|` in the exact HMAC order |
| SQLite locked | Concurrent access | WAL mode is enabled with `PRAGMA journal_mode = WAL` |
| Socket.io not connecting | Wrong port | Clients connect to `ws://localhost:3001` |
| Replay returns `TIMESTAMP_FAIL` | Captured payload older than 300 seconds | Correct for timestamp-defense demo; refresh with a new successful Bank UI withdraw for nonce-defense demo |
| `jq: command not found` in WSL | `jq` missing in active Ubuntu distro | Install `jq` in WSL |

## Assumptions

- The implementation is placed directly under `D:\CS_Project` because the workspace is the project root.
- The available plan file was `C:\Users\Home\Downloads\Banking_Replay_Attack_Project_Plan_EN.md`; no workspace plan file existed at build start.
- `server.js` starts the Socket.io visualization server by importing `viz-server.js`, so one backend command runs both port `3000` and port `3001`.
- Exact dependency versions are pinned in `package.json` files to satisfy the lock.
- `sqlite3` installed successfully on Node 24, so `better-sqlite3` was not used.
- Browser code cannot read `server/.env`, so `client/bank/.env` mirrors the demo HMAC secret through `VITE_HMAC_SECRET`.
- `socket.io-client` was added to the bank client after the approved reset scope addition so the bank website can refresh on Socket.io `reset`.
- `POST /api/reset` and Socket.io `reset` are approved scope additions and are demo-only.
- Fix A keeps malformed withdraw amount and timestamp validation before the HMAC layer and returns `400 {"error":"INVALID_REQUEST"}` with no check-layer events.
- Fix B allows only normal clock skew from 5 seconds in the future through 300 seconds in the past.
- Fix C keeps the balance read, balance check, debit, and success transaction insert inside one serialized immediate SQLite transaction.
- Fix D maps SQLite constraint races in deposit and withdraw to `409 ALREADY_PROCESSED`.
- `attack/attack.sh` prints payload age and always sends the exact captured payload to the server; the timestamp defense is demonstrated by server-side `TIMESTAMP_FAIL`.
- Accepted withdraws are synchronized to `attack/payload.json` by the server after commit so Windows and WSL share the latest exact captured request through `D:\CS_Project` / `/mnt/d/CS_Project`.

## Final Consistency Report

| Item | Required | Implemented |
|---|---|---|
| Bank server port | `0.0.0.0:3000` | `server/server.js` uses `app.listen(PORT, HOST)` with `.env` `HOST=0.0.0.0`, `PORT=3000` |
| Viz Socket.io port | `3001` | `server/viz-server.js` starts Socket.io on `.env` `VIZ_PORT=3001` |
| Dashboard Socket.io URL | `ws://localhost:3001` | `client/viz/src/socket.js` |
| Bank reset Socket.io URL | `ws://localhost:3001` | `client/bank/src/socket.js` |
| HMAC message | `method|path|user_id|account_id|amount|currency|timestamp|nonce|request_id` | `server/utils/hmac.js` and `client/bank/src/api.js` |
| Redis nonce key | `used_nonce:{user_id}:{nonce}` | `server/utils/nonce.js` |
| Redis command behavior | `SETNX` with `EX 300` | `redisClient.set(key, '1', { NX: true, EX: 300 })` |
| Accounts schema | `user_id`, `username`, `balance`, `currency`, `created_at` | `server/server.js` database initialization |
| Transactions schema | `id`, `request_id`, `user_id`, `account_id`, `type`, `amount`, `currency`, `status`, `reason`, `signature`, `created_at` | `server/server.js` database initialization |
| Initial row | `anis_101`, `Anis Ahmed`, `10000 BDT` | `INSERT OR IGNORE` in `server/server.js`; reset restores same values |
| WAL mode | Enabled | `PRAGMA journal_mode = WAL` |
| `GET /api/health` | Present | `server/server.js` returns `OK` |
| `GET /api/balance/:user_id` | Present | `server/server.js` |
| `GET /api/transactions/:user_id` | Present | `server/server.js` |
| `POST /api/deposit` | Present | `server/server.js` |
| `POST /api/withdraw` | Present | `server/server.js` |
| `POST /api/reset` | Approved demo-only addition | `server/server.js` |
| `POST /api/demo/nonce-crash` | Demo-only nonce-state loss simulation | `server/server.js` clears only `used_nonce:*` keys and emits `redis-update` |
| Withdraw order | HMAC, Timestamp, Nonce, Request ID, Balance | `server/server.js` implements in that order |
| Reject reasons | Exact strings | `SIGNATURE_FAIL`, `TIMESTAMP_FAIL`, `NONCE_FAIL`, `ALREADY_PROCESSED`, `INSUFFICIENT_BALANCE` |
| `request-received` | Emit and listen | `server/server.js` emits, `client/viz/src/socket.js` listens |
| `check-signature` | Emit and listen | `server/server.js` emits, `client/viz/src/socket.js` listens |
| `check-timestamp` | Emit and listen | `server/server.js` emits, `client/viz/src/socket.js` listens |
| `check-nonce` | Emit and listen | `server/server.js` emits, `client/viz/src/socket.js` listens |
| `check-requestid` | Emit and listen | `server/server.js` emits, `client/viz/src/socket.js` listens |
| `check-balance` | Emit and listen | `server/server.js` emits, `client/viz/src/socket.js` listens |
| `transaction-result` | Emit and listen | `server/server.js` emits, `client/viz/src/socket.js` listens |
| `db-update` | Emit and listen | `server/server.js` emits, `client/viz/src/socket.js` listens |
| `redis-update` | Emit and listen | `server/server.js` emits, `client/viz/src/socket.js` listens |
| `reset` | Approved demo-only addition | `server/server.js` emits, both clients listen |
| Attack script shell | Pure bash/LF | `attack/attack.sh`, `attack/attack-loop.sh`; verified with `wsl bash -n` |
| Attack target | `localhost:3000` from WSL | `attack/attack.sh` |
| Captured payload | Real signed JSON | `attack/payload.json`; verified with backend HMAC utility |
