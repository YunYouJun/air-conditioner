import type { AcAction } from '@yunlefun-home/air-conditioner-core'
import {
  acReducer,
  getAcActionNotification,
  maxTemperature,
  minTemperature,
} from '@yunlefun-home/air-conditioner-core'
import { useAcCtx } from '~/context'
import { useToastCtx } from '~/context/toast'

export { maxTemperature, minTemperature }

export function useAcTemperature() {
  const { state, dispatch } = useAcCtx()
  const { dispatch: dispatchToast } = useToastCtx()

  /**
   * 增加温度
   */
  const increase = () => {
    const action: AcAction = { type: 'increment' }
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

  /**
   * 降低温度
   */
  const decrease = () => {
    const action: AcAction = { type: 'decrement' }
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
    increase,
    decrease,
  }
}
