// Assemble dist/air-conditioner.yunplugin (a zip) and its SHA-256 checksum.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = `${root}dist`
const staging = `${dist}/air-conditioner`
const { version } = JSON.parse(readFileSync(`${root}package.json`, 'utf8'))
const manifest = JSON.parse(readFileSync(`${root}plugin/manifest.json`, 'utf8'))

const MAX_STATE_BYTES = 256 * 1024
const stateSize = statSync(`${dist}/state.iife.js`).size
if (stateSize > MAX_STATE_BYTES)
  throw new Error(`state.js is ${stateSize} bytes; the host limit is ${MAX_STATE_BYTES}`)

rmSync(staging, { recursive: true, force: true })
mkdirSync(staging, { recursive: true })
writeFileSync(`${staging}/manifest.json`, `${JSON.stringify({ ...manifest, version }, null, 2)}\n`)
copyFileSync(`${root}plugin/controls.json`, `${staging}/controls.json`)
copyFileSync(`${dist}/state.iife.js`, `${staging}/state.js`)

const files = ['manifest.json', 'state.js', 'controls.json'].map(name => `${staging}/${name}`)
// Fixed timestamps, UTC and no extra attributes keep the archive and its checksum reproducible.
const epoch = new Date('2020-01-01T00:00:00Z')
for (const file of files)
  utimesSync(file, epoch, epoch)

const archive = `${dist}/air-conditioner.yunplugin`
rmSync(archive, { force: true })
execFileSync('zip', ['-X', '-q', '-j', archive, ...files], { env: { ...process.env, TZ: 'UTC' } })

const digest = createHash('sha256').update(readFileSync(archive)).digest('hex')
writeFileSync(`${archive}.sha256`, `${digest}  air-conditioner.yunplugin\n`)
console.log(`air-conditioner.yunplugin ${version} sha256:${digest} (state.js ${stateSize} B)`)
