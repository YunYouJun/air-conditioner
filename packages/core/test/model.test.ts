import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { acAirflowAnchors, acForms, acLouverMotion, acModelFiles, acModelParts, getAcLedColor } from '../src'

interface GltfNode {
  name: string
  children?: number[]
}

/** 读出 GLB 里的 JSON 块（文件头 12 字节，之后是第一个 chunk 的长度与类型） */
function readGltf(file: string): { nodes: GltfNode[] } {
  const data = readFileSync(new URL(`../../react/public/models/${file}`, import.meta.url))
  const length = data.readUInt32LE(12)
  return JSON.parse(data.subarray(20, 20 + length).toString('utf8'))
}

const swift = readFileSync(new URL('../../../apps/macos/Kit/Sources/CuteACKit/ACPalette.swift', import.meta.url), 'utf8')

describe('shared 3D model contract', () => {
  it.each(acForms)('the %s GLB keeps the named parts', (form) => {
    const { nodes } = readGltf(acModelFiles[form])
    const names = nodes.map(node => node.name)
    for (const part of Object.values(acModelParts))
      expect(names).toContain(part)

    const louver = nodes.find(node => node.name === acModelParts.louver)!
    if (acLouverMotion[form].pivot === 'children')
      expect(louver.children?.length).toBeGreaterThan(1)
  })

  it('matches ACModel in the Swift kit', () => {
    expect(swift).toContain(`static let louver = "${acModelParts.louver}"`)
    expect(swift).toContain(`static let display = "${acModelParts.display}"`)
    expect(swift).toContain(`static let led = "${acModelParts.led}"`)
    expect(swift).toContain(`openLouverAngle = ${acLouverMotion.wall.openAngle} * Double.pi / 180`)
    expect(swift).toContain(`openAngle: ${acLouverMotion.tower.openAngle} * Double.pi / 180`)
    for (const anchor of Object.values(acAirflowAnchors))
      expect(swift).toContain(`offset: [${anchor.offset.join(', ')}], extent: ${anchor.extent}, direction: .${anchor.direction}`)
  })

  it('lights the LED in the mode colour and greys it when off', () => {
    expect(getAcLedColor({ status: true, mode: 'cold' })).toBe('#5aa9ff')
    expect(getAcLedColor({ status: true, mode: 'hot' })).toBe('#ff9f5a')
    expect(getAcLedColor({ status: false, mode: 'hot' })).toBe('#8e97aa')
  })
})
