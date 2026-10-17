import AppKit
import SwiftUI

/// Borderless, fully transparent panel that shows only the 3D unit on the
/// desktop. Drag to move, double-click to toggle power, right-click for a
/// menu. It sits just above the desktop icons (below normal windows) unless
/// "always on top" is enabled.
@MainActor
final class DesktopPetPanel: NSPanel {
  var onToggleAlwaysOnTop: ((Bool) -> Void)?
  var onDoubleClick: (() -> Void)?
  var onHide: (() -> Void)?
  private var dragOffset: NSPoint?

  static let desktopLevel = NSWindow.Level(rawValue: Int(CGWindowLevelForKey(.desktopIconWindow)) + 1)

  init(content: NSView, alwaysOnTop: Bool) {
    super.init(
      contentRect: NSRect(x: 0, y: 0, width: 300, height: 190),
      styleMask: [.borderless, .nonactivatingPanel],
      backing: .buffered,
      defer: false
    )
    isOpaque = false
    backgroundColor = .clear
    hasShadow = false
    hidesOnDeactivate = false
    isReleasedWhenClosed = false
    collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle, .fullScreenAuxiliary]
    level = alwaysOnTop ? .floating : Self.desktopLevel
    contentView = content
    if !setFrameUsingName("CuteAC.DesktopPet") {
      positionTopRight()
    }
    setFrameAutosaveName("CuteAC.DesktopPet")
  }

  override var canBecomeKey: Bool { false }

  /// Handle drag/double-click/right-click here so the SCNView underneath does
  /// not need to know about window management.
  override func sendEvent(_ event: NSEvent) {
    switch event.type {
    case .leftMouseDown:
      if event.clickCount == 2 {
        onDoubleClick?()
      }
      dragOffset = event.locationInWindow
    case .leftMouseDragged:
      if let dragOffset {
        let mouse = NSEvent.mouseLocation
        setFrameOrigin(NSPoint(x: mouse.x - dragOffset.x, y: mouse.y - dragOffset.y))
      }
    case .leftMouseUp:
      dragOffset = nil
    case .rightMouseDown:
      if let contentView {
        NSMenu.popUpContextMenu(contextMenu(), with: event, for: contentView)
      }
    default:
      super.sendEvent(event)
    }
  }

  private func contextMenu() -> NSMenu {
    let menu = NSMenu()
    let power = NSMenuItem(title: "开关空调（双击）", action: #selector(menuToggle), keyEquivalent: "")
    power.target = self
    menu.addItem(power)
    let onTop = NSMenuItem(title: "始终置顶", action: #selector(menuOnTop), keyEquivalent: "")
    onTop.target = self
    onTop.state = level == .floating ? .on : .off
    menu.addItem(onTop)
    menu.addItem(.separator())
    let hide = NSMenuItem(title: "隐藏桌面挂件", action: #selector(menuHide), keyEquivalent: "")
    hide.target = self
    menu.addItem(hide)
    return menu
  }

  @objc private func menuToggle() { onDoubleClick?() }

  @objc private func menuOnTop() {
    let enable = level != .floating
    level = enable ? .floating : Self.desktopLevel
    onToggleAlwaysOnTop?(enable)
  }

  @objc private func menuHide() { onHide?() }

  private func positionTopRight() {
    guard let screen = NSScreen.main?.visibleFrame else { return }
    setFrameOrigin(NSPoint(x: screen.maxX - frame.width - 40, y: screen.maxY - frame.height - 40))
  }
}

struct DesktopPetView: View {
  @ObservedObject var store: ACStore
  @ObservedObject var thermal: ThermalMonitor
  let sceneController: ACSceneController

  var body: some View {
    ACSceneView(controller: sceneController, state: store.state, room: thermal.reading, isActive: true, interactive: false)
      .frame(width: 300, height: 190)
  }
}
