import type {
  AcAction,
  AcChangeEvent,
  AcMode,
  AcNotification,
  AcState,
  AirConditionerStore,
  CreateAirConditionerStoreOptions,
} from '@yunlefun-home/air-conditioner-core'
import type { InjectionKey, ShallowRef } from 'vue'
import { inject, readonly, shallowRef } from 'vue'

export interface AirConditionerContextValue {
  state: Readonly<ShallowRef<AcState>>
  notification: Readonly<ShallowRef<AcNotification | undefined>>
  store: AirConditionerStore
  dispatch: (action: AcAction) => AcChangeEvent
  toggleStatus: () => AcChangeEvent
  setMode: (mode: AcMode) => AcChangeEvent
  increase: () => AcChangeEvent
  decrease: () => AcChangeEvent
}

export interface AirConditionerProviderOptions extends CreateAirConditionerStoreOptions {}

export const airConditionerKey: InjectionKey<AirConditionerContextValue> = Symbol('AirConditioner')

export function createAirConditionerContext(store: AirConditionerStore): AirConditionerContextValue {
  const state = shallowRef(store.getState())
  const notification = shallowRef<AcNotification | undefined>()

  store.subscribe((event) => {
    state.value = event.state
    if (event.notification)
      notification.value = event.notification
  })

  return {
    state: readonly(state),
    notification: readonly(notification),
    store,
    dispatch(action) {
      return store.dispatch(action)
    },
    toggleStatus() {
      return store.dispatch({ type: 'toggleStatus' })
    },
    setMode(mode) {
      return store.dispatch({ type: 'mode', mode })
    },
    increase() {
      return store.dispatch({ type: 'increment' })
    },
    decrease() {
      return store.dispatch({ type: 'decrement' })
    },
  }
}

export function useAirConditioner() {
  const context = inject(airConditionerKey)
  if (!context)
    throw new Error('useAirConditioner must be used within AirConditionerProvider')

  return context
}

export function useOptionalAirConditioner() {
  return inject(airConditionerKey, null)
}
