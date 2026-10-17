// @vitest-environment happy-dom

import type { RemoteControlProps } from '../src'
import { defaultAcState, getAcRemoteText } from '@yunlefun-home/air-conditioner-core'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { AirConditionerProvider, RemoteControl } from '../src'

declare global {
  // eslint-disable-next-line vars-on-top
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

function mountRemote() {
  const commands: string[] = []
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => {
    root.render(createElement(
      AirConditionerProvider,
      { storage: null },
      createElement<RemoteControlProps>(RemoteControl, { onCommand: command => commands.push(command) }),
    ))
  })

  const key = (label: string) => host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
  const press = (label: string) => act(() => key(label).click())
  return { root, host, commands, key, press, lcd: () => host.querySelector<HTMLElement>('.acw-lcd')! }
}

let unmount: (() => void) | undefined
afterEach(() => {
  act(() => unmount?.())
  document.body.innerHTML = ''
})

describe('react RemoteControl', () => {
  it('renders the display, the power key, the +/- pill and one row of icon keys', () => {
    const remote = mountRemote()
    unmount = () => remote.root.unmount()

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

  it('switches mode, swing and sleep from the icon keys', () => {
    const remote = mountRemote()
    unmount = () => remote.root.unmount()

    remote.press('power')
    remote.press('hot')
    remote.press('add')
    remote.press('swing')
    remote.press('sound')

    expect(remote.commands).toEqual(['power', 'hot', 'increase', 'swing', 'sound'])
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
