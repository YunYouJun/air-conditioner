import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { airConditionerPlugin as plugin } from '../src/plugin'

const controls = JSON.parse(readFileSync(new URL('../plugin/controls.json', import.meta.url), 'utf8'))
const manifest = JSON.parse(readFileSync(new URL('../plugin/manifest.json', import.meta.url), 'utf8'))

describe('air conditioner home plugin', () => {
  it('creates and normalizes untrusted state', () => {
    expect(plugin.create()).toEqual({ status: false, mode: 'cold', temperature: 26, sound: 'normal', swing: false })
    expect(plugin.normalize({ status: 'yes', mode: 'dry', temperature: 99, sound: 'loud', swing: 'on', extra: 1 }))
      .toEqual({ status: false, mode: 'cold', temperature: 31, sound: 'normal', swing: false })
    expect(plugin.normalize({ swing: true }).swing).toBe(true)
  })

  it('reduces actions with optional device limits', () => {
    let state = plugin.create()
    state = plugin.reduce(state, { type: 'toggleStatus' })
    state = plugin.reduce(state, { type: 'mode', mode: 'hot' })
    expect(plugin.reduce(state, { type: 'increment' }, { limits: { min: 17, max: 30, step: 0.5 } }).temperature).toBe(26.5)
    expect(plugin.present(state)).toEqual({ active: true, tone: 'heat', summary: '制热 · 26°C' })
  })

  it('validates actions', () => {
    expect(plugin.isAction({ type: 'sound', sound: 'sleep' })).toBe(true)
    expect(plugin.isAction({ type: 'sound', sound: 'loud' })).toBe(false)
    expect(plugin.isAction({ type: 'toggleSwing' })).toBe(true)
    expect(plugin.isAction({ type: 'swing', swing: true })).toBe(true)
    expect(plugin.isAction({ type: 'swing', swing: 'on' })).toBe(false)
    expect(plugin.isAction({ type: 'update', payload: { temperature: 20 } })).toBe(false)
    expect(plugin.isAction(null)).toBe(false)
  })

  it('only declares actions the plugin accepts', () => {
    const actions = controls.controls.flatMap((control: Record<string, any>) => [
      control.action,
      control.increment,
      control.decrement,
      ...(control.options ?? []).map((option: Record<string, unknown>) => option.action),
    ]).filter(Boolean)
    expect(actions.length).toBeGreaterThan(0)
    for (const action of actions)
      expect(plugin.isAction(action)).toBe(true)
    expect(manifest.entry).toEqual({ state: 'state.js', controls: 'controls.json' })
  })

  it('evaluates as a self-contained script without host APIs', () => {
    let source: string
    try {
      source = readFileSync(new URL('../dist/state.iife.js', import.meta.url), 'utf8')
    }
    catch {
      return
    }
    const sandbox: Record<string, any> = {}
    sandbox.globalThis = sandbox
    runInNewContext(source, sandbox)
    expect(sandbox.plugin.present(sandbox.plugin.create())).toEqual({ active: false, tone: 'idle', summary: '待机 · 26°C' })
  })
})
