import { useAcCtx } from '~/context'
import { useToastCtx } from '~/context/toast'

export const maxTemperature = 31
export const minTemperature = 16

export function useAcTemperature() {
  const { state, dispatch } = useAcCtx()
  const { dispatch: dispatchToast } = useToastCtx()

  /**
   * 增加温度
   * @returns
   */
  const increase = () => {
    if (state.temperature < maxTemperature) {
      dispatch({ type: 'increment' })
    }
    else {
      dispatchToast({
        type: 'update',
        payload: {
          message: '已经是最大温度啦！',
          open: true,
          severity: 'error',
        },
      })
    }
  }

  /**
   * 降低温度
   * @returns
   */
  const decrease = () => {
    if (state.temperature > minTemperature) {
      dispatch({ type: 'decrement' })
    }
    else {
      dispatchToast({
        type: 'update',
        payload: {
          message: '已经是最小温度啦！',
          open: true,
          severity: 'error',
        },
      })
    }
  }

  return {
    increase,
    decrease,
  }
}
