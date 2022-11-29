import { useEffect } from 'react'
import type { AcState } from '~/types'
import { acStorageKey, defaultAcState, updateAcState } from '~/store/ac'

import { startSound, stopSound } from '~/store/sound'
/**
 * 通过监听 storage 来更新状态
 */
export function useDetectStorage() {
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      // 重复设置相同的键值不会触发该事件
      if (e.key === acStorageKey) {
        updateAcState(e.newValue ? JSON.parse(e.newValue) as AcState : defaultAcState)
        // 判断开关是否切换，以决定声音的切换
        const newValue = JSON.parse(e.newValue!)
        const oldValue = JSON.parse(e.oldValue!)
        if (newValue.status !== oldValue.status) {
          if (newValue.status)
            startSound()
          else
            stopSound()
        }
      }
    }

    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
    }
  }, [startSound, stopSound])
}
