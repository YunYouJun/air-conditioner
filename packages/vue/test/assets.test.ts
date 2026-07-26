import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('vue package assets', () => {
  it('keeps the digital font URL relative to the published stylesheet', () => {
    const stylesheet = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

    expect(stylesheet).toContain('url("./assets/fonts/digital-7-mono.ttf")')
    expect(stylesheet).not.toContain('url("/assets/')
  })
})
