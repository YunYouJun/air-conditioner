import type { AcMode, AcSoundMode, AcState } from './types'
import { acFanSpeedLabels, acModeLabels, acSoundModeLabels } from './constants'

/**
 * 各框架视图层共用的界面数据：遥控器图标与能效标签的点阵布局。
 * 保证 Vue / React / Web Component 渲染出完全一致的空调外观。
 */

/**
 * 遥控器按钮图标（24 × 24 viewBox 的 SVG path）。
 */
export const acIconPaths = {
  // Material Design Icons "fan", for the 风速 key.
  fan: 'M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z',
  cold: 'm22 11h-4.17l3.24-3.24l-1.41-1.42L15 11h-2V9l4.66-4.66l-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93L6.34 4.34L11 9v2H9L4.34 6.34L2.93 7.76L6.17 11H2v2h4.17l-3.24 3.24l1.41 1.42L9 13h2v2l-4.66 4.66l1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24l1.42-1.41L13 15v-2h2l4.66 4.66l1.41-1.42L17.83 13H22z',
  power: 'M13 3h-2v10h2zm4.83 2.17l-1.42 1.42A6.92 6.92 0 0 1 19 12a7 7 0 0 1-14 0a6.92 6.92 0 0 1 2.58-5.42L6.17 5.17A9 9 0 1 0 21 12a8.94 8.94 0 0 0-3.17-6.83',
  hot: 'M12 7a5 5 0 1 0 5 5a5 5 0 0 0-5-5m0-5a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1m0 17a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1M5.64 6.05L4.22 4.64a1 1 0 0 0-1.41 1.41l1.41 1.42a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42M21 11h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2M5 12a1 1 0 0 0-1-1H2a1 1 0 0 0 0 2h2a1 1 0 0 0 1-1m13.36-5.95a1 1 0 0 0 .7-.29l1.42-1.42a1 1 0 1 0-1.41-1.41l-1.42 1.41a1 1 0 0 0 0 1.42a1 1 0 0 0 .71.29m0 11.9a1 1 0 0 0-1.42 1.41l1.42 1.42a1 1 0 0 0 1.41 0a1 1 0 0 0 0-1.41ZM5.64 17.95l-1.42 1.42a1 1 0 0 0 0 1.41a1 1 0 0 0 1.41 0l1.42-1.42a1 1 0 0 0-1.41-1.41',
  increase: 'm12 8l6 8H6z',
  decrease: 'm12 16l-6-8h12z',
  plus: 'M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1',
  minus: 'M18 13H6c-.55 0-1-.45-1-1s.45-1 1-1h12c.55 0 1 .45 1 1s-.45 1-1 1',
  swing: 'M6 14h3l-4 4l-4-4h3c0-2.7 1.7-7.4 7-7.9v2c-3.4.5-5 3.8-5 5.9m14 0c0-2.7-1.7-7.4-7-7.9v2c3.4.6 5 3.8 5 5.9h-3l4 4l4-4z',
  soundNormal: 'M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1m13.5 2A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02M14 4.45v.2c0 .38.25.71.6.85C17.18 6.53 19 9.06 19 12s-1.82 5.47-4.4 6.5c-.36.14-.6.47-.6.85v.2c0 .63.63 1.07 1.21.85C18.6 19.11 21 15.84 21 12s-2.4-7.11-5.79-8.4c-.58-.23-1.21.22-1.21.85',
  soundSleep: 'M11.65 3.46c.27-.71-.36-1.45-1.12-1.34c-5.52.8-9.47 6.07-8.34 11.88c.78 4.02 4.09 7.21 8.14 7.87c3.74.61 7.16-.87 9.32-3.44c.48-.57.19-1.48-.55-1.62c-6.02-1.15-9.68-7.54-7.45-13.35',
  soundMute: 'M3.63 3.63a.996.996 0 0 0 0 1.41L7.29 8.7L7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91c-.36.15-.58.53-.58.92c0 .72.73 1.18 1.39.91c.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 1 0 1.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0M19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87c0-3.83-2.4-7.11-5.78-8.4c-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12m-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7M16.5 12A4.5 4.5 0 0 0 14 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24',
} as const

export type AcIconName = keyof typeof acIconPaths

/**
 * 声音键在各声音模式下显示的图标。
 */
export const acSoundIcons: Record<AcSoundMode, AcIconName> = {
  normal: 'soundNormal',
  sleep: 'soundSleep',
  mute: 'soundMute',
}

/**
 * 遥控器按键发出的指令：`RemoteControl` 的 `command` 事件 / `onCommand` 参数。
 * 模式键发出目标模式（`cold` / `hot`）。
 */
export type AcRemoteCommand = 'power' | AcMode | 'increase' | 'decrease' | 'swing' | 'sound' | 'fan'

/**
 * 遥控器小屏的读屏文字与各按键的悬停提示，保证各框架文案一致。
 */
export function getAcRemoteText(state: AcState) {
  const swing = `扫风：${state.swing ? '开' : '关'}`
  const sound = `声音：${acSoundModeLabels[state.sound]}`
  const fan = `风速：${acFanSpeedLabels[state.fan ?? 'auto']}`
  return {
    display: `${state.status ? '运行' : '待机'}，${acModeLabels[state.mode]} ${state.temperature}°C，${fan}，${swing}，${sound}`,
    power: `电源：${state.status ? '开' : '关'}`,
    mode: acModeLabels,
    fan,
    swing,
    sound,
  }
}

/**
 * 一行「黑点 / 白点」文字占位，模拟能效标签上的细密文字。
 */
export interface AcDotRow {
  num: number
  /** 点的直径（px） */
  size: number
  /** 水平外边距（px） */
  mx: number
  /** 垂直外边距（px） */
  my: number
  color: string
}

/**
 * 能效标签的点阵与等级条布局：蓝白背景的「中国能效标识」，带能效信息码
 * （二维码），样式依据《房间空气调节器能源效率标识实施规则》（CEL 010—2019）。
 *
 * 等级按现行 GB 21455-2019 分 5 级，1 级最高。GB 21455 的修订版征求意见稿
 * （2026 年 5 月）拟改为 3 级、以全年动态能源消耗效率（DAPF）分级；正式发布并
 * 实施后，再更新 `grades`、`standard` 与 `levels`。
 *
 * - `top`：标识名称（白点），右侧是能效信息码
 * - 等级区：首行是 1 级绿色条和指示箭头，`levels` 是 2–5 级
 * - `detail`：生产者、型号、APF 等参数（黑点）
 * - `footer`：依据的国家标准编号（白点）
 */
export const acEnergyLabel: {
  /** 标签所示的能效等级：云空调是 1 级 */
  grade: number
  /** 等级总数 */
  grades: number
  /** 依据的能源效率强制性国家标准 */
  standard: string
  top: AcDotRow[]
  detail: AcDotRow[]
  footer: AcDotRow
  levels: { background: string, width: string }[]
} = {
  grade: 1,
  grades: 5,
  standard: 'GB 21455-2019',
  top: [
    { num: 4, size: 4, mx: 1.5, my: 0, color: 'white' },
  ],
  detail: [
    { num: 11, size: 2, mx: 0.8, my: 2, color: 'black' },
    { num: 9, size: 1.5, mx: 0.8, my: 2, color: 'black' },
    { num: 10, size: 1.2, mx: 0.8, my: 0, color: 'black' },
  ],
  footer: { num: 8, size: 2, mx: 0.8, my: 0, color: 'white' },
  // 2–5 级：浅绿、黄、橙、红（1 级是首行的绿色条）
  levels: [
    { background: 'lightgreen', width: '50%' },
    { background: '#fdd835', width: '60%' },
    { background: 'orange', width: '70%' },
    { background: 'red', width: '80%' },
  ],
}

/**
 * 能效标签的读屏文字。
 */
export function getAcEnergyLabelText(): string {
  return `中国能效标识：能效等级 ${acEnergyLabel.grade} 级（共 ${acEnergyLabel.grades} 级），依据 ${acEnergyLabel.standard}`
}
