import type { AcChangeEvent } from '../src'
import { describe, expect, it } from 'vitest'
import { createAirConditionerStore } from '../src'

describe('store subscriptions during dispatch', () => {
  it('starts a new subscription with the next action', () => {
    const store = createAirConditionerStore({ storage: null })
    const received: AcChangeEvent[] = []
    const listener = (event: AcChangeEvent) => received.push(event)
    store.subscribe(() => store.subscribe(listener))

    store.dispatch({ type: 'toggleStatus' })
    expect(received).toEqual([])
    const next = store.dispatch({ type: 'increment' })
    expect(received).toEqual([next])
  })

  it('honors an unsubscribe before the listener is reached', () => {
    const store = createAirConditionerStore({ storage: null })
    const received: AcChangeEvent[] = []
    let unsubscribe: () => void
    store.subscribe(() => unsubscribe())
    unsubscribe = store.subscribe(event => received.push(event))

    store.dispatch({ type: 'toggleStatus' })
    store.dispatch({ type: 'increment' })
    expect(received).toEqual([])
  })

  it('does not send an in-flight action to a removed and re-added callback', () => {
    const store = createAirConditionerStore({ storage: null })
    const received: AcChangeEvent[] = []
    const listener = (event: AcChangeEvent) => received.push(event)
    let unsubscribe: () => void
    store.subscribe((event) => {
      if (event.action.type === 'toggleStatus') {
        unsubscribe()
        store.subscribe(listener)
      }
    })
    unsubscribe = store.subscribe(listener)

    store.dispatch({ type: 'toggleStatus' })
    expect(received).toEqual([])
    const next = store.dispatch({ type: 'increment' })
    expect(received).toEqual([next])
  })

  it('delivers a nested action to the replacement subscription without replaying the outer action', () => {
    const store = createAirConditionerStore({ storage: null, initialState: { temperature: 24 } })
    const replacement: AcChangeEvent[] = []
    const peer: AcChangeEvent[] = []
    let nested: AcChangeEvent | undefined
    const unsubscribe = store.subscribe(() => {
      unsubscribe()
      store.subscribe(event => replacement.push(event))
      nested = store.dispatch({ type: 'increment' })
    })
    store.subscribe(event => peer.push(event))

    const outer = store.dispatch({ type: 'toggleStatus' })
    expect(replacement).toEqual([nested])
    expect(peer).toEqual([nested, outer])
    expect(nested?.previousState).toMatchObject({ status: true, temperature: 24 })
    expect(nested?.state).toMatchObject({ status: true, temperature: 25 })
    expect(outer.previousState).toMatchObject({ status: false, temperature: 24 })
    expect(outer.state).toMatchObject({ status: true, temperature: 24 })
    expect(store.getState()).toMatchObject({ status: true, temperature: 25 })
    const next = store.dispatch({ type: 'decrement' })
    expect(replacement).toEqual([nested, next])
  })

  it('still deduplicates repeated subscriptions to the same callback', () => {
    const store = createAirConditionerStore({ storage: null })
    const received: AcChangeEvent[] = []
    const listener = (event: AcChangeEvent) => received.push(event)
    store.subscribe(listener)
    const unsubscribe = store.subscribe(listener)

    const event = store.dispatch({ type: 'toggleStatus' })
    expect(received).toEqual([event])
    unsubscribe()
    store.dispatch({ type: 'increment' })
    expect(received).toEqual([event])
  })
})
