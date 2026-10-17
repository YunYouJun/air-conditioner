import AppKit
import SceneKit
import SwiftUI

/// SCNView that only draws on change, plus a Core Animation overlay for the
/// airflow (much cheaper than SceneKit particles).
final class ACSceneContainerView: NSView {
  let sceneView = SCNView(frame: .zero)
  let airflowLayer = CALayer()
  private weak var controller: ACSceneController?
  private var airflow: Airflow?
  private var lastState: ACState?
  private var lastRoom: RoomReading?

  /// What the overlay is currently showing; rebuilt only when this changes.
  private struct Airflow: Equatable {
    var mode: ACMode
    var windLevel: Int
  }
  private var stopPlaying: DispatchWorkItem?

  /// `interactive` enables drag-to-orbit; the desktop pet turns it off so a
  /// drag moves the window instead.
  init(controller: ACSceneController, interactive: Bool = true) {
    self.controller = controller
    super.init(frame: .zero)
    wantsLayer = true
    layer?.isOpaque = false

    sceneView.scene = controller.scene
    sceneView.pointOfView = controller.cameraNode
    sceneView.backgroundColor = .clear
    sceneView.antialiasingMode = .multisampling4X
    sceneView.rendersContinuously = false
    sceneView.preferredFramesPerSecond = 30
    sceneView.allowsCameraControl = interactive
    sceneView.defaultCameraController.interactionMode = .orbitTurntable
    sceneView.defaultCameraController.maximumVerticalAngle = 25
    sceneView.autoresizingMask = [.width, .height]
    sceneView.wantsLayer = true
    sceneView.layer?.isOpaque = false
    addSubview(sceneView)

    layer?.addSublayer(airflowLayer)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func layout() {
    super.layout()
    sceneView.frame = bounds
    positionAirflow()
  }

  func update(state: ACState, room: RoomReading, active: Bool) {
    if state != lastState || room != lastRoom {
      // A room-only change just swaps the LCD texture: one redraw, no motion.
      let moving = state != lastState
      lastState = state
      lastRoom = room
      controller?.apply(state, room: room, animated: true)
      if moving { playBriefly() } else { sceneView.setNeedsDisplay(sceneView.bounds) }
    }
    if !active {
      sceneView.isPlaying = false
    }
    let next = (active && state.status) ? Airflow(mode: state.mode, windLevel: room.windLevel) : nil
    if next != airflow {
      airflow = next
      configureAirflow(next)
    }
  }

  /// `isPlaying` makes SCNView redraw every frame, so only enable it while a
  /// transition (louver swing, bounce) is running.
  private func playBriefly() {
    sceneView.isPlaying = true
    stopPlaying?.cancel()
    let work = DispatchWorkItem { [weak self] in self?.sceneView.isPlaying = false }
    stopPlaying = work
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.7, execute: work)
  }

  private func positionAirflow() {
    guard let controller, bounds.width > 0 else { return }
    let projected = sceneView.projectPoint(controller.airflowOrigin)
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    airflowLayer.position = CGPoint(x: projected.x, y: projected.y)
    CATransaction.commit()
  }

  /// Cold: a few snowflakes drift down and spin. Hot: warm wavy strokes.
  /// Both are plain repeating CA animations, so the render server runs them
  /// and the app process does no per-frame work (unlike CAEmitterLayer,
  /// which cost ~10% CPU here). A higher wind level (the Mac's fans spinning
  /// up) means more, faster particles that travel further.
  private func configureAirflow(_ airflow: Airflow?) {
    airflowLayer.sublayers?.forEach { $0.removeFromSuperlayer() }
    guard let airflow else { return }

    let color = ACSceneController.accent(for: airflow.mode)
    let now = CACurrentMediaTime()
    let span = min(260, bounds.width * 0.78)
    let boost = CGFloat(airflow.windLevel - 1) // 0, 1, 2
    let speed = 1 + 0.3 * boost
    let reach = 1 + 0.15 * boost

    switch airflow.mode {
    case .cold:
      let flake = Self.snowflakeImage(color: color)
      let count = 6 + airflow.windLevel - 1
      let duration = 2.4 / speed
      for index in 0..<count {
        let layer = CALayer()
        let size: CGFloat = index.isMultiple(of: 2) ? 14 : 10
        layer.bounds = CGRect(x: 0, y: 0, width: size, height: size)
        layer.contents = flake
        layer.position = CGPoint(x: span * (CGFloat(index) / CGFloat(count - 1) - 0.5), y: -6)
        layer.opacity = 0
        layer.add(Self.flowAnimation(
          distance: (index.isMultiple(of: 2) ? -42 : -34) * reach,
          duration: duration,
          spin: index.isMultiple(of: 2) ? .pi : -.pi,
          beginTime: now + Double((index * 5) % count) * duration / Double(count)
        ), forKey: "flow")
        airflowLayer.addSublayer(layer)
      }
    case .hot:
      let count = 3 + airflow.windLevel - 1
      let spacing = span / CGFloat(count)
      let duration = 1.8 / speed
      for index in 0..<count {
        let line = CAShapeLayer()
        line.bounds = CGRect(x: 0, y: -6, width: 64, height: 12)
        line.position = CGPoint(x: (CGFloat(index) - CGFloat(count - 1) / 2) * spacing, y: -8)
        line.path = Self.windPath(width: 64, amplitude: 6)
        line.strokeColor = color.cgColor
        line.fillColor = nil
        line.lineWidth = 2.4
        line.lineCap = .round
        line.opacity = 0
        line.add(Self.flowAnimation(
          distance: -30 * reach,
          duration: duration,
          spin: 0,
          beginTime: now + Double(index) * duration / Double(count)
        ), forKey: "flow")
        airflowLayer.addSublayer(line)
      }
    }
    positionAirflow()
  }

  private static func flowAnimation(distance: CGFloat, duration: CFTimeInterval, spin: CGFloat, beginTime: CFTimeInterval) -> CAAnimation {
    let drift = CABasicAnimation(keyPath: "transform.translation.y")
    drift.fromValue = 0
    drift.toValue = distance
    let fade = CAKeyframeAnimation(keyPath: "opacity")
    fade.values = [0, 0.9, 0]
    fade.keyTimes = [0, 0.3, 1]
    var animations: [CAAnimation] = [drift, fade]
    if spin != 0 {
      let rotate = CABasicAnimation(keyPath: "transform.rotation.z")
      rotate.fromValue = 0
      rotate.toValue = spin
      animations.append(rotate)
    }
    let group = CAAnimationGroup()
    group.animations = animations
    group.duration = duration
    group.repeatCount = .infinity
    group.beginTime = beginTime
    group.fillMode = .backwards
    return group
  }

  private static func snowflakeImage(color: NSColor) -> CGImage? {
    let image = NSImage(size: NSSize(width: 28, height: 28), flipped: false) { rect in
      guard let symbol = NSImage(systemSymbolName: "snowflake", accessibilityDescription: nil)?
        .withSymbolConfiguration(.init(pointSize: 22, weight: .bold)) else { return false }
      symbol.draw(in: rect.insetBy(dx: 2, dy: 2))
      color.set()
      rect.fill(using: .sourceAtop)
      return true
    }
    return image.cgImage(forProposedRect: nil, context: nil, hints: nil)
  }

  private static func windPath(width: CGFloat, amplitude: CGFloat) -> CGPath {
    let path = CGMutablePath()
    path.move(to: .zero)
    path.addCurve(
      to: CGPoint(x: width / 2, y: 0),
      control1: CGPoint(x: width / 6, y: amplitude),
      control2: CGPoint(x: width / 3, y: amplitude)
    )
    path.addCurve(
      to: CGPoint(x: width, y: 0),
      control1: CGPoint(x: width * 2 / 3, y: -amplitude),
      control2: CGPoint(x: width * 5 / 6, y: -amplitude)
    )
    return path
  }
}

struct ACSceneView: NSViewRepresentable {
  let controller: ACSceneController
  let state: ACState
  let room: RoomReading
  let isActive: Bool
  var interactive = true

  func makeNSView(context: Context) -> ACSceneContainerView {
    ACSceneContainerView(controller: controller, interactive: interactive)
  }

  func updateNSView(_ view: ACSceneContainerView, context: Context) {
    view.update(state: state, room: room, active: isActive)
  }
}
