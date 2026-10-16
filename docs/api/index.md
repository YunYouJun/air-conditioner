# API

API 文档入口已预留。等 `@yunlefun-home/air-conditioner-core`、React、Vue 和 Web Component 的接口稳定后，可以接入 TypeDoc 自动生成。

当前稳定入口：

- `@yunlefun-home/air-conditioner-core`
- `@air-conditioner/react`
- `@yunlefun-home/air-conditioner`
- `@air-conditioner/widget`

## 动效 token

`@yunlefun-home/air-conditioner-core` 导出各框架共用的动效 token：

```ts
import { acMotion, prefersReducedMotion, renderAcMotionCssVars } from '@yunlefun-home/air-conditioner-core'

acMotion.duration.base // 240（ms）
acMotion.easing.standard // 'cubic-bezier(0.2, 0, 0, 1)'
prefersReducedMotion() // 系统是否开启了「减少动态效果」（SSR 下为 false）

// 生成 `--acw-motion-*` CSS 变量（含 prefers-reduced-motion 覆盖），可注入 Shadow DOM
renderAcMotionCssVars(':host')
```

各包样式表里的 token 区块由 `renderAcMotionCssVars(':root')` 生成，`packages/core/test/motion.test.ts` 会校验它们与 core 保持一致。
