import type { AcMode, AcNotification } from '@yunlefun-home/air-conditioner-core'
import { acIconPaths } from '@yunlefun-home/air-conditioner-core'
import { useEffect, useRef, useState } from 'react'

/** 纸条停留多久后被风吹走，以及吹走动画的时长（与 style.css 的 acw-note-away 一致） */
const noteStayMs = 3600
const noteAwayMs = 460

/**
 * 「出风口吹出的小纸条」：节能建议的显示方式，与 Vue / Web Component 共用一份结构和样式。
 */
export function BreezeNote(props: { notification: AcNotification, mode: AcMode, leaving?: boolean }) {
  const { notification, mode, leaving } = props
  return (
    <div className="acw-note" data-severity={notification.severity} data-mode={mode} data-leaving={leaving ? '' : undefined}>
      <span className="acw-note-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d={acIconPaths.leaf} /></svg>
      </span>
      <span className="acw-note-text">
        <strong>{notification.message}</strong>
        {notification.detail && <small>{notification.detail}</small>}
      </span>
    </div>
  )
}

/**
 * 管理一张纸条的出现、停留与被吹走。`show` 每次调用都会换一张新纸条（重新播放吹出动画）。
 */
export function useBreezeNote() {
  const [note, setNote] = useState<{ notification: AcNotification, mode: AcMode, id: number, leaving: boolean }>()
  const nextId = useRef(0)

  useEffect(() => {
    if (!note || note.leaving)
      return
    const away = setTimeout(() => setNote(current => current && { ...current, leaving: true }), noteStayMs)
    return () => clearTimeout(away)
  }, [note])

  useEffect(() => {
    if (!note?.leaving)
      return
    const gone = setTimeout(setNote, noteAwayMs, undefined)
    return () => clearTimeout(gone)
  }, [note])

  return {
    note,
    /** `mode` 是纸条吹出时的模式：之后再切换模式，已经吹出的纸条不变色 */
    show(notification: AcNotification, mode: AcMode) {
      nextId.current++
      setNote({ notification, mode, id: nextId.current, leaving: false })
    },
  }
}

/**
 * 温度到上下限时让遥控器小屏抖一下：传入最新的提示，返回是否处于「报警」状态。
 */
export function useLcdAlert(notification: AcNotification | undefined) {
  const [alert, setAlert] = useState(false)
  useEffect(() => {
    if (notification?.kind !== 'limit')
      return
    setAlert(false)
    let timer: ReturnType<typeof setTimeout> | undefined
    const frame = requestAnimationFrame(() => {
      setAlert(true)
      timer = setTimeout(setAlert, 400, false)
    })
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [notification])
  return alert
}
