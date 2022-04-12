import type { FC } from 'react'
import { createContext, useContext, useReducer } from 'react'

import type { AlertColor } from '@mui/material'

export interface ToastState {
  /**
   * 是否打开
   */
  open: boolean
  /**
   * 消息内容
   */
  message: string
  /**
   * 提示类型
   */
  severity: AlertColor
}

const ToastContext = createContext<{
  state: ToastState
  dispatch: (action: ToastAction) => void
} | undefined>(undefined)
ToastContext.displayName = 'toast'

const initialState: ToastState = {
  open: false,
  message: '',
  severity: 'error',
}

type ToastAction = {
  type: 'message'
  message: ToastState['message']
} | {
  type: 'open'
  open: ToastState['open']
} | {
  type: 'severity'
  severity: ToastState['severity']
} | {
  type: 'update'
  payload: Partial<ToastState>
}

export const toastReducer = (state: ToastState, action: ToastAction) => {
  switch (action.type) {
    case 'message':
      return { ...state, message: action.message }
    case 'open':
      return { ...state, open: action.open }
    case 'severity':
      return { ...state, severity: action.severity }
    case 'update':
      return { ...state, ...action.payload }
    default:
      throw new Error('Unexpected Toast Action')
  }
}

export const ToastProvider: FC = ({ children }) => {
  const [state, dispatch] = useReducer(toastReducer, initialState)

  return (
    <ToastContext.Provider value={{ state, dispatch }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastCtx() {
  const context = useContext(ToastContext)
  if (context === undefined)
    throw new Error('useToast must be used within a ToastProvider')

  return context
}
