import JSZip from 'jszip'

import { buildManifestSlotIndex, resolveExportPath } from './exportPaths'
import {
  collectReferencedImagePaths,
  parseAssignmentImagePath,
  parseProjectFile,
  PROJECT_JSON,
  type ProjectFileV1,
} from './projectFormat'
import type { Assignment, EmotionKey } from './types'
import { parseSlotKey, slotKey } from './types'

export interface ParsedProjectImport {
  farmerName: string
  settings: ProjectFileV1['settings']
  palette: Partial<Record<EmotionKey, { blob: Blob; warning?: string }>>
  assignments: Record<string, Assignment>
  assignmentBlobs: Map<string, Blob>
  paletteCount: number
  assignmentCount: number
  migratedCount: number
  droppedCount: number
}

async function readBlob(entry: JSZip.JSZipObject): Promise<Blob> {
  return entry.async('blob')
}

export async function parseProjectZip(file: Blob | ArrayBuffer): Promise<ParsedProjectImport> {
  const zip = await JSZip.loadAsync(file)
  const projectEntry = zip.file(PROJECT_JSON)
  if (!projectEntry) {
    throw new Error('Missing project.json in project file.')
  }

  let project: ProjectFileV1
  try {
    project = parseProjectFile(JSON.parse(await projectEntry.async('string')))
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Invalid project.json')
  }

  for (const imagePath of collectReferencedImagePaths(project)) {
    if (!zip.file(imagePath)) {
      throw new Error(`Missing image in project file: ${imagePath}`)
    }
  }

  const palette: ParsedProjectImport['palette'] = {}
  for (const [emotionKey, imagePath] of Object.entries(project.palette)) {
    if (!imagePath) continue
    const entry = zip.file(imagePath)
    if (!entry) continue

    palette[emotionKey as EmotionKey] = {
      blob: await readBlob(entry),
    }
  }

  const manifestSlots = buildManifestSlotIndex()
  const assignments: Record<string, Assignment> = {}
  const assignmentBlobs = new Map<string, Blob>()
  let migratedCount = 0
  let droppedCount = 0

  for (const [key, entry] of Object.entries(project.assignments)) {
    if (!parseAssignmentImagePath(entry.image)) {
      throw new Error(`Invalid assignment image path: ${entry.image}`)
    }

    const zipEntry = zip.file(entry.image)
    if (!zipEntry) {
      throw new Error(`Missing assignment image: ${entry.image}`)
    }

    const blob = await readBlob(zipEntry)
    const { folderPath, filename } = parseSlotKey(key)
    const resolved = resolveExportPath(folderPath, filename, manifestSlots)

    if (!resolved) {
      droppedCount++
      continue
    }

    const newKey = slotKey(resolved.folderPath, resolved.filename)
    if (newKey !== key) migratedCount++

    assignments[newKey] = {
      blobId: '',
      source: entry.source,
      emotionKey: entry.emotionKey,
      warning: entry.warning ?? undefined,
    }
    assignmentBlobs.set(newKey, blob)
  }

  return {
    farmerName: project.farmerName,
    settings: project.settings,
    palette,
    assignments,
    assignmentBlobs,
    paletteCount: Object.keys(palette).length,
    assignmentCount: Object.keys(assignments).length,
    migratedCount,
    droppedCount,
  }
}

export interface ImportProjectResult {
  farmerName: string
  paletteCount: number
  assignmentCount: number
  migratedCount: number
  droppedCount: number
}
