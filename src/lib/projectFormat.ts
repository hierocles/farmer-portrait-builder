import { normalizeFolderPath } from './exportPaths'
import type { AppSettings, AssignmentSource, EmotionKey } from './types'
import { parseSlotKey, slotKey } from './types'

export const PROJECT_FORMAT_VERSION = 1
export const PROJECT_JSON = 'project.json'
export const APP_VERSION = '1.0.0'

const EMOTION_KEYS: EmotionKey[] = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'blush',
  'scared',
  'surprised',
  'disgust',
  'awkward',
]

export interface ProjectAssignmentEntry {
  source: AssignmentSource
  emotionKey?: EmotionKey
  warning?: string | null
  image: string
}

export interface ProjectFileV1 {
  formatVersion: typeof PROJECT_FORMAT_VERSION
  exportedAt: string
  appVersion: string
  farmerName: string
  settings: AppSettings
  palette: Partial<Record<EmotionKey, string>>
  assignments: Record<string, ProjectAssignmentEntry>
}

export function buildPaletteImagePath(emotionKey: EmotionKey): string {
  return `palette/${emotionKey}.png`
}

export function buildAssignmentImagePath(folderPath: string, filename: string): string {
  const normalizedFolder = normalizeFolderPath(folderPath)
  if (!normalizedFolder) {
    return `assignments/_base/${filename}`
  }
  return `assignments/${normalizedFolder}${filename}`
}

export function parseAssignmentImagePath(
  imagePath: string,
): { folderPath: string; filename: string } | null {
  if (imagePath.startsWith('assignments/_base/')) {
    return {
      folderPath: '',
      filename: imagePath.slice('assignments/_base/'.length),
    }
  }

  const prefix = 'assignments/'
  if (!imagePath.startsWith(prefix)) return null

  const rest = imagePath.slice(prefix.length)
  const slashIndex = rest.lastIndexOf('/')
  if (slashIndex === -1) return null

  return {
    folderPath: rest.slice(0, slashIndex + 1),
    filename: rest.slice(slashIndex + 1),
  }
}

export function sanitizeProjectBasename(farmerName: string): string {
  const trimmed = farmerName.trim() || 'Player 1'
  const sanitized = trimmed.replace(/[^\w -]/g, '').trim()
  return sanitized || 'Player 1'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEmotionKey(value: unknown): value is EmotionKey {
  return typeof value === 'string' && EMOTION_KEYS.includes(value as EmotionKey)
}

function isAssignmentSource(value: unknown): value is AssignmentSource {
  return value === 'palette' || value === 'custom'
}

function isAppSettings(value: unknown): value is AppSettings {
  if (!isRecord(value)) return false
  return (
    typeof value.extendedEmotions === 'boolean' &&
    typeof value.indoorVariants === 'boolean' &&
    typeof value.resizeOnExport === 'boolean' &&
    isRecord(value.enabledAdvancedGroups)
  )
}

function parseAssignmentEntry(value: unknown): ProjectAssignmentEntry | null {
  if (!isRecord(value)) return null
  if (!isAssignmentSource(value.source)) return null
  if (typeof value.image !== 'string' || !value.image) return null
  if (value.emotionKey != null && !isEmotionKey(value.emotionKey)) return null
  if (value.warning != null && typeof value.warning !== 'string') return null

  return {
    source: value.source,
    emotionKey: value.emotionKey as EmotionKey | undefined,
    warning: value.warning ?? null,
    image: value.image,
  }
}

export function parseProjectFile(raw: unknown): ProjectFileV1 {
  if (!isRecord(raw)) {
    throw new Error('Project file must be a JSON object.')
  }

  if (raw.formatVersion !== PROJECT_FORMAT_VERSION) {
    throw new Error(`Unsupported project format version: ${String(raw.formatVersion)}`)
  }

  if (typeof raw.exportedAt !== 'string' || typeof raw.appVersion !== 'string') {
    throw new Error('Project file is missing export metadata.')
  }

  if (typeof raw.farmerName !== 'string') {
    throw new Error('Project file is missing farmer name.')
  }

  if (!isAppSettings(raw.settings)) {
    throw new Error('Project file has invalid settings.')
  }

  const palette: Partial<Record<EmotionKey, string>> = {}
  if (raw.palette != null) {
    if (!isRecord(raw.palette)) throw new Error('Project palette must be an object.')
    for (const [key, imagePath] of Object.entries(raw.palette)) {
      if (!isEmotionKey(key)) throw new Error(`Unknown palette emotion: ${key}`)
      if (typeof imagePath !== 'string' || !imagePath) {
        throw new Error(`Invalid palette image path for ${key}.`)
      }
      palette[key] = imagePath
    }
  }

  const assignments: Record<string, ProjectAssignmentEntry> = {}
  if (raw.assignments != null) {
    if (!isRecord(raw.assignments)) throw new Error('Project assignments must be an object.')
    for (const [key, entry] of Object.entries(raw.assignments)) {
      parseSlotKey(key)
      const parsedEntry = parseAssignmentEntry(entry)
      if (!parsedEntry) throw new Error(`Invalid assignment entry for ${key}.`)
      assignments[key] = parsedEntry
    }
  }

  return {
    formatVersion: PROJECT_FORMAT_VERSION,
    exportedAt: raw.exportedAt,
    appVersion: raw.appVersion,
    farmerName: raw.farmerName,
    settings: raw.settings,
    palette,
    assignments,
  }
}

export function collectReferencedImagePaths(project: ProjectFileV1): string[] {
  const paths = new Set<string>()
  for (const imagePath of Object.values(project.palette)) {
    if (imagePath) paths.add(imagePath)
  }
  for (const entry of Object.values(project.assignments)) {
    paths.add(entry.image)
  }
  return [...paths]
}

export function slotKeyFromAssignmentImage(imagePath: string): string {
  const parsed = parseAssignmentImagePath(imagePath)
  if (!parsed) throw new Error(`Invalid assignment image path: ${imagePath}`)
  return slotKey(parsed.folderPath, parsed.filename)
}
