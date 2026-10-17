#!/usr/bin/env bash
# Build a menu-bar-only CuteAC.app into ./build.
set -euo pipefail

cd "$(dirname "$0")/.."
configuration="${CONFIGURATION:-release}"
swift build -c "$configuration"

APP=build/CuteAC.app
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp ".build/$configuration/CuteAC" "$APP/Contents/MacOS/CuteAC"
# SwiftPM resource bundles (the kit's model and font) live next to the binary.
cp -R .build/"$configuration"/*.bundle "$APP/Contents/Resources/"

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

codesign --force --deep --sign - "$APP"
echo "Built $PWD/$APP"
