import type { AcAction, AcMode, AcState } from '@yunlefun-home/air-conditioner-core'
import type { FC, PropsWithChildren } from 'react'
import {
  acReducer,
  acStorageKey,
  defaultAcState as defaultState,
  getAcActionNotification,
  normalizeAcState,
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

  // 旧版本保存的状态没有 sound 等新字段，读取时补齐
  const [state, dispatch] = useReducer(reducer, initState, normalizeAcState)
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

  function dispatchWithToast(action: AcAction) {
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
  }

  return {
    /**
     * 切换开关状态
     */
    toggleStatus() {
      dispatch({ type: 'toggleStatus' })
    },
    toggleMode(mode: AcMode) {
      dispatchWithToast({ type: 'mode', mode })
    },
    /**
     * 声音键：标准 → 睡眠 → 静音
     */
    cycleSound() {
      dispatchWithToast({ type: 'cycleSound' })
    },
    /**
     * 扫风键：出风左右摆动 / 停在当前位置
     */
    toggleSwing() {
      dispatchWithToast({ type: 'toggleSwing' })
    },
    /**
     * 风速键：自动 → 低 → 中 → 高
     */
    cycleFan() {
      dispatchWithToast({ type: 'cycleFan' })
    },
  }
}
