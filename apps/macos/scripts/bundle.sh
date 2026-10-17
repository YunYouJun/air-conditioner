#!/usr/bin/env bash
# Build a menu-bar-only CuteAC.app into ./build.
set -euo pipefail

cd "$(dirname "$0")/.."
swift build -c release

APP=build/CuteAC.app
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp .build/release/CuteAC "$APP/Contents/MacOS/CuteAC"
# SwiftPM resource bundles (the kit's model and font) live next to the binary.
cp -R .build/release/*.bundle "$APP/Contents/Resources/"

cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key><string>CuteAC</string>
  <key>CFBundleIdentifier</key><string>fun.yunle.cute-ac</string>
  <key>CFBundleName</key><string>CuteAC</string>
  <key>CFBundleDisplayName</key><string>云空调</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>0.1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>14.0</string>
  <key>LSUIElement</key><true/>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

codesign --force --deep --sign - "$APP"
echo "Built $PWD/$APP"
