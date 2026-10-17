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
  const { notify } = useToastCtx()

  /**
   * 增加温度
   */
  const increase = () => {
    const action: AcAction = { type: 'increment' }
    const nextState = acReducer(state, action)
    const notification = getAcActionNotification(state, nextState, action)

    dispatch(action)

    // 到上下限时遥控器小屏抖一下（见 Toast / RemoteControl）
    if (notification)
      notify(notification, nextState)
  }

  /**
   * 降低温度
   */
  const decrease = () => {
    const action: AcAction = { type: 'decrement' }
    const nextState = acReducer(state, action)
    const notification = getAcActionNotification(state, nextState, action)

    dispatch(action)

    // 到上下限时遥控器小屏抖一下（见 Toast / RemoteControl）
    if (notification)
      notify(notification, nextState)
  }

  return {
    increase,
    decrease,
  }
}
