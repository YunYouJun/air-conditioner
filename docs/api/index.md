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

## 出风与扫风

开机后导风板打开，三股气流以出风口为轴向两侧扇形散开，并沿出风线持续向下流动；制冷 / 制热切换时气流颜色交叉淡化。

遥控器最下方的「扫风」键开启后，气流左右来回摆动（经过正中最快、两端减速折返，一个来回 `acMotion.duration.swing` 毫秒）；导风板同时上下摆动，出风口里的竖向导风叶片跟着气流左右摆。关闭扫风时都停在当前角度，和真的导风板一样。状态保存在 `AcState.swing` 中（旧版本保存的状态视为 `false`），开启「减少动态效果」时不摆动。

```ts
store.dispatch({ type: 'toggleSwing' })
store.dispatch({ type: 'swing', swing: true })
```

视图层在空调根元素上输出 `data-swing="on" | "off"`，自定义样式可以据此调整。

## 雾气与冷凝水

制冷开机时，几团冷雾从导风板下方飘出、边飘边散（[#70](https://github.com/YunYouJun/air-conditioner/issues/70)）；开得很冷时，导风板边缘会慢慢聚起一颗水珠再落下，落下时「嗒」一声（[#21](https://github.com/YunYouJun/air-conditioner/issues/21)）。规则都在 core 里，各个视图（以及以后的 3D 渲染器）只负责画：

| 函数 | 返回 | 规则 |
| --- | --- | --- |
| `getAcMist(state)` | 雾气浓度 0–1 | 只在制冷开机时有；设定温度越低、风越大越浓 |
| `getAcDripInterval(state)` | 两滴水的间隔（ms），不滴水时 `undefined` | 只在制冷开机、设定温度不高于 `acDripMaxTemperature`（22 °C）时滴水；16 °C 时 9 秒一滴，22 °C 时 18 秒一滴，高风再快 20% |
| `getAcCondensationStyle(state)` | `{ mist, dripCycle, drip }` | 视图直接写到空调根元素上 |

视图在空调根元素上输出 `data-drip="on" | "off"`，并写入 CSS 变量 `--acw-mist` 与 `--acw-drip-cycle`。滴水声由音频控制器合成（`audio.drip()`），不需要额外的音频文件；只在标准声音下响，睡眠和静音时不响。开启「减少动态效果」时，雾气静止地挂在出风口下方，不滴水。

## 风速

遥控器上的「风速」键依次切换四档，状态保存在 `AcState.fan` 中（旧版本保存的状态视为 `auto`）：

| 风速 | 出风 | 风声 |
| --- | --- | --- |
| `auto` 自动 | 默认节奏 | 开机先大，室温达标后变小，偶尔随压缩机发力变大 |
| `low` 低风 | 更慢、更淡 | 固定在 45% |
| `medium` 中风 | 稍慢 | 固定在 70% |
| `high` 高风 | 更快、更浓 | 固定在 100% |

```ts
store.dispatch({ type: 'cycleFan' }) // 自动 → 低 → 中 → 高 → 自动
store.dispatch({ type: 'fan', fan: 'low' })
audio.setFanSpeed('low') // createAcAudioController 也可以用 fanSpeed 选项指定初始风速
```

视图层在空调根元素和遥控器小屏上输出 `data-fan="auto" | "low" | "medium" | "high"`：小屏按档位点亮风速格，自动时三格全亮并标出「自动」；出风的快慢由 CSS 变量 `--acw-wind-pace`、浓淡由 `--acw-wind-strength` 控制。macOS 原生版 CuteAC 的「自动」跟随这台 Mac 的风扇转速。

## 遥控器按键

- **长按温度键**：按下立即调一度，按住约 0.5 秒后连续调节并逐渐加快，到上下限自动停下；键盘的 Enter / 空格每按一次调一度。
- **模式键直接开机**：关机时按制冷或制热，空调会开机并进入该模式。遥控器发出的是 `{ type: 'mode', mode, powerOn: true }`；不带 `powerOn` 时（例如从 Home Assistant 同步模式）只改模式、不改开关。

```ts
store.dispatch({ type: 'mode', mode: 'hot', powerOn: true })
```

自己做遥控器时可以用 `bindAcPressRepeat` 给按键加上长按连续触发：

```ts
import { bindAcPressRepeat } from '@yunlefun-home/air-conditioner-core'

const unbind = bindAcPressRepeat(button, () => store.dispatch({ type: 'increment' }), {
  // 连续触发时温度不再变化（到了上下限）就停下
  value: () => store.getState().temperature,
})
```

## 制冷 / 制热分别记温度

和真的遥控器一样，制冷和制热各自记住上一次的设定温度：制冷调到 20°C 后切到制热，是制热上次的温度；再切回制冷，又回到 20°C。记录保存在 `AcState.temperatures`（`{ cold, hot }`）里，`normalizeAcState` 会补齐旧版本保存的状态（两个模式都取保存时的温度），并保证当前模式的那一项始终等于 `temperature`。手写的 `AcState` 可以不带这个字段。

## 提示

每次操作后，core 的 `getAcActionNotification` 可能给出一条提示（`AcNotification`）。`kind` 决定视图怎么呈现，`createAcNotificationPresenter()` 把判断集中在一处，各框架共用：

| `kind` | 例子 | 呈现（`present()` 的返回值） |
| --- | --- | --- |
| `tip` | 制冷调到 26°C 以上更省电 | `note`：「出风口吹出的小纸条」。同一模式、同一温度只提示一次，重复时返回 `skip` |
| `limit` | 已经是最大温度啦！ | `shake`：遥控器小屏抖一下、数字变红，不弹提示 |
| `setting` | 风速：低风 | `announce`：小屏已经显示，只给读屏播报 |

```ts
import { createAcNotificationPresenter, getAcActionNotification } from '@yunlefun-home/air-conditioner-core'

const present = createAcNotificationPresenter() // 每个视图实例一个
const notification = getAcActionNotification(previous, next, action)
if (notification)
  present(notification, next) // 'note' | 'shake' | 'announce' | 'skip'
```

小纸条由 `.acw-note` 绘制：顶边一排撕口小圆齿，左侧是叶子图标，`data-mode` 决定冰蓝 / 暖橙的纸色，暗色下换成深色纸。它从出风口被风吹出（`acw-note-blow`），在风里轻轻摆动（`acw-note-flutter`），约 3.6 秒后被吹走（`acw-note-away`）；开启「减少动态效果」时只淡入淡出。纸条不接收点击，不会挡住下方的按钮。`--acw-note-lift` 可以调整它与出风口的距离。没有 `kind` 的旧提示按 `tip` 处理。

## 能效标签

机身左上角的能效标签是缩小版的「中国能效标识」：蓝白背景，顶部是标识名称和能效信息码（二维码），中间是等级条（1 级绿色、最高，箭头指向云空调的 1 级），下面是参数区和依据的国家标准编号，小字用点阵示意。版式依据《房间空气调节器能源效率标识实施规则》（CEL 010—2019）。

等级按现行 **GB 21455-2019**（2020 年 7 月 1 日起实施）分为 **5 级**。

::: tip 修订草案
GB 21455 的修订版征求意见稿（2026 年 5 月发布征求意见，拟代替 GB 21455-2019）将能效等级改为 **3 级**，并改用全年动态能源消耗效率（DAPF）分级。它还没有正式发布和实施，所以标签暂时保持 5 级；新标准实施后，只需要更新 core 里 `acEnergyLabel` 的 `grades`、`standard` 和 `levels`。
:::

标签按 50 × 80 设计（接近实物 66 × 109 mm 的比例），再用 CSS 变量 `--acw-energy-scale`（默认 `0.6`）整体缩小，和实物占挂机正面的比例相当。布局来自 core 的 `acEnergyLabel`，读屏文字来自 `getAcEnergyLabelText()`：

```ts
acEnergyLabel.grade // 1
acEnergyLabel.grades // 5
getAcEnergyLabelText() // '中国能效标识：能效等级 1 级（共 5 级），依据 GB 21455-2019'
```

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
