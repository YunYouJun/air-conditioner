import type { AcLimits, AcMode, AcState } from './types'

export const acStorageKey = 'ac:state'

/**
 * 各模式对应的显示图标（供各框架视图层复用）。
 */
export const acModeIcons: Record<AcMode, string> = {
  cold: '❄️',
  hot: '☀️',
}

/**
 * 默认音频资源文件名（不含扩展名）。
 *
 * - `beep` 按键「嘀」声
 * - `start` 空调启动声
 * - `work` 持续工作（出风）声
 */
export const acAudioFileNames = {
  beep: 'di',
  start: 'ac-work',
  work: 'air-extractor-fan',
} as const

export const minTemperature = 16
export const maxTemperature = 31

export const defaultAcLimits: AcLimits = {
  min: minTemperature,
  max: maxTemperature,
  step: 1,
}

export const recommendedColdTemperature = 26
export const recommendedHotTemperature = 20

export const defaultAcState: AcState = {
  mode: 'cold',
  status: false,
  temperature: 26,
}

export const soundTimings = {
  startDelayMs: 8000,
  noiseStartTime: 2,
  noiseDuration: 56,
} as const

/**
 * 根据基础路径解析出三个音频文件的完整 URL。
 *
 * 纯字符串拼接，可在任意环境（含 SSR）调用。
 *
 * @param baseUrl 音频目录，如 `/assets/audio`
 * @param ext 文件扩展名，默认 `m4a`
 */
export function resolveAcAudioAssets(baseUrl = '/assets/audio', ext = 'm4a') {
  const base = baseUrl.replace(/\/$/, '')
  return {
    beep: `${base}/${acAudioFileNames.beep}.${ext}`,
    start: `${base}/${acAudioFileNames.start}.${ext}`,
    work: `${base}/${acAudioFileNames.work}.${ext}`,
  }
}
