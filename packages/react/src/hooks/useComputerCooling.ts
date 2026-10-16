import type { HeatLevel } from '@yunlefun-home/air-conditioner-core'
import { createComputePressureSource, createHeatGovernor, planCooling } from '@yunlefun-home/air-conditioner-core'
import { useEffect, useState } from 'react'
import { useAcCtx } from '~/context'

/**
 * "电脑降温": follow the computer's CPU pressure and switch the air
 * conditioner to cooling when the computer works hard.
 *
 * Only reacts when the settled level changes, so manual adjustments in
 * between are kept.
 */
export function useComputerCooling() {
  const { dispatch } = useAcCtx()
  const [supported] = useState(() => createComputePressureSource().isSupported())
  const [enabled, setEnabled] = useState(false)
  const [level, setLevel] = useState<HeatLevel | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !supported)
      return
    setError(null)
    const govern = createHeatGovernor()
    const stop = createComputePressureSource({
      onError: () => setError('浏览器拒绝读取 CPU 压力'),
    }).start(reading => setLevel(govern(reading)))
    return () => {
      stop()
      setLevel(null)
    }
  }, [enabled, supported])

  useEffect(() => {
    const plan = level ? planCooling(level) : null
    if (!enabled || !plan)
      return
    dispatch({ type: 'update', payload: { status: plan.status, mode: plan.mode, temperature: plan.temperature } })
  }, [level, enabled, dispatch])

  return { supported, enabled, setEnabled, level, error }
}
