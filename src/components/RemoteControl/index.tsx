import React from 'react'

import { blue, green, red } from '@mui/material/colors'
import RCButton from './RCButton'
import { useAcTemperature } from './temperature'
import { getAssetsUrl } from '~/utils'

import './index.scss'
import { useAc, useAcCtx } from '~/context'

let playStartSoundTimeoutId: any
let playWorkSoundTimeoutId: any
let playWorkSoundIntervalId: any

/**
 * 播放空调启动声音
 */
function playStartSound() {
  const acStart = document.getElementById('ac-work') as HTMLAudioElement
  acStart.load()
  acStart.play()

  playStartSoundTimeoutId = setTimeout(() => {
    playWorkSound()
  }, 8000)
}

// 噪音起始时间
const noiseStartTime = 2
// 噪音持续时间
const noiseDuration = 56

/**
 * 播放空调工作声音
 */
function playWorkSound() {
  const acWork = document.getElementById(
    'air-extractor-fan',
  ) as HTMLAudioElement
  acWork.load()
  acWork.play()

  playWorkSoundTimeoutId = setTimeout(() => {
    playWorkSoundIntervalId = setInterval(() => {
      acWork.currentTime = noiseStartTime
    }, noiseDuration * 1000)
  }, noiseStartTime * 1000)
}

/**
 * 切换空调工作状态
 * @param {*} props
 */
function toggleAC(status: boolean) {
  if (status) {
    (document.getElementById('ac-work') as HTMLAudioElement).load()
    const acWork = document.getElementById(
      'air-extractor-fan',
    ) as HTMLAudioElement
    if (playStartSoundTimeoutId)
      clearTimeout(playStartSoundTimeoutId)

    if (playWorkSoundTimeoutId)
      clearTimeout(playWorkSoundTimeoutId)

    if (playWorkSoundIntervalId)
      clearInterval(playWorkSoundIntervalId)

    acWork.currentTime = noiseStartTime + noiseDuration
  }
  else {
    playStartSound()
  }
}

const SOUND_DI_PATH = getAssetsUrl('/assets/audio/di.m4a')
const SOUND_AC_WORK_PATH = getAssetsUrl('/assets/audio/ac-work.m4a')
const SOUND_AIR_EXTRACTOR_FAN_PATH = getAssetsUrl(
  '/assets/audio/air-extractor-fan.m4a',
)

/**
 * 遥控
 * @param {*} props
 */
const RemoteControl: React.FC = () => {
  const { toggleStatus, toggleMode } = useAc()
  const { state: ac } = useAcCtx()

  const { increase, decrease } = useAcTemperature()

  return (
    <div className="flex my-6 flex-col items-center">
      <audio id="di" src={SOUND_DI_PATH} preload="auto"></audio>
      <audio id="ac-work" src={SOUND_AC_WORK_PATH} preload="auto"></audio>
      <audio
        id="air-extractor-fan"
        src={SOUND_AIR_EXTRACTOR_FAN_PATH}
        preload="auto"
      ></audio>
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
