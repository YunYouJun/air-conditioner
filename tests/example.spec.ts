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

/**
 * Resizing the canvas clears its bitmap, and that happens after the frame's
 * animation callback. The frame is blank unless something draws after the clear.
 */
function blankCanvasFrames(events: string[]) {
  const frames: string[][] = []
  let current: string[] | undefined
  for (const event of events) {
    if (event === 'frame') {
      current = []
      frames.push(current)
    }
    else if (current) {
      current.push(event)
    }
  }
  return frames.filter((frame) => {
    const clearAt = frame.lastIndexOf('clear')
    return clearAt !== -1 && !frame.slice(clearAt + 1).includes('draw')
  })
}

async function watchCanvasFrames(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('.ac-3d__canvas')!
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')!
    const events: string[] = []
    const markFrame = () => {
      events.push('frame')
      requestAnimationFrame(markFrame)
    }
    requestAnimationFrame(markFrame)
    for (const prop of ['width', 'height'] as const) {
      const desc = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, prop)!
      Object.defineProperty(canvas, prop, {
        configurable: true,
        get() {
          return desc.get!.call(this)
        },
        set(value: number) {
          const previous = desc.get!.call(this)
          desc.set!.call(this, value)
          if (desc.get!.call(this) !== previous)
            events.push('clear')
        },
      })
    }
    const proto = Object.getPrototypeOf(gl) as Record<string, (this: WebGLRenderingContext, ...args: never[]) => void>
    for (const name of ['drawElements', 'drawArrays']) {
      const original = proto[name]!
      proto[name] = function (this: WebGLRenderingContext, ...args: never[]) {
        if (this.canvas === canvas)
          events.push('draw')
        return original.apply(this, args)
      }
    }
    ;(window as unknown as { __acFrames: string[] }).__acFrames = events
  })
}

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

// Switching 挂机/柜机 resizes the canvas for ~420ms. The bitmap must be redrawn
// in that same frame, or the height transition flashes empty.
test('keeps the 3D model painted while switching forms', async ({ page }) => {
  await gotoFresh(page, '/', { mode: 'hot', status: true, temperature: 23, swing: true })
  await page.evaluate(() => localStorage.removeItem('ac-view'))
  await page.reload()

  const toggle = page.getByRole('button', { name: '3D' })
  test.skip(await toggle.isDisabled(), 'WebGL is not available in this browser')

  await toggle.click()
  await expect(page.locator('.ac-3d__canvas')).toBeVisible()
  await expect(page.locator('.ac-3d')).toHaveAttribute('data-form', 'wall')
  await watchCanvasFrames(page)

  const forms = page.getByRole('group', { name: '机型' })
  await forms.getByRole('button', { name: '柜机' }).click()
  await expect(page.locator('.ac-3d')).toHaveAttribute('data-form', 'tower')
  await page.waitForTimeout(500)
  await forms.getByRole('button', { name: '挂机' }).click()
  await expect(page.locator('.ac-3d')).toHaveAttribute('data-form', 'wall')
  await page.waitForTimeout(500)

  const events = await page.evaluate(() => (window as unknown as { __acFrames: string[] }).__acFrames)
  const blank = blankCanvasFrames(events)
  expect(events.filter(event => event === 'clear').length, 'the form switch should resize the canvas').toBeGreaterThan(0)
  expect(blank, `blank frames after a canvas clear: ${blank.length}`).toEqual([])

  await expect.poll(() => readAcState(page)).toMatchObject({ status: true, mode: 'hot', temperature: 23, swing: true })
  await toggle.click()
  await expect(page.locator('.acw-unit')).toBeVisible()
  await expect(page.locator('.acw-temperature')).toHaveText('23')
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

// The pre-paint skeleton in index.html lines up with the page and fades out once it renders.
test('hands the boot skeleton over to the page', async ({ page }) => {
  let release!: () => void
  const held = new Promise<void>(resolve => release = resolve)
  await page.route('**/src/main.tsx*', async (route) => {
    await held
    await route.continue()
  })
  const loading = page.goto('/')
  await expect(page.locator('#ac-boot')).toBeVisible()
  await expect(page.locator('#ac-boot')).toContainText('正在给空调通电')
  const skeleton = await page.locator('.ac-boot__shell').boundingBox()

  release()
  await loading
  await expect(page.locator('#ac-boot')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '便携小空调' })).toBeVisible()
  expect(await page.locator('.acw-shell').boundingBox()).toEqual(skeleton)
})
