import SwiftUI

/// Which engine draws the 3D unit. SceneKit is the default; `--realitykit`
/// (RealityView) and `--realitykit-renderer` (on-demand RealityRenderer) opt
/// into the experimental RealityKit paths (see docs/realitykit-spike.md).
enum RenderBackend {
  case sceneKit
  case realityKit
  case realityKitRenderer

  static let current: RenderBackend = {
    let arguments = CommandLine.arguments
    let requested: RenderBackend = arguments.contains("--realitykit-renderer") ? .realityKitRenderer
      : arguments.contains("--realitykit") ? .realityKit
      : .sceneKit
    guard requested != .sceneKit else { return .sceneKit }
    if #available(macOS 15, *) { return requested }
    print("RealityKit needs macOS 15; falling back to SceneKit")
    return .sceneKit
  }()

  var usesRealityKit: Bool { self != .sceneKit }
}

/// Owns the renderer-specific state shared by the popover and the desktop pet.
/// On the RealityKit path the SceneKit scene is never created.
@MainActor
final class ACRenderHost {
  let backend = RenderBackend.current
  private(set) lazy var sceneController = ACSceneController()

  func prepare(_ state: ACState) {
    guard backend == .sceneKit else { return }
    sceneController.apply(state, animated: false)
  }

  func setActive(_ active: Bool) {
    guard backend == .sceneKit else { return }
    sceneController.setActive(active)
  }
}

struct ACModelView: View {
  let host: ACRenderHost
  let state: ACState
  let isActive: Bool
  var interactive = true

  var body: some View {
    if #available(macOS 15, *) {
      switch host.backend {
      case .realityKit:
        RKACView(state: state, isActive: isActive, interactive: interactive)
      case .realityKitRenderer:
        RKRendererACView(state: state, isActive: isActive, interactive: interactive)
      case .sceneKit:
        sceneKitView
      }
    }
    else {
      sceneKitView
    }
  }

  private var sceneKitView: some View {
    ACSceneView(controller: host.sceneController, state: state, isActive: isActive, interactive: interactive)
  }
}
