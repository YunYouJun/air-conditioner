import Foundation
import Testing
import HomeDeviceKit
@testable import CuteAC

@MainActor final class TestCatalog: HABindingCatalogStore {
  var devices: [HASharedDevice] = []
  var reads = 0
  var fails = false
  func load() throws -> [HASharedDevice] {
    reads += 1
    if fails { throw CocoaError(.fileReadCorruptFile) }
    return devices
  }
  func save(_ devices: [HASharedDevice]) throws { self.devices = devices }
}

@MainActor @Test func nativeStoreSharesBindingsAndKeepsCommandsAndVirtualStateSeparate() async throws {
  let suite = "cute-ac.test.\(UUID().uuidString)"
  let defaults = try #require(UserDefaults(suiteName: suite))
  defer { defaults.removePersistentDomain(forName: suite) }
  let fixture = FleetFixture()
  fixture.credentials.token = "fixture"
  let catalog = TestCatalog()
  catalog.devices = try ["living", "bedroom"].map {
    HASharedDevice(binding: try HABinding(endpoint: HAEndpoint("http://localhost:8123"), entityID: "climate." + $0),
                   name: $0, roomID: $0, roomName: $0 == "living" ? "客厅" : "次卧")
  }
  let store = ACStore(defaults: defaults, catalog: catalog, fleet: HADeviceCollection(factory: fixture.controller), watchCatalog: false)
  defer { store.shutdown() }
  store.changeTemperature(by: 2)
  let virtual = store.state
  let living = catalog.devices[0].id, bedroom = catalog.devices[1].id
  store.selectDevice(bedroom)
  #expect(await eventually { store.canControl && store.state.temperature == 24 })
  #expect(store.isReal && store.step == 0.5 && fixture.commands.isEmpty)
  store.changeTemperature(by: store.step)
  store.changeTemperature(by: store.step)
  store.selectDevice(living)
  #expect(await eventually { store.canControl && fixture.commands.count == 1 && store.fleet.connections[bedroom]?.pending == false })
  #expect(fixture.commands[0]["target"]["entity_id"].string == "climate.bedroom")
  #expect(store.state.temperature == 24)
  #expect(store.fleet.connections[bedroom]?.snapshot?.targetTemperature == 25)
  store.selectDevice(nil)
  #expect(store.state == virtual)
  store.selectDevice(bedroom)
  #expect(store.sceneRoom(.demo).celsius == nil && store.sceneRoom(.demo).fanRPM == nil)
  store.shutdown()
  let restored = ACStore(defaults: defaults, catalog: catalog, fleet: HADeviceCollection(factory: fixture.controller), watchCatalog: false)
  defer { restored.shutdown() }
  #expect(restored.selectedID == bedroom)
  #expect(await eventually { restored.canControl && restored.state.temperature == 25 })
  #expect(fixture.commands.count == 1)
  let old = try #require(fixture.entities["climate.bedroom"])
  var attributes = old.attributes
  attributes["temperature"] = .number(33.5)
  attributes["current_temperature"] = .number(28.2)
  try fixture.report(HAEntity(entityID: old.entity_id, state: "cool", attributes: attributes, lastUpdated: "2026-10-18T00:01:00Z"))
  #expect(await eventually { restored.state.temperature == 33.5 && restored.snapshot?.currentTemperature == 28.2 })
  try fixture.report(HAEntity(entityID: old.entity_id, state: "unavailable", attributes: attributes, lastUpdated: "2026-10-18T00:02:00Z"))
  #expect(await eventually { !restored.canControl })
  restored.togglePower()
  #expect(fixture.commands.count == 1)
  catalog.devices = [catalog.devices[0]]
  restored.reloadBindings()
  #expect(await eventually { restored.selectedID == nil })
  #expect(restored.fleet.connections[bedroom] == nil)
  #expect(restored.state == virtual)
}

@MainActor @Test func demoCannotLoadBindingsOrSendToRememberedDevice() throws {
  let suite = "cute-ac.demo-test.\(UUID().uuidString)"
  let defaults = try #require(UserDefaults(suiteName: suite))
  defer { defaults.removePersistentDomain(forName: suite) }
  defaults.set("remembered-real-device", forKey: "cute-ac:ha-selected:v1")
  let catalog = TestCatalog()
  var created = 0
  let store = ACStore(defaults: defaults, catalog: catalog,
                      fleet: HADeviceCollection(factory: { created += 1; return HomeAssistantClimate() }),
                      allowsRealDevices: false, watchCatalog: false)
  defer { store.shutdown() }
  store.reloadBindings(); store.selectDevice("remembered-real-device")
  store.togglePower(); store.changeTemperature(by: 1)
  #expect(!store.isReal && store.state.status && store.state.temperature == 27)
  #expect(created == 0 && catalog.reads == 0)
  #expect(defaults.string(forKey: "cute-ac:ha-selected:v1") == "remembered-real-device")
}

@MainActor @Test func nativeStoreMirrorsPeerAndReadsFreshStateAfterDisconnect() async throws {
  let suite = "cute-ac.reconnect-test.\(UUID().uuidString)"
  let defaults = try #require(UserDefaults(suiteName: suite))
  defer { defaults.removePersistentDomain(forName: suite) }
  let fixture = FleetFixture()
  fixture.credentials.token = "fixture"
  let catalog = TestCatalog()
  let endpoint = try HAEndpoint("http://localhost:8123")
  let binding = try HABinding(endpoint: endpoint, entityID: "climate.bedroom")
  let initialEntity = try #require(fixture.entities[binding.entityID])
  try fixture.report(HAEntity(entityID: binding.entityID, state: "off", attributes: initialEntity.attributes,
                             lastUpdated: initialEntity.last_updated))
  let room = HASharedDevice(binding: binding, name: "空调", roomID: "bedroom", roomName: "次卧")
  catalog.devices = [room]

  let store = ACStore(defaults: defaults, catalog: catalog, fleet: HADeviceCollection(factory: fixture.controller), watchCatalog: false)
  defer { store.shutdown() }
  store.selectDevice(room.id)
  #expect(await eventually { store.canControl && store.targetTemperature == 24 && !store.state.status })
  let cuteACSocket = try #require(fixture.sockets.first)
  let peer = fixture.controller()
  defer { peer.disconnect() }
  await peer.restore(binding)
  #expect(peer.canControl && peer.snapshot?.mode == "off")

  store.togglePower()
  #expect(await eventually { !store.pending && store.state.status && peer.snapshot?.isOn == true })
  peer.request(.temperature(25.5))
  #expect(await eventually { !peer.pending && store.targetTemperature == 25.5 && store.selectedMode == .cold })

  store.changeTemperature(by: store.step)
  cuteACSocket.close()
  #expect(await eventually { store.connectionStatus == HAConnectionState.offline.name })
  #expect(store.targetTemperature == nil && store.selectedMode == nil && !store.canControl && !store.pending)
  let commandsBeforePeerUpdate = fixture.commands.count
  peer.request(.temperature(28.5))
  #expect(await eventually { !peer.pending && peer.snapshot?.targetTemperature == 28.5 })
  #expect(await eventually { fixture.sockets.count == 3 && store.canControl && store.targetTemperature == 28.5 })
  #expect(store.selectedID == room.id && store.state.status && !store.pending)
  #expect(fixture.commands.count == commandsBeforePeerUpdate + 1)

  peer.request(.power(false))
  #expect(await eventually { !peer.pending && !store.state.status })
}

@MainActor @Test func missingCredentialAndCorruptCatalogCannotControlARealDevice() async throws {
  let suite = "cute-ac.error-test.\(UUID().uuidString)"
  let defaults = try #require(UserDefaults(suiteName: suite))
  defer { defaults.removePersistentDomain(forName: suite) }
  let fixture = FleetFixture(), catalog = TestCatalog()
  catalog.devices = [HASharedDevice(binding: try HABinding(endpoint: HAEndpoint("http://localhost:8123"), entityID: "climate.living"),
                                    name: "空调", roomID: "living", roomName: "客厅")]
  let store = ACStore(defaults: defaults, catalog: catalog, fleet: HADeviceCollection(factory: fixture.controller), watchCatalog: false)
  defer { store.shutdown() }
  store.selectDevice(catalog.devices[0].id)
  #expect(await eventually { store.connectionStatus == "需要令牌" })
  #expect(!store.canControl && store.targetTemperature == nil && store.selectedMode == nil)
  store.togglePower(); store.changeTemperature(by: 1)
  #expect(fixture.commands.isEmpty)
  catalog.fails = true; store.reloadBindings()
  #expect(await eventually { store.devices.isEmpty && !store.isReal })
  #expect(store.catalogError != nil && store.fleet.connections.isEmpty)
}
