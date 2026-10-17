import type { HeatLevel } from '@yunlefun-home/air-conditioner-core'
import type { FC } from 'react'
import { useComputerCooling } from '~/hooks'

const levelLabels: Record<HeatLevel, string> = {
  nominal: '轻松',
  fair: '有点忙',
  serious: '很忙',
  critical: '快烧起来了',
}

/**
 * 电脑降温开关：根据 CPU 压力自动开启制冷。浏览器读不到 CPU 温度，只能读到负载等级
 * （Compute Pressure API，目前只有 Chrome / Edge 桌面版支持，其余浏览器不显示）。
 * 放在操作区里，开关是一个胶囊按钮，状态说明换行显示在按钮下方。
 */
const ComputerCooling: FC = () => {
  const { supported, enabled, setEnabled, level, error } = useComputerCooling()

  if (!supported)
    return null

  return (
    <>
      <button
        type="button"
        className="ac-chip"
        aria-pressed={enabled}
        onClick={() => setEnabled(!enabled)}
      >
        <span className="i-mdi-chip ac-chip__icon" aria-hidden="true" />
        {enabled ? '电脑降温中' : '电脑降温'}
      </button>
      <p className="ac-actions__caption" aria-live="polite">
        {error ?? (enabled
          ? `CPU 状态：${level ? levelLabels[level] : '读取中…'}，电脑忙起来时会自动制冷`
          : '跟随电脑 CPU 负载自动开启制冷')}
      </p>
    </>
  )
}

export default ComputerCooling
