import React, { memo } from 'react'
import { getAssetsUrl } from '~/utils'

const SOUND_AC_WORK_PATH = getAssetsUrl('/assets/audio/ac-work.m4a')
const SOUND_AIR_EXTRACTOR_FAN_PATH = getAssetsUrl(
  '/assets/audio/air-extractor-fan.m4a',
)
/**
 * 空调内部音响
 */
const Sound: React.FC = memo(() => {
  return (
    <div>
      <audio id="ac-work" src={SOUND_AC_WORK_PATH} preload="auto"></audio>
      <audio
        id="air-extractor-fan"
        src={SOUND_AIR_EXTRACTOR_FAN_PATH}
        preload="auto"
      ></audio>
    </div >
  )
})

export default Sound
