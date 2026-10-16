import { afterEach, describe, expect, it, vi } from 'vitest'
import { acShellSize, getAcScale, observeAcScale } from '../src'

describe('shell layout', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('only scales down to keep the wide aspect ratio', () => {
    expect(getAcScale(343, acShellSize.wide.width)).toBeCloseTo(343 / 600)
    expect(getAcScale(800, acShellSize.wide.width)).toBe(1)
    expect(getAcScale(0, acShellSize.wide.width)).toBe(1)
    expect(getAcScale(Number.NaN, acShellSize.compact.width)).toBe(1)
  })

  it('is a no-op without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const onScale = vi.fn()
    const stop = observeAcScale({} as Element, 360, onScale)

    expect(onScale).not.toHaveBeenCalled()
    expect(stop).toBeTypeOf('function')
  })

  it('reports the initial scale and later changes once each', () => {
    let callback: ResizeObserverCallback | undefined
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      constructor(cb: ResizeObserverCallback) {
        callback = cb
      }

      observe() {}
      disconnect = disconnect
    })
    const target = { getBoundingClientRect: () => ({ width: 180 }) } as Element
    const onScale = vi.fn()
    const stop = observeAcScale(target, 360, onScale)
    const resize = (width: number) => callback?.([{ contentRect: { width } } as ResizeObserverEntry], {} as ResizeObserver)

    resize(180)
    resize(360)
    resize(400)

    expect(onScale.mock.calls).toEqual([[0.5], [1]])
    stop()
    expect(disconnect).toHaveBeenCalled()
  })
})
