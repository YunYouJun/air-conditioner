import type { HeatLevel } from '@yunlefun-home/air-conditioner-core'
import type { FC } from 'react'
import { Button } from '@mui/material'
import { useComputerCooling } from '~/hooks'

const levelLabels: Record<HeatLevel, string> = {
  nominal: '轻松',
  fair: '有点忙',
  serious: '很忙',
  critical: '快烧起来了',
}

/**
 * 电脑降温开关：根据 CPU 压力自动开启制冷。浏览器读不到 CPU 温度，只能读到负载等级。
 */
const ComputerCooling: FC = () => {
  const { supported, enabled, setEnabled, level, error } = useComputerCooling()

  if (!supported)
    return null

  return (
    <div className="computer-cooling mt-4 text-center">
      <Button
        variant={enabled ? 'contained' : 'outlined'}
        aria-pressed={enabled}
        onClick={() => setEnabled(!enabled)}
      >
        {enabled ? '电脑降温中' : '电脑降温'}
      </Button>
      <p className="computer-cooling__status text-sm op-70 mt-2" aria-live="polite">
        {error ?? (enabled
          ? `CPU 状态：${level ? levelLabels[level] : '读取中…'}，电脑忙起来时会自动制冷`
          : '跟随电脑 CPU 负载自动开启制冷')}
      </p>
    </div>
  )
}

export default ComputerCooling
