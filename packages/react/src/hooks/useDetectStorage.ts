import type { AcState } from '~/types'
import { acStorageKey, defaultAcState } from '@yunlefun-home/air-conditioner-core'
import { useEffect } from 'react'
import { useAcCtx } from '~/context'

/**
 * 通过监听 storage 来更新状态
 */
export function useDetectStorage() {
  const { dispatch } = useAcCtx()

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      // 重复设置相同的键值不会触发该事件
      if (e.key === acStorageKey) {
        dispatch({
          type: 'update',
          payload: e.newValue ? JSON.parse(e.newValue) as AcState : defaultAcState,
        })
      }
    }

    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
    }
  }, [dispatch])
}
