import type {
  AcAction,
  AcMode,
  AcNotification,
  AcState,
  AirConditionerStore,
  CreateAirConditionerStoreOptions,
} from '@yunlefun-home/air-conditioner-core'
import type { PropsWithChildren } from 'react'
import {
  createAirConditionerStore,
  defaultAcState,
} from '@yunlefun-home/air-conditioner-core'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export interface AirConditionerProviderProps extends PropsWithChildren, CreateAirConditionerStoreOptions {}

export interface AirConditionerContextValue {
  state: AcState
  notification?: AcNotification
  dispatch: (action: AcAction) => void
  toggleStatus: () => void
  setMode: (mode: AcMode) => void
  increase: () => void
  decrease: () => void
  store: AirConditionerStore
}

const AirConditionerContext = createContext<AirConditionerContextValue | undefined>(undefined)

export function AirConditionerProvider(props: AirConditionerProviderProps) {
  const {
    children,
    initialState,
    storage,
    storageKey,
    onNotify,
  } = props
  const store = useMemo(() => createAirConditionerStore({
    initialState,
    storage,
    storageKey,
    onNotify,
  }), [initialState, onNotify, storage, storageKey])
  const [state, setState] = useState(() => store.getState())
  const [notification, setNotification] = useState<AcNotification | undefined>()

  useEffect(() => {
    return store.subscribe((event) => {
      setState(event.state)
      if (event.notification)
        setNotification(event.notification)
    })
  }, [store])

  const value = useMemo<AirConditionerContextValue>(() => ({
    state,
    notification,
    store,
    dispatch(action) {
      store.dispatch(action)
    },
    toggleStatus() {
      store.dispatch({ type: 'toggleStatus' })
    },
    setMode(mode) {
      store.dispatch({ type: 'mode', mode })
    },
    increase() {
      store.dispatch({ type: 'increment' })
    },
    decrease() {
      store.dispatch({ type: 'decrement' })
    },
  }), [notification, state, store])

  return (
    <AirConditionerContext.Provider value={value}>
      {children}
    </AirConditionerContext.Provider>
  )
}

export function useAirConditioner() {
  const context = useContext(AirConditionerContext)
  if (!context)
    throw new Error('useAirConditioner must be used within an AirConditionerProvider')

  return context
}

export function useOptionalAirConditionerState(fallback: Partial<AcState> = {}) {
  const context = useContext(AirConditionerContext)
  return context?.state ?? { ...defaultAcState, ...fallback }
}
