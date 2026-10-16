import type { HeatReading } from '../src'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  celsiusToHeatLevel,
  createComputePressureSource,
  createHeatGovernor,
  planCooling,
} from '../src'

function reading(level: HeatReading['level'], at: number): HeatReading {
  return { level, at, source: 'test' }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('celsiusToHeatLevel', () => {
  it('maps temperatures to levels', () => {
    expect(celsiusToHeatLevel(45)).toBe('nominal')
    expect(celsiusToHeatLevel(60)).toBe('fair')
    expect(celsiusToHeatLevel(80)).toBe('serious')
    expect(celsiusToHeatLevel(95)).toBe('critical')
  })

  it('only steps down once the reading clears the hysteresis band', () => {
    expect(celsiusToHeatLevel(72, undefined, 'serious')).toBe('serious')
    expect(celsiusToHeatLevel(69, undefined, 'serious')).toBe('fair')
    expect(celsiusToHeatLevel(50, undefined, 'critical')).toBe('nominal')
    expect(celsiusToHeatLevel(91, undefined, 'fair')).toBe('critical')
  })
})

describe('createHeatGovernor', () => {
  it('rises immediately and falls only after the dwell time', () => {
    const govern = createHeatGovernor({ dwellMs: 1000 })
    expect(govern(reading('nominal', 0))).toBe('nominal')
    expect(govern(reading('critical', 100))).toBe('critical')
    expect(govern(reading('fair', 200))).toBe('critical')
    expect(govern(reading('fair', 900))).toBe('critical')
    expect(govern(reading('fair', 1200))).toBe('fair')
  })

  it('restarts the dwell timer when the level climbs back', () => {
    const govern = createHeatGovernor({ dwellMs: 1000 })
    govern(reading('serious', 0))
    govern(reading('nominal', 100))
    govern(reading('serious', 600))
    expect(govern(reading('nominal', 1200))).toBe('serious')
  })
})

describe('planCooling', () => {
  it('leaves the unit alone at nominal and cools harder as heat rises', () => {
    expect(planCooling('nominal')).toBeNull()
    expect(planCooling('fair')).toEqual({ status: true, mode: 'cold', temperature: 26, airflow: 0.4 })
    expect(planCooling('critical')?.airflow).toBe(1)
    expect(planCooling('critical', { min: 23, max: 30, step: 1 })?.temperature).toBe(23)
  })
})

describe('createComputePressureSource', () => {
  it('reports unsupported environments without throwing', () => {
    const source = createComputePressureSource()
    expect(source.isSupported()).toBe(false)
    expect(() => source.start(() => {})()).not.toThrow()
  })

  it('forwards the latest CPU pressure state and disconnects', async () => {
    let emit: ((records: { source: string, state: string, time: number }[]) => void) | undefined
    const disconnect = vi.fn()
    const observe = vi.fn(async () => {})
    vi.stubGlobal('PressureObserver', class {
      constructor(callback: typeof emit) {
        emit = callback
      }

      observe = observe
      disconnect = disconnect
    })
    const listener = vi.fn()
    const source = createComputePressureSource({ sampleIntervalMs: 500 })
    expect(source.isSupported()).toBe(true)
    const stop = source.start(listener)
    expect(observe).toHaveBeenCalledWith('cpu', { sampleInterval: 500 })
    emit?.([{ source: 'cpu', state: 'fair', time: 1 }, { source: 'cpu', state: 'serious', time: 2 }])
    emit?.([{ source: 'cpu', state: 'unknown', time: 3 }])
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0]![0]).toMatchObject({ level: 'serious', source: 'compute-pressure' })
    stop()
    expect(disconnect).toHaveBeenCalled()
  })

  it('surfaces observe failures', async () => {
    const onError = vi.fn()
    vi.stubGlobal('PressureObserver', class {
      observe = () => Promise.reject(new Error('blocked'))
      disconnect() {}
    })
    createComputePressureSource({ onError }).start(() => {})
    await Promise.resolve()
    await Promise.resolve()
    expect(onError).toHaveBeenCalled()
  })
})
