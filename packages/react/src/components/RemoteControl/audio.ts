import type { AcFanSpeed, AcSoundMode } from '@yunlefun-home/air-conditioner-core'
import { createAcAudioController } from '@yunlefun-home/air-conditioner-core'

let audioController: ReturnType<typeof createAcAudioController> | undefined

/**
 * 页面内共用的音频控制器，首次调用时读取遥控器渲染的 `<audio>` 元素。
 *
 * 创建就会开始解码「嘀」声，但要等按下时的 `resume()` 才出声。
 * 遥控器在绘制后就会调用一次，这样第一次点击时 buffer 通常已经就绪。
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

/**
 * 已经创建的音频控制器；还没有任何操作时返回 undefined（浏览器要求先有用户手势才能出声）。
 */
export function peekAudioController() {
  return audioController
}
