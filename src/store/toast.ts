import type { AlertColor } from '@mui/material'
import { proxy } from 'valtio'

import type { ToastState } from '~/types'

const toastStore = proxy<ToastState>({
  open: false,
  message: '',
  severity: 'error',
})

export const changeMessage = (message: string) => {
  toastStore.message = message
}
export const changeOpen = (open: boolean) => {
  toastStore.open = open
}
export const changeSeverity = (severity: AlertColor) => {
  toastStore.severity = severity
}
export const updateToastState = (toastState: ToastState) => {
  toastStore.open = toastState.open
  toastStore.message = toastState.message
  toastStore.severity = toastState.severity
}
export default toastStore
