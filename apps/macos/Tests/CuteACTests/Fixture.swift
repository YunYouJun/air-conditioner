import Foundation
import HomeDeviceKit

@MainActor final class FleetCredentials: HACredentialStore {
  var token: String?
  func load(for endpoint: HAEndpoint) throws -> String? { token }
  func save(_ token: String, for endpoint: HAEndpoint) throws { self.token = token }
  func remove(for endpoint: HAEndpoint) throws { token = nil }
}

@MainActor final class FleetFixture {
  let credentials = FleetCredentials()
  var commands: [HAValue] = []
  var sockets: [FleetSocket] = []
  var entities: [String: HAEntity] = Dictionary(uniqueKeysWithValues: ["living", "bedroom"].map {
    let id = "climate." + $0
    return (id, HAEntity(entityID: id, state: "cool", attributes: [
      "friendly_name": .string($0), "temperature": .number(24), "target_temp_step": .number(0.5),
      "hvac_modes": .array(["off", "cool", "heat"].map(HAValue.string)), "supported_features": .number(1),
    ], lastUpdated: "2026-10-18T00:00:00Z"))
  })
  func controller() -> HomeAssistantClimate {
    HomeAssistantClimate(client: HomeAssistantClient(factory: { [unowned self] _ in
      let socket = FleetSocket(server: self); sockets.append(socket); return socket
    }), credentials: credentials, confirmationTimeout: .milliseconds(100), debounce: .milliseconds(30))
  }
  func report(_ entity: HAEntity) throws {
    entities[entity.entity_id] = entity
    for client in sockets {
      client.push(.object(["type": .string("event"), "event": .object([
        "event_type": .string("state_changed"), "data": .object(["entity_id": .string(entity.entity_id), "new_state": try value(entity)]),
      ])]))
    }
  }
  func handle(_ message: HAValue, on socket: FleetSocket) throws {
    if message["type"].string == "auth" { socket.push(.object(["type": .string("auth_ok")])); return }
    var result: HAValue = .null
    switch message["type"].string {
    case "get_config": result = .object(["unit_system": .object(["temperature": .string("°C")])])
    case "get_states": result = try value(Array(entities.values))
    case "call_service":
      commands.append(message)
      let id = message["target"]["entity_id"].string!
      let old = entities[id]!
      var attributes = old.attributes
      if let temperature = message["service_data"]["temperature"].number { attributes["temperature"] = .number(temperature) }
      let entity = HAEntity(entityID: id, state: message["service_data"]["hvac_mode"].string ?? old.state,
                            attributes: attributes, lastUpdated: "2026-10-18T00:00:10Z")
      entities[id] = entity
      for client in sockets {
        client.push(.object(["type": .string("event"), "event": .object([
          "event_type": .string("state_changed"), "data": .object(["entity_id": .string(id), "new_state": try value(entity)]),
        ])]))
      }
    default: break
    }
    socket.push(.object(["type": .string("result"), "id": message["id"], "success": .bool(true), "result": result]))
  }
  private func value<T: Encodable>(_ value: T) throws -> HAValue { try JSONDecoder().decode(HAValue.self, from: JSONEncoder().encode(value)) }
}

@MainActor final class FleetSocket: HAWebSocket {
  unowned let server: FleetFixture
  var iterator: AsyncThrowingStream<String, Error>.Iterator
  let continuation: AsyncThrowingStream<String, Error>.Continuation
  init(server: FleetFixture) {
    self.server = server
    let pair = AsyncThrowingStream<String, Error>.makeStream()
    iterator = pair.stream.makeAsyncIterator(); continuation = pair.continuation
    push(.object(["type": .string("auth_required")]))
  }
  func push(_ message: HAValue) { continuation.yield(String(decoding: try! JSONEncoder().encode(message), as: UTF8.self)) }
  func send(_ text: String) async throws { try server.handle(JSONDecoder().decode(HAValue.self, from: Data(text.utf8)), on: self) }
  func receive() async throws -> String {
    var iterator = self.iterator
    let value = try await iterator.next()
    self.iterator = iterator
    guard let value else { throw HAError.disconnected }; return value
  }
  func close() { continuation.finish(throwing: HAError.disconnected) }
}

@MainActor func eventually(_ predicate: () -> Bool) async -> Bool {
  for _ in 0..<200 {
    if predicate() { return true }
    try? await Task.sleep(for: .milliseconds(5))
  }
  return predicate()
}
