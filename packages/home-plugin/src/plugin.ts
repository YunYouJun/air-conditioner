import type { AcAction, AcState } from '@yunlefun-home/air-conditioner-core'
import type { YunHomeSandboxPlugin } from './types'
import {
  acReducer,
  acSoundModes,
  acTone,
  defaultAcState,
  isAcSoundMode,
  normalizeAcState,
} from '@yunlefun-home/air-conditioner-core'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalize(value: unknown): AcState {
  const record = isRecord(value) ? value : {}
  return normalizeAcState({
    status: typeof record.status === 'boolean' ? record.status : defaultAcState.status,
    mode: record.mode === 'hot' ? 'hot' : 'cold',
    temperature: typeof record.temperature === 'number' && Number.isFinite(record.temperature) ? record.temperature : defaultAcState.temperature,
    sound: isAcSoundMode(record.sound) ? record.sound : defaultAcState.sound,
  })
}

function isAction(value: unknown): value is AcAction {
  if (!isRecord(value) || typeof value.type !== 'string')
    return false
  switch (value.type) {
    case 'increment':
    case 'decrement':
    case 'toggleStatus':
    case 'cycleSound':
      return true
    case 'status':
      return typeof value.status === 'boolean'
    case 'mode':
      return value.mode === 'cold' || value.mode === 'hot'
    case 'sound':
      return acSoundModes.includes(value.sound as AcState['sound'])
    default:
      return false
  }
}

/**
 * The air conditioner as a Yun Home sandbox plugin, built on the shared core
 * reducer so web, widget and native hosts behave the same.
 */
export const airConditionerPlugin: YunHomeSandboxPlugin<AcState, AcAction> = {
  create: () => ({ ...defaultAcState }),
  normalize,
  isAction,
  reduce: (state, action, context) => acReducer(normalize(state), action, context?.limits),
  present(state) {
    const current = normalize(state)
    const temperature = `${current.temperature}°C`
    return {
      active: current.status,
      tone: acTone(current),
      summary: current.status ? `${current.mode === 'hot' ? '制热' : '制冷'} · ${temperature}` : `待机 · ${temperature}`,
    }
  },
}
