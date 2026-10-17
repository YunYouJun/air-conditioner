<script setup lang="ts">
import type { AcIconName, AcMode, AcRemoteCommand } from '@yunlefun-home/air-conditioner-core'
import { acIconPaths, acSoundIcons, getAcRemoteText } from '@yunlefun-home/air-conditioner-core'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useAirConditioner } from '../composables/useAirConditioner'

const emit = defineEmits<{
  command: [command: string]
}>()

const modes: { mode: AcMode, icon: AcIconName }[] = [
  { mode: 'cold', icon: 'cold' },
  { mode: 'hot', icon: 'hot' },
]

const airConditioner = useAirConditioner()
const state = computed(() => airConditioner.state.value)
const text = computed(() => getAcRemoteText(state.value))

/** 温度到上下限时小屏抖一下，代替弹出提示 */
const alert = ref(false)
let alertTimer: ReturnType<typeof setTimeout> | undefined
watch(airConditioner.notification, (notification) => {
  if (notification?.kind !== 'limit')
    return
  alert.value = false
  clearTimeout(alertTimer)
  requestAnimationFrame(() => {
    alert.value = true
    alertTimer = setTimeout(() => {
      alert.value = false
    }, 400)
  })
})
onUnmounted(() => clearTimeout(alertTimer))

function run(command: AcRemoteCommand, action: () => void) {
  emit('command', command)
  action()
}

function setMode(mode: AcMode) {
  run(mode, () => airConditioner.setMode(mode))
}
</script>

<template>
  <div class="acw-remote" role="group" aria-label="Air conditioner remote control">
    <div
      class="acw-lcd"
      role="img"
      :aria-label="text.display"
      :data-status="state.status ? 'on' : 'off'"
      :data-mode="state.mode"
      :data-swing="state.swing ? 'on' : 'off'"
      :data-fan="state.fan ?? 'auto'"
      :data-alert="alert ? '' : undefined"
    >
      <div class="acw-lcd-main">
        <svg class="acw-lcd-mode" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" :d="acIconPaths[state.mode]" /></svg>
        <span class="acw-lcd-temp acw-digit">{{ state.temperature }}<small>°C</small></span>
      </div>
      <div class="acw-lcd-status" aria-hidden="true">
        <span class="acw-lcd-wind"><i /><i /><i /><b>自动</b></span>
        <svg class="acw-lcd-swing" viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" :d="acIconPaths.swing" /></svg>
        <svg class="acw-lcd-sound" :data-sound="state.sound" viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" :d="acIconPaths[acSoundIcons[state.sound]]" /></svg>
      </div>
    </div>

    <button
      type="button"
      class="acw-button acw-button-power"
      :class="{ 'acw-button-on': state.status }"
      aria-label="power"
      :aria-pressed="state.status"
      :title="text.power"
      @click="run('power', airConditioner.toggleStatus)"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" :d="acIconPaths.power" /></svg>
    </button>

    <div class="acw-remote-temp">
      <button
        type="button"
        class="acw-button acw-button-temp"
        aria-label="add"
        title="温度 +"
        @click="run('increase', airConditioner.increase)"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" :d="acIconPaths.plus" /></svg>
      </button>
      <button
        type="button"
        class="acw-button acw-button-temp"
        aria-label="reduce"
        title="温度 −"
        @click="run('decrease', airConditioner.decrease)"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" :d="acIconPaths.minus" /></svg>
      </button>
    </div>

    <div class="acw-remote-row">
      <div class="acw-remote-mode" role="group" aria-label="mode">
        <button
          v-for="item in modes"
          :key="item.mode"
          type="button"
          class="acw-button"
          :class="`acw-button-${item.mode}`"
          :aria-label="item.mode"
          :aria-pressed="state.mode === item.mode"
          :title="text.mode[item.mode]"
          @click="setMode(item.mode)"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" :d="acIconPaths[item.icon]" /></svg>
        </button>
      </div>
      <button
        type="button"
        class="acw-button acw-button-fan"
        aria-label="fan"
        :title="text.fan"
        :data-fan="state.fan ?? 'auto'"
        @click="run('fan', airConditioner.cycleFan)"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" :d="acIconPaths.fan" /></svg>
      </button>
      <button
        type="button"
        class="acw-button acw-button-swing"
        aria-label="swing"
        :aria-pressed="state.swing"
        :title="text.swing"
        @click="run('swing', airConditioner.toggleSwing)"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" :d="acIconPaths.swing" /></svg>
      </button>
      <button
        type="button"
        class="acw-button acw-button-sound"
        aria-label="sound"
        :title="text.sound"
        :data-sound="state.sound"
        @click="run('sound', airConditioner.cycleSound)"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" :d="acIconPaths[acSoundIcons[state.sound]]" /></svg>
      </button>
    </div>
  </div>
</template>
