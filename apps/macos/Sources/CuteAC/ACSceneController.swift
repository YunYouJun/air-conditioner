import AppKit
import CuteACKit
import SceneKit

/// Owns the SceneKit scene and maps `ACState` onto the named nodes exported by
/// `Model/build_cute_ac.py`. Nothing animates in steady state, so SceneKit
/// only draws while a transition is running.
@MainActor
final class ACSceneController {
  let scene: SCNScene
  let cameraNode = SCNNode()

  private let model: SCNNode
  private let louver: SCNNode?
  private let displayMaterial: SCNMaterial?
  private let ledMaterial: SCNMaterial?
  private var lastState: ACState?
  private var lastRoom: RoomReading?

  init() {
    let loaded = ACModel.url.flatMap { try? SCNScene(url: $0) } ?? SCNScene()
    let root = SCNNode()
    for child in loaded.rootNode.childNodes {
      root.addChildNode(child)
    }
    scene = SCNScene()
    scene.rootNode.addChildNode(root)
    model = root

    louver = root.childNode(withName: ACModel.Part.louver, recursively: true)
    displayMaterial = root.childNode(withName: ACModel.Part.display, recursively: true)
      .flatMap(Self.firstGeometry(in:))?.firstMaterial
    ledMaterial = root.childNode(withName: ACModel.Part.led, recursively: true)
      .flatMap(Self.firstGeometry(in:))?.firstMaterial

    Self.flattenMaterials(in: root)
    // Constant shading shows the texture/colour as-is; clear the exported
    // emission so it does not tint the "off" state.
    for material in [displayMaterial, ledMaterial].compactMap({ $0 }) {
      material.lightingModel = .constant
      material.emission.contents = NSColor.black
    }
    setUpLightsAndCamera()
    scene.isPaused = true
  }

  // MARK: State

  /// `room` only feeds the LCD (room temperature, wind bars); the louver and
  /// bounce react to `state` alone.
  func apply(_ state: ACState, room: RoomReading?, animated: Bool) {
    let previous = lastState
    let stateChanged = previous != state
    guard stateChanged || room != lastRoom else { return }
    lastState = state
    lastRoom = room
    displayMaterial?.diffuse.contents = ACDisplay.image(for: state, room: room)
    guard stateChanged else { return }

    SCNTransaction.begin()
    SCNTransaction.animationDuration = animated ? 0.5 : 0
    SCNTransaction.animationTimingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
    louver?.eulerAngles.x = state.status ? CGFloat(ACModel.openLouverAngle) : 0
    SCNTransaction.commit()

    ledMaterial?.diffuse.contents = ACPalette.led(for: state)

    if animated && state.status && previous?.status == false {
      bounce()
    }
  }

  /// Pausing the scene stops any running action; with `rendersContinuously`
  /// off, the view then stops drawing entirely.
  func setActive(_ active: Bool) {
    scene.isPaused = !active
  }

  /// World position just below the louver, used to place the airflow overlay.
  var airflowOrigin: SCNVector3 {
    guard let louver else { return SCNVector3(0, -0.3, 0.3) }
    let world = louver.worldPosition
    return SCNVector3(world.x, world.y - 0.1, world.z + 0.05)
  }

  // MARK: Motion

  private func bounce() {
    let up = SCNAction.scale(to: 1.03, duration: 0.12)
    up.timingMode = .easeOut
    let down = SCNAction.scale(to: 1, duration: 0.3)
    down.timingMode = .easeInEaseOut
    model.runAction(.sequence([up, down]))
  }

  // MARK: Setup

  private func setUpLightsAndCamera() {
    let ambient = SCNNode()
    ambient.light = SCNLight()
    ambient.light?.type = .ambient
    ambient.light?.intensity = 430
    ambient.light?.color = NSColor(calibratedRed: 0.9, green: 0.93, blue: 1, alpha: 1)
    scene.rootNode.addChildNode(ambient)

    // Key from upper left, fill from the right: enough contrast to read facets.
    let key = SCNNode()
    key.light = SCNLight()
    key.light?.type = .directional
    key.light?.intensity = 780
    key.eulerAngles = SCNVector3(-0.75, -0.55, 0)
    scene.rootNode.addChildNode(key)

    let fill = SCNNode()
    fill.light = SCNLight()
    fill.light?.type = .directional
    fill.light?.intensity = 220
    fill.light?.color = NSColor(calibratedRed: 1, green: 0.95, blue: 0.9, alpha: 1)
    fill.eulerAngles = SCNVector3(0.1, 0.9, 0)
    scene.rootNode.addChildNode(fill)

    let camera = SCNCamera()
    camera.fieldOfView = 24
    camera.zNear = 0.1
    camera.zFar = 20
    cameraNode.camera = camera
    // Slightly below and to the right, like looking up at a wall unit.
    cameraNode.position = SCNVector3(0.55, -0.45, 3.0)
    cameraNode.look(at: SCNVector3(0, -0.02, 0))
    scene.rootNode.addChildNode(cameraNode)
  }

  /// USD export wraps each mesh in an Xform of the same name; the geometry
  /// lives on a descendant.
  private static func firstGeometry(in node: SCNNode) -> SCNGeometry? {
    if let geometry = node.geometry { return geometry }
    for child in node.childNodes {
      if let geometry = firstGeometry(in: child) { return geometry }
    }
    return nil
  }

  /// Lambert keeps the flat-shaded facets crisp and is the cheapest lit model.
  private static func flattenMaterials(in root: SCNNode) {
    root.enumerateHierarchy { node, _ in
      for material in node.geometry?.materials ?? [] {
        material.lightingModel = .lambert
      }
    }
  }
}
