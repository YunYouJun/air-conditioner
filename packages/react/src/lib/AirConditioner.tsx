import type { AcState } from '@yunlefun-home/air-conditioner-core'
import { defaultAcState } from '@yunlefun-home/air-conditioner-core'
import { useOptionalAirConditionerState } from './context'

export interface AirConditionerProps extends Partial<AcState> {
  title?: string
}

export function AirConditioner(props: AirConditionerProps = {}) {
  const state = useOptionalAirConditionerState(props)
  const mode = props.mode ?? state.mode
  const status = props.status ?? state.status
  const temperature = props.temperature ?? state.temperature ?? defaultAcState.temperature

  return (
    <div className="acw-unit" data-mode={mode} data-status={status ? 'on' : 'off'}>
      <div className="acw-shell">
        <div className="acw-badge">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="acw-display" aria-live="polite">
          <span className="acw-mode">{mode === 'cold' ? 'cold' : 'hot'}</span>
          <strong>{temperature}</strong>
          <small>°C</small>
        </div>
        <div className="acw-logo">{props.title ?? 'Yun AC'}</div>
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
