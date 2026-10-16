// @vitest-environment happy-dom

import { defaultAcState } from '@yunlefun-home/air-conditioner-core'
import { describe, expect, it } from 'vitest'
import { defineAirConditionerElement, mountAirConditioner } from '../src'

describe('@air-conditioner/widget', () => {
  it('defines and mounts a native custom element', () => {
    defineAirConditionerElement({ tagName: 'test-air-conditioner-widget' })
    document.body.innerHTML = '<div id="target"></div>'

    const element = mountAirConditioner('#target', {
      tagName: 'test-air-conditioner-widget',
      storageKey: 'test:ac',
    })

    expect(element.localName).toBe('test-air-conditioner-widget')
    expect(element.shadowRoot?.textContent).toContain('Yun AC')
  })

  it('keeps the persisted mode when no mode attribute is given', () => {
    const storage = new Map<string, string>([['test:mode', JSON.stringify({ mode: 'hot', status: false, temperature: 22 })]])
    defineAirConditionerElement({
      tagName: 'test-air-conditioner-mode',
      storage: {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
      storageKey: 'test:mode',
    })
    const element = document.createElement('test-air-conditioner-mode')
    document.body.appendChild(element)

    const unit = element.shadowRoot?.querySelector<HTMLElement>('.acw-unit')
    expect(unit?.dataset.mode).toBe('hot')
    expect(element.shadowRoot?.querySelector('.acw-mode')?.textContent).toBe('hot')
    expect(element.shadowRoot?.querySelector('.acw-display strong')?.textContent).toBe('22')
  })

  it('patches the rendered DOM instead of rebuilding it', () => {
    defineAirConditionerElement({ tagName: 'test-air-conditioner-patch', storage: null })
    const element = document.createElement('test-air-conditioner-patch')
    document.body.appendChild(element)

    const root = element.shadowRoot!
    const power = root.querySelector<HTMLButtonElement>('[data-action="toggleStatus"]')!
    const unit = root.querySelector<HTMLElement>('.acw-unit')!
    power.click()
    expect(root.querySelector('[data-action="toggleStatus"]')).toBe(power)
    expect(unit.dataset.status).toBe('on')

    root.querySelector<HTMLButtonElement>('[data-action="increment"]')!.click()
    const temperature = root.querySelector<HTMLElement>('.acw-display strong')!
    expect(temperature.textContent).toBe(String(defaultAcState.temperature + 1))
    expect(temperature.dataset.dir).toBe('up')
  })

  it('dispatches ac-change and ac-notify events', async () => {
    defineAirConditionerElement({
      tagName: 'test-air-conditioner-contract',
      initialState: { temperature: 31 },
      storage: null,
    })
    const element = document.createElement('test-air-conditioner-contract')
    const changes: unknown[] = []
    const notifications: unknown[] = []
    element.addEventListener('ac-change', event => changes.push((event as CustomEvent).detail))
    element.addEventListener('ac-notify', event => notifications.push((event as CustomEvent).detail.notification))
    document.body.appendChild(element)

    const increment = element.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="increment"]')
    increment?.click()

    expect(changes).toHaveLength(1)
    expect(notifications).toHaveLength(1)
    expect(JSON.stringify(notifications[0])).toContain('已经是最大温度啦')
  })
})
