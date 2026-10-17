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

/// The bundled model. Renderers keep their own engine (SceneKit in CuteAC,
/// RealityKit in Yun Home) but load the same file and part names.
public enum ACModel {
  public static var url: URL? { Bundle.module.url(forResource: "CuteAC", withExtension: "usdz") }

  /// Named nodes exported by `apps/macos/Model/build_cute_ac.py`.
  public enum Part {
    public static let louver = "Louver"
    public static let display = "Display"
    public static let led = "Led"
  }

  /// Louver angle while running, in radians.
  public static let openLouverAngle = 40 * Double.pi / 180
}
