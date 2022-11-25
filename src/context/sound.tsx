import type { FC, PropsWithChildren } from 'react'
import { createContext, useContext, useReducer } from 'react'

// 噪音起始时间
const noiseStartTime = 2
// 噪音持续时间
const noiseDuration = 56

interface ISoundState {
  playStartSoundTimeoutId: any
  playWorkSoundTimeoutId: any
  playWorkSoundIntervalId: any
  acWorkEl: HTMLAudioElement
  airExtractorFanEl: HTMLAudioElement
}

type SoundAction = {
  type:
  'setPlayStartSoundTimeoutId' |
  'setPlayWorkSoundTimeoutId' |
  'setPlayWorkSoundIntervalId' |
  'setAcWorkEl' |
  'setAirExtractorFanEl'
  payload: any

} | {
  type: 'closeSound'
}

const SoundContext = createContext<{
  state: ISoundState
  dispatch: (action: SoundAction) => void
} | undefined>(undefined)

export const SoundProvider: FC<PropsWithChildren> = (props) => {
  const initState: ISoundState = {
    playStartSoundTimeoutId: null,
    playWorkSoundTimeoutId: null,
    playWorkSoundIntervalId: null,
    acWorkEl: document.getElementById('ac-work') as HTMLAudioElement,
    airExtractorFanEl: document.getElementById(
      'air-extractor-fan',
    ) as HTMLAudioElement,
  }

  function soundReducer(state: ISoundState, action: SoundAction) {
    const val = { ...state }
    switch (action.type) {
      case 'setPlayStartSoundTimeoutId':
        val.playStartSoundTimeoutId = action.payload
        break
      case 'setPlayWorkSoundTimeoutId':
        val.playWorkSoundTimeoutId = action.payload
        break
      case 'setPlayWorkSoundIntervalId':
        val.playWorkSoundIntervalId = action.payload
        break
      case 'setAcWorkEl':
        val.acWorkEl = action.payload
        break
      case 'setAirExtractorFanEl':
        val.airExtractorFanEl = action.payload
        break
      case 'closeSound':
        val.playStartSoundTimeoutId = null
        val.playWorkSoundTimeoutId = null
        val.playWorkSoundIntervalId = null
        break
      default:
        throw new Error('Unexpected Sound Action')
    }

    return val
  }

  const [state, dispatch] = useReducer(soundReducer, initState)
  return (
    <SoundContext.Provider value={{ state, dispatch }}>
      {props.children}
    </SoundContext.Provider>
  )
}
export function useSoundCtx() {
  const context = useContext(SoundContext)
  if (context === undefined)
    throw new Error('useSoundCtx must be used within a SoundProvider')

  return context
}

export function useSound() {
  const { state, dispatch } = useSoundCtx()

  /**
     * 设置PlayStartSoundTimeoutId
     */
  function setPlayStartSoundTimeoutId(payload: any) {
    dispatch({
      type: 'setPlayStartSoundTimeoutId',
      payload,
    })
  }
  /**
   * 设置playWorkSoundTimeoutId
   */
  function setPlayWorkSoundTimeoutId(payload: any) {
    dispatch({
      type: 'setPlayWorkSoundTimeoutId',
      payload,
    })
  }
  /**
   * 设置playWorkSoundIntervalId
   */
  function setPlayWorkSoundIntervalId(payload: any) {
    dispatch({
      type: 'setPlayWorkSoundIntervalId',
      payload,
    })
  }
  /**
    * 播放空调工作声音
  */
  function playWorkSound() {
    const acWork = state.airExtractorFanEl
    acWork.load()
    acWork.play()

    const playWorkSoundTimeoutId = setTimeout(() => {
      const playWorkSoundIntervalId = setInterval(() => {
        acWork.currentTime = noiseStartTime
      }, noiseDuration * 1000)
      setPlayWorkSoundIntervalId(playWorkSoundIntervalId)
    }, noiseStartTime * 1000)

    setPlayWorkSoundTimeoutId(playWorkSoundTimeoutId)
  }

  return {
    state,
    /**
     * 取消所有定时器，关闭声音
     */
    stopSound() {
      state.acWorkEl.load()
      const acWork = state.airExtractorFanEl
      acWork.currentTime = noiseStartTime + noiseDuration
      clearInterval(state.playStartSoundTimeoutId)
      clearInterval(state.playWorkSoundIntervalId)
      clearInterval(state.playWorkSoundTimeoutId)
      dispatch({ type: 'closeSound' })
    },
    /**
     * 播放空调启动声音
    */
    playStartSound() {
      const acStart = state.acWorkEl
      acStart.load()
      acStart.play()

      const playStartSoundTimeoutId = setTimeout(() => {
        playWorkSound()
      }, 8000)
      setPlayStartSoundTimeoutId(playStartSoundTimeoutId)
    },

    /**
     * setAcWorkEl
     */
    setAcWorkEl(el: HTMLAudioElement) {
      dispatch({ type: 'setAcWorkEl', payload: el })
    },
    /**
    * setAirExtractorFanEl
    */
    setAirExtractorFanEl(el: HTMLAudioElement) {
      dispatch({ type: 'setAirExtractorFanEl', payload: el })
    },

  }
}
