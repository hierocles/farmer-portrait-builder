import seasonsByWeather from '../data/weatherWondersSeasons.json'
import { normalizeFolderPath } from './exportPaths'

export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter'

export const WEATHER_WONDERS_SEASONS = seasonsByWeather as Record<string, Season[]>

const WEATHER_WONDER_PATH = /^(Spring|Summer|Fall|Winter)\/(Kana\.WeatherWonders_[^/]+)\/$/i

export interface WeatherWonderPath {
  season: Season
  weatherKey: string
}

export function parseWeatherWonderPath(folderPath: string): WeatherWonderPath | null {
  const match = normalizeFolderPath(folderPath).match(WEATHER_WONDER_PATH)
  if (!match) return null
  return {
    season: match[1] as Season,
    weatherKey: match[2],
  }
}

export function isWeatherWonderEligible(season: Season, weatherKey: string): boolean {
  return WEATHER_WONDERS_SEASONS[weatherKey]?.includes(season) ?? false
}

export function isEligibleWeatherWonderFolder(folderPath: string): boolean {
  const parsed = parseWeatherWonderPath(folderPath)
  if (!parsed) return true
  return isWeatherWonderEligible(parsed.season, parsed.weatherKey)
}

export function listCanonicalWeatherWonderFolders(): string[] {
  const folders: string[] = []
  for (const [weatherKey, seasons] of Object.entries(WEATHER_WONDERS_SEASONS)) {
    for (const season of seasons) {
      folders.push(`${season}/${weatherKey}/`)
    }
  }
  return folders.sort()
}
