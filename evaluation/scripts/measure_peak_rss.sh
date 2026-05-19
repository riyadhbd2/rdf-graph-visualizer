#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  cat <<'EOF'
Usage: measure_peak_rss.sh <PID> [interval_seconds]

Example:
  bash evaluation/scripts/measure_peak_rss.sh 12345 0.2

Reads resident memory (RSS) for the target process repeatedly and prints
the peak observed value in MB when you stop with Ctrl+C.
EOF
  exit 1
fi

PID="$1"
INTERVAL="${2:-0.2}"

if ! ps -p "$PID" >/dev/null 2>&1; then
  echo "PID $PID not found."
  exit 1
fi

peak_kb=0

cleanup() {
  peak_mb=$(awk "BEGIN { printf \"%.2f\", $peak_kb / 1024 }")
  echo
  echo "Peak RSS: ${peak_kb} KB (${peak_mb} MB)"
  exit 0
}

trap cleanup INT TERM

echo "Monitoring PID $PID every ${INTERVAL}s. Press Ctrl+C to stop."

while true; do
  rss_kb="$(ps -o rss= -p "$PID" | tr -d '[:space:]' || true)"
  if [[ -z "${rss_kb}" ]]; then
    echo "Process ended."
    cleanup
  fi
  if (( rss_kb > peak_kb )); then
    peak_kb="$rss_kb"
  fi
  sleep "$INTERVAL"
done
