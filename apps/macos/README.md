# CuteAC：macOS 菜单栏小空调

低多边形卡通空调，常驻 macOS 菜单栏，也可以透明地放在桌面上。纯原生 Swift 实现（AppKit、SwiftUI、SceneKit），不用任何 WebView，目标是**极致省电**。

![演示](../../docs/public/macos/demo.gif)

## 功能

- **菜单栏弹窗**：3D 空调可以拖动旋转，支持开关机、调温度（16–31°C）、切换制冷和制热。
- **真实感细节**：导风板会开合；显示窗用数码管字体（Digital-7 Mono，和网页组件同一款字体）实时显示温度，背后有暗着的“88”底纹；指示灯随模式变色。
- **出风效果**：制冷时飘雪花，制热时吹暖风线。
- **桌面挂件**：在弹窗里打开“在桌面显示”，会出现一个透明无边框的窗口，只露出空调本体，默认位于桌面图标上方、普通窗口下方。
  - 拖动：移动位置，位置会被记住
  - 双击：开关机
  - 右键：始终置顶、隐藏挂件
- **室温（这台 Mac 的温度）**：把电脑当成空调所在的“房间”。弹窗显示 CPU/SoC 温度、风扇转速和 macOS 的散热状态（散热正常 / 有点热 / 很热 / 过热）；开机时，空调显示窗右上角也会显示室温，变热时会变色。
  - 风速条：显示窗上的三格风速跟随真实风扇负载；没有风扇的机型（如 MacBook Air）改为跟随散热状态。风速越高，雪花和暖风越多、越快、吹得越远。
  - 只读取，不修改：Apple Silicon 的温度来自 HID 事件系统（私有 API，运行时用 `dlsym` 查找），Intel 的温度和所有风扇数据来自 SMC。全部不需要 root，也不会写入任何硬件参数。
  - 省电：只在弹窗或桌面挂件可见时，每 3 秒在后台队列采样一次；都不可见时完全不采样。散热状态由系统主动通知。
- **检查更新**：每天最多查一次 GitHub Releases（`v*` 标签），有新版本时弹窗右下角显示“新版本 vX”，点击下载 `CuteAC-X.zip`；也可以点“检查更新”手动查。只读取公开的发布信息，不上传任何数据。API 被限流时改读 `releases/latest` 页面。`swift run` 启动的开发版本不检查。
- **状态持久化**：状态保存在 `UserDefaults` 里，数据结构和 `@yunlefun-home/air-conditioner` 的 core 一致。

## 共享包 CuteACKit

空调本身的原生能力放在仓库根目录的 Swift 包里（源码在 `Kit/`），CuteAC 和 [Yun Home](https://github.com/YunLeFun/home) 都依赖它，避免两边各写一份：

| 产品 | 内容 | 依赖 |
|---|---|---|
| `CuteACCore` | `ACState` / `ACMode`（温度为 `Double`，兼容 Home Assistant 的小数步进）、`RoomReading`、`ThermalLevel`、`ThermalSensors`、`ThermalMonitor` | Foundation、IOKit |
| `CuteACKit` | `ACDisplay`（显示窗贴图）、`ACAirflowLayer`（出风动画）、`ACPalette`、`ACFonts`、`ACModel`（`CuteAC.usdz` 和部件名） | AppKit，并重新导出 `CuteACCore` |
| `ReleaseCheck` | `ReleaseChecker`（按标签前缀找最新的稳定版）、`UpdateMonitor`（每天一次的自动检查和手动检查） | Foundation |

3D 渲染器不在包里：CuteAC 用 SceneKit，Yun Home 用 RealityKit，但两边加载同一个模型、画同一张显示窗贴图、用同一个出风层。`RoomReading` 的 JSON 形状和 core 的 TypeScript 类型 `RoomReading` 一致，Yun Home 会把它传给获得 `sensor:thermal` 权限的插件。

其他仓库这样依赖：

```swift
.package(url: "https://github.com/YunYouJun/air-conditioner.git", revision: "<commit>")
```

在仓库根目录运行 `swift test` 测试共享包。

## 发布

CuteAC 和 npm 包共用仓库版本号（bumpp 同步各个 `package.json`），`scripts/bundle.sh` 把它写进 `CFBundleShortVersionString`。推送 `v*` 标签后，[Release 工作流](../../.github/workflows/release.yml)会在 macOS 上测试共享包、打包 `CuteAC.app`，压缩成 `CuteAC-<版本>.zip` 上传到同名 GitHub Release，应用的检查更新读的就是这里。

应用只做了 ad-hoc 签名，没有公证。下载后第一次打开会被 Gatekeeper 拦下：到“系统设置 → 隐私与安全性”里点“仍要打开”，或者执行 `xattr -dr com.apple.quarantine CuteAC.app`。

## 运行

```bash
scripts/bundle.sh          # 构建 build/CuteAC.app（不在 Dock 显示，只在菜单栏）
open build/CuteAC.app
```

改动 `apps/macos/` 或根目录 `Package.swift` 的推送和 PR 会触发 GitHub Actions 的 [macOS 工作流](../../.github/workflows/macos.yml)：在 `macos-latest` 上先运行共享包测试，再执行 release 构建、运行 `scripts/bundle.sh` 打包并做 ad-hoc 签名，再用 `--snapshot` 离屏渲染三张状态图，作为 `macos-snapshots` 产物上传。CI 不运行 Blender，直接使用仓库里的 `CuteAC.usdz`。

调试参数：

| 参数 | 作用 |
|---|---|
| `--show-popover` | 启动后自动打开弹窗，用于测量弹窗打开时的开销 |
| `--show-pet` | 启动后显示桌面挂件 |
| `--snapshot <dir>` | 离屏渲染三种状态的 PNG 后退出，用于检查模型和光照。室温使用固定的示例值 |
| `--capture <dir>` | 打开弹窗，按脚本演示一遍（开机 → 调温 → 制热 → 关机），从运行中的视图逐帧导出 PNG 后退出。不需要屏幕录制权限。室温固定为示例值，不读取真实传感器 |

重新生成文档里的 GIF：

```bash
build/CuteAC.app/Contents/MacOS/CuteAC --capture /tmp/cute-ac
ffmpeg -framerate 15 -i /tmp/cute-ac/frame-%03d.png \
  -vf "scale=360:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" \
  /tmp/cute-ac/demo.gif
gifsicle -O3 --lossy=35 --colors 128 /tmp/cute-ac/demo.gif -o ../../docs/public/macos/demo.gif
```

文档截图用 WebP（`cwebp -q 86 -m 6`），比 PNG 小约 65%。`Model/renders/` 不入库，需要时用 Blender 脚本重新生成。

## 模型

`Model/build_cute_ac.py` 是 Blender 脚本，模型完全由代码生成，可以重复构建：

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b -P Model/build_cute_ac.py
```

- 输出 `Kit/Sources/CuteACKit/Resources/CuteAC.usdz`，CuteAC 和 Yun Home 共用，同时在 `Model/renders/` 生成预渲染图，以后可以给 WidgetKit 小组件用。
- 外形参照真实壁挂空调：顶部进风格栅、分成三个斜面的前面板、底部出风口和导风板、右侧显示窗。全部用平面着色，保留低多边形的棱角感。
- 应用会控制这几个命名节点：`Louver`（导风板，转轴在顶边）、`Display`（UV 为 0–1 的平面，用来贴温度画面）、`Led`（指示灯）。改模型时请保持这些名字不变。
- 坐标约定：导出时已转换成 Y 轴朝上，但每个节点内部仍沿用 Blender 的局部坐标轴（Z 轴朝上）。

## 省电设计

| 手段 | 说明 |
|---|---|
| 平时不渲染 | `rendersContinuously = false`。只在状态切换的约 0.7 秒内打开 `isPlaying`，之后 SceneKit 完全不画。 |
| 没人看就暂停 | 弹窗关闭并且桌面挂件隐藏时，`scene.isPaused = true`。 |
| 光照模型简单 | 用 Lambert 平面着色，不用 PBR，也不用环境贴图和阴影。 |
| 出风效果交给系统 | 雪花和风线用循环的 `CABasicAnimation`，由系统的渲染进程执行，应用进程不做逐帧计算。最早的 `CAEmitterLayer` 版本在弹窗打开时 CPU 约 10%，已经替换掉。 |
| 显示窗只在变化时重绘 | 温度贴图只在状态改变时画一次。 |

## 实测（Apple Silicon，macOS 26，`top` 采样）

| 状态 | CPU | 内存 | 能耗 |
|---|---|---|---|
| 关机，弹窗关闭 | 0.0% | 22 MB | 0.0 |
| 开机，弹窗关闭 | 0.1% | 23 MB | 0.1 |
| 关机，弹窗打开 | 0.1% | 42 MB | 0.1 |
| 制冷，弹窗打开，雪花在飘 | 0.0% | 42 MB | 0.0 |
| 制冷，只显示桌面挂件 | 0.1% | 34 MB | 0.1 |

## 字体

`Sources/CuteAC/Resources/digital-7-mono.ttf` 复制自 `packages/vue/public/assets/fonts/`，授权和网页组件里的那份相同。Digital-7 是 Style-7 发布的免费字体，商业分发前请先确认它的授权条款。

## 后续

- 接入 YunLeFun/home 的真实设备绑定，从 Home Assistant 读取并控制真实空调。令牌存在钥匙串里。
- WidgetKit 小组件：每种状态用一张 `Model/renders` 里的预渲染图片。
- 签名、公证并发布 Release。
- 渲染器暂时继续用 SceneKit。为什么不现在迁到 RealityKit、什么时候迁，见 [RealityKit 迁移评估与渲染器选型](docs/realitykit-spike.md)。
