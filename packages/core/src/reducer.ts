import type { AcAction, AcNotification, AcState } from './types'
import {
  acSoundModeLabels,
  defaultAcState,
  isAcSoundMode,
  maxTemperature,
  minTemperature,
  nextAcSoundMode,
  recommendedColdTemperature,
  recommendedHotTemperature,
} from './constants'

export function normalizeAcState(state: Partial<AcState> | undefined): AcState {
  return {
    ...defaultAcState,
    ...state,
    temperature: clampTemperature(state?.temperature ?? defaultAcState.temperature),
    sound: isAcSoundMode(state?.sound) ? state.sound : defaultAcState.sound,
  }
}

export function clampTemperature(temperature: number): number {
  return Math.min(maxTemperature, Math.max(minTemperature, temperature))
}

export function acReducer(state: AcState, action: AcAction): AcState {
  switch (action.type) {
    case 'increment':
      return {
        ...state,
        temperature: clampTemperature(state.temperature + 1),
      }
    case 'decrement':
      return {
        ...state,
        temperature: clampTemperature(state.temperature - 1),
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
    case 'update':
      return normalizeAcState({
        ...state,
        ...action.payload,
      })
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

export function getAcActionNotification(
  previousState: AcState,
  nextState: AcState,
  action: AcAction,
): AcNotification | undefined {
  if (action.type === 'increment' && previousState.temperature >= maxTemperature) {
    return {
      message: '已经是最大温度啦！',
      severity: 'error',
    }
  }

  if (action.type === 'decrement' && previousState.temperature <= minTemperature) {
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
