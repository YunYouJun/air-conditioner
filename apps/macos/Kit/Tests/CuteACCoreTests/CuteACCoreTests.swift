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
