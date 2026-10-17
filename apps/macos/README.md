# CuteAC：macOS 菜单栏小空调

低多边形卡通空调，常驻 macOS 菜单栏，也可以透明地放在桌面上。纯原生 Swift 实现（AppKit、SwiftUI、SceneKit），不用任何 WebView，目标是**极致省电**。

![演示](../../docs/public/macos/demo.gif)

## 功能

- **Home Assistant 真机**：复用 Home App 已保存的空调和房间，在顶部“当前空调”切换多台设备；开关、冷暖模式、调温使用 HomeDeviceKit，温度范围和小数步长按设备回报。真实室温来自空调传感器，不使用 Mac CPU 温度；断线、无令牌、实体不可用或温标不支持时禁用控制。
- **菜单栏弹窗**：3D 空调可以拖动旋转，支持开关机、调温度（16–31°C）、切换制冷和制热。
- **真实感细节**：导风板会开合；显示窗用数码管字体（Digital-7 Mono，和网页组件同一款字体）实时显示温度，背后有暗着的“88”底纹；指示灯随模式变色。
- **出风效果**：制冷时飘雪花，制热时吹暖风线。
- **风速**：弹窗里可以选「自动 / 低 / 中 / 高」。自动时出风强弱跟随这台 Mac 的风扇；固定档位让出风保持不变，显示窗上的风速格也随之点亮。和网页版一样，制冷和制热各自记住上一次的设定温度。
- **挂机 / 柜机**：弹窗左下角一键切换外观，状态不变。柜机的出风口是一排横向百叶，开机时每片各自倾斜，雪花和暖风从侧面吹出；桌面挂件也随之变成竖长窗口（以右上角为锚点），设置会被记住。
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
| `CuteACKit` | `ACDisplay`（显示窗贴图）、`ACAirflowLayer`（出风动画，向下或向侧面）、`ACPalette`、`ACFonts`、`ACModel`（两种形态的模型、部件名、导风板动作、出风锚点） | AppKit，并重新导出 `CuteACCore` |
| `ReleaseCheck` | `ReleaseChecker`（按标签前缀找最新的稳定版）、`UpdateMonitor`（每天一次的自动检查和手动检查） | Foundation |

3D 渲染器不在包里：CuteAC 用 SceneKit，Yun Home 用 RealityKit，但两边加载同一个模型、画同一张显示窗贴图、用同一个出风层。`RoomReading` 的 JSON 形状和 core 的 TypeScript 类型 `RoomReading` 一致，Yun Home 会把它传给获得 `sensor:thermal` 权限的插件。

其他仓库这样依赖：

```swift
.package(url: "https://github.com/YunYouJun/air-conditioner.git", revision: "<commit>")
```

在仓库根目录运行 `swift test` 测试共享包。

## 复用 Home 绑定

1. 先运行新版 Home，完成 HA 绑定。已有绑定会在启动时自动发布，无需重新登录米家。
2. 打开 CuteAC，在顶部选择客厅、主卧、次卧等空调。首次访问已有钥匙串令牌时，可能需要在 macOS 系统窗口手动允许 CuteAC 访问。
3. Home 调整房间、设备名称或删除绑定后，CuteAC 每 3 秒和打开弹窗时读取变化，也可点“刷新绑定”。当前目标被删除后回到本机虚拟空调。

Home 是绑定目录的维护方：`~/Library/Application Support/YunHome/ha-bindings.json` 只保存设备元数据。令牌仍在 service 为 `fun.yunle.home.home-assistant` 的钥匙串中；CuteAC 不复制、导出或删除它。可用“在 Home 管理”返回 Home，更新令牌后在 CuteAC 点“重新连接”。两边各自保存选中设备，互不切换对方的控制目标，设备状态则通过 HA 同步。

“本机虚拟空调”保留原有状态，真实设备数据不会覆盖它。真实设备的风速维持设备设置；Mac 风速控件仅供虚拟模式使用。`--capture` 固定使用虚拟模式，忽略记住的真实绑定，避免演示脚本操作实体设备。

连接逻辑来自 [home/HomeDeviceKit](https://github.com/YunLeFun/home/tree/main/packages/home-device-kit)，只有 `apps/macos` App 包依赖它；根目录 CuteACKit 仍独立，不形成 Home → CuteACKit → Home 的循环。

## 发布

CuteAC 和 npm 包共用仓库版本号（bumpp 同步各个 `package.json`），`scripts/bundle.sh` 把它写进 `CFBundleShortVersionString`。推送 `v*` 标签后，[Release 工作流](../../.github/workflows/release.yml)会在 macOS 上测试共享包、打包 `CuteAC.app`，压缩成 `CuteAC-<版本>.zip` 上传到同名 GitHub Release，应用的检查更新读的就是这里。

应用只做了 ad-hoc 签名，没有公证。下载后第一次打开会被 Gatekeeper 拦下：到“系统设置 → 隐私与安全性”里点“仍要打开”，或者执行 `xattr -dr com.apple.quarantine CuteAC.app`。

## 运行

构建前需要包含上述共享目录 API 的 `home` 源码。支持 `air-conditioner` 与 `home` 平级，或 `YunYouJun/air-conditioner` 与 `YunLeFun/home` 目录布局；其他路径设置 `HOME_DEVICE_KIT_PATH=/absolute/path/to/home`。

在仓库根目录运行 `./script/build_and_run.sh --verify`，会构建 debug bundle 并打开弹窗；Codex Run 按钮使用同一入口。支持 `--debug`、`--logs`、`--telemetry`。测试命令为 `swift test --package-path apps/macos`。

以下命令在 `apps/macos` 中运行，默认构建 release：

```bash
scripts/bundle.sh          # 构建 build/CuteAC.app（不在 Dock 显示，只在菜单栏）
open build/CuteAC.app
```

改动 `apps/macos/` 或根目录 `Package.swift` 的推送和 PR 会触发 GitHub Actions 的 [macOS 工作流](../../.github/workflows/macos.yml)：在 `macos-latest` 上运行共享包与原生连接测试、release 构建，再运行 `scripts/bundle.sh` 打包并校验 ad-hoc 签名。`python3 scripts/verify-bundle.py` 将 App 复制到独立目录、临时隐藏 `.build`，启动安装包并离屏渲染挂机与柜机各三种状态，共六张图，作为 `macos-snapshots` 产物上传。此模式不读取 HA 绑定或控制真实设备。发布流程包含同样检查；本机运行时请先结束其他构建和测试，脚本结束后会恢复构建缓存。

打包显式使用 Xcode 构建后端，并用相同后端的 `--show-bin-path` 定位文件，使资源从 App 的 `Contents/Resources` 加载，不依赖构建机器的目录。CI 不运行 Blender，直接使用仓库里的 USDZ 模型。

CI 和发布工作流将 `YunLeFun/home` 的 Home 0.2.0 提交 `cfc81f3aa1c981e4dc44d64aedc83f7662519299` 检出到 `.deps/home`，并设置 `HOME_DEVICE_KIT_PATH`。该提交提供共享绑定目录与设备集合 API。跨仓库发布时先推送 Home 的这笔提交，再推送或发布 CuteAC，确保 CI 可以获取依赖；本机开发仍可使用相邻仓库的源码。

调试参数：

| 参数 | 作用 |
|---|---|
| `--show-popover` | 启动后自动打开弹窗，用于测量弹窗打开时的开销 |
| `--show-popover --keep-popover-open` | 跨 App 联调时保持弹窗打开，点击其他 App 不自动收起；仍可点击菜单栏图标关闭 |
| `--show-pet` | 启动后显示桌面挂件 |
| `--snapshot <dir>` | 离屏渲染挂机和柜机各三种状态的 PNG（共 6 张，柜机文件名带 `tower-`）后退出，用于检查模型和光照。室温使用固定的示例值 |
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
/Applications/Blender.app/Contents/MacOS/Blender -b -P Model/build_cute_ac.py            # 两种都生成
/Applications/Blender.app/Contents/MacOS/Blender -b -P Model/build_cute_ac.py -- tower   # 只生成柜机
```

- 输出 `Kit/Sources/CuteACKit/Resources/` 下的 `CuteAC.usdz`（挂机）和 `CuteACTower.usdz`（柜机），CuteAC 和 Yun Home 共用；同一个场景还会导出 `packages/react/public/models/` 下的 `CuteAC.glb` 和 `CuteACTower.glb`，给网页的 3D 模式用。另外在 `Model/renders/` 生成 `<形态>-cold/hot/off.png` 预渲染图，以后可以给 WidgetKit 小组件用。
- 重新导出时 USDZ 即使几何没变也可能产生二进制差异；只改了网页相关部分时，可以用 `git checkout` 还原 USDZ。
- 挂机参照真实壁挂空调：顶部进风格栅、分成三个斜面的前面板、底部出风口和导风板、右侧显示窗。柜机：顶部显示窗和指示灯，中上部是带竖向导风条的出风口，外面盖一排横向百叶，下部是三个竖向斜面的面板和底座。全部用平面着色，保留低多边形的棱角感。
- 应用会控制这几个命名节点，两种形态名字相同（网页端对应的常量在 core 的 `model.ts` 里，`packages/core/test/model.test.ts` 会检查 GLB 和 `ACModel` 是否一致）：`Louver`、`Display`（0.25 × 0.1、UV 为 0–1 的平面，用来贴温度画面）、`Led`（指示灯）。挂机的 `Louver` 是一块导风板，转轴在顶边，整体绕本地 X 轴转；柜机的 `Louver` 是一组百叶，每个子节点绕自己中线的本地 X 轴转（见 `ACModel.louver(for:)`）。改模型时请保持这些名字不变。
- `chamfer_box` 会把位置烘焙进顶点，需要绕自身转动的部件要用 `set_origin` 设好原点。
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

- 为沙箱版本配置 App Group 与 Keychain Access Group；当前共享绑定用于同一 macOS 用户下的非沙箱 App。
- WidgetKit 小组件：每种状态用一张 `Model/renders` 里的预渲染图片。
- 签名、公证并发布 Release。
- 渲染器暂时继续用 SceneKit。为什么不现在迁到 RealityKit、什么时候迁，见 [RealityKit 迁移评估与渲染器选型](docs/realitykit-spike.md)。
