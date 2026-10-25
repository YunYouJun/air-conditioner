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

  it('keeps inline controls visible and makes floating controls a disclosure', () => {
    defineAirConditionerElement({ tagName: 'test-ac-placement', enableAudio: false, storage: null })
    const element = mountAirConditioner(document.body, { tagName: 'test-ac-placement' })
    const root = element.shadowRoot!
    const toggle = root.querySelector<HTMLButtonElement>('.acw-remote-toggle')!
    const panel = root.querySelector<HTMLElement>('.acw-remote-panel')!
    expect(toggle.hidden).toBe(true)
    expect(panel.hidden).toBe(false)

    element.setAttribute('placement', 'top-right')
    expect(element.dataset.acPlacement).toBe('top-right')
    expect(toggle.hidden).toBe(false)
    expect(panel.hidden).toBe(true)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(toggle.getAttribute('aria-controls')).toBe(panel.id)
    expect(toggle.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    expect(toggle.textContent).toBe('打开遥控器')

    toggle.click()
    expect(panel.hidden).toBe(false)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(toggle.textContent).toBe('收起遥控器')
    expect(toggle.querySelector('svg')).not.toBeNull()
    toggle.click()
    expect(panel.hidden).toBe(true)

    element.setAttribute('placement', 'invalid')
    expect(element.dataset.acPlacement).toBe('inline')
    expect(toggle.hidden).toBe(true)
    expect(panel.hidden).toBe(false)
    element.remove()
  })

  it('preserves AC state and control nodes when the remote is collapsed or moved', () => {
    defineAirConditionerElement({ tagName: 'test-ac-floating-state', enableAudio: false, storage: null })
    const element = mountAirConditioner(document.body, { tagName: 'test-ac-floating-state', placement: 'top-left' })
    const root = element.shadowRoot!
    const toggle = root.querySelector<HTMLButtonElement>('.acw-remote-toggle')!
    const panel = root.querySelector<HTMLElement>('.acw-remote-panel')!
    const power = root.querySelector<HTMLButtonElement>('.acw-button-power')!
    const changes: Event[] = []
    element.addEventListener('ac-change', event => changes.push(event))

    toggle.click()
    power.click()
    root.querySelector<HTMLButtonElement>('[data-repeat="increment"]')!.click()
    const count = changes.length
    toggle.click()
    element.setAttribute('placement', 'top-right')
    expect(panel.hidden).toBe(true)
    toggle.click()
    expect(root.querySelector('.acw-button-power')).toBe(power)
    expect(power.getAttribute('aria-pressed')).toBe('true')
    expect(root.querySelector('.acw-temperature')?.textContent).toBe('27')
    element.setAttribute('placement', 'top-left')
    expect(panel.hidden).toBe(false)
    expect(changes).toHaveLength(count)
    element.remove()
  })

  it('returns focus to the disclosure on Escape and to the remote when made inline', () => {
    defineAirConditionerElement({ tagName: 'test-ac-floating-focus', enableAudio: false, storage: null })
    const element = mountAirConditioner(document.body, { tagName: 'test-ac-floating-focus', placement: 'top-right' })
    const root = element.shadowRoot!
    const toggle = root.querySelector<HTMLButtonElement>('.acw-remote-toggle')!
    const panel = root.querySelector<HTMLElement>('.acw-remote-panel')!
    const power = root.querySelector<HTMLButtonElement>('.acw-button-power')!
    toggle.click()
    power.focus()
    power.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }))
    expect(panel.hidden).toBe(true)
    expect(root.activeElement).toBe(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    element.removeAttribute('placement')
    expect(panel.hidden).toBe(false)
    expect(root.activeElement).toBe(power)
    element.remove()
  })

  it('applies placement per mount even after the element is registered', () => {
    const options = { tagName: 'test-ac-mount-placement', enableAudio: false, storage: null } as const
    defineAirConditionerElement(options)
    const left = mountAirConditioner(document.body, { ...options, placement: 'top-left' })
    const right = mountAirConditioner(document.body, { ...options, placement: 'top-right' })
    expect(left.dataset.acPlacement).toBe('top-left')
    expect(right.dataset.acPlacement).toBe('top-right')
    expect(mountAirConditioner(left, { ...options, placement: 'inline' })).toBe(left)
    expect(left.dataset.acPlacement).toBe('inline')
    expect(right.dataset.acPlacement).toBe('top-right')
    left.remove()
    right.remove()
  })

  it.each(['top-left', 'top-right'] as const)('keeps later mounts inline after a first %s mount', (placement) => {
    const tagName = `test-ac-mount-default-${placement}`
    const floating = mountAirConditioner(document.body, { tagName, placement, enableAudio: false, storage: null })
    const container = document.body.appendChild(document.createElement('div'))
    const inline = mountAirConditioner(container, { tagName })

    try {
      expect(floating.dataset.acPlacement).toBe(placement)
      expect(inline.dataset.acPlacement).toBe('inline')
      expect(inline.shadowRoot?.querySelector<HTMLButtonElement>('.acw-remote-toggle')?.hidden).toBe(true)
      expect(inline.shadowRoot?.querySelector<HTMLElement>('.acw-remote-panel')?.hidden).toBe(false)
    }
    finally {
      floating.remove()
      container.remove()
    }
  })

  it('preserves explicitly registered placement defaults when a mount overrides them', () => {
    const tagName = 'test-ac-registered-placement'
    defineAirConditionerElement({ tagName, placement: 'top-left', enableAudio: false, storage: null })
    const override = mountAirConditioner(document.body, { tagName, placement: 'top-right' })
    const inherited = mountAirConditioner(document.body, { tagName })

    try {
      expect(override.dataset.acPlacement).toBe('top-right')
      expect(inherited.dataset.acPlacement).toBe('top-left')
      expect(mountAirConditioner(override, { tagName })).toBe(override)
      expect(override.dataset.acPlacement).toBe('top-right')
    }
    finally {
      override.remove()
      inherited.remove()
    }
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

  // #70 / #21
  it('sets the mist and drip hooks from the state', () => {
    defineAirConditionerElement({
      tagName: 'test-air-conditioner-condensation',
      initialState: { status: true, mode: 'cold', temperature: 18 },
      enableAudio: false,
      storage: null,
    })
    const element = document.createElement('test-air-conditioner-condensation')
    document.body.appendChild(element)
    const root = element.shadowRoot!
    const unit = root.querySelector<HTMLElement>('.acw-unit')!
    expect(root.querySelectorAll('.acw-mist i')).toHaveLength(5)
    expect(root.querySelector('.acw-drip')).not.toBeNull()
    expect(unit.dataset.drip).toBe('on')
    expect(Number(unit.style.getPropertyValue('--acw-mist'))).toBeGreaterThan(0)
    expect(unit.style.getPropertyValue('--acw-drip-cycle')).toMatch(/ms$/)

    root.querySelector<HTMLElement>('[data-action="hot"]')!.click()
    expect(unit.dataset.drip).toBe('off')
    expect(unit.style.getPropertyValue('--acw-mist')).toBe('0')
    expect(unit.style.getPropertyValue('--acw-drip-cycle')).toBe('')
  })
})
