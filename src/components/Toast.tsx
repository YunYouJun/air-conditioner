import React from 'react'
import type {
  AlertColor,
  AlertProps,
} from '@mui/material'
import {
  Alert as MuiAlert,
  Snackbar,
} from '@mui/material'
import { useSnapshot } from 'valtio'
import toastStore, { updateToastState } from '~/store/toast'
const Alert = React.forwardRef<HTMLDivElement, AlertProps>((
  props,
  ref,
) => {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

const Toast: React.FC<{ severity?: AlertColor }> = (props) => {
  const toastSnapshot = useSnapshot(toastStore)
  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      open={toastSnapshot.open}
      autoHideDuration={6000}
      onClose={() => {
        updateToastState({
          ...toastSnapshot,
          open: false,
        })
      }}
    >
      <Alert
        onClose={() => {
          updateToastState({
            ...toastSnapshot,
            open: false,
          })
        }}
        severity={props.severity || toastSnapshot.severity || 'error'}
        style={{ width: '100%', minWidth: 318 }}
      >
        {toastSnapshot.message}
      </Alert>
    </Snackbar>
  )
}

export default Toast
