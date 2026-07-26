# @yunlefun-home/air-conditioner-core

Framework-agnostic state, reducer, persistence, audio, and notification helpers for [Yun Air Conditioner](https://ac.yunyoujun.cn/).

## Install

```bash
pnpm add @yunlefun-home/air-conditioner-core
```

## Usage

```ts
import { createAirConditionerStore } from '@yunlefun-home/air-conditioner-core'

const store = createAirConditionerStore()
store.dispatch({ type: 'status', status: true })
store.dispatch({ type: 'mode', mode: 'cold' })
store.dispatch({ type: 'update', payload: { temperature: 26 } })
```

## License

[MIT](https://github.com/YunYouJun/air-conditioner/blob/dev/LICENSE)
