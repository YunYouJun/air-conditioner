import type { RefObject } from 'react'
import { observeAcScale } from '@yunlefun-home/air-conditioner-core'
import { useLayoutEffect, useState } from 'react'

/**
 * 按容器宽度计算机身缩放比例（只缩小不放大），在绘制前测量以避免首帧溢出。
 *
 * @param ref 被测量宽度的容器
 * @param designWidth 机身设计宽度
 */
export function useAcScale(ref: RefObject<HTMLElement | null>, designWidth: number) {
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    if (!ref.current)
      return
    return observeAcScale(ref.current, designWidth, setScale)
  }, [ref, designWidth])

  return scale
}
