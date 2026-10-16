import type { AcState } from '@yunlefun-home/air-conditioner-core'
import type { CSSProperties } from 'react'
import { acShellSize, defaultAcState } from '@yunlefun-home/air-conditioner-core'
import { useRef, useState } from 'react'
import { useOptionalAirConditionerState } from './context'
import { useAcScale, useAcTilt } from './useAcScale'

export interface AirConditionerProps extends Partial<AcState> {
  title?: string
}

/**
 * 记录数值的变化方向（首次渲染为 undefined，不播放动画）
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

export function AirConditioner(props: AirConditionerProps = {}) {
  const state = useOptionalAirConditionerState(props)
  const mode = props.mode ?? state.mode
  const status = props.status ?? state.status
  const temperature = props.temperature ?? state.temperature ?? defaultAcState.temperature

  const direction = useChangeDirection(temperature)
  const modeChanged = useHasChanged(mode)
  const unitRef = useRef<HTMLDivElement>(null)
  const scale = useAcScale(unitRef, acShellSize.compact.width)
  const [tiltX, tiltY] = useAcTilt(unitRef)

  return (
    <div
      ref={unitRef}
      className="acw-unit"
      data-mode={mode}
      data-status={status ? 'on' : 'off'}
      style={{ '--acw-scale': scale, '--acw-tilt-x': `${tiltX}deg`, '--acw-tilt-y': `${tiltY}deg` } as CSSProperties}
    >
      <div className="acw-shell">
        <div className="acw-badge">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="acw-display" aria-live="polite">
          {/* key 变化会重新挂载，从而重播切换动画 */}
          <span key={mode} className="acw-mode" data-animate={modeChanged || undefined}>{mode === 'cold' ? 'cold' : 'hot'}</span>
          <span className="acw-temp">
            <span className="acw-readout">
              <strong key={temperature} data-dir={direction}>{temperature}</strong>
              <small>°C</small>
            </span>
            <span className="acw-selftest" aria-hidden="true">88</span>
          </span>
        </div>
        <div className="acw-logo">{props.title ?? 'Yun AC'}</div>
        <div className="acw-vent" aria-hidden="true"></div>
        <div className="acw-louver" aria-hidden="true"></div>
        <span className="acw-led" aria-label={status ? 'on' : 'off'}></span>
      </div>
      <div className="acw-wind" aria-hidden={!status}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  )
}
