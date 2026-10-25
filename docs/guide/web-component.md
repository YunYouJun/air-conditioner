# Web Component

Web Component 不依赖 React 或 Vue，适合普通网页、CMS 页面或跨框架嵌入。

想直接装到博客？使用[一段 script 的安装方式](/guide/floating-widget#复制一段-script)，自动提供字体、音效和悬浮遥控器，无需 npm 包。

::: warning 尚未发布到 npm
`@air-conditioner/widget` 目前只在本仓库（pnpm workspace）里使用，下面的 npm 用法暂时还装不到；已发布的是 [Vue 组件](/guide/vue)（`@yunlefun-home/air-conditioner`）和 core（`@yunlefun-home/air-conditioner-core`）。
:::

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
| `placement` | `inline` | 行内布局，或 `top-left` / `top-right` 悬浮在页面角落 |

> 由于 Shadow DOM 内声明的 `@font-face` 不生效，组件会在 `document.head` 注入一次数码管字体。
>
> 未设置 `status` / `mode` / `temperature` / `sound` / `swing` / `fan` 属性时，沿用本地持久化的状态。`fan` 可取 `auto`、`low`、`medium`、`high`，详见 [风速](/api/#风速)。`sound` 可取 `normal`、`sleep`、`mute`，与遥控器最下方的「声音」键一致，详见 [音效与声音模式](/api/#音效与声音模式)；`swing="false"` 关闭扫风，其余取值开启，详见 [出风与扫风](/api/#出风与扫风)。

## 悬浮安装

[打开可交互的悬浮挂件安装演示](/guide/floating-widget)，试试左右角安装和遥控器展开 / 收起。

想让访客在文章或博客页面里也能吹空调，可以把机身固定在右上角，遥控器收在右下角，不再需要为 iframe 预留整块页面空间（[#31](https://github.com/YunYouJun/air-conditioner/issues/31)）。

```ts
import { mountAirConditioner } from '@air-conditioner/widget'

// 在客户端挂载到 body，避免祖先的 transform / filter 改变 fixed 定位。
const widget = mountAirConditioner(document.body, {
  placement: 'top-right',
  storageKey: 'blog:ac',
  assetsBaseUrl: '/assets',
})

// 可随时换到左侧，或用 inline 恢复行内布局。
widget.setAttribute('placement', 'top-left')

// 页面卸载时移除，释放音频与事件监听。
// widget.remove()
```

注册组件后也可以直接写 HTML：

```html
<air-conditioner-widget placement="top-right" storage-key="blog:ac"></air-conditioner-widget>
```

点击「打开遥控器」展开，点击「收起遥控器」或按 `Esc` 收起；键盘可用 `Tab` 聚焦、`Enter` / 空格展开，手机可直接点按。收起只隐藏遥控器，空调继续按原来的温度、声音和风速运行。默认行内布局始终显示遥控器。未知 `placement` 值回退到行内布局。

机身宽度随窄屏收缩，空调和遥控器之间的页面仍可点击、滚动。默认层级为 `1000`，需要避让网站菜单时可设置 `--acw-floating-z-index`。本页的 workspace API 需要自行提供 Logo、字体和音频资源；[浏览器安装脚本](/guide/floating-widget#复制一段-script)则会从脚本目录自动加载这些资源。

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
