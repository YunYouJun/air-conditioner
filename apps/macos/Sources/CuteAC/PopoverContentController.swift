import AppKit
import SwiftUI

/// Measure the actual SwiftUI content synchronously before showing the
/// popover. Scroll only when it exceeds the selected screen's usable height.
@MainActor
final class PopoverContentController<Content: View>: NSViewController {
  private let hosting: PopoverHostingView<Content>
  private let scroll = NSScrollView()
  private var maximumHeight: CGFloat = 800
  private var updating = false
  private var measuredSize: NSSize?
  var onSizeChange: ((NSSize) -> Void)?

  init(rootView: Content) {
    hosting = PopoverHostingView(rootView: rootView)
    super.init(nibName: nil, bundle: nil)
    hosting.onSizeChange = { [weak self] in self?.updateSize() }
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

  override func loadView() {
    view = NSView()
    scroll.drawsBackground = false
    scroll.borderType = .noBorder
    scroll.hasHorizontalScroller = false
    scroll.scrollerStyle = NSScroller.preferredScrollerStyle
    scroll.autoresizingMask = [.width, .height]
    scroll.documentView = hosting
    view.addSubview(scroll)
  }

  func prepare(maximumContentHeight: CGFloat) {
    _ = view
    maximumHeight = maximumContentHeight
    updateSize()
    let top = hosting.isFlipped ? 0 : max(0, hosting.frame.height - scroll.contentView.bounds.height)
    scroll.contentView.scroll(to: NSPoint(x: 0, y: top))
    scroll.reflectScrolledClipView(scroll.contentView)
  }

  private func updateSize() {
    guard isViewLoaded, !updating else { return }
    updating = true
    defer { updating = false }
    let natural = hosting.fittingSize
    guard natural.height > 0 else { return }
    let needsScrolling = ceil(natural.height) > maximumHeight
    scroll.hasVerticalScroller = needsScrolling
    let size = NSScrollView.frameSize(
      forContentSize: NSSize(width: 360, height: min(ceil(natural.height), maximumHeight)),
      horizontalScrollerClass: nil, verticalScrollerClass: needsScrolling ? NSScroller.self : nil,
      borderType: .noBorder, controlSize: .regular, scrollerStyle: scroll.scrollerStyle
    )
    let documentSize = NSSize(width: 360, height: ceil(natural.height))
    if hosting.frame.size != documentSize { hosting.setFrameSize(documentSize) }
    // Once attached, NSPopover owns this frame. Resizing it directly changes
    // its autoresizing margins before the window grows and clips the content.
    if view.window == nil, view.frame.size != size { view.setFrameSize(size) }
    if scroll.frame != view.bounds { scroll.frame = view.bounds }
    // NSViewController's default preferredContentSize already follows view.frame.
    // Compare our last measurement so changing the view frame cannot suppress
    // the notification that resizes the popover itself.
    if measuredSize != size {
      measuredSize = size
      preferredContentSize = size
      onSizeChange?(size)
    }
  }
}

@MainActor
private final class PopoverHostingView<Content: View>: NSHostingView<Content> {
  var onSizeChange: (() -> Void)?
  private var updateScheduled = false

  override func invalidateIntrinsicContentSize() {
    super.invalidateIntrinsicContentSize()
    scheduleSizeUpdate()
  }

  override func layout() {
    super.layout()
    scheduleSizeUpdate()
  }

  private func scheduleSizeUpdate() {
    guard !updateScheduled else { return }
    updateScheduled = true
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      self.updateScheduled = false
      self.onSizeChange?()
    }
  }
}
