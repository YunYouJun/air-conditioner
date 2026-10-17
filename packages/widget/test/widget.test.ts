// @vitest-environment happy-dom

import { acModeIcons, defaultAcState, getAcRemoteText } from '@yunlefun-home/air-conditioner-core'
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

    root.querySelector<HTMLButtonElement>('[data-repeat="increment"]')!.click()
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

    const increment = element.shadowRoot?.querySelector<HTMLButtonElement>('[data-repeat="increment"]')
    increment?.click()

    expect(changes).toHaveLength(1)
    expect(notifications).toHaveLength(1)
    expect(JSON.stringify(notifications[0])).toContain('已经是最大温度啦')
  })

  it('blows a note for tips, shakes the LCD at limits and only announces settings', () => {
    defineAirConditionerElement({
      tagName: 'test-air-conditioner-notes',
      initialState: { status: true, mode: 'hot', temperature: 31, temperatures: { cold: 20, hot: 31 } },
      enableAudio: false,
      storage: null,
    })
    const element = document.createElement('test-air-conditioner-notes')
    document.body.appendChild(element)
    const root = element.shadowRoot!
    const press = (action: string) => root.querySelector<HTMLElement>(`[data-action="${action}"], [data-repeat="${action}"]`)!.click()
    const announced = () => root.querySelector('.acw-notification-region .acw-sr-only')!.textContent

    // At the limit: no note, the LCD shakes and the message is only announced.
    press('increment')
    expect(root.querySelector('.acw-note')).toBeNull()
    expect(root.querySelector('.acw-lcd')!.hasAttribute('data-alert')).toBe(true)
    expect(announced()).toBe('已经是最大温度啦！')

    // An energy tip is a note blown from the outlet, tinted by mode.
    press('cold')
    const note = root.querySelector<HTMLElement>('.acw-note')!
    expect(note.dataset.mode).toBe('cold')
    expect(note.textContent).toContain('制冷调到 26°C 以上更省电')

    // Settings are on the LCD already: announced, no new note.
    press('cycleFan')
    expect(root.querySelectorAll('.acw-note')).toHaveLength(1)
    expect(announced()).toBe('风速：低风')
  })

  it('cycles the sound mode from the remote and the sound attribute', () => {
    defineAirConditionerElement({ tagName: 'test-air-conditioner-sound', enableAudio: false, storage: null })
    const element = document.createElement('test-air-conditioner-sound')
    document.body.appendChild(element)
    const button = () => element.shadowRoot!.querySelector<HTMLElement>('.acw-button-sound')!

    expect(button().dataset.sound).toBe('normal')
    expect(button().querySelector('svg')).not.toBeNull()

    button().click()
    expect(button().dataset.sound).toBe('sleep')
    expect(button().title).toBe('声音：睡眠')

    element.setAttribute('sound', 'mute')
    expect(button().dataset.sound).toBe('mute')
  })

  it('toggles swing from the remote and the swing attribute', () => {
    defineAirConditionerElement({ tagName: 'test-air-conditioner-swing', enableAudio: false, storage: null })
    const element = document.createElement('test-air-conditioner-swing')
    document.body.appendChild(element)
    const root = element.shadowRoot!
    const button = root.querySelector<HTMLElement>('.acw-button-swing')!
    const unit = root.querySelector<HTMLElement>('.acw-unit')!

    expect(unit.dataset.swing).toBe('off')
    expect(button.getAttribute('aria-pressed')).toBe('false')

    button.click()
    expect(unit.dataset.swing).toBe('on')
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.title).toBe('扫风：开')

    element.setAttribute('swing', 'false')
    expect(unit.dataset.swing).toBe('off')
  })

  it('mirrors the state on the remote display and keys', () => {
    defineAirConditionerElement({ tagName: 'test-air-conditioner-remote', enableAudio: false, storage: null })
    const element = document.createElement('test-air-conditioner-remote')
    document.body.appendChild(element)
    const root = element.shadowRoot!
    const lcd = root.querySelector<HTMLElement>('.acw-lcd')!
    const key = (label: string) => root.querySelector<HTMLButtonElement>(`.acw-remote button[aria-label="${label}"]`)!

    expect(lcd.querySelector('.acw-lcd-temp')?.textContent).toBe(`${defaultAcState.temperature}°C`)
    expect(lcd.getAttribute('aria-label')).toBe(getAcRemoteText(defaultAcState).display)
    expect(key('cold').getAttribute('aria-pressed')).toBe('true')
    expect(key('hot').getAttribute('aria-pressed')).toBe('false')
    expect(key('power').getAttribute('aria-pressed')).toBe('false')

    key('power').click()
    key('hot').click()
    key('add').click()
    key('swing').click()
    key('sound').click()

    expect(lcd.dataset).toMatchObject({ status: 'on', mode: 'hot', swing: 'on' })
    expect(lcd.querySelector('.acw-lcd-temp')?.textContent).toBe(`${defaultAcState.temperature + 1}°C`)
    expect(lcd.querySelector('.acw-lcd-sound')?.getAttribute('data-sound')).toBe('sleep')
    expect(key('power').getAttribute('aria-pressed')).toBe('true')
    expect(key('hot').getAttribute('aria-pressed')).toBe('true')
    expect(key('cold').getAttribute('aria-pressed')).toBe('false')
    expect(key('swing').getAttribute('aria-pressed')).toBe('true')
  })
})
