// @vitest-environment happy-dom
import { expect, it, vi } from 'vitest'
import { mountAirConditioner } from '../src'

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
        vi.clearAllTimers()
        vi.useRealTimers()
      }
    })
  }
}

for (const moveAt of [1, 2]) {
  it(`does not revive a press after reconnecting inside change ${moveAt}`, () => {
    vi.useFakeTimers()
    const destination = document.createElement('div')
    document.body.appendChild(destination)
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
      vi.clearAllTimers()
      vi.useRealTimers()
    }
  })
}
