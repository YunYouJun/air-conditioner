import { proxy } from 'valtio'
import { updateToastState } from './toast'
import type { AcMode, AcState } from '~/types'

export const acStorageKey = 'ac:state'

export const defaultAcState: AcState = {
  mode: 'cold',
  status: false,
  temperature: 26,
}

const getAcInitStateFromLocalStorage = () => ({
  ...defaultAcState,
  ...JSON.parse(localStorage.getItem(acStorageKey) as string),
})

const initAcState = getAcInitStateFromLocalStorage()

const acStore = proxy<AcState>({
  ...initAcState,
})

const setAcStateToLoacl = (acState: AcState) => {
  localStorage.setItem(acStorageKey, JSON.stringify({ ...acState }))
}
export const acIncrement = () => {
  acStore.temperature += 1
  setAcStateToLoacl({ ...acStore })
}
export const acDecrement = () => {
  acStore.temperature -= 1
  setAcStateToLoacl({ ...acStore })
}
export const toggleStatus = () => {
  acStore.status = !acStore.status
  setAcStateToLoacl({ ...acStore })
}
export const setStatus = (status: AcState['status']) => {
  acStore.status = status
  setAcStateToLoacl({ ...acStore })
}
export const setMode = (mode: AcState['mode']) => {
  acStore.mode = mode
  setAcStateToLoacl({ ...acStore })
}
export const updateAcState = (payload: AcState) => {
  acStore.mode = payload.mode
  acStore.status = payload.status
  acStore.temperature = payload.temperature
  setAcStateToLoacl({ ...acStore })
}

export const toggleMode = (mode: AcMode) => {
  setMode(mode)

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
