<script setup lang="ts">
/**
 * Arc gauge for a target temperature: cool on the left, warm on the right.
 * Controlled component; it only emits step requests.
 *
 * @example
 * ```vue
 * <AcTemperatureDial :value="26" :limits="defaultAcLimits" tone="cool" @change="step" />
 * ```
 */
import type { AcLimits, AcTone } from '@yunlefun-home/air-conditioner-core'
import { computed, shallowRef, useId, watch } from 'vue'

const props = withDefaults(defineProps<{
  /** Target temperature, or `null` when unknown */
  value: number | null
  limits: AcLimits
  tone: AcTone
  /** Line under the reading, e.g. "制冷运行中" */
  caption?: string
  disabled?: boolean
  size?: 'compact' | 'large'
}>(), {
  caption: '',
  disabled: false,
  size: 'compact',
})

const emit = defineEmits<{
  /** Request a one-step change */
  change: [delta: -1 | 1]
}>()

// The arc spans 260°, from bottom-left (140°) to bottom-right (40°).
const START_ANGLE = 140
const SWEEP = 260
const ARC_PATH = 'M38.72 151.42 A80 80 0 1 1 161.28 151.42'

const gradientId = `acw-dial-gradient-${useId()}`
const ratio = computed(() => {
  const { min, max } = props.limits
  if (props.value === null || max <= min)
    return 0
  return Math.min(1, Math.max(0, (props.value - min) / (max - min)))
})
const canDecrease = computed(() => props.value !== null && props.value > props.limits.min)
const canIncrease = computed(() => props.value !== null && props.value < props.limits.max)
const knobAngle = computed(() => START_ANGLE + SWEEP * ratio.value)
const ticks = computed(() => {
  const { min, max, step } = props.limits
  const count = Math.max(2, Math.min(32, Math.round((max - min) / step) + 1))
  return Array.from({ length: count }, (_, index) => {
    const angle = ((START_ANGLE + (SWEEP * index) / (count - 1)) * Math.PI) / 180
    const inner = index % 5 === 0 ? 86 : 89
    return {
      x1: 100 + 92 * Math.cos(angle),
      y1: 100 + 92 * Math.sin(angle),
      x2: 100 + inner * Math.cos(angle),
      y2: 100 + inner * Math.sin(angle),
      lit: index / (count - 1) <= ratio.value + 1e-6,
    }
  })
})

const rollDirection = shallowRef<'acw-roll-up' | 'acw-roll-down'>('acw-roll-up')
watch(() => props.value, (next, previous) => {
  if (typeof next === 'number' && typeof previous === 'number')
    rollDirection.value = next < previous ? 'acw-roll-down' : 'acw-roll-up'
})

function step(delta: -1 | 1) {
  if (props.disabled || (delta < 0 ? !canDecrease.value : !canIncrease.value))
    return
  emit('change', delta)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowRight')
    step(1)
  else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft')
    step(-1)
  else
    return
  event.preventDefault()
}
</script>

<template>
  <div class="acw-dial" :class="[`acw-dial--${size}`, { 'is-disabled': disabled }]" :data-tone="tone">
    <div
      class="acw-dial__gauge"
      role="slider"
      :tabindex="disabled ? -1 : 0"
      aria-label="目标温度"
      :aria-valuemin="limits.min"
      :aria-valuemax="limits.max"
      :aria-valuenow="value ?? undefined"
      :aria-valuetext="value === null ? '未知' : `${value} 摄氏度`"
      :aria-disabled="disabled"
      @keydown="onKeydown"
    >
      <span class="acw-dial__aura" aria-hidden="true" />
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" class="acw-dial__stop-cool" />
            <stop offset="0.55" class="acw-dial__stop-mid" />
            <stop offset="1" class="acw-dial__stop-heat" />
          </linearGradient>
        </defs>
        <g class="acw-dial__ticks">
          <line v-for="(tick, index) in ticks" :key="index" :x1="tick.x1" :y1="tick.y1" :x2="tick.x2" :y2="tick.y2" :data-lit="tick.lit" />
        </g>
        <path class="acw-dial__track" :d="ARC_PATH" pathLength="100" />
        <path
          class="acw-dial__progress"
          :d="ARC_PATH"
          pathLength="100"
          :stroke="`url(#${gradientId})`"
          :style="{ strokeDasharray: `${ratio * 100} 100` }"
        />
        <g class="acw-dial__knob" :style="{ transform: `rotate(${knobAngle}deg)` }">
          <circle class="acw-dial__knob-glow" cx="180" cy="100" r="11" />
          <circle class="acw-dial__knob-dot" cx="180" cy="100" r="6.5" />
        </g>
      </svg>
      <div class="acw-dial__readout">
        <strong>
          <span class="acw-dial__number">
            <Transition :name="rollDirection">
              <span :key="String(value)">{{ value ?? '—' }}</span>
            </Transition>
          </span>
          <sup>°C</sup>
        </strong>
        <small v-if="caption">{{ caption }}</small>
      </div>
    </div>
    <div class="acw-dial__steps">
      <button class="acw-dial__step" type="button" aria-label="降低温度" :disabled="disabled || !canDecrease" @click="step(-1)">
        −
      </button>
      <span class="acw-dial__range">{{ limits.min }}° – {{ limits.max }}°</span>
      <button class="acw-dial__step" type="button" aria-label="升高温度" :disabled="disabled || !canIncrease" @click="step(1)">
        +
      </button>
    </div>
  </div>
</template>
