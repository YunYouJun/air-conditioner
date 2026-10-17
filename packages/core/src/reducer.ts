import type { AcAction, AcLimits, AcNotification, AcState, AcTone } from './types'
import {
  acSoundModeLabels,
  defaultAcLimits,
  defaultAcState,
  isAcSoundMode,
  maxTemperature,
  minTemperature,
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
  return {
    ...defaultAcState,
    ...state,
    temperature: clampTemperature(state?.temperature ?? defaultAcState.temperature, limits),
    sound: isAcSoundMode(state?.sound) ? state.sound : defaultAcState.sound,
    swing: typeof state?.swing === 'boolean' ? state.swing : defaultAcState.swing,
  }
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
      return {
        ...state,
        temperature: clampTemperature(state.temperature + step, limits),
      }
    case 'decrement':
      return {
        ...state,
        temperature: clampTemperature(state.temperature - step, limits),
      }
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
    case 'mode':
      return {
        ...state,
        mode: action.mode,
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
    case 'update':
      return normalizeAcState({
        ...state,
        ...action.payload,
      }, limits)
    default:
      throw new Error('Unexpected Ac Action')
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

export function getSwingMessage(swing: AcState['swing']): string {
  return swing ? '扫风已开启：出风左右摆动' : '扫风已关闭：导风板停在当前位置'
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
    }
  }

  if (action.type === 'decrement' && previousState.temperature <= limits.min) {
    return {
      message: '已经是最小温度啦！',
      severity: 'error',
    }
  }

  if ((action.type === 'sound' || action.type === 'cycleSound') && nextState.sound !== previousState.sound) {
    return {
      message: getSoundModeMessage(nextState.sound),
      severity: 'info',
    }
  }

  if ((action.type === 'swing' || action.type === 'toggleSwing') && nextState.swing !== previousState.swing) {
    return {
      message: getSwingMessage(nextState.swing),
      severity: 'info',
    }
  }

  if (action.type === 'mode' && nextState.mode === 'cold' && previousState.temperature < recommendedColdTemperature) {
    return {
      message: getRecommendedTemperatureMessage('cold', recommendedColdTemperature),
      severity: 'success',
    }
  }

  if (action.type === 'mode' && nextState.mode === 'hot' && previousState.temperature > recommendedHotTemperature) {
    return {
      message: getRecommendedTemperatureMessage('hot', recommendedHotTemperature),
      severity: 'success',
    }
  }

  return undefined
}
