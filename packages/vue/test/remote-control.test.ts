// @vitest-environment happy-dom

import { createAirConditionerStore, defaultAcState, getAcRemoteText } from '@yunlefun-home/air-conditioner-core'
import { afterEach, describe, expect, it } from 'vitest'
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
    expect(labels).toEqual(['power', 'add', 'reduce', 'cold', 'hot', 'swing', 'sound'])
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
})
