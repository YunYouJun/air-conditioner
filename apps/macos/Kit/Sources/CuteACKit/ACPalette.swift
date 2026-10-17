import AppKit
import CuteACCore

/// Colours every CuteAC renderer shares, so the menu bar app, Yun Home and
/// the web components read as the same unit.
public enum ACPalette {
  public static func accent(for mode: ACMode) -> NSColor {
    switch mode {
    case .cold: NSColor(calibratedRed: 0.35, green: 0.66, blue: 1, alpha: 1)
    case .hot: NSColor(calibratedRed: 1, green: 0.62, blue: 0.35, alpha: 1)
    }
  }

  /// Nil while the Mac is comfortable; a warm warning colour once macOS
  /// starts managing heat.
  public static func warning(for level: ThermalLevel) -> NSColor? {
    switch level {
    case .nominal: nil
    case .fair: NSColor(calibratedRed: 1, green: 0.78, blue: 0.3, alpha: 1)
    case .serious: NSColor(calibratedRed: 1, green: 0.55, blue: 0.25, alpha: 1)
    case .critical: NSColor(calibratedRed: 1, green: 0.32, blue: 0.3, alpha: 1)
    }
  }

  /// Indicator LED: mode colour while running, grey when off.
  public static func led(for state: ACState) -> NSColor {
    state.status ? accent(for: state.mode) : NSColor(calibratedRed: 0.56, green: 0.6, blue: 0.67, alpha: 1)
  }
}

/// The bundled models. Renderers keep their own engine (SceneKit in CuteAC,
/// RealityKit in Yun Home) but load the same files and part names.
public enum ACModel {
  /// The wall unit, kept for hosts that predate `ACForm`.
  public static var url: URL? { url(for: .wall) }

  public static func url(for form: ACForm) -> URL? {
    Bundle.module.url(forResource: form == .wall ? "CuteAC" : "CuteACTower", withExtension: "usdz")
  }

  /// Named nodes exported by `apps/macos/Model/build_cute_ac.py`.
  public enum Part {
    public static let louver = "Louver"
    public static let display = "Display"
    public static let led = "Led"
  }

  /// Wall louver angle while running, in radians.
  public static let openLouverAngle = 40 * Double.pi / 180

  /// How the Louver node moves while running. Node-local axes follow
  /// Blender's (Z up), even though the exported scene is Y up.
  public struct LouverMotion: Equatable, Sendable {
    /// What turns: the Louver node itself, or each of its children.
    public enum Pivot: Sendable {
      case node
      case children
    }

    public var pivot: Pivot
    /// Unit rotation axis in the turning node's local space.
    public var axis: SIMD3<Float>
    /// Angle while running, in radians; 0 while off.
    public var openAngle: Double
  }

  public static func louver(for form: ACForm) -> LouverMotion {
    switch form {
    // One flap tilting down about its top-edge hinge.
    case .wall: LouverMotion(pivot: .node, axis: [1, 0, 0], openAngle: openLouverAngle)
    // Horizontal blinds, each tilting about its own centre line.
    case .tower: LouverMotion(pivot: .children, axis: [1, 0, 0], openAngle: 30 * Double.pi / 180)
    }
  }

  /// Where the airflow overlay starts, relative to the louver node's world
  /// position (Y up, +Z towards the viewer), and how far it spreads.
  public struct AirflowAnchor: Equatable, Sendable {
    public var offset: SIMD3<Float>
    /// Extent of the outlet along the flow's spread axis, in model units.
    public var extent: Float
    public var direction: ACAirflowLayer.Direction
  }

  public static func airflow(for form: ACForm) -> AirflowAnchor {
    switch form {
    // Just below the louver, spreading along the unit's width.
    case .wall: AirflowAnchor(offset: [0, -0.1, 0.05], extent: 1.5, direction: .down)
    // Just right of the blinds, spreading along the outlet's height.
    case .tower: AirflowAnchor(offset: [0.24, 0, 0.08], extent: 0.5, direction: .side)
    }
  }
}
