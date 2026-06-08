import { useState } from 'react'

import type { Scenario } from '../lib/types'

import { countGroupSlotStats, usePortraitStore } from '../store/portraitStore'

import { ScenarioCard } from './ScenarioCard'

interface SeasonScenarioSectionProps {
  season: string
  scenarios: Scenario[]
  defaultOpen?: boolean
}

export function SeasonScenarioSection({
  season,
  scenarios,
  defaultOpen = true,
}: SeasonScenarioSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const assignments = usePortraitStore((s) => s.assignments)
  const settings = usePortraitStore((s) => s.settings)

  const { filled, total } = countGroupSlotStats(scenarios, assignments, settings)
  const progressPct = total > 0 ? Math.round((filled / total) * 100) : 0

  if (scenarios.length === 0) return null

  return (
    <section className="scenario-season">
      <button
        type="button"
        className="scenario-season__toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}>
        <span className="scenario-season__chevron">{open ? '▼' : '▶'}</span>
        <h4 className="scenario-season__title">{season}</h4>
        <span className="scenario-season__count">
          {filled}/{total}
        </span>
        <div className="scenario-season__progress-bar" aria-hidden="true">
          <div className="scenario-season__progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </button>

      {open && (
        <div className="scenario-season__grid">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      )}
    </section>
  )
}
