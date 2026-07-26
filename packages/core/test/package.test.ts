import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

interface PackageManifest {
  exports?: Record<string, unknown>
  name?: string
  version?: string
  private?: boolean
  publishConfig?: {
    access?: string
  }
}

function readManifest(relativePath: string) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8')) as PackageManifest
}

describe('public package manifests', () => {
  it.each([
    ['core', '../package.json'],
    ['vue', '../../vue/package.json'],
  ])('marks @air-conditioner/%s 0.2.0 as public', (_packageName, relativePath) => {
    const manifest = readManifest(relativePath)

    expect(manifest.version).toBe('0.2.0')
    expect(manifest.private).not.toBe(true)
    expect(manifest.publishConfig?.access).toBe('public')
  })

  it('exports the Vue logo asset for host applications', () => {
    const manifest = readManifest('../../vue/package.json')

    expect(manifest.exports?.['./yun-logo.svg']).toBe('./dist/yun-logo.svg')
  })

  it.each([
    ['core', '../LICENSE'],
    ['vue', '../../vue/LICENSE'],
  ])('ships the MIT license with @air-conditioner/%s', (_packageName, relativePath) => {
    expect(existsSync(new URL(relativePath, import.meta.url))).toBe(true)
  })
})
