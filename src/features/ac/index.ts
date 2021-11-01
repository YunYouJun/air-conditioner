import { useEffect } from 'react'
import { useAppDispatch } from '~/app/hooks'
import {
  AcMode,
  acItemKey,
  setTemperature,
  setMode,
  setStatus,
} from '~/features/ac/acSlice'

/**
 * 通过监听 storage 来更新状态
 */
export function useDetectStorage() {
  const dispatch = useAppDispatch()
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      // 重复设置相同的键值不会触发该事件
      switch (e.key) {
        case acItemKey.status:
          dispatch(setStatus(e.newValue === 'true'))
          break
        case acItemKey.temperature:
          dispatch(setTemperature(parseInt(e.newValue || '20')))
          break
        case acItemKey.mode:
          dispatch(setMode((e.newValue || 'cold') as AcMode))
          break
        default:
          break
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
    }
  }, [dispatch])
}
