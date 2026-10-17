# Web Component

Web Component 不依赖 React 或 Vue，适合普通网页、CMS 页面或跨框架嵌入。

## npm

```ts
import { defineAirConditionerElement } from '@air-conditioner/widget'

defineAirConditionerElement()
```

```html
<air-conditioner-widget storage-key="ac:state"></air-conditioner-widget>
```

## mount API

```ts
import { mountAirConditioner } from '@air-conditioner/widget'

mountAirConditioner('#ac', {
  storageKey: 'ac:state',
  assetsBaseUrl: '/assets',
})
```

外观与 Vue / React 组件一致（能效标签、数码管温度、Logo、导风板、圆形遥控按钮），Shadow DOM 样式由 Vue 的 `style.css` 生成，修改样式后运行 `pnpm -C packages/widget run sync:style` 同步。

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `logoUrl` | `/yun-logo.svg` | 中央 Logo 图片地址，传空字符串不显示 |
| `assetsBaseUrl` | `/assets` | 静态资源目录：数码管字体取 `fonts/digital-7-mono.ttf`，音效取 `audio/` |
| `audioExt` | `m4a` | 音频扩展名 |
| `enableAudio` | `true` | 是否启用按键与开关机音效 |
| `showEnergyLabel` | `true` | 是否显示能效标签 |
| `title` | — | Logo 的替代文字 / 链接标题 |

> 由于 Shadow DOM 内声明的 `@font-face` 不生效，组件会在 `document.head` 注入一次数码管字体。
>
> 未设置 `status` / `mode` / `temperature` / `sound` / `swing` 属性时，沿用本地持久化的状态。`sound` 可取 `normal`、`sleep`、`mute`，与遥控器最下方的「声音」键一致，详见 [音效与声音模式](/api/#音效与声音模式)；`swing="false"` 关闭扫风，其余取值开启，详见 [出风与扫风](/api/#出风与扫风)。

## Events

```ts
const widget = document.querySelector('air-conditioner-widget')

widget?.addEventListener('ac-change', (event) => {
  console.log(event.detail.state)
})

widget?.addEventListener('ac-notify', (event) => {
  console.log(event.detail.notification)
})
```
