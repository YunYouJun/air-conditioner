#!/usr/bin/env bash
# Notarize and staple a Developer ID signed app, then zip it for release.
#
#   bash apps/macos/scripts/notarize.sh apps/macos/build/CuteAC.app CuteAC-0.4.4.zip
#
# Credentials, in order of precedence:
#   NOTARY_KEYCHAIN_PROFILE                            a `xcrun notarytool store-credentials` profile
#   NOTARY_KEY_BASE64 + NOTARY_KEY_ID + NOTARY_ISSUER  base64-encoded Team App Store Connect API key (.p8)
#   NOTARY_KEY_PATH + NOTARY_KEY_ID + NOTARY_ISSUER    file path to the same Team API key (.p8)
set -euo pipefail

APP="${1:?usage: notarize.sh APP OUTPUT_ZIP}"
OUTPUT="${2:?usage: notarize.sh APP OUTPUT_ZIP}"
TIMEOUT="${NOTARY_TIMEOUT:-20m}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

AUTH=()
if [[ -n "${NOTARY_KEYCHAIN_PROFILE:-}" ]]; then
  AUTH=(--keychain-profile "$NOTARY_KEYCHAIN_PROFILE")
else
  if [[ -n "${NOTARY_KEY_BASE64:-}" ]]; then
    NOTARY_KEY_PATH="$WORK/AuthKey.p8"
    (umask 077 && printf '%s' "$NOTARY_KEY_BASE64" | base64 --decode > "$NOTARY_KEY_PATH")
  fi
  if [[ -z "${NOTARY_KEY_PATH:-}" || -z "${NOTARY_KEY_ID:-}" || -z "${NOTARY_ISSUER:-}" ]]; then
    printf 'Notarization credentials are required (see the header of %s).\n' "$0" >&2
    exit 1
  fi
  AUTH=(--key "$NOTARY_KEY_PATH" --key-id "$NOTARY_KEY_ID" --issuer "$NOTARY_ISSUER")
fi

# Apple only accepts hardened-runtime, timestamped Developer ID signatures.
codesign --verify --deep --strict "$APP"
SIGN_INFO="$(codesign -dvv "$APP" 2>&1)"
if ! printf '%s\n' "$SIGN_INFO" | grep -q '^Authority=Developer ID Application:'; then
  printf 'Expected a Developer ID Application signature on %s\n' "$APP" >&2
  exit 1
fi
if ! printf '%s\n' "$SIGN_INFO" | grep -q 'flags=.*(runtime)'; then
  printf 'Expected Hardened Runtime (--options runtime) on %s\n' "$APP" >&2
  exit 1
fi
if ! printf '%s\n' "$SIGN_INFO" | grep -q '^Timestamp='; then
  printf 'Expected a secure timestamp (--timestamp) on %s\n' "$APP" >&2
  exit 1
fi

ditto -c -k --keepParent "$APP" "$WORK/upload.zip"
SUBMISSION="$WORK/submission.json"
xcrun notarytool submit "$WORK/upload.zip" "${AUTH[@]}" --output-format json > "$SUBMISSION"
ID="$(plutil -extract id raw -o - "$SUBMISSION")"
printf 'Submitted notarization %s\n' "$ID"

WAIT_RESULT="$WORK/wait.json"
STATUS="Unknown"
if xcrun notarytool wait "$ID" "${AUTH[@]}" --timeout "$TIMEOUT" --output-format json > "$WAIT_RESULT"; then
  STATUS="$(plutil -extract status raw -o - "$WAIT_RESULT" 2>/dev/null || printf 'Unknown')"
fi
printf 'Notarization %s: %s\n' "$ID" "$STATUS"
if [[ "$STATUS" != Accepted ]]; then
  xcrun notarytool log "$ID" "${AUTH[@]}" >&2 || true
  exit 1
fi

# Staple the ticket so Gatekeeper accepts the app offline, then verify the zipped artifact.
xcrun stapler staple "$APP"
CANDIDATE_ZIP="$WORK/output.zip"
ditto -c -k --keepParent "$APP" "$CANDIDATE_ZIP"

mkdir -p "$WORK/verify"
ditto -x -k "$CANDIDATE_ZIP" "$WORK/verify"
UNPACKED_APP="$WORK/verify/$(basename "$APP")"
xcrun stapler validate "$UNPACKED_APP"
spctl --assess --type execute --verbose=2 "$UNPACKED_APP"
mkdir -p "$(dirname "$OUTPUT")"
mv -f "$CANDIDATE_ZIP" "$OUTPUT"
printf 'Notarized %s\n' "$OUTPUT"
