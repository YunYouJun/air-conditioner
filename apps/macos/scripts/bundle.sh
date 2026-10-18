#!/usr/bin/env bash
# Build a menu-bar-only CuteAC.app into ./build.
set -euo pipefail

cd "$(dirname "$0")/.."
configuration="${CONFIGURATION:-release}"
# Xcode's resource accessor searches Contents/Resources inside the installed
# app. The native SwiftPM backend otherwise falls back to the build directory.
swift build --build-system xcode -c "$configuration"
BIN_DIR="$(swift build --build-system xcode -c "$configuration" --show-bin-path)"

APP=build/CuteAC.app
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BIN_DIR/CuteAC" "$APP/Contents/MacOS/CuteAC"
# Keep SwiftPM resource bundles inside the signed app's resources directory.
cp -R "$BIN_DIR"/*.bundle "$APP/Contents/Resources/"

# The app shares the repository version (bumpp keeps package.json files in
# sync), so a v0.4.0 tag ships CuteAC 0.4.0 and the update check can compare.
VERSION="${VERSION:-$(sed -n 's/^  "version": "\(.*\)",$/\1/p' ../../package.json)}"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key><string>CuteAC</string>
  <key>CFBundleIdentifier</key><string>fun.yunle.cute-ac</string>
  <key>CFBundleName</key><string>CuteAC</string>
  <key>CFBundleDisplayName</key><string>云空调</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>LSMinimumSystemVersion</key><string>14.0</string>
  <key>LSUIElement</key><true/>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSPrincipalClass</key><string>NSApplication</string>
  <key>NSAppTransportSecurity</key><dict><key>NSAllowsLocalNetworking</key><true/></dict>
  <key>NSLocalNetworkUsageDescription</key><string>连接 Home 中已绑定的 Home Assistant 空调。</string>
</dict>
</plist>
PLIST

# Use the same Developer ID identity for every upgrade to preserve Keychain trust.
SIGN_IDENTITY="${CODE_SIGN_IDENTITY:--}"
SIGN_ARGS=(--force --sign "$SIGN_IDENTITY")
if [[ -n "${CODE_SIGN_KEYCHAIN:-}" ]]; then
  SIGN_ARGS+=(--keychain "$CODE_SIGN_KEYCHAIN")
fi
if [[ "$SIGN_IDENTITY" != - ]]; then
  SIGN_ARGS+=(--timestamp)
else
  printf 'Ad-hoc signing: upgrades may require Keychain authorization again.\n' >&2
fi
codesign "${SIGN_ARGS[@]}" --deep "$APP"
codesign --verify --deep --strict "$APP"
echo "Built $PWD/$APP"
