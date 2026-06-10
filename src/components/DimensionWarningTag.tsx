import { useEffect, useId, useState } from 'react'

import { getDimensionWarningMessage } from '../lib/validateImage'

interface DimensionWarningTagProps {
  width: number
  height: number
}

export function DimensionWarningTag({ width, height }: DimensionWarningTagProps) {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const summary = getDimensionWarningMessage(width, height)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="badge badge--dimension-warning"
        aria-label={`Portrait size warning: ${summary}`}
        onClick={() => setOpen(true)}>
        !
      </button>

      {open && (
        <div
          className="dimension-warning-dialog"
          role="presentation"
          onClick={() => setOpen(false)}>
          <div
            className="dimension-warning-dialog__panel sdv-wood-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}>
            <h3 id={titleId} className="dimension-warning-dialog__title">
              Portrait size warning
            </h3>

            <p className="dimension-warning-dialog__message">
              This portrait is {width}×{height} pixels. Portraits that aren&apos;t 64×64 may cause
              problems in-game. 64×64 is recommended.
            </p>

            <p className="dimension-warning-dialog__hint">
              You can enable <strong>Resize to 64×64 on export</strong> in Settings to convert
              portraits to 64×64 automatically when you export your mod.
            </p>

            <div className="dimension-warning-dialog__actions">
              <button type="button" onClick={() => setOpen(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
