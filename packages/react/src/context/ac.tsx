import type { AcAction, AcMode, AcState } from '@yunlefun-home/air-conditioner-core'
import type { FC, PropsWithChildren } from 'react'
import {
  acReducer,
  acStorageKey,
  defaultAcState as defaultState,
  getAcActionNotification,
} from '@yunlefun-home/air-conditioner-core'
import { createContext, useContext, useReducer } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { useToastCtx } from './toast'

export { acStorageKey, defaultState }

const AcContext = createContext<{
  state: AcState
  dispatch: (action: AcAction) => void
} | undefined>(undefined)
// AcContext.displayName = 'AC'

export const AcProvider: FC<PropsWithChildren> = (props) => {
  const [initState, setAcState] = useLocalStorage<AcState>(acStorageKey, defaultState)

  function reducer(state: AcState, action: AcAction) {
    const val = acReducer(state, action)
    setAcState(val)
    return val
  }

  const [state, dispatch] = useReducer(reducer, initState)
  return (
    <AcContext.Provider value={{ state, dispatch }}>
      {props.children}
    </AcContext.Provider>
  )
}

export function useAcCtx() {
  const context = useContext(AcContext)
  if (context === undefined)
    throw new Error('useAcCtx must be used within a AcProvider')

  return context
}

export function useAc() {
  const { state, dispatch } = useAcCtx()
  const { dispatch: dispatchToast } = useToastCtx()

  return {
    /**
     * 切换开关状态
     */
    toggleStatus() {
      dispatch({ type: 'toggleStatus' })
    },
    toggleMode(mode: AcMode) {
      const action: AcAction = { type: 'mode', mode }
      const nextState = acReducer(state, action)
      const notification = getAcActionNotification(state, nextState, action)

      dispatch(action)

      if (notification) {
        dispatchToast({
          type: 'update',
          payload: {
            message: notification.message,
            open: true,
            severity: notification.severity,
          },
        })
      }
    },
  }
}
