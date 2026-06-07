interface StickyToolbarProps {
  visible: boolean
  farmerName: string
  filled: number
  total: number
  assignmentCount: number
  exporting: boolean
  onExport: () => void
}

export function StickyToolbar({
  visible,
  farmerName,
  filled,
  total,
  assignmentCount,
  exporting,
  onExport,
}: StickyToolbarProps) {
  return (
    <div className={`sticky-toolbar sdv-wood-panel ${visible ? 'sticky-toolbar--visible' : ''}`}>
      <span className="sticky-toolbar__name">{farmerName || 'Player 1'}</span>
      <span className="sticky-toolbar__progress">
        {filled}/{total}
      </span>
      <button type="button" disabled={exporting || assignmentCount === 0} onClick={onExport}>
        {exporting ? 'Exporting…' : `Export (${assignmentCount})`}
      </button>
    </div>
  )
}
