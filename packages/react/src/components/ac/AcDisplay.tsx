import type { AcMode } from '~/types'
import React, { useState } from 'react'
import { useAcCtx } from '~/context'
import { acColor } from './AirConditioner'

/**
 * 记录数值的变化方向（首次渲染为 undefined，不播放动画）。
 * 按 React 文档「存储前一次渲染的信息」的写法在渲染期间更新 state。
 */
function useChangeDirection(value: number) {
  const [previous, setPrevious] = useState(value)
  const [direction, setDirection] = useState<'up' | 'down'>()
  if (value !== previous) {
    setPrevious(value)
    setDirection(value > previous ? 'up' : 'down')
  }
  return direction
}

/**
 * 是否已经切换过（首次渲染不播放动画）
 */
function useHasChanged<T>(value: T) {
  const [initial] = useState(value)
  const [changed, setChanged] = useState(false)
  if (!changed && value !== initial)
    setChanged(true)
  return changed || value !== initial
}

/**
 * 空调温度
 */
const AcTemperature: React.FC = () => {
  const { state } = useAcCtx()
  const direction = useChangeDirection(state.temperature)
  return (
    <h4 className="text-4xl text-center">
      {/* key 变化会重新挂载，从而重播滚动动画 */}
      <span className="ac-temp">
        <span className="ac-readout">
          <span key={state.temperature} className="font-digit ac-temperature" data-dir={direction}>{state.temperature}</span>
          <small className="font-digit">°C</small>
        </span>
        {/* 开机自检：先短暂点亮全部笔段 */}
        <span className="font-digit ac-selftest" aria-hidden="true">88</span>
      </span>
    </h4>
  )
}

/**
 * 显示屏（温度/图标）
 * @param props
 */
export const AcDisplay: React.FC<{ mode: AcMode }> = (props) => {
  const modeChanged = useHasChanged(props.mode)
  return (
    <div
      className="ac-display absolute top-6 right-8"
      style={{
        color: acColor.display,
      }}
    >
      <h6 className="text-left text-sm">
        <span key={props.mode} className="ac-mode-icon" data-animate={modeChanged || undefined}>
          {props.mode === 'cold' ? '❄' : '☀️'}
        </span>
      </h6>
      <AcTemperature />
    </div>
  )
}
