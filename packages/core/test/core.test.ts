import { describe, expect, it, vi } from 'vitest'
import {
  acModeIcons,
  acReducer,
  acStorageKey,
  createAcNotificationPresenter,
  createAirConditionerStore,
  createMemoryStorage,
  defaultAcState,
  getAcActionNotification,
  maxTemperature,
  minTemperature,
  nextAcSoundMode,
  normalizeAcState,
  resolveAcAudioAssets,
} from '../src'

describe('@yunlefun-home/air-conditioner-core', () => {
  it('exports the default state', () => {
    expect(defaultAcState).toEqual({
      mode: 'cold',
      status: false,
      temperature: 26,
      temperatures: { cold: 26, hot: 26 },
      sound: 'normal',
      swing: false,
      fan: 'auto',
    })
  })

  // #39: like a real remote, each mode keeps its own temperature.
  it('remembers the temperature of each mode', () => {
    let state = acReducer(defaultAcState, { type: 'decrement' })
    for (let i = 0; i < 5; i++)
      state = acReducer(state, { type: 'decrement' })
    expect(state.temperature).toBe(20)
    state = acReducer(state, { type: 'mode', mode: 'hot' })
    expect(state.temperature).toBe(26)
    for (let i = 0; i < 2; i++)
      state = acReducer(state, { type: 'increment' })
    expect(state).toMatchObject({ mode: 'hot', temperature: 28, temperatures: { cold: 20, hot: 28 } })
    state = acReducer(state, { type: 'mode', mode: 'cold' })
    expect(state).toMatchObject({ mode: 'cold', temperature: 20, temperatures: { cold: 20, hot: 28 } })
    // Re-selecting the current mode changes nothing.
    expect(acReducer(state, { type: 'mode', mode: 'cold' })).toBe(state)
  })

  // #115: a remote's mode key also powers the unit on; external syncs don't.
  it('powers on from a mode key only when asked', () => {
    const off = { ...defaultAcState, status: false }
    expect(acReducer(off, { type: 'mode', mode: 'hot' })).toMatchObject({ status: false, mode: 'hot' })
    expect(acReducer(off, { type: 'mode', mode: 'hot', powerOn: true })).toMatchObject({ status: true, mode: 'hot' })
    expect(acReducer(off, { type: 'mode', mode: 'cold', powerOn: true })).toMatchObject({ status: true, mode: 'cold' })
    const on = { ...defaultAcState, status: true }
    expect(acReducer(on, { type: 'mode', mode: 'cold', powerOn: true })).toBe(on)
  })

  // #29
  it('cycles and validates the fan speed', () => {
    expect(defaultAcState.fan).toBe('auto')
    let state = defaultAcState
    const seen: string[] = []
    for (let i = 0; i < 4; i++) {
      state = acReducer(state, { type: 'cycleFan' })
      seen.push(state.fan!)
    }
    expect(seen).toEqual(['low', 'medium', 'high', 'auto'])
    expect(acReducer(state, { type: 'fan', fan: 'high' }).fan).toBe('high')
    expect(acReducer(state, { type: 'fan', fan: 'turbo' as never }).fan).toBe('auto')
    expect(normalizeAcState({ fan: 'loud' as never }).fan).toBe('auto')
    expect(normalizeAcState({}).fan).toBe('auto')
    const event = createAirConditionerStore({ storage: null }).dispatch({ type: 'fan', fan: 'low' })
    expect(event.notification?.message).toBe('风速：低风')
  })

  it('tags notifications with how views should present them', () => {
    const hot = normalizeAcState({ mode: 'hot', temperature: 27, temperatures: { cold: 22, hot: 27 } })
    const cold = acReducer(hot, { type: 'mode', mode: 'cold' })
    expect(getAcActionNotification(hot, cold, { type: 'mode', mode: 'cold' })).toEqual({
      message: '制冷调到 26°C 以上更省电',
      detail: '少开一度，为节能减排出一份力',
      severity: 'success',
      kind: 'tip',
    })
    const top = normalizeAcState({ temperature: 31 })
    expect(getAcActionNotification(top, top, { type: 'increment' })?.kind).toBe('limit')
    expect(getAcActionNotification(defaultAcState, acReducer(defaultAcState, { type: 'cycleFan' }), { type: 'cycleFan' })?.kind).toBe('setting')

    const present = createAcNotificationPresenter()
    const tip = getAcActionNotification(hot, cold, { type: 'mode', mode: 'cold' })!
    expect(present(tip, cold)).toBe('note')
    // The same tip for the same mode and temperature is not repeated.
    expect(present(tip, cold)).toBe('skip')
    expect(present(tip, { ...cold, temperature: 21 })).toBe('note')
    expect(present({ message: '已经是最大温度啦！', severity: 'error', kind: 'limit' }, cold)).toBe('shake')
    expect(present({ message: '风速：低风', severity: 'info', kind: 'setting' }, cold)).toBe('announce')
    // Notifications without a kind (older custom ones) still show.
    expect(createAcNotificationPresenter()({ message: 'hi', severity: 'info' }, cold)).toBe('note')
  })

  it('migrates states saved before per-mode temperatures', () => {
    expect(normalizeAcState({ mode: 'hot', temperature: 24 }).temperatures).toEqual({ cold: 24, hot: 24 })
    // The current mode always mirrors `temperature`; stale or bad values are fixed.
    expect(normalizeAcState({ mode: 'cold', temperature: 22, temperatures: { cold: 30, hot: 99 } }).temperatures)
      .toEqual({ cold: 22, hot: 31 })
    expect(normalizeAcState({ temperature: 22, temperatures: { cold: 22, hot: Number.NaN } }).temperatures?.hot).toBe(22)
    // A hand-written state without the field still switches sensibly.
    const legacy = { status: true, mode: 'cold' as const, temperature: 21, sound: 'normal' as const, swing: false }
    expect(acReducer(legacy, { type: 'mode', mode: 'hot' })).toMatchObject({ temperature: 21, temperatures: { cold: 21, hot: 21 } })
  })

  it('recommends a temperature from the one the mode switch lands on', () => {
    const cold = acReducer(acReducer(defaultAcState, { type: 'mode', mode: 'hot' }), { type: 'mode', mode: 'cold' })
    const tooCold = normalizeAcState({ mode: 'hot', temperature: 26, temperatures: { cold: 18, hot: 26 } })
    const next = acReducer(tooCold, { type: 'mode', mode: 'cold' })
    expect(getAcActionNotification(tooCold, next, { type: 'mode', mode: 'cold' })?.severity).toBe('success')
    expect(getAcActionNotification(cold, cold, { type: 'mode', mode: 'cold' })).toBeUndefined()
  })

  it('toggles and validates swing', () => {
    expect(acReducer(defaultAcState, { type: 'toggleSwing' }).swing).toBe(true)
    expect(acReducer({ ...defaultAcState, swing: true }, { type: 'toggleSwing' }).swing).toBe(false)
    expect(acReducer(defaultAcState, { type: 'swing', swing: true }).swing).toBe(true)
    // States saved before the field existed do not swing
    expect(normalizeAcState({ status: true }).swing).toBe(false)
    expect(normalizeAcState({ swing: 'yes' as never }).swing).toBe(false)
  })

  it('announces swing changes', () => {
    const store = createAirConditionerStore({ storage: null })

    expect(store.dispatch({ type: 'toggleSwing' }).notification).toMatchObject({
      message: expect.stringContaining('扫风已开启'),
      severity: 'info',
    })
    expect(store.dispatch({ type: 'swing', swing: true }).notification).toBeUndefined()
    expect(store.dispatch({ type: 'swing', swing: false }).notification?.message).toContain('扫风已关闭')
  })

  it('cycles and validates the sound mode', () => {
    expect(acReducer(defaultAcState, { type: 'cycleSound' }).sound).toBe('sleep')
    expect(acReducer({ ...defaultAcState, sound: 'sleep' }, { type: 'cycleSound' }).sound).toBe('mute')
    expect(acReducer({ ...defaultAcState, sound: 'mute' }, { type: 'cycleSound' }).sound).toBe('normal')
    expect(acReducer(defaultAcState, { type: 'sound', sound: 'mute' }).sound).toBe('mute')
    // States saved before the field existed count as normal
    expect(normalizeAcState({ status: true }).sound).toBe('normal')
    expect(normalizeAcState({ sound: 'loud' as never }).sound).toBe('normal')
    expect(nextAcSoundMode(undefined)).toBe('sleep')
  })

  it('announces sound mode changes', () => {
    const store = createAirConditionerStore({ storage: null })

    expect(store.dispatch({ type: 'cycleSound' }).notification).toMatchObject({
      message: expect.stringContaining('睡眠模式'),
      severity: 'info',
    })
    expect(store.dispatch({ type: 'sound', sound: 'mute' }).notification?.message).toContain('静音模式')
    expect(store.dispatch({ type: 'sound', sound: 'mute' }).notification).toBeUndefined()
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
