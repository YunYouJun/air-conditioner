import React from 'react'
import RemoteControl from '~/components/RemoteControl'
import { useDetectStorage } from '~/hooks'

const Rc: React.FC = () => {
  useDetectStorage()

  return (
    <RemoteControl isExtra={true} />
  )
}

export default Rc
