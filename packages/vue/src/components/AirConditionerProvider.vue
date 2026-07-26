<script setup lang="ts">
import type { AcChangeEvent, AcNotification, AcState } from '@yunlefun-home/air-conditioner-core'
import { createAirConditionerStore } from '@yunlefun-home/air-conditioner-core'
import { onUnmounted, provide } from 'vue'
import {
  airConditionerKey,
  createAirConditionerContext,
} from '../composables/useAirConditioner'

const props = defineProps<{
  initialState?: Partial<AcState>
  storageKey?: string
  storage?: Storage | null
}>()

const emit = defineEmits<{
  change: [event: AcChangeEvent]
  notify: [notification: AcNotification, event: AcChangeEvent]
}>()

const store = createAirConditionerStore({
  initialState: props.initialState,
  storageKey: props.storageKey,
  storage: props.storage,
  onNotify(notification, event) {
    emit('notify', notification, event)
  },
})
const context = createAirConditionerContext(store)
const unsubscribe = store.subscribe((event) => {
  emit('change', event)
})

provide(airConditionerKey, context)

onUnmounted(() => {
  unsubscribe()
})
</script>

<template>
  <slot :state="context.state.value" />
</template>
