<script setup>
import FloatingWidgetDemo from '../.vitepress/components/FloatingWidgetDemo.vue'
</script>

# 悬浮挂件安装演示

把云空调装进博客、文章或普通网页：机身固定在上角，遥控器收在同侧下角。这里运行的就是仓库里的 Web Component，不是效果图，也不需要 React 或 Vue 宿主。

<ClientOnly>
  <FloatingWidgetDemo />
</ClientOnly>

## 试一试

1. 选择「左侧悬浮」或「右侧悬浮」。机身移到页面上角，遥控器默认收起。
2. 点击「打开遥控器」，开机并调整温度。点击「收起遥控器」或按 `Esc`，空调仍保持原状态。
3. 选择「恢复行内」继续阅读；离开本页后会自动移除演示组件。

键盘可用 `Tab`、`Enter` / 空格操作，`Esc` 收起后焦点回到展开按钮。手机横屏高度不足时，遥控器面板可以独立滚动。悬浮的实体机身和遥控器会覆盖其下方内容，透明出风区域不会拦截页面点击。

## 在自己的页面安装

### npm 接入（推荐）

有构建工具的项目优先安装 npm 包，使用锁文件控制版本，并通过 API 管理挂载、事件和卸载。

```bash
npm install @yunlefun-home/air-conditioner-widget
```

```ts
import { cdnAssets, mountAirConditioner } from '@yunlefun-home/air-conditioner-widget'

// 仅在客户端、DOM 就绪后执行。SSR 中不要在模块顶层挂载。
const widget = mountAirConditioner(document.body, {
  ...cdnAssets,
  placement: 'top-right', // 'top-left' | 'top-right' | 'inline'
  storageKey: 'my-blog:ac',
  enableAudio: false, // 先保持安静；需要声音时再启用
})

// widget.setAttribute('placement', 'top-left')
// 恢复行内前，应将组件安排在页面中合适的内容容器内。
// widget.setAttribute('placement', 'inline')

// SPA 路由退出或页面组件卸载时调用，释放监听和音频。
// widget.remove()
```

`cdnAssets` 显式启用 jsDelivr 资源，地址固定到已安装包的完整版本；字体、音频、Logo 无需手动复制。JS 本身仍由项目构建工具打包。需要离线部署时，改用下方自托管方式。

默认行内布局不固定定位；切到悬浮布局时遥控器先收起。悬浮组件默认 `z-index: 1000`，可用 `--acw-floating-z-index` 调整层级。自行挂载到 `body` 可避免祖先的 `transform` / `filter` 改变 fixed 定位。更多选项和事件见 [Web Component 使用说明](/guide/web-component)。

### 复制一段 script

[打开独立安装演示](https://yunyoujun.github.io/air-conditioner/widget/)，可以试用并复制固定版本的 jsDelivr 安装代码。升级时显式修改版本号，不使用 `latest`。

将下面的代码放入网站的全局页头或页脚，只需安装一次：

```html
<script
  defer
  src="https://cdn.jsdelivr.net/npm/@yunlefun-home/air-conditioner-widget@0.4.3/dist/embed/embed.js"
  data-placement="top-right"
></script>
```

机身与遥控器会直接挂载到 `body`。字体、Logo 和音频都从脚本旁边加载，不需要复制到博客的 `public`，也不受博客当前路由或部署子路径影响。

| 属性 | 默认值 | 用途 |
| --- | --- | --- |
| `data-placement` | `top-right` | 设为 `top-left` 可移到左侧 |
| `data-audio` | `false` | 设为 `true` 启用音效，用户操作后才播放 |
| `data-storage-key` | `ac:embed` | 本站的状态存储键；不同博客无需共用状态 |

脚本重复加载不会叠出多个挂件。SPA 网站建议把脚本放在全局模板；如果需要随路由卸载，调用 `document.querySelector('air-conditioner-embed')?.remove()`，之后重新加载脚本即可挂载。需要改变音频等初始化选项时请整页刷新。

遥控器采用点击 / 触屏 / 键盘展开，鼠标经过不会自动弹出，以免阅读文章时误触；这是对 #31 原提案中 hover 交互的取舍。VuePress、VitePress 等静态站点也可使用全局脚本，无需专用插件。

### 自托管与固定版本

npm 包内包含完整资源。安装后，将 `node_modules/@yunlefun-home/air-conditioner-widget/dist/embed/` 复制到站点的 `public/widget/`（或你的静态文件目录）：

```bash
mkdir -p public/widget
cp -R node_modules/@yunlefun-home/air-conditioner-widget/dist/embed/. public/widget/
```

API 接入时用 `assetsBaseUrl: '/widget/assets'`、`logoUrl: '/widget/yun-logo.svg'` 替代 `...cdnAssets`；子路径部署要加入对应前缀。普通 HTML 可以使用 `<script defer src="/widget/embed.js"></script>`。目录中的 `index.html` 是官方 CDN 安装演示，严格离线站点可不部署此演示页。

也可以从源码运行 `pnpm -C packages/widget build:embed`。生成目录包含脚本、字体、音频、Logo 与许可证，不能只拷贝 JS。完整网站构建 `pnpm react:build` 会将其放入 `packages/react/dist/widget/`。

跨站加载时，静态服务器需要为 `/widget/*` 返回 `Access-Control-Allow-Origin: *`，否则字体或 Web Audio 无法跨域读取。GitHub Pages 自带该响应头，仓库也配置了 Cloudflare Pages 与 Vercel 的响应头；其他托管服务请自行配置，或将整个目录放在博客同源。使用 CSP 的网站还需允许该来源的脚本、字体、图片、媒体和音频 fetch，以及组件的内联样式；代码会给页面注入字体样式和 Shadow DOM 样式。
