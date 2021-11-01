import React from 'react'
import { Fab } from '@mui/material'

/**
 * 播放「嘀」的音效
 */
function playDi() {
  const di = document.getElementById('di')
  if (di)
    (di as HTMLAudioElement).play()
}

/**
 * 遥控器按钮
 * @param props
 */
export const RCButton: React.FC<{
  onClick?: () => void
  style?: React.CSSProperties
}> = (props) => {
  return (
    <Fab
      className="rc-button"
      {...props}
      onClick={() => {
        playDi()
        props.onClick && props.onClick()
      }}
    ></Fab>
  )
}
