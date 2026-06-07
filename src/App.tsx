import { useEffect, useRef, useState } from 'react'

import {
  DndContext,
  DragOverlay,
  defaultKeyboardCoordinateGetter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'

import type { EmotionKey } from './lib/types'

import { exportPortraitZip } from './lib/exportZip'

import { AppFooter } from './components/AppFooter'
import { ExportBar } from './components/ExportBar'

import { EmotionPalette } from './components/EmotionPalette'

import { ScenarioGroup } from './components/ScenarioGroup'

import { StickyToolbar } from './components/StickyToolbar'

import {
  countVisibleAssignments,
  countVisibleSlots,
  getScenariosForGroup,
  getVisibleGroups,
  usePortraitStore,
} from './store/portraitStore'

import './styles/app.css'

export default function App() {
  const hydrate = usePortraitStore((s) => s.hydrate)

  const settings = usePortraitStore((s) => s.settings)

  const palette = usePortraitStore((s) => s.palette)

  const assignments = usePortraitStore((s) => s.assignments)

  const farmerName = usePortraitStore((s) => s.farmerName)

  const assignFromPalette = usePortraitStore((s) => s.assignFromPalette)

  const hydrated = usePortraitStore((s) => s.hydrated)

  const [activeEmotion, setActiveEmotion] = useState<EmotionKey | null>(null)

  const [isDragging, setIsDragging] = useState(false)

  const [stickyVisible, setStickyVisible] = useState(false)

  const [exporting, setExporting] = useState(false)

  const headerSentinelRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),

    useSensor(KeyboardSensor, { coordinateGetter: defaultKeyboardCoordinateGetter }),
  )

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    const sentinel = headerSentinelRef.current

    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),

      { threshold: 0 },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hydrated])

  const visibleGroups = getVisibleGroups(settings)

  const assignmentCount = Object.keys(assignments).length

  const visibleTotal = countVisibleSlots(settings)

  const visibleFilled = countVisibleAssignments(assignments, settings)

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true)

    const data = event.active.data.current

    if (data?.type === 'palette') {
      setActiveEmotion(data.emotionKey as EmotionKey)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false)

    setActiveEmotion(null)

    const { active, over } = event

    if (!over) return

    const activeData = active.data.current

    const overData = over.data.current

    if (activeData?.type === 'palette' && overData?.type === 'slot') {
      void assignFromPalette(
        activeData.emotionKey as EmotionKey,

        overData.folderPath as string,

        overData.filename as string,
      )
    }
  }

  const handleExport = async () => {
    if (assignmentCount === 0) return

    setExporting(true)

    try {
      await exportPortraitZip()
    } finally {
      setExporting(false)
    }
  }

  if (!hydrated) {
    return (
      <div className="app app--loading">
        <div className="loading-panel sdv-wood-panel">
          <span className="loading-panel__icon" aria-hidden="true">
            ...
          </span>

          <p>Rustling through the hay…</p>
        </div>
      </div>
    )
  }

  const activePreview = activeEmotion ? palette[activeEmotion]?.previewUrl : undefined

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        className={`app ${isDragging ? 'app--dragging' : ''} ${stickyVisible ? 'app--sticky-bar' : ''}`}>
        <ExportBar />

        <div ref={headerSentinelRef} className="scroll-sentinel" aria-hidden="true" />

        <StickyToolbar
          visible={stickyVisible}
          farmerName={farmerName}
          filled={visibleFilled}
          total={visibleTotal}
          assignmentCount={assignmentCount}
          exporting={exporting}
          onExport={() => void handleExport()}
        />

        <div className="app__body">
          <EmotionPalette />

          <main className="scenarios">
            <h2>Scenario Journal</h2>

            <p className="scenarios__hint">
              Drag default portraits onto slots, upload unique portraits per scenario, or use bulk
              fill.
            </p>

            {visibleGroups.map((groupKey, index) => (
              <ScenarioGroup
                key={groupKey}
                groupKey={groupKey}
                scenarios={getScenariosForGroup(groupKey)}
                defaultOpen={index < 3}
              />
            ))}
          </main>
        </div>

        <AppFooter />
      </div>

      <DragOverlay>
        {activePreview ? (
          <div className="drag-overlay">
            <img src={activePreview} alt="" width={64} height={64} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
