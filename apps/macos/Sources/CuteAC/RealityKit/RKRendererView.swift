import AppKit
import Metal
import QuartzCore
import RealityKit
import SwiftUI

/// `--realitykit-renderer`: draws with `RealityRenderer` into a `CAMetalLayer`
/// only when something changes, the way the SceneKit view toggles
/// `isPlaying`. `RealityView` has no pause or frame-rate control and renders
/// every display frame (see docs/realitykit-spike.md).
@available(macOS 15, *)
final class RKRendererNSView: NSView {
  private let metalLayer = CAMetalLayer()
  private var renderer: RealityRenderer?
  private var rig: RKACRig?
  private let cameraEntity = RKCamera.makeEntity()
  private var camera = RKCamera()
  private var dragStart: (point: NSPoint, camera: RKCamera)?
  private var pendingState: ACState?
  private var lastState: ACState?
  private var animationTimer: Timer?
  private var animateUntil: CFTimeInterval = 0
  private var lastFrame: CFTimeInterval?
  private var renderScheduled = false
  var interactive = true
  var onReady: ((SIMD3<Float>) -> Void)?

  override init(frame: NSRect) {
    super.init(frame: frame)
    metalLayer.device = MTLCreateSystemDefaultDevice()
    metalLayer.pixelFormat = .bgra8Unorm_srgb
    metalLayer.isOpaque = false
    metalLayer.backgroundColor = .clear
    layer = metalLayer
    wantsLayer = true
    Task { @MainActor in await setUp() }
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private func setUp() async {
    guard let renderer = try? RealityRenderer(), let rig = try? await RKACRig.make() else { return }
    renderer.cameraSettings.colorBackground = .color(CGColor(gray: 0, alpha: 0))
    renderer.cameraSettings.antialiasing = .multisample4X
    renderer.lighting.resource = nil
    renderer.entities.append(contentsOf: [rig.root, cameraEntity])
    renderer.activeCamera = cameraEntity
    camera.place(cameraEntity)
    self.renderer = renderer
    self.rig = rig
    if let pendingState {
      rig.apply(pendingState, animated: false)
    }
    onReady?(rig.airflowOrigin)
    setNeedsRender()
  }

  func update(state: ACState) {
    guard state != lastState else { return }
    lastState = state
    guard let rig else {
      pendingState = state
      return
    }
    rig.apply(state, animated: true)
    animate(for: 0.7)
  }

  // MARK: Rendering

  override func viewDidChangeBackingProperties() {
    super.viewDidChangeBackingProperties()
    metalLayer.contentsScale = window?.backingScaleFactor ?? 2
    setNeedsRender()
  }

  override func viewDidMoveToWindow() {
    super.viewDidMoveToWindow()
    if window == nil { stopAnimating() }
    else { setNeedsRender() }
  }

  override func layout() {
    super.layout()
    setNeedsRender()
  }

  /// Coalesces into one frame on the next run loop turn.
  private func setNeedsRender() {
    guard !renderScheduled else { return }
    renderScheduled = true
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      renderScheduled = false
      renderFrame(deltaTime: 0)
    }
  }

  /// Runs the simulation at 30 fps for `duration`, long enough for the louver
  /// swing and bounce, then stops drawing entirely.
  private func animate(for duration: CFTimeInterval) {
    animateUntil = max(animateUntil, CACurrentMediaTime() + duration)
    guard animationTimer == nil else { return }
    lastFrame = CACurrentMediaTime()
    let timer = Timer(timeInterval: 1.0 / 30, repeats: true) { [weak self] _ in
      MainActor.assumeIsolated { self?.tick() }
    }
    RunLoop.main.add(timer, forMode: .common)
    animationTimer = timer
  }

  private func tick() {
    let now = CACurrentMediaTime()
    renderFrame(deltaTime: now - (lastFrame ?? now))
    lastFrame = now
    if now >= animateUntil { stopAnimating() }
  }

  private func stopAnimating() {
    animationTimer?.invalidate()
    animationTimer = nil
    lastFrame = nil
  }

  private func renderFrame(deltaTime: TimeInterval) {
    guard let renderer, window != nil, bounds.width > 0, bounds.height > 0 else { return }
    let scale = window?.backingScaleFactor ?? 2
    let size = CGSize(width: bounds.width * scale, height: bounds.height * scale)
    if metalLayer.drawableSize != size { metalLayer.drawableSize = size }
    guard let drawable = metalLayer.nextDrawable(),
          let output = try? RealityRenderer.CameraOutput(.singleProjection(colorTexture: drawable.texture))
    else { return }
    try? renderer.updateAndRender(deltaTime: deltaTime, cameraOutput: output, onComplete: { _ in
      drawable.present()
    })
  }

  // MARK: Orbit

  override func mouseDown(with event: NSEvent) {
    guard interactive else { return super.mouseDown(with: event) }
    dragStart = (convert(event.locationInWindow, from: nil), camera)
  }

  override func mouseDragged(with event: NSEvent) {
    guard interactive, let dragStart else { return super.mouseDragged(with: event) }
    let point = convert(event.locationInWindow, from: nil)
    camera.yaw = dragStart.camera.yaw - Float(point.x - dragStart.point.x) * 0.01
    camera.pitch = dragStart.camera.pitch - Float(point.y - dragStart.point.y) * 0.01
    camera.place(cameraEntity)
    renderFrame(deltaTime: 0)
  }

  override func mouseUp(with event: NSEvent) {
    dragStart = nil
    super.mouseUp(with: event)
  }
}

@available(macOS 15, *)
struct RKRendererACView: View {
  let state: ACState
  let isActive: Bool
  var interactive = true

  @State private var airflowOrigin: SIMD3<Float>?

  var body: some View {
    Representable(state: state, interactive: interactive) { airflowOrigin = $0 }
      .overlay {
        RKAirflowView(mode: isActive && state.status ? state.mode : nil, origin: airflowOrigin)
          .allowsHitTesting(false)
      }
  }

  private struct Representable: NSViewRepresentable {
    let state: ACState
    let interactive: Bool
    let onReady: (SIMD3<Float>) -> Void

    func makeNSView(context: Context) -> RKRendererNSView {
      let view = RKRendererNSView(frame: .zero)
      view.onReady = onReady
      return view
    }

    func updateNSView(_ view: RKRendererNSView, context: Context) {
      view.interactive = interactive
      view.update(state: state)
    }
  }
}
