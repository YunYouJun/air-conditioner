<script setup lang="ts">
import type { AcMode } from '@yunlefun-home/air-conditioner-core'
import { computed } from 'vue'
import { useAirConditioner } from '../composables/useAirConditioner'

const emit = defineEmits<{
  command: [command: string]
}>()

const airConditioner = useAirConditioner()
const isOn = computed(() => airConditioner.state.value.status)

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
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="m22 11h-4.17l3.24-3.24l-1.41-1.42L15 11h-2V9l4.66-4.66l-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93L6.34 4.34L11 9v2H9L4.34 6.34L2.93 7.76L6.17 11H2v2h4.17l-3.24 3.24l1.41 1.42L9 13h2v2l-4.66 4.66l1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24l1.42-1.41L13 15v-2h2l4.66 4.66l1.41-1.42L17.83 13H22z" /></svg>
      </button>
      <button
        type="button"
        class="acw-button acw-button-power"
        :class="{ 'acw-button-on': isOn }"
        aria-label="power"
        @click="run('power', airConditioner.toggleStatus)"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M13 3h-2v10h2zm4.83 2.17l-1.42 1.42A6.92 6.92 0 0 1 19 12a7 7 0 0 1-14 0a6.92 6.92 0 0 1 2.58-5.42L6.17 5.17A9 9 0 1 0 21 12a8.94 8.94 0 0 0-3.17-6.83" /></svg>
      </button>
      <button
        type="button"
        class="acw-button acw-button-hot"
        aria-label="hot"
        @click="setMode('hot')"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 7a5 5 0 1 0 5 5a5 5 0 0 0-5-5m0-5a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1m0 17a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1M5.64 6.05L4.22 4.64a1 1 0 0 0-1.41 1.41l1.41 1.42a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42M21 11h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2M5 12a1 1 0 0 0-1-1H2a1 1 0 0 0 0 2h2a1 1 0 0 0 1-1m13.36-5.95a1 1 0 0 0 .7-.29l1.42-1.42a1 1 0 1 0-1.41-1.41l-1.42 1.41a1 1 0 0 0 0 1.42a1 1 0 0 0 .71.29m0 11.9a1 1 0 0 0-1.42 1.41l1.42 1.42a1 1 0 0 0 1.41 0a1 1 0 0 0 0-1.41ZM5.64 17.95l-1.42 1.42a1 1 0 0 0 0 1.41a1 1 0 0 0 1.41 0l1.42-1.42a1 1 0 0 0-1.41-1.41" /></svg>
      </button>
    </div>
    <button
      type="button"
      class="acw-button acw-button-temp"
      aria-label="add"
      @click="run('increase', airConditioner.increase)"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="m12 8l6 8H6z" /></svg>
    </button>
    <button
      type="button"
      class="acw-button acw-button-temp"
      aria-label="reduce"
      @click="run('decrease', airConditioner.decrease)"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="m12 16l-6-8h12z" /></svg>
    </button>
  </div>
</template>
