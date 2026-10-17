import { describe, expect, it } from 'vitest'
import { acEnergyLabel, acIconPaths, acModeLabels, defaultAcState, getAcEnergyLabelText, getAcRemoteText } from '../src'

describe('remote control text', () => {
  it('describes the display for screen readers', () => {
    expect(getAcRemoteText(defaultAcState).display).toBe('待机，制冷 26°C，风速：自动，扫风：关，声音：标准')
    expect(getAcRemoteText({ status: true, mode: 'hot', temperature: 28, sound: 'sleep', swing: true, fan: 'high' }).display)
      .toBe('运行，制热 28°C，风速：高风，扫风：开，声音：睡眠')
  })

  it('titles every key from the state', () => {
    const text = getAcRemoteText({ ...defaultAcState, status: true, swing: true, sound: 'mute' })
    expect(text.power).toBe('电源：开')
    expect(text.swing).toBe('扫风：开')
    expect(text.sound).toBe('声音：静音')
    expect(text.fan).toBe('风速：自动')
    expect(acIconPaths.fan).toMatch(/^M/)
    expect(text.mode).toBe(acModeLabels)
  })

  it('ships the +/- icons of the temperature keys', () => {
    expect(acIconPaths.plus).toMatch(/^M/)
    expect(acIconPaths.minus).toMatch(/^M/)
  })
})

// #114: 现行 GB 21455-2019 分 5 级（修订征求意见稿拟改为 3 级，尚未实施）
describe('energy label', () => {
  it('draws five grades and names the standard', () => {
    // 首行是 1 级绿色条与指示箭头，levels 是 2–5 级
    expect(acEnergyLabel.levels).toHaveLength(acEnergyLabel.grades - 1)
    expect(acEnergyLabel.grades).toBe(5)
    expect(acEnergyLabel.grade).toBe(1)
    expect(getAcEnergyLabelText()).toBe('中国能效标识：能效等级 1 级（共 5 级），依据 GB 21455-2019')
  })
})
