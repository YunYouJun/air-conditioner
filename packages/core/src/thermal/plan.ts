import type { AcLimits } from '../types'
import type { CoolingPlan, HeatLevel } from './types'
import { clampTemperature } from '../reducer'

const coolingByLevel: Record<Exclude<HeatLevel, 'nominal'>, { temperature: number, airflow: number }> = {
  fair: { temperature: 26, airflow: 0.4 },
  serious: { temperature: 24, airflow: 0.7 },
  critical: { temperature: 22, airflow: 1 },
}

/**
 * Decide how the virtual air conditioner should respond to a heat level.
 *
 * @param level - Settled heat level
 * @param limits - Device limits used to clamp the target temperature
 * @returns A cooling plan, or `null` at `nominal` so the user keeps control
 */
export function planCooling(level: HeatLevel, limits?: AcLimits): CoolingPlan | null {
  if (level === 'nominal')
    return null
  const { temperature, airflow } = coolingByLevel[level]
  return {
    status: true,
    mode: 'cold',
    temperature: clampTemperature(temperature, limits),
    airflow,
  }
}
