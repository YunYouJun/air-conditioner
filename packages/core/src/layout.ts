/**
 * 机身的设计尺寸（px）。窄容器下按比例整体缩放，保持「长款」外观不被压扁。
 *
 * - `compact`：Vue / React 组件库 / Web Component 使用的 360 × 152 机身
 * - `wide`：React 主站使用的 600 × 152 机身
 */
export const acShellSize = {
  compact: { width: 360, height: 152 },
  wide: { width: 600, height: 152 },
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

  update(target.getBoundingClientRect().width)
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries)
      update(entry.contentRect.width)
  })
  observer.observe(target)
  return () => observer.disconnect()
}
