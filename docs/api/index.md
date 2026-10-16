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

## 音效与声音模式

遥控器最下方的「声音」键依次切换三种声音模式，状态保存在 `AcState.sound` 中（旧版本保存的状态视为 `normal`）：

| 模式 | 说明 |
| --- | --- |
| `normal` | 标准音量 |
| `sleep` | 睡眠：总音量降到 30% |
| `mute` | 静音：不发出任何声音，也不播放按键音 |

```ts
import { createAirConditionerStore } from '@yunlefun-home/air-conditioner-core'

const store = createAirConditionerStore()
store.dispatch({ type: 'cycleSound' }) // 标准 → 睡眠 → 静音 → 标准
store.dispatch({ type: 'sound', sound: 'mute' })
```

`createAcAudioController` 负责播放按键「嘀」声、开机启动声和持续的风声：

```ts
import { createAcAudioController } from '@yunlefun-home/air-conditioner-core'

const audio = createAcAudioController({ beep, start, work }, { soundMode: store.getState().sound })

store.subscribe((event) => {
  if (event.previousState.sound !== event.state.sound)
    audio.setSoundMode(event.state.sound)
  audio.beep()
  if (event.previousState.status !== event.state.status)
    audio.toggleStatusAudio(event.previousState.status)
})
```

- 默认通过 Web Audio API 播放：风声无缝循环（首尾交叉淡化），开关机淡入淡出，切换声音模式时音量平滑过渡。
- 开机约 90 秒后室温「达标」，风声逐渐降到一半；之后每隔 3～6 分钟随压缩机发力变大 1～2 分钟再回落。时长与音量见 `soundTimings`。
- Web Audio 会用 `fetch` 读取 `<audio>` 元素的 `src`。浏览器不支持、音频跨域且未开启 CORS 或解码失败时，自动退回直接播放 `<audio>` 元素（风声用 `loop` 循环，音量用 `volume` / `muted` 控制）。
- 浏览器要求首次发声发生在用户操作中，请在点击遥控器的回调里调用 `beep()` / `toggleStatusAudio()`。
