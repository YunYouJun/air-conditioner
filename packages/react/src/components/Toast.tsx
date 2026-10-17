import React, { useEffect, useState } from 'react'
import { useAcCtx } from '~/context'
import { useToastCtx } from '~/context/toast'
import { BreezeNote, useBreezeNote } from '~/lib/BreezeNote'

/**
 * 提示：节能建议是「出风口吹出的小纸条」，其余提示只给读屏播报（与组件库一致）。
 * 放在空调正下方，纸条从出风口吹出来。
 */
const Toast: React.FC = () => {
  const { state } = useToastCtx()
  const { state: ac } = useAcCtx()
  const { note, show } = useBreezeNote()
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    const { notification, how } = state
    if (!notification || how === 'skip')
      return
    if (how === 'note')
      show(notification, ac.mode)
    else
      setAnnouncement(notification.message)
  }, [state.id])

  return (
    <div className="acw-notification-region" role="status">
      {note && <BreezeNote key={note.id} notification={note.notification} mode={note.mode} leaving={note.leaving} />}
      <span className="acw-sr-only">{announcement}</span>
    </div>
  )
}

export default Toast
