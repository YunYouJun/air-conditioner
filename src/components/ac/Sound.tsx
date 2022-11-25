import React, { memo, useEffect } from 'react'
import { getAssetsUrl } from '~/utils'
import { useSound } from '~/context/sound'

const SOUND_AC_WORK_PATH = getAssetsUrl('/assets/audio/ac-work.m4a')
const SOUND_AIR_EXTRACTOR_FAN_PATH = getAssetsUrl(
  '/assets/audio/air-extractor-fan.m4a',
)
/**
 * 空调内部音响
 */
const Sound: React.FC = memo(() => {
  const { setAcWorkEl, setAirExtractorFanEl } = useSound()
  useEffect(() => {
    setAcWorkEl(document.querySelector('#ac-work') as any)
    setAirExtractorFanEl(document.querySelector('#air-extractor-fan') as HTMLAudioElement)
  }, [])
  return (
    <div>
      {/* di声放在遥控器自身上了 */}
      {/* <audio id="di" src={SOUND_DI_PATH} preload="auto"></audio> */}
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
