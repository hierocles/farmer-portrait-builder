import { useDraggable } from '@dnd-kit/core'

import { CSS } from '@dnd-kit/utilities'

import type { EmotionKey } from '../lib/types'

interface DraggableEmotionChipProps {
  emotionKey: EmotionKey

  label: string

  previewUrl?: string

  disabled?: boolean
}

export function DraggableEmotionChip({
  emotionKey,

  label,

  previewUrl,

  disabled,
}: DraggableEmotionChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${emotionKey}`,

    data: { type: 'palette', emotionKey },

    disabled: disabled || !previewUrl,
  })

  const style = {
    transform: CSS.Translate.toString(transform),

    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`emotion-chip sdv-wood-inset ${disabled || !previewUrl ? 'emotion-chip--disabled' : ''}`}
      {...listeners}
      {...attributes}
      title={previewUrl ? `Drag ${label} to a scenario slot` : `Upload ${label} first`}>
      <div className="emotion-chip__preview">
        {previewUrl ? (
          <img src={previewUrl} alt={label} width={48} height={48} />
        ) : (
          <span className="emotion-chip__placeholder">?</span>
        )}
      </div>

      <span className="emotion-chip__label">{label}</span>
    </div>
  )
}
