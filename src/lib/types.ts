export type EmotionKey =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'blush'
  | 'scared'
  | 'surprised'
  | 'disgust'
  | 'awkward'

export type ScenarioGroupKey =
  | 'base'
  | 'seasonWeather'
  | 'festivals'
  | 'mining'
  | 'farming'
  | 'pajamas'
  | 'swimsuit'
  | 'island'
  | 'desert'
  | 'lumberjack'
  | 'gardening'
  | 'stargazing'
  | 'dangerWeather'
  | 'weatherWonders'
  | 'other'

export interface Scenario {
  id: string
  label: string
  folderPath: string
  files: string[]
  group: ScenarioGroupKey
  hasIndoor: boolean
  hasExtended: boolean
}

export interface ScenarioManifest {
  generatedAt: string
  groups: Record<ScenarioGroupKey, Scenario[]>
  groupLabels: Record<ScenarioGroupKey, string>
  coreGroups: ScenarioGroupKey[]
  advancedGroups: ScenarioGroupKey[]
}

export type AssignmentSource = 'palette' | 'custom'

export interface Assignment {
  blobId: string
  source: AssignmentSource
  emotionKey?: EmotionKey
  warning?: string
}

export interface PaletteEntry {
  blobId: string
  previewUrl: string
  warning?: string
}

export interface AppSettings {
  extendedEmotions: boolean
  indoorVariants: boolean
  resizeOnExport: boolean
  enabledAdvancedGroups: Record<string, boolean>
}

export interface StoredBlob {
  blob: Blob
  previewUrl?: string
}

export const CORE_EMOTIONS: { key: EmotionKey; label: string; baseFilename: string }[] = [
  { key: 'neutral', label: 'Neutral', baseFilename: 'portrait.png' },
  { key: 'happy', label: 'Happy', baseFilename: 'portrait_happy.png' },
  { key: 'sad', label: 'Sad', baseFilename: 'portrait_sad.png' },
  { key: 'angry', label: 'Angry', baseFilename: 'portrait_angry.png' },
  { key: 'blush', label: 'Blush', baseFilename: 'portrait_blush.png' },
]

export const EXTENDED_EMOTIONS: { key: EmotionKey; label: string; baseFilename: string }[] = [
  { key: 'scared', label: 'Scared', baseFilename: 'portrait_scared.png' },
  { key: 'surprised', label: 'Surprised', baseFilename: 'portrait_surprised.png' },
  { key: 'disgust', label: 'Disgust', baseFilename: 'portrait_disgust.png' },
  { key: 'awkward', label: 'Awkward', baseFilename: 'portrait_awkward.png' },
]

export function slotKey(folderPath: string, filename: string): string {
  return `${folderPath}::${filename}`
}

export function parseSlotKey(key: string): { folderPath: string; filename: string } {
  const idx = key.indexOf('::')
  return {
    folderPath: key.slice(0, idx),
    filename: key.slice(idx + 2),
  }
}

export function isIndoorFilename(filename: string): boolean {
  return filename.toLowerCase().includes('_indoors')
}

export function emotionFromFilename(filename: string): EmotionKey | null {
  const lower = filename.toLowerCase()
  if (lower === 'portrait.png' || lower === 'portrait_indoors.png') return 'neutral'
  const match = lower.match(
    /^portrait_(happy|sad|angry|blush|scared|surprised|surprise|disgust|awkward|surpirsed)(_indoors)?\.png$/,
  )
  if (!match) return null
  const raw = match[1]
  if (raw === 'surprise' || raw === 'surprised' || raw === 'surpirsed') return 'surprised'
  return raw as EmotionKey
}

export function resolveFilenameForEmotion(
  emotionKey: EmotionKey,
  availableFiles: string[],
  indoor: boolean,
): string | null {
  const candidates: string[] = []

  for (const file of availableFiles) {
    const fileIndoor = isIndoorFilename(file)
    if (indoor !== fileIndoor) continue
    if (emotionFromFilename(file) === emotionKey) {
      candidates.push(file)
    }
  }

  if (candidates.length === 0) return null
  // Prefer exact-case match from example files (e.g. portrait_Indoors.png)
  return candidates.sort((a, b) => a.localeCompare(b))[0]
}

export function filterVisibleFiles(files: string[], settings: AppSettings): string[] {
  return files.filter((file) => {
    const indoor = isIndoorFilename(file)
    if (indoor && !settings.indoorVariants) return false
    const emotion = emotionFromFilename(file)
    if (!emotion) return true
    if (CORE_EMOTIONS.some((e) => e.key === emotion)) return true
    return settings.extendedEmotions
  })
}

const EMOTION_FILE_ORDER: EmotionKey[] = [
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

/** Indoor filename for extended emotions (mod uses surpirsed typo for surprised). */
export function extendedIndoorFilename(emotionKey: EmotionKey, baseFilename: string): string {
  if (emotionKey === 'surprised') return 'portrait_surpirsed_indoors.png'
  return baseFilename.replace(/\.png$/i, '_indoors.png')
}

export function scenarioSupportsIndoor(scenario: Scenario): boolean {
  return scenario.hasIndoor || scenario.files.some(isIndoorFilename)
}

export function sortScenarioFiles(files: string[]): string[] {
  const orderIndex = (emotion: EmotionKey | null): number => {
    if (!emotion) return 999
    const idx = EMOTION_FILE_ORDER.indexOf(emotion)
    return idx === -1 ? 998 : idx
  }

  return [...files].sort((a, b) => {
    const orderDiff = orderIndex(emotionFromFilename(a)) - orderIndex(emotionFromFilename(b))
    if (orderDiff !== 0) return orderDiff
    const indoorDiff = Number(isIndoorFilename(a)) - Number(isIndoorFilename(b))
    if (indoorDiff !== 0) return indoorDiff
    return a.localeCompare(b)
  })
}

/** Manifest files plus synthetic extended-emotion slots when the setting is enabled. */
export function getScenarioVisibleFiles(scenario: Scenario, settings: AppSettings): string[] {
  const files = new Set(filterVisibleFiles(scenario.files, settings))

  if (settings.extendedEmotions) {
    const supportsIndoor = scenarioSupportsIndoor(scenario)
    for (const emotion of EXTENDED_EMOTIONS) {
      files.add(emotion.baseFilename)
      if (settings.indoorVariants && supportsIndoor) {
        files.add(extendedIndoorFilename(emotion.key, emotion.baseFilename))
      }
    }
  }

  return sortScenarioFiles([...files])
}
