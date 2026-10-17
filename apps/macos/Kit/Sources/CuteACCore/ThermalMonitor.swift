import Combine
import Foundation

/// `ProcessInfo.ThermalState` as a Codable value, so a reading can cross a
/// process boundary (e.g. to a Yun Home plugin) as JSON.
public enum ThermalLevel: String, Codable, Sendable {
  case nominal, fair, serious, critical

  public init(_ state: ProcessInfo.ThermalState) {
    switch state {
    case .fair: self = .fair
    case .serious: self = .serious
    case .critical: self = .critical
    default: self = .nominal
    }
  }

  /// Short Chinese label used by every UI that shows the reading.
  public var label: String {
    switch self {
    case .nominal: "散热正常"
    case .fair: "有点热"
    case .serious: "很热"
    case .critical: "过热"
    }
  }
}

/// The Mac seen as the AC's "room": CPU/SoC temperature, the system thermal
/// state and how hard the fans are blowing. Values are rounded so the UI only
/// redraws when something visible changes.
public struct RoomReading: Codable, Equatable, Sendable {
  public var celsius: Int?
  public var thermalState: ThermalLevel
  /// Fastest fan, rounded to 100 RPM; nil on fanless Macs.
  public var fanRPM: Int?
  /// AC-style wind speed, 1...3. Comes from fan load when there are fans,
  /// otherwise from the thermal state.
  public var windLevel: Int

  public static let windLevels = 1...3

  /// Fixed reading for snapshots and demo captures, so docs images do not
  /// depend on how warm the machine happened to be.
  public static let demo = RoomReading(celsius: 48, thermalState: .nominal, fanRPM: 1500, windLevel: 1)

  public init(celsius: Int?, thermalState: ThermalLevel, fanRPM: Int?, windLevel: Int) {
    self.celsius = celsius
    self.thermalState = thermalState
    self.fanRPM = fanRPM
    self.windLevel = windLevel
  }

  public init(celsius: Double?, thermalState: ThermalLevel, fans: [FanSample]) {
    let fastest = fans.max { $0.rpm < $1.rpm }
    let level: Int
    if let load = fans.map(\.load).max() {
      level = load < 0.25 ? 1 : load < 0.6 ? 2 : 3
    }
    else {
      switch thermalState {
      case .nominal: level = 1
      case .fair: level = 2
      default: level = 3
      }
    }
    self.init(
      celsius: celsius.map { Int($0.rounded()) },
      thermalState: thermalState,
      fanRPM: fastest.map { Int(($0.rpm / 100).rounded()) * 100 },
      windLevel: level
    )
  }
}

/// Samples `ThermalSensors` on a background queue, but only while the host
/// says something showing it is on screen (`setActive`); otherwise it does no
/// work at all. Thermal-state changes are pushed by the system and always
/// observed.
@MainActor
public final class ThermalMonitor: ObservableObject {
  @Published public private(set) var reading: RoomReading

  private let worker = Worker()
  private var timer: DispatchSourceTimer?
  private var pinned = false
  private var observer: NSObjectProtocol?

  private static let interval: DispatchTimeInterval = .seconds(3)

  public init() {
    reading = RoomReading(celsius: nil, thermalState: Self.currentLevel, fanRPM: nil, windLevel: 1)
    observer = NotificationCenter.default.addObserver(
      forName: ProcessInfo.thermalStateDidChangeNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      MainActor.assumeIsolated { self?.sampleNow() }
    }
  }

  private static var currentLevel: ThermalLevel { ThermalLevel(ProcessInfo.processInfo.thermalState) }

  public func setActive(_ active: Bool) {
    guard !pinned, active != (timer != nil) else { return }
    if active {
      let timer = DispatchSource.makeTimerSource(queue: worker.queue)
      timer.schedule(deadline: .now(), repeating: Self.interval, leeway: .seconds(1))
      timer.setEventHandler { [weak self, worker] in
        let reading = worker.sample()
        DispatchQueue.main.async { self?.publish(reading) }
      }
      timer.resume()
      self.timer = timer
    }
    else {
      timer?.cancel()
      timer = nil
    }
  }

  /// Stops sampling and holds `reading`; used by docs captures.
  public func pin(_ reading: RoomReading) {
    setActive(false)
    pinned = true
    self.reading = reading
  }

  /// While hidden, only the cached state is updated; the next visible sample
  /// refreshes everything else.
  private func sampleNow() {
    guard !pinned else { return }
    guard timer != nil else {
      reading.thermalState = Self.currentLevel
      return
    }
    worker.queue.async { [weak self, worker] in
      let reading = worker.sample()
      DispatchQueue.main.async { self?.publish(reading) }
    }
  }

  private func publish(_ reading: RoomReading) {
    if !pinned, reading != self.reading {
      self.reading = reading
    }
  }

  /// Owns the sensors; only touched on `queue`. They are opened on the first
  /// sample, so a launch with nothing on screen never talks to the hardware.
  private final class Worker: @unchecked Sendable {
    let queue = DispatchQueue(label: "fun.yunle.cute-ac.thermal", qos: .utility)
    private lazy var sensors = ThermalSensors()

    func sample() -> RoomReading {
      RoomReading(
        celsius: sensors.cpuTemperature(),
        thermalState: ThermalLevel(ProcessInfo.processInfo.thermalState),
        fans: sensors.fans()
      )
    }
  }
}
