import React from 'react'
import type {
  AlertColor,
  AlertProps,
} from '@mui/material'
import {
  Alert as MuiAlert,
  Snackbar,
} from '@mui/material'
import { useToastCtx } from '~/context/toast'

const Alert = React.forwardRef<HTMLDivElement, AlertProps>((
  props,
  ref,
) => {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

const Toast: React.FC<{ severity?: AlertColor }> = (props) => {
  const { state, dispatch } = useToastCtx()

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      open={state.open}
      autoHideDuration={6000}
      onClose={() => {
        dispatch({ type: 'open', open: false })
      }}
    >
      <Alert
        onClose={() => {
          dispatch({ type: 'open', open: false })
        }}
        severity={props.severity || state.severity || 'error'}
        style={{ width: '100%', minWidth: 318 }}
      >
        {state.message}
      </Alert>
    </Snackbar>
  )
}

export default Toast
