import AppKit
import Combine
import CuteACKit
import ReleaseCheck
import SwiftUI

@MainActor
final class AppSettings: ObservableObject {
  @Published var showDesktopPet: Bool {
    didSet { UserDefaults.standard.set(showDesktopPet, forKey: "cute-ac:desktop-pet") }
  }

  @Published var petAlwaysOnTop: Bool {
    didSet { UserDefaults.standard.set(petAlwaysOnTop, forKey: "cute-ac:desktop-pet-on-top") }
  }

  /// 挂机 or 柜机; only the look changes, the state is shared.
  @Published var form: ACForm {
    didSet { UserDefaults.standard.set(form.rawValue, forKey: "cute-ac:form") }
  }

  init() {
    form = UserDefaults.standard.string(forKey: "cute-ac:form").flatMap(ACForm.init(rawValue:)) ?? .wall
    showDesktopPet = UserDefaults.standard.bool(forKey: "cute-ac:desktop-pet")
    petAlwaysOnTop = UserDefaults.standard.bool(forKey: "cute-ac:desktop-pet-on-top")
  }
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate, NSPopoverDelegate {
  private let store = ACStore(allowsRealDevices: !CommandLine.arguments.contains("--capture"))
  private let settings = AppSettings()
  private let visibility = PopoverVisibility()
  private let thermalMonitor = ThermalMonitor()
  /// Daily GitHub Releases check; tags are `v<version>` with a `CuteAC-<version>.zip` asset.
  private let updates = UpdateMonitor(
    checker: ReleaseChecker(repository: "YunYouJun/air-conditioner", tagPrefix: "v", assetPrefix: "CuteAC-"),
    keyPrefix: "cute-ac"
  )
  private lazy var sceneController = ACSceneController(form: settings.form)
  private var statusItem: NSStatusItem?
  private let popover = NSPopover()
  private var petPanel: DesktopPetPanel?
  private var cancellables = Set<AnyCancellable>()

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.accessory)
    ACFonts.registerIfNeeded()

    sceneController.apply(store.state, room: store.sceneRoom(thermalMonitor.reading), animated: false)

    popover.behavior = .transient
    popover.animates = true
    popover.delegate = self
    popover.contentViewController = NSHostingController(
      rootView: PopoverView(
        store: store,
        settings: settings,
        visibility: visibility,
        thermal: thermalMonitor,
        updates: updates,
        sceneController: sceneController
      )
    )

    let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
    item.button?.target = self
    item.button?.action = #selector(togglePopover(_:))
    statusItem = item

    store.$state
      .map(\.status)
      .removeDuplicates()
      .sink { [weak self] on in self?.updateStatusIcon(on: on) }
      .store(in: &cancellables)

    settings.$showDesktopPet
      .removeDuplicates()
      .sink { [weak self] show in self?.setDesktopPetVisible(show) }
      .store(in: &cancellables)

    // The views switch the shared scene; the pet window also changes shape.
    settings.$form
      .removeDuplicates()
      .dropFirst()
      .sink { [weak self] form in self?.petPanel?.resize(to: DesktopPetPanel.size(for: form)) }
      .store(in: &cancellables)

    handleDebugArguments(button: item.button)

    // Docs captures stay offline; normal launches check once a day.
    if !CommandLine.arguments.contains("--capture") {
      Task { await updates.checkIfDue() }
    }
  }

  // MARK: Desktop pet

  private func setDesktopPetVisible(_ visible: Bool) {
    if visible {
      if petPanel == nil {
        let content = NSHostingView(rootView: DesktopPetView(
          store: store,
          thermal: thermalMonitor,
          settings: settings,
          sceneController: sceneController
        ))
        // The panel sizes itself per form (anchored top-right); SwiftUI
        // resizing the window would anchor it top-left instead.
        content.sizingOptions = []
        let panel = DesktopPetPanel(
          content: content,
          alwaysOnTop: settings.petAlwaysOnTop,
          size: DesktopPetPanel.size(for: settings.form)
        )
        panel.onDoubleClick = { [weak self] in
          withAnimation(.snappy) { self?.store.togglePower() }
        }
        panel.onToggleAlwaysOnTop = { [weak self] onTop in self?.settings.petAlwaysOnTop = onTop }
        panel.onHide = { [weak self] in self?.settings.showDesktopPet = false }
        petPanel = panel
      }
      petPanel?.orderFrontRegardless()
    }
    else {
      petPanel?.orderOut(nil)
      petPanel = nil
    }
    updateSceneActivity()
  }

  /// The scene only runs actions, and the thermal sensors are only sampled,
  /// while something shows them.
  private func updateSceneActivity() {
    let visible = visibility.isVisible || petPanel != nil
    sceneController.setActive(visible)
    thermalMonitor.setActive(visible)
  }

  // MARK: Menu bar

  private func updateStatusIcon(on: Bool) {
    let name = on ? "air.conditioner.horizontal.fill" : "air.conditioner.horizontal"
    let image = NSImage(systemSymbolName: name, accessibilityDescription: "空调")
      ?? NSImage(systemSymbolName: "snowflake", accessibilityDescription: "空调")
    image?.isTemplate = true
    statusItem?.button?.image = image
  }

  @objc private func togglePopover(_ sender: NSStatusBarButton) {
    if popover.isShown {
      popover.performClose(sender)
    }
    else {
      popover.show(relativeTo: sender.bounds, of: sender, preferredEdge: .minY)
      popover.contentViewController?.view.window?.makeKey()
    }
  }

  func popoverWillShow(_ notification: Notification) {
    store.reloadBindings()
    visibility.isVisible = true
    updateSceneActivity()
  }

  func applicationWillTerminate(_ notification: Notification) { store.shutdown() }

  func popoverDidClose(_ notification: Notification) {
    visibility.isVisible = false
    updateSceneActivity()
  }

  // MARK: Debug

  /// `--show-popover` opens the popover on launch (profiling), `--show-pet`
  /// shows the desktop pet, `--capture <dir>` records the docs demo frames.
  private func handleDebugArguments(button: NSStatusBarButton?) {
    let arguments = CommandLine.arguments
    if arguments.contains("--show-pet") {
      settings.showDesktopPet = true
    }
    guard let button else { return }

    if let index = arguments.firstIndex(of: "--capture"), index + 1 < arguments.count {
      let directory = URL(fileURLWithPath: arguments[index + 1])
      thermalMonitor.pin(.demo)
      popover.appearance = NSAppearance(named: .aqua)
      popover.behavior = .applicationDefined
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
        guard let self else { return }
        self.togglePopover(button)
        guard let view = self.popover.contentViewController?.view else { return }
        Task { @MainActor in
          try? await Task.sleep(nanoseconds: 600_000_000)
          await DemoCapture(view: view, store: self.store, directory: directory).run()
          NSApp.terminate(nil)
        }
      }
    }
    else if arguments.contains("--show-popover") {
      // Keep the controls visible while a second app is inspected during an
      // explicit cross-app integration test. Normal menu-bar use is transient.
      if arguments.contains("--keep-popover-open") { popover.behavior = .applicationDefined }
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
        self?.togglePopover(button)
      }
    }
  }
}
