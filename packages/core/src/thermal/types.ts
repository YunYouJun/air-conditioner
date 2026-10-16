/**
 * Heat levels shared by the browser Compute Pressure API and macOS
 * `ProcessInfo.ThermalState`, so web and native hosts speak the same language.
 */
export type HeatLevel = 'nominal' | 'fair' | 'serious' | 'critical'

export interface HeatReading {
  level: HeatLevel
  /** Real temperature, only when the source can measure one */
  celsius?: number
  /** Identifier of the source that produced the reading */
  source: string
  /** Epoch milliseconds */
  at: number
}

/**
 * Something that reports how hot a computer is.
 */
export interface HeatSource {
  id: string
  /** Whether the current environment can provide readings */
  isSupported: () => boolean
  /**
   * Start delivering readings.
   *
   * @returns A function that stops the source
   */
  start: (listener: (reading: HeatReading) => void) => () => void
}

/**
 * What the virtual air conditioner should do for a heat level.
 */
export interface CoolingPlan {
  status: true
  mode: 'cold'
  temperature: number
  /** 0–1, drives airflow intensity */
  airflow: number
}
