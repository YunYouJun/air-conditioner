// @vitest-environment happy-dom

import { createAirConditionerStore, defaultAcState, getAcRemoteText } from '@yunlefun-home/air-conditioner-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import RemoteControl from '../src/components/RemoteControl.vue'
import { airConditionerKey, createAirConditionerContext } from '../src/composables/useAirConditioner'

function mountRemote() {
  const store = createAirConditionerStore({ storage: null })
  const commands: string[] = []
  const app = createApp({
    render: () => h(RemoteControl, { onCommand: (command: string) => commands.push(command) }),
  })
  app.provide(airConditionerKey, createAirConditionerContext(store))
  const host = document.createElement('div')
  document.body.appendChild(host)
  app.mount(host)

  const key = (label: string) => host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
  const press = async (label: string) => {
    key(label).click()
    await nextTick()
  }
  return { app, host, store, commands, key, press, lcd: () => host.querySelector<HTMLElement>('.acw-lcd')! }
}

let unmount: (() => void) | undefined
afterEach(() => {
  unmount?.()
  document.body.innerHTML = ''
})

describe('vue RemoteControl', () => {
  it('renders the display, the power key, the +/- pill and one row of icon keys', () => {
    const remote = mountRemote()
    unmount = () => remote.app.unmount()

    const labels = [...remote.host.querySelectorAll('button')].map(button => button.getAttribute('aria-label'))
    expect(labels).toEqual(['power', 'add', 'reduce', 'cold', 'hot', 'fan', 'swing', 'sound'])
    for (const button of remote.host.querySelectorAll('button'))
      expect(button.getAttribute('type')).toBe('button')

    expect(remote.lcd().getAttribute('role')).toBe('img')
    expect(remote.lcd().getAttribute('aria-label')).toBe(getAcRemoteText(defaultAcState).display)
    expect(remote.lcd().querySelector('.acw-lcd-temp')?.textContent).toBe(`${defaultAcState.temperature}°C`)
    expect(remote.key('cold').getAttribute('aria-pressed')).toBe('true')
    expect(remote.key('hot').getAttribute('aria-pressed')).toBe('false')
  })

  it('switches mode, swing and sleep from the icon keys', async () => {
    const remote = mountRemote()
    unmount = () => remote.app.unmount()

    await remote.press('power')
    await remote.press('hot')
    await remote.press('add')
    await remote.press('swing')
    await remote.press('sound')

    expect(remote.commands).toEqual(['power', 'hot', 'increase', 'swing', 'sound'])
    expect(remote.store.getState()).toMatchObject({ status: true, mode: 'hot', temperature: 27, swing: true, sound: 'sleep' })
    expect(remote.lcd().dataset).toMatchObject({ status: 'on', mode: 'hot', swing: 'on' })
    expect(remote.lcd().querySelector('.acw-lcd-temp')?.textContent).toBe('27°C')
    expect(remote.lcd().querySelector('.acw-lcd-sound')?.getAttribute('data-sound')).toBe('sleep')
    expect(remote.key('power').getAttribute('aria-pressed')).toBe('true')
    expect(remote.key('hot').getAttribute('aria-pressed')).toBe('true')
    expect(remote.key('cold').getAttribute('aria-pressed')).toBe('false')
    expect(remote.key('swing').getAttribute('aria-pressed')).toBe('true')
    expect(remote.key('sound').dataset.sound).toBe('sleep')
    expect(remote.key('sound').title).toBe('声音：睡眠')
  })

  // #29
  it('cycles the fan speed from the fan key', async () => {
    const remote = mountRemote()
    unmount = () => remote.app.unmount()

    expect(remote.lcd().dataset.fan).toBe('auto')
    expect(remote.key('fan').title).toBe('风速：自动')
    await remote.press('fan')
    await remote.press('fan')

    expect(remote.commands).toEqual(['fan', 'fan'])
    expect(remote.lcd().dataset.fan).toBe('medium')
    expect(remote.key('fan').dataset.fan).toBe('medium')
    expect(remote.key('fan').title).toBe('风速：中风')
    expect(remote.lcd().getAttribute('aria-label')).toContain('风速：中风')
  })

  // #115
  it('powers on from a mode key and repeats the temperature keys while held', async () => {
    const remote = mountRemote()
    unmount = () => remote.app.unmount()

    expect(remote.store.getState().status).toBe(false)
    await remote.press('hot')
    expect(remote.store.getState()).toMatchObject({ status: true, mode: 'hot' })

    vi.useFakeTimers()
    try {
      const add = remote.key('add')
      add.dispatchEvent(new PointerEvent('pointerdown', { button: 0 }))
      vi.advanceTimersByTime(1000)
      add.dispatchEvent(new PointerEvent('pointerup', { button: 0 }))
      vi.advanceTimersByTime(1000)
    }
    finally {
      vi.useRealTimers()
    }
    expect(remote.store.getState().temperature).toBeGreaterThan(defaultAcState.temperature + 2)
    expect(remote.commands.filter(command => command === 'increase').length).toBe(remote.store.getState().temperature - defaultAcState.temperature)
  })
})
