// @vitest-environment happy-dom

import type { WidgetAcChangeEvent } from '../src'
import { createMemoryStorage, soundTimings } from '@yunlefun-home/air-conditioner-core'
import { describe, expect, it, vi } from 'vitest'
import { mountAirConditioner } from '../src'

function key(root: ShadowRoot, action: string) {
  return root.querySelector<HTMLButtonElement>(`[data-action="${action}"], [data-repeat="${action}"]`)!
}

describe('widget DOM reconnection', () => {
  it.each(['memory only', 'explicit defaults with storage'] as const)('retains the working state after a native DOM move (%s)', (kind) => {
    const a = document.body.appendChild(document.createElement('div'))
    const b = document.body.appendChild(document.createElement('div'))
    const element = mountAirConditioner(a, {
      tagName: kind === 'memory only' ? 'test-ac-reconnect-memory' : 'test-ac-reconnect-storage',
      storage: kind === 'memory only' ? null : createMemoryStorage(),
      enableAudio: false,
      initialState: { status: false, mode: 'cold', temperature: 24 },
    })
    const root = element.shadowRoot!
    const power = root.querySelector<HTMLButtonElement>('[data-action="toggleStatus"]')!
    const increment = root.querySelector<HTMLButtonElement>('[data-repeat="increment"]')!
    const changes: WidgetAcChangeEvent[] = []
    element.addEventListener('ac-change', event => changes.push((event as CustomEvent<WidgetAcChangeEvent>).detail))

    try {
      expect(power.getAttribute('aria-pressed')).toBe('false')
      expect(root.querySelector('.acw-temperature')?.textContent).toBe('24')
      power.click()
      increment.click()
      expect(changes).toHaveLength(2)
      expect(changes[1].state).toMatchObject({ status: true, mode: 'cold', temperature: 25 })
      expect(power.getAttribute('aria-pressed')).toBe('true')
      expect(root.querySelector('.acw-temperature')?.textContent).toBe('25')

      b.appendChild(element)
      expect(b.firstElementChild).toBe(element)
      expect(element.shadowRoot).toBe(root)
      expect(root.querySelector('[data-action="toggleStatus"]')).toBe(power)
      expect(power.getAttribute('aria-pressed')).toBe('true')
      expect(root.querySelector('.acw-temperature')?.textContent).toBe('25')
      expect(changes).toHaveLength(2)

      element.remove()
      a.appendChild(element)
      expect(power.getAttribute('aria-pressed')).toBe('true')
      expect(root.querySelector('.acw-temperature')?.textContent).toBe('25')
      increment.click()
      expect(changes).toHaveLength(3)
      expect(changes[2].previousState.temperature).toBe(25)
      expect(changes[2].state.temperature).toBe(26)
    }
    finally {
      a.remove()
      b.remove()
    }
  })

  it('retains the whole model, including both mode temperatures, across removal and reinsertion', () => {
    const element = mountAirConditioner(document.body, {
      tagName: 'test-ac-reconnect-whole-model',
      storage: null,
      enableAudio: false,
      initialState: { status: false, mode: 'cold', temperature: 24, temperatures: { cold: 24, hot: 28 } },
    })
    const root = element.shadowRoot!
    const changes: WidgetAcChangeEvent[] = []
    element.addEventListener('ac-change', event => changes.push((event as CustomEvent<WidgetAcChangeEvent>).detail))

    try {
      for (const action of ['toggleStatus', 'increment', 'hot', 'decrement', 'cycleSound', 'cycleSound', 'cycleFan', 'cycleFan', 'toggleSwing'])
        key(root, action).click()
      const expected = {
        status: true,
        mode: 'hot',
        temperature: 27,
        temperatures: { cold: 25, hot: 27 },
        sound: 'mute',
        fan: 'medium',
        swing: true,
      }
      expect(changes.at(-1)?.state).toEqual(expected)
      element.remove()
      document.body.appendChild(element)
      expect(root.querySelector<HTMLElement>('.acw-unit')?.dataset).toMatchObject({ status: 'on', mode: 'hot', fan: 'medium', swing: 'on' })
      expect(root.querySelector('.acw-temperature')?.textContent).toBe('27')
      expect(key(root, 'cycleSound').dataset.sound).toBe('mute')
      key(root, 'cold').click()
      expect(changes.at(-1)?.state).toEqual({ ...expected, mode: 'cold', temperature: 25 })
      key(root, 'hot').click()
      expect(changes.at(-1)?.state).toEqual(expected)
    }
    finally {
      element.remove()
    }
  })

  it('keeps stores per element while new elements still apply explicit initialization', () => {
    const storage = createMemoryStorage()
    const read = vi.spyOn(storage, 'getItem')
    const options = {
      tagName: 'test-ac-reconnect-independent',
      storage,
      enableAudio: false,
      initialState: { status: false, temperature: 24, temperatures: { cold: 24, hot: 24 } },
    }
    const first = mountAirConditioner(document.body, options)
    const second = mountAirConditioner(document.body, { tagName: options.tagName })
    const firstRoot = first.shadowRoot!
    const secondRoot = second.shadowRoot!
    let fresh: HTMLElement | undefined

    try {
      key(firstRoot, 'toggleStatus').click()
      key(firstRoot, 'increment').click()
      key(secondRoot, 'hot').click()
      key(secondRoot, 'decrement').click()
      expect(read).toHaveBeenCalledTimes(2)
      first.remove()
      document.body.appendChild(first)
      expect(read).toHaveBeenCalledTimes(2)
      expect(firstRoot.querySelector<HTMLElement>('.acw-unit')?.dataset).toMatchObject({ mode: 'cold', status: 'on' })
      expect(firstRoot.querySelector('.acw-temperature')?.textContent).toBe('25')
      expect(secondRoot.querySelector<HTMLElement>('.acw-unit')?.dataset.mode).toBe('hot')
      expect(secondRoot.querySelector('.acw-temperature')?.textContent).toBe('23')
      fresh = mountAirConditioner(document.body, { tagName: options.tagName })
      expect(read).toHaveBeenCalledTimes(3)
      expect(key(fresh.shadowRoot!, 'toggleStatus').getAttribute('aria-pressed')).toBe('false')
      expect(fresh.shadowRoot?.querySelector('.acw-temperature')?.textContent).toBe('24')
    }
    finally {
      first.remove()
      second.remove()
      fresh?.remove()
    }
  })

  it('still restores persistence for a new element without explicit defaults', () => {
    const storage = createMemoryStorage()
    const options = { tagName: 'test-ac-reconnect-persisted', storage, storageKey: 'reconnect:persisted', enableAudio: false }
    const first = mountAirConditioner(document.body, options)
    let fresh: HTMLElement | undefined

    try {
      key(first.shadowRoot!, 'hot').click()
      key(first.shadowRoot!, 'decrement').click()
      first.remove()
      fresh = mountAirConditioner(document.body, { tagName: options.tagName })
      expect(fresh.shadowRoot?.querySelector<HTMLElement>('.acw-unit')?.dataset).toMatchObject({ status: 'on', mode: 'hot' })
      expect(fresh.shadowRoot?.querySelector('.acw-temperature')?.textContent).toBe('25')
    }
    finally {
      first.remove()
      fresh?.remove()
    }
  })

  it('applies public attribute changes while disconnected and renders them on reconnect', () => {
    const element = mountAirConditioner(document.body, {
      tagName: 'test-ac-reconnect-attributes',
      storage: null,
      enableAudio: false,
      initialState: { temperature: 24 },
    })
    const root = element.shadowRoot!
    const changes = vi.fn()
    element.addEventListener('ac-change', changes)

    try {
      element.remove()
      for (const [name, value] of Object.entries({ status: 'true', mode: 'hot', temperature: '29', sound: 'mute', fan: 'high', swing: 'true' }))
        element.setAttribute(name, value)
      expect(changes).not.toHaveBeenCalled()
      document.body.appendChild(element)
      expect(root.querySelector<HTMLElement>('.acw-unit')?.dataset).toMatchObject({ status: 'on', mode: 'hot', fan: 'high', swing: 'on' })
      expect(root.querySelector('.acw-temperature')?.textContent).toBe('29')
      expect(key(root, 'cycleSound').dataset.sound).toBe('mute')
      key(root, 'toggleStatus').click()
      expect(changes).toHaveBeenCalledTimes(1)
      expect(key(root, 'toggleStatus').getAttribute('aria-pressed')).toBe('false')
    }
    finally {
      element.remove()
    }
  })

  it('resubscribes once and releases press-repeat timers and bindings on every disconnect', () => {
    vi.useFakeTimers()
    const a = document.body.appendChild(document.createElement('div'))
    const b = document.body.appendChild(document.createElement('div'))
    const element = mountAirConditioner(a, {
      tagName: 'test-ac-reconnect-press',
      storage: null,
      enableAudio: false,
      initialState: { status: true, temperature: 20 },
    })
    const root = element.shadowRoot!
    const increment = key(root, 'increment')
    const changes = vi.fn()
    element.addEventListener('ac-change', changes)
    const pointer = (type: string) => increment.dispatchEvent(new PointerEvent(type, { button: 0, bubbles: true }))

    try {
      for (let i = 0; i < 3; i++) {
        const target = i % 2 ? a : b
        target.appendChild(element)
        increment.click()
      }
      expect(changes).toHaveBeenCalledTimes(3)
      expect(root.querySelector('.acw-temperature')?.textContent).toBe('23')
      pointer('pointerdown')
      expect(changes).toHaveBeenCalledTimes(4)
      element.remove()
      vi.advanceTimersByTime(1000)
      increment.click()
      pointer('pointerdown')
      expect(changes).toHaveBeenCalledTimes(4)
      a.appendChild(element)
      increment.click()
      pointer('pointerdown')
      vi.advanceTimersByTime(500)
      vi.advanceTimersByTime(170)
      pointer('pointerup')
      vi.advanceTimersByTime(2000)
      expect(changes).toHaveBeenCalledTimes(8)
      expect(root.querySelector('.acw-temperature')?.textContent).toBe('28')
    }
    finally {
      a.remove()
      b.remove()
      vi.clearAllTimers()
      vi.useRealTimers()
    }
  })

  it('delivers each change and notification once after repeated reconnections', () => {
    const onNotify = vi.fn()
    const element = mountAirConditioner(document.body, {
      tagName: 'test-ac-reconnect-events',
      storage: null,
      enableAudio: false,
      onNotify,
    })
    const root = element.shadowRoot!
    const change = vi.fn()
    const notify = vi.fn()
    element.addEventListener('ac-change', change)
    element.addEventListener('ac-notify', notify)

    try {
      for (let i = 0; i < 3; i++) {
        element.remove()
        document.body.appendChild(element)
        key(root, 'cycleFan').click()
      }
      expect(change).toHaveBeenCalledTimes(3)
      expect(notify).toHaveBeenCalledTimes(3)
      expect(onNotify).toHaveBeenCalledTimes(3)
      expect(key(root, 'cycleFan').dataset.fan).toBe('high')
    }
    finally {
      element.remove()
    }
  })

  it('disconnects and recreates the scale observer without accumulating active observers', () => {
    const active = new Set<object>()
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      observe() {
        active.add(this)
      }

      disconnect() {
        active.delete(this)
        disconnect()
      }
    })
    let element: HTMLElement | undefined

    try {
      element = mountAirConditioner(document.body, { tagName: 'test-ac-reconnect-observer', storage: null, enableAudio: false })
      expect(active.size).toBe(1)
      for (let i = 0; i < 3; i++) {
        element.remove()
        expect(active.size).toBe(0)
        document.body.appendChild(element)
        expect(active.size).toBe(1)
      }
      element.remove()
      expect(active.size).toBe(0)
      expect(disconnect).toHaveBeenCalledTimes(4)
    }
    finally {
      element?.remove()
      vi.unstubAllGlobals()
    }
  })

  it('disposes audio on removal and resumes a powered-on unit once on reconnect', () => {
    vi.useFakeTimers()
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    let element: HTMLElement | undefined

    try {
      element = mountAirConditioner(document.body, {
        tagName: 'test-ac-reconnect-audio',
        storage: null,
        enableAudio: true,
        initialState: { status: false, sound: 'sleep', fan: 'low' },
      })
      const root = element.shadowRoot!
      const work = root.querySelector<HTMLAudioElement>('[data-audio="work"]')!
      const start = root.querySelector<HTMLAudioElement>('[data-audio="start"]')!
      const callsFor = (audio: HTMLAudioElement) => play.mock.contexts.filter(context => context === audio).length
      key(root, 'toggleStatus').click()
      vi.advanceTimersByTime(soundTimings.startDelayMs)
      expect(callsFor(start)).toBe(1)
      expect(callsFor(work)).toBe(1)
      element.remove()
      expect(pause.mock.calls.length).toBeGreaterThan(0)
      vi.advanceTimersByTime(10000)
      expect(callsFor(work)).toBe(1)
      document.body.appendChild(element)
      expect(callsFor(start)).toBe(2)
      vi.advanceTimersByTime(soundTimings.startDelayMs)
      expect(callsFor(work)).toBe(2)
      expect(work.volume).toBe(0)
      vi.advanceTimersByTime(soundTimings.loopCrossfadeMs)
      expect(work.volume).toBeGreaterThan(0)
      key(root, 'toggleStatus').click()
      element.remove()
      document.body.appendChild(element)
      vi.advanceTimersByTime(soundTimings.startDelayMs)
      expect(callsFor(start)).toBe(2)
      expect(callsFor(work)).toBe(2)
      element.remove()
      expect(vi.getTimerCount()).toBe(0)
    }
    finally {
      element?.remove()
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
      vi.clearAllTimers()
      vi.useRealTimers()
    }
  })
})
