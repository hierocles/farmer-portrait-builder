import { useCallback, useEffect, useState } from 'react'

import type { Scenario } from '../lib/types'
import { getScenarioVisibleFiles } from '../lib/types'

import { useNativeFileDrop } from '../hooks/useNativeFileDrop'

import { usePortraitStore } from '../store/portraitStore'

import { PortraitSlot } from './PortraitSlot'

interface ScenarioCardProps {
  scenario: Scenario
}

function formatDropFeedback(assigned: number, unmatched: string[]): string | null {
  if (assigned === 0 && unmatched.length === 0) return null

  const parts: string[] = []

  if (assigned > 0) {
    parts.push(`Assigned ${assigned} portrait${assigned === 1 ? '' : 's'}.`)
  }

  if (unmatched.length > 0) {
    const preview = unmatched.slice(0, 3).join(', ')
    const suffix = unmatched.length > 3 ? ` (+${unmatched.length - 3} more)` : ''
    parts.push(`${unmatched.length} file${unmatched.length === 1 ? '' : 's'} skipped (${preview}${suffix}).`)
  }

  return parts.join(' ')
}

export function ScenarioCard({ scenario }: ScenarioCardProps) {
  const settings = usePortraitStore((s) => s.settings)
  const assignCustomFilesToScenario = usePortraitStore((s) => s.assignCustomFilesToScenario)

  const visibleFiles = getScenarioVisibleFiles(scenario, settings)

  const [feedback, setFeedback] = useState<string | null>(null)

  const handleFilesDrop = useCallback(
    async (files: File[]) => {
      const result = await assignCustomFilesToScenario(scenario, files)
      setFeedback(formatDropFeedback(result.assigned, result.unmatched))
    },
    [assignCustomFilesToScenario, scenario],
  )

  const { isFileDragOver, fileDropHandlers } = useNativeFileDrop({
    onDrop: (files) => void handleFilesDrop(files),
  })

  useEffect(() => {
    if (!feedback) return

    const timer = window.setTimeout(() => setFeedback(null), 5000)
    return () => window.clearTimeout(timer)
  }, [feedback])

  return (
    <article className="scenario-card sdv-wood-panel">
      <h4 className="scenario-card__title">{scenario.label}</h4>
      <p className="scenario-card__path">
        <code>assets/&#123;name&#125;/{scenario.folderPath || '(root)'}</code>
      </p>

      {feedback && <p className="scenario-card__feedback">{feedback}</p>}

      <div
        className={`scenario-card__slots ${isFileDragOver ? 'scenario-card__slots--file-over' : ''}`}
        {...fileDropHandlers}>
        {visibleFiles.map((filename) => (
          <PortraitSlot
            key={filename}
            folderPath={scenario.folderPath}
            filename={filename}
            onScenarioFilesDrop={(files) => void handleFilesDrop(files)}
          />
        ))}
      </div>
    </article>
  )
}
