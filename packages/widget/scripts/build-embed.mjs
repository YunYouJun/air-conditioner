import { cp, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { build } from 'tsdown'

const widgetRoot = fileURLToPath(new URL('../', import.meta.url))
const outDir = resolve(process.argv[2] || resolve(widgetRoot, 'dist/embed'))
const publicDir = resolve(widgetRoot, '../react/public')

// Bundle from source so a fresh website build doesn't need library builds first.
await build({
  config: false,
  entry: { embed: resolve(widgetRoot, 'src/embed.ts') },
  outDir,
  format: 'iife',
  outputOptions: { entryFileNames: '[name].js' },
  platform: 'browser',
  target: 'es2020',
  dts: false,
  minify: true,
  clean: false,
  alias: {
    '@yunlefun-home/air-conditioner-core': resolve(widgetRoot, '../core/src/index.ts'),
  },
  deps: { alwaysBundle: ['@yunlefun-home/air-conditioner-core'] },
})

await mkdir(resolve(outDir, 'assets/audio'), { recursive: true })
await cp(resolve(publicDir, 'assets/fonts'), resolve(outDir, 'assets/fonts'), { recursive: true })
for (const name of ['di', 'ac-work', 'air-extractor-fan'])
  await cp(resolve(publicDir, `assets/audio/${name}.m4a`), resolve(outDir, `assets/audio/${name}.m4a`))
await cp(resolve(publicDir, 'yun-logo.svg'), resolve(outDir, 'yun-logo.svg'))
await cp(resolve(widgetRoot, '../../LICENSE'), resolve(outDir, 'LICENSE'))
await cp(resolve(widgetRoot, 'README.md'), resolve(outDir, 'README.md'))
await cp(resolve(widgetRoot, 'embed-demo.html'), resolve(outDir, 'index.html'))
