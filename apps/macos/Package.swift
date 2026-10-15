// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "CuteAC",
  platforms: [.macOS(.v14)],
  targets: [
    .executableTarget(
      name: "CuteAC",
      resources: [
        .copy("Resources/CuteAC.usdz"),
        .copy("Resources/digital-7-mono.ttf"),
      ],
      swiftSettings: [.swiftLanguageMode(.v5)]
    ),
  ]
)
