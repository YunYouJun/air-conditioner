import type { AcNotification, AcNotificationPresentation, AcState } from '@yunlefun-home/air-conditioner-core'
import type { FC, PropsWithChildren } from 'react'
import { createAcNotificationPresenter } from '@yunlefun-home/air-conditioner-core'
import { createContext, useContext, useMemo, useState } from 'react'

export interface ToastState {
  /** 最近一条提示 */
  notification?: AcNotification
  /** 它的呈现方式：节能建议是小纸条，上下限让小屏抖一下，设置变化只播报 */
  how?: AcNotificationPresentation
  /** 每条提示自增，让同一条提示也能再次触发 */
  id: number
}

const ToastContext = createContext<{
  state: ToastState
  /** 交给 core 判断如何呈现，并记住提示过的节能建议以免重复 */
  notify: (notification: AcNotification, state: Pick<AcState, 'mode' | 'temperature'>) => void
} | undefined>(undefined)
ToastContext.displayName = 'toast'

export const ToastProvider: FC<PropsWithChildren> = ({ children }) => {
  const [present] = useState(createAcNotificationPresenter)
  const [state, setState] = useState<ToastState>({ id: 0 })
  const value = useMemo(() => ({
    state,
    notify(notification: AcNotification, acState: Pick<AcState, 'mode' | 'temperature'>) {
      const how = present(notification, acState)
      setState(previous => ({ notification, how, id: previous.id + 1 }))
    },
  }), [present, state])

  return (
    <ToastContext.Provider value={value}>
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
