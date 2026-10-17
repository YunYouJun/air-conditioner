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
  let sceneController: ACSceneController

  private var state: ACState { store.state }
  private var room: RoomReading { thermal.reading }
  private var accent: Color { Color(nsColor: ACSceneController.accent(for: state.mode)) }

  var body: some View {
    VStack(spacing: 14) {
      ACSceneView(controller: sceneController, state: state, room: room, isActive: visibility.isVisible)
        .frame(height: 190)
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
          Text(state.status ? (state.mode == .cold ? "制冷中" : "制热中") : "待机")
            .font(.caption.weight(.semibold))
            .foregroundStyle(.secondary)
          HStack(alignment: .firstTextBaseline, spacing: 2) {
            Text("\(state.temperature)")
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
      }

      roomRow

      HStack(spacing: 10) {
        stepButton("minus", delta: -1, disabled: state.temperature <= ACState.temperatureRange.lowerBound)
        Picker("模式", selection: Binding(get: { state.mode }, set: { store.setMode($0) })) {
          Label("制冷", systemImage: "snowflake").tag(ACMode.cold)
          Label("制热", systemImage: "sun.max.fill").tag(ACMode.hot)
        }
        .pickerStyle(.segmented)
        .labelsHidden()
        stepButton("plus", delta: 1, disabled: state.temperature >= ACState.temperatureRange.upperBound)
      }

      Toggle(isOn: $settings.showDesktopPet) {
        Label("在桌面显示", systemImage: "macwindow.on.rectangle")
          .font(.callout)
      }
      .toggleStyle(.switch)
      .controlSize(.small)

      HStack {
        Text("拖动 3D 空调可旋转")
          .font(.caption2)
          .foregroundStyle(.tertiary)
        Spacer()
        Button("退出") { NSApp.terminate(nil) }
          .buttonStyle(.link)
          .font(.caption)
      }
    }
    .padding(16)
    .frame(width: 320)
  }

  /// The Mac is the AC's "room": its CPU/SoC temperature, fan speed and how
  /// macOS rates the heat.
  private var roomRow: some View {
    let warning = ACSceneController.warning(for: room.thermalState).map { Color(nsColor: $0) }
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
      Text(Self.thermalLabel(room.thermalState))
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

  private static func thermalLabel(_ state: ProcessInfo.ThermalState) -> String {
    switch state {
    case .fair: "有点热"
    case .serious: "很热"
    case .critical: "过热"
    default: "散热正常"
    }
  }

  private func stepButton(_ symbol: String, delta: Int, disabled: Bool) -> some View {
    Button {
      withAnimation(.snappy) { store.changeTemperature(by: delta) }
    } label: {
      Image(systemName: symbol)
        .font(.system(size: 13, weight: .bold))
        .frame(width: 34, height: 26)
    }
    .disabled(disabled)
  }
}
