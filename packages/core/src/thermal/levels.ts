import type { HeatLevel, HeatReading } from './types'

export const heatLevels: readonly HeatLevel[] = ['nominal', 'fair', 'serious', 'critical']

/** Default Celsius thresholds for fair, serious and critical. */
export const defaultHeatThresholds: readonly [number, number, number] = [60, 75, 90]

/**
 * @param level - A heat level
 * @returns Its rank from 0 (nominal) to 3 (critical)
 */
export function heatLevelRank(level: HeatLevel): number {
  return heatLevels.indexOf(level)
}

export function isHeatLevel(value: unknown): value is HeatLevel {
  return heatLevels.includes(value as HeatLevel)
}

/**
 * Convert a temperature to a heat level. With a previous level, the value
 * must fall `hysteresis` degrees below a threshold before dropping a level,
 * which keeps readings near a threshold from flickering.
 *
 * @param celsius - Measured temperature
 * @param thresholds - Lower bounds for fair, serious and critical
 * @param previous - Level from the previous reading
 * @param hysteresis - Degrees required below a threshold to step down
 */
export function celsiusToHeatLevel(
  celsius: number,
  thresholds: readonly [number, number, number] = defaultHeatThresholds,
  previous?: HeatLevel,
  hysteresis = 5,
): HeatLevel {
  const raw = thresholds.filter(threshold => celsius >= threshold).length
  if (previous === undefined)
    return heatLevels[raw]!
  const held = thresholds.filter(threshold => celsius >= threshold - hysteresis).length
  return heatLevels[Math.max(raw, Math.min(heatLevelRank(previous), held))]!
}

/**
 * Create a filter that raises the level immediately but only lowers it after
 * lower readings persist for `dwellMs`, measured with `reading.at`.
 *
 * @param options - Governor options
 * @param options.dwellMs - Time a lower level must persist; defaults to 30 seconds
 * @returns A function that maps each reading to the settled level
 */
export function createHeatGovernor(options: { dwellMs?: number } = {}): (reading: HeatReading) => HeatLevel {
  const dwellMs = options.dwellMs ?? 30_000
  let current: HeatLevel | undefined
  let lowerSince: number | undefined

  return (reading) => {
    if (current === undefined || heatLevelRank(reading.level) >= heatLevelRank(current)) {
      current = reading.level
      lowerSince = undefined
      return current
    }
    lowerSince ??= reading.at
    if (reading.at - lowerSince >= dwellMs) {
      current = reading.level
      lowerSince = undefined
    }
    return current
  }
}
