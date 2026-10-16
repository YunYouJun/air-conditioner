<script setup lang="ts">
/**
 * Compact vector air conditioner with louver and airflow animation, for
 * device lists, scenes and thumbnails.
 */
import type { AcTone } from '@yunlefun-home/air-conditioner-core'
import { computed, useId } from 'vue'

const props = withDefaults(defineProps<{
  /** Whether the unit is running */
  active?: boolean
  tone?: AcTone
  /** 0–1 airflow intensity; faster and stronger airflow as it rises */
  airflow?: number
  /** Accessible title; the glyph is decorative when empty */
  title?: string
}>(), {
  active: false,
  tone: 'idle',
  airflow: 0.6,
  title: '',
})

const gradientId = `acw-glyph-body-${useId()}`
const intensity = computed(() => Math.min(1, Math.max(0, props.airflow)))
</script>

<template>
  <svg
    class="acw-glyph"
    :class="{ 'is-active': active }"
    :data-tone="tone"
    :style="{ '--acw-airflow': intensity }"
    viewBox="0 0 120 120"
    role="img"
    focusable="false"
    :aria-hidden="title ? undefined : 'true'"
  >
    <title v-if="title">{{ title }}</title>
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="acw-glyph__stop-top" />
        <stop offset="1" class="acw-glyph__stop-bottom" />
      </linearGradient>
    </defs>

    <g class="acw-glyph__airflow" aria-hidden="true">
      <path d="M30 86c-3 8 3 13 0 21" />
      <path d="M48 86c-3 9 3 15 0 25" />
      <path d="M66 86c-3 9 3 15 0 25" />
      <path d="M84 86c-3 8 3 13 0 21" />
    </g>

    <rect class="acw-glyph__shadow" x="9" y="35" width="102" height="52" rx="15" />
    <rect class="acw-glyph__body" x="9" y="29" width="102" height="52" rx="15" :fill="`url(#${gradientId})`" />
    <path class="acw-glyph__sheen" d="M20 36h60" />
    <g class="acw-glyph__louver">
      <path class="acw-glyph__panel" d="M16 59h88c-2 12-8 16-17 16H33c-9 0-15-4-17-16Z" />
      <path class="acw-glyph__detail" d="M25 64h70" />
      <path class="acw-glyph__detail" d="M35 69h50" />
    </g>
    <circle class="acw-glyph__led-halo" cx="95" cy="43" r="6" />
    <circle class="acw-glyph__led" cx="95" cy="43" r="3" />
  </svg>
</template>
