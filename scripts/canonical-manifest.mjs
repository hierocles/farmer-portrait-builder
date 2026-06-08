import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const WEATHER_WONDERS_SEASONS = JSON.parse(
  readFileSync(join(__dirname, '../src/data/weatherWondersSeasons.json'), 'utf8'),
)
const DANGER_WEATHER_SEASONS = JSON.parse(
  readFileSync(join(__dirname, '../src/data/dangerWeatherSeasons.json'), 'utf8'),
)

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter']

const CORE_PORTRAIT_FILES = [
  'portrait.png',
  'portrait_angry.png',
  'portrait_blush.png',
  'portrait_happy.png',
  'portrait_sad.png',
]

/** Vanilla season/weather folders under assets/{name}/{Season}/{Weather}/ */
const SEASON_WEATHERS = {
  Spring: ['Sun', 'Rain', 'GreenRain', 'Storm', 'Wind'],
  Summer: ['Sun', 'Rain', 'GreenRain', 'Storm', 'Wind'],
  Fall: ['Sun', 'Rain', 'GreenRain', 'Storm', 'Wind'],
  Winter: ['Sun', 'Rain', 'GreenRain', 'Storm', 'Snow', 'Wind'],
}

const FESTIVAL_FOLDERS = [
  { folderName: 'CommunityDay' },
  { folderName: 'Dance of the Moonlight Jellies' },
  { folderName: 'Desert Festival' },
  { folderName: 'Egg Festival' },
  { folderName: 'Feast of the Winter Star' },
  { folderName: 'Festival of Ice' },
  { folderName: 'Flower Dance' },
  { folderName: 'Luau' },
  { folderName: 'Night Market', hasIndoor: true },
  { folderName: "Spirit's Eve" },
  { folderName: 'SquidFest' },
  { folderName: 'Stardew Valley Fair' },
  { folderName: 'Surfing Festival' },
  { folderName: 'Trout Derby' },
  { folderName: 'Wedding' },
  { folderName: 'Zuzu Block Party' },
]

const ACTIVITY_SCENARIOS = [
  { folderPath: 'Mining/', group: 'mining', label: 'Mining' },
  { folderPath: 'Farming/', group: 'farming', label: 'Farming' },
  { folderPath: 'Pajamas/', group: 'pajamas', label: 'Pajamas' },
  { folderPath: 'Swimsuit/', group: 'swimsuit', label: 'Swimsuit' },
  { folderPath: 'Desert/', group: 'desert', label: 'Desert' },
  { folderPath: 'Lumberjack/', group: 'lumberjack', label: 'Lumberjack' },
  { folderPath: 'Gardening/', group: 'gardening', label: 'Gardening' },
  { folderPath: 'Stargazing/', group: 'stargazing', label: 'Stargazing' },
]

const ISLAND_WEATHERS = [
  { weather: 'Sun', hasIndoor: false },
  { weather: 'Rain', hasIndoor: true },
]

export const GROUP_LABELS = {
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
}

export const CORE_GROUPS = ['base', 'seasonWeather', 'festivals']

export const ADVANCED_GROUPS = [
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
]

function makeScenarioId(folderPath) {
  return folderPath.replace(/\//g, '__').replace(/_$/, '') || 'base'
}

function makeLabel(folderPath) {
  if (!folderPath) return 'Base (default)'
  return folderPath.replace(/\/$/, '').replace(/\//g, ' / ')
}

function portraitFiles({ hasIndoor, extraFiles = [] }) {
  if (!hasIndoor) {
    return [...CORE_PORTRAIT_FILES, ...extraFiles]
  }

  return [
    'portrait.png',
    'portrait_angry.png',
    'portrait_angry_indoors.png',
    'portrait_blush.png',
    'portrait_blush_indoors.png',
    'portrait_happy.png',
    'portrait_happy_indoors.png',
    'portrait_indoors.png',
    'portrait_sad.png',
    'portrait_sad_indoors.png',
    ...extraFiles,
  ]
}

function makeScenario({ folderPath, group, label, hasIndoor = false, extraFiles = [] }) {
  const files = portraitFiles({ hasIndoor, extraFiles })
  return {
    id: makeScenarioId(folderPath),
    label: label ?? makeLabel(folderPath),
    folderPath,
    files,
    group,
    hasIndoor,
    hasExtended: false,
  }
}

function buildBaseScenarios() {
  return [makeScenario({ folderPath: '', group: 'base', label: 'Base (default)' })]
}

function buildSeasonWeatherScenarios() {
  const scenarios = []

  for (const season of SEASONS) {
    for (const weather of SEASON_WEATHERS[season]) {
      const folderPath = `${season}/${weather}/`
      const extraFiles = season === 'Winter' && weather === 'Wind' ? ['portrait_wind.png'] : []
      scenarios.push(
        makeScenario({
          folderPath,
          group: 'seasonWeather',
          hasIndoor: true,
          extraFiles,
        }),
      )
    }
  }

  return scenarios
}

function buildFestivalScenarios() {
  return FESTIVAL_FOLDERS.map(({ folderName, hasIndoor = false }) =>
    makeScenario({
      folderPath: `Festivals/${folderName}/`,
      group: 'festivals',
      hasIndoor,
    }),
  )
}

function buildActivityScenarios() {
  return ACTIVITY_SCENARIOS.map(({ folderPath, group, label }) =>
    makeScenario({ folderPath, group, label }),
  )
}

function buildIslandScenarios() {
  return ISLAND_WEATHERS.map(({ weather, hasIndoor }) =>
    makeScenario({
      folderPath: `Island/${weather}/`,
      group: 'island',
      hasIndoor,
    }),
  )
}

function buildModdedWeatherScenarios(group, seasonsByWeather) {
  const scenarios = []

  for (const [weatherKey, seasons] of Object.entries(seasonsByWeather)) {
    for (const season of seasons) {
      scenarios.push(
        makeScenario({
          folderPath: `${season}/${weatherKey}/`,
          group,
          hasIndoor: true,
        }),
      )
    }
  }

  return scenarios
}

function sortScenarios(scenarios) {
  return [...scenarios].sort((a, b) => a.label.localeCompare(b.label))
}

export function buildCanonicalGroups() {
  const groups = {
    base: sortScenarios(buildBaseScenarios()),
    seasonWeather: sortScenarios(buildSeasonWeatherScenarios()),
    festivals: sortScenarios(buildFestivalScenarios()),
    mining: [],
    farming: [],
    pajamas: [],
    swimsuit: [],
    island: sortScenarios(buildIslandScenarios()),
    desert: [],
    lumberjack: [],
    gardening: [],
    stargazing: [],
    dangerWeather: sortScenarios(buildModdedWeatherScenarios('dangerWeather', DANGER_WEATHER_SEASONS)),
    weatherWonders: sortScenarios(
      buildModdedWeatherScenarios('weatherWonders', WEATHER_WONDERS_SEASONS),
    ),
    other: [],
  }

  for (const scenario of buildActivityScenarios()) {
    groups[scenario.group].push(scenario)
  }

  for (const key of Object.keys(groups)) {
    if (groups[key].length > 1) {
      groups[key] = sortScenarios(groups[key])
    }
  }

  return groups
}

export function buildCanonicalManifest() {
  return {
    generatedAt: new Date().toISOString(),
    groups: buildCanonicalGroups(),
    groupLabels: GROUP_LABELS,
    coreGroups: CORE_GROUPS,
    advancedGroups: ADVANCED_GROUPS,
  }
}
