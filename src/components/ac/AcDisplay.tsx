import React from 'react'
import { acColor } from './AirConditioner'
import type { AcMode } from '~/types'
import { useAcCtx } from '~/context'

/**
 * 空调温度
 */
const AcTemperature: React.FC = () => {
  const { state } = useAcCtx()
  return (
    <h4 className="text-4xl text-center">
      <span className="font-digit ac-temperature">{state.temperature}</span>
      <small className="font-digit">°C</small>
    </h4>
  )
}

/**
 * 显示屏（温度/图标）
 * @param props
 */
export const AcDisplay: React.FC<{ mode: AcMode }> = React.forwardRef(
  (props, ref) => {
    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="absolute top-6 right-8"
        style={{
          color: acColor.display,
        }}
      >
        <h6 className="text-left text-sm">
          <span>{props.mode === 'cold' ? '❄' : '☀️'}</span>
          ️️
        </h6>
        <AcTemperature />
      </div>
    )
  },
)
