// @vitest-environment happy-dom

import type { AcChangeEvent } from '@yunlefun-home/air-conditioner-core'
import type { WidgetAcChangeEvent } from '../src'
import { createMemoryStorage, soundTimings } from '@yunlefun-home/air-conditioner-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountAirConditioner } from '../src'

function key(root: ShadowRoot, action: string) {
  return root.querySelector<HTMLButtonElement>(`[data-action="${action}"], [data-repeat="${action}"]`)!
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllTimers()
  vi.useRealTimers()
})

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
    const power = key(root, 'toggleStatus')
    const increment = key(root, 'increment')
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

  it('is idempotent when connectedCallback is invoked again while already connected', () => {
    vi.useFakeTimers()
    const element = mountAirConditioner(document.body, {
      tagName: 'test-ac-reconnect-idempotent',
      storage: null,
      enableAudio: false,
      initialState: { status: true, temperature: 24, temperatures: { cold: 24, hot: 28 } },
    }) as HTMLElement & { connectedCallback: () => void }
    const changes = vi.fn()
    element.addEventListener('ac-change', changes)

    try {
      key(element.shadowRoot!, 'cold').click()
      expect(vi.getTimerCount()).toBe(1)

      // Calling connectedCallback without an intervening disconnect must clean up the prior connection.
      element.connectedCallback()
      expect(vi.getTimerCount()).toBe(0)

      key(element.shadowRoot!, 'increment').click()
      expect(changes).toHaveBeenCalledTimes(2)
      expect(element.shadowRoot!.querySelector('.acw-temperature')?.textContent).toBe('25')
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
    }
  })

  it('disposes audio on removal and resumes active fan audio without replaying start sound', () => {
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
      // Reconnecting resumes the fan loop directly without replaying the startup sound.
      expect(callsFor(start)).toBe(1)
      expect(callsFor(work)).toBe(2)
      expect(work.volume).toBe(0)
      vi.advanceTimersByTime(soundTimings.loopCrossfadeMs)
      expect(work.volume).toBeGreaterThan(0)

      key(root, 'toggleStatus').click()
      element.remove()
      document.body.appendChild(element)
      vi.advanceTimersByTime(soundTimings.startDelayMs)
      expect(callsFor(start)).toBe(1)
      expect(callsFor(work)).toBe(2)

      element.remove()
      expect(vi.getTimerCount()).toBe(0)
    }
    finally {
      element?.remove()
    }
  })

  it('does not start audio on reconnect when the unit was silent on initial load or turned off while detached', () => {
    vi.useFakeTimers()
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    const element = mountAirConditioner(document.body, {
      tagName: 'test-ac-reconnect-audio-silent',
      storage: null,
      enableAudio: true,
      initialState: { status: true, sound: 'normal', fan: 'low' },
    })
    const root = element.shadowRoot!
    const work = root.querySelector<HTMLAudioElement>('[data-audio="work"]')!
    const start = root.querySelector<HTMLAudioElement>('[data-audio="start"]')!
    const callsFor = (audio: HTMLAudioElement) => play.mock.contexts.filter(context => context === audio).length

    try {
      // Initially powered on without user gesture: remains silent across DOM moves.
      expect(callsFor(start)).toBe(0)
      expect(callsFor(work)).toBe(0)
      element.remove()
      document.body.appendChild(element)
      vi.advanceTimersByTime(soundTimings.startDelayMs)
      expect(callsFor(start)).toBe(0)
      expect(callsFor(work)).toBe(0)

      // Power off then on via user interaction so audio is actively running.
      key(root, 'toggleStatus').click()
      key(root, 'toggleStatus').click()
      vi.advanceTimersByTime(soundTimings.startDelayMs)
      expect(callsFor(start)).toBe(1)
      expect(callsFor(work)).toBe(1)

      // Turn off via attribute while detached, then reconnect: must stay silent.
      element.remove()
      element.setAttribute('status', 'false')
      document.body.appendChild(element)
      vi.advanceTimersByTime(soundTimings.startDelayMs)
      expect(callsFor(start)).toBe(1)
      expect(callsFor(work)).toBe(1)
    }
    finally {
      element.remove()
    }
  })
})

describe('reentrant widget reconnection', () => {
  it('delivers a nested control action after the consumer moves the widget', () => {
    const a = document.body.appendChild(document.createElement('div'))
    const b = document.body.appendChild(document.createElement('div'))
    const widget = mountAirConditioner(a, {
      tagName: 'test-reentrant-nested-control',
      storage: null,
      enableAudio: false,
      initialState: { status: false, mode: 'cold', temperature: 24 },
    })
    const changes: AcChangeEvent[] = []
    widget.addEventListener('ac-change', (event) => {
      changes.push((event as CustomEvent<AcChangeEvent>).detail)
      if (changes.length === 1) {
        b.appendChild(widget)
        key(widget.shadowRoot!, 'increment').click()
      }
    })

    try {
      key(widget.shadowRoot!, 'toggleStatus').click()
      expect(changes.map(event => event.action.type)).toEqual(['toggleStatus', 'increment'])
      expect(changes[1].previousState).toMatchObject({ status: true, temperature: 24 })
      expect(changes[1].state).toMatchObject({ status: true, temperature: 25 })
      expect(key(widget.shadowRoot!, 'toggleStatus').getAttribute('aria-pressed')).toBe('true')
      expect(widget.shadowRoot!.querySelector('.acw-temperature')?.textContent).toBe('25')
      key(widget.shadowRoot!, 'decrement').click()
      expect(changes.map(event => event.action.type)).toEqual(['toggleStatus', 'increment', 'decrement'])
      expect(changes[2].state.temperature).toBe(24)
    }
    finally {
      a.remove()
      b.remove()
    }
  })

  it('allows removal during a change and later reconnects for subsequent controls', () => {
    const widget = mountAirConditioner(document.body, {
      tagName: 'test-reentrant-remove',
      storage: null,
      enableAudio: false,
      initialState: { status: false, temperature: 24 },
    })
    const changes: AcChangeEvent[] = []
    widget.addEventListener('ac-change', (event) => {
      changes.push((event as CustomEvent<AcChangeEvent>).detail)
      if (changes.length === 1)
        widget.remove()
    })

    try {
      key(widget.shadowRoot!, 'toggleStatus').click()
      expect(changes).toHaveLength(1)
      expect(widget.isConnected).toBe(false)
      key(widget.shadowRoot!, 'increment').click()
      expect(changes).toHaveLength(1)
      document.body.appendChild(widget)
      expect(key(widget.shadowRoot!, 'toggleStatus').getAttribute('aria-pressed')).toBe('true')
      key(widget.shadowRoot!, 'increment').click()
      expect(changes).toHaveLength(2)
      expect(changes[1].state.temperature).toBe(25)
    }
    finally {
      widget.remove()
    }
  })

  it('keeps change, notification and option callbacks single when a setting change moves the widget', () => {
    const a = document.body.appendChild(document.createElement('div'))
    const b = document.body.appendChild(document.createElement('div'))
    const notified: string[] = []
    const widget = mountAirConditioner(a, {
      tagName: 'test-reentrant-notification',
      storage: null,
      enableAudio: false,
      onNotify: (_, event) => notified.push((event as AcChangeEvent).action.type),
    })
    const changes: string[] = []
    const notifications: string[] = []
    widget.addEventListener('ac-change', (event) => {
      changes.push((event as CustomEvent<AcChangeEvent>).detail.action.type)
      if (changes.length === 1)
        b.appendChild(widget)
    })
    widget.addEventListener('ac-notify', (event) => {
      notifications.push((event as CustomEvent<{ event: AcChangeEvent }>).detail.event.action.type)
    })

    try {
      key(widget.shadowRoot!, 'cycleFan').click()
      expect(changes).toEqual(['cycleFan'])
      expect(notifications).toEqual(['cycleFan'])
      expect(notified).toEqual(['cycleFan'])
      key(widget.shadowRoot!, 'cycleSound').click()
      expect(changes).toEqual(['cycleFan', 'cycleSound'])
      expect(notifications).toEqual(['cycleFan', 'cycleSound'])
      expect(notified).toEqual(['cycleFan', 'cycleSound'])
    }
    finally {
      a.remove()
      b.remove()
    }
  })
})

describe('press-repeat lifecycle across reconnection', () => {
  for (const persisted of [false, true]) {
    for (const removeAt of [1, 2]) {
      it(`ends the old press after change ${removeAt} with persistence=${persisted}`, () => {
        vi.useFakeTimers()
        const writes: number[] = []
        const widget = mountAirConditioner(document.body, {
          tagName: `press-lifecycle-${persisted}-${removeAt}`,
          storage: persisted ? { getItem: () => null, setItem: (_key, value) => writes.push(JSON.parse(value).temperature) } : null,
          enableAudio: false,
          initialState: { status: true, temperature: 20 },
        })
        const increment = () => widget.shadowRoot!.querySelector<HTMLButtonElement>('[data-repeat="increment"]')!
        const temperature = () => widget.shadowRoot!.querySelector('.acw-temperature')?.textContent
        let changes = 0
        widget.addEventListener('ac-change', () => {
          changes++
          if (changes === removeAt)
            widget.remove()
        })
        try {
          increment().dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }))
          if (removeAt === 2)
            vi.advanceTimersByTime(500)
          expect(widget.isConnected).toBe(false)
          expect(changes).toBe(removeAt)
          expect(temperature()).toBe(removeAt === 1 ? '21' : '22')
          expect(vi.getTimerCount()).toBe(0)
          const detachedWrites = [...writes]
          vi.advanceTimersByTime(2000)
          expect(writes).toEqual(detachedWrites)
          document.body.appendChild(widget)
          expect(temperature()).toBe(removeAt === 1 ? '21' : '22')
          increment().click()
          expect(changes).toBe(removeAt + 1)
          increment().dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }))
          vi.advanceTimersByTime(500)
          increment().dispatchEvent(new PointerEvent('pointerup', { button: 0, bubbles: true }))
          expect(changes).toBe(removeAt + 3)
          expect(vi.getTimerCount()).toBe(0)
          expect(temperature()).toBe(removeAt === 1 ? '24' : '25')
          if (persisted)
            expect(writes.at(-1)).toBe(removeAt === 1 ? 24 : 25)
        }
        finally {
          widget.remove()
        }
      })
    }
  }

  for (const moveAt of [1, 2]) {
    it(`does not revive a press after reconnecting inside change ${moveAt}`, () => {
      vi.useFakeTimers()
      const destination = document.body.appendChild(document.createElement('div'))
      const widget = mountAirConditioner(document.body, {
        tagName: `press-reentrant-reconnect-${moveAt}`,
        storage: null,
        enableAudio: false,
        initialState: { status: true, temperature: 20 },
      })
      const increment = widget.shadowRoot!.querySelector<HTMLButtonElement>('[data-repeat="increment"]')!
      let changes = 0
      widget.addEventListener('ac-change', () => {
        if (++changes === moveAt) {
          widget.remove()
          destination.appendChild(widget)
        }
      })
      try {
        increment.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }))
        if (moveAt === 2)
          vi.advanceTimersByTime(500)
        expect(widget.parentElement).toBe(destination)
        expect(changes).toBe(moveAt)
        expect(vi.getTimerCount()).toBe(0)
        vi.advanceTimersByTime(2000)
        expect(changes).toBe(moveAt)
        expect(widget.shadowRoot!.querySelector('.acw-temperature')?.textContent).toBe(moveAt === 1 ? '21' : '22')
        increment.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }))
        vi.advanceTimersByTime(500)
        increment.dispatchEvent(new PointerEvent('pointerup', { button: 0, bubbles: true }))
        expect(changes).toBe(moveAt + 2)
        expect(vi.getTimerCount()).toBe(0)
      }
      finally {
        widget.remove()
        destination.remove()
      }
    })
  }
})
