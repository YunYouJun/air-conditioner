import type { Server } from 'node:http'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, resolve } from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { expect, test } from '@playwright/test'
import widgetPackage from '../packages/widget/package.json' with { type: 'json' }

const { name, version } = widgetPackage

const cdnBase = `https://cdn.jsdelivr.net/npm/${name}@${version}/dist/embed/`

let output: string
let assets: Server
let host: Server
let assetOrigin: string
let hostOrigin: string

async function listen(server: Server) {
  await new Promise<void>((done, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', done)
  })
  const address = server.address()
  if (!address || typeof address === 'string')
    throw new Error('Missing test server address')
  return `http://127.0.0.1:${address.port}`
}

test.beforeAll(async () => {
  output = await mkdtemp(resolve(tmpdir(), 'ac-embed-test-'))
  await promisify(execFile)(process.execPath, ['packages/widget/scripts/build-embed.mjs', output])
  const headers = await readFile('packages/react/public/_headers', 'utf8')
  expect(headers).toMatch(/\/widget\/\*\s+Access-Control-Allow-Origin: \*/)
  assets = createServer(async (req, res) => {
    const path = new URL(req.url!, 'http://localhost').pathname.replace(/^\/(?:air-conditioner\/)?widget\//, '')
    const file = resolve(output, path || 'index.html')
    if (!file.startsWith(`${output}/`)) {
      res.writeHead(404).end()
      return
    }
    try {
      const contents = await readFile(file)
      const type: Record<string, string> = { '.js': 'text/javascript', '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.m4a': 'audio/mp4' }
      res.writeHead(200, { 'Content-Type': type[extname(file)] || 'text/plain', 'Access-Control-Allow-Origin': '*' }).end(contents)
    }
    catch {
      res.writeHead(404).end()
    }
  })
  assetOrigin = await listen(assets)
  host = createServer((req, res) => {
    const query = new URL(req.url!, 'http://localhost').searchParams
    const prefix = query.has('subpath') ? '/air-conditioner/widget' : '/widget'
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(`<!doctype html>
      <html><head><title>Host blog</title><meta name="viewport" content="width=device-width, initial-scale=1">
      <script ${query.has('defer') ? 'defer' : ''} src="${assetOrigin}${prefix}/embed.js" data-placement="${query.has('left') ? 'top-left' : 'top-right'}" data-audio="${query.has('audio')}" data-storage-key="blog:ac"></script>
      </head><body style="margin: 200px 24px; font-family: sans-serif">
      <h1>A blog with an air conditioner</h1><p>The widget is served from another origin.</p>
      <button id="host-action" onclick="this.textContent='Still works'">Read article</button>
      </body></html>`)
  })
  hostOrigin = await listen(host)
})

test.afterAll(async () => {
  for (const server of [host, assets]) {
    if (server) {
      server.closeAllConnections()
      await new Promise<void>(done => server.close(() => done()))
    }
  }
  if (output)
    await rm(output, { recursive: true, force: true })
})

for (const mobile of [false, true]) {
  test(`built embed on an unrelated ${mobile ? 'mobile' : 'desktop'} site`, async ({ page }, testInfo) => {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 })
    const errors: string[] = []
    const loaded: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => message.type() === 'error' && errors.push(message.text()))
    page.on('response', response => response.ok() && loaded.push(response.url()))
    // No defer on desktop exercises the DOM-ready path; mobile uses a nested CDN path.
    const url = `${hostOrigin}/posts/nested/article${mobile ? '?subpath&defer&left&audio' : ''}`
    await page.goto(url)
    await expect(page).toHaveURL(url)
    await expect(page).toHaveTitle('Host blog')
    await expect(page.getByRole('heading', { name: 'A blog with an air conditioner' })).toBeVisible()
    await expect(page.locator('vite-error-overlay')).toHaveCount(0)
    const widget = page.locator('air-conditioner-embed')
    await expect(widget).toHaveCount(1)
    await expect(widget).toHaveAttribute('placement', mobile ? 'top-left' : 'top-right')
    await expect(widget.locator('audio')).toHaveCount(mobile ? 3 : 0)
    expect(await page.evaluate(async () => (await document.fonts.load('16px "Digital-7 Mono"')).length)).toBe(1)
    await expect.poll(() => loaded.some(url => url.endsWith('/fonts/digital-7-mono.ttf'))).toBe(true)
    await expect.poll(() => widget.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)

    const toggle = widget.getByRole('button', { name: '打开遥控器', exact: true })
    if (mobile)
      await toggle.click()
    else
      await toggle.press('Enter')
    const power = widget.getByRole('button', { name: 'power', exact: true })
    await power.click()
    await widget.getByRole('button', { name: 'add', exact: true }).click()
    await expect(widget.locator('.acw-temperature')).toHaveText('27')
    if (mobile) {
      await expect.poll(() => loaded.filter(url => url.endsWith('.m4a')).length).toBeGreaterThanOrEqual(3)
      expect(await widget.locator('audio').evaluateAll(elements => elements.every(element => !(element as HTMLAudioElement).error))).toBe(true)
    }
    await testInfo.attach(`embed-${mobile ? 'mobile' : 'desktop'}`, { body: await page.screenshot(), contentType: 'image/png' })
    await power.press('Escape')
    await expect(toggle).toBeFocused()
    await expect(widget.locator('.acw-unit')).toHaveAttribute('data-status', 'on')
    await page.getByRole('button', { name: 'Read article' }).click()
    await expect(page.locator('#host-action')).toHaveText('Still works')

    // A theme executing the script twice must preserve the existing mount and state.
    const src = await page.locator('script[src]').getAttribute('src')
    await page.addScriptTag({ url: src! })
    await expect(widget).toHaveCount(1)
    await expect(widget.locator('.acw-temperature')).toHaveText('27')
    await page.reload()
    await expect(widget.locator('.acw-temperature')).toHaveText('27')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
  })
}

test('installation demo supplies a pinned CDN URL and clipboard fallback', async ({ page }, testInfo) => {
  await page.route(`${cdnBase}**`, async (route) => {
    await route.fulfill({ response: await route.fetch({ url: route.request().url().replace(cdnBase, `${assetOrigin}/air-conditioner/widget/`) }) })
  })
  await page.goto(`${assetOrigin}/air-conditioner/widget/`)
  await expect(page).toHaveTitle('云空调 · 网页挂件安装')
  await expect(page.locator('#install')).toHaveText(`<script defer src="${cdnBase}embed.js" data-placement="top-right"></script>`)
  await expect(page.locator('air-conditioner-embed')).toHaveCount(1)
  // Clipboard denial must still leave selectable installation code.
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }))
  await page.getByRole('button', { name: '复制安装代码' }).click()
  await expect(page.locator('#result')).toHaveText('请选中上方代码手动复制。')
  await testInfo.attach('installation-demo', { body: await page.screenshot(), contentType: 'image/png' })
})
