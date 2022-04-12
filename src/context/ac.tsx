import type { FC } from 'react'
import { createContext, useContext, useReducer } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { useToastCtx } from './toast'
import type { AcMode, AcState } from '~/types'

export const acStorageKey = 'ac:state'

type AcAction = { type: 'increment' | 'decrement' | 'toggleStatus' } | {
  type: 'status'
  status: AcState['status']
} | {
  type: 'mode'
  mode: AcState['mode']
} | {
  type: 'update'
  payload: Partial<AcState>
}

export const defaultState: AcState = {
  mode: 'cold',
  status: false,
  temperature: 26,
}

const AcContext = createContext<{
  state: AcState
  dispatch: (action: AcAction) => void
} | undefined>(undefined)
// AcContext.displayName = 'AC'

export const AcProvider: FC = (props) => {
  const [initState, setAcState] = useLocalStorage<AcState>(acStorageKey, defaultState)

  function acReducer(state: AcState, action: AcAction) {
    let val = { ...state }
    switch (action.type) {
      case 'increment':
        val.temperature += 1
        break
      case 'decrement':
        val.temperature -= 1
        break
      case 'toggleStatus':
        val.status = !val.status
        break
      case 'status':
        val.status = action.status
        break
      case 'mode':
        val.mode = action.mode
        break
      case 'update':
        val = {
          ...state,
          ...action.payload,
        }
        break
      default:
        throw new Error('Unexpected Ac Action')
    }

    setAcState(val)
    return val
  }

  const [state, dispatch] = useReducer(acReducer, initState)
  return (
    <AcContext.Provider value={{ state, dispatch }}>
      {props.children}
    </AcContext.Provider>
  )
}

export function useAcCtx() {
  const context = useContext(AcContext)
  if (context === undefined)
    throw new Error('useAcCtx must be used within a AcProvider')

  return context
}

export function useAc() {
  const { state, dispatch } = useAcCtx()
  const { dispatch: dispatchToast } = useToastCtx()

  return {
    /**
     * 切换开关状态
     */
    toggleStatus() {
      dispatch({ type: 'toggleStatus' })
    },
    toggleMode(mode: AcMode) {
      dispatch({ type: 'mode', mode })

      const currentTemperature = state.temperature
      const goodColdTemperature = 26
      const goodHotTemperature = 20

      const recommendedSlogan = (mode: AcMode, temperature: number) =>
        `建议将空调的制${
          mode === 'cold' ? '冷' : '热'
        }温度调至 ${temperature} 度以${
          mode === 'cold' ? '上' : '下'
        }，为节能减排贡献一份力量！`

      if (mode === 'cold' && currentTemperature < goodColdTemperature) {
        dispatchToast({
          type: 'update',
          payload: {
            message: recommendedSlogan('cold', goodColdTemperature),
            open: true,
            severity: 'success',
          },
        })
      }
      else if (mode === 'hot' && currentTemperature > goodHotTemperature) {
        dispatchToast({
          type: 'update',
          payload: {
            message: recommendedSlogan('hot', goodHotTemperature),
            open: true,
            severity: 'success',
          },
        })
      }
    },
  }
}
