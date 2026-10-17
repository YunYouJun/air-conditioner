import CuteACKit
import ReleaseCheck
import SwiftUI

@MainActor
final class PopoverVisibility: ObservableObject {
  @Published var isVisible = false
}

struct PopoverView: View {
  @ObservedObject var store: ACStore
  @ObservedObject var settings: AppSettings
  @ObservedObject var visibility: PopoverVisibility
  @ObservedObject var thermal: ThermalMonitor
  @ObservedObject var updates: UpdateMonitor
  let sceneController: ACSceneController

  private var state: ACState { store.state }
  private var room: RoomReading { thermal.reading }
  private var accent: Color { Color(nsColor: ACPalette.accent(for: state.mode)) }

  var body: some View {
    VStack(spacing: 14) {
      devicePicker
      ACSceneView(controller: sceneController, state: state, room: store.sceneRoom(room), form: settings.form, isActive: visibility.isVisible)
        .frame(height: settings.form == .wall ? 190 : 320)
        .background(
          RoundedRectangle(cornerRadius: 18, style: .continuous)
            .fill(LinearGradient(
              colors: [accent.opacity(state.status ? 0.16 : 0.05), Color.primary.opacity(0.03)],
              startPoint: .top,
              endPoint: .bottom
            ))
        )

      HStack(alignment: .firstTextBaseline) {
        VStack(alignment: .leading, spacing: 2) {
          Text(store.status)
            .font(.caption.weight(.semibold))
            .foregroundStyle(.secondary)
          HStack(alignment: .firstTextBaseline, spacing: 2) {
            Text(state.temperatureLabel)
              .font(Font(ACFonts.digital(size: 56)))
              .foregroundStyle(state.status ? accent : Color.secondary)
              .contentTransition(.numericText())
            Text("°C")
              .font(.system(size: 15, weight: .bold))
              .foregroundStyle(.secondary)
          }
        }
        Spacer()
        Button {
          withAnimation(.snappy) { store.togglePower() }
        } label: {
          Image(systemName: "power")
            .font(.system(size: 20, weight: .bold))
            .frame(width: 52, height: 52)
            .foregroundStyle(state.status ? .white : .secondary)
            .background(Circle().fill(state.status ? accent : Color.primary.opacity(0.08)))
        }
        .buttonStyle(.plain)
        .help(state.status ? "关闭" : "开启")
        .accessibilityLabel(state.status ? "关闭当前空调" : "开启当前空调")
        .disabled(!store.canControl)
      }

      if store.isReal {
        HStack {
          if store.connectionStatus == "已连接", store.snapshot?.available == true,
             let temperature = store.snapshot?.currentTemperature {
            Label("室温 \(temperature.formatted())°C", systemImage: "thermometer.medium")
              .help("空调传感器回报")
          }
          Spacer()
          Text(store.pending ? "等待设备确认…" : store.connectionStatus)
        }.font(.caption).foregroundStyle(.secondary)
        if let error = store.connectionError { Text(error).font(.caption).foregroundStyle(.orange) }
      } else { roomRow }

      HStack(spacing: 10) {
        stepButton("minus", delta: -store.step, disabled: state.temperature <= store.minimum || !store.supportsTemperature)
        IconSegmentedPicker(
          selection: Binding(get: { state.mode }, set: { mode in withAnimation(.snappy) { store.setMode(mode) } }),
          options: [
            .init(value: .cold, title: "制冷", symbol: "snowflake", tint: Color(nsColor: ACPalette.accent(for: .cold)), disabled: !store.supports(.cold)),
            .init(value: .hot, title: "制热", symbol: "sun.max.fill", tint: Color(nsColor: ACPalette.accent(for: .hot)), disabled: !store.supports(.hot)),
          ]
        )
        .help("模式")
        stepButton("plus", delta: store.step, disabled: state.temperature >= store.maximum || !store.supportsTemperature)
      }.disabled(!store.canControl)

      // 风速：自动跟随这台 Mac 的风扇，固定档位让出风保持不变 (#29).
      if !store.isReal {
      IconSegmentedPicker(
        selection: Binding(get: { state.fan }, set: { fan in withAnimation(.snappy) { store.setFan(fan) } }),
        options: [
          .init(value: .auto, title: "自动", symbol: "fan"),
          .init(value: .low, title: "低", symbol: "wind"),
          .init(value: .medium, title: "中", symbol: "wind"),
          .init(value: .high, title: "高", symbol: "tornado"),
        ],
        compact: true
      )
      .help("风速：自动时跟随这台 Mac 的风扇")
      }

      HStack {
        IconSegmentedPicker(
          selection: $settings.form,
          options: [
            .init(value: .wall, title: ACForm.wall.label, symbol: "air.conditioner.horizontal"),
            .init(value: .tower, title: ACForm.tower.label, symbol: "air.conditioner.vertical"),
          ],
          compact: true
        )
        .frame(width: 140)
        .help("挂机或柜机，只改变外观")
        Spacer()
        Toggle(isOn: $settings.showDesktopPet) {
          Label("在桌面显示", systemImage: "macwindow.on.rectangle")
            .font(.callout)
        }
        .toggleStyle(.switch)
        .controlSize(.small)
      }

      HStack {
        Text("拖动 3D 空调可旋转")
          .font(.caption2)
          .foregroundStyle(.tertiary)
        Spacer()
        updateButton
        Button("退出") { NSApp.terminate(nil) }
          .buttonStyle(.link)
          .font(.caption)
      }
    }
    .padding(16)
    .frame(width: 360)
  }

  private var devicePicker: some View {
    VStack(alignment: .leading, spacing: 7) {
      Picker("当前空调", selection: Binding(get: { store.selectedID ?? "" }, set: { store.selectDevice($0.isEmpty ? nil : $0) })) {
        Text("本机虚拟空调").tag("")
        ForEach(store.devices) { Text($0.label).tag($0.id) }
      }.accessibilityLabel("当前控制的空调")
      if store.isReal { Text(store.deviceLabel).font(.caption).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true) }
      HStack {
        Button("刷新绑定") { store.reloadBindings() }
        if store.isReal { Button("重新连接") { store.reconnect() } }
        Spacer()
        Button("在 Home 管理") {
          if let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "fun.yunle.home") {
            NSWorkspace.shared.open(url)
          }
        }
      }.buttonStyle(.link).font(.caption)
      if let error = store.catalogError { Text(error).font(.caption).foregroundStyle(.orange) }
      else if store.devices.isEmpty { Text("在 Home 中绑定空调后，这里会自动显示。").font(.caption).foregroundStyle(.secondary) }
    }
  }

  /// A newer release links to its download; otherwise a manual check whose
  /// result replaces the label until the popover is reopened.
  @ViewBuilder
  private var updateButton: some View {
    if let release = updates.available {
      Button("新版本 v\(release.version)") { NSWorkspace.shared.open(release.downloadURL ?? release.pageURL) }
        .buttonStyle(.link)
        .font(.caption.weight(.semibold))
        .help("下载 CuteAC \(release.version)，解压后替换旧版即可")
    } else {
      Button(updateLabel) { Task { await updates.check() } }
        .buttonStyle(.link)
        .font(.caption)
        .disabled(updates.status == .checking)
        .help(AppVersion.current.map { "当前版本 v\($0)" } ?? "开发版本")
    }
  }

  private var updateLabel: String {
    switch updates.status {
    case .checking: "检查中…"
    case .upToDate: "已是最新"
    case .failed: "检查失败"
    default: "检查更新"
    }
  }

  /// The Mac is the AC's "room": its CPU/SoC temperature, fan speed and how
  /// macOS rates the heat.
  private var roomRow: some View {
    let warning = ACPalette.warning(for: room.thermalState).map { Color(nsColor: $0) }
    return HStack(spacing: 12) {
      if let celsius = room.celsius {
        Label("室温 \(celsius)°C", systemImage: "thermometer.medium")
          .help("这台 Mac 的 CPU 温度")
      }
      if let rpm = room.fanRPM {
        Label("\(rpm) RPM", systemImage: "fan")
          .help("风扇转速")
      }
      Spacer(minLength: 0)
      Text(room.thermalState.label)
        .font(.caption2.weight(.semibold))
        .padding(.horizontal, 7)
        .padding(.vertical, 2)
        .foregroundStyle(warning ?? Color.secondary)
        .background(Capsule().fill((warning ?? Color.primary).opacity(0.12)))
        .help("macOS 的散热状态")
    }
    .font(.caption.monospacedDigit())
    .foregroundStyle(.secondary)
  }

  private func stepButton(_ symbol: String, delta: Double, disabled: Bool) -> some View {
    Button {
      withAnimation(.snappy) { store.changeTemperature(by: delta) }
    } label: {
      Image(systemName: symbol)
        .font(.system(size: 13, weight: .bold))
        .frame(width: 34, height: 26)
    }
    .disabled(disabled)
    .accessibilityLabel(symbol == "minus" ? "降低温度" : "升高温度")
  }
}

/// A segmented control that shows an icon with each title. AppKit's
/// segmented `Picker` drops the icon of a `Label`, and the mode should read
/// at a glance: snowflake for cooling, sun for heating.
struct IconSegmentedPicker<Value: Hashable>: View {
  struct Option {
    var value: Value
    var title: String
    var symbol: String
    /// Colour of the selected segment's icon; the accent colour by default.
    var tint: Color?
    var disabled = false
  }

  @Binding var selection: Value
  let options: [Option]
  var compact = false

  var body: some View {
    HStack(spacing: 2) {
      ForEach(options, id: \.value) { option in
        let selected = option.value == selection
        Button { selection = option.value } label: {
          Label(option.title, systemImage: option.symbol)
            .labelStyle(.titleAndIcon)
            .font(compact ? .callout : .body.weight(selected ? .semibold : .regular))
            .foregroundStyle(selected ? AnyShapeStyle(option.tint ?? .accentColor) : AnyShapeStyle(.secondary))
            .frame(maxWidth: .infinity)
            .padding(.vertical, compact ? 3 : 5)
            .background {
              if selected {
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                  .fill(Color(nsColor: .controlBackgroundColor))
                  .shadow(color: .black.opacity(0.12), radius: 1, y: 0.5)
              }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(option.disabled)
        .accessibilityAddTraits(selected ? .isSelected : [])
      }
    }
    .padding(2)
    .background(RoundedRectangle(cornerRadius: 8, style: .continuous).fill(Color.primary.opacity(0.07)))
  }
}
