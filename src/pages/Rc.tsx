import React from 'react'
import { RemoteControl } from '~/components/RemoteControl'
import { Copyright } from '~/layouts/Copyright'
import { useDetectStorage } from '~/features/ac'

const Rc: React.FC = () => {
  useDetectStorage()

  return (
    <div>
      <RemoteControl />
      <Copyright />
    </div>
  )
}

export default Rc
