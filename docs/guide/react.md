# React

安装 React 适配包：

```bash
pnpm add @air-conditioner/react
```

引入组件和样式：

```tsx
import { AirConditionerWidget } from '@air-conditioner/react'
import '@air-conditioner/react/style.css'

export function App() {
  return <AirConditionerWidget storageKey="ac:state" />
}
```

也可以手动组合 Provider、空调和遥控器：

```tsx
import {
  AirConditioner,
  AirConditionerProvider,
  RemoteControl,
} from '@air-conditioner/react'
import '@air-conditioner/react/style.css'

export function App() {
  return (
    <AirConditionerProvider>
      <AirConditioner />
      <RemoteControl />
    </AirConditionerProvider>
  )
}
```

## 外观与 Vue 版一致

React 组件库与 Vue 组件使用同一份 `style.css`、同样的结构（能效标签、数码管温度、Logo、导风板、白色遥控器），由测试保证两者不走样。

`AirConditionerWidget` 支持与 Vue 版相同的选项：

| Prop | 默认值 | 说明 |
| --- | --- | --- |
| `logoUrl` | `/yun-logo.svg` | 中央 Logo 图片地址 |
| `assetsBaseUrl` | `/assets` | 静态资源目录（`fonts/`、`audio/`） |
| `audioExt` | `m4a` | 音频扩展名 |
| `enableAudio` | `true` | 是否启用按键与开关机音效 |
| `showEnergyLabel` | `true` | 是否显示能效标签 |

遥控器自上而下是小屏（模式、设定温度、风量格、扫风 / 睡眠图标）、电源键、温度 +/- 和一行图标键（制冷 / 制热、扫风、声音），布局与 Vue 版相同。最下方的「声音」键在标准 / 睡眠 / 静音之间切换，`useAirConditioner().cycleSound()` 也可以切换；详见 [音效与声音模式](/api/#音效与声音模式)。旁边的「扫风」键让出风左右摆动，对应 `useAirConditioner().toggleSwing()`；详见 [出风与扫风](/api/#出风与扫风)。

`style.css` 通过相对路径 `./assets/fonts/digital-7-mono.ttf` 引用数码管字体，构建产物 `dist/assets/fonts` 已包含该文件；音频请放到 `assetsBaseUrl` 对应目录下。
