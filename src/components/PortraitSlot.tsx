import { useEffect, useRef, useState } from 'react'

import { useDndContext, useDroppable } from '@dnd-kit/core'

import { slotKey, isIndoorFilename } from '../lib/types'
import { isNativeFileDrag } from '../lib/nativeFileDrag'

import { parseDimensionWarning } from '../lib/validateImage'

import { CopySlotDialog } from './CopySlotDialog'
import { DimensionWarningTag } from './DimensionWarningTag'
import { usePortraitStore } from '../store/portraitStore'

interface PortraitSlotProps {
  folderPath: string

  filename: string

  onScenarioFilesDrop?: (files: File[]) => void
}

export function PortraitSlot({ folderPath, filename, onScenarioFilesDrop }: PortraitSlotProps) {
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

  const fileDragDepthRef = useRef(0)

  const [copyOpen, setCopyOpen] = useState(false)

  const [isFileDragOver, setIsFileDragOver] = useState(false)

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

  const dimensionWarning = parseDimensionWarning(assignment?.warning)

  const stopNativeFileDragBubble = (event: React.DragEvent) => {
    if (!isNativeFileDrag(event)) return
    event.stopPropagation()
  }

  const handleFileDragEnter = (event: React.DragEvent) => {
    if (!isNativeFileDrag(event)) return

    stopNativeFileDragBubble(event)
    fileDragDepthRef.current += 1
    setIsFileDragOver(true)
  }

  const handleFileDragOver = (event: React.DragEvent) => {
    if (!isNativeFileDrag(event)) return

    stopNativeFileDragBubble(event)
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleFileDragLeave = (event: React.DragEvent) => {
    if (!isNativeFileDrag(event)) return

    stopNativeFileDragBubble(event)
    fileDragDepthRef.current -= 1

    if (fileDragDepthRef.current <= 0) {
      fileDragDepthRef.current = 0
      setIsFileDragOver(false)
    }
  }

  const handleFileDrop = (event: React.DragEvent) => {
    if (!isNativeFileDrag(event)) return

    stopNativeFileDragBubble(event)
    event.preventDefault()
    fileDragDepthRef.current = 0
    setIsFileDragOver(false)

    const files = Array.from(event.dataTransfer.files)

    if (files.length === 0) return

    if (files.length > 1 && onScenarioFilesDrop) {
      onScenarioFilesDrop(files)
      return
    }

    void assignCustomFile(folderPath, filename, files[0])
  }

  return (
    <div
      ref={setNodeRef}
      className={`portrait-slot sdv-wood-inset inventory-tile ${isOver ? 'portrait-slot--over' : ''} ${isFileDragOver ? 'portrait-slot--file-over' : ''} ${assignment ? 'portrait-slot--filled' : ''} ${isDragTarget ? 'portrait-slot--drag-target' : ''}`}
      onDragEnter={handleFileDragEnter}
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}>
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

        {dimensionWarning && (
          <DimensionWarningTag
            width={dimensionWarning.width}
            height={dimensionWarning.height}
          />
        )}

        {assignment?.warning && !dimensionWarning && (
          <p className="warning">{assignment.warning}</p>
        )}
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
