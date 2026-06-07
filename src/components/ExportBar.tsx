import { useState } from 'react'

import { exportPortraitZip } from '../lib/exportZip'

import {
  countVisibleAssignments,
  countVisibleSlots,
  getScenariosForGroup,
  getVisibleGroups,
  hasPalettePortraits,
  usePortraitStore,
} from '../store/portraitStore'

import { SettingsPanel } from './SettingsPanel'

export function ExportBar() {
  const farmerName = usePortraitStore((s) => s.farmerName)

  const setFarmerName = usePortraitStore((s) => s.setFarmerName)

  const assignments = usePortraitStore((s) => s.assignments)

  const palette = usePortraitStore((s) => s.palette)

  const applyDefaultsToScenarios = usePortraitStore((s) => s.applyDefaultsToScenarios)

  const clearAllAssignments = usePortraitStore((s) => s.clearAllAssignments)

  const settings = usePortraitStore((s) => s.settings)

  const [exporting, setExporting] = useState(false)

  const [message, setMessage] = useState<string | null>(null)

  const [fillingAll, setFillingAll] = useState(false)

  const assignmentCount = Object.keys(assignments).length

  const visibleTotal = countVisibleSlots(settings)

  const visibleFilled = countVisibleAssignments(assignments, settings)

  const canFillVisible = hasPalettePortraits(palette)

  const handleExport = async () => {
    if (assignmentCount === 0) {
      setMessage('Assign at least one portrait before exporting.')

      return
    }

    setExporting(true)

    setMessage(null)

    try {
      const result = await exportPortraitZip()

      const skippedNote =
        result.skippedCount > 0
          ? ` (${result.skippedCount} stale slot(s) skipped — re-assign if needed)`
          : ''

      setMessage(
        `Exported ${result.fileCount} portrait(s) and ${result.setupFileCount} ESWF setup file(s) as ${result.farmerName}-portraits.zip${skippedNote}`,
      )
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleFillAllVisible = async () => {
    setFillingAll(true)

    const groups = getVisibleGroups(settings)

    const scenarios = groups.flatMap((g) => getScenariosForGroup(g))

    const count = await applyDefaultsToScenarios(scenarios)

    setMessage(`Applied defaults to ${count} slot(s) across visible groups.`)

    setFillingAll(false)
  }

  const handleClearAll = () => {
    if (assignmentCount === 0) return

    if (!window.confirm('Clear all assigned portraits from every scenario slot?')) return

    const count = clearAllAssignments()

    setMessage(`Cleared ${count} portrait assignment(s).`)
  }

  return (
    <header className="export-bar sdv-wood-panel">
      <div className="export-bar__brand">
        <div className="export-bar__emblem sdv-wood-inset" aria-hidden="true">
          <span role="img" style={{ fontSize: '2rem' }}>
            🧑‍🌾
          </span>
        </div>

        <div>
          <h1>Farmer Portrait Builder</h1>

          <p>Drag-and-drop configurator for Farmer Portraits and Farmer 2.0 ESWF</p>
        </div>
      </div>

      <div className="export-bar__controls">
        <p className="export-bar__progress sdv-wood-inset">
          <span className="export-bar__progress-value">
            {visibleFilled}/{visibleTotal}
          </span>
        </p>

        <label className="export-bar__field">
          Character Name
          <input
            type="text"
            value={farmerName}
            onChange={(e) => setFarmerName(e.target.value)}
            placeholder="Player 1"
          />
        </label>

        <button
          type="button"
          className="btn-secondary"
          disabled={fillingAll || !canFillVisible}
          onClick={() => void handleFillAllVisible()}>
          {fillingAll ? 'Applying…' : 'Fill visible'}
        </button>

        <button
          type="button"
          className="btn-secondary"
          disabled={assignmentCount === 0}
          onClick={handleClearAll}>
          Clear all
        </button>

        <button type="button" disabled={exporting} onClick={() => void handleExport()}>
          {exporting ? 'Exporting…' : `Export (${assignmentCount})`}
        </button>
      </div>

      <SettingsPanel />

      {message && <p className="export-bar__message sdv-wood-inset">{message}</p>}
    </header>
  )
}
