import type { AcAction, AcState } from '@yunlefun-home/air-conditioner-core'
import type { PluginContext, YunHomeSandboxPlugin } from './types'
import {
  acReducer,
  acSoundModes,
  acTone,
  defaultAcState,
  isAcFanSpeed,
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
    // Per-mode memory (#39); core validates and clamps each value.
    temperatures: isRecord(record.temperatures) ? record.temperatures as AcState['temperatures'] : undefined,
    sound: isAcSoundMode(record.sound) ? record.sound : defaultAcState.sound,
    swing: typeof record.swing === 'boolean' ? record.swing : defaultAcState.swing,
    fan: isAcFanSpeed(record.fan) ? record.fan : undefined,
  })
}

/** The host's room temperature, if it granted `sensor:thermal` and has one. */
function roomCelsius(context: PluginContext | undefined): number | undefined {
  const celsius = isRecord(context) && isRecord(context.room) ? context.room.celsius : undefined
  return typeof celsius === 'number' && Number.isFinite(celsius) ? Math.round(celsius) : undefined
}

function isAction(value: unknown): value is AcAction {
  if (!isRecord(value) || typeof value.type !== 'string')
    return false
  switch (value.type) {
    case 'increment':
    case 'decrement':
    case 'toggleStatus':
    case 'cycleSound':
    case 'toggleSwing':
    case 'cycleFan':
      return true
    case 'status':
      return typeof value.status === 'boolean'
    case 'mode':
      return value.mode === 'cold' || value.mode === 'hot'
    case 'sound':
      return acSoundModes.includes(value.sound as AcState['sound'])
    case 'fan':
      return isAcFanSpeed(value.fan)
    case 'swing':
      return typeof value.swing === 'boolean'
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
  present(state, context) {
    const current = normalize(state)
    const temperature = `${current.temperature}°C`
    const summary = current.status ? `${current.mode === 'hot' ? '制热' : '制冷'} · ${temperature}` : `待机 · ${temperature}`
    const room = roomCelsius(context)
    return {
      active: current.status,
      tone: acTone(current),
      summary: room === undefined ? summary : `${summary} · 室温 ${room}°C`,
    }
  },
}
