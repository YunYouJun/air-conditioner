import Foundation

enum ACMode: String, Codable {
  case cold
  case hot
}

/// Same state shape and limits as `@yunlefun-home/air-conditioner` core.
struct ACState: Codable, Equatable {
  var status = false
  var mode = ACMode.cold
  var temperature = 26

  static let temperatureRange = 16...31
}

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

  func changeTemperature(by delta: Int) {
    let range = ACState.temperatureRange
    state.temperature = min(range.upperBound, max(range.lowerBound, state.temperature + delta))
  }

  private func persist() {
    if let data = try? JSONEncoder().encode(state) {
      UserDefaults.standard.set(data, forKey: defaultsKey)
    }
  }
}
