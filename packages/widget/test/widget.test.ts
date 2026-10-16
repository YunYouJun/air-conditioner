// @vitest-environment happy-dom

import { acModeIcons, defaultAcState } from '@yunlefun-home/air-conditioner-core'
import { describe, expect, it } from 'vitest'
import { defineAirConditionerElement, mountAirConditioner } from '../src'

describe('@air-conditioner/widget', () => {
  it('defines and mounts a native custom element', () => {
    defineAirConditionerElement({ tagName: 'test-air-conditioner-widget', enableAudio: false })
    document.body.innerHTML = '<div id="target"></div>'

    const element = mountAirConditioner('#target', {
      tagName: 'test-air-conditioner-widget',
      storageKey: 'test:ac',
    })

    expect(element.localName).toBe('test-air-conditioner-widget')
    // 与 Vue 版一致：能效标签、数码管温度、Logo
    expect(element.shadowRoot?.querySelector('.acw-energy-label')).not.toBeNull()
    expect(element.shadowRoot?.querySelector('.acw-temperature.acw-digit')?.textContent).toBe(String(defaultAcState.temperature))
    expect(element.shadowRoot?.querySelector('.acw-logo img')?.getAttribute('src')).toBe('/yun-logo.svg')
    expect(document.getElementById('acw-digit-font')?.textContent).toContain('/assets/fonts/digital-7-mono.ttf')
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
    expect(element.shadowRoot?.querySelector('.acw-mode-icon')?.textContent).toBe(acModeIcons.hot)
    expect(element.shadowRoot?.querySelector('.acw-temperature')?.textContent).toBe('22')
  })

  it('restores the persisted power state unless a status attribute is set', () => {
    const storage = new Map<string, string>([['test:status', JSON.stringify({ mode: 'cold', status: true, temperature: 24 })]])
    defineAirConditionerElement({
      tagName: 'test-air-conditioner-status',
      enableAudio: false,
      storageKey: 'test:status',
      storage: {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
    })
    const restored = document.createElement('test-air-conditioner-status')
    const forcedOff = document.createElement('test-air-conditioner-status')
    forcedOff.setAttribute('status', 'false')
    document.body.append(restored, forcedOff)

    expect(restored.shadowRoot?.querySelector<HTMLElement>('.acw-unit')?.dataset.status).toBe('on')
    expect(forcedOff.shadowRoot?.querySelector<HTMLElement>('.acw-unit')?.dataset.status).toBe('off')
  })

  it('patches the rendered DOM instead of rebuilding it', () => {
    defineAirConditionerElement({ tagName: 'test-air-conditioner-patch', storage: null, enableAudio: false })
    const element = document.createElement('test-air-conditioner-patch')
    document.body.appendChild(element)

    const root = element.shadowRoot!
    const power = root.querySelector<HTMLButtonElement>('[data-action="toggleStatus"]')!
    const unit = root.querySelector<HTMLElement>('.acw-unit')!
    power.click()
    expect(root.querySelector('[data-action="toggleStatus"]')).toBe(power)
    expect(unit.dataset.status).toBe('on')
    expect(power.classList.contains('acw-button-on')).toBe(true)

    root.querySelector<HTMLButtonElement>('[data-action="increment"]')!.click()
    const temperature = root.querySelector<HTMLElement>('.acw-temperature')!
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
