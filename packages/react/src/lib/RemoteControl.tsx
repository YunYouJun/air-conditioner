import type { AcIconName, AcMode } from '@yunlefun-home/air-conditioner-core'
import { acIconPaths, acSoundIcons, acSoundModeLabels } from '@yunlefun-home/air-conditioner-core'
import { useAirConditioner } from './context'

export interface RemoteControlProps {
  onCommand?: (command: string) => void
}

function Icon(props: { name: AcIconName, size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={props.size} height={props.size} aria-hidden="true">
      <path fill="currentColor" d={acIconPaths[props.name]} />
    </svg>
  )
}

export function RemoteControl(props: RemoteControlProps = {}) {
  const airConditioner = useAirConditioner()
  const isOn = airConditioner.state.status
  const sound = airConditioner.state.sound
  const swing = airConditioner.state.swing

  function run(command: string, action: () => void) {
    props.onCommand?.(command)
    action()
  }

  function setMode(mode: AcMode) {
    run(mode, () => airConditioner.setMode(mode))
  }

  return (
    <div className="acw-remote" role="group" aria-label="Air conditioner remote control">
      <div className="acw-remote-row">
        <button type="button" className="acw-button acw-button-cold" aria-label="cold" onClick={() => setMode('cold')}>
          <Icon name="cold" size={22} />
        </button>
        <button
          type="button"
          className={`acw-button acw-button-power${isOn ? ' acw-button-on' : ''}`}
          aria-label="power"
          onClick={() => run('power', airConditioner.toggleStatus)}
        >
          <Icon name="power" size={22} />
        </button>
        <button type="button" className="acw-button acw-button-hot" aria-label="hot" onClick={() => setMode('hot')}>
          <Icon name="hot" size={22} />
        </button>
      </div>
      <button type="button" className="acw-button acw-button-temp" aria-label="add" onClick={() => run('increase', airConditioner.increase)}>
        <Icon name="increase" size={28} />
      </button>
      <button type="button" className="acw-button acw-button-temp" aria-label="reduce" onClick={() => run('decrease', airConditioner.decrease)}>
        <Icon name="decrease" size={28} />
      </button>
      <div className="acw-remote-row">
        <button
          type="button"
          className="acw-button acw-button-swing"
          aria-label="swing"
          aria-pressed={swing}
          title={`扫风：${swing ? '开' : '关'}`}
          onClick={() => run('swing', airConditioner.toggleSwing)}
        >
          <Icon name="swing" size={20} />
        </button>
        <button
          type="button"
          className="acw-button acw-button-sound"
          aria-label="sound"
          title={`声音：${acSoundModeLabels[sound]}`}
          data-sound={sound}
          onClick={() => run('sound', airConditioner.cycleSound)}
        >
          <Icon name={acSoundIcons[sound]} size={20} />
        </button>
      </div>
    </div>
  )
}
