import { describe, expect, it } from 'vitest'
import {
  acReducer,
  acTone,
  clampTemperature,
  createAirConditionerStore,
  defaultAcLimits,
  defaultAcState,
  normalizeAcState,
} from '../src'

const halfStep = { min: 17, max: 30, step: 0.5 }

describe('device limits', () => {
  it('keeps the legacy range and does not snap without limits', () => {
    expect(defaultAcLimits).toEqual({ min: 16, max: 31, step: 1 })
    expect(clampTemperature(26.3)).toBe(26.3)
    expect(clampTemperature(40)).toBe(31)
  })

  it('snaps to the device step and clamps to its range', () => {
    expect(clampTemperature(26.3, halfStep)).toBe(26.5)
    expect(clampTemperature(10, halfStep)).toBe(17)
    expect(clampTemperature(30.4, halfStep)).toBe(30)
  })

  it('steps by the device step', () => {
    const state = { ...defaultAcState, temperature: 24 }
    expect(acReducer(state, { type: 'increment' }, halfStep).temperature).toBe(24.5)
    expect(acReducer(state, { type: 'decrement' }, halfStep).temperature).toBe(23.5)
    expect(acReducer({ ...state, temperature: 30 }, { type: 'increment' }, halfStep).temperature).toBe(30)
    expect(acReducer(state, { type: 'update', payload: { temperature: 12 } }, halfStep).temperature).toBe(17)
  })

  it('normalizes and stores with device limits', () => {
    expect(normalizeAcState({ temperature: 35 }, halfStep).temperature).toBe(30)
    const store = createAirConditionerStore({ storage: null, limits: halfStep, initialState: { temperature: 30 } })
    expect(store.dispatch({ type: 'increment' }).notification?.message).toBe('已经是最大温度啦！')
  })
})

describe('acTone', () => {
  it('maps power and mode to a tone', () => {
    expect(acTone({ status: false, mode: 'hot' })).toBe('idle')
    expect(acTone({ status: true, mode: 'cold' })).toBe('cool')
    expect(acTone({ status: true, mode: 'hot' })).toBe('heat')
  })
})
