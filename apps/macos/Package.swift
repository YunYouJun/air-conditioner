// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "CuteAC",
  platforms: [.macOS(.v14)],
  // The shared kit (state, thermal readings, LCD, airflow, model) is the
  // repository root package; Yun Home consumes the same products remotely.
  dependencies: [.package(name: "CuteACKit", path: "../..")],
  targets: [
    .executableTarget(
      name: "CuteAC",
      dependencies: [
        .product(name: "CuteACKit", package: "CuteACKit"),
        .product(name: "ReleaseCheck", package: "CuteACKit"),
      ],
      swiftSettings: [.swiftLanguageMode(.v5)]
    ),
  ]
)
