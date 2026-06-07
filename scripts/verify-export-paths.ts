/**
 * Manifest layout + legacy path migration checks.
 * Run: npm run verify-export-paths
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildZipAssetPath, migrateLegacyFolderPath } from '../src/lib/exportPaths.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

const manifest = JSON.parse(
  readFileSync(join(__dirname, '../src/data/scenarioManifest.json'), 'utf8'),
)

const manifestFolders = new Set<string>()
for (const scenarios of Object.values(manifest.groups) as Array<{ folderPath: string }[]>) {
  for (const scenario of scenarios) {
    manifestFolders.add(scenario.folderPath)
  }
}

const requiredFolders = [
  '',
  'Spring/Sun/',
  'Spring/kath.weathering_HeavyRain/',
  'Spring/Kana.WeatherWonders_Deluge/',
  'Festivals/Egg Festival/',
  'Festivals/CommunityDay/',
  'Mining/',
  'Pajamas/',
  'Island/Sun/',
  'Gardening/',
]

let failed = 0

for (const folder of requiredFolders) {
  if (!manifestFolders.has(folder)) {
    console.error(`MISSING manifest folder: ${folder || '(base)'}`)
    failed++
  }
}

for (const folder of manifestFolders) {
  if (/^(DangerWeather|WeatherWonders)\//.test(folder) || folder.startsWith('festivals/')) {
    console.error(`LEGACY folder still in manifest: ${folder}`)
    failed++
  }
}

const migrationCases: Array<[string, string]> = [
  ['DangerWeather/Heavy Rain/', 'Spring/kath.weathering_HeavyRain/'],
  ['DangerWeather/kath.weathering_Blizzard/', 'Winter/kath.weathering_Blizzard/'],
  ['WeatherWonders/Spring/Deluge Spring/', 'Spring/Kana.WeatherWonders_Deluge/'],
  ['WeatherWonders/Spring/Kana.WeatherWonders_Deluge/', 'Spring/Kana.WeatherWonders_Deluge/'],
  ['festivals/EggFestival/', 'Festivals/Egg Festival/'],
  ['festivals/Communityday/', 'Festivals/CommunityDay/'],
  ['pajamas/Spring/', 'Pajamas/'],
  ['mining/', 'Mining/'],
  ['Spring/Spring/', 'Spring/Sun/'],
  ['Island/Island Rain/', 'Island/Rain/'],
]

for (const [legacy, expected] of migrationCases) {
  const actual = migrateLegacyFolderPath(legacy)
  if (actual !== expected) {
    console.error(`MIGRATION mismatch: ${legacy}`)
    console.error(`  expected: ${expected}`)
    console.error(`  actual:   ${actual}`)
    failed++
  }
}

const zipPath = buildZipAssetPath('Player 1', 'Festivals/Egg Festival/', 'portrait.png')
if (zipPath !== 'assets/Player 1/Festivals/Egg Festival/portrait.png') {
  console.error(`ZIP path mismatch: ${zipPath}`)
  failed++
}

if (failed > 0) {
  console.error(`verify-export-paths: ${failed} check(s) failed`)
  process.exit(1)
}

console.log(
  `verify-export-paths: OK (${manifestFolders.size} manifest folders, ${migrationCases.length} migrations)`,
)
