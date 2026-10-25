import type { PreviewServer } from 'vite'
import { execFile } from 'node:child_process'
import { cp, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { expect, test } from '@playwright/test'
import { build, preview } from 'vite'
import widgetPackage from '../packages/widget/package.json' with { type: 'json' }

const { name, version } = widgetPackage

const exec = promisify(execFile)
let output: string
let server: PreviewServer
let origin: string

test.beforeAll(async () => {
  test.setTimeout(120_000)
  output = await mkdtemp(resolve(tmpdir(), 'ac-widget-package-'))
  // Pack the real public package, including prepack and workspace range rewriting.
  await exec('pnpm', ['-C', 'packages/core', 'build'])
  await exec('pnpm', ['-C', 'packages/widget', 'pack', '--pack-destination', output])
  const tarball = (await readdir(output)).find(file => file.endsWith('.tgz'))!
  await writeFile(resolve(output, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
  await exec('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', '--registry=https://registry.npmjs.org/', resolve(output, tarball)], { cwd: output })

  const installed = resolve(output, 'node_modules', name)
  const manifest = JSON.parse(await readFile(resolve(installed, 'package.json'), 'utf8'))
  expect(manifest.version).toBe(version)
  expect(manifest.dependencies['@yunlefun-home/air-conditioner-core']).toBe(version)
  // ESM and CommonJS imports are safe without browser globals, including SSR.
  for (const expression of [`await import('${name}')`, `require('${name}')`]) {
    const esm = expression.startsWith('await')
    await exec(process.execPath, [esm ? '--input-type=module' : '--input-type=commonjs', '-e', `const api = ${expression}; if (typeof api.mountAirConditioner !== 'function' || !api.cdnAssets.assetsBaseUrl.includes('@${version}/')) process.exit(1)`], { cwd: output })
  }
  await cp(resolve(installed, 'dist/embed'), resolve(output, 'public/widget'), { recursive: true })
  await writeFile(resolve(output, 'index.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Installed npm widget</title></head><body><h1>Installed npm widget</h1><script type="module" src="/main.ts"></script></body></html>')
  await writeFile(resolve(output, 'main.ts'), `
import type { MountAirConditionerOptions } from '${name}'
import { cdnAssets, mountAirConditioner } from '${name}'
const options: MountAirConditionerOptions = {
  ...cdnAssets, placement: 'top-right', enableAudio: true,
  assetsBaseUrl: '/widget/assets', logoUrl: '/widget/yun-logo.svg',
}
const widget = mountAirConditioner(document.body, options)
window.addEventListener('pagehide', () => widget.remove())
`)
  await writeFile(resolve(output, 'commonjs.cts'), `import widget = require('${name}'); const options: widget.MountAirConditionerOptions = widget.cdnAssets; void options`)
  await writeFile(resolve(output, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2020', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true, noEmit: true, skipLibCheck: true, types: [] }, include: ['main.ts', 'commonjs.cts'] }))
  await exec(process.execPath, [resolve('node_modules/typescript/bin/tsc'), '-p', output])
  await build({ root: output, configFile: false, logLevel: 'error' })
  server = await preview({ root: output, configFile: false, logLevel: 'error', preview: { host: '127.0.0.1', port: 0 } })
  const address = server.httpServer.address()
  if (!address || typeof address === 'string')
    throw new Error('Missing package preview address')
  origin = `http://127.0.0.1:${address.port}`
})

test.afterAll(async () => {
  if (server) {
    if ('closeAllConnections' in server.httpServer)
      server.httpServer.closeAllConnections()
    await new Promise<void>(done => server.httpServer.close(() => done()))
  }
  if (output)
    await rm(output, { recursive: true, force: true })
})

test('the npm tarball works in an independent typed Vite application', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => message.type() === 'error' && errors.push(message.text()))
  await page.goto(origin)
  await expect(page).toHaveTitle('Installed npm widget')
  await expect(page.getByRole('heading', { name: 'Installed npm widget' })).toBeVisible()
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  const widget = page.locator('air-conditioner-widget')
  await expect(widget).toHaveCount(1)
  expect(await page.evaluate(async () => (await document.fonts.load('16px "Digital-7 Mono"')).length)).toBe(1)
  await expect.poll(() => widget.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
  await widget.getByRole('button', { name: '打开遥控器', exact: true }).click()
  await widget.getByRole('button', { name: 'power', exact: true }).click()
  await widget.getByRole('button', { name: 'add', exact: true }).click()
  await expect(widget.locator('.acw-temperature')).toHaveText('27')
  expect(await widget.locator('audio').evaluateAll(elements => elements.length === 3 && elements.every(element => !(element as HTMLAudioElement).error))).toBe(true)
  expect(errors).toEqual([])
})
