#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUND=1

while true; do
  echo "[EVE] Continuous replay round #$ROUND"
  bash "$SCRIPT_DIR/attack.sh"
  ROUND=$((ROUND + 1))
  sleep 2
done
