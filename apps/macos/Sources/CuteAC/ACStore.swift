import CuteACKit
import Foundation
import HomeDeviceKit
import Observation

@MainActor
final class ACStore: ObservableObject {
  @Published private(set) var state: ACState
  @Published private(set) var devices: [HASharedDevice] = []
  @Published private(set) var selectedID: String?
  @Published private(set) var catalogError: String?
  @Published private(set) var connectionError: String?
  @Published private(set) var connectionStatus = "本机虚拟空调"
  @Published private(set) var pending = false
  @Published private(set) var canControl = true
  @Published private(set) var snapshot: HAClimateSnapshot?
  private var virtualState: ACState
  private let defaults: UserDefaults
  private let catalog: any HABindingCatalogStore
  let fleet: HADeviceCollection
  private let allowsRealDevices: Bool
  private let defaultsKey = "cute-ac:state"
  private let selectionKey = "cute-ac:ha-selected:v1"
  private var catalogTask: Task<Void, Never>?
  private var observing = true

  var isReal: Bool { selectedID != nil }
  var selectedDevice: HASharedDevice? { devices.first { $0.id == selectedID } }
  var deviceLabel: String { selectedDevice?.label ?? "本机虚拟空调" }
  var minimum: Double { isReal ? snapshot?.minimum ?? 16 : 16 }
  var maximum: Double { isReal ? snapshot?.maximum ?? 31 : 31 }
  var step: Double { isReal ? snapshot?.step ?? 1 : 1 }
  var supportsTemperature: Bool { !isReal || snapshot?.supportsTemperature == true }
  var status: String {
    guard isReal else { return state.status ? (state.mode == .cold ? "制冷中" : "制热中") : "待机" }
    guard connectionStatus == HAConnectionState.online.name else { return connectionStatus }
    return snapshot.map { haModeName($0.mode) } ?? "等待设备状态"
  }

  init(defaults: UserDefaults = .standard, catalog: (any HABindingCatalogStore)? = nil,
       fleet: HADeviceCollection? = nil, allowsRealDevices: Bool = true, watchCatalog: Bool = true) {
    self.defaults = defaults
    self.catalog = catalog ?? HAFileBindingCatalog()
    self.fleet = fleet ?? HADeviceCollection()
    self.allowsRealDevices = allowsRealDevices
    if let data = defaults.data(forKey: defaultsKey), let saved = try? JSONDecoder().decode(ACState.self, from: data) {
      virtualState = saved
    } else { virtualState = ACState() }
    state = virtualState
    if allowsRealDevices {
      reloadBindings()
      self.fleet.select(defaults.string(forKey: selectionKey))
    }
    observeConnections()
    if allowsRealDevices && watchCatalog {
      catalogTask = Task { [weak self] in
        while !Task.isCancelled {
          do { try await Task.sleep(for: .seconds(3)) } catch { return }
          self?.reloadBindings()
        }
      }
    }
  }

  func reloadBindings() {
    guard allowsRealDevices else { return }
    do {
      let updated = try catalog.load()
      if updated != fleet.devices { fleet.update(updated) }
      catalogError = nil
    } catch {
      // A broken catalog must not leave stale bindings actionable.
      fleet.update([])
      catalogError = "无法读取 Home 的绑定目录，请打开 Home 检查后重试。"
    }
  }

  func selectDevice(_ id: String?) {
    guard allowsRealDevices || id == nil else { return }
    fleet.select(id)
    refreshPresentation()
  }

  func reconnect() { fleet.reconnectSelected() }
  func supports(_ mode: ACMode) -> Bool {
    !isReal || snapshot?.modes.contains(mode == .cold ? "cool" : "heat") == true
  }
  func togglePower() {
    guard canControl else { return }
    if isReal, let connection = fleet.connection {
      connection.request(.power(!connection.displayPower)); refreshPresentation()
    }
    else { virtualState.status.toggle(); persistVirtual() }
  }
  func setMode(_ mode: ACMode) {
    guard canControl, supports(mode) else { return }
    if isReal { fleet.connection?.request(.mode(mode == .hot ? "heat" : "cool")); refreshPresentation() }
    else { virtualState.setMode(mode); persistVirtual() }
  }
  func changeTemperature(by delta: Double) {
    guard canControl, supportsTemperature else { return }
    if isReal, let connection = fleet.connection {
      connection.request(.temperature(connection.displayTemperature + delta)); refreshPresentation()
    }
    else { virtualState.setTemperature(virtualState.temperature + delta); persistVirtual() }
  }
  func setFan(_ fan: ACFanSpeed) {
    guard !isReal else { return }
    virtualState.fan = fan; persistVirtual()
  }
  /// Real AC rendering never uses the Mac's CPU temperature or fan speed.
  func sceneRoom(_ local: RoomReading) -> RoomReading {
    isReal ? RoomReading(celsius: nil, thermalState: .nominal, fanRPM: nil, windLevel: 1) : local
  }
  func shutdown() {
    observing = false
    catalogTask?.cancel(); catalogTask = nil
    fleet.disconnectAll()
  }
  private func persistVirtual() {
    state = virtualState
    if let data = try? JSONEncoder().encode(virtualState) { defaults.set(data, forKey: defaultsKey) }
  }
  private func observeConnections() {
    guard observing else { return }
    withObservationTracking { refreshPresentation() } onChange: { [weak self] in
      Task { @MainActor [weak self] in self?.observeConnections() }
    }
  }
  private func refreshPresentation() {
    devices = fleet.devices
    selectedID = fleet.selectedID
    if allowsRealDevices { defaults.set(selectedID, forKey: selectionKey) }
    guard let connection = fleet.connection, selectedID != nil else {
      state = virtualState; snapshot = nil; canControl = true; pending = false
      connectionError = nil; connectionStatus = "本机虚拟空调"
      return
    }
    snapshot = connection.snapshot
    canControl = connection.canControl
    pending = connection.pending
    connectionError = connection.error ?? connection.snapshot?.unsupportedReason
    connectionStatus = connection.state.name
    var displayed = ACState()
    displayed.status = connection.state == .online && connection.displayPower
    displayed.mode = connection.displayMode == "heat" ? .hot : .cold
    displayed.temperature = connection.displayTemperature
    state = displayed
  }
}
