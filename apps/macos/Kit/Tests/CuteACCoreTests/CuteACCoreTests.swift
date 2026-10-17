import CuteACCore
import Foundation
import Testing

@Suite struct ACStateTests {
  @Test func clampsIntoTheVirtualRange() {
    #expect(ACState(temperature: 40).temperature == 31)
    #expect(ACState(temperature: 2).temperature == 16)
    #expect(ACState.clamp(12, to: 10...30) == 12)
  }

  @Test func labelsDropTrailingZeros() {
    #expect(ACState(temperature: 26).temperatureLabel == "26")
    #expect(ACState(temperature: 26.5).temperatureLabel == "26.5")
  }

  // #39: like a real remote, each mode keeps its own set point.
  @Test func remembersTheTemperatureOfEachMode() {
    var state = ACState(temperature: 26)
    state.setTemperature(20)
    state.setMode(.hot)
    #expect(state.temperature == 26)
    state.setTemperature(28)
    state.setMode(.cold)
    #expect(state.temperature == 20 && state.temperatures == ACModeTemperatures(cold: 20, hot: 28))
    state.setMode(.cold)
    #expect(state.temperature == 20)
  }

  // #29
  @Test func fixedFanSpeedsOverrideTheRoom() {
    let room = RoomReading(celsius: 60, thermalState: .fair, fanRPM: 3000, windLevel: 3)
    #expect(ACState(fan: .auto).windLevel(room: room) == 3)
    #expect(ACState(fan: .auto).windLevel(room: nil) == 1)
    #expect(ACState(fan: .low).windLevel(room: room) == 1)
    #expect(ACState(fan: .medium).windLevel(room: nil) == 2)
  }

  /// The same JSON shape as core, so a web state decodes natively.
  @Test func roundTripsTheNewFields() throws {
    var state = ACState(status: true, mode: .hot, temperature: 27, fan: .high)
    state.temperatures.cold = 22
    let decoded = try JSONDecoder().decode(ACState.self, from: JSONEncoder().encode(state))
    #expect(decoded == state)
    let web = Data(#"{"status":true,"mode":"cold","temperature":21,"temperatures":{"cold":21,"hot":28},"sound":"normal","swing":false,"fan":"low"}"#.utf8)
    let fromWeb = try JSONDecoder().decode(ACState.self, from: web)
    #expect(fromWeb.fan == .low && fromWeb.temperatures.hot == 28)
    // Unknown fan values fall back instead of failing the whole save.
    let odd = Data(#"{"status":false,"mode":"cold","temperature":25,"fan":"turbo"}"#.utf8)
    #expect(try JSONDecoder().decode(ACState.self, from: odd).fan == .auto)
  }

  /// CuteAC stored `temperature` as an Int before the kit; old saves must load.
  @Test func decodesIntegerTemperatures() throws {
    let json = Data(#"{"status":true,"mode":"hot","temperature":24}"#.utf8)
    let state = try JSONDecoder().decode(ACState.self, from: json)
    #expect(state == ACState(status: true, mode: .hot, temperature: 24))
  }
}

@Suite struct RoomReadingTests {
  @Test func windFollowsTheFastestFan() {
    let idle = FanSample(rpm: 1500, minRPM: 1500, maxRPM: 4500)
    let busy = FanSample(rpm: 3000, minRPM: 1500, maxRPM: 4500)
    let full = FanSample(rpm: 4500, minRPM: 1500, maxRPM: 4500)
    #expect(RoomReading(celsius: 50.4, thermalState: .nominal, fans: [idle]).windLevel == 1)
    #expect(RoomReading(celsius: 50.4, thermalState: .nominal, fans: [idle, busy]).windLevel == 2)
    let hot = RoomReading(celsius: 80.6, thermalState: .fair, fans: [full])
    #expect(hot.windLevel == 3)
    #expect(hot.celsius == 81)
    #expect(hot.fanRPM == 4500)
  }

  @Test func fanlessMacsUseTheThermalState() {
    #expect(RoomReading(celsius: nil, thermalState: .nominal, fans: []).windLevel == 1)
    #expect(RoomReading(celsius: nil, thermalState: .fair, fans: []).windLevel == 2)
    #expect(RoomReading(celsius: nil, thermalState: .critical, fans: []).windLevel == 3)
    #expect(RoomReading(celsius: nil, thermalState: .nominal, fans: []).fanRPM == nil)
  }

  @Test func stoppedFansHaveNoLoad() {
    #expect(FanSample(rpm: 0, minRPM: 1200, maxRPM: 5000).load == 0)
    #expect(FanSample(rpm: 6000, minRPM: 1200, maxRPM: 5000).load == 1)
  }

  /// Yun Home hands readings to plugins as JSON; keep the shape stable.
  @Test func encodesAsPlainJSON() throws {
    let encoder = JSONEncoder()
    encoder.outputFormatting = .sortedKeys
    let json = String(decoding: try encoder.encode(RoomReading.demo), as: UTF8.self)
    #expect(json == #"{"celsius":48,"fanRPM":1500,"thermalState":"nominal","windLevel":1}"#)
  }

  @Test func mapsSystemThermalStates() {
    #expect(ThermalLevel(.nominal) == .nominal)
    #expect(ThermalLevel(.serious) == .serious)
    #expect(ThermalLevel.critical.label == "过热")
  }
}
