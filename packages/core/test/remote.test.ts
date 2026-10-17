import { describe, expect, it } from 'vitest'
import { acIconPaths, acModeLabels, defaultAcState, getAcRemoteText } from '../src'

describe('remote control text', () => {
  it('describes the display for screen readers', () => {
    expect(getAcRemoteText(defaultAcState).display).toBe('待机，制冷 26°C，扫风：关，声音：标准')
    expect(getAcRemoteText({ status: true, mode: 'hot', temperature: 28, sound: 'sleep', swing: true }).display)
      .toBe('运行，制热 28°C，扫风：开，声音：睡眠')
  })

  it('titles every key from the state', () => {
    const text = getAcRemoteText({ ...defaultAcState, status: true, swing: true, sound: 'mute' })
    expect(text.power).toBe('电源：开')
    expect(text.swing).toBe('扫风：开')
    expect(text.sound).toBe('声音：静音')
    expect(text.mode).toBe(acModeLabels)
  })

  it('ships the +/- icons of the temperature keys', () => {
    expect(acIconPaths.plus).toMatch(/^M/)
    expect(acIconPaths.minus).toMatch(/^M/)
  })
})
