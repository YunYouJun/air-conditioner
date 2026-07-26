import { blue, green, red } from '@mui/material/colors'
import { createAcAudioController } from '@yunlefun-home/air-conditioner-core'

import React from 'react'
import { useAc, useAcCtx } from '~/context'
import { getAssetsUrl } from '~/utils'
import RCButton from './RCButton'

import { useAcTemperature } from './temperature'
import './index.scss'

let audioController: ReturnType<typeof createAcAudioController> | undefined

function getAudioController() {
  audioController ||= createAcAudioController({
    start: document.getElementById('ac-work') as HTMLAudioElement | null,
    work: document.getElementById('air-extractor-fan') as HTMLAudioElement | null,
    beep: document.getElementById('di') as HTMLAudioElement | null,
  })

  return audioController
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
    </div>
  )
}

export default RemoteControl
