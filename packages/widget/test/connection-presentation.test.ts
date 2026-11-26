// @vitest-environment happy-dom
import type { DefineAirConditionerElementOptions, WidgetAcChangeEvent } from '../src'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountAirConditioner } from '../src'

let sequence = 0
const widgets: HTMLElement[] = []
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  widgets.splice(0).forEach(widget => widget.remove())
  vi.clearAllTimers()
  vi.useRealTimers()
})

function mount(options: DefineAirConditionerElementOptions = {}) {
  const widget = mountAirConditioner(document.body, {
    tagName: `test-connection-presentation-${++sequence}`,
    storage: null,
    enableAudio: false,
    initialState: { status: true, temperature: 24, temperatures: { cold: 24, hot: 28 } },
    ...options,
  })
  widgets.push(widget)
  const root = widget.shadowRoot!
  return {
    widget,
    root,
    press: (action: string) => root.querySelector<HTMLButtonElement>(`[data-action="${action}"], [data-repeat="${action}"]`)!.click(),
    note: () => root.querySelector<HTMLElement>('.acw-note'),
    alert: () => root.querySelector('.acw-lcd')!.hasAttribute('data-alert'),
    announcement: () => root.querySelector('.acw-sr-only')!.textContent,
  }
}

describe('connection-owned notification presentation', () => {
  it('keeps the normal note stay and leaving stages, with no remaining timeout', () => {
    const view = mount()
    view.press('cold')
    const note = view.note()!
    expect(note.textContent).toContain('制冷调到 26°C 以上更省电')
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(3599)
    expect(note.hasAttribute('data-leaving')).toBe(false)
    vi.advanceTimersByTime(1)
    expect(note.hasAttribute('data-leaving')).toBe(true)
    expect(view.note()).toBe(note)
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(459)
    expect(view.note()).toBe(note)
    vi.advanceTimersByTime(1)
    expect(view.note()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps normal limit feedback and timer-free setting announcements', () => {
    const view = mount({ initialState: { status: true, temperature: 31 } })
    view.press('increment')
    expect(view.alert()).toBe(true)
    expect(view.announcement()).toBe('已经是最大温度啦！')
    vi.advanceTimersByTime(399)
    expect(view.alert()).toBe(true)
    vi.advanceTimersByTime(1)
    expect(view.alert()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    view.press('cycleFan')
    expect(view.announcement()).toBe('风速：低风')
    expect(view.note()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each([100, 3600, 3800])('terminates a note removed at %ims in either stage', (at) => {
    const view = mount()
    view.press('cold')
    const old = view.note()!
    vi.advanceTimersByTime(at)
    view.widget.remove()
    expect(view.note()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    const leaving = old.hasAttribute('data-leaving')
    vi.advanceTimersByTime(5000)
    expect(old.hasAttribute('data-leaving')).toBe(leaving)
    expect(view.note()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancels a replaced note even while the old note is leaving', () => {
    const view = mount()
    view.press('cold')
    const old = view.note()!
    vi.advanceTimersByTime(3600)
    expect(old.hasAttribute('data-leaving')).toBe(true)
    view.press('hot')
    const next = view.note()!
    expect(next).not.toBe(old)
    expect(next.dataset.mode).toBe('hot')
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(460)
    expect(view.note()).toBe(next)
    expect(next.hasAttribute('data-leaving')).toBe(false)
    vi.advanceTimersByTime(3140)
    expect(next.hasAttribute('data-leaving')).toBe(true)
    vi.advanceTimersByTime(460)
    expect(view.note()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('restarts repeated limit feedback for its full duration', () => {
    const view = mount({ initialState: { status: true, temperature: 31 } })
    view.press('increment')
    vi.advanceTimersByTime(300)
    view.press('increment')
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(100)
    expect(view.alert()).toBe(true)
    vi.advanceTimersByTime(300)
    expect(view.alert()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each([100, 3700])('isolates a new connection note from the old expiry at %ims', (at) => {
    const view = mount()
    view.press('cold')
    const old = view.note()!
    vi.advanceTimersByTime(at)
    view.widget.remove()
    expect(vi.getTimerCount()).toBe(0)
    document.body.appendChild(view.widget)
    expect(view.note()).toBeNull()
    // The same valid tip can be presented in the new connection.
    view.press('cold')
    const next = view.note()!
    expect(next).not.toBe(old)
    expect(next.dataset.mode).toBe('cold')
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(3599)
    expect(view.note()).toBe(next)
    expect(next.hasAttribute('data-leaving')).toBe(false)
    vi.advanceTimersByTime(1)
    expect(next.hasAttribute('data-leaving')).toBe(true)
    vi.advanceTimersByTime(460)
    expect(view.note()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not let an old connection limit timeout clear a new alert', () => {
    const view = mount({ initialState: { status: true, temperature: 31 } })
    view.press('increment')
    vi.advanceTimersByTime(300)
    view.widget.remove()
    expect(view.alert()).toBe(false)
    expect(view.announcement()).toBe('')
    document.body.appendChild(view.widget)
    view.press('increment')
    vi.advanceTimersByTime(100)
    expect(view.alert()).toBe(true)
    vi.advanceTimersByTime(299)
    expect(view.alert()).toBe(true)
    vi.advanceTimersByTime(1)
    expect(view.alert()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  for (const callback of ['change', 'notify', 'options'] as const) {
    for (const reconnect of [false, true]) {
      it.each(['cold', 'increment', 'cycleFan'])(`preserves each logical %s notification when ${callback} synchronously removes${reconnect ? ' and reconnects' : ''}`, (action) => {
        const observed: string[] = []
        const notifications: WidgetAcChangeEvent[] = []
        let widget: HTMLElement
        const remove = () => {
          widget.remove()
          if (reconnect)
            document.body.appendChild(widget)
        }
        const view = mount({
          initialState: { status: true, temperature: action === 'increment' ? 31 : 24 },
          onNotify: (_notification, event) => {
            observed.push('options')
            notifications.push(event)
            if (callback === 'options')
              remove()
          },
        })
        widget = view.widget
        widget.addEventListener('ac-change', () => {
          observed.push('change')
          if (callback === 'change')
            remove()
        })
        widget.addEventListener('ac-notify', () => {
          observed.push('notify')
          if (callback === 'notify')
            remove()
        })
        view.press(action)
        expect(observed).toEqual(['change', 'notify', 'options'])
        expect(notifications).toHaveLength(1)
        expect(notifications[0].action).toEqual(action === 'cold' ? { type: 'mode', mode: 'cold', powerOn: true } : { type: action })
        expect(widget.isConnected).toBe(reconnect)
        expect(view.note()).toBeNull()
        expect(view.alert()).toBe(false)
        expect(view.announcement()).toBe('')
        expect(vi.getTimerCount()).toBe(0)
        vi.advanceTimersByTime(5000)
        expect(view.note()).toBeNull()
        expect(vi.getTimerCount()).toBe(0)
      })
    }

    it(`retains a nested new-connection note during ${callback} without the old notification overwriting it`, () => {
      const changes: string[] = []
      const notifications: string[] = []
      const options: string[] = []
      const writes: string[] = []
      let nested = false
      let view: ReturnType<typeof mount>
      const moveAndNotify = () => {
        if (nested)
          return
        nested = true
        view.widget.remove()
        document.body.appendChild(view.widget)
        view.press('hot')
      }
      view = mount({
        storage: { getItem: () => null, setItem: (_key, value) => writes.push(JSON.parse(value).mode) },
        onNotify: (_notification, event) => {
          options.push(event.state.mode)
          if (callback === 'options')
            moveAndNotify()
        },
      })
      view.widget.addEventListener('ac-change', (event) => {
        changes.push((event as CustomEvent<WidgetAcChangeEvent>).detail.state.mode)
        if (callback === 'change')
          moveAndNotify()
      })
      view.widget.addEventListener('ac-notify', (event) => {
        notifications.push((event as CustomEvent<{ event: WidgetAcChangeEvent }>).detail.event.state.mode)
        if (callback === 'notify')
          moveAndNotify()
      })
      view.press('cold')
      expect(changes).toEqual(['cold', 'hot'])
      expect(notifications).toEqual(callback === 'change' ? ['hot', 'cold'] : ['cold', 'hot'])
      expect(options).toEqual(callback === 'options' ? ['cold', 'hot'] : ['hot', 'cold'])
      expect(writes).toEqual(['cold', 'hot'])
      expect(view.root.querySelector<HTMLElement>('.acw-unit')!.dataset.mode).toBe('hot')
      const note = view.note()!
      expect(note.dataset.mode).toBe('hot')
      expect(note.textContent).toContain('制热调到 20°C 以下更省电')
      expect(vi.getTimerCount()).toBe(1)
      vi.advanceTimersByTime(3599)
      expect(view.note()).toBe(note)
      expect(note.hasAttribute('data-leaving')).toBe(false)
      vi.advanceTimersByTime(1)
      expect(note.hasAttribute('data-leaving')).toBe(true)
      vi.advanceTimersByTime(460)
      expect(view.note()).toBeNull()
      expect(vi.getTimerCount()).toBe(0)
      view.press('cycleFan')
      expect(view.announcement()).toBe('风速：低风')
      expect(writes).toEqual(['cold', 'hot', 'hot'])
      expect(vi.getTimerCount()).toBe(0)
    })
  }

  it('does not replay an outer maximum warning over a nested new-connection minimum warning', () => {
    const notifications: string[] = []
    const options: string[] = []
    const view = mount({
      initialState: { status: true, temperature: 31 },
      onNotify: notification => options.push(notification.message),
    })
    view.widget.addEventListener('ac-notify', event => notifications.push((event as CustomEvent).detail.notification.message))
    let moved = false
    view.widget.addEventListener('ac-change', () => {
      if (moved)
        return
      moved = true
      view.widget.remove()
      document.body.appendChild(view.widget)
      view.widget.setAttribute('temperature', '16')
      view.press('decrement')
    }, { once: true })
    view.press('increment')
    expect(notifications).toEqual(['已经是最小温度啦！', '已经是最大温度啦！'])
    expect(options).toEqual(notifications)
    expect(view.announcement()).toBe('已经是最小温度啦！')
    expect(view.alert()).toBe(true)
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(400)
    expect(view.alert()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps detached attribute updates logical and presents only later connected actions', () => {
    const onNotify = vi.fn()
    const view = mount({ onNotify })
    view.press('cold')
    view.widget.remove()
    view.widget.setAttribute('temperature', '23')
    expect(vi.getTimerCount()).toBe(0)
    expect(view.note()).toBeNull()
    document.body.appendChild(view.widget)
    expect(view.root.querySelector('.acw-temperature')!.textContent).toBe('23')
    expect(onNotify).toHaveBeenCalledTimes(1)
    view.press('cold')
    expect(onNotify).toHaveBeenCalledTimes(2)
    expect(view.note()).not.toBeNull()
    expect(vi.getTimerCount()).toBe(1)
  })
})
