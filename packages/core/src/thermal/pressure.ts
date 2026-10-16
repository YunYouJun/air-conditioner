import type { HeatReading, HeatSource } from './types'
import { isHeatLevel } from './levels'

interface PressureRecord {
  source: string
  state: string
  time: number
}

interface PressureObserverInstance {
  observe: (source: 'cpu', options?: { sampleInterval?: number }) => Promise<void>
  disconnect: () => void
}

type PressureObserverConstructor = new (callback: (records: PressureRecord[]) => void) => PressureObserverInstance

function getPressureObserver(): PressureObserverConstructor | undefined {
  return (globalThis as { PressureObserver?: PressureObserverConstructor }).PressureObserver
}

export interface ComputePressureSourceOptions {
  /** Requested sample interval; browsers may deliver less often */
  sampleIntervalMs?: number
  /** Called when observing fails, e.g. blocked by permissions policy */
  onError?: (error: unknown) => void
}

/**
 * Heat source backed by the browser Compute Pressure API. It reports CPU
 * load levels, not temperatures; browsers expose no CPU temperature.
 *
 * Supported in Chromium-based browsers on secure origins. The API is only
 * touched when the source is started.
 *
 * @param options - Sampling and error handling options
 */
export function createComputePressureSource(options: ComputePressureSourceOptions = {}): HeatSource {
  return {
    id: 'compute-pressure',
    isSupported: () => typeof getPressureObserver() === 'function',
    start(listener) {
      const Observer = getPressureObserver()
      if (!Observer)
        return () => {}
      let stopped = false
      const observer = new Observer((records) => {
        const record = records.at(-1)
        if (stopped || !record || !isHeatLevel(record.state))
          return
        const reading: HeatReading = {
          level: record.state,
          source: 'compute-pressure',
          at: Date.now(),
        }
        listener(reading)
      })
      observer.observe('cpu', { sampleInterval: options.sampleIntervalMs ?? 2000 }).catch((error) => {
        if (!stopped)
          options.onError?.(error)
      })
      return () => {
        stopped = true
        observer.disconnect()
      }
    },
  }
}
