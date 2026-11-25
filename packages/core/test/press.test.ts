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

describe('reentrant press cleanup', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  for (const phase of ['initial', 'repeat'] as const) {
    for (const stopEvent of ['dispose', 'pointerup', 'pointerleave', 'pointercancel']) {
      it(`honors ${stopEvent} during ${phase} fire and permits only live bindings to restart`, () => {
        const button = document.createElement('button')
        let calls = 0
        const stopAt = phase === 'initial' ? 1 : 2
        const cleanup = bindAcPressRepeat(button, () => {
          calls++
          if (calls === stopAt) {
            if (stopEvent === 'dispose')
              cleanup()
            else
              pointer(button, stopEvent)
          }
        })
        pointer(button, 'pointerdown')
        if (phase === 'repeat')
          vi.advanceTimersByTime(500)
        expect(calls).toBe(stopAt)
        expect(vi.getTimerCount()).toBe(0)
        vi.advanceTimersByTime(2000)
        expect(calls).toBe(stopAt)
        pointer(button, 'pointerdown')
        if (stopEvent === 'dispose') {
          button.click()
          expect(calls).toBe(stopAt)
          expect(vi.getTimerCount()).toBe(0)
        }
        else {
          expect(calls).toBe(stopAt + 1)
          vi.advanceTimersByTime(500)
          expect(calls).toBe(stopAt + 2)
          pointer(button, 'pointerup')
          expect(vi.getTimerCount()).toBe(0)
          button.click()
          expect(calls).toBe(stopAt + 3)
        }
        cleanup()
        cleanup()
        expect(vi.getTimerCount()).toBe(0)
      })
    }
  }

  it('keeps a nested new press without reviving the previous repeat', () => {
    const button = document.createElement('button')
    let calls = 0
    const cleanup = bindAcPressRepeat(button, () => {
      calls++
      if (calls === 2)
        pointer(button, 'pointerdown')
    })
    pointer(button, 'pointerdown')
    vi.advanceTimersByTime(500)
    expect(calls).toBe(3)
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(499)
    expect(calls).toBe(3)
    vi.advanceTimersByTime(1)
    expect(calls).toBe(4)
    cleanup()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('allows a fresh binding after disposal inside a keyboard click', () => {
    const button = document.createElement('button')
    let calls = 0
    const cleanup = bindAcPressRepeat(button, () => {
      calls++
      cleanup()
    })
    button.click()
    button.click()
    pointer(button, 'pointerdown')
    expect(calls).toBe(1)
    expect(vi.getTimerCount()).toBe(0)
    const fresh = bindAcPressRepeat(button, () => calls++)
    button.click()
    pointer(button, 'pointerdown')
    vi.advanceTimersByTime(500)
    expect(calls).toBe(4)
    fresh()
    expect(vi.getTimerCount()).toBe(0)
  })
})
