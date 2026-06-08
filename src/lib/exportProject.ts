import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { get as idbGet } from 'idb-keyval'

import type { EmotionKey } from './types'
import { parseSlotKey } from './types'
import {
  APP_VERSION,
  PROJECT_FORMAT_VERSION,
  PROJECT_JSON,
  buildAssignmentImagePath,
  buildPaletteImagePath,
  sanitizeProjectBasename,
  type ProjectFileV1,
} from './projectFormat'
import { usePortraitStore } from '../store/portraitStore'

export interface ExportProjectResult {
  farmerName: string
  paletteCount: number
  assignmentCount: number
  filename: string
}

export async function exportProjectZip(): Promise<ExportProjectResult> {
  const { farmerName, settings, palette, assignments } = usePortraitStore.getState()
  const safeName = sanitizeProjectBasename(farmerName)

  const projectPalette: Partial<Record<EmotionKey, string>> = {}
  const projectAssignments: ProjectFileV1['assignments'] = {}

  const zip = new JSZip()

  for (const [emotionKey, entry] of Object.entries(palette)) {
    if (!entry) continue
    const blob = await idbGet<Blob>(entry.blobId)
    if (!blob) continue

    const imagePath = buildPaletteImagePath(emotionKey as EmotionKey)
    projectPalette[emotionKey as EmotionKey] = imagePath
    zip.file(imagePath, blob)
  }

  for (const [key, assignment] of Object.entries(assignments)) {
    const blob = await idbGet<Blob>(assignment.blobId)
    if (!blob) continue

    const { folderPath, filename } = parseSlotKey(key)

    const imagePath = buildAssignmentImagePath(folderPath, filename)
    projectAssignments[key] = {
      source: assignment.source,
      emotionKey: assignment.emotionKey,
      warning: assignment.warning ?? null,
      image: imagePath,
    }
    zip.file(imagePath, blob)
  }

  const paletteCount = Object.keys(projectPalette).length
  const assignmentCount = Object.keys(projectAssignments).length

  if (paletteCount === 0 && assignmentCount === 0) {
    throw new Error('Nothing to save — upload palette portraits or assign scenario slots first.')
  }

  const project: ProjectFileV1 = {
    formatVersion: PROJECT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    farmerName: farmerName.trim() || 'Player 1',
    settings,
    palette: projectPalette,
    assignments: projectAssignments,
  }

  zip.file(PROJECT_JSON, JSON.stringify(project, null, 2))

  const filename = `${safeName}-project.fpb.zip`
  const content = await zip.generateAsync({ type: 'blob' })
  saveAs(content, filename)

  return { farmerName: safeName, paletteCount, assignmentCount, filename }
}
