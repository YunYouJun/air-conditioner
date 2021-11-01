import { AlertColor } from '@mui/material'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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

const initialState: ToastState = {
  open: false,
  message: '',
  severity: 'error',
}

export const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    /**
     * 设置提示框内容
     * @param state
     * @param action
     */
    setMessage(state, action: PayloadAction<string>) {
      state.message = action.payload
    },
    /**
     * 设置提示框是否显示
     * @param state
     * @param action
     */
    setOpen(state, action: PayloadAction<boolean>) {
      state.open = action.payload
    },
    setSeverity(state, action: PayloadAction<AlertColor>) {
      state.severity = action.payload
    },
  },
})

export const { setMessage, setOpen, setSeverity } = toastSlice.actions

export default toastSlice.reducer
