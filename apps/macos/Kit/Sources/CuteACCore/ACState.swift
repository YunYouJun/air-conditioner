import Foundation

public enum ACMode: String, Codable, CaseIterable, Sendable {
  case cold
  case hot
}

/// Same state shape and limits as `@yunlefun-home/air-conditioner-core`.
/// The temperature is a `Double` so hosts bound to real devices (Home
/// Assistant) can use fractional steps; the virtual unit steps by 1.
public struct ACState: Codable, Equatable, Sendable {
  public var status = false
  public var mode = ACMode.cold
  public var temperature = 26.0

  public static let temperatureRange = 16.0...31.0

  public init(status: Bool = false, mode: ACMode = .cold, temperature: Double = 26) {
    self.status = status
    self.mode = mode
    self.temperature = Self.clamp(temperature)
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
