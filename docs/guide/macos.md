# macOS 菜单栏应用

`apps/macos` 是一个原生 macOS 应用，用 Swift、SwiftUI 和 SceneKit 写成。它把低多边形卡通空调放进菜单栏，也可以透明地显示在桌面上，可以理解为网页组件的原生“桌面版”。

<img src="/macos/demo.gif" alt="CuteAC 菜单栏弹窗演示" width="360">

## 功能

- 菜单栏弹窗里有一台 3D 空调，可以拖动旋转，支持开关机、调温度（16–31°C）、切换制冷和制热
- 导风板会开合；显示窗用 **Digital-7 Mono** 数码管字体显示温度，和 Vue、React 组件是同一款字体
- 制冷时飘雪花，制热时吹暖风线
- **桌面挂件**：在弹窗里打开“在桌面显示”，桌面上会出现一个透明无边框的窗口，只显示空调本体。拖动可以移动，双击开关机，右键可以设置置顶或隐藏
- 状态结构和 `@yunlefun-home/air-conditioner` 的 core 一致：`{ status, mode, temperature }`

| 制冷 | 制热 | 关机 |
| --- | --- | --- |
| ![制冷](/macos/popover-on-cold.png) | ![制热](/macos/popover-hot-28.png) | ![关机](/macos/popover-off.png) |

## 构建

需要 macOS 14 以上和 Xcode（Swift 6）。

```bash
cd apps/macos
scripts/bundle.sh
open build/CuteAC.app
```

应用只在菜单栏显示，不出现在 Dock 里。退出可以点弹窗右下角的“退出”。

## 为什么用原生实现

这个小空调是常驻后台的，所以功耗是第一优先级：

- 不用 WebView，没有额外的网页进程，也没有一直运行的 WebGL 渲染循环
- SceneKit 只在状态切换的那一刻渲染，其余时间不画
- 雪花和风线是交给系统渲染进程执行的 Core Animation 循环动画，应用进程不做逐帧计算

实测（Apple Silicon）：弹窗关闭时 CPU 0%、内存约 22 MB；弹窗打开、雪花在飘时 CPU 仍然是 0%、内存约 42 MB；只显示桌面挂件时 CPU 0.1%、内存约 34 MB。

## 模型

模型由 `apps/macos/Model/build_cute_ac.py` 在 Blender 里用脚本生成，导出 USDZ 给 SceneKit 使用：

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b -P apps/macos/Model/build_cute_ac.py
```

![低多边形空调模型](/macos/model-cold.png)

更多细节（调试参数、重新生成演示 GIF、节点命名约定）见 [`apps/macos/README.md`](https://github.com/YunYouJun/air-conditioner/tree/dev/apps/macos)。
