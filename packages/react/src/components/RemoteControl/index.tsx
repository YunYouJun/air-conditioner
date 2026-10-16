import type { AcSoundMode } from '@yunlefun-home/air-conditioner-core'
import { blue, green, grey, red } from '@mui/material/colors'
import { acSoundModeLabels, nextAcSoundMode } from '@yunlefun-home/air-conditioner-core'

import React, { useEffect } from 'react'
import { useAc, useAcCtx } from '~/context'
import { getAssetsUrl } from '~/utils'
import { getAudioController } from './audio'
import RCButton from './RCButton'

import { useAcTemperature } from './temperature'
import './index.scss'

/**
 * 声音键图标（完整类名写出来，UnoCSS 才能扫描到）
 */
const soundIcons: Record<AcSoundMode, string> = {
  normal: 'i-ic-round-volume-up',
  sleep: 'i-ic-round-bedtime',
  mute: 'i-ic-round-volume-off',
}

const soundColors: Record<AcSoundMode, string> = {
  normal: grey[700],
  sleep: '#5e35b1',
  mute: grey[500],
}

/**
 * 切换空调工作状态
 */
function toggleAC(status: boolean) {
  getAudioController().toggleStatusAudio(status)
}

const SOUND_DI_PATH = getAssetsUrl('/assets/audio/di.m4a')
const SOUND_AC_WORK_PATH = getAssetsUrl('/assets/audio/ac-work.m4a')
const SOUND_AIR_EXTRACTOR_FAN_PATH = getAssetsUrl(
  '/assets/audio/air-extractor-fan.m4a',
)

/**
 * 遥控
 */
const RemoteControl: React.FC = () => {
  const { toggleStatus, toggleMode, cycleSound } = useAc()
  const { state: ac } = useAcCtx()
  const sound = ac.sound

  const { increase, decrease } = useAcTemperature()

  // 同步声音模式：包括页面加载时恢复的状态，以及独立遥控器在其他标签页的修改
  useEffect(() => {
    getAudioController(sound).setSoundMode(sound)
  }, [sound])

  return (
    <div className="flex my-6 flex-col items-center">
      <audio id="di" src={SOUND_DI_PATH} preload="auto"></audio>
      <audio id="ac-work" src={SOUND_AC_WORK_PATH} preload="auto"></audio>
      <audio
        id="air-extractor-fan"
        src={SOUND_AIR_EXTRACTOR_FAN_PATH}
        preload="auto"
      >
      </audio>
      <div>
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
          aria-label="power"
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
      <RCButton
        aria-label="sound"
        title={`声音：${acSoundModeLabels[sound]}`}
        size="small"
        beep={false}
        style={{ color: soundColors[sound] }}
        onClick={() => {
          // 先切换音量再「嘀」，按键音就是新模式下的音量
          const controller = getAudioController(sound)
          controller.setSoundMode(nextAcSoundMode(sound))
          controller.beep()
          cycleSound()
        }}
      >
        <div className={`${soundIcons[sound]} text-xl`} />
      </RCButton>
    </div>
  )
}

export default RemoteControl
