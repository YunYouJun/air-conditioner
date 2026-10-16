import AppKit
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

  init() {
    let url = Bundle.module.url(forResource: "CuteAC", withExtension: "usdz")!
    let loaded = (try? SCNScene(url: url)) ?? SCNScene()
    let root = SCNNode()
    for child in loaded.rootNode.childNodes {
      root.addChildNode(child)
    }
    scene = SCNScene()
    scene.rootNode.addChildNode(root)
    model = root

    louver = root.childNode(withName: "Louver", recursively: true)
    displayMaterial = root.childNode(withName: "Display", recursively: true)
      .flatMap(Self.firstGeometry(in:))?.firstMaterial
    ledMaterial = root.childNode(withName: "Led", recursively: true)
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

  func apply(_ state: ACState, animated: Bool) {
    let previous = lastState
    guard previous != state else { return }
    lastState = state

    SCNTransaction.begin()
    SCNTransaction.animationDuration = animated ? 0.5 : 0
    SCNTransaction.animationTimingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
    louver?.eulerAngles.x = state.status ? CGFloat(40 * Double.pi / 180) : 0
    SCNTransaction.commit()

    let ledColor = state.status ? Self.accent(for: state.mode) : NSColor(calibratedRed: 0.56, green: 0.6, blue: 0.67, alpha: 1)
    ledMaterial?.diffuse.contents = ledColor
    displayMaterial?.diffuse.contents = Self.displayImage(for: state)

    if animated && state.status && previous?.status == false {
      bounce()
    }
  }

  /// Pausing the scene stops any running action; with `rendersContinuously`
  /// off, the view then stops drawing entirely.
  func setActive(_ active: Bool) {
    scene.isPaused = !active
  }

  static func accent(for mode: ACMode) -> NSColor {
    switch mode {
    case .cold: NSColor(calibratedRed: 0.35, green: 0.66, blue: 1, alpha: 1)
    case .hot: NSColor(calibratedRed: 1, green: 0.62, blue: 0.35, alpha: 1)
    }
  }

  /// World position just below the louver, used to place the airflow overlay.
  var airflowOrigin: SCNVector3 {
    guard let louver else { return SCNVector3(0, -0.3, 0.3) }
    let world = louver.worldPosition
    return SCNVector3(world.x, world.y - 0.1, world.z + 0.05)
  }

  // MARK: Display

  /// LCD readout drawn once per state change with the Digital-7 seven-segment
  /// face; unlit "88" segments sit behind the digits like a real panel. The
  /// texture is tiny and costs nothing while idle.
  static func displayImage(for state: ACState) -> NSImage {
    let size = NSSize(width: 250, height: 100)
    return NSImage(size: size, flipped: false) { rect in
      NSColor(calibratedRed: 0.07, green: 0.09, blue: 0.12, alpha: 1).setFill()
      rect.fill()

      let font = ACFonts.digital(size: 84)
      let color = state.status ? accent(for: state.mode) : NSColor(calibratedWhite: 1, alpha: 0)
      let ghost = NSAttributedString(string: "88", attributes: [
        .font: font,
        .foregroundColor: NSColor(calibratedWhite: 1, alpha: 0.06),
      ])
      let digitsSize = ghost.size()
      let origin = NSPoint(x: 24, y: (rect.height - digitsSize.height) / 2 + 4)
      ghost.draw(at: origin)
      guard state.status else { return true }

      NSAttributedString(string: String(format: "%2d", state.temperature), attributes: [
        .font: font,
        .foregroundColor: color,
      ]).draw(at: origin)

      NSAttributedString(string: "°C", attributes: [
        .font: NSFont.systemFont(ofSize: 22, weight: .bold),
        .foregroundColor: color.withAlphaComponent(0.85),
      ]).draw(at: NSPoint(x: origin.x + digitsSize.width + 6, y: rect.midY + 6))

      let symbolName = state.mode == .cold ? "snowflake" : "sun.max.fill"
      if let symbol = NSImage(systemSymbolName: symbolName, accessibilityDescription: nil)?
        .withSymbolConfiguration(.init(pointSize: 26, weight: .bold)) {
        let tinted = NSImage(size: symbol.size, flipped: false) { symbolRect in
          symbol.draw(in: symbolRect)
          color.set()
          symbolRect.fill(using: .sourceAtop)
          return true
        }
        tinted.draw(in: NSRect(x: rect.maxX - 58, y: 16, width: 28, height: 28))
      }
      return true
    }
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
