import { normalizeFolderPath } from './exportPaths'
import { isIndoorFilename, resolveIndoorCounterpartFilename } from './types'

export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter'

export type WeatherFamily =
  | 'sun'
  | 'wind'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'heat'
  | 'dry'
  | 'cloudy'

export const WEATHER_FAMILY_LABELS: Record<WeatherFamily, string> = {
  sun: 'sunny',
  wind: 'windy',
  rain: 'rainy',
  storm: 'stormy',
  snow: 'snowy',
  heat: 'hot',
  dry: 'dry',
  cloudy: 'cloudy',
}

const SEASON_WEATHER_PATH = /^(Spring|Summer|Fall|Winter)\/([^/]+)\/$/

const WEATHER_FAMILY_BY_KEY: Record<string, WeatherFamily> = {
  Sun: 'sun',
  Rain: 'rain',
  GreenRain: 'rain',
  Storm: 'storm',
  Wind: 'wind',
  Snow: 'snow',

  'kath.weathering_HeavyRain': 'rain',
  'kath.weathering_AcidRain': 'rain',
  'kath.weathering_MudRain': 'rain',
  'kath.weathering_Hurry': 'rain',
  'kath.weathering_Tornado': 'storm',
  'kath.weathering_DryLightning': 'storm',
  'kath.weathering_Hail': 'snow',
  'kath.weathering_Blizzard': 'snow',
  'kath.weathering_HeatWave': 'heat',
  'kath.weathering_Wildfire': 'heat',
  'kath.weathering_Sandstorm': 'dry',
  'kath.weathering_Smog': 'cloudy',

  'Kana.WeatherWonders_Deluge': 'rain',
  'Kana.WeatherWonders_Drizzle': 'rain',
  'Kana.WeatherWonders_MuddyRain': 'rain',
  'Kana.WeatherWonders_AcidRain': 'rain',
  'Kana.WeatherWonders_RainSnowMix': 'rain',
  'Kana.WeatherWonders_DryLightning': 'storm',
  'Kana.WeatherWonders_Hailstorm': 'storm',
  'Kana.WeatherWonders_Heatwave': 'heat',
  'Kana.WeatherWonders_Blizzard': 'snow',
  'Kana.WeatherWonders_Cloudy': 'cloudy',
  'Kana.WeatherWonders_Mist': 'cloudy',
}

export interface SeasonWeatherPath {
  season: Season
  weatherKey: string
}

export interface SimilarWeatherSelection<T extends { folderPath: string; filename: string; key: string }> {
  season?: Season
  family: WeatherFamily
  familyLabel: string
  targetFilename: string
  targets: T[]
}

interface SimilarWeatherOptions {
  seasonScope: 'same' | 'all'
  targetFilename?: string
  indoorOnly?: boolean
}

export function parseSeasonWeatherPath(folderPath: string): SeasonWeatherPath | null {
  const match = normalizeFolderPath(folderPath).match(SEASON_WEATHER_PATH)
  if (!match) return null
  return {
    season: match[1] as Season,
    weatherKey: match[2],
  }
}

export function getWeatherFamily(weatherKey: string): WeatherFamily | null {
  return WEATHER_FAMILY_BY_KEY[weatherKey] ?? null
}

function isSourceSlot(
  sourceFolderPath: string,
  sourceFilename: string,
  candidate: { folderPath: string; filename: string },
): boolean {
  return (
    normalizeFolderPath(candidate.folderPath) === normalizeFolderPath(sourceFolderPath) &&
    candidate.filename === sourceFilename
  )
}

function findSimilarWeatherTargets<
  T extends { folderPath: string; filename: string; key: string },
>(
  sourceFolderPath: string,
  sourceFilename: string,
  candidates: T[],
  options: SimilarWeatherOptions,
): SimilarWeatherSelection<T> | null {
  const source = parseSeasonWeatherPath(sourceFolderPath)
  if (!source) return null

  const family = getWeatherFamily(source.weatherKey)
  if (!family) return null

  const targetFilename = options.targetFilename ?? sourceFilename

  const targets = candidates.filter((candidate) => {
    if (isSourceSlot(sourceFolderPath, sourceFilename, candidate)) return false
    if (candidate.filename !== targetFilename) return false
    if (options.indoorOnly && !isIndoorFilename(candidate.filename)) return false

    const parsed = parseSeasonWeatherPath(candidate.folderPath)
    if (!parsed) return false
    if (options.seasonScope === 'same' && parsed.season !== source.season) return false

    return getWeatherFamily(parsed.weatherKey) === family
  })

  if (targets.length === 0) return null

  return {
    season: options.seasonScope === 'same' ? source.season : undefined,
    family,
    familyLabel: WEATHER_FAMILY_LABELS[family],
    targetFilename,
    targets,
  }
}

export function findSimilarWeatherSlotTargets<
  T extends { folderPath: string; filename: string; key: string },
>(
  sourceFolderPath: string,
  filename: string,
  candidates: T[],
): SimilarWeatherSelection<T> | null {
  return findSimilarWeatherTargets(sourceFolderPath, filename, candidates, {
    seasonScope: 'same',
  })
}

export function findSimilarWeatherSlotTargetsAllSeasons<
  T extends { folderPath: string; filename: string; key: string },
>(
  sourceFolderPath: string,
  filename: string,
  candidates: T[],
): SimilarWeatherSelection<T> | null {
  return findSimilarWeatherTargets(sourceFolderPath, filename, candidates, {
    seasonScope: 'all',
  })
}

export function findSimilarSeasonWeatherIndoorTargets<
  T extends { folderPath: string; filename: string; key: string },
>(
  sourceFolderPath: string,
  filename: string,
  candidates: T[],
): SimilarWeatherSelection<T> | null {
  const indoorFilename = resolveIndoorCounterpartFilename(filename)
  if (!indoorFilename) return null

  return findSimilarWeatherTargets(sourceFolderPath, filename, candidates, {
    seasonScope: 'same',
    targetFilename: indoorFilename,
    indoorOnly: true,
  })
}
