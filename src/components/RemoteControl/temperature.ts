import acStore, { acDecrement, acIncrement } from '~/store/ac'

import { updateToastState } from '~/store/toast'
export const maxTemperature = 31
export const minTemperature = 16

export function useAcTemperature() {
  /**
   * 增加温度
   * @returns
   */
  const increase = () => {
    if (acStore.temperature < maxTemperature) {
      acIncrement()
    }
    else {
      updateToastState({
        message: '已经是最大温度啦！',
        open: true,
        severity: 'error',
      })
    }
  }

  /**
   * 降低温度
   * @returns
   */
  const decrease = () => {
    if (acStore.temperature > minTemperature) {
      acDecrement()
    }
    else {
      updateToastState({
        message: '已经是最小温度啦！',
        open: true,
        severity: 'error',
      })
    }
  }

  return {
    increase,
    decrease,
  }
}
