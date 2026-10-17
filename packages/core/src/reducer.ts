import type { AcAction, AcFanSpeed, AcLimits, AcMode, AcNotification, AcState, AcTone } from './types'
import {
  acFanSpeedLabels,
  acSoundModeLabels,
  defaultAcLimits,
  defaultAcState,
  isAcFanSpeed,
  isAcSoundMode,
  maxTemperature,
  minTemperature,
  nextAcFanSpeed,
  nextAcSoundMode,
  recommendedColdTemperature,
  recommendedHotTemperature,
} from './constants'

/**
 * Merge a partial state over the defaults and clamp its temperature.
 *
 * @param state - Partial or stored state
 * @param limits - Device limits; omit to keep the default 16–31 °C range
 */
export function normalizeAcState(state: Partial<AcState> | undefined, limits?: AcLimits): AcState {
  const mode: AcMode = state?.mode === 'hot' ? 'hot' : 'cold'
  const temperature = clampTemperature(state?.temperature ?? defaultAcState.temperature, limits)
  const remembered = (other: AcMode) => {
    const value = state?.temperatures?.[other]
    return typeof value === 'number' && Number.isFinite(value) ? clampTemperature(value, limits) : temperature
  }
  return {
    ...defaultAcState,
    ...state,
    mode,
    temperature,
    // The current mode always remembers the current temperature.
    temperatures: {
      cold: mode === 'cold' ? temperature : remembered('cold'),
      hot: mode === 'hot' ? temperature : remembered('hot'),
    },
    sound: isAcSoundMode(state?.sound) ? state.sound : defaultAcState.sound,
    swing: typeof state?.swing === 'boolean' ? state.swing : defaultAcState.swing,
    fan: isAcFanSpeed(state?.fan) ? state.fan : 'auto',
  }
}

/** Set the current mode's temperature, keeping `temperatures` in step. */
function withTemperature(state: AcState, temperature: number): AcState {
  const temperatures = { cold: temperature, hot: temperature, ...state.temperatures }
  temperatures[state.mode] = temperature
  return { ...state, temperature, temperatures }
}

/**
 * Clamp a temperature into range. When `limits` are given the value also
 * snaps to the device step, measured from `limits.min`.
 *
 * @param temperature - Requested temperature in Celsius
 * @param limits - Device limits; omit to clamp to 16–31 °C without snapping
 */
export function clampTemperature(temperature: number, limits?: AcLimits): number {
  if (!limits)
    return Math.min(maxTemperature, Math.max(minTemperature, temperature))
  const { min, max, step } = limits
  const snapped = step > 0 ? Math.round((temperature - min) / step) * step + min : temperature
  // Round away floating point noise from fractional steps such as 0.5.
  return Number(Math.min(max, Math.max(min, snapped)).toFixed(4))
}

/**
 * Apply an action to the state.
 *
 * @param state - Current state
 * @param action - Action to apply
 * @param limits - Device limits; increments use `limits.step`
 */
export function acReducer(state: AcState, action: AcAction, limits?: AcLimits): AcState {
  const step = limits?.step ?? defaultAcLimits.step
  switch (action.type) {
    case 'increment':
      return withTemperature(state, clampTemperature(state.temperature + step, limits))
    case 'decrement':
      return withTemperature(state, clampTemperature(state.temperature - step, limits))
    case 'toggleStatus':
      return {
        ...state,
        status: !state.status,
      }
    case 'status':
      return {
        ...state,
        status: action.status,
      }
    case 'mode': {
      const status = state.status || action.powerOn === true
      if (action.mode === state.mode)
        return status === state.status ? state : { ...state, status }
      // Remember this mode's temperature and restore the other one's.
      const temperatures = { cold: state.temperature, hot: state.temperature, ...state.temperatures, [state.mode]: state.temperature }
      return {
        ...state,
        status,
        mode: action.mode,
        temperature: clampTemperature(temperatures[action.mode] ?? state.temperature, limits),
        temperatures,
      }
    }
    case 'sound':
      return {
        ...state,
        sound: isAcSoundMode(action.sound) ? action.sound : state.sound,
      }
    case 'cycleSound':
      return {
        ...state,
        sound: nextAcSoundMode(state.sound),
      }
    case 'toggleSwing':
      return {
        ...state,
        swing: !state.swing,
      }
    case 'swing':
      return {
        ...state,
        swing: action.swing === true,
      }
    case 'fan':
      return {
        ...state,
        fan: isAcFanSpeed(action.fan) ? action.fan : state.fan,
      }
    case 'cycleFan':
      return {
        ...state,
        fan: nextAcFanSpeed(state.fan),
      }
    case 'update':
      return normalizeAcState({
        ...state,
        ...action.payload,
      }, limits)
    default:
      throw new Error('Unexpected Ac Action')
  }
}

/**
 * 节能建议的短文案（显示在小纸条上）与补充说明。
 */
export function getEnergyTip(mode: AcState['mode'], temperature: number): { message: string, detail: string } {
  return mode === 'cold'
    ? { message: `制冷调到 ${temperature}°C 以上更省电`, detail: '少开一度，为节能减排出一份力' }
    : { message: `制热调到 ${temperature}°C 以下更省电`, detail: '少开一度，为节能减排出一份力' }
}

/**
 * 视图如何呈现一条提示：
 *
 * - `note`：节能建议，以小纸条显示
 * - `shake`：温度到了上下限，遥控器小屏抖一下
 * - `announce`：设置变化，小屏已经显示，只给读屏播报
 * - `skip`：同一模式、同一温度的建议已经提示过，不再重复
 */
export type AcNotificationPresentation = 'note' | 'shake' | 'announce' | 'skip'

/**
 * 创建一个提示「呈现器」：每个视图实例一个，记住提示过的节能建议，避免重复打扰。
 */
export function createAcNotificationPresenter(): (notification: AcNotification, state: Pick<AcState, 'mode' | 'temperature'>) => AcNotificationPresentation {
  let lastTip: string | undefined
  return (notification, state) => {
    if (notification.kind === 'limit')
      return 'shake'
    if (notification.kind === 'setting')
      return 'announce'
    const key = `${state.mode}:${state.temperature}`
    if (key === lastTip)
      return 'skip'
    lastTip = key
    return 'note'
  }
}

export function getRecommendedTemperatureMessage(mode: AcState['mode'], temperature: number): string {
  return `建议将空调的制${mode === 'cold' ? '冷' : '热'}温度调至 ${temperature} 度以${mode === 'cold' ? '上' : '下'}，为节能减排贡献一份力量！`
}

export function getSoundModeMessage(sound: AcState['sound']): string {
  const hints: Record<AcState['sound'], string> = {
    normal: '风声和按键音恢复正常',
    sleep: '风声和按键音都调小了，晚安',
    mute: '空调不再发出任何声音',
  }
  return `${acSoundModeLabels[sound]}模式：${hints[sound]}`
}

export function getFanSpeedMessage(fan: AcFanSpeed): string {
  return fan === 'auto' ? '风速：自动，由空调根据室温调节' : `风速：${acFanSpeedLabels[fan]}`
}

export function getSwingMessage(swing: AcState['swing']): string {
  return swing ? '扫风已开启：导风板上下摆动，出风左右扫' : '扫风已关闭：导风板停在当前位置'
}

/**
 * Visual tone for a state: `idle` when off, otherwise `cool` or `heat`.
 *
 * @param state - Current state
 */
export function acTone(state: Pick<AcState, 'status' | 'mode'>): AcTone {
  if (!state.status)
    return 'idle'
  return state.mode === 'hot' ? 'heat' : 'cool'
}

export function getAcActionNotification(
  previousState: AcState,
  nextState: AcState,
  action: AcAction,
  limits: AcLimits = defaultAcLimits,
): AcNotification | undefined {
  if (action.type === 'increment' && previousState.temperature >= limits.max) {
    return {
      message: '已经是最大温度啦！',
      severity: 'error',
      kind: 'limit',
    }
  }

  if (action.type === 'decrement' && previousState.temperature <= limits.min) {
    return {
      message: '已经是最小温度啦！',
      severity: 'error',
      kind: 'limit',
    }
  }

  if ((action.type === 'sound' || action.type === 'cycleSound') && nextState.sound !== previousState.sound) {
    return {
      message: getSoundModeMessage(nextState.sound),
      severity: 'info',
      kind: 'setting',
    }
  }

  if ((action.type === 'fan' || action.type === 'cycleFan') && nextState.fan && nextState.fan !== previousState.fan) {
    return {
      message: getFanSpeedMessage(nextState.fan),
      severity: 'info',
      kind: 'setting',
    }
  }

  if ((action.type === 'swing' || action.type === 'toggleSwing') && nextState.swing !== previousState.swing) {
    return {
      message: getSwingMessage(nextState.swing),
      severity: 'info',
      kind: 'setting',
    }
  }

  // The temperature a mode switch lands on (each mode remembers its own).
  if (action.type === 'mode' && nextState.mode === 'cold' && nextState.temperature < recommendedColdTemperature) {
    return {
      ...getEnergyTip('cold', recommendedColdTemperature),
      severity: 'success',
      kind: 'tip',
    }
  }

  if (action.type === 'mode' && nextState.mode === 'hot' && nextState.temperature > recommendedHotTemperature) {
    return {
      ...getEnergyTip('hot', recommendedHotTemperature),
      severity: 'success',
      kind: 'tip',
    }
  }

  return undefined
}
