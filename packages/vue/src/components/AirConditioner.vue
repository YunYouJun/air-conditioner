<script setup lang="ts">
import type { AcState } from '@yunlefun-home/air-conditioner-core'
import { acModeIcons, acShellSize, defaultAcState, observeAcScale, observeAcTilt } from '@yunlefun-home/air-conditioner-core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useOptionalAirConditioner } from '../composables/useAirConditioner'
import EnergyLabel from './EnergyLabel.vue'

const props = withDefaults(defineProps<{
  /**
   * 直接覆盖部分状态（无 Provider 上下文时用于受控 / 静态展示）。
   * 优先级高于上下文。
   */
  overrides?: Partial<AcState>
  /** 中央 Logo 图片地址，留空则不显示 */
  logoUrl?: string
  /** Logo 链接 */
  logoHref?: string
  /** 是否显示能效标签 */
  showEnergyLabel?: boolean
}>(), {
  logoUrl: '/yun-logo.svg',
  logoHref: 'https://github.com/YunYouJun/air-conditioner',
  showEnergyLabel: true,
})

const context = useOptionalAirConditioner()
const state = computed<AcState>(() => ({
  ...defaultAcState,
  ...context?.state.value,
  ...props.overrides,
}))

const modeIcon = computed(() => acModeIcons[state.value.mode])

/**
 * 数字切换方向：升温从下方滚入，降温从上方滚入；首次渲染不播放。
 */
const temperatureDirection = ref<'up' | 'down'>()
watch(() => state.value.temperature, (value, previous) => {
  temperatureDirection.value = value > previous ? 'up' : 'down'
})

/** 窄容器下机身等比缩小，保持长款比例 */
const unitRef = ref<HTMLElement>()
const scale = ref(1)
/** 指针跟随的轻微 3D 倾斜 */
const tilt = ref<[number, number]>([0, 0])
const cleanups: (() => void)[] = []
onMounted(() => {
  if (!unitRef.value)
    return
  cleanups.push(
    observeAcScale(unitRef.value, acShellSize.compact.width, value => scale.value = value),
    observeAcTilt(unitRef.value, (x, y) => tilt.value = [x, y]),
  )
})
onBeforeUnmount(() => cleanups.forEach(cleanup => cleanup()))

/** 模式图标仅在切换后弹出，避免首屏就播放 */
const modeChanged = ref(false)
watch(() => state.value.mode, () => {
  modeChanged.value = true
})
</script>

<template>
  <div
    ref="unitRef"
    class="acw-unit"
    :data-mode="state.mode"
    :data-status="state.status ? 'on' : 'off'"
    :style="{ '--acw-scale': scale, '--acw-tilt-x': `${tilt[0]}deg`, '--acw-tilt-y': `${tilt[1]}deg` }"
  >
    <div class="acw-shell">
      <!-- 能效标签 -->
      <EnergyLabel v-if="showEnergyLabel" />

      <!-- 显示屏（仅开机时显示） -->
      <div class="acw-display" aria-live="polite">
        <div class="acw-display-mode">
          <span :key="state.mode" class="acw-mode-icon" :data-animate="modeChanged || undefined">{{ modeIcon }}</span>
        </div>
        <div class="acw-display-temp">
          <span class="acw-readout">
            <span
              :key="state.temperature"
              class="acw-digit acw-temperature"
              :data-dir="temperatureDirection"
            >{{ state.temperature }}</span>
            <small class="acw-digit">°C</small>
          </span>
          <span class="acw-digit acw-selftest" aria-hidden="true">88</span>
        </div>
      </div>

      <!-- 中央 Logo -->
      <div v-if="logoUrl" class="acw-logo">
        <a :href="logoHref" target="_blank" rel="noreferrer noopener">
          <img :src="logoUrl" alt="logo">
        </a>
      </div>

      <!-- 出风口线 -->
      <div class="acw-outlet" />

      <!-- 出风口与导风板（开机时打开） -->
      <div class="acw-vent" aria-hidden="true" />
      <div class="acw-louver" aria-hidden="true" />

      <!-- 状态指示灯 -->
      <span class="acw-led" :aria-label="state.status ? 'on' : 'off'" />
    </div>

    <!-- 风特效 -->
    <div class="acw-wind" :aria-hidden="!state.status">
      <span class="acw-wind-line" />
      <span class="acw-wind-line" />
      <span class="acw-wind-line" />
    </div>
  </div>
</template>
