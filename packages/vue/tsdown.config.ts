import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    vue: true,
  },
  clean: true,
  platform: 'neutral',
  plugins: [
    Vue({ isProduction: true }),
  ],
  deps: {
    neverBundle: [
      '@yunlefun-home/air-conditioner-core',
      'vue',
    ],
  },
})
