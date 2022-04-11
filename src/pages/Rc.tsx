import React from 'react'
import { RemoteControl } from '~/components/RemoteControl'
import { useDetectStorage } from '~/features/ac'

const Rc: React.FC = () => {
  useDetectStorage()

  return (
    <RemoteControl />
  )
}

export default Rc
