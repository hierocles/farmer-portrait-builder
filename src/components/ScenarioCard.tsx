import type { Scenario } from '../lib/types'
import { getScenarioVisibleFiles } from '../lib/types'
import { usePortraitStore } from '../store/portraitStore'
import { PortraitSlot } from './PortraitSlot'

interface ScenarioCardProps {
  scenario: Scenario
}

export function ScenarioCard({ scenario }: ScenarioCardProps) {
  const settings = usePortraitStore((s) => s.settings)
  const visibleFiles = getScenarioVisibleFiles(scenario, settings)

  return (
    <article className="scenario-card sdv-wood-panel">
      <h4 className="scenario-card__title">{scenario.label}</h4>
      <p className="scenario-card__path">
        <code>assets/&#123;name&#125;/{scenario.folderPath || '(root)'}</code>
      </p>
      <div className="scenario-card__slots">
        {visibleFiles.map((filename) => (
          <PortraitSlot key={filename} folderPath={scenario.folderPath} filename={filename} />
        ))}
      </div>
    </article>
  )
}
