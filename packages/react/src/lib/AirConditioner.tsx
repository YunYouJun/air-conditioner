import type { AcState } from '@yunlefun-home/air-conditioner-core'
import type { CSSProperties, ReactNode } from 'react'
import { acModeIcons, acShellSize, defaultAcState, getAcCondensationStyle } from '@yunlefun-home/air-conditioner-core'
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
  /** 一滴冷凝水落下（用来播放滴水声） */
  onDrip?: () => void
  /**
   * 机身尺寸：`compact` 为 360 × 128 的标准款，`wide` 为 600 × 200 的长款（3 : 1）。
   * 两种都会在窄容器里等比缩小。
   * @default 'compact'
   */
  size?: keyof typeof acShellSize
  /** 额外贴在机身上的内容（例如宣传贴纸），按机身坐标绝对定位 */
  children?: ReactNode
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
    size = 'compact',
  } = props
  const state = useOptionalAirConditionerState(props)
  const mode = props.mode ?? state.mode
  const status = props.status ?? state.status
  const temperature = props.temperature ?? state.temperature ?? defaultAcState.temperature
  const swing = props.swing ?? state.swing ?? defaultAcState.swing
  const fan = props.fan ?? state.fan ?? 'auto'
  // 雾气浓度与冷凝水滴落间隔（#70 / #21）
  const condensation = getAcCondensationStyle({ status, mode, temperature, fan })

  const direction = useChangeDirection(temperature)
  const modeChanged = useHasChanged(mode)
  const unitRef = useRef<HTMLDivElement>(null)
  const scale = useAcScale(unitRef, acShellSize[size].width)
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
      data-drip={condensation.drip}
      data-size={size === 'compact' ? undefined : size}
      style={{
        '--acw-scale': scale,
        '--acw-tilt-x': `${tiltX}deg`,
        '--acw-tilt-y': `${tiltY}deg`,
        '--acw-mist': condensation.mist,
        '--acw-drip-cycle': condensation.dripCycle,
      } as CSSProperties}
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
            {/* 图片只是装饰（alt 为空），链接本身带名字：图片加载失败时不会把替代文字挤成一竖排 */}
            <a href={logoHref} target="_blank" rel="noreferrer noopener" title={props.title} aria-label={props.title ?? 'Air Conditioner'}>
              <img src={logoUrl} alt="" />
            </a>
          </div>
        )}

        {/* 出风口线 */}
        <div className="acw-outlet" />

        {/* 出风口与导风板（开机时打开） */}
        <div className="acw-vent" aria-hidden="true" />
        <div className="acw-louver" aria-hidden="true" />

        {/* 雾气与冷凝水（制冷时） */}
        <div className="acw-mist" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <span className="acw-drip" aria-hidden="true" onAnimationIteration={props.onDrip} />

        {/* 状态指示灯 */}
        <span className="acw-led" aria-label={status ? 'on' : 'off'} />

        {props.children}
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
