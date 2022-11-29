import { proxy } from 'valtio'
import type { ISoundState } from '~/types'

// 噪音起始时间
const noiseStartTime = 2
// 噪音持续时间
const noiseDuration = 56

const soundStore = proxy<ISoundState>({
  playStartSoundTimeoutId: null,
  playWorkSoundTimeoutId: null,
  playWorkSoundIntervalId: null,
})

const playWorkSound = () => {
  const airExtractorFanEl = document.querySelector('#air-extractor-fan') as HTMLAudioElement
  airExtractorFanEl.load()
  airExtractorFanEl.play()

  soundStore.playWorkSoundTimeoutId = setTimeout(() => {
    soundStore.playWorkSoundIntervalId = setInterval(() => {
      airExtractorFanEl.currentTime = noiseStartTime
    }, noiseDuration * 1000)
  }, noiseStartTime * 1000)
}

/**
 * 开始播放空调工作声音
*/
export const startSound = () => {
  const acWorkEl = document.querySelector('#ac-work') as HTMLAudioElement
  acWorkEl.load()
  acWorkEl.play()

  soundStore.playStartSoundTimeoutId = setTimeout(() => {
    playWorkSound()
  }, 8000)
}
/**
 * 停止播放空调工作声音
*/
export const stopSound = () => {
  const acWorkEl = document.querySelector('#ac-work') as HTMLAudioElement
  acWorkEl.load()
  const airExtractorFanEl = document.querySelector('#air-extractor-fan') as HTMLAudioElement

  airExtractorFanEl.currentTime = noiseStartTime + noiseDuration
  clearInterval(soundStore.playStartSoundTimeoutId)
  clearInterval(soundStore.playWorkSoundIntervalId)
  clearInterval(soundStore.playWorkSoundTimeoutId)
  soundStore.playStartSoundTimeoutId = null
  soundStore.playWorkSoundIntervalId = null
  soundStore.playWorkSoundTimeoutId = null
}

export default soundStore
