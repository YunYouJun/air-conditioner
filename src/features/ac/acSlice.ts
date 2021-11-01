import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { setMessage, setOpen, setSeverity } from '../toast/toastSlice'
import { AppThunk, RootState } from '~/app/store'

export type AcMode = 'cold' | 'hot'
export interface AcState {
  /**
   * 状态
   */
  status: boolean
  /**
   * 模式
   */
  mode: AcMode
  /**
   * 温度
   */
  temperature: number
}

const namespace = 'ac-'

export const acItemKey = {
  status: `${namespace}status`,
  mode: `${namespace}mode`,
  temperature: `${namespace}temperature`,
}

// https://baike.baidu.com/item/26度空调节能倡导行动
const defaultTemperature = 26

const initialState: AcState = {
  status: false,
  mode: (localStorage.getItem(acItemKey.mode) as AcMode) || 'cold',
  temperature:
    parseInt(localStorage.getItem(acItemKey.temperature) || '')
    || defaultTemperature,
}

const maxTemperature = 31
const minTemperature = 16

export const acSlice = createSlice({
  name: 'ac',
  initialState,
  reducers: {
    /**
     * 设置状态
     * @param state
     * @param action
     */
    setStatus(state, action: PayloadAction<boolean>) {
      state.status = action.payload
    },
    /**
     * 设置温度
     * @param state
     * @param action
     */
    setTemperature(state, action: PayloadAction<number>) {
      state.temperature = action.payload
    },
    /**
     * 增加温度
     * @param state
     */
    increment: (state) => {
      state.temperature += 1
      localStorage.setItem(acItemKey.temperature, state.temperature.toString())
    },

    /**
     * 降低温度
     * @param state
     */
    decrement: (state) => {
      state.temperature -= 1
      localStorage.setItem(acItemKey.temperature, state.temperature.toString())
    },

    /**
     * 设置空调模式
     * @param state
     * @param action
     */
    setMode(state, action: PayloadAction<AcMode>) {
      state.mode = action.payload
      localStorage.setItem(acItemKey.mode, state.mode)
    },

    /**
     * 切换开关状态
     * @param state
     * @param action
     */
    toggleStatus(state) {
      state.status = !state.status
      localStorage.setItem(acItemKey.status, state.status.toString())
    },
  },
})

export const selectTemperature = (state: RootState) => state.ac.temperature

export const {
  setTemperature,
  increment,
  decrement,
  setMode,
  toggleStatus,
  setStatus,
} = acSlice.actions

/**
 * 增加温度
 * @returns
 */
export const increaseTemperature = (): AppThunk => (dispatch, getState) => {
  const currentValue = selectTemperature(getState())
  if (currentValue < maxTemperature) {
    dispatch(increment())
  }
  else {
    dispatch(setMessage('已经是最大温度啦！'))
    dispatch(setOpen(true))
    dispatch(setSeverity('error'))
  }
}

/**
 * 降低温度
 * @returns
 */
export const decreaseTemperature = (): AppThunk => (dispatch, getState) => {
  const currentValue = selectTemperature(getState())
  if (currentValue > minTemperature) {
    dispatch(decrement())
  }
  else {
    dispatch(setMessage('已经是最小温度啦！'))
    dispatch(setOpen(true))
    dispatch(setSeverity('error'))
  }
}

/**
 * 切换模式
 * @param mode
 * @returns
 */
export const toggleMode
  = (mode: AcMode): AppThunk =>
    (dispatch, getState) => {
      dispatch(setMode(mode))
      const currentTemperature = selectTemperature(getState())
      const goodColdTemperature = 26
      const goodHotTemperature = 20

      const recommendedSlogan = (mode: AcMode, temperature: number) =>
        `建议将空调的制${
          mode === 'cold' ? '冷' : '热'
        }温度调至 ${temperature} 度以${
          mode === 'cold' ? '上' : '下'
        }，为节能减排贡献一份力量！`

      if (mode === 'cold' && currentTemperature < goodColdTemperature) {
        dispatch(setMessage(recommendedSlogan('cold', goodColdTemperature)))
        dispatch(setOpen(true))
        dispatch(setSeverity('success'))
      }
      else if (mode === 'hot' && currentTemperature > goodHotTemperature) {
        dispatch(setMessage(recommendedSlogan('hot', goodHotTemperature)))
        dispatch(setOpen(true))
        dispatch(setSeverity('success'))
      }
    }

export default acSlice.reducer
