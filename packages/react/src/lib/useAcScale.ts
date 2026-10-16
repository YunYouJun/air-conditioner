import type { RefObject } from 'react'
import { observeAcScale, observeAcTilt } from '@yunlefun-home/air-conditioner-core'
import { useEffect, useLayoutEffect, useState } from 'react'

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

/**
 * 指针跟随的轻微 3D 倾斜角度 `[rotateX, rotateY]`（deg）；触屏或减少动效时保持 `[0, 0]`。
 *
 * @param ref 监听指针的元素
 */
export function useAcTilt(ref: RefObject<HTMLElement | null>) {
  const [tilt, setTilt] = useState<[number, number]>([0, 0])

  useEffect(() => {
    if (!ref.current)
      return
    return observeAcTilt(ref.current, (x, y) => setTilt([x, y]))
  }, [ref])

  return tilt
}
