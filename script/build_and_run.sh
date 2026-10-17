#!/usr/bin/env bash
set -euo pipefail
root_dir="$(cd "$(dirname "$0")/.." && pwd)"
mode="${1:-run}"
case "$mode" in run|--verify|--debug|--logs|--telemetry) ;; *) echo "Usage: $0 [--verify|--debug|--logs|--telemetry]" >&2; exit 2 ;; esac
pkill -x CuteAC >/dev/null 2>&1 || true
CONFIGURATION=debug bash "$root_dir/apps/macos/scripts/bundle.sh"
app_bundle="$root_dir/apps/macos/build/CuteAC.app"
if [[ "$mode" == --debug ]]; then exec lldb -- "$app_bundle/Contents/MacOS/CuteAC"; fi
/usr/bin/open -n "$app_bundle" --args --show-popover
case "$mode" in
  --verify) sleep 1; pgrep -x CuteAC >/dev/null; echo 'CuteAC launched successfully.' ;;
  --logs) /usr/bin/log stream --info --style compact --predicate 'process == "CuteAC"' ;;
  --telemetry) /usr/bin/log stream --info --style compact --predicate 'subsystem == "fun.yunle.cute-ac"' ;;
esac
