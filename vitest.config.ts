import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // 编译 Vue 组件测试里引入的 .vue 文件
  plugins: [vue()],
  resolve: {
    alias: {
      '@yunlefun-home/air-conditioner-core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@yunlefun-home/air-conditioner-widget': fileURLToPath(new URL('./packages/widget/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/**/*.test.ts'],
  },
})
