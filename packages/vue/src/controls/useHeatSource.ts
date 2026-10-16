import type { HeatLevel, HeatReading, HeatSource } from '@yunlefun-home/air-conditioner-core'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { createHeatGovernor } from '@yunlefun-home/air-conditioner-core'
import { onScopeDispose, shallowRef, toValue, watch } from 'vue'

export interface UseHeatSourceOptions {
  /** Start and stop the source reactively; defaults to `true` */
  enabled?: MaybeRefOrGetter<boolean>
  /** Time a lower level must persist before it is adopted */
  dwellMs?: number
}

export interface UseHeatSourceReturn {
  /** Whether the source works in this environment (always `false` during SSR) */
  supported: Ref<boolean>
  /** Last raw reading */
  reading: Ref<HeatReading | null>
  /** Settled level after the rise-fast, fall-slow governor */
  level: Ref<HeatLevel | null>
}

/**
 * Subscribe to a heat source while it is enabled.
 *
 * @param source - Heat source, or `null` to stay idle
 * @param options - Enable switch and governor dwell time
 *
 * @example
 * ```ts
 * const enabled = ref(false)
 * const { supported, level } = useHeatSource(createComputePressureSource(), { enabled })
 * ```
 */
export function useHeatSource(source: MaybeRefOrGetter<HeatSource | null>, options: UseHeatSourceOptions = {}): UseHeatSourceReturn {
  const supported = shallowRef(false)
  const reading = shallowRef<HeatReading | null>(null)
  const level = shallowRef<HeatLevel | null>(null)
  let stop: (() => void) | undefined

  function teardown() {
    stop?.()
    stop = undefined
    reading.value = null
    level.value = null
  }

  watch(
    () => [toValue(source), toValue(options.enabled ?? true)] as const,
    ([current, enabled]) => {
      teardown()
      supported.value = typeof window !== 'undefined' && Boolean(current?.isSupported())
      if (!current || !enabled || !supported.value)
        return
      const govern = createHeatGovernor({ dwellMs: options.dwellMs })
      stop = current.start((next) => {
        reading.value = next
        level.value = govern(next)
      })
    },
    { immediate: true },
  )

  onScopeDispose(teardown)

  return { supported, reading, level }
}
