import { useRef, useState } from 'react'

import { exportProjectZip } from '../lib/exportProject'
import { exportPortraitZip } from '../lib/exportZip'
import { revokePreviewUrl } from '../lib/validateImage'

import {
  clearAllStoredData,
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

  const importProject = usePortraitStore((s) => s.importProject)

  const settings = usePortraitStore((s) => s.settings)

  const projectInputRef = useRef<HTMLInputElement>(null)

  const [exporting, setExporting] = useState(false)

  const [savingProject, setSavingProject] = useState(false)

  const [loadingProject, setLoadingProject] = useState(false)

  const [message, setMessage] = useState<string | null>(null)

  const [fillingAll, setFillingAll] = useState(false)

  const assignmentCount = Object.keys(assignments).length

  const visibleTotal = countVisibleSlots(settings)

  const visibleFilled = countVisibleAssignments(assignments, settings)

  const canFillVisible = hasPalettePortraits(palette)

  const hasProjectData = hasPalettePortraits(palette) || assignmentCount > 0

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

  const handleSaveProject = async () => {
    setSavingProject(true)
    setMessage(null)

    try {
      const result = await exportProjectZip()
      setMessage(
        `Saved project as ${result.filename} (${result.paletteCount} palette, ${result.assignmentCount} assignment(s)).`,
      )
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save project failed')
    } finally {
      setSavingProject(false)
    }
  }

  const handleLoadProject = async (file: File) => {
    if (
      !window.confirm(
        'Load this project file? All current palette uploads and slot assignments will be replaced.',
      )
    ) {
      return
    }

    setLoadingProject(true)
    setMessage(null)

    try {
      const result = await importProject(file)
      const migratedNote =
        result.migratedCount > 0 ? ` ${result.migratedCount} slot(s) migrated to current paths.` : ''
      const droppedNote =
        result.droppedCount > 0
          ? ` ${result.droppedCount} stale slot(s) skipped.`
          : ''

      setMessage(
        `Loaded project for ${result.farmerName}: ${result.paletteCount} palette, ${result.assignmentCount} assignment(s).${migratedNote}${droppedNote}`,
      )
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Load project failed')
    } finally {
      setLoadingProject(false)
    }
  }

  const handleClearSavedData = async () => {
    if (
      !window.confirm(
        'Clear all saved data from this browser? This removes palette uploads, assignments, and settings.',
      )
    ) {
      return
    }

    for (const entry of Object.values(palette)) {
      if (entry) revokePreviewUrl(entry.previewUrl)
    }

    await clearAllStoredData()
    window.location.reload()
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

  const projectBusy = savingProject || loadingProject

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

        <div className="export-bar__project-actions">
          <button
            type="button"
            className="btn-secondary"
            disabled={projectBusy || !hasProjectData}
            onClick={() => void handleSaveProject()}>
            {savingProject ? 'Saving…' : 'Save project'}
          </button>

          <button
            type="button"
            className="btn-secondary"
            disabled={projectBusy}
            onClick={() => projectInputRef.current?.click()}>
            {loadingProject ? 'Loading…' : 'Load project'}
          </button>

          <button
            type="button"
            className="btn-secondary export-bar__clear-data"
            disabled={projectBusy}
            onClick={() => void handleClearSavedData()}>
            Clear saved data
          </button>

          <input
            ref={projectInputRef}
            type="file"
            accept=".fpb.zip,.zip,application/zip"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleLoadProject(file)
              e.target.value = ''
            }}
          />
        </div>

        <button type="button" disabled={exporting} onClick={() => void handleExport()}>
          {exporting ? 'Exporting…' : `Export for game (${assignmentCount})`}
        </button>
      </div>

      <SettingsPanel />

      {message && <p className="export-bar__message sdv-wood-inset">{message}</p>}
    </header>
  )
}
