// @vitest-environment happy-dom
import { expect, it, vi } from 'vitest'
import { mountAirConditioner } from '../src'

it('stops a press begun by the action which removes the widget', () => {
  vi.useFakeTimers()
  const widget = mountAirConditioner(document.body, {
    tagName: 'independent-remove-on-increment',
    storage: null,
    enableAudio: false,
    initialState: { status: true, temperature: 20 },
  })
  const increment = widget.shadowRoot!.querySelector<HTMLButtonElement>('[data-repeat="increment"]')!
  let changes = 0
  widget.addEventListener('ac-change', () => {
    changes++
    if (changes === 1)
      widget.remove()
  })
  try {
    increment.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }))
    expect(changes).toBe(1)
    expect(widget.isConnected).toBe(false)
    const pendingAfterDisconnect = vi.getTimerCount()
    vi.advanceTimersByTime(500)
    document.body.appendChild(widget)
    const reinsertedTemperature = widget.shadowRoot!.querySelector('.acw-temperature')?.textContent
    console.warn('INDEPENDENT_REENTRANT_PRESS', JSON.stringify({ pendingAfterDisconnect, reinsertedTemperature, changes }))
    expect(reinsertedTemperature).toBe('21')
    expect(pendingAfterDisconnect).toBe(0)
  }
  finally {
    widget.remove()
    vi.clearAllTimers()
    vi.useRealTimers()
  }
})
