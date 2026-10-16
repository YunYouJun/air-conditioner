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
  const listeners = new Set<AcStoreListener>()

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
      listeners.forEach(listener => listener(event))

      if (notification)
        options.onNotify?.(notification, event)

      return event
    },
    subscribe(listener: AcStoreListener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
