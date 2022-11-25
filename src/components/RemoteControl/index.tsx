import React, { useCallback } from 'react'

import { blue, green, red } from '@mui/material/colors'
import RCButton from './RCButton'
import { useAcTemperature } from './temperature'

import './index.scss'
import { useAc, useAcCtx } from '~/context'
import { useSound } from '~/context/sound'
import { getAssetsUrl } from '~/utils'

const SOUND_DI_PATH = getAssetsUrl('/assets/audio/di.m4a')

/**
 * 遥控
 * @param {*} props
 */
const RemoteControl: React.FC<React.PropsWithChildren<{
  isExtra?: boolean
}>> = (props) => {
  const { toggleStatus, toggleMode } = useAc()
  const { stopSound, playStartSound } = useSound()
  const { state: ac } = useAcCtx()

  const { increase, decrease } = useAcTemperature()
  /**
    * 判断是否为远程遥控器
  */
  const { isExtra } = props
  /**
    * 切换空调工作状态
  */
  const toggleAC = useCallback((status: boolean) => {
    // 如果是远程遥控器，不进行直接切换，而是通过存储监听触发soundContext中的方法
    if (isExtra)
      return
    if (status)
      stopSound()
    else
      playStartSound()
  }, [stopSound, playStartSound])

  return (
    <div className="flex my-6 flex-col items-center">
      <div>
        <audio id="di" src={SOUND_DI_PATH} preload="auto"></audio>
        {' '}
        <RCButton
          aria-label="cold"
          style={{
            color: 'white',
            backgroundColor: blue[700],
          }}
          onClick={() => {
            toggleMode('cold')
          }}
        >
          <div className="i-ic-round-ac-unit text-2xl" />
        </RCButton>
        <RCButton
          aria-label="add"
          onClick={() => {
            toggleAC(ac.status)
            toggleStatus()
          }}
          style={{
            backgroundColor: ac.status ? red[600] : green[600],
            color: 'white',
          }}
        >
          <div className="i-ic:round-power-settings-new text-2xl" />
        </RCButton>
        <RCButton
          aria-label="hot"
          style={{ backgroundColor: 'orange', color: 'white' }}
          onClick={() => {
            toggleMode('hot')
          }}
        >
          <div className="i-ic-round-wb-sunny text-2xl" />
        </RCButton>
      </div>
      <RCButton
        aria-label="add"
        onClick={increase}
      >
        <div className="i-mdi-triangle-small-up text-4xl" />
      </RCButton>
      <RCButton
        aria-label="reduce"
        onClick={decrease}
      >
        <div className="i-mdi-triangle-small-down text-4xl" />
      </RCButton>
    </div>
  )
}

export default RemoteControl
