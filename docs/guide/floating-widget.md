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

::: warning 尚未发布到 npm / CDN
`@air-conditioner/widget` 目前是仓库内的 workspace 包。请使用本仓库源码或自行构建，不要直接复制一个不存在的 CDN 地址。已发布的 Vue 包是另一个集成方式，见 [Vue 安装](/guide/vue)。
:::

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
