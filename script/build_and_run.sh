#!/usr/bin/env bash
set -euo pipefail
root_dir="$(cd "$(dirname "$0")/.." && pwd)"
mode="${1:-run}"
case "$mode" in run|--verify|--debug|--logs|--telemetry) ;; *) echo "Usage: $0 [--verify|--debug|--logs|--telemetry]" >&2; exit 2 ;; esac

if [[ -z "${HOME_DEVICE_KIT_PATH:-}" && ! -f "$root_dir/../home/Package.swift" && ! -f "$root_dir/../../YunLeFun/home/Package.swift" ]]; then
  if common_dir="$(git -C "$root_dir" rev-parse --git-common-dir 2>/dev/null)"; then
    main_repo="$(cd "$root_dir" && cd "$common_dir/.." && pwd)"
    for candidate in "$main_repo/../home" "$main_repo/../../YunLeFun/home"; do
      if [[ -f "$candidate/Package.swift" ]]; then
        export HOME_DEVICE_KIT_PATH="$(cd "$candidate" && pwd)"
        break
      fi
    done
  fi
fi

CONFIGURATION=debug bash "$root_dir/apps/macos/scripts/bundle.sh"
app_bundle="$root_dir/apps/macos/build/CuteAC.app"
exe="$app_bundle/Contents/MacOS/CuteAC"

find_pids() {
  ps -axo pid=,comm= | awk -v exe="$exe" '
    {
      pid = $1
      sub(/^[[:space:]]*[0-9]+[[:space:]]+/, "")
      if ($0 == exe) print pid
    }
  '
}

for pid in $(find_pids); do
  kill "$pid" >/dev/null 2>&1 || true
done

if [[ "$mode" == --debug ]]; then exec lldb -- "$exe"; fi
/usr/bin/open -n "$app_bundle" --args --show-popover
pid=""
for _ in 1 2 3 4 5; do
  pid="$(find_pids | head -n 1 || true)"
  if [[ -n "$pid" ]]; then break; fi
  sleep 0.2
done
proc_filter="${pid:+processIdentifier == $pid}"
proc_filter="${proc_filter:-process == \"CuteAC\"}"
case "$mode" in
  --verify)
    sleep 1
    test -n "$(find_pids)"
    echo 'CuteAC launched successfully.'
    ;;
  --logs) /usr/bin/log stream --info --style compact --predicate "$proc_filter" ;;
  --telemetry) /usr/bin/log stream --info --style compact --predicate "$proc_filter && subsystem == \"fun.yunle.cute-ac\"" ;;
esac
