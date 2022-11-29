import { proxy } from 'valtio'
import { watch } from 'valtio/utils'

import { updateToastState } from './toast'
import type { AcMode, AcState } from '~/types'

import myUseLocalStorage from '~/utils/localStorage'

export const acStorageKey = 'ac:state'

export const defaultAcState: AcState = {
  mode: 'cold',
  status: false,
  temperature: 26,
}

const [initAcState, setAcState] = myUseLocalStorage<AcState>(acStorageKey, defaultAcState)

const acStore = proxy<AcState>({
  ...initAcState,
})

// 监听state的变化，变化后将其本地存储
watch((get) => {
  setAcState({ ...get(acStore) })
})
export const acIncrement = () => {
  acStore.temperature += 1
}
export const acDecrement = () => {
  acStore.temperature -= 1
}
export const toggleStatus = () => {
  acStore.status = !acStore.status
}

export const updateAcState = (payload: AcState) => {
  acStore.mode = payload.mode
  acStore.status = payload.status
  acStore.temperature = payload.temperature
}

export const toggleMode = (mode: AcMode) => {
  acStore.mode = mode

  const currentTemperature = acStore.temperature
  const goodColdTemperature = 26
  const goodHotTemperature = 20

  const recommendedSlogan = (mode: AcMode, temperature: number) =>
        `建议将空调的制${mode === 'cold' ? '冷' : '热'
        }温度调至 ${temperature} 度以${mode === 'cold' ? '上' : '下'
        }，为节能减排贡献一份力量！`

  if (mode === 'cold' && currentTemperature < goodColdTemperature) {
    updateToastState(
      {
        message: recommendedSlogan('cold', goodColdTemperature),
        open: true,
        severity: 'success',
      },
    )
  }
  else if (mode === 'hot' && currentTemperature > goodHotTemperature) {
    updateToastState(
      {
        message: recommendedSlogan('hot', goodHotTemperature),
        open: true,
        severity: 'success',
      },
    )
  }
}
export default acStore
