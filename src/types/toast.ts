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
