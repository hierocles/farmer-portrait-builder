import { useState } from 'react'

import type { Scenario, ScenarioGroupKey } from '../lib/types'

import {
  countGroupSlotStats,
  hasPalettePortraits,
  scenarioManifest,
  usePortraitStore,
} from '../store/portraitStore'

import { ScenarioCard } from './ScenarioCard'

interface ScenarioGroupProps {
  groupKey: ScenarioGroupKey

  scenarios: Scenario[]

  defaultOpen?: boolean
}

export function ScenarioGroup({ groupKey, scenarios, defaultOpen = true }: ScenarioGroupProps) {
  const [open, setOpen] = useState(defaultOpen)

  const assignments = usePortraitStore((s) => s.assignments)

  const palette = usePortraitStore((s) => s.palette)

  const settings = usePortraitStore((s) => s.settings)

  const applyDefaultsToScenarios = usePortraitStore((s) => s.applyDefaultsToScenarios)

  const clearAssignmentsForScenarios = usePortraitStore((s) => s.clearAssignmentsForScenarios)

  const [filling, setFilling] = useState(false)

  const [feedback, setFeedback] = useState<string | null>(null)

  const label = scenarioManifest.groupLabels[groupKey] ?? groupKey

  const { filled, total } = countGroupSlotStats(scenarios, assignments, settings)

  const progressPct = total > 0 ? Math.round((filled / total) * 100) : 0

  const canFillGroup = hasPalettePortraits(palette)

  const handleFill = async () => {
    setFilling(true)

    const count = await applyDefaultsToScenarios(scenarios)

    setFeedback(`Applied ${count} portrait(s).`)

    setFilling(false)
  }

  const handleClear = () => {
    if (filled === 0) return

    const count = clearAssignmentsForScenarios(scenarios)

    setFeedback(`Cleared ${count} portrait(s).`)
  }

  if (scenarios.length === 0) return null

  return (
    <section className="scenario-group sdv-wood-panel">
      <header className="scenario-group__header">
        <button
          type="button"
          className="scenario-group__toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}>
          <span className="scenario-group__chevron">{open ? '▼' : '▶'}</span>
          <h3>{label}</h3>
          <span className="scenario-group__count">
            {filled}/{total}
          </span>
          <div className="scenario-group__progress-bar" aria-hidden="true">
            <div className="scenario-group__progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </button>

        <div className="scenario-group__actions">
          <button
            type="button"
            className="btn-secondary"
            disabled={filling || filled === 0}
            onClick={handleClear}>
            Clear group
          </button>

          <button
            type="button"
            className="btn-secondary"
            disabled={filling || !canFillGroup}
            onClick={() => void handleFill()}>
            {filling ? 'Applying…' : 'Fill group'}
          </button>
        </div>
      </header>

      {feedback && <p className="scenario-group__feedback">{feedback}</p>}

      {open && (
        <div className="scenario-group__grid">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      )}
    </section>
  )
}
