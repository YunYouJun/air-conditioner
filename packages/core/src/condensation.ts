import type { AcFanSpeed, AcState } from './types'
import { maxTemperature, minTemperature } from './constants'

type CondensationState = Pick<AcState, 'status' | 'mode' | 'temperature'> & { fan?: AcFanSpeed }

/** 风速越大，雾气越浓、冷凝水越快 */
const fanFactor: Record<AcFanSpeed, number> = {
  auto: 0.8,
  low: 0.55,
  medium: 0.8,
  high: 1,
}

/** 高于这个设定温度不滴水：冷凝水不该常见，只在开得很冷时偶尔出现 */
export const acDripMaxTemperature = 22

/** 最冷（16 °C）与 {@link acDripMaxTemperature} 时，两滴水之间的间隔（ms） */
export const acDripIntervalRange = [9000, 18000] as const

/**
 * 出风口雾气的浓度（#70），0–1：只在制冷开机时出现，设定温度越低、风越大越浓。
 *
 * 视图把它写进 CSS 变量 `--acw-mist`，3D 等其他渲染器也可以按它控制粒子数量。
 */
export function getAcMist(state: CondensationState): number {
  if (!state.status || state.mode !== 'cold')
    return 0
  // 16 °C 为 1，31 °C 为 0.2
  const cold = 0.2 + 0.8 * (maxTemperature - state.temperature) / (maxTemperature - minTemperature)
  const mist = Math.min(1, Math.max(0.2, cold)) * fanFactor[state.fan ?? 'auto']
  return Math.round(mist * 100) / 100
}

/**
 * 冷凝水滴落的间隔（#21，ms）：只在制冷开机、设定温度不高于 {@link acDripMaxTemperature} 时滴水，
 * 越冷越频繁，高风再快一些；不滴水时返回 `undefined`。
 *
 * 视图把它写进 CSS 变量 `--acw-drip-cycle`，水珠在出风口边缘慢慢聚起再落下，开机后要等一整个间隔才滴第一滴。
 */
export function getAcDripInterval(state: CondensationState): number | undefined {
  if (!state.status || state.mode !== 'cold' || state.temperature > acDripMaxTemperature)
    return undefined
  const [fastest, slowest] = acDripIntervalRange
  const progress = (state.temperature - minTemperature) / (acDripMaxTemperature - minTemperature)
  const interval = fastest + (slowest - fastest) * Math.min(1, Math.max(0, progress))
  return Math.round(interval * (state.fan === 'high' ? 0.8 : 1))
}

/**
 * 视图要写到空调根元素上的雾气 / 滴水样式变量与属性。
 */
export function getAcCondensationStyle(state: CondensationState): { mist: number, dripCycle?: string, drip: 'on' | 'off' } {
  const interval = getAcDripInterval(state)
  return {
    mist: getAcMist(state),
    dripCycle: interval === undefined ? undefined : `${interval}ms`,
    drip: interval === undefined ? 'off' : 'on',
  }
}
