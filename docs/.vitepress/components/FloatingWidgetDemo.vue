<script setup lang="ts">
import { withBase } from 'vitepress'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const container = ref<HTMLElement>()
const ready = ref(false)
const failed = ref(false)
const placement = ref('inline')
let widget: HTMLElement | undefined
let disposed = false

onMounted(async () => {
  try {
    const { mountAirConditioner } = await import('../../../packages/widget/src/index')
    if (disposed || !container.value)
      return
    widget = mountAirConditioner(container.value, {
      tagName: 'docs-air-conditioner',
      placement: 'inline',
      storage: null,
      enableAudio: false,
      logoUrl: '',
      assetsBaseUrl: withBase('/assets'),
    })
    ready.value = true
  }
  catch {
    failed.value = true
  }
})

function changePlacement(value: string) {
  placement.value = value
  widget?.setAttribute('placement', value)
}

onBeforeUnmount(() => {
  disposed = true
  widget?.remove()
  widget = undefined
})
</script>

<template>
  <section aria-label="悬浮挂件交互演示" class="widget-demo">
    <p>先选安装位置，再用遥控器开机。默认行内显示，不遮挡文档；本演示关闭音频与本地存储。</p>
    <div class="demo-controls" aria-label="安装位置">
      <button v-for="option in [{ value: 'inline', label: '恢复行内' }, { value: 'top-left', label: '左侧悬浮' }, { value: 'top-right', label: '右侧悬浮' }]" :key="option.value" :disabled="!ready" :aria-pressed="placement === option.value" @click="changePlacement(option.value)">
        {{ option.label }}
      </button>
    </div>
    <p role="status">
      {{ failed ? '演示加载失败，请刷新页面重试。' : !ready ? '正在加载演示…' : placement === 'inline' ? '当前：行内布局。' : '当前：悬浮布局。右下或左下按钮可展开遥控器，Esc 收起。阅读时可恢复行内。' }}
    </p>
    <div ref="container" class="demo-mount" :class="{ floating: placement !== 'inline' }" />
  </section>
</template>

<style scoped>
.widget-demo { border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 16px; }
.demo-controls { display: flex; flex-wrap: wrap; gap: 8px; }
.demo-controls button { border: 1px solid var(--vp-c-brand-1); border-radius: 6px; padding: 8px 12px; min-height: 44px; }
.demo-controls button[aria-pressed="true"] { background: var(--vp-c-brand-1); color: var(--vp-button-brand-text); }
.demo-controls button:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 3px; }
.demo-mount { max-width: 320px; margin: 24px auto; }
.demo-mount.floating { margin: 0; }
</style>
