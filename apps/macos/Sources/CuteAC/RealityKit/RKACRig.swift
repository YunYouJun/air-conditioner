import AppKit
import RealityKit

/// One RealityKit instance of the unit: maps `ACState` onto the cloned
/// `Louver` / `Display` / `Led` entities, like `ACSceneController` does for
/// SceneKit.
@available(macOS 15, *)
@MainActor
final class RKACRig {
  /// Pivot for the power-on bounce; holds the cloned model.
  let root = Entity()
  private let louver: Entity?
  private let louverRest: Transform
  private let display: ModelEntity?
  private let led: ModelEntity?
  private let displayTexture: TextureResource?
  private var lastState: ACState?

  /// Creating a texture is async on macOS 15; later updates replace it in place.
  static func make() async throws -> RKACRig {
    let model = try await RKACModel.makeInstance()
    let blank = ACSceneController.displayImage(for: ACState()).cgImage(forProposedRect: nil, context: nil, hints: nil)
    let texture = try await blank.asyncMap { try await TextureResource(image: $0, options: displayOptions) }
    return RKACRig(model: model, displayTexture: texture)
  }

  private init(model: Entity, displayTexture: TextureResource?) {
    root.addChild(model)
    louver = model.findEntity(named: "Louver")
    louverRest = louver?.transform ?? Transform()
    display = model.findEntity(named: "Display").flatMap(Self.firstModel(in:))
    led = model.findEntity(named: "Led").flatMap(Self.firstModel(in:))
    self.displayTexture = displayTexture
    if let displayTexture {
      var material = UnlitMaterial(applyPostProcessToneMap: false)
      material.color = .init(tint: .white, texture: .init(displayTexture))
      display?.model?.materials = [material]
    }
  }

  func apply(_ state: ACState, animated: Bool) {
    let previous = lastState
    guard previous != state else { return }
    lastState = state

    if let louver {
      var target = louverRest
      // Louver keeps Blender's local axes (Z up), hinge along local X.
      target.rotation = louverRest.rotation * simd_quatf(angle: state.status ? 40 * .pi / 180 : 0, axis: [1, 0, 0])
      if animated {
        louver.move(to: target, relativeTo: louver.parent, duration: 0.5, timingFunction: .easeInOut)
      }
      else {
        louver.transform = target
      }
    }

    var ledMaterial = UnlitMaterial(applyPostProcessToneMap: false)
    ledMaterial.color = .init(tint: state.status
      ? ACSceneController.accent(for: state.mode)
      : NSColor(calibratedRed: 0.56, green: 0.6, blue: 0.67, alpha: 1))
    led?.model?.materials = [ledMaterial]

    updateDisplay(for: state)

    if animated && state.status && previous?.status == false {
      bounce()
    }
  }

  /// Point just below the louver, where the airflow overlay starts.
  var airflowOrigin: SIMD3<Float> {
    guard let louver else { return [0, -0.3, 0.3] }
    return louver.position(relativeTo: root) + [0, -0.1, 0.05]
  }

  // MARK: Display

  private static var displayOptions: TextureResource.CreateOptions {
    var options = TextureResource.CreateOptions(semantic: .color)
    options.mipmapsMode = .none
    return options
  }

  /// Same LCD image as SceneKit, drawn once per state change.
  private func updateDisplay(for state: ACState) {
    guard let displayTexture,
          let image = ACSceneController.displayImage(for: state).cgImage(forProposedRect: nil, context: nil, hints: nil)
    else { return }
    try? displayTexture.replace(withImage: image, options: Self.displayOptions)
  }

  // MARK: Motion

  private func bounce() {
    root.move(to: Transform(scale: SIMD3(repeating: 1.03)), relativeTo: root.parent, duration: 0.12, timingFunction: .easeOut)
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { [root] in
      root.move(to: Transform(), relativeTo: root.parent, duration: 0.3, timingFunction: .easeInOut)
    }
  }

  private static func firstModel(in entity: Entity) -> ModelEntity? {
    if let model = entity as? ModelEntity { return model }
    for child in entity.children {
      if let model = firstModel(in: child) { return model }
    }
    return nil
  }
}

/// Fixed camera matching `ACSceneController` (24° vertical FOV, slightly
/// below and to the right), plus a turntable orbit for dragging.
@available(macOS 15, *)
struct RKCamera {
  static let target: SIMD3<Float> = [0, -0.02, 0]
  static let start: SIMD3<Float> = [0.55, -0.45, 3.0]
  static let fieldOfView: Float = 24

  /// Yaw/pitch offsets in radians from the start position.
  var yaw: Float = 0
  var pitch: Float = 0

  var position: SIMD3<Float> {
    let offset = Self.start - Self.target
    let radius = length(offset)
    let baseYaw = atan2(offset.x, offset.z)
    let basePitch = asin(offset.y / radius)
    let limit: Float = 25 * .pi / 180
    let pitch = min(limit, max(-limit, basePitch + self.pitch))
    let yaw = baseYaw + self.yaw
    return Self.target + radius * SIMD3(cos(pitch) * sin(yaw), sin(pitch), cos(pitch) * cos(yaw))
  }

  static func makeEntity() -> Entity {
    let camera = Entity()
    camera.components.set(PerspectiveCameraComponent(near: 0.1, far: 20, fieldOfViewInDegrees: fieldOfView))
    return camera
  }

  func place(_ camera: Entity) {
    camera.look(at: Self.target, from: position, relativeTo: nil)
  }

  /// Projects a world point into a view of `size` (origin bottom-left, like
  /// `SCNView.projectPoint`). Only used for the start pose, as in SceneKit.
  static func project(_ point: SIMD3<Float>, in size: CGSize) -> CGPoint {
    let forward = normalize(target - start)
    let right = normalize(cross(forward, [0, 1, 0]))
    let up = cross(right, forward)
    let offset = point - start
    let depth = dot(offset, forward)
    let tanHalf = tan(fieldOfView * .pi / 360)
    let aspect = Float(size.width / max(size.height, 1))
    let ndcX = dot(offset, right) / (depth * tanHalf * aspect)
    let ndcY = dot(offset, up) / (depth * tanHalf)
    return CGPoint(x: CGFloat((ndcX + 1) / 2) * size.width, y: CGFloat((ndcY + 1) / 2) * size.height)
  }
}

extension Optional {
  fileprivate func asyncMap<T>(_ transform: (Wrapped) async throws -> T) async rethrows -> T? {
    guard let self else { return nil }
    return try await transform(self)
  }
}
