/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { renderStyleModule } from '../scripts/shadow-style.mjs'

describe('widget styles', () => {
  it('stays in sync with the Vue stylesheet (run `pnpm -C packages/widget run sync:style`)', () => {
    const vueCss = readFileSync(new URL('../../vue/src/style.css', import.meta.url), 'utf8')
    const generated = readFileSync(new URL('../src/style.ts', import.meta.url), 'utf8')

    expect(generated).toBe(renderStyleModule(vueCss))
    expect(generated).not.toContain('@font-face')
    expect(generated).not.toContain(':root')
  })

  it('shares one stylesheet with the React component library', () => {
    const vueCss = readFileSync(new URL('../../vue/src/style.css', import.meta.url), 'utf8')
    const reactCss = readFileSync(new URL('../../react/src/lib/style.css', import.meta.url), 'utf8')

    expect(reactCss).toBe(vueCss)
  })
})
