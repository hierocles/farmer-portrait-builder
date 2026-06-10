import { useRef } from 'react'

import { CORE_EMOTIONS, EXTENDED_EMOTIONS } from '../lib/types'
import { parseDimensionWarning } from '../lib/validateImage'

import { usePortraitStore } from '../store/portraitStore'

import { DimensionWarningTag } from './DimensionWarningTag'
import { DraggableEmotionChip } from './DraggableEmotionChip'

export function EmotionPalette() {
  const palette = usePortraitStore((s) => s.palette)

  const settings = usePortraitStore((s) => s.settings)

  const uploadPaletteEmotion = usePortraitStore((s) => s.uploadPaletteEmotion)

  const clearPaletteEmotion = usePortraitStore((s) => s.clearPaletteEmotion)

  const emotions = [...CORE_EMOTIONS, ...(settings.extendedEmotions ? EXTENDED_EMOTIONS : [])]

  return (
    <aside className="palette sdv-wood-panel">
      <h2>Default Portraits</h2>

      <p className="palette__hint">
        Upload base emotion portraits below and drag them to the scenario slots.
      </p>

      <h3>Drag to assign</h3>

      <div className="palette__chips">
        {emotions.map((emotion) => (
          <DraggableEmotionChip
            key={emotion.key}
            emotionKey={emotion.key}
            label={emotion.label}
            previewUrl={palette[emotion.key]?.previewUrl}
          />
        ))}
      </div>

      <div className="palette__uploads">
        {emotions.map((emotion) => (
          <PaletteUploadRow
            key={emotion.key}
            label={emotion.label}
            baseFilename={emotion.baseFilename}
            entry={palette[emotion.key]}
            onUpload={(file) => uploadPaletteEmotion(emotion.key, file)}
            onClear={() => clearPaletteEmotion(emotion.key)}
          />
        ))}
      </div>
    </aside>
  )
}

interface PaletteUploadRowProps {
  label: string

  baseFilename: string

  entry?: { previewUrl: string; warning?: string }

  onUpload: (file: File) => void

  onClear: () => void
}

function PaletteUploadRow({
  label,

  baseFilename,

  entry,

  onUpload,

  onClear,
}: PaletteUploadRowProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const dimensionWarning = parseDimensionWarning(entry?.warning)

  return (
    <div className="palette-upload sdv-wood-inset">
      <div className="palette-upload__info">
        <strong>{label}</strong>

        <code>{baseFilename}</code>
      </div>

      <div className="upload-clear-actions">
        {entry?.previewUrl && (
          <img
            className="palette-upload__thumb"
            src={entry.previewUrl}
            alt={label}
            width={32}
            height={32}
          />
        )}

        <button type="button" onClick={() => inputRef.current?.click()}>
          Upload
        </button>

        {entry && (
          <button type="button" className="btn-secondary" onClick={onClear}>
            Clear
          </button>
        )}

        {dimensionWarning && (
          <DimensionWarningTag
            width={dimensionWarning.width}
            height={dimensionWarning.height}
          />
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]

            if (file) onUpload(file)

            e.target.value = ''
          }}
        />
      </div>

      {entry?.warning && !dimensionWarning && <p className="warning">{entry.warning}</p>}
    </div>
  )
}
