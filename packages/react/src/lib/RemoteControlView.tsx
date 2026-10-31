import type { AcIconName, AcMode, AcRemoteCommand, AcState } from '@yunlefun-home/air-conditioner-core'
import { acIconPaths, acSoundIcons, bindAcPressRepeat, getAcRemoteText } from '@yunlefun-home/air-conditioner-core'
import { useEffect, useRef } from 'react'

export interface RemoteControlViewProps {
  state: AcState
  onCommand: (command: AcRemoteCommand) => void
  /**
   * pointerdown / keydown：比 click 和温度键的按下回调更早，用来 resume 音频。
   */
  onWarm?: () => void
  /** 温度到上下限时为 true，小屏抖一下 */
  alert?: boolean
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
export function RemoteControlView({ state, onCommand, onWarm, alert }: RemoteControlViewProps) {
  const text = getAcRemoteText(state)

  // 温度键：长按连续调温，到上下限就停。长按期间会多次渲染，用 ref 读最新的状态和回调
  const latest = useRef({ state, onCommand })
  latest.current = { state, onCommand }
  const increaseButton = useRef<HTMLButtonElement>(null)
  const decreaseButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const value = () => latest.current.state.temperature
    const bind = (button: HTMLButtonElement | null, command: AcRemoteCommand) =>
      button ? bindAcPressRepeat(button, () => latest.current.onCommand(command), { value }) : () => {}
    const unbind = [bind(increaseButton.current, 'increase'), bind(decreaseButton.current, 'decrease')]
    return () => unbind.forEach(stop => stop())
  }, [])

  return (
    <div
      className="acw-remote"
      role="group"
      aria-label="Air conditioner remote control"
      onPointerDownCapture={onWarm}
      onKeyDownCapture={onWarm}
    >
      <div
        className="acw-lcd"
        role="img"
        aria-label={text.display}
        data-status={state.status ? 'on' : 'off'}
        data-mode={state.mode}
        data-swing={state.swing ? 'on' : 'off'}
        data-fan={state.fan ?? 'auto'}
        data-alert={alert ? '' : undefined}
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
            <b>自动</b>
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
        <button ref={increaseButton} type="button" className="acw-button acw-button-temp" aria-label="add" title="温度 +（长按连续调）">
          <Icon name="plus" size={28} />
        </button>
        <button ref={decreaseButton} type="button" className="acw-button acw-button-temp" aria-label="reduce" title="温度 −（长按连续调）">
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
          className="acw-button acw-button-fan"
          aria-label="fan"
          title={text.fan}
          data-fan={state.fan ?? 'auto'}
          onClick={() => onCommand('fan')}
        >
          <Icon name="fan" size={20} />
        </button>
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
