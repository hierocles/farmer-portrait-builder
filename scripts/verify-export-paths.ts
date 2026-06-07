/**
 * Manifest layout + legacy path migration checks.
 * Run: npm run verify-export-paths
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildZipAssetPath, migrateLegacyFolderPath } from '../src/lib/exportPaths.ts'
import {
  findSimilarSeasonWeatherIndoorTargets,
  findSimilarWeatherSlotTargets,
  findSimilarWeatherSlotTargetsAllSeasons,
  getWeatherFamily,
  parseSeasonWeatherPath,
} from '../src/lib/weatherFamilies.ts'

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

const weatherCases: Array<[string, string | null]> = [
  ['Fall/GreenRain/', 'rain'],
  ['Fall/Rain/', 'rain'],
  ['Fall/Storm/', 'storm'],
  ['Fall/kath.weathering_AcidRain/', 'rain'],
  ['Fall/Kana.WeatherWonders_Deluge/', 'rain'],
  ['Fall/Kana.WeatherWonders_Cloudy/', 'cloudy'],
  ['Festivals/Egg Festival/', null],
]

for (const [folderPath, expectedFamily] of weatherCases) {
  const parsed = parseSeasonWeatherPath(folderPath)
  const family = parsed ? getWeatherFamily(parsed.weatherKey) : null
  if (family !== expectedFamily) {
    console.error(`WEATHER FAMILY mismatch: ${folderPath}`)
    console.error(`  expected: ${expectedFamily}`)
    console.error(`  actual:   ${family}`)
    failed++
  }
}

const fallRainCandidates = [
  { folderPath: 'Fall/Rain/', filename: 'portrait_happy.png', key: 'Fall/Rain/::portrait_happy.png' },
  {
    folderPath: 'Fall/GreenRain/',
    filename: 'portrait_happy.png',
    key: 'Fall/GreenRain/::portrait_happy.png',
  },
  { folderPath: 'Fall/Sun/', filename: 'portrait_happy.png', key: 'Fall/Sun/::portrait_happy.png' },
  {
    folderPath: 'Fall/Kana.WeatherWonders_Deluge/',
    filename: 'portrait_happy.png',
    key: 'Fall/Kana.WeatherWonders_Deluge/::portrait_happy.png',
  },
  {
    folderPath: 'Fall/kath.weathering_MudRain/',
    filename: 'portrait_happy.png',
    key: 'Fall/kath.weathering_MudRain/::portrait_happy.png',
  },
]

const similarRain = findSimilarWeatherSlotTargets(
  'Fall/GreenRain/',
  'portrait_happy.png',
  fallRainCandidates,
)
const similarKeys = new Set(similarRain?.targets.map((target) => target.key) ?? [])
const expectedSimilarKeys = new Set([
  'Fall/Rain/::portrait_happy.png',
  'Fall/Kana.WeatherWonders_Deluge/::portrait_happy.png',
  'Fall/kath.weathering_MudRain/::portrait_happy.png',
])

if (
  !similarRain ||
  similarRain.season !== 'Fall' ||
  similarRain.familyLabel !== 'rainy' ||
  similarKeys.size !== expectedSimilarKeys.size ||
  ![...expectedSimilarKeys].every((key) => similarKeys.has(key))
) {
  console.error('SIMILAR WEATHER mismatch for Fall/GreenRain portrait_happy.png')
  console.error(`  expected keys: ${[...expectedSimilarKeys].join(', ')}`)
  console.error(`  actual keys:   ${[...similarKeys].join(', ')}`)
  failed++
}

const allSeasonCandidates = [
  ...fallRainCandidates,
  {
    folderPath: 'Spring/Rain/',
    filename: 'portrait_happy.png',
    key: 'Spring/Rain/::portrait_happy.png',
  },
  {
    folderPath: 'Spring/GreenRain/',
    filename: 'portrait_happy.png',
    key: 'Spring/GreenRain/::portrait_happy.png',
  },
  {
    folderPath: 'Winter/Snow/',
    filename: 'portrait_happy.png',
    key: 'Winter/Snow/::portrait_happy.png',
  },
]

const similarRainAllSeasons = findSimilarWeatherSlotTargetsAllSeasons(
  'Fall/GreenRain/',
  'portrait_happy.png',
  allSeasonCandidates,
)
const allSeasonKeys = new Set(similarRainAllSeasons?.targets.map((target) => target.key) ?? [])
const expectedAllSeasonKeys = new Set([
  'Fall/Rain/::portrait_happy.png',
  'Spring/Rain/::portrait_happy.png',
  'Spring/GreenRain/::portrait_happy.png',
  'Fall/Kana.WeatherWonders_Deluge/::portrait_happy.png',
  'Fall/kath.weathering_MudRain/::portrait_happy.png',
])

if (
  !similarRainAllSeasons ||
  similarRainAllSeasons.season !== undefined ||
  similarRainAllSeasons.familyLabel !== 'rainy' ||
  allSeasonKeys.size !== expectedAllSeasonKeys.size ||
  ![...expectedAllSeasonKeys].every((key) => allSeasonKeys.has(key)) ||
  allSeasonKeys.has('Winter/Snow/::portrait_happy.png')
) {
  console.error('ALL-SEASON SIMILAR WEATHER mismatch for Fall/GreenRain portrait_happy.png')
  console.error(`  expected keys: ${[...expectedAllSeasonKeys].join(', ')}`)
  console.error(`  actual keys:   ${[...allSeasonKeys].join(', ')}`)
  failed++
}

const indoorCandidates = [
  {
    folderPath: 'Fall/Rain/',
    filename: 'portrait_happy_indoors.png',
    key: 'Fall/Rain/::portrait_happy_indoors.png',
  },
  {
    folderPath: 'Fall/GreenRain/',
    filename: 'portrait_happy.png',
    key: 'Fall/GreenRain/::portrait_happy.png',
  },
  {
    folderPath: 'Fall/GreenRain/',
    filename: 'portrait_happy_indoors.png',
    key: 'Fall/GreenRain/::portrait_happy_indoors.png',
  },
  {
    folderPath: 'Fall/Kana.WeatherWonders_Deluge/',
    filename: 'portrait_happy_indoors.png',
    key: 'Fall/Kana.WeatherWonders_Deluge/::portrait_happy_indoors.png',
  },
  {
    folderPath: 'Fall/Rain/',
    filename: 'portrait_happy.png',
    key: 'Fall/Rain/::portrait_happy.png',
  },
]

const similarIndoor = findSimilarSeasonWeatherIndoorTargets(
  'Fall/GreenRain/',
  'portrait_happy.png',
  indoorCandidates,
)
const indoorKeys = new Set(similarIndoor?.targets.map((target) => target.key) ?? [])

if (
  !similarIndoor ||
  similarIndoor.season !== 'Fall' ||
  similarIndoor.targetFilename !== 'portrait_happy_indoors.png' ||
  indoorKeys.size !== 3 ||
  !indoorKeys.has('Fall/Rain/::portrait_happy_indoors.png') ||
  !indoorKeys.has('Fall/GreenRain/::portrait_happy_indoors.png') ||
  !indoorKeys.has('Fall/Kana.WeatherWonders_Deluge/::portrait_happy_indoors.png') ||
  indoorKeys.has('Fall/Rain/::portrait_happy.png')
) {
  console.error('INDOOR SIMILAR WEATHER mismatch for Fall/GreenRain portrait_happy.png')
  console.error(`  actual keys: ${[...indoorKeys].join(', ')}`)
  failed++
}

if (failed > 0) {
  console.error(`verify-export-paths: ${failed} check(s) failed`)
  process.exit(1)
}

console.log(
  `verify-export-paths: OK (${manifestFolders.size} manifest folders, ${migrationCases.length} migrations)`,
)
