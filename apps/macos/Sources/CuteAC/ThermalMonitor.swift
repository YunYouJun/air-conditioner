import Foundation

/// The Mac seen as the AC's "room": CPU/SoC temperature, the system thermal
/// state and how hard the fans are blowing. Values are rounded so the UI only
/// redraws when something visible changes.
struct RoomReading: Equatable {
  var celsius: Int?
  var thermalState: ProcessInfo.ThermalState
  /// Fastest fan, rounded to 100 RPM; nil on fanless Macs.
  var fanRPM: Int?
  /// AC-style wind speed, 1...3. Comes from fan load when there are fans,
  /// otherwise from the thermal state.
  var windLevel: Int

  static let windLevels = 1...3

  /// Fixed reading for `--snapshot` and `--capture`, so docs images do not
  /// depend on how warm the machine happened to be.
  static let demo = RoomReading(celsius: 48, thermalState: .nominal, fanRPM: 1500, windLevel: 1)

  init(celsius: Int?, thermalState: ProcessInfo.ThermalState, fanRPM: Int?, windLevel: Int) {
    self.celsius = celsius
    self.thermalState = thermalState
    self.fanRPM = fanRPM
    self.windLevel = windLevel
  }

  init(celsius: Double?, thermalState: ProcessInfo.ThermalState, fans: [FanSample]) {
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

/// Samples `ThermalSensors` on a background queue, but only while the popover
/// or desktop pet is on screen; with neither visible it does no work at all.
/// Thermal-state changes are pushed by the system and always observed.
@MainActor
final class ThermalMonitor: ObservableObject {
  @Published private(set) var reading: RoomReading

  private let worker = Worker()
  private var timer: DispatchSourceTimer?
  private var pinned = false
  private var observer: NSObjectProtocol?

  private static let interval: DispatchTimeInterval = .seconds(3)

  init() {
    reading = RoomReading(celsius: nil, thermalState: ProcessInfo.processInfo.thermalState, fanRPM: nil, windLevel: 1)
    observer = NotificationCenter.default.addObserver(
      forName: ProcessInfo.thermalStateDidChangeNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      MainActor.assumeIsolated { self?.sampleNow() }
    }
  }

  func setActive(_ active: Bool) {
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

  /// Stops sampling and holds `reading`; used by the docs capture.
  func pin(_ reading: RoomReading) {
    setActive(false)
    pinned = true
    self.reading = reading
  }

  /// While hidden, only the cached state is updated; the next visible sample
  /// refreshes everything else.
  private func sampleNow() {
    guard !pinned else { return }
    guard timer != nil else {
      reading.thermalState = ProcessInfo.processInfo.thermalState
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
        thermalState: ProcessInfo.processInfo.thermalState,
        fans: sensors.fans()
      )
    }
  }
}
