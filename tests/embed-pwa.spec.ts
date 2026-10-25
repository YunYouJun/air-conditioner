import { expect, test } from '@playwright/test'
import widgetPackage from '../packages/widget/package.json' with { type: 'json' }

const { name, version } = widgetPackage

test('the installed PWA leaves the standalone widget demo accessible', async ({ page }, testInfo) => {
  const base = 'http://127.0.0.1:5183/air-conditioner/'
  const cdnBase = `https://cdn.jsdelivr.net/npm/${name}@${version}/dist/embed/`
  await page.route(`${cdnBase}**`, async (route) => {
    await route.fulfill({ response: await route.fetch({ url: route.request().url().replace(cdnBase, `${base}widget/`) }) })
  })
  await page.goto(base)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)

  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => message.type() === 'error' && errors.push(message.text()))
  await page.goto(`${base}widget/`)
  await expect(page).toHaveTitle('云空调 · 网页挂件安装')
  await expect(page.getByRole('heading', { name: '给网页装一台小空调' })).toBeVisible()
  const widget = page.locator('air-conditioner-embed')
  await expect(widget).toHaveCount(1)
  await widget.getByRole('button', { name: '打开遥控器', exact: true }).click()
  await widget.getByRole('button', { name: 'power', exact: true }).click()
  await expect(widget.locator('.acw-unit')).toHaveAttribute('data-status', 'on')
  await expect(page.locator('#install')).toContainText(`${cdnBase}embed.js`)
  await testInfo.attach('production-installer', { body: await page.screenshot(), contentType: 'image/png' })
  expect(errors).toEqual([])
})
