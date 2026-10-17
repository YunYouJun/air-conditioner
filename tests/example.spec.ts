import { expect, test } from '@playwright/test'

const storageKey = 'ac:state'

async function readAcState(page: import('@playwright/test').Page) {
  return page.evaluate((key) => {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  }, storageKey)
}

async function gotoFresh(page: import('@playwright/test').Page, path = '/', state?: unknown) {
  await page.goto(path)
  await page.evaluate(([key, value]) => {
    if (value)
      localStorage.setItem(key as string, JSON.stringify(value))
    else
      localStorage.removeItem(key as string)
  }, [storageKey, state] as const)
  await page.reload()
}

test('renders the current home experience', async ({ page }) => {
  await gotoFresh(page)

  await expect(page).toHaveTitle(/便携小空调/)
  await expect(page.getByRole('heading', { name: '便携小空调' })).toBeVisible()
  await expect(page.locator('.acw-temperature')).toHaveText('26')
  await expect(page.getByRole('button', { name: /遥控器悬浮窗|独立遥控器/ })).toBeVisible()
})

test('toggles power and modes without breaking persisted state', async ({ page }) => {
  await gotoFresh(page)

  await page.getByRole('button', { name: 'power' }).click()
  await expect.poll(() => readAcState(page)).toMatchObject({ status: true })

  await page.getByRole('button', { name: 'hot' }).click()
  await expect.poll(() => readAcState(page)).toMatchObject({ mode: 'hot' })

  await page.getByRole('button', { name: 'cold' }).click()
  await expect.poll(() => readAcState(page)).toMatchObject({ mode: 'cold' })
})

test('changes temperature and keeps the upper and lower bounds', async ({ page }) => {
  await gotoFresh(page)

  await page.getByRole('button', { name: 'add' }).click()
  await expect(page.locator('.acw-temperature')).toHaveText('27')

  await page.getByRole('button', { name: 'reduce' }).click()
  await expect(page.locator('.acw-temperature')).toHaveText('26')

  await gotoFresh(page, '/', { mode: 'cold', status: false, temperature: 31 })
  await page.getByRole('button', { name: 'add' }).click()
  await expect(page.locator('.acw-temperature')).toHaveText('31')
  await expect(page.getByText('已经是最大温度啦！')).toBeVisible()

  await gotoFresh(page, '/', { mode: 'cold', status: false, temperature: 16 })
  await page.getByRole('button', { name: 'reduce' }).click()
  await expect(page.locator('.acw-temperature')).toHaveText('16')
  await expect(page.getByText('已经是最小温度啦！')).toBeVisible()
})

test('persists state across reloads', async ({ page }) => {
  await gotoFresh(page)

  await page.getByRole('button', { name: 'add' }).click()
  await page.getByRole('button', { name: 'power' }).click()
  await page.reload()

  await expect(page.locator('.acw-temperature')).toHaveText('27')
  await expect.poll(() => readAcState(page)).toMatchObject({ status: true, temperature: 27 })
})

test('keeps the standalone remote control usable', async ({ page }) => {
  await gotoFresh(page, '/rc')

  await expect(page.getByRole('button', { name: 'power' })).toBeVisible()
  await page.getByRole('button', { name: 'add' }).click()
  await expect.poll(() => readAcState(page)).toMatchObject({ temperature: 27 })
})

test('cycles the sound mode and keeps it after a reload', async ({ page }) => {
  // States saved before the sound key existed have no `sound` field
  await gotoFresh(page, '/', { mode: 'cold', status: false, temperature: 26 })

  const sound = page.getByRole('button', { name: 'sound' })
  await expect(sound).toHaveAttribute('title', '声音：标准')

  await sound.click()
  await expect(page.getByText(/睡眠模式/)).toBeVisible()
  await expect.poll(() => readAcState(page)).toMatchObject({ sound: 'sleep' })

  await sound.click()
  await expect.poll(() => readAcState(page)).toMatchObject({ sound: 'mute' })

  await page.reload()
  await expect(page.getByRole('button', { name: 'sound' })).toHaveAttribute('title', '声音：静音')
})

// #184: the optional 3D mode shares the native app's model and falls back to the CSS unit.
test('switches to the 3D model and back', async ({ page }) => {
  await gotoFresh(page)
  await page.evaluate(() => localStorage.removeItem('ac-view'))
  await page.reload()

  const toggle = page.getByRole('button', { name: '3D' })
  test.skip(await toggle.isDisabled(), 'WebGL is not available in this browser')

  await toggle.click()
  await expect(page.locator('.ac-3d__canvas')).toBeVisible()
  await expect(page.locator('.acw-unit')).toHaveCount(0)
  await page.getByRole('group', { name: '机型' }).getByRole('button', { name: '柜机' }).click()
  await expect(page.locator('.ac-3d')).toHaveAttribute('data-form', 'tower')

  // The choice is remembered across reloads.
  await page.reload()
  await expect(page.locator('.ac-3d')).toHaveAttribute('data-form', 'tower')

  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await toggle.click()
  await expect(page.locator('.acw-unit')).toBeVisible()
  await expect(page.locator('.ac-3d')).toHaveCount(0)
})

// Easter egg: dragging the flat unit far enough twists it into 3D; double-clicking the
// model once it faces front turns it back.
test('twists the flat unit into 3D and double-clicks it back', async ({ page }) => {
  await gotoFresh(page)
  await page.evaluate(() => localStorage.removeItem('ac-view'))
  await page.reload()
  test.skip(await page.getByRole('button', { name: '3D' }).isDisabled(), 'WebGL is not available in this browser')

  const shell = (await page.locator('.acw-shell').boundingBox())!
  const y = shell.y + shell.height / 2
  // A short drag springs back.
  await page.mouse.move(shell.x + shell.width / 2, y)
  await page.mouse.down()
  await page.mouse.move(shell.x + shell.width / 2 + 80, y, { steps: 5 })
  await page.mouse.up()
  await expect(page.locator('.ac-3d')).toHaveCount(0)

  // Past the threshold it snaps into 3D.
  await page.mouse.move(shell.x + shell.width / 2, y)
  await page.mouse.down()
  await page.mouse.move(shell.x + shell.width / 2 + 260, y, { steps: 10 })
  await page.mouse.up()
  await expect(page.locator('.ac-3d__canvas')).toBeVisible()
  await expect(page.locator('.acw-unit')).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ac-view'))).toBe('"3d"')

  // Facing front, a double-click flattens it again (the first one may only straighten it).
  const canvas = (await page.locator('.ac-3d__canvas').boundingBox())!
  await expect(async () => {
    await page.mouse.dblclick(canvas.x + canvas.width / 2, canvas.y + canvas.height / 3)
    await expect(page.locator('.acw-unit')).toBeVisible({ timeout: 1500 })
  }).toPass({ timeout: 8000 })
  await expect(page.locator('.ac-3d')).toHaveCount(0)
})
