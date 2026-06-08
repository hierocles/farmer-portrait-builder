import type { Scenario } from './types'

export const SEASON_COLLAPSIBLE_GROUPS = new Set([
  'seasonWeather',
  'weatherWonders',
  'dangerWeather',
])

const SEASON_ORDER = ['Spring', 'Summer', 'Fall', 'Winter'] as const

export type SeasonName = (typeof SEASON_ORDER)[number]

export interface SeasonScenarioGroup {
  season: SeasonName | 'Other'
  scenarios: Scenario[]
}

export function getSeasonFromScenario(scenario: Scenario): SeasonName | 'Other' {
  const match = scenario.folderPath.match(/^(Spring|Summer|Fall|Winter)\//)
  return match ? (match[1] as SeasonName) : 'Other'
}

export function groupScenariosBySeason(scenarios: Scenario[]): SeasonScenarioGroup[] {
  const bySeason = new Map<SeasonScenarioGroup['season'], Scenario[]>()

  for (const scenario of scenarios) {
    const season = getSeasonFromScenario(scenario)
    const list = bySeason.get(season) ?? []
    list.push(scenario)
    bySeason.set(season, list)
  }

  const groups: SeasonScenarioGroup[] = []
  for (const season of SEASON_ORDER) {
    const seasonScenarios = bySeason.get(season)
    if (seasonScenarios?.length) {
      groups.push({ season, scenarios: seasonScenarios })
    }
  }

  const other = bySeason.get('Other')
  if (other?.length) {
    groups.push({ season: 'Other', scenarios: other })
  }

  return groups
}
