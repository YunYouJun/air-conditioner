import { proxy } from 'valtio'

import type { ToastState } from '~/types'

const toastStore = proxy<ToastState>({
  open: false,
  message: '',
  severity: 'error',
})

export const updateToastState = (toastState: ToastState) => {
  toastStore.open = toastState.open
  toastStore.message = toastState.message
  toastStore.severity = toastState.severity
}
export default toastStore
