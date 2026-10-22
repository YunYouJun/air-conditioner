import { expect, test } from '@playwright/test'

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 667, height: 375 }]) {
  test(`docs installation demo at ${viewport.width} × ${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error')
        errors.push(message.text())
    })
    await page.goto('http://127.0.0.1:5180/guide/floating-widget')
    const widget = page.locator('docs-air-conditioner')
    await expect(widget).toHaveCount(1)
    await expect(widget).toHaveAttribute('placement', 'inline')
    await expect(widget.locator('audio')).toHaveCount(0)
    await page.getByRole('button', { name: '右侧悬浮', exact: true }).click()
    await expect(widget).toHaveAttribute('placement', 'top-right')
    await expect.poll(async () => Math.round((await widget.boundingBox())!.y)).toBe(16)
    await expect.poll(async () => {
      const box = (await widget.boundingBox())!
      return Math.round(viewport.width - box.x - box.width)
    }).toBe(16)
    const toggle = widget.getByRole('button', { name: '打开遥控器', exact: true })
    await toggle.press('Enter')
    const power = widget.getByRole('button', { name: 'power', exact: true })
    await power.click()
    await widget.getByRole('button', { name: 'add', exact: true }).click()
    await expect(widget.locator('.acw-temperature')).toHaveText('27')
    if (viewport.height < 500) {
      await widget.locator('.acw-remote-panel').evaluate(element => element.scrollTop = element.scrollHeight)
      await expect(widget.locator('.acw-remote button').last()).toBeInViewport()
    }
    await testInfo.attach(`docs-demo-${viewport.width}x${viewport.height}-expanded`, {
      body: await page.screenshot({ animations: 'disabled' }),
      contentType: 'image/png',
    })
    await widget.getByRole('button', { name: '收起遥控器', exact: true }).press('Escape')
    await expect(toggle).toBeFocused()
    await expect(widget.locator('.acw-unit')).toHaveAttribute('data-status', 'on')
    await testInfo.attach(`docs-demo-${viewport.width}x${viewport.height}-collapsed`, {
      body: await page.screenshot({ animations: 'disabled' }),
      contentType: 'image/png',
    })
    await page.getByRole('button', { name: '左侧悬浮', exact: true }).click()
    await expect(widget).toHaveAttribute('placement', 'top-left')
    await page.getByRole('button', { name: '恢复行内', exact: true }).click()
    await expect(widget.locator('.acw-temperature')).toHaveText('27')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    // SPA navigation must also remove an active floating overlay.
    await page.getByRole('button', { name: '右侧悬浮', exact: true }).click()
    // Revisiting mounts exactly one fresh inline widget.
    await page.getByRole('link', { name: 'Web Component 使用说明', exact: true }).click()
    await expect(widget).toHaveCount(0)
    await page.goBack()
    await expect(widget).toHaveCount(1)
    await expect(widget).toHaveAttribute('placement', 'inline')
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    await expect(page.locator('html')).toHaveClass(/dark/)
    await testInfo.attach(`docs-theme-${viewport.width}x${viewport.height}-dark`, {
      body: await page.screenshot({ animations: 'disabled' }),
      contentType: 'image/png',
    })
    if (viewport.width < 768) {
      await page.locator('.VPNavBarHamburger').click()
      await expect(page.locator('.VPNavScreen')).toBeVisible()
      await page.locator('.VPNavBarHamburger').click()
    }
    expect(errors).toEqual([])
  })
}
