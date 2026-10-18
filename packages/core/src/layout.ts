import { acReducedMotionQuery } from './motion'

/**
 * 机身的设计尺寸（px），约 3:1，接近真实壁挂机（如 800–900mm × 280–300mm）的比例。
 * 窄容器下按比例整体缩放，保持「长款」外观不被压扁。
 *
 * - `compact`：Vue / React 组件库 / Web Component 使用的 360 × 128 机身
 * - `wide`：React 主站使用的 600 × 200 机身
 */
export const acShellSize = {
  compact: { width: 360, height: 128 },
  wide: { width: 600, height: 200 },
} as const

/**
 * 根据可用宽度计算机身缩放比例：只缩小、不放大。
 */
export function getAcScale(availableWidth: number, designWidth: number): number {
  if (!(availableWidth > 0) || !(designWidth > 0))
    return 1

  return Math.min(1, availableWidth / designWidth)
}

/**
 * 监听容器宽度变化并回调缩放比例。
 *
 * 不支持 `ResizeObserver` 的环境（如 SSR）直接返回空的清理函数，保持 1 倍显示。
 *
 * @param target 被测量宽度的容器（不要传被缩放的元素本身）
 * @param designWidth 机身的设计宽度
 * @param onScale 比例变化时的回调
 * @returns 停止监听的清理函数
 */
export function observeAcScale(target: Element, designWidth: number, onScale: (scale: number) => void): () => void {
  if (typeof ResizeObserver === 'undefined')
    return () => {}

  let current: number | undefined
  const update = (width: number) => {
    const scale = getAcScale(width, designWidth)
    if (scale !== current) {
      current = scale
      onScale(scale)
    }
  }

  // 用布局宽度而不是 getBoundingClientRect：容器正在转身（rotateY / scale）时，
  // 后者量到的是变换后的投影宽度，会算出偏小的比例，等 ResizeObserver 纠正时机身猛地一缩放
  update((target as HTMLElement).offsetWidth ?? target.getBoundingClientRect().width)
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries)
      update(entry.contentRect.width)
  })
  observer.observe(target)
  return () => observer.disconnect()
}

/** 指针跟随倾斜的最大角度（deg） */
export const acMaxTilt = 4

const finePointerQuery = '(hover: hover) and (pointer: fine)'

/**
 * 指针在元素上移动时回调轻微的 3D 倾斜角度（`rotateX` / `rotateY`，单位 deg），离开时回到 0。
 *
 * 仅在有悬停能力的精细指针（鼠标 / 触控板）上启用；`prefers-reduced-motion: reduce`、
 * 触屏或 SSR 下直接返回空的清理函数。
 *
 * @returns 停止监听的清理函数
 */
export function observeAcTilt(target: HTMLElement, onTilt: (rotateX: number, rotateY: number) => void, maxTilt = acMaxTilt): () => void {
  const matchMedia = globalThis.matchMedia
  if (typeof matchMedia !== 'function'
    || !matchMedia(finePointerQuery).matches
    || matchMedia(acReducedMotionQuery).matches) {
    return () => {}
  }

  let frame = 0
  const schedule = (rotateX: number, rotateY: number) => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => onTilt(rotateX, rotateY))
  }
  const onMove = (event: PointerEvent) => {
    const rect = target.getBoundingClientRect()
    if (!rect.width || !rect.height)
      return
    // -0.5 ~ 0.5：指针相对元素中心的位置
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    const round = (value: number) => Math.round(value * 100) / 100
    schedule(round(-y * 2 * maxTilt), round(x * 2 * maxTilt))
  }
  const onLeave = () => schedule(0, 0)

  target.addEventListener('pointermove', onMove)
  target.addEventListener('pointerleave', onLeave)
  return () => {
    cancelAnimationFrame(frame)
    target.removeEventListener('pointermove', onMove)
    target.removeEventListener('pointerleave', onLeave)
  }
}
