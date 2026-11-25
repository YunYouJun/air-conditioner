// @vitest-environment happy-dom
import { expect, it, vi } from 'vitest'
import { mountAirConditioner } from '../src'

for (const reentrant of [false, true]) {
  it(`releases a press on removal (reentrant=${reentrant})`, () => {
    vi.useFakeTimers()
    const writes: unknown[] = []
    const widget = mountAirConditioner(document.body, {
      tagName: `independent-press-control-${reentrant}`,
      storage: { getItem: () => null, setItem: (_key, value) => writes.push(JSON.parse(value)) },
      enableAudio: false,
      initialState: { status: true, temperature: 20 },
    })
    const root = widget.shadowRoot!
    const add = root.querySelector<HTMLButtonElement>('[data-repeat="increment"]')!
    const temp = () => root.querySelector('.acw-temperature')?.textContent
    const sample = () => ({ connected: widget.isConnected, displayedTemperature: temp(), timers: vi.getTimerCount(), latestPersisted: writes.at(-1), writes: writes.length })
    let changes = 0
    widget.addEventListener('ac-change', () => {
      changes++
      if (reentrant && changes === 1)
        widget.remove()
    })
    const observations: Record<string, unknown> = { before: sample() }
    try {
      add.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }))
      observations.afterPointerDown = sample()
      if (!reentrant)
        widget.remove()
      observations.afterRemoval = sample()
      vi.advanceTimersByTime(500)
      observations.after500ms = sample()
      document.body.appendChild(widget)
      observations.afterNormalAppend = sample()
      console.warn('INDEPENDENT_PRESS_CONTROL', JSON.stringify({ reentrant, changes, observations }))
      expect(temp()).toBe('21')
      expect((observations.afterRemoval as { timers: number }).timers).toBe(0)
      expect((observations.after500ms as { timers: number }).timers).toBe(0)
    }
    finally {
      widget.remove()
      vi.clearAllTimers()
      vi.useRealTimers()
    }
  })
}
