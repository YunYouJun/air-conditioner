import type { AcState } from '@yunlefun-home/air-conditioner-core'
import type { CSSProperties } from 'react'
import { acModeIcons, acShellSize, defaultAcState } from '@yunlefun-home/air-conditioner-core'
import { useRef, useState } from 'react'
import { useOptionalAirConditionerState } from './context'
import { EnergyLabel } from './EnergyLabel'
import { useAcScale, useAcTilt } from './useAcScale'

export interface AirConditionerProps extends Partial<AcState> {
  /** Logo 的替代文字 / 链接标题 */
  title?: string
  /** 中央 Logo 图片地址，传空字符串则不显示 */
  logoUrl?: string
  /** Logo 链接 */
  logoHref?: string
  /** 是否显示能效标签 */
  showEnergyLabel?: boolean
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
  const {
    logoUrl = '/yun-logo.svg',
    logoHref = 'https://github.com/YunYouJun/air-conditioner',
    showEnergyLabel = true,
  } = props
  const state = useOptionalAirConditionerState(props)
  const mode = props.mode ?? state.mode
  const status = props.status ?? state.status
  const temperature = props.temperature ?? state.temperature ?? defaultAcState.temperature
  const swing = props.swing ?? state.swing ?? defaultAcState.swing
  const fan = props.fan ?? state.fan ?? 'auto'

  const direction = useChangeDirection(temperature)
  const modeChanged = useHasChanged(mode)
  const unitRef = useRef<HTMLDivElement>(null)
  const scale = useAcScale(unitRef, acShellSize.compact.width)
  const [tiltX, tiltY] = useAcTilt(unitRef)

  // 结构与 Vue 版 AirConditioner.vue 一致，共用同一份样式
  return (
    <div
      ref={unitRef}
      className="acw-unit"
      data-mode={mode}
      data-status={status ? 'on' : 'off'}
      data-swing={swing ? 'on' : 'off'}
      data-fan={fan}
      style={{ '--acw-scale': scale, '--acw-tilt-x': `${tiltX}deg`, '--acw-tilt-y': `${tiltY}deg` } as CSSProperties}
    >
      <div className="acw-shell">
        {/* 能效标签 */}
        {showEnergyLabel && <EnergyLabel />}

        {/* 显示屏（仅开机时显示）；key 变化会重新挂载，从而重播切换动画 */}
        <div className="acw-display" aria-live="polite">
          <div className="acw-display-mode">
            <span key={mode} className="acw-mode-icon" data-animate={modeChanged || undefined}>{acModeIcons[mode]}</span>
          </div>
          <div className="acw-display-temp">
            <span className="acw-readout">
              <span key={temperature} className="acw-digit acw-temperature" data-dir={direction}>{temperature}</span>
              <small className="acw-digit">°C</small>
            </span>
            <span className="acw-digit acw-selftest" aria-hidden="true">88</span>
          </div>
        </div>

        {/* 中央 Logo */}
        {logoUrl && (
          <div className="acw-logo">
            <a href={logoHref} target="_blank" rel="noreferrer noopener" title={props.title}>
              <img src={logoUrl} alt={props.title ?? 'logo'} />
            </a>
          </div>
        )}

        {/* 出风口线 */}
        <div className="acw-outlet" />

        {/* 出风口与导风板（开机时打开） */}
        <div className="acw-vent" aria-hidden="true" />
        <div className="acw-louver" aria-hidden="true" />

        {/* 状态指示灯 */}
        <span className="acw-led" aria-label={status ? 'on' : 'off'} />
      </div>

      {/* 风特效 */}
      <div className="acw-wind" aria-hidden={!status}>
        <span className="acw-wind-line" />
        <span className="acw-wind-line" />
        <span className="acw-wind-line" />
      </div>
    </div>
  )
}
