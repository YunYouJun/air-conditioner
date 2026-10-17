import AppKit
import CuteACKit
import Testing

@MainActor
@Suite struct CuteACKitTests {
  @Test func bundlesTheModelAndFont() throws {
    let url = try #require(ACModel.url)
    #expect(FileManager.default.fileExists(atPath: url.path))
    #expect(ACFonts.digital(size: 20).fontName == ACFonts.digitalName)
  }

  @Test func bundlesBothForms() throws {
    for form in ACForm.allCases {
      let url = try #require(ACModel.url(for: form))
      #expect(FileManager.default.fileExists(atPath: url.path))
    }
    #expect(ACModel.url == ACModel.url(for: .wall))
    #expect(ACModel.louver(for: .wall).pivot == .node && ACModel.louver(for: .tower).pivot == .children)
    #expect(ACModel.airflow(for: .wall).direction == .down && ACModel.airflow(for: .tower).direction == .side)
    #expect(ACForm.tower.label == "柜机")
  }

  @Test func towersBlowSideways() throws {
    let layer = ACAirflowLayer()
    layer.configure(.init(mode: .cold, windLevel: 1, direction: .side), span: 120)
    let flakes = try #require(layer.sublayers)
    #expect(flakes.count == 6)
    // Stacked along the outlet's height, starting just right of it.
    #expect(Set(flakes.map(\.position.x)) == [6])
    #expect(Set(flakes.map(\.position.y)).count == 6)
  }

  @Test func drawsTheDisplayAtTextureSize() {
    let image = ACDisplay.image(for: ACState(status: true, temperature: 26.5), room: .demo)
    #expect(image.size == ACDisplay.size)
    #expect(image.cgImage(forProposedRect: nil, context: nil, hints: nil) != nil)
  }

  @Test func airflowGrowsWithWindLevel() {
    let layer = ACAirflowLayer()
    layer.configure(.init(mode: .cold, windLevel: 1), span: 300)
    #expect(layer.sublayers?.count == 6)
    layer.configure(.init(mode: .cold, windLevel: 3), span: 300)
    #expect(layer.sublayers?.count == 8)
    layer.configure(.init(mode: .hot, windLevel: 9), span: 300)
    #expect(layer.sublayers?.count == 5)
    layer.configure(nil, span: 300)
    #expect(layer.sublayers?.isEmpty ?? true)
  }
}
