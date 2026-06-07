import { useEffect, useMemo, useState } from 'react'

import { slotKey } from '../lib/types'

import {
  findSimilarSeasonWeatherIndoorTargets,
  findSimilarWeatherSlotTargets,
  findSimilarWeatherSlotTargetsAllSeasons,
} from '../lib/weatherFamilies'

import { getVisibleCopyTargetGroups, usePortraitStore } from '../store/portraitStore'

interface CopySlotDialogProps {
  folderPath: string
  filename: string
  onClose: () => void
}

function mergeSelection(current: Set<string>, keys: string[], selected: boolean): Set<string> {
  const next = new Set(current)
  for (const key of keys) {
    if (selected) next.add(key)
    else next.delete(key)
  }
  return next
}

export function CopySlotDialog({ folderPath, filename, onClose }: CopySlotDialogProps) {
  const settings = usePortraitStore((s) => s.settings)
  const copyCustomAssignmentToTargets = usePortraitStore((s) => s.copyCustomAssignmentToTargets)

  const sourceKey = slotKey(folderPath, filename)
  const targetGroups = useMemo(
    () => getVisibleCopyTargetGroups(settings, sourceKey),
    [settings, sourceKey],
  )
  const targets = useMemo(
    () => targetGroups.flatMap((group) => group.sections.flatMap((section) => section.targets)),
    [targetGroups],
  )

  const similarWeatherSelection = useMemo(
    () => findSimilarWeatherSlotTargets(folderPath, filename, targets),
    [folderPath, filename, targets],
  )

  const similarWeatherAllSeasonsSelection = useMemo(
    () => findSimilarWeatherSlotTargetsAllSeasons(folderPath, filename, targets),
    [folderPath, filename, targets],
  )

  const similarIndoorSelection = useMemo(
    () => findSimilarSeasonWeatherIndoorTargets(folderPath, filename, targets),
    [folderPath, filename, targets],
  )

  const similarWeatherKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const selection of [
      similarWeatherSelection,
      similarWeatherAllSeasonsSelection,
      similarIndoorSelection,
    ]) {
      for (const target of selection?.targets ?? []) {
        keys.add(target.key)
      }
    }
    return keys
  }, [similarWeatherSelection, similarWeatherAllSeasonsSelection, similarIndoorSelection])

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const selectedCount = selectedKeys.size

  const toggleKey = (key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectKeys = (keys: string[]) => {
    setSelectedKeys((current) => mergeSelection(current, keys, true))
  }

  const clearKeys = (keys: string[]) => {
    setSelectedKeys((current) => mergeSelection(current, keys, false))
  }

  const selectAll = () => {
    setSelectedKeys(new Set(targets.map((target) => target.key)))
  }

  const clearSelection = () => {
    setSelectedKeys(new Set())
  }

  const handleCopy = async () => {
    const selectedTargets = targets.filter((target) => selectedKeys.has(target.key))
    if (selectedTargets.length === 0) return

    setCopying(true)
    setError(null)

    const copied = await copyCustomAssignmentToTargets(
      folderPath,
      filename,
      selectedTargets.map((target) => ({
        folderPath: target.folderPath,
        filename: target.filename,
      })),
    )

    setCopying(false)

    if (copied > 0) {
      onClose()
      return
    }

    setError('Could not copy portrait. Try uploading again.')
  }

  const copyLabel =
    selectedCount === 0
      ? 'Copy'
      : selectedCount === 1
        ? 'Copy to 1 slot'
        : `Copy to ${selectedCount} slots`

  return (
    <div className="copy-slot-dialog" role="presentation" onClick={onClose}>
      <div
        className="copy-slot-dialog__panel sdv-wood-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="copy-slot-dialog-title"
        onClick={(event) => event.stopPropagation()}>
        <h3 id="copy-slot-dialog-title" className="copy-slot-dialog__title">
          Copy custom portrait
        </h3>

        <p className="copy-slot-dialog__source">
          From <code>{filename}</code>
          {folderPath ? (
            <>
              {' '}
              in <code>{folderPath}</code>
            </>
          ) : null}
        </p>

        {targets.length === 0 ? (
          <p className="copy-slot-dialog__empty">No other visible slots to copy to.</p>
        ) : (
          <div className="copy-slot-dialog__field">
            {(similarWeatherSelection ||
              similarWeatherAllSeasonsSelection ||
              similarIndoorSelection) && (
              <div className="copy-slot-dialog__presets">
                {similarWeatherSelection && (
                  <button
                    type="button"
                    className="btn-secondary copy-slot-dialog__preset"
                    disabled={copying}
                    onClick={() =>
                      selectKeys(similarWeatherSelection.targets.map((target) => target.key))
                    }>
                    Select similar {similarWeatherSelection.season}{' '}
                    {similarWeatherSelection.familyLabel} weathers (
                    {similarWeatherSelection.targets.length})
                  </button>
                )}

                {similarWeatherAllSeasonsSelection && (
                  <button
                    type="button"
                    className="btn-secondary copy-slot-dialog__preset"
                    disabled={copying}
                    onClick={() =>
                      selectKeys(
                        similarWeatherAllSeasonsSelection.targets.map((target) => target.key),
                      )
                    }>
                    Select similar {similarWeatherAllSeasonsSelection.familyLabel} weathers, all
                    seasons ({similarWeatherAllSeasonsSelection.targets.length})
                  </button>
                )}

                {similarIndoorSelection && (
                  <button
                    type="button"
                    className="btn-secondary copy-slot-dialog__preset"
                    disabled={copying}
                    onClick={() =>
                      selectKeys(similarIndoorSelection.targets.map((target) => target.key))
                    }>
                    Select similar {similarIndoorSelection.season}{' '}
                    {similarIndoorSelection.familyLabel} indoor slots (
                    {similarIndoorSelection.targets.length})
                  </button>
                )}

                <p className="copy-slot-dialog__preset-hint">
                  Weather presets match across Seasons &amp; Weather, Weather Wonders, and Danger
                  Weather when those groups are enabled.
                  {similarIndoorSelection ? (
                    <>
                      {' '}
                      Indoor preset targets <code>{similarIndoorSelection.targetFilename}</code>.
                    </>
                  ) : null}
                </p>
              </div>
            )}

            <div className="copy-slot-dialog__field-header">
              <span>Copy to</span>
              <div className="copy-slot-dialog__selection-actions">
                <button type="button" className="btn-link" onClick={selectAll} disabled={copying}>
                  Select all
                </button>
                <button
                  type="button"
                  className="btn-link"
                  onClick={clearSelection}
                  disabled={copying || selectedCount === 0}>
                  Clear
                </button>
              </div>
            </div>

            <div className="copy-slot-dialog__targets">
              {targetGroups.map((group) => (
                <section key={group.groupKey} className="copy-slot-dialog__category">
                  <h4 className="copy-slot-dialog__category-title">{group.groupLabel}</h4>

                  {group.sections.map((section) => {
                    const sectionKeys = section.targets.map((target) => target.key)
                    const sectionSelectedCount = sectionKeys.filter((key) =>
                      selectedKeys.has(key),
                    ).length

                    return (
                      <fieldset key={section.scenarioId} className="copy-slot-dialog__section">
                        <legend className="copy-slot-dialog__section-header">
                          <span className="copy-slot-dialog__section-title">
                            {section.scenarioLabel}
                            <span className="copy-slot-dialog__section-count">
                              {sectionSelectedCount}/{sectionKeys.length}
                            </span>
                          </span>
                          <span className="copy-slot-dialog__selection-actions">
                            <button
                              type="button"
                              className="btn-link"
                              disabled={copying || sectionSelectedCount === sectionKeys.length}
                              onClick={() => selectKeys(sectionKeys)}>
                              All
                            </button>
                            <button
                              type="button"
                              className="btn-link"
                              disabled={copying || sectionSelectedCount === 0}
                              onClick={() => clearKeys(sectionKeys)}>
                              None
                            </button>
                          </span>
                        </legend>

                        {section.targets.map((target) => (
                          <label
                            key={target.key}
                            className={`copy-slot-dialog__option${similarWeatherKeys.has(target.key) ? ' copy-slot-dialog__option--similar' : ''}`}>
                            <input
                              type="checkbox"
                              checked={selectedKeys.has(target.key)}
                              disabled={copying}
                              onChange={() => toggleKey(target.key)}
                            />
                            <code>{target.filename}</code>
                          </label>
                        ))}
                      </fieldset>
                    )
                  })}
                </section>
              ))}
            </div>
          </div>
        )}

        {error && <p className="copy-slot-dialog__error">{error}</p>}

        <div className="copy-slot-dialog__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={copying}>
            Cancel
          </button>

          <button
            type="button"
            disabled={copying || selectedCount === 0}
            onClick={() => void handleCopy()}>
            {copying ? 'Copying…' : copyLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
