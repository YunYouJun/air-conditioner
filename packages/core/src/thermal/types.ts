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

/**
 * A native host's reading of the computer it runs on, seen as the room the
 * air conditioner cools. Same JSON as `RoomReading` in the Swift CuteACCore
 * package; Yun Home passes it to plugins granted `sensor:thermal`.
 */
export interface RoomReading {
  /** CPU/SoC temperature, rounded; absent when no sensor is readable */
  celsius?: number
  thermalState: HeatLevel
  /** Fastest fan, rounded to 100 RPM; absent on fanless computers */
  fanRPM?: number
  /** Airflow strength 1–3, from fan load or the heat level */
  windLevel: number
}
