<script setup lang="ts">
import { acReducer, acTone, createComputePressureSource, defaultAcLimits, defaultAcState, planCooling } from '@yunlefun-home/air-conditioner-core'
import { computed, shallowRef, watch } from 'vue'
import AirConditionerWidget from '../components/AirConditionerWidget.vue'
import { AcGlyph, AcTemperatureDial, useHeatSource } from '../controls'
import '../style.css'
import '../controls/controls.css'

const state = shallowRef({ ...defaultAcState })
const tone = computed(() => acTone(state.value))
const coolingEnabled = shallowRef(false)
const { supported, level } = useHeatSource(createComputePressureSource(), { enabled: coolingEnabled })
const plan = computed(() => level.value ? planCooling(level.value) : null)

watch(plan, (next) => {
  if (next)
    state.value = { ...state.value, status: next.status, mode: next.mode, temperature: next.temperature }
})

function step(delta: -1 | 1) {
  state.value = acReducer(state.value, { type: delta > 0 ? 'increment' : 'decrement' }, defaultAcLimits)
}
</script>

<template>
  <main class="demo">
    <h1>便携小空调 Vue</h1>
    <AirConditionerWidget />

    <section class="demo__controls" aria-label="Controls">
      <h2>Controls</h2>
      <div class="demo__glyph">
        <AcGlyph :active="state.status" :tone="tone" :airflow="plan?.airflow ?? 0.6" title="空调" />
      </div>
      <AcTemperatureDial
        :value="state.temperature"
        :limits="defaultAcLimits"
        :tone="tone"
        :caption="state.status ? (state.mode === 'hot' ? '制热运行中' : '制冷运行中') : '待机'"
        @change="step"
      />
      <div class="demo__actions">
        <button type="button" @click="state = acReducer(state, { type: 'toggleStatus' })">
          {{ state.status ? '关机' : '开机' }}
        </button>
        <button type="button" @click="state = acReducer(state, { type: 'mode', mode: state.mode === 'cold' ? 'hot' : 'cold' })">
          切换为{{ state.mode === 'cold' ? '制热' : '制冷' }}
        </button>
        <button v-if="supported" type="button" :aria-pressed="coolingEnabled" @click="coolingEnabled = !coolingEnabled">
          {{ coolingEnabled ? `电脑降温中 · ${level ?? '读取中'}` : '电脑降温' }}
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.demo {
  display: grid;
  min-height: 100vh;
  place-items: center;
  align-content: center;
  gap: 24px;
  margin: 0;
  padding: 24px;
}

h1 {
  margin: 0;
  font-size: 28px;
}

.demo__controls {
  display: grid;
  justify-items: center;
  gap: 16px;
}

.demo__controls h2 {
  margin: 0;
  font-size: 18px;
}

.demo__glyph {
  width: 120px;
  height: 120px;
}

.demo__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
</style>
