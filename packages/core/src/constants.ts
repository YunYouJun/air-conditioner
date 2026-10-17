import type { AcFanSpeed, AcLimits, AcMode, AcSoundMode, AcState } from './types'

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
  temperatures: { cold: 26, hot: 26 },
  sound: 'normal',
  swing: false,
  fan: 'auto',
}

/**
 * 遥控器「声音」键依次切换的顺序。
 */
export const acSoundModes: readonly AcSoundMode[] = ['normal', 'sleep', 'mute']

/**
 * 各模式的中文名称（遥控器小屏与按键提示共用）。
 */
export const acModeLabels: Record<AcMode, string> = {
  cold: '制冷',
  hot: '制热',
}

export const acSoundModeLabels: Record<AcSoundMode, string> = {
  normal: '标准',
  sleep: '睡眠',
  mute: '静音',
}

/**
 * 各声音模式的总音量（0–1）。
 */
export const acSoundVolumes: Record<AcSoundMode, number> = {
  normal: 1,
  sleep: 0.3,
  mute: 0,
}

/**
 * 遥控器「风速」键依次切换的顺序。
 */
export const acFanSpeeds: readonly AcFanSpeed[] = ['auto', 'low', 'medium', 'high']

export const acFanSpeedLabels: Record<AcFanSpeed, string> = {
  auto: '自动',
  low: '低风',
  medium: '中风',
  high: '高风',
}

/**
 * 小屏上点亮的风速格数（1–3）。自动风速由空调自己决定，显示为 0 并另加「自动」标记。
 */
export const acFanBars: Record<AcFanSpeed, number> = {
  auto: 0,
  low: 1,
  medium: 2,
  high: 3,
}

/**
 * 固定风速下风声的相对音量（0–1）；自动风速沿用开机后的「达标 / 发力」循环。
 */
export const acFanSoundLevels: Record<Exclude<AcFanSpeed, 'auto'>, number> = {
  low: 0.45,
  medium: 0.7,
  high: 1,
}

export function isAcFanSpeed(value: unknown): value is AcFanSpeed {
  return acFanSpeeds.includes(value as AcFanSpeed)
}

/**
 * 风速键的下一档：自动 → 低 → 中 → 高 → 自动。
 */
export function nextAcFanSpeed(fan: AcFanSpeed | undefined): AcFanSpeed {
  const index = Math.max(acFanSpeeds.indexOf(fan as AcFanSpeed), 0)
  return acFanSpeeds[(index + 1) % acFanSpeeds.length]
}

export function isAcSoundMode(value: unknown): value is AcSoundMode {
  return acSoundModes.includes(value as AcSoundMode)
}

/**
 * 声音键的下一个模式：标准 → 睡眠 → 静音 → 标准。
 */
export function nextAcSoundMode(mode: AcSoundMode | undefined): AcSoundMode {
  // 缺省（旧版本保存的状态）视为标准模式
  const index = Math.max(acSoundModes.indexOf(mode as AcSoundMode), 0)
  return acSoundModes[(index + 1) % acSoundModes.length]
}

/**
 * 音效时序。时长单位为毫秒，`*Level` 是风声相对音量（0–1）。
 */
export const soundTimings = {
  /** 开机后多久接上持续的风声（启动声约 9 秒） */
  startDelayMs: 8000,
  /** 风声循环首尾的交叉淡化时长 */
  loopCrossfadeMs: 1500,
  /** 关机时声音淡出时长 */
  stopFadeMs: 600,
  /** 开机运行多久后室温达标、风声降下来 */
  settleAfterMs: 90_000,
  /** 风声降下来的渐变时长 */
  settleRampMs: 20_000,
  /** 达标后的安静风声 */
  settleLevel: 0.5,
  /** 室温回升、压缩机重新发力时的风声 */
  surgeLevel: 0.85,
  /** 两次发力之间安静运行的时长范围 */
  quietDurationMs: [180_000, 360_000],
  /** 每次发力持续的时长范围 */
  surgeDurationMs: [60_000, 120_000],
  /** 发力 / 回落的渐变时长 */
  surgeRampMs: 10_000,
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
