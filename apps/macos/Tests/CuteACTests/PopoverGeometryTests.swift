import AppKit
import SwiftUI
import Testing
@testable import CuteAC

@Suite struct PopoverGeometryTests {
  @Test(arguments: [
    NSRect(x: -1920, y: -180, width: 1920, height: 1080),
    NSRect(x: 1728, y: 400, width: 1920, height: 1080),
    NSRect(x: 0, y: 1117, width: 1280, height: 720),
  ])
  func staleStatusWindowUsesTheClickedDisplay(screen: NSRect) {
    let stale = NSRect(x: 1400, y: 1093, width: 24, height: 24)
    for x in [screen.minX + 1, screen.midX, screen.maxX - 1] {
      let click = NSPoint(x: x, y: screen.maxY - 12)
      let anchor = PopoverGeometry.anchor(buttonRect: stale, click: click, screenFrame: screen, menuBarHeight: 24)
      #expect(screen.contains(anchor))
      #expect(anchor.contains(click))
      #expect(anchor.maxY == screen.maxY)
    }
  }

  @Test func currentStatusWindowKeepsItsExactAnchor() {
    let screen = NSRect(x: 0, y: 0, width: 1728, height: 1117)
    let button = NSRect(x: 1400, y: 1093, width: 24, height: 24)
    #expect(PopoverGeometry.anchor(buttonRect: button, click: NSPoint(x: 1402, y: 1100),
                                  screenFrame: screen, menuBarHeight: 24) == button)
    #expect(PopoverGeometry.contentHeight(in: NSRect(x: -1280, y: 200, width: 1280, height: 560)) == 520)
  }
}

@MainActor @Test func tallContentIsMeasuredAndCappedBeforePresentation() {
  _ = NSApplication.shared
  let controller = PopoverContentController(rootView:
    VStack { Text("顶部"); Spacer(); Text("底部") }.frame(width: 360, height: 900)
  )
  controller.prepare(maximumContentHeight: 400)
  #expect(controller.preferredContentSize.height == 400)
  let scroll = controller.view.subviews.compactMap { $0 as? NSScrollView }.first
  #expect(scroll?.documentView?.frame.height == 900)
  #expect(scroll?.contentView.bounds.height == 400)
  #expect(scroll?.contentView.bounds.width == 360)
  controller.prepare(maximumContentHeight: 1000)
  #expect(controller.preferredContentSize.height == 900)
}

@MainActor private final class ContentHeight: ObservableObject {
  @Published var value: CGFloat = 400
}

private struct ResizingContent: View {
  @ObservedObject var height: ContentHeight
  var body: some View {
    VStack { Text("顶部"); Spacer(); Text("底部") }.frame(width: 360, height: height.value)
  }
}

@MainActor @Test func visibleContentResizesWithoutClipping() async throws {
  _ = NSApplication.shared
  let screen = try #require(NSScreen.screens.first)
  let height = ContentHeight()
  let controller = PopoverContentController(rootView: ResizingContent(height: height))
  let presentation = PopoverPresentation()
  let target = presentation.prepare(anchor: NSRect(x: screen.visibleFrame.maxX - 80,
    y: screen.visibleFrame.maxY, width: 24, height: 24), on: screen)
  controller.prepare(maximumContentHeight: 600)
  let popover = NSPopover()
  popover.animates = false
  popover.contentViewController = controller
  controller.onSizeChange = { [weak popover] size in popover?.contentSize = size }
  popover.contentSize = controller.preferredContentSize
  popover.show(relativeTo: target.view.bounds, of: target.view, preferredEdge: .minY)
  defer { popover.close(); presentation.close() }
  let scroll = try #require(controller.view.subviews.first as? NSScrollView)
  for value: CGFloat in [530, 900, 400] {
    height.value = value
    try await Task.sleep(for: .milliseconds(200))
    #expect(controller.preferredContentSize.height == min(value, 600))
    #expect(popover.contentSize.height == min(value, 600))
    #expect(scroll.documentView?.frame.height == value)
    #expect(scroll.contentView.bounds.height == min(value, 600))
    #expect(scroll.contentView.bounds.width == 360)
    #expect(controller.view.superview?.bounds.contains(controller.view.frame) == true)
    if value <= 600 {
      let bounds = try #require(scroll.documentView).bounds
      let visible = scroll.documentVisibleRect
      #expect(visible.contains(bounds), "Height \(value), flipped \(scroll.documentView!.isFlipped)")
    }
  }
}

@MainActor @Test func firstPopoverFrameIsAlreadyOnEachConnectedScreen() async throws {
  _ = NSApplication.shared
  let presentation = PopoverPresentation()
  let controller = PopoverContentController(rootView: Text("弹窗定位检查").frame(width: 360, height: 500))
  let popover = NSPopover()
  popover.contentViewController = controller
  defer { popover.close(); presentation.close() }
  // Reuse the same popover, as the app does when alternating menu bars.
  let screens = NSScreen.screens
  for screen in screens + screens.reversed() {
    let anchor = NSRect(x: screen.visibleFrame.maxX - 80, y: screen.visibleFrame.maxY, width: 24, height: 24)
    let target = presentation.prepare(anchor: anchor, on: screen)
    controller.prepare(maximumContentHeight: target.maximumContentHeight)
    popover.animates = true
    popover.contentSize = controller.preferredContentSize
    popover.show(relativeTo: target.view.bounds, of: target.view, preferredEdge: .minY)
    let window = try #require(controller.view.window)
    let firstFrame = window.frame
    #expect(screen.frame.contains(firstFrame))
    #expect(firstFrame.minY >= screen.visibleFrame.minY)
    try await Task.sleep(for: .milliseconds(250))
    #expect(window.frame == firstFrame)
    popover.animates = false
    popover.close()
    presentation.close()
  }
}
