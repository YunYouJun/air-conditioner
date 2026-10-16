import { readFileSync, writeFileSync } from 'node:fs'
import { renderStyleModule } from './shadow-style.mjs'

const source = new URL('../../vue/src/style.css', import.meta.url)
const target = new URL('../src/style.ts', import.meta.url)

writeFileSync(target, renderStyleModule(readFileSync(source, 'utf8')))
console.log('synced', target.pathname)
