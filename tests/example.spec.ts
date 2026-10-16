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
  await expect(page.locator('.ac-temperature')).toHaveText('26')
  await expect(page.getByRole('button', { name: '独立遥控器' })).toBeVisible()
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
  await expect(page.locator('.ac-temperature')).toHaveText('27')

  await page.getByRole('button', { name: 'reduce' }).click()
  await expect(page.locator('.ac-temperature')).toHaveText('26')

  await gotoFresh(page, '/', { mode: 'cold', status: false, temperature: 31 })
  await page.getByRole('button', { name: 'add' }).click()
  await expect(page.locator('.ac-temperature')).toHaveText('31')
  await expect(page.getByText('已经是最大温度啦！')).toBeVisible()

  await gotoFresh(page, '/', { mode: 'cold', status: false, temperature: 16 })
  await page.getByRole('button', { name: 'reduce' }).click()
  await expect(page.locator('.ac-temperature')).toHaveText('16')
  await expect(page.getByText('已经是最小温度啦！')).toBeVisible()
})

test('persists state across reloads', async ({ page }) => {
  await gotoFresh(page)

  await page.getByRole('button', { name: 'add' }).click()
  await page.getByRole('button', { name: 'power' }).click()
  await page.reload()

  await expect(page.locator('.ac-temperature')).toHaveText('27')
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
