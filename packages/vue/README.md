# @yunlefun-home/air-conditioner

> [云空调](https://ac.yunyoujun.cn) 的 Vue 3 组件——便携小空调，为你的夏日带去清凉！

开箱即用的空调组件：白色机身、能效标签、数码管温度显示、风特效、遥控器与音效，自动适配亮 / 暗模式。

## 安装

```bash
pnpm add @yunlefun-home/air-conditioner
```

## 使用

```vue
<script setup lang="ts">
import { AirConditionerWidget } from '@yunlefun-home/air-conditioner'
import '@yunlefun-home/air-conditioner/style.css'
</script>

<template>
  <AirConditionerWidget storage-key="ac:state" />
</template>
```

样式表使用包内相对路径加载数码管字体，现代构建工具会自动处理，无需手动复制。完整 Widget 的音效与默认 Logo 仍需放到宿主项目的静态资源目录：

```bash
cp -r node_modules/@yunlefun-home/air-conditioner/dist/assets public/assets
cp node_modules/@yunlefun-home/air-conditioner/dist/yun-logo.svg public/yun-logo.svg
```

如果只使用受控的 `AirConditioner` 机身组件，可以通过 `overrides` 传入状态，并用 `logo-url` 指定宿主自己的 Logo，无需复制音频资源：

```vue
<script setup lang="ts">
import { AirConditioner } from '@yunlefun-home/air-conditioner'
import '@yunlefun-home/air-conditioner/style.css'
</script>

<template>
  <AirConditioner
    :overrides="{ status: true, mode: 'cold', temperature: 26 }"
    logo-url="/yun-logo.svg"
  />
</template>
```

更多用法（Props、手动组合、暗黑模式、音效接入、组合式 API）见文档：

📖 <https://github.com/YunYouJun/air-conditioner/blob/dev/docs/guide/vue.md>

## License

[MIT](https://github.com/YunYouJun/air-conditioner/blob/dev/LICENSE)
