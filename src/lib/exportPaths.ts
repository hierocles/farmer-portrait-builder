import manifest from '../data/scenarioManifest.json'
import { getDangerWeatherLegacySeason } from './dangerWeatherSeasons'
import type { AppSettings, Assignment, Scenario, ScenarioManifest } from './types'
import { getScenarioVisibleFiles, parseSlotKey, slotKey } from './types'

const scenarioManifest = manifest as ScenarioManifest

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'] as const

/** Old DangerWeather/{outfit-name}/ folders from pre-reorg portrait_cw.json */
const DANGER_WEATHER_OUTFIT_FOLDERS: Record<string, string> = {
  'Heavy Rains': 'Spring/kath.weathering_HeavyRain',
  'Heavy Rain': 'Spring/kath.weathering_HeavyRain',
  'A Small Chance of Meatballs': 'Spring/kath.weathering_Meatball',
  Meatballs: 'Spring/kath.weathering_Meatball',
  'Locust Swarm': 'Spring/kath.weathering_Locust',
  Locust: 'Spring/kath.weathering_Locust',
  'Tornado Watch': 'Spring/kath.weathering_Tornado',
  Tornado: 'Spring/kath.weathering_Tornado',
  'Heat Wave': 'Summer/kath.weathering_HeatWave',
  Wildfire: 'Summer/kath.weathering_Wildfire',
  'Dry Lightning': 'Summer/kath.weathering_DryLightning',
  Sandstorm: 'Summer/kath.weathering_Sandstorm',
  Monsoon: 'Summer/kath.weathering_Monsoon',
  'Tropical Storm': 'Summer/kath.weathering_Monsoon',
  'Acid Rain': 'Fall/kath.weathering_AcidRain',
  'Mud Rain': 'Fall/kath.weathering_MudRain',
  Smog: 'Fall/kath.weathering_Smog',
  'Heavy Fog': 'Spring/kath.weathering_NoVis',
  'Heavy Fog Spring': 'Spring/kath.weathering_NoVis',
  'Heavy Fog Summer': 'Summer/kath.weathering_NoVis',
  'Heavy Fog Fall': 'Fall/kath.weathering_NoVis',
  'Heavy Fog Winter': 'Winter/kath.weathering_NoVis',
  Hail: 'Winter/kath.weathering_Hail',
  Blizzard: 'Winter/kath.weathering_Blizzard',
}

/** Old WeatherWonders/{Season}/{outfit-name}/ folder name bases */
const WEATHER_WONDERS_OUTFIT_BASE: Record<string, string> = {
  Deluge: 'Kana.WeatherWonders_Deluge',
  Drizzle: 'Kana.WeatherWonders_Drizzle',
  'Dry Lightning': 'Kana.WeatherWonders_DryLightning',
  Hailstorm: 'Kana.WeatherWonders_Hailstorm',
  'Rain-Snow': 'Kana.WeatherWonders_RainSnowMix',
  'Rain-Snow Mix': 'Kana.WeatherWonders_RainSnowMix',
  Heatwave: 'Kana.WeatherWonders_Heatwave',
  Heatwaves: 'Kana.WeatherWonders_Heatwave',
  'Muddy Rain': 'Kana.WeatherWonders_MuddyRain',
  Blizzard: 'Kana.WeatherWonders_Blizzard',
  Cloudy: 'Kana.WeatherWonders_Cloudy',
  Mist: 'Kana.WeatherWonders_Mist',
  'Acid Rain': 'Kana.WeatherWonders_AcidRain',
  Sandstorm: 'Kana.WeatherWonders_Sandstorm',
}

const FESTIVAL_FOLDER_ALIASES: Record<string, string> = {
  EggFestival: 'Egg Festival',
  FlowerDance: 'Flower Dance',
  MoonlightJellies: 'Dance of the Moonlight Jellies',
  Fair: 'Stardew Valley Fair',
  SpiritsEve: "Spirit's Eve",
  IceFestival: 'Festival of Ice',
  WinterStar: 'Feast of the Winter Star',
  Communityday: 'CommunityDay',
  CommunityDay: 'CommunityDay',
  'Squid Fest': 'SquidFest',
  SquidFest: 'SquidFest',
  Festive: 'Festive',
  SurfingFestival: 'Surfing Festival',
}

const LEGACY_SEASON_WEATHER: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const season of SEASONS) {
    map[`${season}/${season}/`] = `${season}/Sun/`
    map[`${season}/${season} Rain/`] = `${season}/Rain/`
    map[`${season}/${season} Storm/`] = `${season}/Storm/`
    map[`${season}/${season} Wind/`] = `${season}/Wind/`
    map[`${season}/${season} GreenRain/`] = `${season}/GreenRain/`
  }
  map['Winter/Winter Snow/'] = 'Winter/Snow/'
  map['Island/Island/'] = 'Island/Sun/'
  map['Island/Island Rain/'] = 'Island/Rain/'
  return map
})()

const SEASONAL_ACTIVITY_FOLDERS = ['Pajamas', 'Farming', 'Desert', 'Mining'] as const

export function normalizeFolderPath(folderPath: string): string {
  if (!folderPath) return ''
  return folderPath.replace(/\\/g, '/').replace(/\/?$/, '/')
}

const MANIFEST_SLOT_SETTINGS: AppSettings = {
  extendedEmotions: true,
  indoorVariants: true,
  resizeOnExport: false,
  enabledAdvancedGroups: {},
}

export function buildManifestSlotIndex(): Set<string> {
  const slots = new Set<string>()
  for (const scenarios of Object.values(scenarioManifest.groups)) {
    for (const scenario of scenarios as Scenario[]) {
      for (const file of getScenarioVisibleFiles(scenario, MANIFEST_SLOT_SETTINGS)) {
        slots.add(slotKey(normalizeFolderPath(scenario.folderPath), file))
      }
    }
  }
  return slots
}

function mapFestivalFolderName(folderName: string): string {
  return FESTIVAL_FOLDER_ALIASES[folderName] ?? folderName
}

function stripIndoorSuffix(name: string): string {
  return name.endsWith(' Indoor') ? name.slice(0, -' Indoor'.length) : name
}

function migrateDangerWeatherOutfitFolder(folderName: string): string | null {
  const base = stripIndoorSuffix(folderName)
  return DANGER_WEATHER_OUTFIT_FOLDERS[base] ?? null
}

function migrateWeatherWondersOutfitFolder(season: string, folderName: string): string | null {
  const base = stripIndoorSuffix(folderName)
  const match = base.match(/^(.+?) (Spring|Summer|Fall|Winter)$/)
  if (!match) return null
  const [, outfitBase, outfitSeason] = match
  if (outfitSeason !== season) return null
  const weatherId = WEATHER_WONDERS_OUTFIT_BASE[outfitBase]
  return weatherId ? `${season}/${weatherId}` : null
}

function collapseSeasonalActivityFolder(path: string): string | null {
  for (const activity of SEASONAL_ACTIVITY_FOLDERS) {
    const match = path.match(new RegExp(`^${activity}/(Spring|Summer|Fall|Winter)/$`, 'i'))
    if (match) return `${activity}/`
  }
  return null
}

/** Remap pre-reorg assignment folder paths to the current Player 1 layout. */
export function migrateLegacyFolderPath(folderPath: string): string {
  const path = normalizeFolderPath(folderPath)

  const weatherWondersMatch = path.match(
    /^WeatherWonders\/(Spring|Summer|Fall|Winter)\/([^/]+)\/$/i,
  )
  if (weatherWondersMatch) {
    const [, season, subfolder] = weatherWondersMatch
    if (/^Kana\.WeatherWonders_/i.test(subfolder)) {
      return `${season}/${subfolder}/`
    }
    const migrated = migrateWeatherWondersOutfitFolder(season, subfolder)
    if (migrated) return `${migrated}/`
  }

  const dangerSeasonMatch = path.match(
    /^DangerWeather\/(Spring|Summer|Fall|Winter)\/(kath\.weathering_[^/]+)\/$/i,
  )
  if (dangerSeasonMatch) {
    const [, season, weatherId] = dangerSeasonMatch
    return `${season}/${weatherId}/`
  }

  const dangerOutfitMatch = path.match(/^DangerWeather\/([^/]+)\/$/i)
  if (dangerOutfitMatch) {
    const folder = dangerOutfitMatch[1]
    if (/^kath\.weathering_/i.test(folder)) {
      const season = getDangerWeatherLegacySeason(folder)
      if (season) return `${season}/${folder}/`
    } else {
      const migrated = migrateDangerWeatherOutfitFolder(folder)
      if (migrated) return `${migrated}/`
    }
  }

  if (LEGACY_SEASON_WEATHER[path]) {
    return LEGACY_SEASON_WEATHER[path]
  }

  const festivalMatch = path.match(/^(?:festivals|Festivals)\/([^/]+)\/$/i)
  if (festivalMatch) {
    return `Festivals/${mapFestivalFolderName(festivalMatch[1])}/`
  }

  const collapsedActivity = collapseSeasonalActivityFolder(path)
  if (collapsedActivity) return collapsedActivity

  const topLevelAliases: Record<string, string> = {
    mining: 'Mining',
    pajamas: 'Pajamas',
    swimsuit: 'Swimsuit',
    desert: 'Desert',
    gardening: 'Gardening',
    stargazing: 'Stargazing',
    lumberjack: 'Lumberjack',
    farming: 'Farming',
  }

  const topLevelMatch = path.match(/^([^/]+)\/(.*)$/)
  if (topLevelMatch) {
    const [, head, tail] = topLevelMatch
    const mappedHead = topLevelAliases[head.toLowerCase()]
    if (mappedHead && head !== mappedHead) {
      return tail ? `${mappedHead}/${tail}` : `${mappedHead}/`
    }
  }

  return path
}

export function resolveExportPath(
  folderPath: string,
  filename: string,
  manifestSlots: Set<string>,
): { folderPath: string; filename: string } | null {
  const candidates = [migrateLegacyFolderPath(folderPath), normalizeFolderPath(folderPath)]

  for (const candidateFolder of candidates) {
    const key = slotKey(candidateFolder, filename)
    if (manifestSlots.has(key)) {
      return { folderPath: candidateFolder, filename }
    }
  }

  return null
}

export function buildZipAssetPath(
  farmerName: string,
  folderPath: string,
  filename: string,
): string {
  const normalizedFolder = normalizeFolderPath(folderPath)
  return `assets/${farmerName}/${normalizedFolder}${filename}`
}

export function migrateAssignmentKeys(assignments: Record<string, Assignment>): {
  assignments: Record<string, Assignment>
  migratedCount: number
  droppedCount: number
} {
  const manifestSlots = buildManifestSlotIndex()
  const migrated: Record<string, Assignment> = {}
  let migratedCount = 0
  let droppedCount = 0

  for (const [key, assignment] of Object.entries(assignments)) {
    const { folderPath, filename } = parseSlotKey(key)
    const resolved = resolveExportPath(folderPath, filename, manifestSlots)

    if (!resolved) {
      droppedCount++
      continue
    }

    const newKey = slotKey(resolved.folderPath, resolved.filename)
    if (newKey !== key) migratedCount++
    migrated[newKey] = assignment
  }

  return { assignments: migrated, migratedCount, droppedCount }
}
