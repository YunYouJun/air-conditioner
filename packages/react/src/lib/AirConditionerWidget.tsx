import type { AirConditionerProviderProps } from './context'
import { useState } from 'react'
import { AirConditioner } from './AirConditioner'
import { AirConditionerProvider, useAirConditioner } from './context'
import { RemoteControl } from './RemoteControl'

export interface AirConditionerWidgetProps extends AirConditionerProviderProps {
  title?: string
}

function Notification() {
  const { notification } = useAirConditioner()
  // 每条新通知自增 key，让重复的提示也能重新播放进入动画
  const [current, setCurrent] = useState(notification)
  const [count, setCount] = useState(0)
  if (notification !== current) {
    setCurrent(notification)
    setCount(count + 1)
  }

  // 常驻的 live region，内部提示切换时才会被读屏正确播报
  return (
    <div className="acw-notification-region" role="status">
      {notification && (
        <div key={count} className="acw-notification" data-severity={notification.severity}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

function WidgetContent(props: Pick<AirConditionerWidgetProps, 'title'>) {
  return (
    <div className="acw-root">
      <AirConditioner title={props.title} />
      <RemoteControl />
      <Notification />
    </div>
  )
}

export function AirConditionerWidget(props: AirConditionerWidgetProps = {}) {
  const {
    title,
    children: _children,
    ...providerProps
  } = props

  return (
    <AirConditionerProvider {...providerProps}>
      <WidgetContent title={title} />
    </AirConditionerProvider>
  )
}
