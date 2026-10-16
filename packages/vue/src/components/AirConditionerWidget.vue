<script setup lang="ts">
import type { AcChangeEvent, AcNotification, AcState } from '@yunlefun-home/air-conditioner-core'
import { resolveAcAudioAssets } from '@yunlefun-home/air-conditioner-core'
import { computed, ref, shallowRef } from 'vue'
import { useAcAudio } from '../composables/useAcAudio'
import AirConditioner from './AirConditioner.vue'
import AirConditionerProvider from './AirConditionerProvider.vue'
import RemoteControl from './RemoteControl.vue'

const props = withDefaults(defineProps<{
  initialState?: Partial<AcState>
  storageKey?: string
  storage?: Storage | null
  /** 中央 Logo 图片地址 */
  logoUrl?: string
  /** 静态资源基础路径（音频 / 字体所在目录） */
  assetsBaseUrl?: string
  /** 音频扩展名 */
  audioExt?: string
  /** 是否启用音效 */
  enableAudio?: boolean
  /** 是否显示能效标签 */
  showEnergyLabel?: boolean
}>(), {
  logoUrl: '/yun-logo.svg',
  assetsBaseUrl: '/assets',
  audioExt: 'm4a',
  enableAudio: true,
  showEnergyLabel: true,
})

const emit = defineEmits<{
  change: [event: AcChangeEvent]
  notify: [notification: AcNotification, event: AcChangeEvent]
}>()

const audioSrc = computed(() => resolveAcAudioAssets(`${props.assetsBaseUrl}/audio`, props.audioExt))

const beepEl = ref<HTMLAudioElement | null>(null)
const startEl = ref<HTMLAudioElement | null>(null)
const workEl = ref<HTMLAudioElement | null>(null)

const { handleChange: handleAudio } = useAcAudio(() => ({
  beep: beepEl.value,
  start: startEl.value,
  work: workEl.value,
}))

const notification = shallowRef<AcNotification | undefined>()
/** 每次通知自增，用作 key 让重复的提示也能重新播放进入动画 */
const notificationId = ref(0)

function onChange(event: AcChangeEvent) {
  if (props.enableAudio)
    handleAudio(event)
  emit('change', event)
}

function onNotify(value: AcNotification, event: AcChangeEvent) {
  notification.value = value
  notificationId.value++
  emit('notify', value, event)
}
</script>

<template>
  <AirConditionerProvider
    :initial-state="initialState"
    :storage-key="storageKey"
    :storage="storage"
    @notify="onNotify"
    @change="onChange"
  >
    <template #default="{ state }">
      <div
        class="acw-root"
        :data-mode="state.mode"
        :data-status="state.status ? 'on' : 'off'"
      >
        <audio v-if="enableAudio" ref="beepEl" :src="audioSrc.beep" preload="auto" />
        <audio v-if="enableAudio" ref="startEl" :src="audioSrc.start" preload="auto" />
        <audio v-if="enableAudio" ref="workEl" :src="audioSrc.work" preload="auto" />

        <AirConditioner :logo-url="logoUrl" :show-energy-label="showEnergyLabel" />
        <RemoteControl />

        <!-- 常驻的 live region，内部提示切换时才会被读屏正确播报 -->
        <div class="acw-notification-region" role="status">
          <Transition name="acw-notify" mode="out-in">
            <div
              v-if="notification"
              :key="notificationId"
              class="acw-notification"
              :data-severity="notification.severity"
            >
              {{ notification.message }}
            </div>
          </Transition>
        </div>
      </div>
    </template>
  </AirConditionerProvider>
</template>
