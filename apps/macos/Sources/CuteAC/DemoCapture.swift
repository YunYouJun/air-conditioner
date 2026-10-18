import AppKit
import CuteACKit
import SwiftUI

/// `CuteAC --capture <dir>` opens the popover, plays a short scripted demo and
/// writes PNG frames rendered from the live view hierarchy (no screen
/// recording permission needed). Used to produce the docs GIF:
///
///     ffmpeg -framerate 15 -i <dir>/frame-%03d.png ... demo.gif
@MainActor
final class DemoCapture {
  private let view: NSView
  private let store: ACStore
  private let directory: URL
  private var frameIndex = 0
  private let fps = 15.0

  init(view: NSView, store: ACStore, directory: URL) {
    self.view = view
    self.store = store
    self.directory = directory
  }

  func run() async {
    try? FileManager.default.removeItem(at: directory)
    try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)

    // Start from a known state: off, cooling, 24°C.
    if store.state.status { store.togglePower() }
    store.setMode(.cold)
    store.changeTemperature(by: 24 - store.state.temperature)
    await record(seconds: 1.0)

    let steps: [(String?, Double, () -> Void)] = [
      ("on-cold", 1.8, { self.store.togglePower() }),
      (nil, 0.5, { self.store.changeTemperature(by: -1) }),
      ("cold-22", 1.2, { self.store.changeTemperature(by: -1) }),
      ("on-hot", 1.4, { self.store.setMode(.hot) }),
      (nil, 0.5, { self.store.changeTemperature(by: 3) }),
      ("hot-28", 1.6, { self.store.changeTemperature(by: 3) }),
      ("decimal-25-5", 1.0, { self.store.changeTemperature(by: 25.5 - self.store.state.temperature) }),
      ("off", 1.4, { self.store.togglePower() }),
    ]
    for (still, seconds, action) in steps {
      withAnimation(.snappy) { action() }
      await record(seconds: seconds, stillName: still)
    }
    print("Captured \(frameIndex) frames to \(directory.path)")
  }

  private func record(seconds: Double, stillName: String? = nil) async {
    let frames = Int(seconds * fps)
    for index in 0..<frames {
      try? await Task.sleep(nanoseconds: UInt64(1_000_000_000 / fps))
      guard let png = captureFrame() else { continue }
      try? png.write(to: directory.appendingPathComponent(String(format: "frame-%03d.png", frameIndex)))
      frameIndex += 1
      if index == frames - 1, let stillName {
        try? png.write(to: directory.appendingPathComponent("still-\(stillName).png"))
      }
    }
  }

  /// Draws the SwiftUI controls, then the live SceneKit snapshot and the
  /// airflow layers (cacheDisplay cannot see Metal or CA animations).
  private func captureFrame() -> Data? {
    let bounds = view.bounds
    let scale: CGFloat = 2
    guard let rep = NSBitmapImageRep(
      bitmapDataPlanes: nil,
      pixelsWide: Int(bounds.width * scale),
      pixelsHigh: Int(bounds.height * scale),
      bitsPerSample: 8,
      samplesPerPixel: 4,
      hasAlpha: true,
      isPlanar: false,
      colorSpaceName: .deviceRGB,
      bytesPerRow: 0,
      bitsPerPixel: 0
    ) else { return nil }
    rep.size = bounds.size

    guard let controls = view.bitmapImageRepForCachingDisplay(in: bounds) else { return nil }
    view.cacheDisplay(in: bounds, to: controls)

    NSGraphicsContext.saveGraphicsState()
    defer { NSGraphicsContext.restoreGraphicsState() }
    guard let context = NSGraphicsContext(bitmapImageRep: rep) else { return nil }
    NSGraphicsContext.current = context
    let cg = context.cgContext

    // Popover-like card behind the content.
    NSColor(calibratedWhite: 0.97, alpha: 1).setFill()
    NSBezierPath(roundedRect: bounds, xRadius: 14, yRadius: 14).fill()
    // draw(in:) copies, which would wipe the card; blend over it instead.
    controls.draw(in: bounds, from: .zero, operation: .sourceOver, fraction: 1, respectFlipped: true, hints: nil)

    if let container = Self.find(ACSceneContainerView.self, in: view) {
      var rect = container.convert(container.bounds, to: view)
      if view.isFlipped {
        rect.origin.y = bounds.height - rect.maxY
      }
      container.sceneView.snapshot().draw(in: rect)

      if let airflow = container.airflowLayer.presentation() ?? Optional(container.airflowLayer) {
        cg.saveGState()
        cg.translateBy(x: rect.minX + airflow.position.x, y: rect.minY + airflow.position.y)
        for sublayer in airflow.sublayers ?? [] {
          let layer = sublayer.presentation() ?? sublayer
          cg.saveGState()
          cg.translateBy(x: layer.position.x, y: layer.position.y)
          cg.concatenate(CATransform3DGetAffineTransform(layer.transform))
          cg.translateBy(x: -layer.bounds.midX, y: -layer.bounds.midY)
          cg.setAlpha(CGFloat(layer.opacity))
          // render(in:) ignores presentation layers, so draw the two layer
          // kinds the airflow uses by hand.
          if let shape = sublayer as? CAShapeLayer, let path = shape.path {
            cg.addPath(path)
            cg.setStrokeColor(shape.strokeColor ?? .white)
            cg.setLineWidth(shape.lineWidth)
            cg.setLineCap(.round)
            cg.strokePath()
          }
          else if let contents = sublayer.contents, CFGetTypeID(contents as CFTypeRef) == CGImage.typeID {
            cg.draw(contents as! CGImage, in: sublayer.bounds)
          }
          cg.restoreGState()
        }
        cg.restoreGState()
      }
    }

    return rep.representation(using: .png, properties: [:])
  }

  private static func find<T: NSView>(_ type: T.Type, in view: NSView) -> T? {
    if let match = view as? T { return match }
    for subview in view.subviews {
      if let match = find(type, in: subview) { return match }
    }
    return nil
  }
}
