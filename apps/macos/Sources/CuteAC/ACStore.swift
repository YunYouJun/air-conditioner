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

  func setMode(_ mode: ACMode) {
    state.mode = mode
  }

  func changeTemperature(by delta: Double) {
    state.temperature = ACState.clamp(state.temperature + delta)
  }

  private func persist() {
    if let data = try? JSONEncoder().encode(state) {
      UserDefaults.standard.set(data, forKey: defaultsKey)
    }
  }
}
