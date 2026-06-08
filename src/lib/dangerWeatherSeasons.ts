import seasonsByWeather from '../data/dangerWeatherSeasons.json'
import { normalizeFolderPath } from './exportPaths'

export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter'

export const DANGER_WEATHER_SEASONS = seasonsByWeather as Record<string, Season[]>

const DANGER_WEATHER_PATH = /^(Spring|Summer|Fall|Winter)\/(kath\.weathering_[^/]+)\/$/i

export interface DangerWeatherPath {
  season: Season
  weatherKey: string
}

export function parseDangerWeatherPath(folderPath: string): DangerWeatherPath | null {
  const match = normalizeFolderPath(folderPath).match(DANGER_WEATHER_PATH)
  if (!match) return null
  return {
    season: match[1] as Season,
    weatherKey: match[2],
  }
}

export function isDangerWeatherEligible(season: Season, weatherKey: string): boolean {
  return DANGER_WEATHER_SEASONS[weatherKey]?.includes(season) ?? false
}

export function isEligibleDangerWeatherFolder(folderPath: string): boolean {
  const parsed = parseDangerWeatherPath(folderPath)
  if (!parsed) return true
  return isDangerWeatherEligible(parsed.season, parsed.weatherKey)
}

export function listCanonicalDangerWeatherFolders(): string[] {
  const folders: string[] = []
  for (const [weatherKey, seasons] of Object.entries(DANGER_WEATHER_SEASONS)) {
    for (const season of seasons) {
      folders.push(`${season}/${weatherKey}/`)
    }
  }
  return folders.sort()
}

/** First eligible season for legacy DangerWeather/{weather-id}/ paths. */
export function getDangerWeatherLegacySeason(weatherKey: string): Season | null {
  const seasons = DANGER_WEATHER_SEASONS[weatherKey]
  if (!seasons || seasons.length !== 1) return null
  return seasons[0]
}
