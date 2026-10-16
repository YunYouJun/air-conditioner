import AppKit
import Metal
import RealityKit

/// `CuteAC --snapshot <dir> --realitykit`: the RealityKit counterpart of
/// `renderSnapshots`, rendering offscreen with `RealityRenderer` into a
/// Metal texture (no window, so it also runs on CI).
@available(macOS 15, *)
@MainActor
func renderRealityKitSnapshots(to directory: URL) async throws {
  let size = (width: 960, height: 600)
  guard let device = MTLCreateSystemDefaultDevice() else { throw SnapshotError.noMetal }

  let renderer = try RealityRenderer()
  renderer.cameraSettings.colorBackground = .color(CGColor(gray: 0, alpha: 0))
  renderer.cameraSettings.antialiasing = .multisample4X
  renderer.lighting.resource = nil

  let rig = try await RKACRig.make()
  let camera = RKCamera.makeEntity()
  RKCamera().place(camera)
  renderer.entities.append(contentsOf: [rig.root, camera])
  renderer.activeCamera = camera

  let descriptor = MTLTextureDescriptor.texture2DDescriptor(
    pixelFormat: .bgra8Unorm_srgb, width: size.width, height: size.height, mipmapped: false
  )
  descriptor.usage = [.renderTarget, .shaderRead]
  descriptor.storageMode = .shared
  guard let texture = device.makeTexture(descriptor: descriptor) else { throw SnapshotError.noMetal }
  let output = try RealityRenderer.CameraOutput(.singleProjection(colorTexture: texture))

  let states: [(String, ACState)] = [
    ("cold", ACState(status: true, mode: .cold, temperature: 24)),
    ("hot", ACState(status: true, mode: .hot, temperature: 28)),
    ("off", ACState(status: false, mode: .cold, temperature: 26)),
  ]
  try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
  for (name, state) in states {
    rig.apply(state, animated: false)
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      do {
        try renderer.updateAndRender(deltaTime: 0, cameraOutput: output, onComplete: { _ in
          continuation.resume()
        })
      }
      catch {
        continuation.resume(throwing: error)
      }
    }
    guard let png = pngData(from: texture) else { continue }
    let url = directory.appendingPathComponent("realitykit-\(name).png")
    try png.write(to: url)
    print("Wrote \(url.path)")
  }
}

private enum SnapshotError: Error {
  case noMetal
}

private func pngData(from texture: MTLTexture) -> Data? {
  let bytesPerRow = texture.width * 4
  var pixels = [UInt8](repeating: 0, count: bytesPerRow * texture.height)
  texture.getBytes(&pixels, bytesPerRow: bytesPerRow, from: MTLRegionMake2D(0, 0, texture.width, texture.height), mipmapLevel: 0)
  let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)
  guard let provider = CGDataProvider(data: Data(pixels) as CFData),
        let image = CGImage(
          width: texture.width, height: texture.height, bitsPerComponent: 8, bitsPerPixel: 32,
          bytesPerRow: bytesPerRow, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: bitmapInfo,
          provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent
        )
  else { return nil }
  return NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:])
}
