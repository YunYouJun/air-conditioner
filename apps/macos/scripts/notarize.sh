#!/usr/bin/env bash
# Notarize and staple a Developer ID signed app, then zip it for release.
#
#   bash apps/macos/scripts/notarize.sh apps/macos/build/CuteAC.app CuteAC-0.4.4.zip
#
# Credentials, in order of preference:
#   NOTARY_KEYCHAIN_PROFILE                          a `xcrun notarytool store-credentials` profile
#   NOTARY_KEY_PATH + NOTARY_KEY_ID + NOTARY_ISSUER  an App Store Connect API key (.p8)
#   NOTARY_KEY_BASE64 instead of NOTARY_KEY_PATH     the same key, base64-encoded (CI secrets)
set -euo pipefail

APP="${1:?usage: notarize.sh APP OUTPUT_ZIP}"
OUTPUT="${2:?usage: notarize.sh APP OUTPUT_ZIP}"
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

ditto -c -k --keepParent "$APP" "$WORK/upload.zip"
SUBMISSION="$WORK/submission.json"
xcrun notarytool submit "$WORK/upload.zip" "${AUTH[@]}" --wait --timeout 30m --output-format json > "$SUBMISSION"
STATUS="$(plutil -extract status raw -o - "$SUBMISSION")"
ID="$(plutil -extract id raw -o - "$SUBMISSION")"
printf 'Notarization %s: %s\n' "$ID" "$STATUS"
if [[ "$STATUS" != Accepted ]]; then
  xcrun notarytool log "$ID" "${AUTH[@]}" >&2 || true
  exit 1
fi

# Staple the ticket so Gatekeeper accepts the app offline, then zip the stapled app.
xcrun stapler staple "$APP"
xcrun stapler validate "$APP"
spctl --assess --type execute --verbose=2 "$APP"
rm -f "$OUTPUT"
ditto -c -k --keepParent "$APP" "$OUTPUT"
printf 'Notarized %s\n' "$OUTPUT"
