import type { AcRemoteCommand } from '@yunlefun-home/air-conditioner-core'
import { useAirConditioner } from './context'
import { RemoteControlView } from './RemoteControlView'

export interface RemoteControlProps {
  onCommand?: (command: string) => void
}

export function RemoteControl(props: RemoteControlProps = {}) {
  const airConditioner = useAirConditioner()

  const actions: Record<AcRemoteCommand, () => void> = {
    power: airConditioner.toggleStatus,
    cold: () => airConditioner.setMode('cold'),
    hot: () => airConditioner.setMode('hot'),
    increase: airConditioner.increase,
    decrease: airConditioner.decrease,
    swing: airConditioner.toggleSwing,
    sound: airConditioner.cycleSound,
    fan: airConditioner.cycleFan,
  }

  return (
    <RemoteControlView
      state={airConditioner.state}
      onCommand={(command) => {
        props.onCommand?.(command)
        actions[command]()
      }}
    />
  )
}
