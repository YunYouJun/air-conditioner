import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@yunlefun-home/air-conditioner-core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
    },
  },
})
