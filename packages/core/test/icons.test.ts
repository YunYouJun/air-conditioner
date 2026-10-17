import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { acIconSources } from '../scripts/icon-sources.mjs'
import { acIconPaths } from '../src'

const set = JSON.parse(readFileSync(createRequire(import.meta.url).resolve('@iconify-json/mdi/icons.json'), 'utf8'))

describe('icons', () => {
  // The libraries embed MDI paths; regenerate with `pnpm -C packages/core run gen:icons`.
  it('match Material Design Icons, the set the apps use via presetIcons', () => {
    expect(Object.keys(acIconPaths)).toEqual(Object.keys(acIconSources))
    for (const [name, icon] of Object.entries(acIconSources as Record<string, string>)) {
      const d = set.icons[icon].body.match(/\sd="([^"]+)"/)[1]
      expect(acIconPaths[name as keyof typeof acIconPaths], name).toBe(d)
    }
  })
})
