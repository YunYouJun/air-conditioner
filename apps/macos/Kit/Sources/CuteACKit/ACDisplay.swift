import AppKit
import CuteACCore

/// The LCD texture on the unit's front panel, drawn once per change with the
/// Digital-7 seven-segment face; unlit "88" segments sit behind the digits
/// like a real panel. When a room reading is given, the room (Mac)
/// temperature sits top right and the wind bars next to the mode icon. The
/// texture is tiny and costs nothing while idle.
public enum ACDisplay {
  /// Matches the Display part's UVs in `CuteAC.usdz`.
  public static let size = NSSize(width: 250, height: 100)

  public static func image(for state: ACState, room: RoomReading? = nil) -> NSImage {
    NSImage(size: size, flipped: false) { rect in
      NSColor(calibratedRed: 0.07, green: 0.09, blue: 0.12, alpha: 1).setFill()
      rect.fill()

      let font = ACFonts.digital(size: 84)
      let color = state.status ? ACPalette.accent(for: state.mode) : NSColor(calibratedWhite: 1, alpha: 0)
      let ghost = NSAttributedString(string: "88", attributes: [
        .font: font,
        .foregroundColor: NSColor(calibratedWhite: 1, alpha: 0.06),
      ])
      let digitsSize = ghost.size()
      let origin = NSPoint(x: 24, y: (rect.height - digitsSize.height) / 2 + 4)
      ghost.draw(at: origin)
      guard state.status else { return true }

      // Fractional set points from real devices ("26.5") use a smaller face.
      let label = state.temperatureLabel
      NSAttributedString(string: label, attributes: [
        .font: label.count > 2 ? ACFonts.digital(size: 58) : font,
        .foregroundColor: color,
      ]).draw(at: origin)

      NSAttributedString(string: "°C", attributes: [
        .font: NSFont.systemFont(ofSize: 22, weight: .bold),
        .foregroundColor: color.withAlphaComponent(0.85),
      ]).draw(at: NSPoint(x: origin.x + digitsSize.width + 6, y: rect.midY + 6))

      let symbolName = state.mode == .cold ? "snowflake" : "sun.max.fill"
      if let symbol = NSImage(systemSymbolName: symbolName, accessibilityDescription: nil)?
        .withSymbolConfiguration(.init(pointSize: 26, weight: .bold)) {
        tinted(symbol, color: color).draw(in: NSRect(x: rect.maxX - 58, y: 16, width: 28, height: 28))
      }
      if let room {
        drawRoom(room, accent: color, in: rect)
      }
      return true
    }
  }

  private static func drawRoom(_ room: RoomReading, accent: NSColor, in rect: NSRect) {
    // Wind bars: three rising bars left of the mode icon, lit up to the level.
    let barWidth: CGFloat = 5
    for index in 0..<RoomReading.windLevels.upperBound {
      let height = 8 + CGFloat(index) * 6
      let bar = NSRect(x: rect.maxX - 90 + CGFloat(index) * (barWidth + 3), y: 18, width: barWidth, height: height)
      (index < room.windLevel ? accent : NSColor(calibratedWhite: 1, alpha: 0.08)).setFill()
      NSBezierPath(roundedRect: bar, xRadius: 1, yRadius: 1).fill()
    }

    guard let celsius = room.celsius else { return }
    let color = ACPalette.warning(for: room.thermalState) ?? NSColor(calibratedWhite: 1, alpha: 0.55)
    let digits = NSAttributedString(string: "\(min(celsius, 99))", attributes: [
      .font: ACFonts.digital(size: 30),
      .foregroundColor: color,
    ])
    // A thermometer glyph turns to mush at LCD size; a small degree mark
    // after the digits reads better.
    let degree = NSAttributedString(string: "°", attributes: [
      .font: NSFont.systemFont(ofSize: 16, weight: .bold),
      .foregroundColor: color,
    ])
    let size = digits.size()
    let origin = NSPoint(x: rect.maxX - 26 - size.width, y: rect.maxY - 16 - size.height)
    digits.draw(at: origin)
    degree.draw(at: NSPoint(x: origin.x + size.width + 1, y: origin.y + size.height - degree.size().height))
  }

  private static func tinted(_ symbol: NSImage, color: NSColor) -> NSImage {
    NSImage(size: symbol.size, flipped: false) { symbolRect in
      symbol.draw(in: symbolRect)
      color.set()
      symbolRect.fill(using: .sourceAtop)
      return true
    }
  }
}
