import AppKit
import CoreText

/// Digital-7 Mono, the same seven-segment face the web components use
/// (`packages/vue/public/assets/fonts/digital-7-mono.ttf`).
enum ACFonts {
  static let digitalName = "Digital-7Mono"

  private static let registered: Void = {
    if let url = Bundle.module.url(forResource: "digital-7-mono", withExtension: "ttf") {
      CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
    }
  }()

  static func registerIfNeeded() {
    _ = registered
  }

  static func digital(size: CGFloat) -> NSFont {
    registerIfNeeded()
    return NSFont(name: digitalName, size: size)
      ?? .monospacedDigitSystemFont(ofSize: size, weight: .bold)
  }
}
