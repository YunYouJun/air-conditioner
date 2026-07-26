import type { AcAudioController, AcAudioElements, AcChangeEvent } from '@yunlefun-home/air-conditioner-core'
import { createAcAudioController } from '@yunlefun-home/air-conditioner-core'
import { onUnmounted } from 'vue'

/**
 * 将 core 的音频控制器接入 Vue 组件。
 *
 * 音频元素通常在交互后才挂载完成，因此采用惰性创建：首次收到
 * 状态变更事件时再读取 DOM 引用并初始化控制器。
 *
 * @param getElements 返回当前音频元素引用的函数
 */
export function useAcAudio(getElements: () => AcAudioElements) {
  let controller: AcAudioController | undefined

  function ensureController() {
    controller ||= createAcAudioController(getElements())
    return controller
  }

  /**
   * 响应一次状态变更：播放按键「嘀」声；若开关状态发生翻转，
   * 则播放启动 / 关闭音效。
   */
  function handleChange(event: AcChangeEvent) {
    const ctrl = ensureController()
    ctrl.beep()

    if (event.previousState.status !== event.state.status)
      ctrl.toggleStatusAudio(event.previousState.status)
  }

  onUnmounted(() => {
    controller?.dispose()
  })

  return {
    handleChange,
  }
}
