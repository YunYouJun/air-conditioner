import React, { useLayoutEffect } from 'react'
import RemoteControl from '~/components/RemoteControl'
import { useDetectStorage } from '~/hooks'
import { finishBoot } from '~/utils/boot'

const Rc: React.FC = () => {
  useDetectStorage()
  // 画好后让首屏骨架淡出（子组件的布局 effect 先执行，尺寸已经量好）
  useLayoutEffect(finishBoot, [])

  return (
    <RemoteControl acSound={false} />
  )
}

export default Rc
