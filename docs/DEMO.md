# Classroom Demo: Record and Replay a Withdrawal

This runbook uses the local bank simulation only. The capture proxy records full request headers and bodies, including bearer authorization and HMAC signatures. Keep its capture file private and delete it after the classroom demonstration.

## Requirements

- Windows: Node.js dependencies installed in the project, Memurai Developer 4.2.3 service running, and `C:\Applications\memurai-cli.exe` available.
- WSL: `curl`, `jq`, and this repository mounted/accessed from WSL.
- All services and attack traffic target the same local Windows simulation.

## 1. Check Memurai

In Windows PowerShell:

```powershell
& 'C:\Applications\memurai-cli.exe' ping
```

Expected output: `PONG`. The configured Redis URL must use IPv4 because this Memurai instance does not listen on `::1`:

```text
REDIS_URL=redis://127.0.0.1:6379
```

Keep the setting in `server/.env`; do not use `localhost` for Redis on this host.

## 2. Start the bank server and dashboard

In a Windows PowerShell window:

```powershell
cd D:\CS_Project\server
npm.cmd start
```

The server uses port 3000 and the Socket.IO dashboard server uses port 3001. Keep the server window open. In a second PowerShell window, verify:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

## 3. Start the bank UI

In another PowerShell window:

```powershell
cd D:\CS_Project\client\bank
$env:VITE_API_BASE_URL='http://127.0.0.1:3002'
npm.cmd run dev -- --host 127.0.0.1
```

Open the Vite URL printed by the command (normally `http://127.0.0.1:5173`). By default the UI calls the server directly on port 3000. To record the browser's requests through the proxy, start Vite with `VITE_API_BASE_URL=http://127.0.0.1:3002` set before `npm.cmd run dev`.

## 4. Log in

The seeded classroom user is `anis_101`; the associated account is `acc_777`. If `DEMO_PIN` is unset, the server uses the demo PIN `1234`. Set `DEMO_PIN` in `server/.env` before launching the server if a different classroom PIN is needed. The app requests the PIN on its login screen. Session keys are returned to and kept in the browser's memory for request signing.

## 5. Start the recording proxy

Use a private capture destination outside the repository. In another PowerShell window:

```powershell
$env:PROXY_PORT='3002'
$env:PROXY_UPSTREAM='http://127.0.0.1:3000'
$env:PROXY_CAPTURE_FILE="$env:TEMP\cs-project-demo-capture.json"
cd D:\CS_Project
node experiments\recording-proxy.js
```

Start/restart the UI with `VITE_API_BASE_URL=http://127.0.0.1:3002` if it was not configured earlier. Log in and submit a small withdrawal in the bank UI. The capture file is replaced after each completed proxied request; the adjacent `.jsonl` file accumulates requests. The proxy also keeps the latest POST `/api/withdraw` as `cs-project-demo-capture.json.withdraw.json`, so balance/history refreshes cannot replace the withdrawal recording. For WSL, use the corresponding mounted Windows temp path (commonly `/mnt/c/Users/Home/AppData/Local/Temp/cs-project-demo-capture.json.withdraw.json`) as `CAPTURE_FILE`. Save/record the withdrawal only after it succeeds. The capture files contain the session key (login response), bearer token, and request signature; do not share them or put them in Git.

## 6. Replay from WSL

From WSL, using the repository's WSL path (for example `/mnt/d/CS_Project`):

```bash
cd /mnt/d/CS_Project
CAPTURE_FILE=/mnt/c/Users/Home/AppData/Local/Temp/cs-project-demo-capture.json.withdraw.json bash attack/attack.sh --replay 1
```

The captured withdrawal has already been accepted once. An exact replay should be rejected by the nonce defense (or the request-ID defense if nonce state has expired/been cleared). `attack.sh` uses `jq` in WSL. If WSL cannot reach the Windows localhost endpoint, check WSL networking mode, the Windows host IP, and Windows Firewall; do not move the server or Redis into WSL.

## Cleanup

Stop Vite, the proxy, and the server with Ctrl+C. Remove the private capture and its JSONL companion after the demo:

```powershell
Remove-Item -LiteralPath "$env:TEMP\cs-project-demo-capture.json" -Force
Remove-Item -LiteralPath "$env:TEMP\cs-project-demo-capture.json.jsonl" -Force
Remove-Item -LiteralPath "$env:TEMP\cs-project-demo-capture.json.withdraw.json" -Force
```

This runbook describes a simulation. It does not describe or claim compatibility with any real bank, telecom operator, or mobile financial service.





