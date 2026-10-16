import AppKit
import RealityKit
import SwiftUI

/// Experimental RealityKit version of `ACSceneView` (`--realitykit`).
/// Each view owns its own clone of the model; drag orbits the camera like
/// SceneKit's turntable controller, and the airflow stays a CA overlay.
@available(macOS 15, *)
struct RKACView: View {
  let state: ACState
  let isActive: Bool
  var interactive = true

  @State private var holder = Holder()
  @State private var camera = RKCamera()
  @State private var dragStart: RKCamera?
  @State private var airflowOrigin: SIMD3<Float>?

  @MainActor
  final class Holder {
    var rig: RKACRig?
    let camera = RKCamera.makeEntity()
  }

  var body: some View {
    RealityView { content in
      content.camera = .virtual
      content.renderingEffects.antialiasing = .multisample4X
      content.renderingEffects.motionBlur = .disabled
      content.renderingEffects.depthOfField = .disabled
      content.renderingEffects.cameraGrain = .disabled
      guard let rig = try? await RKACRig.make() else { return }
      rig.apply(state, animated: false)
      holder.rig = rig
      airflowOrigin = rig.airflowOrigin
      camera.place(holder.camera)
      content.add(rig.root)
      content.add(holder.camera)
    } update: { _ in
      holder.rig?.apply(state, animated: true)
      camera.place(holder.camera)
    }
    .overlay {
      RKAirflowView(mode: isActive && state.status ? state.mode : nil, origin: airflowOrigin)
        .allowsHitTesting(false)
    }
    .gesture(orbit, including: interactive ? .all : .none)
  }

  /// Turntable orbit with SceneKit's ±25° vertical limit.
  private var orbit: some Gesture {
    DragGesture(minimumDistance: 1)
      .onChanged { value in
        let start = dragStart ?? camera
        dragStart = start
        var next = start
        next.yaw = start.yaw - Float(value.translation.width) * 0.01
        next.pitch = start.pitch + Float(value.translation.height) * 0.01
        camera = next
      }
      .onEnded { _ in dragStart = nil }
  }
}

/// Hosts the shared Core Animation airflow (`ACSceneContainerView.populateAirflow`).
@available(macOS 15, *)
struct RKAirflowView: NSViewRepresentable {
  let mode: ACMode?
  let origin: SIMD3<Float>?

  final class OverlayView: NSView {
    let airflowLayer = CALayer()
    var mode: ACMode? {
      didSet { if mode != oldValue { populate() } }
    }
    var origin: SIMD3<Float>?
    private var populatedWidth: CGFloat = 0

    override init(frame: NSRect) {
      super.init(frame: frame)
      wantsLayer = true
      layer?.isOpaque = false
      layer?.addSublayer(airflowLayer)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
      fatalError("init(coder:) has not been implemented")
    }

    /// The flakes are spread across the view width, so rebuild once it is known.
    private func populate() {
      populatedWidth = bounds.width
      ACSceneContainerView.populateAirflow(airflowLayer, mode: mode, width: bounds.width)
    }

    override func layout() {
      super.layout()
      if bounds.width != populatedWidth { populate() }
      guard let origin, bounds.width > 0 else { return }
      CATransaction.begin()
      CATransaction.setDisableActions(true)
      airflowLayer.position = RKCamera.project(origin, in: bounds.size)
      CATransaction.commit()
    }
  }

  func makeNSView(context: Context) -> OverlayView {
    OverlayView(frame: .zero)
  }

  func updateNSView(_ view: OverlayView, context: Context) {
    view.origin = origin
    view.mode = mode
    view.needsLayout = true
  }
}
