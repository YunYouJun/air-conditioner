import CuteACKit
import Foundation

@MainActor
final class ACStore: ObservableObject {
  @Published private(set) var state: ACState {
    didSet { persist() }
  }

  private let defaultsKey = "cute-ac:state"

  init() {
    if let data = UserDefaults.standard.data(forKey: defaultsKey),
       let saved = try? JSONDecoder().decode(ACState.self, from: data) {
      state = saved
    }
    else {
      state = ACState()
    }
  }

  func togglePower() {
    state.status.toggle()
  }

  /// Each mode remembers its own set point (#39).
  func setMode(_ mode: ACMode) {
    state.setMode(mode)
  }

  func changeTemperature(by delta: Double) {
    state.setTemperature(state.temperature + delta)
  }

  /// 自动 follows the Mac's fans; the fixed speeds hold the airflow (#29).
  func setFan(_ fan: ACFanSpeed) {
    state.fan = fan
  }

  private func persist() {
    if let data = try? JSONEncoder().encode(state) {
      UserDefaults.standard.set(data, forKey: defaultsKey)
    }
  }
}
