import Foundation
import IOKit

/// One fan as reported by the SMC.
struct FanSample: Equatable {
  var rpm: Double
  var minRPM: Double
  var maxRPM: Double

  /// 0 when stopped or at its floor, 1 at full speed.
  var load: Double {
    guard maxRPM > minRPM, rpm > 0 else { return 0 }
    return min(1, max(0, (rpm - minRPM) / (maxRPM - minRPM)))
  }
}

/// Read-only access to CPU/SoC temperature and fan speed. Everything here is
/// unprivileged: Apple Silicon die temperatures come from the HID event
/// system (private API, looked up at runtime), Intel temperatures and all fan
/// readings from the SMC. Nothing is ever written to the hardware.
///
/// Not thread-safe; `ThermalMonitor` only calls it from one serial queue.
final class ThermalSensors {
  private let hid = HIDTemperatureSensors()
  private let smc = SMCConnection()
  private lazy var fanCount: Int = smc.map { Int($0.read("FNum") ?? 0) } ?? 0

  /// Average CPU/SoC die temperature in °C, or nil when no sensor is readable.
  func cpuTemperature() -> Double? {
    if let celsius = hid?.averageCelsius() {
      return celsius
    }
    // Intel: CPU proximity / die keys, first one that answers wins.
    for key in ["TC0P", "TC0D", "TC0E", "TC0F", "TCXC"] {
      if let celsius = smc?.read(key), celsius > 0 {
        return celsius
      }
    }
    return nil
  }

  /// Empty on fanless Macs (e.g. MacBook Air).
  func fans() -> [FanSample] {
    guard let smc, fanCount > 0 else { return [] }
    return (0..<fanCount).compactMap { index in
      guard let rpm = smc.read("F\(index)Ac") else { return nil }
      return FanSample(
        rpm: rpm,
        minRPM: smc.read("F\(index)Mn") ?? 0,
        maxRPM: smc.read("F\(index)Mx") ?? 0
      )
    }
  }
}

// MARK: - Apple Silicon (HID event system)

/// The SoC exposes its thermal diodes as HID services on vendor usage page
/// 0xff00, usage 5. The functions are exported by IOKit but not declared in
/// the SDK, so they are resolved with `dlsym`; if Apple ever removes them the
/// initializer simply fails and the app shows no temperature.
private final class HIDTemperatureSensors {
  private typealias CreateClient = @convention(c) (CFAllocator?) -> Unmanaged<CFTypeRef>?
  private typealias SetMatching = @convention(c) (CFTypeRef, CFDictionary) -> Int32
  private typealias CopyServices = @convention(c) (CFTypeRef) -> Unmanaged<CFArray>?
  private typealias CopyProperty = @convention(c) (CFTypeRef, CFString) -> Unmanaged<CFTypeRef>?
  private typealias CopyEvent = @convention(c) (CFTypeRef, Int64, Int32, Int64) -> Unmanaged<CFTypeRef>?
  private typealias GetFloatValue = @convention(c) (CFTypeRef, Int32) -> Double

  private static let temperatureEvent: Int64 = 15 // kIOHIDEventTypeTemperature
  private static let temperatureField = Int32(15 << 16)

  private let client: CFTypeRef
  private let services: [CFTypeRef]
  private let copyEvent: CopyEvent
  private let getFloatValue: GetFloatValue

  init?() {
    guard let iokit = dlopen("/System/Library/Frameworks/IOKit.framework/IOKit", RTLD_LAZY),
          let create = Self.symbol("IOHIDEventSystemClientCreate", in: iokit, as: CreateClient.self),
          let setMatching = Self.symbol("IOHIDEventSystemClientSetMatching", in: iokit, as: SetMatching.self),
          let copyServices = Self.symbol("IOHIDEventSystemClientCopyServices", in: iokit, as: CopyServices.self),
          let copyProperty = Self.symbol("IOHIDServiceClientCopyProperty", in: iokit, as: CopyProperty.self),
          let copyEvent = Self.symbol("IOHIDServiceClientCopyEvent", in: iokit, as: CopyEvent.self),
          let getFloatValue = Self.symbol("IOHIDEventGetFloatValue", in: iokit, as: GetFloatValue.self),
          let client = create(kCFAllocatorDefault)?.takeRetainedValue()
    else { return nil }

    let matching = ["PrimaryUsagePage": 0xFF00, "PrimaryUsage": 5] as CFDictionary
    _ = setMatching(client, matching)
    let all = (copyServices(client)?.takeRetainedValue() as? [CFTypeRef]) ?? []

    // Keep only the CPU cluster / die diodes: "PMU tdie*" on M1, "pACC/eACC
    // MTR Temp Sensor*" on later chips. Battery, NAND and GPU sensors would
    // pull the average around for reasons the user does not care about.
    var dies: [CFTypeRef] = []
    var clusters: [CFTypeRef] = []
    for service in all {
      guard let name = copyProperty(service, "Product" as CFString)?.takeRetainedValue() as? String else { continue }
      if name.contains("tdie") {
        dies.append(service)
      }
      else if name.hasPrefix("pACC") || name.hasPrefix("eACC") {
        clusters.append(service)
      }
    }
    let services = dies.isEmpty ? clusters : dies
    guard !services.isEmpty else { return nil }

    self.client = client
    self.services = services
    self.copyEvent = copyEvent
    self.getFloatValue = getFloatValue
  }

  func averageCelsius() -> Double? {
    var total = 0.0
    var count = 0
    for service in services {
      guard let event = copyEvent(service, Self.temperatureEvent, 0, 0)?.takeRetainedValue() else { continue }
      let value = getFloatValue(event, Self.temperatureField)
      // Idle diodes occasionally report 0 or garbage; ignore those.
      if value > 5, value < 130 {
        total += value
        count += 1
      }
    }
    return count > 0 ? total / Double(count) : nil
  }

  private static func symbol<T>(_ name: String, in handle: UnsafeMutableRawPointer, as type: T.Type) -> T? {
    guard let pointer = dlsym(handle, name) else { return nil }
    return unsafeBitCast(pointer, to: type)
  }
}

// MARK: - SMC

/// Mirrors `SMCKeyData_t` from Apple's (unpublished) AppleSMC user client.
/// Swift lays a nested struct out by its size rather than its stride, so the
/// explicit `padding` keeps `result` at offset 40 like the C struct.
private struct SMCKeyData {
  struct Version {
    var major: UInt8 = 0
    var minor: UInt8 = 0
    var build: UInt8 = 0
    var reserved: UInt8 = 0
    var release: UInt16 = 0
  }

  struct PowerLimits {
    var version: UInt16 = 0
    var length: UInt16 = 0
    var cpuLimit: UInt32 = 0
    var gpuLimit: UInt32 = 0
    var memLimit: UInt32 = 0
  }

  struct KeyInfo {
    var dataSize: UInt32 = 0
    var dataType: UInt32 = 0
    var dataAttributes: UInt8 = 0
  }

  var key: UInt32 = 0
  var version = Version()
  var powerLimits = PowerLimits()
  var keyInfo = KeyInfo()
  var padding: UInt16 = 0
  var result: UInt8 = 0
  var status: UInt8 = 0
  var command: UInt8 = 0
  var data32: UInt32 = 0
  var bytes: (
    UInt8, UInt8, UInt8, UInt8, UInt8, UInt8, UInt8, UInt8,
    UInt8, UInt8, UInt8, UInt8, UInt8, UInt8, UInt8, UInt8,
    UInt8, UInt8, UInt8, UInt8, UInt8, UInt8, UInt8, UInt8,
    UInt8, UInt8, UInt8, UInt8, UInt8, UInt8, UInt8, UInt8
  ) = (
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  )
}

/// Read-only SMC client. Only the read and key-info commands are ever sent.
private final class SMCConnection {
  private static let kernelIndex: UInt32 = 2
  private static let readKey: UInt8 = 5
  private static let getKeyInfo: UInt8 = 9

  private let connection: io_connect_t
  private var keyInfoCache: [UInt32: SMCKeyData.KeyInfo] = [:]

  init?() {
    assert(MemoryLayout<SMCKeyData>.size == 80, "SMCKeyData must match the 80-byte C struct")
    let service = IOServiceGetMatchingService(kIOMainPortDefault, IOServiceMatching("AppleSMC"))
    guard service != 0 else { return nil }
    defer { IOObjectRelease(service) }
    var connection: io_connect_t = 0
    guard IOServiceOpen(service, mach_task_self_, 0, &connection) == kIOReturnSuccess else { return nil }
    self.connection = connection
  }

  deinit {
    IOServiceClose(connection)
  }

  /// Decodes the numeric types CuteAC needs; nil for unknown keys or types.
  func read(_ key: String) -> Double? {
    let code = Self.fourCharCode(key)
    guard let info = keyInfo(for: code) else { return nil }

    var input = SMCKeyData()
    input.key = code
    input.keyInfo.dataSize = info.dataSize
    input.command = Self.readKey
    guard let output = call(&input), output.result == 0 else { return nil }

    let size = Int(min(info.dataSize, 32))
    let bytes = withUnsafeBytes(of: output.bytes) { Array($0.prefix(size)) }
    return Self.decode(bytes, type: Self.fourCharString(info.dataType))
  }

  private func keyInfo(for code: UInt32) -> SMCKeyData.KeyInfo? {
    if let cached = keyInfoCache[code] { return cached }
    var input = SMCKeyData()
    input.key = code
    input.command = Self.getKeyInfo
    guard let output = call(&input), output.result == 0, output.keyInfo.dataSize > 0 else { return nil }
    keyInfoCache[code] = output.keyInfo
    return output.keyInfo
  }

  private func call(_ input: inout SMCKeyData) -> SMCKeyData? {
    var output = SMCKeyData()
    var outputSize = MemoryLayout<SMCKeyData>.stride
    let status = IOConnectCallStructMethod(
      connection,
      Self.kernelIndex,
      &input,
      MemoryLayout<SMCKeyData>.stride,
      &output,
      &outputSize
    )
    return status == kIOReturnSuccess ? output : nil
  }

  private static func decode(_ bytes: [UInt8], type: String) -> Double? {
    func bigEndian16() -> UInt16? {
      bytes.count >= 2 ? UInt16(bytes[0]) << 8 | UInt16(bytes[1]) : nil
    }
    switch type {
    case "flt ": // Apple Silicon: little-endian Float32
      guard bytes.count >= 4 else { return nil }
      let bits = UInt32(bytes[0]) | UInt32(bytes[1]) << 8 | UInt32(bytes[2]) << 16 | UInt32(bytes[3]) << 24
      return Double(Float(bitPattern: bits))
    case "fpe2": // Intel fans: unsigned 14.2 fixed point
      return bigEndian16().map { Double($0) / 4 }
    case "sp78": // Intel temperatures: signed 7.8 fixed point
      return bigEndian16().map { Double(Int16(bitPattern: $0)) / 256 }
    case "ui8 ":
      return bytes.first.map(Double.init)
    case "ui16":
      return bigEndian16().map(Double.init)
    default:
      return nil
    }
  }

  private static func fourCharCode(_ string: String) -> UInt32 {
    string.utf8.prefix(4).reduce(0) { $0 << 8 | UInt32($1) }
  }

  private static func fourCharString(_ code: UInt32) -> String {
    let bytes = [24, 16, 8, 0].map { UInt8((code >> $0) & 0xFF) }
    return String(decoding: bytes, as: UTF8.self)
  }
}
