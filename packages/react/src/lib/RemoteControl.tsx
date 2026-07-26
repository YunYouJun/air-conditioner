import type { AcMode } from '@yunlefun-home/air-conditioner-core'
import { useAirConditioner } from './context'

export interface RemoteControlProps {
  onCommand?: (command: string) => void
}

export function RemoteControl(props: RemoteControlProps = {}) {
  const airConditioner = useAirConditioner()

  function run(command: string, action: () => void) {
    props.onCommand?.(command)
    action()
  }

  function modeButton(mode: AcMode, label: string) {
    return (
      <button
        type="button"
        className={`acw-button acw-button-${mode}`}
        aria-label={mode}
        onClick={() => run(mode, () => airConditioner.setMode(mode))}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="acw-remote" role="group" aria-label="Air conditioner remote control">
      <div className="acw-remote-row">
        {modeButton('cold', 'Cold')}
        <button
          type="button"
          className="acw-button acw-button-power"
          aria-label="power"
          onClick={() => run('power', airConditioner.toggleStatus)}
        >
          Power
        </button>
        {modeButton('hot', 'Hot')}
      </div>
      <button
        type="button"
        className="acw-button acw-button-temp"
        aria-label="add"
        onClick={() => run('increase', airConditioner.increase)}
      >
        +
      </button>
      <button
        type="button"
        className="acw-button acw-button-temp"
        aria-label="reduce"
        onClick={() => run('decrease', airConditioner.decrease)}
      >
        -
      </button>
    </div>
  )
}
