/**
 * 各框架视图层共用的界面数据：遥控器图标与能效标签的点阵布局。
 * 保证 Vue / React / Web Component 渲染出完全一致的空调外观。
 */

/**
 * 遥控器按钮图标（24 × 24 viewBox 的 SVG path）。
 */
export const acIconPaths = {
  cold: 'm22 11h-4.17l3.24-3.24l-1.41-1.42L15 11h-2V9l4.66-4.66l-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93L6.34 4.34L11 9v2H9L4.34 6.34L2.93 7.76L6.17 11H2v2h4.17l-3.24 3.24l1.41 1.42L9 13h2v2l-4.66 4.66l1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24l1.42-1.41L13 15v-2h2l4.66 4.66l1.41-1.42L17.83 13H22z',
  power: 'M13 3h-2v10h2zm4.83 2.17l-1.42 1.42A6.92 6.92 0 0 1 19 12a7 7 0 0 1-14 0a6.92 6.92 0 0 1 2.58-5.42L6.17 5.17A9 9 0 1 0 21 12a8.94 8.94 0 0 0-3.17-6.83',
  hot: 'M12 7a5 5 0 1 0 5 5a5 5 0 0 0-5-5m0-5a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1m0 17a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1M5.64 6.05L4.22 4.64a1 1 0 0 0-1.41 1.41l1.41 1.42a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42M21 11h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2M5 12a1 1 0 0 0-1-1H2a1 1 0 0 0 0 2h2a1 1 0 0 0 1-1m13.36-5.95a1 1 0 0 0 .7-.29l1.42-1.42a1 1 0 1 0-1.41-1.41l-1.42 1.41a1 1 0 0 0 0 1.42a1 1 0 0 0 .71.29m0 11.9a1 1 0 0 0-1.42 1.41l1.42 1.42a1 1 0 0 0 1.41 0a1 1 0 0 0 0-1.41ZM5.64 17.95l-1.42 1.42a1 1 0 0 0 0 1.41a1 1 0 0 0 1.41 0l1.42-1.42a1 1 0 0 0-1.41-1.41',
  increase: 'm12 8l6 8H6z',
  decrease: 'm12 16l-6-8h12z',
} as const

export type AcIconName = keyof typeof acIconPaths

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
 * 能效标签的点阵与等级条布局。
 */
export const acEnergyLabel: {
  top: AcDotRow[]
  detail: AcDotRow[]
  footer: AcDotRow
  levels: { background: string, width: string }[]
} = {
  top: [
    { num: 6, size: 4, mx: 2, my: 0, color: 'white' },
  ],
  detail: [
    { num: 11, size: 2, mx: 0.8, my: 2, color: 'black' },
    { num: 9, size: 1.5, mx: 0.8, my: 2, color: 'black' },
    { num: 10, size: 1.2, mx: 0.8, my: 0, color: 'black' },
  ],
  footer: { num: 8, size: 2, mx: 0.8, my: 0, color: 'white' },
  levels: [
    { background: 'lightgreen', width: '50%' },
    { background: '#ffc107', width: '60%' },
    { background: 'orange', width: '70%' },
    { background: 'red', width: '80%' },
  ],
}
