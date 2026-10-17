/** 长按连续调节的节奏（ms） */
export interface AcPressRepeatOptions {
  /** 按住多久后开始连续触发 @default 500 */
  delay?: number
  /** 连续触发的初始间隔 @default 200 */
  interval?: number
  /** 加速后的最短间隔 @default 100 */
  minInterval?: number
  /**
   * 读取当前值（例如温度）。连续触发时值不再变化，说明到了上下限，就停下来，
   * 不会在边界上一直「嘀」。
   */
  value?: () => unknown
}

/**
 * 让按键支持长按连续触发，和真的遥控器一样：按下立即触发一次，按住一会儿后连续触发并逐渐加速，
 * 松开、移出或取消时停止。键盘的 Enter / 空格仍走 `click`，每按一次触发一次。
 *
 * @param element 按键
 * @param fire 每次触发时调用
 * @param options 节奏与停止条件
 * @returns 解除绑定的清理函数
 */
export function bindAcPressRepeat(element: HTMLElement, fire: () => void, options: AcPressRepeatOptions = {}): () => void {
  const { delay = 500, interval = 200, minInterval = 100, value } = options
  let timer: ReturnType<typeof setTimeout> | undefined
  let wait = interval
  let last: unknown

  const stop = () => {
    clearTimeout(timer)
    timer = undefined
  }

  const tick = () => {
    if (value && value() === last)
      return stop()
    last = value?.()
    fire()
    wait = Math.max(minInterval, wait * 0.85)
    timer = setTimeout(tick, wait)
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0)
      return
    stop()
    last = value?.()
    fire()
    wait = interval
    timer = setTimeout(tick, delay)
  }

  // 指针按下时已经触发过；只有键盘触发的 click（detail 为 0）才需要在这里处理
  const onClick = (event: MouseEvent) => {
    if (event.detail === 0)
      fire()
  }

  // 触屏长按不弹出菜单
  const onContextMenu = (event: Event) => event.preventDefault()

  element.addEventListener('pointerdown', onPointerDown)
  element.addEventListener('pointerup', stop)
  element.addEventListener('pointerleave', stop)
  element.addEventListener('pointercancel', stop)
  element.addEventListener('click', onClick)
  element.addEventListener('contextmenu', onContextMenu)
  return () => {
    stop()
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointerup', stop)
    element.removeEventListener('pointerleave', stop)
    element.removeEventListener('pointercancel', stop)
    element.removeEventListener('click', onClick)
    element.removeEventListener('contextmenu', onContextMenu)
  }
}
