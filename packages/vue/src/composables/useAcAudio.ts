import type { AcAudioController, AcAudioElements, AcChangeEvent, AcFanSpeed, AcSoundMode } from '@yunlefun-home/air-conditioner-core'
import { createAcAudioController } from '@yunlefun-home/air-conditioner-core'
import { onUnmounted } from 'vue'

/**
 * 将 core 的音频控制器接入 Vue 组件。
 *
 * 音频元素挂载后调用 `prepare()` 开始解码（不会出声）。若还没准备好，
 * 第一次状态变更时再创建控制器。
 *
 * @param getElements 返回当前音频元素引用的函数
 */
export function useAcAudio(getElements: () => AcAudioElements) {
  let controller: AcAudioController | undefined

  function ensureController(soundMode: AcSoundMode, fanSpeed: AcFanSpeed) {
    controller ||= createAcAudioController(getElements(), { soundMode, fanSpeed })
    return controller
  }

  /**
   * 提前创建控制器并开始解码。元素还没挂上时什么都不做，避免把空引用缓存下来。
   */
  function prepare(soundMode: AcSoundMode = 'normal', fanSpeed: AcFanSpeed = 'auto') {
    if (controller)
      return controller

    const elements = getElements()
    if (!elements.beep && !elements.start && !elements.work)
      return undefined

    return ensureController(soundMode, fanSpeed)
  }

  /**
   * 响应一次状态变更：先同步声音模式，再播放按键「嘀」声；若开关状态发生翻转，
   * 则播放启动 / 关闭音效。
   */
  function handleChange(event: AcChangeEvent) {
    const ctrl = ensureController(event.state.sound, event.state.fan ?? 'auto')
    if (event.previousState.sound !== event.state.sound)
      ctrl.setSoundMode(event.state.sound)
    if (event.previousState.fan !== event.state.fan)
      ctrl.setFanSpeed(event.state.fan ?? 'auto')
    ctrl.beep()

    if (event.previousState.status !== event.state.status)
      ctrl.toggleStatusAudio(event.previousState.status)
  }

  /**
   * 冷凝水落下时「嗒」一声。上下文还被自动播放策略挂起时不会发声。
   */
  function drip() {
    controller?.drip()
  }

  onUnmounted(() => {
    controller?.dispose()
  })

  return {
    handleChange,
    drip,
    prepare,
  }
}
