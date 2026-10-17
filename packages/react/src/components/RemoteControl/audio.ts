import type { AcFanSpeed, AcSoundMode } from '@yunlefun-home/air-conditioner-core'
import { createAcAudioController } from '@yunlefun-home/air-conditioner-core'

let audioController: ReturnType<typeof createAcAudioController> | undefined

/**
 * 页面内共用的音频控制器，首次调用时读取遥控器渲染的 `<audio>` 元素。
 *
 * @param soundMode 首次创建时的声音模式
 * @param fanSpeed 首次创建时的风速
 */
export function getAudioController(soundMode?: AcSoundMode, fanSpeed?: AcFanSpeed) {
  audioController ||= createAcAudioController({
    start: document.getElementById('ac-work') as HTMLAudioElement | null,
    work: document.getElementById('air-extractor-fan') as HTMLAudioElement | null,
    beep: document.getElementById('di') as HTMLAudioElement | null,
  }, { soundMode, fanSpeed })

  return audioController
}
