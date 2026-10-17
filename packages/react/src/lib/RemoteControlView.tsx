import type { AcIconName, AcMode, AcRemoteCommand, AcState } from '@yunlefun-home/air-conditioner-core'
import { acIconPaths, acSoundIcons, getAcRemoteText } from '@yunlefun-home/air-conditioner-core'

export interface RemoteControlViewProps {
  state: AcState
  onCommand: (command: AcRemoteCommand) => void
}

const modes: { mode: AcMode, icon: AcIconName }[] = [
  { mode: 'cold', icon: 'cold' },
  { mode: 'hot', icon: 'hot' },
]

function Icon(props: { name: AcIconName, size: number, className?: string, sound?: string }) {
  return (
    <svg className={props.className} data-sound={props.sound} viewBox="0 0 24 24" width={props.size} height={props.size} aria-hidden="true">
      <path fill="currentColor" d={acIconPaths[props.name]} />
    </svg>
  )
}

/**
 * 遥控器的纯展示部分：组件库的 `RemoteControl` 与主站遥控器共用，保证两者外观一致。
 */
export function RemoteControlView({ state, onCommand }: RemoteControlViewProps) {
  const text = getAcRemoteText(state)

  return (
    <div className="acw-remote" role="group" aria-label="Air conditioner remote control">
      <div
        className="acw-lcd"
        role="img"
        aria-label={text.display}
        data-status={state.status ? 'on' : 'off'}
        data-mode={state.mode}
        data-swing={state.swing ? 'on' : 'off'}
      >
        <div className="acw-lcd-main">
          <Icon className="acw-lcd-mode" name={state.mode} size={22} />
          <span className="acw-lcd-temp acw-digit">
            {state.temperature}
            <small>°C</small>
          </span>
        </div>
        <div className="acw-lcd-status" aria-hidden="true">
          <span className="acw-lcd-wind">
            <i />
            <i />
            <i />
          </span>
          <Icon className="acw-lcd-swing" name="swing" size={14} />
          <Icon className="acw-lcd-sound" sound={state.sound} name={acSoundIcons[state.sound]} size={14} />
        </div>
      </div>

      <button
        type="button"
        className={`acw-button acw-button-power${state.status ? ' acw-button-on' : ''}`}
        aria-label="power"
        aria-pressed={state.status}
        title={text.power}
        onClick={() => onCommand('power')}
      >
        <Icon name="power" size={24} />
      </button>

      <div className="acw-remote-temp">
        <button type="button" className="acw-button acw-button-temp" aria-label="add" title="温度 +" onClick={() => onCommand('increase')}>
          <Icon name="plus" size={28} />
        </button>
        <button type="button" className="acw-button acw-button-temp" aria-label="reduce" title="温度 −" onClick={() => onCommand('decrease')}>
          <Icon name="minus" size={28} />
        </button>
      </div>

      <div className="acw-remote-row">
        <div className="acw-remote-mode" role="group" aria-label="mode">
          {modes.map(item => (
            <button
              key={item.mode}
              type="button"
              className={`acw-button acw-button-${item.mode}`}
              aria-label={item.mode}
              aria-pressed={state.mode === item.mode}
              title={text.mode[item.mode]}
              onClick={() => onCommand(item.mode)}
            >
              <Icon name={item.icon} size={18} />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="acw-button acw-button-swing"
          aria-label="swing"
          aria-pressed={state.swing}
          title={text.swing}
          onClick={() => onCommand('swing')}
        >
          <Icon name="swing" size={20} />
        </button>
        <button
          type="button"
          className="acw-button acw-button-sound"
          aria-label="sound"
          title={text.sound}
          data-sound={state.sound}
          onClick={() => onCommand('sound')}
        >
          <Icon name={acSoundIcons[state.sound]} size={20} />
        </button>
      </div>
    </div>
  )
}
