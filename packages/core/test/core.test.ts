import { describe, expect, it, vi } from 'vitest'
import {
  acModeIcons,
  acReducer,
  acStorageKey,
  createAirConditionerStore,
  createMemoryStorage,
  defaultAcState,
  maxTemperature,
  minTemperature,
  resolveAcAudioAssets,
} from '../src'

describe('@yunlefun-home/air-conditioner-core', () => {
  it('exports the default state', () => {
    expect(defaultAcState).toEqual({
      mode: 'cold',
      status: false,
      temperature: 26,
    })
  })

  it('reduces basic actions', () => {
    expect(acReducer(defaultAcState, { type: 'toggleStatus' })).toMatchObject({ status: true })
    expect(acReducer(defaultAcState, { type: 'mode', mode: 'hot' })).toMatchObject({ mode: 'hot' })
    expect(acReducer(defaultAcState, { type: 'increment' })).toMatchObject({ temperature: 27 })
    expect(acReducer(defaultAcState, { type: 'decrement' })).toMatchObject({ temperature: 25 })
  })

  it('keeps temperature inside supported bounds', () => {
    expect(acReducer({ ...defaultAcState, temperature: maxTemperature }, { type: 'increment' }).temperature).toBe(maxTemperature)
    expect(acReducer({ ...defaultAcState, temperature: minTemperature }, { type: 'decrement' }).temperature).toBe(minTemperature)
    expect(acReducer(defaultAcState, { type: 'update', payload: { temperature: 100 } }).temperature).toBe(maxTemperature)
  })

  it('emits boundary notifications from the store', () => {
    const onNotify = vi.fn()
    const store = createAirConditionerStore({
      storage: null,
      initialState: { temperature: maxTemperature },
      onNotify,
    })

    const event = store.dispatch({ type: 'increment' })

    expect(event.notification).toMatchObject({
      message: '已经是最大温度啦！',
      severity: 'error',
    })
    expect(onNotify).toHaveBeenCalledTimes(1)
  })

  it('persists state when storage is available', () => {
    const storage = createMemoryStorage()
    const store = createAirConditionerStore({ storage })

    store.dispatch({ type: 'toggleStatus' })

    expect(JSON.parse(storage.getItem(acStorageKey) || '{}')).toMatchObject({ status: true })
  })

  it('exposes mode icons for view layers', () => {
    expect(acModeIcons).toEqual({ cold: '❄️', hot: '☀️' })
  })

  it('resolves audio asset urls from a base path', () => {
    expect(resolveAcAudioAssets()).toEqual({
      beep: '/assets/audio/di.m4a',
      start: '/assets/audio/ac-work.m4a',
      work: '/assets/audio/air-extractor-fan.m4a',
    })
    expect(resolveAcAudioAssets('/ac/audio/', 'mp3')).toEqual({
      beep: '/ac/audio/di.mp3',
      start: '/ac/audio/ac-work.mp3',
      work: '/ac/audio/air-extractor-fan.mp3',
    })
  })

  it('does not throw when storage is unavailable or failing', () => {
    const storage = {
      getItem: () => {
        throw new Error('disabled')
      },
      setItem: () => {
        throw new Error('disabled')
      },
    }

    const store = createAirConditionerStore({ storage })

    expect(() => store.dispatch({ type: 'toggleStatus' })).not.toThrow()
    expect(store.getState().status).toBe(true)
  })
})
