import { Fab } from '@mui/material'
import React from 'react'
import { getAudioController } from './audio'

/**
 * 遥控器按钮
 * @param props
 */
const RCButton: React.FC<React.PropsWithChildren<{
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
  title?: string
  size?: 'small' | 'medium' | 'large'
  /**
   * 是否在点击时播放「嘀」声；自行处理音效的按钮（如声音键）传 false
   * @default true
   */
  beep?: boolean
}>> = (props) => {
  const { beep = true, ...rest } = props

  return (
    <Fab
      className={`rc-button ${props.className}`}
      {...rest}
      onClick={() => {
        if (beep)
          getAudioController().beep()
        props.onClick && props.onClick()
      }}
    >
    </Fab>
  )
}

export default RCButton
