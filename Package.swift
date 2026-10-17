// swift-tools-version: 6.0
import PackageDescription

// The root manifest lets other repositories (Yun Home) depend on the native
// air conditioner with a normal remote SwiftPM dependency. The CuteAC menu bar
// app in apps/macos is a separate package that consumes this one by path.
let package = Package(
  name: "CuteACKit",
  platforms: [.macOS(.v14)],
  products: [
    // State, limits and the read-only Mac thermal readings. Foundation + IOKit only.
    .library(name: "CuteACCore", targets: ["CuteACCore"]),
    // AppKit drawing shared by every renderer: LCD texture, airflow overlay,
    // palette, Digital-7 font and the CuteAC.usdz model.
    .library(name: "CuteACKit", targets: ["CuteACKit"]),
  ],
  targets: [
    .target(name: "CuteACCore", path: "apps/macos/Kit/Sources/CuteACCore"),
    .target(
      name: "CuteACKit",
      dependencies: ["CuteACCore"],
      path: "apps/macos/Kit/Sources/CuteACKit",
      resources: [
        .copy("Resources/CuteAC.usdz"),
        .copy("Resources/digital-7-mono.ttf"),
      ]
    ),
    .testTarget(name: "CuteACCoreTests", dependencies: ["CuteACCore"], path: "apps/macos/Kit/Tests/CuteACCoreTests"),
    .testTarget(name: "CuteACKitTests", dependencies: ["CuteACKit"], path: "apps/macos/Kit/Tests/CuteACKitTests"),
  ],
  swiftLanguageModes: [.v5]
)
