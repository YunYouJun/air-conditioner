import React from 'react'
import { Box } from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import WbSunnyIcon from '@mui/icons-material/WbSunny'

import { blue, green, red } from '@mui/material/colors'
import { RCButton } from './RCButton'
import { useAppDispatch, useAppSelector } from '~/app/hooks'
import {
  decreaseTemperature,
  increaseTemperature,
  toggleMode,
  toggleStatus,
} from '~/features/ac/acSlice'
import { RootState } from '~/app/store'
import { getAssetsUrl } from '~/utils'

import './index.scss'

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
function toggleAC(status: boolean, dispatch: any) {
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

  dispatch(toggleStatus())
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
export const RemoteControl: React.FC = () => {
  const ac = useAppSelector((state: RootState) => state.ac)
  const dispatch = useAppDispatch()

  return (
    <Box my={4} display="flex" flexDirection="column" alignItems="center">
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
            dispatch(toggleMode('cold'))
          }}
        >
          <AcUnitIcon />
        </RCButton>
        <RCButton
          aria-label="add"
          onClick={() => {
            toggleAC(ac.status, dispatch)
          }}
          style={{
            backgroundColor: ac.status ? red[600] : green[600],
            color: 'white',
          }}
        >
          <PowerSettingsNewIcon />
        </RCButton>
        <RCButton
          aria-label="hot"
          style={{ backgroundColor: 'orange', color: 'white' }}
          onClick={() => {
            dispatch(toggleMode('hot'))
          }}
        >
          <WbSunnyIcon />
        </RCButton>
      </div>
      <RCButton
        aria-label="add"
        onClick={() => {
          dispatch(increaseTemperature())
        }}
      >
        <ExpandLessIcon />
      </RCButton>
      <RCButton
        aria-label="reduce"
        onClick={() => {
          dispatch(decreaseTemperature())
        }}
      >
        <ExpandMoreIcon />
      </RCButton>
    </Box>
  )
}

export default RemoteControl
