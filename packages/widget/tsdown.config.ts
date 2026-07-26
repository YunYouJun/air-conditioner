import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'AirConditionerWidget',
  dts: true,
  clean: true,
  platform: 'browser',
  deps: {
    alwaysBundle: ['@yunlefun-home/air-conditioner-core'],
  },
})
