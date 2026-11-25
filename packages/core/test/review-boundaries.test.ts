// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest'
import { bindAcPressRepeat, createAirConditionerStore } from '../src'

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})
const pointer = (el: HTMLElement, type: string, button = 0) => el.dispatchEvent(new PointerEvent(type, { button, bubbles: true }))
for (const nestedAt of [1, 2]) {
  it(`retains exactly one nested press timer with a real value getter at fire ${nestedAt}`, () => {
    vi.useFakeTimers()
    const button = document.createElement('button')
    let temperature = 20
    let calls = 0
    const cleanup = bindAcPressRepeat(button, () => {
      temperature++
      calls++
      if (calls === nestedAt)
        pointer(button, 'pointerdown')
    }, { value: () => temperature, delay: 100, interval: 80, minInterval: 20 })
    try {
      pointer(button, 'pointerdown')
      if (nestedAt === 2)
        vi.advanceTimersByTime(100)
      expect(calls).toBe(nestedAt + 1)
      expect(vi.getTimerCount()).toBe(1)
      vi.advanceTimersByTime(99)
      expect(calls).toBe(nestedAt + 1)
      vi.advanceTimersByTime(1)
      expect(calls).toBe(nestedAt + 2)
      pointer(button, 'pointercancel')
      expect(vi.getTimerCount()).toBe(0)
      pointer(button, 'pointerdown', 1)
      expect(calls).toBe(nestedAt + 2)
      button.click()
      expect(calls).toBe(nestedAt + 3)
    }
    finally {
      cleanup()
    }
  })
}
it('preserves dispatch return, persistence and onNotify when a callback removes and re-adds itself', () => {
  const writes: unknown[] = []
  const observed: string[] = []
  const notifications: unknown[] = []
  const store = createAirConditionerStore({ initialState: { temperature: 24 }, storage: { getItem: () => null, setItem: (_key, value) => writes.push(JSON.parse(value)) }, onNotify: (notification, event) => notifications.push({ notification, event }) })
  let stop: () => void
  const listener = (event: any) => {
    observed.push(event.action.type)
    stop()
    stop = store.subscribe(listener)
  }
  stop = store.subscribe(listener)
  const outer = store.dispatch({ type: 'cycleFan' })
  expect(observed).toEqual(['cycleFan'])
  expect(writes).toEqual([outer.state])
  expect(notifications).toEqual([{ notification: outer.notification, event: outer }])
  const next = store.dispatch({ type: 'increment' })
  expect(observed).toEqual(['cycleFan', 'increment'])
  expect(writes).toEqual([outer.state, next.state])
  expect(store.getState()).toEqual(next.state)
  stop()
})
