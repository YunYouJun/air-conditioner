import { describe, expect, it } from 'vitest'
import { acDripMaxTemperature, defaultAcState, getAcCondensationStyle, getAcDripInterval, getAcMist } from '../src'

const cold = { ...defaultAcState, status: true, mode: 'cold' as const }

describe('mist (#70)', () => {
  it('only shows when cooling', () => {
    expect(getAcMist({ ...cold, status: false })).toBe(0)
    expect(getAcMist({ ...cold, mode: 'hot' })).toBe(0)
    expect(getAcMist(cold)).toBeGreaterThan(0)
  })

  it('gets thicker as it gets colder and the fan gets stronger', () => {
    expect(getAcMist({ ...cold, temperature: 16, fan: 'high' })).toBe(1)
    expect(getAcMist({ ...cold, temperature: 16 })).toBeGreaterThan(getAcMist({ ...cold, temperature: 26 }))
    expect(getAcMist({ ...cold, fan: 'high' })).toBeGreaterThan(getAcMist({ ...cold, fan: 'low' }))
    // Never quite disappears while cooling, even at 31 °C on low.
    expect(getAcMist({ ...cold, temperature: 31, fan: 'low' })).toBeGreaterThan(0)
  })
})

describe('condensation drips (#21)', () => {
  it('only drips when cooling hard', () => {
    expect(getAcDripInterval({ ...cold, temperature: 26 })).toBeUndefined()
    expect(getAcDripInterval({ ...cold, temperature: acDripMaxTemperature + 1 })).toBeUndefined()
    expect(getAcDripInterval({ ...cold, temperature: 16, status: false })).toBeUndefined()
    expect(getAcDripInterval({ ...cold, temperature: 16, mode: 'hot' })).toBeUndefined()
  })

  it('drips more often the colder it is, and faster on high', () => {
    expect(getAcDripInterval({ ...cold, temperature: 16 })).toBe(9000)
    expect(getAcDripInterval({ ...cold, temperature: acDripMaxTemperature })).toBe(18000)
    expect(getAcDripInterval({ ...cold, temperature: 16, fan: 'high' })).toBe(7200)
  })

  it('maps to the view attributes', () => {
    expect(getAcCondensationStyle({ ...cold, temperature: 16 })).toMatchObject({ drip: 'on', dripCycle: '9000ms' })
    expect(getAcCondensationStyle(defaultAcState)).toEqual({ mist: 0, drip: 'off', dripCycle: undefined })
  })
})
