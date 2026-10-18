import AppKit

/// A fresh, transparent positioning window gives NSPopover a real view on the
/// clicked display before it opens. Secondary menu bars can otherwise report
/// the status item's previous window/screen until after the click is handled.
@MainActor
final class PopoverPresentation {
  private var anchorWindow: NSPanel?
  private var screenObserver: NSObjectProtocol?

  func prepare(for button: NSStatusBarButton) -> (view: NSView, maximumContentHeight: CGFloat)? {
    guard let window = button.window else { return nil }
    let buttonRect = window.convertToScreen(button.convert(button.bounds, to: nil))
    let event = NSApp.currentEvent
    let isMouseClick = event?.type == .leftMouseUp || event?.type == .leftMouseDown
    let point = isMouseClick ? NSEvent.mouseLocation : NSPoint(x: buttonRect.midX, y: buttonRect.midY)
    guard let screen = NSScreen.screens.first(where: { $0.frame.contains(point) }) ?? window.screen else { return nil }
    let anchor = PopoverGeometry.anchor(buttonRect: buttonRect, click: point, screenFrame: screen.frame,
                                        menuBarHeight: NSStatusBar.system.thickness)
    return prepare(anchor: anchor, on: screen)
  }

  func prepare(anchor: NSRect, on screen: NSScreen) -> (view: NSView, maximumContentHeight: CGFloat) {
    close()
    let panel = NSPanel(contentRect: anchor, styleMask: [.borderless, .nonactivatingPanel],
                        backing: .buffered, defer: false)
    panel.backgroundColor = .clear
    panel.isOpaque = false
    panel.hasShadow = false
    panel.ignoresMouseEvents = true
    panel.hidesOnDeactivate = false
    panel.isReleasedWhenClosed = false
    panel.level = .statusBar
    panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .ignoresCycle]
    let view = NSView(frame: NSRect(origin: .zero, size: anchor.size))
    panel.contentView = view
    panel.orderFrontRegardless()
    anchorWindow = panel
    return (view, PopoverGeometry.contentHeight(in: screen.visibleFrame))
  }

  func observeScreenChanges(for popover: NSPopover) {
    screenObserver = NotificationCenter.default.addObserver(
      forName: NSApplication.didChangeScreenParametersNotification, object: nil, queue: .main
    ) { [weak popover] _ in
      MainActor.assumeIsolated { popover?.performClose(nil) }
    }
  }

  func close() {
    if let screenObserver { NotificationCenter.default.removeObserver(screenObserver) }
    screenObserver = nil
    anchorWindow?.close()
    anchorWindow = nil
  }
}

/// AppKit screen coordinates are points and may have negative origins. The
/// backing pixel scale must never be applied to the menu bar's anchor.
enum PopoverGeometry {
  static func anchor(buttonRect: NSRect, click: NSPoint, screenFrame: NSRect, menuBarHeight: CGFloat) -> NSRect {
    if screenFrame.contains(buttonRect) { return buttonRect }
    return NSRect(x: min(max(click.x - buttonRect.width / 2, screenFrame.minX), screenFrame.maxX - buttonRect.width),
                  y: screenFrame.maxY - menuBarHeight, width: buttonRect.width, height: menuBarHeight)
  }

  static func contentHeight(in visibleFrame: NSRect) -> CGFloat {
    // Space for the popover arrow/frame, plus a small margin above the Dock.
    max(1, visibleFrame.height - 40)
  }
}
