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

### 复制一段 script

[打开独立安装演示](https://yunyoujun.github.io/air-conditioner/widget/)，可以试用并复制当前部署的安装地址。这个入口随 main 的 GitHub Pages 部署更新，不依赖 npm 发版。

将下面的代码放入网站的全局页头或页脚，只需安装一次：

```html
<script
  defer
  src="https://yunyoujun.github.io/air-conditioner/widget/embed.js"
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

如果不希望跟随官方 main 更新，可以检出需要的提交并独立构建：

```bash
pnpm install --frozen-lockfile
pnpm -C packages/widget build:embed
```

将生成的 `packages/widget/dist/embed/` **整个目录**部署到自己站点的 `/widget/`，然后使用 `<script defer src="/widget/embed.js"></script>`。目录包含脚本、安装演示、字体、音频、Logo 与许可证，不能只拷贝 JS。完整网站构建 `pnpm react:build` 也会生成 `packages/react/dist/widget/`，现有网站部署流程会一起发布。

跨站加载时，静态服务器需要为 `/widget/*` 返回 `Access-Control-Allow-Origin: *`，否则字体或 Web Audio 无法跨域读取。GitHub Pages 自带该响应头，仓库也配置了 Cloudflare Pages 与 Vercel 的响应头；其他托管服务请自行配置，或将整个目录放在博客同源。使用 CSP 的网站还需允许该来源的脚本、字体、图片、媒体和音频 fetch，以及组件的内联样式；代码会给页面注入字体样式和 Shadow DOM 样式。

### 在 workspace 中使用 API

`@air-conditioner/widget` 仍是仓库内的 workspace 包，尚未发布到 npm；上面的浏览器脚本可以独立使用。已发布的 Vue 包见 [Vue 安装](/guide/vue)。

在本仓库的 pnpm workspace 中使用：

```ts
import { mountAirConditioner } from '@air-conditioner/widget'

// 仅在客户端、DOM 就绪后执行。SSR 中不要在模块顶层挂载。
const widget = mountAirConditioner(document.body, {
  placement: 'top-right', // 'top-left' | 'top-right' | 'inline'
  storageKey: 'my-blog:ac',
  assetsBaseUrl: '/assets',
  enableAudio: false, // 先保持安静；需要声音时再启用
  logoUrl: '', // 不显示 Logo；也可传自己的图片 URL
})

// widget.setAttribute('placement', 'top-left')
// 恢复行内前，应将组件安排在页面中合适的内容容器内。
// widget.setAttribute('placement', 'inline')

// SPA 路由退出或页面组件卸载时调用，释放监听和音频。
// widget.remove()
```

`assetsBaseUrl` 下需要提供 `fonts/digital-7-mono.ttf`；开启音频时还需提供 `audio/` 目录中的文件。资源可从本仓库 `packages/vue/public/assets` 获取，本页仅提供演示所需的字体。使用子路径部署时，资源地址也需包含该前缀。

默认行内布局不固定定位；切到悬浮布局时遥控器先收起。悬浮组件默认 `z-index: 1000`，可用 `--acw-floating-z-index` 调整层级。自行挂载到 `body` 可避免祖先的 `transform` / `filter` 改变 fixed 定位。更多选项和事件见 [Web Component 使用说明](/guide/web-component)。
