import type { AcMode, AcSoundMode, AcState } from './types'
import { acFanSpeedLabels, acModeLabels, acSoundModeLabels } from './constants'
import { acIconPaths } from './icons'

/**
 * 各框架视图层共用的界面数据：遥控器图标与能效标签的点阵布局。
 * 保证 Vue / React / Web Component 渲染出完全一致的空调外观。
 */

export { acIconPaths }

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
