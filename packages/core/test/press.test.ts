// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindAcPressRepeat } from '../src'

function pointer(element: HTMLElement, type: string) {
  element.dispatchEvent(new PointerEvent(type, { button: 0, bubbles: true }))
}

describe('bindAcPressRepeat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires on press, repeats while held and stops on release', () => {
    const button = document.createElement('button')
    const fire = vi.fn()
    const unbind = bindAcPressRepeat(button, fire, { delay: 500, interval: 200, minInterval: 100 })

    pointer(button, 'pointerdown')
    expect(fire).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(499)
    expect(fire).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(fire).toHaveBeenCalledTimes(2)
    // Speeds up: 200 → 170 → 144.5 …
    vi.advanceTimersByTime(170)
    expect(fire).toHaveBeenCalledTimes(3)

    pointer(button, 'pointerup')
    vi.advanceTimersByTime(2000)
    expect(fire).toHaveBeenCalledTimes(3)

    // The click after a pointer press is ignored; a keyboard click fires once.
    button.dispatchEvent(new MouseEvent('click', { detail: 1 }))
    expect(fire).toHaveBeenCalledTimes(3)
    button.dispatchEvent(new MouseEvent('click', { detail: 0 }))
    expect(fire).toHaveBeenCalledTimes(4)

    unbind()
    pointer(button, 'pointerdown')
    expect(fire).toHaveBeenCalledTimes(4)
  })

  it('stops repeating once the value stops changing', () => {
    const button = document.createElement('button')
    let temperature = 29
    const fire = vi.fn(() => {
      temperature = Math.min(31, temperature + 1)
    })
    bindAcPressRepeat(button, fire, { value: () => temperature })

    pointer(button, 'pointerdown')
    vi.advanceTimersByTime(5000)
    expect(temperature).toBe(31)
    // 30, 31, then one press at 31 that changes nothing, and it stops.
    expect(fire).toHaveBeenCalledTimes(3)
  })
})
