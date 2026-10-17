import type { AcAudioController } from '@yunlefun-home/air-conditioner-core'
import type { AirConditionerProviderProps } from './context'
import { createAcAudioController, createAcNotificationPresenter, resolveAcAudioAssets } from '@yunlefun-home/air-conditioner-core'
import { useEffect, useRef, useState } from 'react'
import { AirConditioner } from './AirConditioner'
import { BreezeNote, useBreezeNote } from './BreezeNote'
import { AirConditionerProvider, useAirConditioner } from './context'
import { RemoteControl } from './RemoteControl'

export interface AirConditionerWidgetProps extends AirConditionerProviderProps {
  /** Logo 的替代文字 / 链接标题 */
  title?: string
  /** 中央 Logo 图片地址 */
  logoUrl?: string
  /** 静态资源基础路径（音频所在目录） */
  assetsBaseUrl?: string
  /** 音频扩展名 */
  audioExt?: string
  /** 是否启用音效 */
  enableAudio?: boolean
  /** 是否显示能效标签 */
  showEnergyLabel?: boolean
}

function Notification() {
  const { notification, state } = useAirConditioner()
  const [present] = useState(createAcNotificationPresenter)
  const { note, show } = useBreezeNote()
  const [announcement, setAnnouncement] = useState('')
  // 呈现方式要按提示发出时的状态判断，用 ref 读取最新状态而不把它列为依赖
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (!notification)
      return
    const how = present(notification, stateRef.current)
    if (how === 'note')
      show(notification, stateRef.current.mode)
    else if (how !== 'skip')
      setAnnouncement(notification.message)
  }, [notification])

  // 常驻的 live region，紧贴出风口；节能建议是小纸条，其余提示只给读屏播报
  return (
    <div className="acw-notification-region" role="status">
      {note && <BreezeNote key={note.id} notification={note.notification} mode={note.mode} leaving={note.leaving} />}
      <span className="acw-sr-only">{announcement}</span>
    </div>
  )
}

/**
 * 音效：按键「嘀」声，开关机时播放启动 / 关闭音效，声音键切换音量（与 Vue 版 useAcAudio 一致）。
 */
function AudioEffects(props: Required<Pick<AirConditionerWidgetProps, 'assetsBaseUrl' | 'audioExt'>>) {
  const { store } = useAirConditioner()
  const src = resolveAcAudioAssets(`${props.assetsBaseUrl}/audio`, props.audioExt)
  const beep = useRef<HTMLAudioElement>(null)
  const start = useRef<HTMLAudioElement>(null)
  const work = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    let controller: AcAudioController | undefined
    const unsubscribe = store.subscribe((event) => {
      controller ||= createAcAudioController(
        { beep: beep.current, start: start.current, work: work.current },
        { soundMode: event.state.sound, fanSpeed: event.state.fan ?? 'auto' },
      )
      if (event.previousState.sound !== event.state.sound)
        controller.setSoundMode(event.state.sound)
      if (event.previousState.fan !== event.state.fan)
        controller.setFanSpeed(event.state.fan ?? 'auto')
      controller.beep()
      if (event.previousState.status !== event.state.status)
        controller.toggleStatusAudio(event.previousState.status)
    })
    return () => {
      unsubscribe()
      controller?.dispose()
    }
  }, [store])

  return (
    <>
      <audio ref={beep} src={src.beep} preload="auto" />
      <audio ref={start} src={src.start} preload="auto" />
      <audio ref={work} src={src.work} preload="auto" />
    </>
  )
}

function WidgetContent(props: Omit<AirConditionerWidgetProps, keyof AirConditionerProviderProps>) {
  const { state } = useAirConditioner()
  const {
    assetsBaseUrl = '/assets',
    audioExt = 'm4a',
    enableAudio = true,
    showEnergyLabel = true,
  } = props

  // 结构与 Vue 版 AirConditionerWidget.vue 一致
  return (
    <div className="acw-root" data-mode={state.mode} data-status={state.status ? 'on' : 'off'}>
      {enableAudio && <AudioEffects assetsBaseUrl={assetsBaseUrl} audioExt={audioExt} />}
      <AirConditioner title={props.title} logoUrl={props.logoUrl} showEnergyLabel={showEnergyLabel} />
      <Notification />
      <RemoteControl />
    </div>
  )
}

export function AirConditionerWidget(props: AirConditionerWidgetProps = {}) {
  const {
    title,
    logoUrl,
    assetsBaseUrl,
    audioExt,
    enableAudio,
    showEnergyLabel,
    children: _children,
    ...providerProps
  } = props

  return (
    <AirConditionerProvider {...providerProps}>
      <WidgetContent
        title={title}
        logoUrl={logoUrl}
        assetsBaseUrl={assetsBaseUrl}
        audioExt={audioExt}
        enableAudio={enableAudio}
        showEnergyLabel={showEnergyLabel}
      />
    </AirConditionerProvider>
  )
}
