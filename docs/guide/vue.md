# Vue

`@yunlefun-home/air-conditioner` 基于 [`@yunlefun-home/air-conditioner-core`](/api/) 提供一套开箱即用的 Vue 3 组件：白色机身、能效标签、数码管温度显示、风特效、遥控器与音效，并自动适配亮 / 暗模式。

## 安装

```bash
pnpm add @yunlefun-home/air-conditioner
```

## 快速开始

```vue
<script setup lang="ts">
import { AirConditionerWidget } from '@yunlefun-home/air-conditioner'
import '@yunlefun-home/air-conditioner/style.css'
</script>

<template>
  <AirConditionerWidget storage-key="ac:state" />
</template>
```

`AirConditionerWidget` 已内置状态管理（Provider）、空调主体、遥控器、音效与通知，是最简单的使用方式。

## 静态资源

组件依赖一组音效与数码管字体，需要由宿主项目托管在静态资源目录下。从包内拷贝到你的 `public/`：

```bash
cp -r node_modules/@yunlefun-home/air-conditioner/dist/assets public/assets
```

> 若你的项目没有把这些文件打进 `dist`，可直接从仓库的 [`packages/vue/public/assets`](https://github.com/YunYouJun/air-conditioner/tree/dev/packages/vue/public) 取用。

默认目录结构：

```
public/
└── assets/
    ├── audio/
    │   ├── di.m4a              # 按键「嘀」声
    │   ├── ac-work.m4a         # 启动声
    │   └── air-extractor-fan.m4a  # 工作声
    └── fonts/
        └── digital-7-mono.ttf  # 数码管字体
```

- **音频** 路径可通过 `assets-base-url` / `audio-ext` 调整。
- **字体** 由 `style.css` 中的 `@font-face` 以 `/assets/fonts/digital-7-mono.ttf` 引入；如需放到别处，可在自己的样式里重新声明同名 `@font-face` 覆盖。字体缺失时会回退到等宽字体，不影响功能。

## `AirConditionerWidget` Props

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `initialState` | `Partial<AcState>` | — | 初始状态（无本地存储时生效） |
| `storageKey` | `string` | `'ac:state'` | localStorage 持久化键名 |
| `storage` | `Storage \| null` | 浏览器 `localStorage` | 传 `null` 关闭持久化 |
| `logoUrl` | `string` | `'/yun-logo.svg'` | 中央 Logo 图片地址，留空则不显示 |
| `assetsBaseUrl` | `string` | `'/assets'` | 音频所在目录的基础路径 |
| `audioExt` | `string` | `'m4a'` | 音频扩展名（如 `mp3`） |
| `enableAudio` | `boolean` | `true` | 是否启用音效 |
| `showEnergyLabel` | `boolean` | `true` | 是否显示能效标签 |

### 事件

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| `change` | `(event: AcChangeEvent)` | 每次状态变更 |
| `notify` | `(notification: AcNotification, event: AcChangeEvent)` | 触发提示时（节能建议、温度上下限、设置变化，见 [提示](/api/#提示)） |

## 手动组合

需要自定义布局时，可以用 `AirConditionerProvider` 包裹空调主体与遥控器：

```vue
<script setup lang="ts">
import {
  AirConditioner,
  AirConditionerProvider,
  RemoteControl,
} from '@yunlefun-home/air-conditioner'
import '@yunlefun-home/air-conditioner/style.css'
</script>

<template>
  <AirConditionerProvider storage-key="ac:state">
    <AirConditioner />
    <RemoteControl />
  </AirConditionerProvider>
</template>
```

> 提示：此方式不含音效与通知 UI（它们由 `AirConditionerWidget` 负责）。如需音效，见下文 [接入音效](#接入音效)。

`AirConditioner` 也可脱离 Provider 作纯静态展示，通过 `overrides` 直接指定状态：

```vue
<template>
  <AirConditioner :overrides="{ status: true, mode: 'hot', temperature: 20 }" />
</template>
```

## 暗黑模式

`style.css` 通过 CSS 变量适配：

- 默认跟随 `prefers-color-scheme`；
- 也支持手动控制——在祖先元素加 `.dark` 类（或给根节点加 `.light` 强制亮色）。

机身本身始终为白色（实体空调外观），仅周围文字 / 通知颜色随主题变化。

## 尺寸

机身默认按 360 × 128（约 3:1，接近真实壁挂机）的设计尺寸绘制，`AirConditioner` 也可以传 `size="wide"` 换成 600 × 200 的长款（网站主页用的就是它）：容器不足 360px 时整体等比缩小（依据 core 的 `observeAcScale`），保持长款比例，不会被压扁；`.acw-root` 默认占满容器宽度（最大 420px）。

机身用渐变与阴影模拟顶部受光、底部弧面和墙面投影；使用鼠标 / 触控板时，机身会随指针轻微 3D 倾斜（core 的 `observeAcTilt`，触屏与减少动效时不启用）。

## 遥控器

`RemoteControl` 是一只白色圆角遥控器，按键只用图标：顶部小屏显示模式图标、设定温度、风量格与扫风 / 睡眠图标；下面依次是电源键、温度 +/- 胶囊、制冷 / 制热分段键，以及一行图标键（风速、扫风、声音）。每个按键都是带 `aria-label` 的原生 `<button>`，制冷 / 制热、电源与扫风用 `aria-pressed` 表示当前状态；小屏用 `role="img"` 读出完整状态（文案来自 core 的 `getAcRemoteText`）。按键会以 `command` 事件发出 `power` / `cold` / `hot` / `increase` / `decrease` / `fan` / `swing` / `sound`。长按温度键会连续调温，关机时按制冷 / 制热会直接开机，详见 [遥控器按键](/api/#遥控器按键)。

## 动效

开关机时依次点亮指示灯与显示屏（先短暂显示「88」自检）、打开导风板、淡入出风；温度数字按升 / 降方向滚动，模式图标切换时轻微弹出，遥控按钮有按下回缩反馈。

- 时长与缓动统一来自 core 导出的 `acMotion`，在 `style.css` 里对应 `--acw-motion-*` CSS 变量，可在宿主页面覆盖（例如 `--acw-motion-duration-slow: 600ms`）。
- 动画只使用 `transform` / `opacity`；关机时出风循环处于暂停状态，不会空转。
- 系统开启「减少动态效果」（`prefers-reduced-motion: reduce`）时，会关闭出风循环、数字滚动、图标弹出与按钮缩放，只保留短促的淡入淡出。

## 组合式 API

### `useAirConditioner()`

在 `AirConditionerProvider` 内部读取响应式状态并派发指令：

```vue
<script setup lang="ts">
import { useAirConditioner } from '@yunlefun-home/air-conditioner'

const ac = useAirConditioner()
// ac.state.value         当前状态（只读）
// ac.toggleStatus()      开 / 关
// ac.setMode('hot')      切换模式
// ac.increase() / ac.decrease()  调温
// ac.cycleSound()        声音：标准 → 睡眠 → 静音
// ac.toggleSwing()       扫风：开 / 关
</script>
```

### 接入音效 {#接入音效}

手动组合时若想要音效，用 `useAcAudio` 把 [core 的音频控制器](/api/#音效与声音模式)接到你自己的 `<audio>` 元素上，并在 Provider 的 `@change` 中调用。它会跟随遥控器「声音」键切换的标准 / 睡眠 / 静音模式：

```vue
<script setup lang="ts">
import { AirConditioner, AirConditionerProvider, RemoteControl, useAcAudio } from '@yunlefun-home/air-conditioner'
import { resolveAcAudioAssets } from '@yunlefun-home/air-conditioner-core'
import { ref } from 'vue'
import '@yunlefun-home/air-conditioner/style.css'

const beep = ref<HTMLAudioElement | null>(null)
const start = ref<HTMLAudioElement | null>(null)
const work = ref<HTMLAudioElement | null>(null)

const src = resolveAcAudioAssets('/assets/audio')
const { handleChange } = useAcAudio(() => ({
  beep: beep.value,
  start: start.value,
  work: work.value,
}))
</script>

<template>
  <AirConditionerProvider @change="handleChange">
    <audio ref="beep" :src="src.beep" preload="auto" />
    <audio ref="start" :src="src.start" preload="auto" />
    <audio ref="work" :src="src.work" preload="auto" />
    <AirConditioner />
    <RemoteControl />
  </AirConditionerProvider>
</template>
```

## 导出一览

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `AirConditionerWidget` | 组件 | 开箱即用的完整组件 |
| `AirConditionerProvider` | 组件 | 注入状态上下文 |
| `AirConditioner` | 组件 | 空调主体（机身 / 显示屏 / 风） |
| `RemoteControl` | 组件 | 遥控器 |
| `EnergyLabel` | 组件 | 能效标签 |
| `useAirConditioner` | 组合式函数 | 读取状态 / 派发指令（需在 Provider 内） |
| `useOptionalAirConditioner` | 组合式函数 | 同上，无上下文时返回 `null` |
| `useAcAudio` | 组合式函数 | 接入音效 |
| `createAirConditionerContext` | 函数 | 由 store 创建上下文（高级用法） |
