import type {
  AcAction,
  AcChangeEvent,
  AcStoreListener,
  AirConditionerStore,
  CreateAirConditionerStoreOptions,
} from './types'
import { acStorageKey, defaultAcState } from './constants'
import { acReducer, getAcActionNotification, normalizeAcState } from './reducer'
import { getBrowserStorage, readAcState, writeAcState } from './storage'

export function createAirConditionerStore(options: CreateAirConditionerStoreOptions = {}): AirConditionerStore {
  const storageKey = options.storageKey ?? acStorageKey
  const storage = options.storage === undefined ? getBrowserStorage() : options.storage
  const persistedState = readAcState(storage, storageKey)
  const limits = options.limits
  let state = normalizeAcState({
    ...defaultAcState,
    ...persistedState,
    ...options.initialState,
  }, limits)
  const listeners = new Map<AcStoreListener, symbol>()

  return {
    getState() {
      return state
    },
    dispatch(action: AcAction) {
      const previousState = state
      const nextState = acReducer(state, action, limits)
      const notification = getAcActionNotification(previousState, nextState, action, limits)
      const event: AcChangeEvent = {
        action,
        previousState,
        state: nextState,
        notification,
      }

      state = nextState
      writeAcState(storage, storageKey, nextState)
      // New subscriptions wait for the next dispatch, including re-subscriptions
      // of the same callback. Still honor removals before a listener's turn.
      for (const [listener, subscription] of [...listeners]) {
        if (listeners.get(listener) === subscription)
          listener(event)
      }

      if (notification)
        options.onNotify?.(notification, event)

      return event
    },
    subscribe(listener: AcStoreListener) {
      let subscription = listeners.get(listener)
      if (!subscription) {
        subscription = Symbol('subscription')
        listeners.set(listener, subscription)
      }
      return () => {
        if (listeners.get(listener) === subscription)
          listeners.delete(listener)
      }
    },
  }
}
