import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WEATHER_WONDERS_SEASONS = JSON.parse(
  readFileSync(join(__dirname, '../src/data/weatherWondersSeasons.json'), 'utf8'),
)
const DANGER_WEATHER_SEASONS = JSON.parse(
  readFileSync(join(__dirname, '../src/data/dangerWeatherSeasons.json'), 'utf8'),
)
const MOD_ROOT = join(__dirname, '../../Farmer 2.0 ESWF NPC Reaction Overhaul')
const PLAYER1_ROOT = join(MOD_ROOT, 'assets/Player 1')
const EXAMPLE_ROOT = join(MOD_ROOT, 'assets/Example')
const OUTPUT = join(__dirname, '../src/data/scenarioManifest.json')

function normalizeFolderPath(folderPath) {
  if (!folderPath) return ''
  return folderPath.replace(/\\/g, '/').replace(/\/?$/, '/')
}

function isEligibleWeatherWonderFolder(folderPath) {
  const match = folderPath.match(/^(Spring|Summer|Fall|Winter)\/(Kana\.WeatherWonders_[^/]+)\/$/i)
  if (!match) return true
  const [, season, weatherKey] = match
  const eligibleSeasons = WEATHER_WONDERS_SEASONS[weatherKey]
  if (!eligibleSeasons) return false
  return eligibleSeasons.includes(season)
}

function isEligibleDangerWeatherFolder(folderPath) {
  const match = folderPath.match(/^(Spring|Summer|Fall|Winter)\/(kath\.weathering_[^/]+)\/$/i)
  if (!match) return true
  const [, season, weatherKey] = match
  const eligibleSeasons = DANGER_WEATHER_SEASONS[weatherKey]
  if (!eligibleSeasons) return false
  return eligibleSeasons.includes(season)
}

function classifyFolder(folderPath) {
  const lower = folderPath.toLowerCase()
  if (!folderPath) return 'base'
  if (lower.startsWith('festivals/')) return 'festivals'
  if (/kana\.weatherwonders_/i.test(folderPath)) return 'weatherWonders'
  if (/kath\.weathering_/i.test(folderPath)) return 'dangerWeather'
  if (lower.startsWith('dangerweather/')) return 'dangerWeather'
  if (lower.startsWith('weatherwonders/')) return 'weatherWonders'
  if (lower.startsWith('mining/') || lower === 'mining/') return 'mining'
  if (lower.startsWith('farming/') || lower === 'farming/') return 'farming'
  if (lower.startsWith('pajamas/') || lower === 'pajamas/') return 'pajamas'
  if (lower.startsWith('swimsuit/') || lower === 'swimsuit/') return 'swimsuit'
  if (lower.startsWith('island/')) return 'island'
  if (lower.startsWith('desert/') || lower === 'desert/') return 'desert'
  if (lower.startsWith('lumberjack/') || lower === 'lumberjack/') return 'lumberjack'
  if (lower.startsWith('gardening/') || lower === 'gardening/') return 'gardening'
  if (lower.startsWith('stargazing/') || lower === 'stargazing/') return 'stargazing'
  if (/^(spring|summer|fall|winter)\//i.test(folderPath)) return 'seasonWeather'
  return 'other'
}

function isIndoorFile(filename) {
  return filename.toLowerCase().includes('_indoors')
}

function isExtendedEmotionFile(filename) {
  return /portrait_(scared|surprised|surprise|disgust|awkward|surpirsed)/i.test(filename)
}

function makeScenarioId(folderPath) {
  return folderPath.replace(/\//g, '__').replace(/_$/, '') || 'base'
}

function makeLabel(folderPath) {
  if (!folderPath) return 'Base (default)'
  return folderPath.replace(/\/$/, '').replace(/\//g, ' / ')
}

/** Collect folderPath -> Set<exact png filenames> from reference portrait folders. */
function scanPortraitFiles(rootDir) {
  const scenarios = new Map()

  if (!existsSync(rootDir)) return scenarios

  function walk(currentDir, relativeDir = '') {
    const pngFiles = []

    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
        pngFiles.push(entry.name)
      }
    }

    if (pngFiles.length > 0) {
      const folderPath = normalizeFolderPath(relativeDir)
      if (!scenarios.has(folderPath)) scenarios.set(folderPath, new Set())
      for (const file of pngFiles) scenarios.get(folderPath).add(file)
    }

    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const nextRelative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
      walk(join(currentDir, entry.name), nextRelative)
    }
  }

  walk(rootDir)
  return scenarios
}

function mergeScenarios(...scenarioMaps) {
  const merged = new Map()
  for (const map of scenarioMaps) {
    for (const [folderPath, files] of map.entries()) {
      if (!merged.has(folderPath)) merged.set(folderPath, new Set())
      for (const file of files) merged.get(folderPath).add(file)
    }
  }
  return merged
}

const referenceRoots = [PLAYER1_ROOT, EXAMPLE_ROOT].filter((path) => existsSync(path))

if (referenceRoots.length === 0 && existsSync(OUTPUT)) {
  console.log('No reference portrait folders found; keeping existing scenarioManifest.json')
  process.exit(0)
}

const scenarioFiles = mergeScenarios(...referenceRoots.map(scanPortraitFiles))

if (scenarioFiles.size === 0) {
  console.warn('Warning: no example portrait PNGs found under Player 1 or Example.')
}

const scenarioMap = new Map()

for (const [folderPath, files] of scenarioFiles.entries()) {
  if (!isEligibleWeatherWonderFolder(folderPath)) continue
  if (!isEligibleDangerWeatherFolder(folderPath)) continue

  const fileList = [...files].sort()
  const group = classifyFolder(folderPath)
  scenarioMap.set(makeScenarioId(folderPath), {
    id: makeScenarioId(folderPath),
    label: makeLabel(folderPath),
    folderPath,
    files: fileList,
    group,
  })
}

const groups = {
  base: [],
  seasonWeather: [],
  festivals: [],
  mining: [],
  farming: [],
  pajamas: [],
  swimsuit: [],
  island: [],
  desert: [],
  lumberjack: [],
  gardening: [],
  stargazing: [],
  dangerWeather: [],
  weatherWonders: [],
  other: [],
}

for (const scenario of scenarioMap.values()) {
  const entry = {
    id: scenario.id,
    label: scenario.label,
    folderPath: scenario.folderPath,
    files: scenario.files,
    group: scenario.group,
    hasIndoor: scenario.files.some(isIndoorFile),
    hasExtended: scenario.files.some(isExtendedEmotionFile),
  }
  const bucket = groups[scenario.group] ?? groups.other
  bucket.push(entry)
}

for (const key of Object.keys(groups)) {
  groups[key].sort((a, b) => a.label.localeCompare(b.label))
}

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceMod: MOD_ROOT,
  referenceFoldersScanned: referenceRoots,
  groups,
  groupLabels: {
    base: 'Base Portraits',
    seasonWeather: 'Seasons & Weather',
    festivals: 'Festivals',
    mining: 'Mining',
    farming: 'Farming',
    pajamas: 'Pajamas',
    swimsuit: 'Swimsuit',
    island: 'Ginger Island',
    desert: 'Desert',
    lumberjack: 'Lumberjack',
    gardening: 'Gardening',
    stargazing: 'Stargazing',
    dangerWeather: 'Project Danger Weather',
    weatherWonders: 'Weather Wonders',
    other: 'Other',
  },
  coreGroups: ['base', 'seasonWeather', 'festivals'],
  advancedGroups: [
    'weatherWonders',
    'dangerWeather',
    'mining',
    'farming',
    'pajamas',
    'swimsuit',
    'island',
    'desert',
    'lumberjack',
    'gardening',
    'stargazing',
  ],
}

mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2))

const counts = Object.fromEntries(Object.entries(groups).map(([key, value]) => [key, value.length]))
const totalFiles = [...scenarioFiles.values()].reduce((sum, set) => sum + set.size, 0)
console.log('Generated scenario manifest from example portraits:', counts)
console.log(`Total scenarios: ${scenarioFiles.size}, total portrait slots: ${totalFiles}`)
console.log('Reference folders:', referenceRoots)
