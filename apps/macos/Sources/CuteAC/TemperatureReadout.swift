import CuteACKit
import SwiftUI

struct TemperatureReadout: View {
  let value: Double

  private static let digitFont = ACFonts.digital(size: 56)
  private static let unitFont = NSFont.systemFont(ofSize: 15, weight: .bold)

  private var digits: AttributedString {
    var text = value.formatted(.number.precision(.fractionLength(0...2)).grouping(.never).attributed)
    for run in text.runs {
      let fractional = run.numberPart == .fraction || run.numberSymbol == .decimalSeparator
      text[run.range].font = Font(fractional ? ACFonts.digital(size: 32) : Self.digitFont)
    }
    return text
  }

  var body: some View {
    // 单位像空调面板上那样挂在数字右上角：两者按字形顶端（大写高度）对齐
    HStack(alignment: .capTop, spacing: 3) {
      Text(digits)
        .font(Font(ACFonts.digital(size: 56)))
        .contentTransition(.numericText())
        .alignmentGuide(.capTop) { $0[.firstTextBaseline] - Self.digitFont.capHeight }
      Text("°C")
        .font(Font(Self.unitFont))
        .foregroundStyle(.secondary)
        .alignmentGuide(.capTop) { $0[.firstTextBaseline] - Self.unitFont.capHeight }
    }
    .fixedSize()
    .accessibilityElement(children: .ignore)
    .accessibilityLabel("\(value.formatted()) 摄氏度")
  }
}

private extension VerticalAlignment {
  enum CapTop: AlignmentID {
    static func defaultValue(in dimensions: ViewDimensions) -> CGFloat {
      dimensions[.top]
    }
  }

  static let capTop = VerticalAlignment(CapTop.self)
}
