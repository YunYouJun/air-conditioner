// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest'
import { mountAirConditioner } from '../src'

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})
for (const removal of ['ordinary', 'reentrant']) {
  for (const action of ['cycleFan', 'increment', 'cold']) {
    it(`releases presentation timers on ${removal} removal after ${action.toLowerCase()}`, () => {
      vi.useFakeTimers()
      const widget = mountAirConditioner(document.body, { tagName: `review1296-resource-${removal}-${action.toLowerCase()}`, storage: null, enableAudio: false, initialState: { status: true, temperature: action === 'cold' ? 24 : 31 } })
      const root = widget.shadowRoot!
      if (removal === 'reentrant')
        widget.addEventListener('ac-change', () => widget.remove(), { once: true })
      const button = root.querySelector<HTMLButtonElement>(`[data-action="${action}"], [data-repeat="${action}"]`)!
      try {
        expect(vi.getTimerCount()).toBe(0)
        button.click()
        widget.remove()
        const pending = vi.getTimerCount()
        const presentation = () => ({ pending: vi.getTimerCount(), connected: widget.isConnected, notes: root.querySelectorAll('.acw-note').length, alert: root.querySelector('.acw-lcd')?.hasAttribute('data-alert') })
        const before = presentation()
        vi.advanceTimersByTime(401)
        const after401 = presentation()
        vi.advanceTimersByTime(5000)
        console.warn('REVIEW1296_RESOURCES', JSON.stringify({ removal, action, before, after401, after5401: presentation() }))
        expect(pending).toBe(0)
      }
      finally {
        widget.remove()
      }
    })
  }
}
for (const moveAt of [1, 2]) {
  it(`keeps a new nested press alive after reconnecting inside change ${moveAt}`, () => {
    vi.useFakeTimers()
    const destination = document.body.appendChild(document.createElement('div'))
    const writes: number[] = []
    const widget = mountAirConditioner(document.body, { tagName: `review1296-nested-reconnect-${moveAt}`, storage: { getItem: () => null, setItem: (_key, value) => writes.push(JSON.parse(value).temperature) }, enableAudio: false, initialState: { status: true, temperature: 20 } })
    const button = widget.shadowRoot!.querySelector<HTMLButtonElement>('[data-repeat="increment"]')!
    const pointer = (type: string) => button.dispatchEvent(new PointerEvent(type, { button: 0, bubbles: true }))
    let calls = 0
    widget.addEventListener('ac-change', () => {
      if (++calls === moveAt) {
        widget.remove()
        destination.appendChild(widget)
        pointer('pointerdown')
      }
    })
    try {
      pointer('pointerdown')
      if (moveAt === 2)
        vi.advanceTimersByTime(500)
      expect(calls).toBe(moveAt + 1)
      expect(vi.getTimerCount()).toBe(1)
      vi.advanceTimersByTime(499)
      expect(calls).toBe(moveAt + 1)
      vi.advanceTimersByTime(1)
      expect(calls).toBe(moveAt + 2)
      expect(writes).toEqual(moveAt === 1 ? [21, 22, 23] : [21, 22, 23, 24])
      pointer('pointerup')
      expect(vi.getTimerCount()).toBe(0)
    }
    finally {
      widget.remove()
      destination.remove()
    }
  })
}
