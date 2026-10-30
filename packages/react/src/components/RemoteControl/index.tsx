import type { AcRemoteCommand } from '@yunlefun-home/air-conditioner-core'
import { nextAcSoundMode } from '@yunlefun-home/air-conditioner-core'

import React, { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAc, useAcCtx } from '~/context'
import { useToastCtx } from '~/context/toast'
import { useLcdAlert } from '~/lib/BreezeNote'
import { RemoteControlView } from '~/lib/RemoteControlView'
import { getAssetsUrl } from '~/utils'
import { getAudioController } from './audio'

import { useAcTemperature } from './temperature'

const SOUND_DI_PATH = getAssetsUrl('/assets/audio/di.m4a')
const SOUND_AC_WORK_PATH = getAssetsUrl('/assets/audio/ac-work.m4a')
const SOUND_AIR_EXTRACTOR_FAN_PATH = getAssetsUrl(
  '/assets/audio/air-extractor-fan.m4a',
)

/**
 * 遥控
 */
const RemoteControl: React.FC<{
  /**
   * 是否播放空调本身的开关机与运行声。独立遥控器页面传 false，
   * 由显示空调的主页面统一发声，避免两个标签页同时响。
   * @default true
   */
  acSound?: boolean
  /**
   * 遥控器悬浮窗：遥控器画到这个窗口里（音频元素仍留在页面上，声音照常）。
   */
  floating?: Window | null
}> = ({ acSound = true, floating }) => {
  const { toggleStatus, toggleMode, cycleSound, toggleSwing, cycleFan } = useAc()
  const { state: ac } = useAcCtx()
  const { state: toast } = useToastCtx()
  // 温度到上下限：小屏抖一下，代替弹出提示
  const alert = useLcdAlert(toast.how === 'shake' ? toast.notification : undefined)
  const sound = ac.sound
  const fan = ac.fan ?? 'auto'

  const { increase, decrease } = useAcTemperature()

  // 绘制完成后立刻解码。useLayoutEffect 赶在用户能按下之前，click 里就可以直接播 buffer。
  useLayoutEffect(() => {
    getAudioController(sound, fan)
  }, [sound, fan])

  // 同步声音模式：包括页面加载时恢复的状态，以及独立遥控器在其他标签页的修改
  useEffect(() => {
    getAudioController(sound, fan).setSoundMode(sound)
  }, [sound, fan])

  // 风声跟随风速（含独立遥控器在其他标签页的修改）
  useEffect(() => {
    getAudioController(sound, fan).setFanSpeed(fan)
  }, [sound, fan])

  // 开关机声跟随状态变化，而不是跟随按键：独立遥控器在其他标签页开关空调时，
  // 主页面通过 storage 事件收到新状态，也能及时启动或停止声音
  const previousStatus = useRef(ac.status)
  useEffect(() => {
    if (previousStatus.current === ac.status)
      return
    if (acSound)
      getAudioController(sound).toggleStatusAudio(previousStatus.current)
    previousStatus.current = ac.status
  }, [ac.status, acSound, sound])

  const actions: Record<AcRemoteCommand, () => void> = {
    power: toggleStatus,
    cold: () => toggleMode('cold'),
    hot: () => toggleMode('hot'),
    increase,
    decrease,
    swing: toggleSwing,
    sound: cycleSound,
    fan: cycleFan,
  }

  function onCommand(command: AcRemoteCommand) {
    const controller = getAudioController(sound)
    // 声音键先切换音量再「嘀」，按键音就是新模式下的音量
    if (command === 'sound')
      controller.setSoundMode(nextAcSoundMode(sound))
    controller.beep()
    actions[command]()
  }

  return (
    <div className="flex flex-col items-center">
      <audio id="di" src={SOUND_DI_PATH} preload="auto"></audio>
      <audio id="ac-work" src={SOUND_AC_WORK_PATH} preload="auto"></audio>
      <audio
        id="air-extractor-fan"
        src={SOUND_AIR_EXTRACTOR_FAN_PATH}
        preload="auto"
      >
      </audio>
      {floating
        ? createPortal(<RemoteControlView state={ac} onCommand={onCommand} alert={alert} />, floating.document.body)
        : <RemoteControlView state={ac} onCommand={onCommand} alert={alert} />}
    </div>
  )
}

export default RemoteControl
