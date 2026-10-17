import { defineConfig } from 'tsdown'

// The plugin runs in a bare JavaScriptCore context: one self-contained script,
// no module loader, no host APIs.
export default defineConfig({
  entry: { state: 'src/entry.ts' },
  format: ['iife'],
  clean: true,
  minify: true,
  platform: 'neutral',
  target: 'es2020',
  deps: {
    alwaysBundle: ['@yunlefun-home/air-conditioner-core'],
  },
})
