<script setup lang="ts">
import type { AcMode } from '@yunlefun-home/air-conditioner-core'
import { acIconPaths, acSoundIcons, acSoundModeLabels } from '@yunlefun-home/air-conditioner-core'
import { computed } from 'vue'
import { useAirConditioner } from '../composables/useAirConditioner'

const emit = defineEmits<{
  command: [command: string]
}>()

const airConditioner = useAirConditioner()
const isOn = computed(() => airConditioner.state.value.status)
const sound = computed(() => airConditioner.state.value.sound)

function run(command: string, action: () => void) {
  emit('command', command)
  action()
}

function setMode(mode: AcMode) {
  run(mode, () => airConditioner.setMode(mode))
}
</script>

<template>
  <div class="acw-remote" role="group" aria-label="Air conditioner remote control">
    <div class="acw-remote-row">
      <button
        type="button"
        class="acw-button acw-button-cold"
        aria-label="cold"
        @click="setMode('cold')"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" :d="acIconPaths.cold" /></svg>
      </button>
      <button
        type="button"
        class="acw-button acw-button-power"
        :class="{ 'acw-button-on': isOn }"
        aria-label="power"
        @click="run('power', airConditioner.toggleStatus)"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" :d="acIconPaths.power" /></svg>
      </button>
      <button
        type="button"
        class="acw-button acw-button-hot"
        aria-label="hot"
        @click="setMode('hot')"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" :d="acIconPaths.hot" /></svg>
      </button>
    </div>
    <button
      type="button"
      class="acw-button acw-button-temp"
      aria-label="add"
      @click="run('increase', airConditioner.increase)"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" :d="acIconPaths.increase" /></svg>
    </button>
    <button
      type="button"
      class="acw-button acw-button-temp"
      aria-label="reduce"
      @click="run('decrease', airConditioner.decrease)"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" :d="acIconPaths.decrease" /></svg>
    </button>
    <button
      type="button"
      class="acw-button acw-button-sound"
      aria-label="sound"
      :title="`声音：${acSoundModeLabels[sound]}`"
      :data-sound="sound"
      @click="run('sound', airConditioner.cycleSound)"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" :d="acIconPaths[acSoundIcons[sound]]" /></svg>
    </button>
  </div>
</template>
