import Foundation

public enum ACMode: String, Codable, CaseIterable, Sendable {
  case cold
  case hot
}

/// Fan speed (风速), as in `@yunlefun-home/air-conditioner-core`. `auto` lets
/// the unit decide; in CuteAC that means following the Mac's own fans.
public enum ACFanSpeed: String, Codable, CaseIterable, Sendable {
  case auto, low, medium, high

  public var label: String {
    switch self {
    case .auto: "自动"
    case .low: "低风"
    case .medium: "中风"
    case .high: "高风"
    }
  }

  /// Wind bars / airflow level 1...3 for the fixed speeds; nil for `auto`.
  public var windLevel: Int? {
    switch self {
    case .auto: nil
    case .low: 1
    case .medium: 2
    case .high: 3
    }
  }
}

/// The last set point of each mode, like a real remote (#39).
public struct ACModeTemperatures: Codable, Equatable, Sendable {
  public var cold: Double
  public var hot: Double

  public init(cold: Double, hot: Double) {
    self.cold = cold
    self.hot = hot
  }

  public subscript(mode: ACMode) -> Double {
    get { mode == .cold ? cold : hot }
    set {
      if mode == .cold { cold = newValue } else { hot = newValue }
    }
  }
}

/// Same state shape and limits as `@yunlefun-home/air-conditioner-core`.
/// The temperature is a `Double` so hosts bound to real devices (Home
/// Assistant) can use fractional steps; the virtual unit steps by 1.
///
/// Decoding is lenient: saves from before `temperatures` and `fan` existed
/// (CuteAC preferences, Yun Home archives) load with both modes at the saved
/// temperature and the fan on auto.
public struct ACState: Codable, Equatable, Sendable {
  public var status = false
  public var mode = ACMode.cold
  /// The current mode's set point. Prefer `setTemperature(_:)`, which keeps
  /// `temperatures` in step; hosts mirroring a real device may set it directly.
  public var temperature = 26.0
  public var temperatures = ACModeTemperatures(cold: 26, hot: 26)
  public var fan = ACFanSpeed.auto

  public static let temperatureRange = 16.0...31.0

  public init(status: Bool = false, mode: ACMode = .cold, temperature: Double = 26, fan: ACFanSpeed = .auto) {
    let clamped = Self.clamp(temperature)
    self.status = status
    self.mode = mode
    self.temperature = clamped
    self.temperatures = ACModeTemperatures(cold: clamped, hot: clamped)
    self.fan = fan
  }

  private enum CodingKeys: String, CodingKey {
    case status, mode, temperature, temperatures, fan
  }

  public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    status = try container.decodeIfPresent(Bool.self, forKey: .status) ?? false
    mode = try container.decodeIfPresent(ACMode.self, forKey: .mode) ?? .cold
    temperature = try container.decodeIfPresent(Double.self, forKey: .temperature) ?? 26
    temperatures = (try? container.decodeIfPresent(ACModeTemperatures.self, forKey: .temperatures))
      ?? ACModeTemperatures(cold: temperature, hot: temperature)
    temperatures[mode] = temperature
    fan = (try? container.decodeIfPresent(ACFanSpeed.self, forKey: .fan)) ?? .auto
  }

  /// Switch mode, remembering this mode's set point and restoring the other's.
  public mutating func setMode(_ newMode: ACMode) {
    guard newMode != mode else { return }
    temperatures[mode] = temperature
    mode = newMode
    temperature = Self.clamp(temperatures[newMode])
  }

  public mutating func setTemperature(_ value: Double) {
    temperature = Self.clamp(value)
    temperatures[mode] = temperature
  }

  /// Airflow level 1...3: the fixed fan speed, or on auto the room's
  /// (the Mac's fans), or 1 without a reading.
  public func windLevel(room: RoomReading?) -> Int {
    fan.windLevel ?? room?.windLevel ?? 1
  }

  /// "26", "26.5": no trailing zeros, at most two decimals.
  public var temperatureLabel: String {
    temperature.formatted(.number.precision(.fractionLength(0...2)).grouping(.never))
  }

  public static func clamp(_ temperature: Double, to range: ClosedRange<Double> = temperatureRange) -> Double {
    min(range.upperBound, max(range.lowerBound, temperature))
  }
}

/// How the unit looks and stands. Behaviour and state are identical; only the
/// model, louver motion and airflow direction differ.
public enum ACForm: String, Codable, CaseIterable, Sendable {
  /// Wall-mounted split unit (挂机): the louver tilts down, air falls.
  case wall
  /// Floor-standing tower (柜机): a tall flap swings aside, air blows sideways.
  case tower

  public var label: String {
    switch self {
    case .wall: "挂机"
    case .tower: "柜机"
    }
  }
}
