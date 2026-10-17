<script setup lang="ts">
import type { AcChangeEvent, AcNotification, AcState } from '@yunlefun-home/air-conditioner-core'
import { acIconPaths, createAcNotificationPresenter, resolveAcAudioAssets } from '@yunlefun-home/air-conditioner-core'
import { computed, onUnmounted, ref, shallowRef } from 'vue'
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

const { handleChange: handleAudio, drip } = useAcAudio(() => ({
  beep: beepEl.value,
  start: startEl.value,
  work: workEl.value,
}))

/** 节能建议以「出风口吹出的小纸条」显示，其余提示只给读屏播报 */
const present = createAcNotificationPresenter()
const note = shallowRef<AcNotification | undefined>()
/** 纸条吹出时的模式：之后再切换模式，已经吹出的纸条不变色 */
const noteMode = ref<AcState['mode']>('cold')
/** 每张纸条自增，用作 key 让新的建议重新播放「吹出」动画 */
const noteId = ref(0)
const announcement = ref('')
let hideTimer: ReturnType<typeof setTimeout> | undefined

function showNote(value: AcNotification, mode: AcState['mode']) {
  note.value = value
  noteMode.value = mode
  noteId.value++
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    note.value = undefined
  }, 3600)
}

onUnmounted(() => clearTimeout(hideTimer))

function onChange(event: AcChangeEvent) {
  if (props.enableAudio)
    handleAudio(event)
  emit('change', event)
}

function onNotify(value: AcNotification, event: AcChangeEvent) {
  const how = present(value, event.state)
  if (how === 'note')
    showNote(value, event.state.mode)
  else if (how !== 'skip')
    announcement.value = value.message
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

        <AirConditioner :logo-url="logoUrl" :show-energy-label="showEnergyLabel" @drip="enableAudio && drip()" />

        <!-- 常驻的 live region，紧贴出风口；内部提示切换时才会被读屏正确播报 -->
        <div class="acw-notification-region" role="status">
          <Transition name="acw-note">
            <div v-if="note" :key="noteId" class="acw-note" :data-severity="note.severity" :data-mode="noteMode">
              <span class="acw-note-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" :d="acIconPaths.leaf" /></svg>
              </span>
              <span class="acw-note-text">
                <strong>{{ note.message }}</strong>
                <small v-if="note.detail">{{ note.detail }}</small>
              </span>
            </div>
          </Transition>
          <span class="acw-sr-only">{{ announcement }}</span>
        </div>

        <RemoteControl />
      </div>
    </template>
  </AirConditionerProvider>
</template>
