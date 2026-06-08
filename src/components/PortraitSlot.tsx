import { useEffect, useRef, useState } from 'react'

import { useDndContext, useDroppable } from '@dnd-kit/core'

import { slotKey, isIndoorFilename } from '../lib/types'

import { CopySlotDialog } from './CopySlotDialog'
import { usePortraitStore } from '../store/portraitStore'

interface PortraitSlotProps {
  folderPath: string

  filename: string
}

export function PortraitSlot({ folderPath, filename }: PortraitSlotProps) {
  const key = slotKey(folderPath, filename)

  const assignment = usePortraitStore((s) => s.assignments[key])

  const clearAssignment = usePortraitStore((s) => s.clearAssignment)

  const assignCustomFile = usePortraitStore((s) => s.assignCustomFile)

  const getAssignmentPreview = usePortraitStore((s) => s.getAssignmentPreview)

  const [loadedPreview, setLoadedPreview] = useState<{ key: string; url?: string }>({
    key: '',
    url: undefined,
  })

  const inputRef = useRef<HTMLInputElement>(null)

  const [copyOpen, setCopyOpen] = useState(false)

  const { active } = useDndContext()

  const { isOver, setNodeRef } = useDroppable({
    id: key,

    data: { type: 'slot', folderPath, filename },
  })

  const isPaletteDrag = active?.data.current?.type === 'palette'

  const isDragTarget = isPaletteDrag && !assignment

  const previewUrl = assignment && loadedPreview.key === key ? loadedPreview.url : undefined

  useEffect(() => {
    if (!assignment) return

    let activeEffect = true

    void getAssignmentPreview(key).then((url) => {
      if (activeEffect) setLoadedPreview({ key, url })
    })

    return () => {
      activeEffect = false
    }
  }, [assignment, getAssignmentPreview, key])

  const indoor = isIndoorFilename(filename)

  return (
    <div
      ref={setNodeRef}
      className={`portrait-slot sdv-wood-inset inventory-tile ${isOver ? 'portrait-slot--over' : ''} ${assignment ? 'portrait-slot--filled' : ''} ${isDragTarget ? 'portrait-slot--drag-target' : ''}`}>
      <div className="portrait-slot__filename-row inventory-tile__filename-row">
        <code className="portrait-slot__filename">{filename}</code>
      </div>

      <div className="portrait-slot__tags-row inventory-tile__tags-row">
        {indoor && <span className="badge badge--indoor">indoor</span>}

        {assignment && (
          <span className={`badge badge--${assignment.source}`}>
            {assignment.source === 'palette' ? 'default' : 'custom'}
          </span>
        )}

        {assignment?.warning && <p className="warning">{assignment.warning}</p>}
      </div>

      <div className="portrait-slot__thumb-row inventory-tile__thumb-row">
        <div className="portrait-slot__preview">
          {previewUrl ? (
            <img src={previewUrl} alt={filename} width={64} height={64} />
          ) : (
            <span className="portrait-slot__empty">Drop or upload</span>
          )}
        </div>
      </div>

      <div className="portrait-slot__actions upload-clear-actions">
        <button type="button" onClick={() => inputRef.current?.click()}>
          Upload
        </button>

        {assignment && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setCopyOpen(true)}>
            Copy
          </button>
        )}

        {assignment && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => clearAssignment(folderPath, filename)}>
            Clear
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]

            if (file) void assignCustomFile(folderPath, filename, file)

            e.target.value = ''
          }}
        />
      </div>

      {copyOpen && (
        <CopySlotDialog
          folderPath={folderPath}
          filename={filename}
          onClose={() => setCopyOpen(false)}
        />
      )}
    </div>
  )
}
