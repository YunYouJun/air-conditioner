// swift-tools-version: 6.0
import PackageDescription
import Foundation

// HomeDeviceKit stays in the home repository. Support sibling checkouts and
// organization directories; arbitrary locations use HOME_DEVICE_KIT_PATH.
let repository = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
let candidates = [repository.deletingLastPathComponent().appendingPathComponent("home"),
                  repository.deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("YunLeFun/home")]
let connectivityPath = ProcessInfo.processInfo.environment["HOME_DEVICE_KIT_PATH"]
  ?? (candidates.first { FileManager.default.fileExists(atPath: $0.appendingPathComponent("Package.swift").path) } ?? candidates[0]).path

let package = Package(
  name: "CuteAC",
  platforms: [.macOS(.v14)],
  // The shared kit (state, thermal readings, LCD, airflow, model) is the
  // repository root package; Yun Home consumes the same products remotely.
  dependencies: [.package(name: "CuteACKit", path: "../.."),
                 .package(name: "YunHomeConnectivity", path: connectivityPath)],
  targets: [
    .executableTarget(
      name: "CuteAC",
      dependencies: [
        .product(name: "CuteACKit", package: "CuteACKit"),
        .product(name: "ReleaseCheck", package: "CuteACKit"),
        .product(name: "HomeDeviceKit", package: "YunHomeConnectivity"),
      ],
      swiftSettings: [.swiftLanguageMode(.v5)]
    ),
    .testTarget(name: "CuteACTests", dependencies: ["CuteAC", .product(name: "HomeDeviceKit", package: "YunHomeConnectivity")]),
  ],
  swiftLanguageModes: [.v5]
)
