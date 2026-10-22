import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const fixture = `/@fs${fileURLToPath(new URL('./fixtures/widget.html', import.meta.url))}`

for (const placement of ['top-left', 'top-right']) {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 667, height: 375 }]) {
    test(`floating ${placement} at ${viewport.width} × ${viewport.height}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport)
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${fixture}?placement=${placement}`)
      const toggle = page.getByRole('button', { name: '打开遥控器' })
      const power = page.getByRole('button', { name: 'power', exact: true })
      await expect(toggle).toBeVisible()
      await expect(power).toBeHidden()

      // The wind region below the housing must never intercept the host page.
      await page.getByRole('button', { name: 'Page button' }).click()
      await expect(page.locator('#clicks')).toHaveText('1')

      await toggle.press('Enter')
      await expect(power).toBeVisible()
      await power.click()
      await page.getByRole('button', { name: 'add', exact: true }).click()
      await expect(page.locator('.acw-temperature')).toHaveText('27')
      await power.press('Escape')
      await expect(power).toBeHidden()
      await expect(page.getByRole('button', { name: '打开遥控器' })).toBeFocused()
      await expect(page.locator('.acw-unit')).toHaveAttribute('data-status', 'on')

      await page.getByRole('button', { name: 'Page button' }).click()
      await expect(page.locator('#clicks')).toHaveText('2')
      await page.getByRole('button', { name: '打开遥控器' }).press('Space')
      await expect(power).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('.acw-temperature')).toHaveText('27')
      if (placement === 'top-right') {
        await testInfo.attach(`floating-${viewport.width}x${viewport.height}-expanded`, {
          body: await page.screenshot({ animations: 'disabled' }),
          contentType: 'image/png',
        })
      }
      await page.getByRole('button', { name: '收起遥控器' }).click()
      await expect(power).toBeHidden()
      if (placement === 'top-right') {
        await testInfo.attach(`floating-${viewport.width}x${viewport.height}-collapsed`, {
          body: await page.screenshot({ animations: 'disabled' }),
          contentType: 'image/png',
        })
      }
      await page.locator('air-conditioner-widget').evaluate(element => element.setAttribute('placement', 'inline'))
      await expect(power).toBeFocused()
      await expect(power).toBeVisible()
      expect(errors).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
  }
}
