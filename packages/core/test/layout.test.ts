import { afterEach, describe, expect, it, vi } from 'vitest'
import { acShellSize, getAcScale, observeAcScale, observeAcTilt } from '../src'

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
  it('keeps both shells close to a real 3:1 wall unit', () => {
    for (const { width, height } of Object.values(acShellSize)) {
      expect(width / height).toBeGreaterThanOrEqual(2.7)
      expect(width / height).toBeLessThanOrEqual(3.2)
    }
  })

  it('skips pointer tilt without a fine pointer or with reduced motion', () => {
    const target = { addEventListener: vi.fn() } as unknown as HTMLElement

    vi.stubGlobal('matchMedia', (query: string) => ({ matches: !query.includes('pointer: fine') }))
    observeAcTilt(target, vi.fn())
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    observeAcTilt(target, vi.fn())

    expect(target.addEventListener).not.toHaveBeenCalled()
  })

  it('tilts toward the pointer and resets on leave', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('pointer: fine') }))
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const listeners: Record<string, (event: any) => void> = {}
    const target = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 100 }),
      addEventListener: (type: string, listener: (event: any) => void) => listeners[type] = listener,
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement
    const onTilt = vi.fn()
    const stop = observeAcTilt(target, onTilt, 4)

    listeners.pointermove({ clientX: 200, clientY: 0 })
    listeners.pointerleave({})

    expect(onTilt.mock.calls).toEqual([[4, 4], [0, 0]])
    stop()
    expect(target.removeEventListener).toHaveBeenCalledTimes(2)
  })
})
