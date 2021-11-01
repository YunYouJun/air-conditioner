import React from 'react'
import { Button } from '@mui/material'

import { ProTip } from '~/components/ProTip'
import { RemoteControl } from '~/components/RemoteControl'

import { AirConditioner } from '~/features/ac/AirConditioner'
import { Toast } from '~/features/toast/Toast'

import { useAppSelector } from '~/app/hooks'
import { RootState } from '~/app/store'
import { Copyright } from '~/layouts/Copyright'
import { useDetectStorage } from '~/features/ac'

/**
 * 主页
 * @returns
 */
const Home: React.FC = () => {
  const ac = useAppSelector((state: RootState) => state.ac)

  useDetectStorage()

  /**
   * 根据模式返回对应的色温
   * @returns
   */
  function getClassByMode() {
    if (ac.status)
      return ac.mode === 'hot' ? 'hot-color' : 'cold-color'
    else
      return ''
  }

  return (
    <div className={`max-w-600px m-auto ${getClassByMode()}`}>
      <div className="pt-6">
        <h1 className="text-center text-3xl">
          便携小空调
        </h1>
        <ProTip />
        <AirConditioner
          status={ac.status}
          temperature={ac.temperature}
          mode={ac.mode}
        />
        <div className="text-center">
          <div className="mt-2">
            <Button
              variant="outlined"
              onClick={() => {
                window.open('/#/rc', '_blank', 'width=300, height=400')
              }}
            >
              独立遥控器
            </Button>
          </div>
        </div>
        <RemoteControl />
        <Copyright />
      </div>

      <Toast />
    </div>
  )
}

export default Home
