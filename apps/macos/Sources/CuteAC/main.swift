import AppKit
import CuteACKit
import SceneKit

/// `CuteAC --snapshot <dir>` renders each state offscreen and exits; used to
/// check the model and lighting without opening the menu bar UI.
@MainActor
func renderSnapshots(to directory: URL) {
  let controller = ACSceneController()
  let renderer = SCNRenderer(device: MTLCreateSystemDefaultDevice(), options: nil)
  renderer.scene = controller.scene
  renderer.pointOfView = controller.cameraNode
  renderer.autoenablesDefaultLighting = false

  let hotRoom = RoomReading(celsius: 83, thermalState: .fair, fanRPM: 3900, windLevel: 3)
  let states: [(String, ACState, RoomReading)] = [
    ("cold", ACState(status: true, mode: .cold, temperature: 24), .demo),
    ("hot", ACState(status: true, mode: .hot, temperature: 28), hotRoom),
    ("off", ACState(status: false, mode: .cold, temperature: 26), .demo),
  ]
  try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
  for (name, state, room) in states {
    controller.apply(state, room: room, animated: false)
    let image = renderer.snapshot(atTime: 0, with: CGSize(width: 960, height: 600), antialiasingMode: .multisampling4X)
    guard let tiff = image.tiffRepresentation,
          let png = NSBitmapImageRep(data: tiff)?.representation(using: .png, properties: [:])
    else { continue }
    let url = directory.appendingPathComponent("scenekit-\(name).png")
    try? png.write(to: url)
    print("Wrote \(url.path)")
  }
}

let arguments = CommandLine.arguments
if let index = arguments.firstIndex(of: "--snapshot"), index + 1 < arguments.count {
  MainActor.assumeIsolated {
    renderSnapshots(to: URL(fileURLWithPath: arguments[index + 1]))
  }
  exit(0)
}

let app = NSApplication.shared
let delegate = MainActor.assumeIsolated { AppDelegate() }
app.delegate = delegate
app.run()
