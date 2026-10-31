import type { AcRemoteCommand } from '@yunlefun-home/air-conditioner-core'
import { useLcdAlert } from './BreezeNote'
import { useAirConditioner } from './context'
import { RemoteControlView } from './RemoteControlView'

export interface RemoteControlProps {
  onCommand?: (command: string) => void
  /** pointerdown / keydown 时唤醒音频，赶在按键声之前 */
  onWarm?: () => void
}

export function RemoteControl(props: RemoteControlProps = {}) {
  const airConditioner = useAirConditioner()
  const alert = useLcdAlert(airConditioner.notification)

  const actions: Record<AcRemoteCommand, () => void> = {
    power: airConditioner.toggleStatus,
    // 模式键：关机时按下也会开机，和真的遥控器一样
    cold: () => airConditioner.dispatch({ type: 'mode', mode: 'cold', powerOn: true }),
    hot: () => airConditioner.dispatch({ type: 'mode', mode: 'hot', powerOn: true }),
    increase: airConditioner.increase,
    decrease: airConditioner.decrease,
    swing: airConditioner.toggleSwing,
    sound: airConditioner.cycleSound,
    fan: airConditioner.cycleFan,
  }

  return (
    <RemoteControlView
      state={airConditioner.state}
      alert={alert}
      onWarm={props.onWarm}
      onCommand={(command) => {
        props.onCommand?.(command)
        actions[command]()
      }}
    />
  )
}
