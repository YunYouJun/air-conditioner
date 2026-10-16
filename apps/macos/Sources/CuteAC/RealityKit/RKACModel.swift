import AppKit
import RealityKit

/// Loads `CuteAC.usdz` once for the RealityKit spike and turns it into an
/// unlit template: every facet gets an `UnlitMaterial` whose colour is the
/// same Lambert result SceneKit computes from its ambient/key/fill lights.
/// RealityKit then draws with no lights, no IBL and no PBR at all; each view
/// gets its own clone because an entity can only live in one scene.
@available(macOS 15, *)
@MainActor
enum RKACModel {
  private static var loading: Task<Entity, Error>?

  static func makeInstance() async throws -> Entity {
    let task = loading ?? Task { try await loadTemplate() }
    loading = task
    return try await task.value.clone(recursive: true)
  }

  // MARK: Lights (mirrors ACSceneController.setUpLightsAndCamera)

  private struct Light {
    /// Direction the light travels, from SceneKit's `simdWorldFront`.
    let direction: SIMD3<Float>
    let color: SIMD3<Float>
  }

  private static let ambient = linear(0.9, 0.93, 1) * 0.43
  private static let lights = [
    Light(direction: [0.38244447, -0.6816388, -0.62378263], color: linear(1, 1, 1) * 0.78),
    Light(direction: [-0.77941364, 0.09983343, -0.6185044], color: linear(1, 0.95, 0.9) * 0.22),
  ]

  // MARK: Loading

  private static func loadTemplate() async throws -> Entity {
    let url = Bundle.module.url(forResource: "CuteAC", withExtension: "usdz")!
    let loaded = try await Entity(contentsOf: url)
    let root = Entity()
    root.addChild(loaded)

    var models: [ModelEntity] = []
    collectModels(in: loaded, into: &models)
    for model in models where model.name != "Display" && model.name != "Led" {
      try await bakeLambert(into: model)
    }
    return root
  }

  private static func collectModels(in entity: Entity, into models: inout [ModelEntity]) {
    if let model = entity as? ModelEntity { models.append(model) }
    for child in entity.children { collectModels(in: child, into: &models) }
  }

  /// Splits each mesh part into one part per shaded colour. The model is
  /// low-poly and flat-shaded, so this stays at a few dozen parts in total.
  private static func bakeLambert(into model: ModelEntity) async throws {
    guard let component = model.model else { return }
    let contents = component.mesh.contents
    let world = model.transformMatrix(relativeTo: nil)

    var materials: [UnlitMaterial] = []
    var materialIndex: [SIMD3<Int>: Int] = [:]
    var bakedModels: [MeshResource.Model] = []

    for meshModel in contents.models {
      let instance = contents.instances.first { $0.model == meshModel.id }?.transform ?? matrix_identity_float4x4
      let normalMatrix = simd_float3x3(columns: (
        (world * instance).columns.0.xyz,
        (world * instance).columns.1.xyz,
        (world * instance).columns.2.xyz
      ))

      var parts: [MeshResource.Part] = []
      for part in meshModel.parts {
        guard let indices = part.triangleIndices?.elements else { continue }
        let positions = part.positions.elements
        let normals = part.normals?.elements
        let base = baseColor(of: component.materials[part.materialIndex])

        var groups: [Int: [UInt32]] = [:]
        for start in stride(from: 0, to: indices.count - 2, by: 3) {
          let a = Int(indices[start]), b = Int(indices[start + 1]), c = Int(indices[start + 2])
          let local = normals.map { $0[a] + $0[b] + $0[c] }
            ?? cross(positions[b] - positions[a], positions[c] - positions[a])
          let normal = normalize(normalMatrix * local)

          var light = ambient
          for source in lights {
            light += source.color * max(0, dot(normal, -source.direction))
          }
          let shaded = simd_clamp(base * light, SIMD3<Float>(repeating: 0), SIMD3<Float>(repeating: 1))
          let key = SIMD3<Int>((shaded * 255).rounded(.toNearestOrAwayFromZero))
          let index = materialIndex[key] ?? {
            var material = UnlitMaterial(applyPostProcessToneMap: false)
            material.color = .init(tint: linearColor(shaded))
            materials.append(material)
            materialIndex[key] = materials.count - 1
            return materials.count - 1
          }()
          groups[index, default: []].append(contentsOf: [indices[start], indices[start + 1], indices[start + 2]])
        }

        for (index, triangles) in groups.sorted(by: { $0.key < $1.key }) {
          var baked = MeshResource.Part(id: "\(part.id)-\(index)", materialIndex: index)
          baked.positions = part.positions
          if let partNormals = part.normals { baked.normals = partNormals }
          baked.triangleIndices = MeshBuffer(triangles)
          parts.append(baked)
        }
      }
      bakedModels.append(MeshResource.Model(id: meshModel.id, parts: parts))
    }

    var baked = MeshResource.Contents()
    baked.models = MeshModelCollection(bakedModels)
    baked.instances = contents.instances
    model.model = ModelComponent(mesh: try await MeshResource(from: baked), materials: materials)
  }

  // MARK: Colour

  private static let linearSpace = NSColorSpace(cgColorSpace: CGColorSpace(name: CGColorSpace.extendedLinearSRGB)!)!

  private static func baseColor(of material: any Material) -> SIMD3<Float> {
    guard let pbr = material as? PhysicallyBasedMaterial,
          let color = pbr.baseColor.tint.usingColorSpace(linearSpace)
    else { return [0.8, 0.8, 0.8] }
    return [Float(color.redComponent), Float(color.greenComponent), Float(color.blueComponent)]
  }

  /// SceneKit's `NSColor(calibratedRed:…)` light colours, in linear space.
  private static func linear(_ red: CGFloat, _ green: CGFloat, _ blue: CGFloat) -> SIMD3<Float> {
    let color = NSColor(calibratedRed: red, green: green, blue: blue, alpha: 1).usingColorSpace(linearSpace)!
    return [Float(color.redComponent), Float(color.greenComponent), Float(color.blueComponent)]
  }

  private static func linearColor(_ rgb: SIMD3<Float>) -> NSColor {
    var components: [CGFloat] = [CGFloat(rgb.x), CGFloat(rgb.y), CGFloat(rgb.z), 1]
    return NSColor(colorSpace: linearSpace, components: &components, count: 4)
  }
}

extension SIMD4 where Scalar == Float {
  fileprivate var xyz: SIMD3<Float> { SIMD3(x, y, z) }
}
