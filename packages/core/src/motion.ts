/**
 * 动效 token：各框架视图层共用的时长与缓动曲线。
 *
 * 样式里统一通过 CSS 变量（`--acw-motion-*`）引用，
 * 需要在 JS 里计时的地方（如 React 过渡组件）直接读取 `acMotion`。
 */
export const acMotion = {
  duration: {
    /** 按下反馈 */
    instant: 90,
    /** 悬停、指示灯、图标 */
    fast: 160,
    /** 显示屏、数字切换、提示 */
    base: 240,
    /** 导风板、出风淡入淡出 */
    slow: 420,
    /** 出风气流单次循环 */
    flow: 1800,
  },
  easing: {
    /** 常规状态切换 */
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    /** 进入：快起慢停 */
    enter: 'cubic-bezier(0, 0, 0, 1)',
    /** 退出：慢起快走 */
    exit: 'cubic-bezier(0.3, 0, 1, 1)',
    /** 轻微回弹（按钮松开、图标弹出） */
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const

export type AcMotionDuration = keyof typeof acMotion.duration
export type AcMotionEasing = keyof typeof acMotion.easing

/**
 * `prefers-reduced-motion: reduce` 时使用的时长：
 * 保留短促的淡入淡出（不涉及位移），去掉较长的过渡；循环动画由各样式表自行关闭。
 */
export const acReducedMotionDuration: Record<AcMotionDuration, number> = {
  instant: 0,
  fast: 80,
  base: 120,
  slow: 120,
  flow: 0,
}

export const acReducedMotionQuery = '(prefers-reduced-motion: reduce)'

/**
 * 当前环境是否要求减少动效（SSR / 无 matchMedia 时返回 `false`）。
 */
export function prefersReducedMotion(): boolean {
  return typeof globalThis.matchMedia === 'function'
    && globalThis.matchMedia(acReducedMotionQuery).matches
}

function declarations(durations: Record<AcMotionDuration, number>, withEasing: boolean, indent: string) {
  const lines = (Object.keys(durations) as AcMotionDuration[])
    .map(key => `${indent}--acw-motion-duration-${key}: ${durations[key]}ms;`)
  if (withEasing) {
    for (const key of Object.keys(acMotion.easing) as AcMotionEasing[])
      lines.push(`${indent}--acw-motion-ease-${key}: ${acMotion.easing[key]};`)
  }
  return lines.join('\n')
}

/**
 * 生成动效 CSS 变量声明（含 reduced-motion 覆盖），供 Shadow DOM 注入或样式表同步使用。
 *
 * @param selector 变量挂载的选择器，如 `:root`、`:host`
 */
export function renderAcMotionCssVars(selector = ':root'): string {
  return [
    `${selector} {`,
    declarations(acMotion.duration, true, '  '),
    '}',
    '',
    `@media ${acReducedMotionQuery} {`,
    `  ${selector} {`,
    declarations(acReducedMotionDuration, false, '    '),
    '  }',
    '}',
  ].join('\n')
}
