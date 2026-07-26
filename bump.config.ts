import { defineConfig } from 'bumpp'

const packages = [
  'core',
  'vue',
]

export default defineConfig({
  all: true,
  files: [
    'package.json',
    ...packages.map(name => `packages/${name}/package.json`),
  ],
})
