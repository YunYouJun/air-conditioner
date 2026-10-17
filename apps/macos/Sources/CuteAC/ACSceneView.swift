import AppKit
import CuteACKit
import SceneKit
import SwiftUI

/// SCNView that only draws on change, plus the kit's Core Animation airflow
/// overlay (much cheaper than SceneKit particles).
final class ACSceneContainerView: NSView {
  let sceneView = SCNView(frame: .zero)
  let airflowLayer = ACAirflowLayer()
  private weak var controller: ACSceneController?
  private var lastState: ACState?
  private var lastRoom: RoomReading?
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
    // The overlay is rebuilt only when what it shows changes.
    let flow = (active && state.status) ? ACAirflowLayer.Flow(mode: state.mode, windLevel: room.windLevel) : nil
    if flow != airflowLayer.flow {
      configureAirflow(flow)
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

  private func configureAirflow(_ flow: ACAirflowLayer.Flow?) {
    airflowLayer.configure(flow, span: bounds.width * 0.78)
    positionAirflow()
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
