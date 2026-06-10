import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCanonicalManifest } from './canonical-manifest.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT = join(__dirname, '../src/data/scenarioManifest.json')

const manifest = buildCanonicalManifest()

mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2))

const counts = Object.fromEntries(
  Object.entries(manifest.groups).map(([key, value]) => [key, value.length]),
)
const totalScenarios = Object.values(manifest.groups).reduce((sum, group) => sum + group.length, 0)
const totalSlots = Object.values(manifest.groups).reduce(
  (sum, group) => sum + group.reduce((slotSum, scenario) => slotSum + scenario.files.length, 0),
  0,
)

console.log('Generated canonical scenario manifest:', counts)
console.log(`Total scenarios: ${totalScenarios}, total portrait file slots: ${totalSlots}`)
