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
    ['widget', '../../widget/package.json'],
  ])('publishes %s at the repository version', (_packageName, relativePath) => {
    const manifest = readManifest(relativePath)
    const repository = readManifest('../../../package.json')

    expect(repository.version).toBeTypeOf('string')
    expect(manifest.version).toBe(repository.version)
    expect(manifest.private).not.toBe(true)
    expect(manifest.publishConfig?.access).toBe('public')
  })

  it('exports the Vue controls subpath and stylesheet', () => {
    const manifest = readManifest('../../vue/package.json')

    expect(manifest.exports?.['./controls']).toMatchObject({ import: './dist/controls.js', types: './dist/controls.d.ts' })
    expect(manifest.exports?.['./controls.css']).toBe('./dist/controls.css')
  })

  it('exports the Vue logo asset for host applications', () => {
    const manifest = readManifest('../../vue/package.json')

    expect(manifest.exports?.['./yun-logo.svg']).toBe('./dist/yun-logo.svg')
  })

  it.each([
    ['core', '../LICENSE'],
    ['vue', '../../vue/LICENSE'],
    ['widget', '../../widget/LICENSE'],
  ])('ships the MIT license with @air-conditioner/%s', (_packageName, relativePath) => {
    expect(existsSync(new URL(relativePath, import.meta.url))).toBe(true)
  })
})
