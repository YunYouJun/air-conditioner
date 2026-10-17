import AppKit
import CuteACCore

/// Cold: a few snowflakes drift down and spin. Hot: warm wavy strokes. Both
/// are plain repeating CA animations, so the render server runs them and the
/// app process does no per-frame work (unlike CAEmitterLayer, which cost
/// ~10% CPU). A higher wind level (the Mac's fans spinning up) means more,
/// faster particles that travel further; level 1 is the original look.
///
/// Hosts position the layer just below the louver and call `configure`
/// whenever the mode, wind level or available width changes.
public final class ACAirflowLayer: CALayer {
  /// Wall units blow down; towers blow sideways out of the opened flap.
  public enum Direction: Sendable {
    case down
    case side
  }

  public struct Flow: Equatable, Sendable {
    public var mode: ACMode
    public var windLevel: Int
    public var direction: Direction

    public init(mode: ACMode, windLevel: Int = 1, direction: Direction = .down) {
      self.mode = mode
      self.windLevel = windLevel
      self.direction = direction
    }
  }

  public private(set) var flow: Flow?

  /// `span` is the spread across the outlet in points: horizontal for `.down`
  /// (usually ~78% of the view width), vertical for `.side`. Passing nil
  /// clears the overlay.
  public func configure(_ flow: Flow?, span: CGFloat) {
    self.flow = flow
    sublayers?.forEach { $0.removeFromSuperlayer() }
    guard let flow else { return }

    let color = ACPalette.accent(for: flow.mode)
    let now = CACurrentMediaTime()
    let span = min(260, span)
    let level = min(RoomReading.windLevels.upperBound, max(RoomReading.windLevels.lowerBound, flow.windLevel))
    let boost = CGFloat(level - 1) // 0, 1, 2
    let speed = 1 + 0.3 * boost
    let reach = 1 + 0.15 * boost
    let side = flow.direction == .side
    // Particles line up across the outlet and drift away from it: down for a
    // wall unit, to the right for a tower. Positions are relative to the
    // layer's origin, which the host places at the outlet.
    func place(_ across: CGFloat, _ out: CGFloat) -> CGPoint {
      side ? CGPoint(x: -out, y: -across) : CGPoint(x: across, y: out)
    }

    switch flow.mode {
    case .cold:
      let flake = Self.snowflakeImage(color: color)
      let count = 6 + level - 1
      let duration = 2.4 / speed
      for index in 0..<count {
        let layer = CALayer()
        let size: CGFloat = index.isMultiple(of: 2) ? 14 : 10
        layer.bounds = CGRect(x: 0, y: 0, width: size, height: size)
        layer.contents = flake
        layer.position = place(span * (CGFloat(index) / CGFloat(count - 1) - 0.5), -6)
        layer.opacity = 0
        layer.add(Self.flowAnimation(
          keyPath: side ? "transform.translation.x" : "transform.translation.y",
          distance: (index.isMultiple(of: 2) ? 42 : 34) * reach * (side ? 1 : -1),
          duration: duration,
          spin: index.isMultiple(of: 2) ? .pi : -.pi,
          beginTime: now + Double((index * 5) % count) * duration / Double(count)
        ), forKey: "flow")
        addSublayer(layer)
      }
    case .hot:
      let count = 3 + level - 1
      let spacing = span / CGFloat(count)
      let duration = 1.8 / speed
      for index in 0..<count {
        let line = CAShapeLayer()
        line.bounds = CGRect(x: 0, y: -6, width: 64, height: 12)
        // Horizontal waves either way: stacked along the outlet for a tower.
        line.position = side
          ? CGPoint(x: 36, y: -(CGFloat(index) - CGFloat(count - 1) / 2) * spacing)
          : CGPoint(x: (CGFloat(index) - CGFloat(count - 1) / 2) * spacing, y: -8)
        line.path = Self.windPath(width: 64, amplitude: 6)
        line.strokeColor = color.cgColor
        line.fillColor = nil
        line.lineWidth = 2.4
        line.lineCap = .round
        line.opacity = 0
        line.add(Self.flowAnimation(
          keyPath: side ? "transform.translation.x" : "transform.translation.y",
          distance: 30 * reach * (side ? 1 : -1),
          duration: duration,
          spin: 0,
          beginTime: now + Double(index) * duration / Double(count)
        ), forKey: "flow")
        addSublayer(line)
      }
    }
  }

  private static func flowAnimation(keyPath: String, distance: CGFloat, duration: CFTimeInterval, spin: CGFloat,
                                    beginTime: CFTimeInterval) -> CAAnimation {
    let drift = CABasicAnimation(keyPath: keyPath)
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
