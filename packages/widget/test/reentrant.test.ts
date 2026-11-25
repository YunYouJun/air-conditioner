// @vitest-environment happy-dom

import type { AcChangeEvent } from '@yunlefun-home/air-conditioner-core'
import { expect, it } from 'vitest'
import { mountAirConditioner } from '../src'

function button(widget: HTMLElement, action: string) {
  return widget.shadowRoot!.querySelector<HTMLButtonElement>(`[data-action="${action}"], [data-repeat="${action}"]`)!
}

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
      button(widget, 'increment').click()
    }
  })

  try {
    button(widget, 'toggleStatus').click()
    expect(changes.map(event => event.action.type)).toEqual(['toggleStatus', 'increment'])
    expect(changes[1].previousState).toMatchObject({ status: true, temperature: 24 })
    expect(changes[1].state).toMatchObject({ status: true, temperature: 25 })
    expect(button(widget, 'toggleStatus').getAttribute('aria-pressed')).toBe('true')
    expect(widget.shadowRoot!.querySelector('.acw-temperature')?.textContent).toBe('25')
    button(widget, 'decrement').click()
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
    button(widget, 'toggleStatus').click()
    expect(changes).toHaveLength(1)
    expect(widget.isConnected).toBe(false)
    button(widget, 'increment').click()
    expect(changes).toHaveLength(1)
    document.body.appendChild(widget)
    expect(button(widget, 'toggleStatus').getAttribute('aria-pressed')).toBe('true')
    button(widget, 'increment').click()
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
    button(widget, 'cycleFan').click()
    expect(changes).toEqual(['cycleFan'])
    expect(notifications).toEqual(['cycleFan'])
    expect(notified).toEqual(['cycleFan'])
    button(widget, 'cycleSound').click()
    expect(changes).toEqual(['cycleFan', 'cycleSound'])
    expect(notifications).toEqual(['cycleFan', 'cycleSound'])
    expect(notified).toEqual(['cycleFan', 'cycleSound'])
  }
  finally {
    a.remove()
    b.remove()
  }
})
