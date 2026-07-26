import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@yunlefun-home/air-conditioner-core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@air-conditioner/widget': fileURLToPath(new URL('./packages/widget/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/**/*.test.ts'],
  },
})
