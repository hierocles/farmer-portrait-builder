import { get as idbGet, set, del, keys } from 'idb-keyval'
import { create } from 'zustand'
import type {
  AppSettings,
  Assignment,
  EmotionKey,
  PaletteEntry,
  Scenario,
  ScenarioGroupKey,
} from '../lib/types'
import {
  CORE_EMOTIONS,
  EXTENDED_EMOTIONS,
  emotionFromFilename,
  getScenarioVisibleFiles,
  resolveFilenameForEmotion,
  slotKey,
} from '../lib/types'
import { migrateAssignmentKeys } from '../lib/exportPaths'
import { parseProjectZip, type ImportProjectResult } from '../lib/importProject'
import {
  matchFilesToScenarioSlots,
  unmatchedDroppedFilenames,
} from '../lib/matchDroppedFiles'
import {
  createPreviewUrl,
  revokePreviewUrl,
  resizeTo64,
  validatePngFile,
} from '../lib/validateImage'
import manifest from '../data/scenarioManifest.json'
import type { ScenarioManifest } from '../lib/types'

const STORAGE_KEY = 'farmer-portrait-builder-state-v1'
const BLOB_PREFIX = 'blob:'

const scenarioManifest = manifest as ScenarioManifest

const defaultAdvancedGroups = Object.fromEntries(
  scenarioManifest.advancedGroups.map((g) => [g, false]),
)

interface PersistedState {
  farmerName: string
  settings: AppSettings
  paletteBlobIds: Partial<Record<EmotionKey, string>>
  assignments: Record<string, Assignment>
}

interface PortraitState {
  hydrated: boolean
  farmerName: string
  settings: AppSettings
  palette: Partial<Record<EmotionKey, PaletteEntry>>
  assignments: Record<string, Assignment>
  blobCache: Map<string, string>

  hydrate: () => Promise<void>
  setFarmerName: (name: string) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  toggleAdvancedGroup: (group: string) => void
  uploadPaletteEmotion: (emotionKey: EmotionKey, file: File) => Promise<void>
  clearPaletteEmotion: (emotionKey: EmotionKey) => void
  assignFromPalette: (emotionKey: EmotionKey, folderPath: string, filename: string) => Promise<void>
  assignCustomFile: (folderPath: string, filename: string, file: File) => Promise<void>
  assignCustomFilesToScenario: (
    scenario: Scenario,
    files: File[],
  ) => Promise<{ assigned: number; unmatched: string[] }>
  copyCustomAssignment: (
    fromFolderPath: string,
    fromFilename: string,
    toFolderPath: string,
    toFilename: string,
  ) => Promise<boolean>
  copyCustomAssignmentToTargets: (
    fromFolderPath: string,
    fromFilename: string,
    targets: { folderPath: string; filename: string }[],
  ) => Promise<number>
  clearAssignment: (folderPath: string, filename: string) => void
  clearAssignmentsForScenarios: (scenarios: Scenario[]) => number
  clearAllAssignments: () => number
  applyDefaultsToScenarios: (scenarios: Scenario[]) => Promise<number>
  importProject: (file: File) => Promise<ImportProjectResult>
  getBlob: (blobId: string) => Promise<Blob | undefined>
  getAssignmentPreview: (key: string) => Promise<string | undefined>
}

async function storeBlob(blob: Blob): Promise<string> {
  const blobId = `${BLOB_PREFIX}${crypto.randomUUID()}`
  await set(blobId, blob)
  return blobId
}

async function removeBlob(blobId: string): Promise<void> {
  await del(blobId)
}

async function loadPersisted(): Promise<PersistedState | null> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  return JSON.parse(raw) as PersistedState
}

async function savePersisted(state: PortraitState): Promise<void> {
  const paletteBlobIds: Partial<Record<EmotionKey, string>> = {}
  for (const [key, entry] of Object.entries(state.palette)) {
    if (entry) paletteBlobIds[key as EmotionKey] = entry.blobId
  }

  const persisted: PersistedState = {
    farmerName: state.farmerName,
    settings: state.settings,
    paletteBlobIds,
    assignments: state.assignments,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
}

export const usePortraitStore = create<PortraitState>((set, get) => ({
  hydrated: false,
  farmerName: 'Player 1',
  settings: {
    extendedEmotions: false,
    indoorVariants: false,
    resizeOnExport: false,
    enabledAdvancedGroups: defaultAdvancedGroups,
  },
  palette: {},
  assignments: {},
  blobCache: new Map(),

  hydrate: async () => {
    const persisted = await loadPersisted()
    if (!persisted) {
      set({ hydrated: true })
      return
    }

    const palette: Partial<Record<EmotionKey, PaletteEntry>> = {}
    for (const [emotionKey, blobId] of Object.entries(persisted.paletteBlobIds)) {
      const blob = await idbGet<Blob>(blobId)
      if (blob) {
        palette[emotionKey as EmotionKey] = {
          blobId,
          previewUrl: createPreviewUrl(blob),
        }
      }
    }

    const { assignments, migratedCount, droppedCount } = migrateAssignmentKeys(
      persisted.assignments,
    )

    set({
      hydrated: true,
      farmerName: persisted.farmerName,
      settings: persisted.settings,
      palette,
      assignments,
    })

    if (migratedCount > 0 || droppedCount > 0) {
      void savePersisted(get())
    }
  },

  setFarmerName: (name) => {
    set({ farmerName: name })
    void savePersisted(get())
  },

  updateSettings: (partial) => {
    set((state) => ({ settings: { ...state.settings, ...partial } }))
    void savePersisted(get())
  },

  toggleAdvancedGroup: (group) => {
    set((state) => ({
      settings: {
        ...state.settings,
        enabledAdvancedGroups: {
          ...state.settings.enabledAdvancedGroups,
          [group]: !state.settings.enabledAdvancedGroups[group],
        },
      },
    }))
    void savePersisted(get())
  },

  uploadPaletteEmotion: async (emotionKey, file) => {
    const validation = await validatePngFile(file)
    const blob = file
    const blobId = await storeBlob(blob)

    set((state) => {
      const existing = state.palette[emotionKey]
      if (existing) revokePreviewUrl(existing.previewUrl)
      return {
        palette: {
          ...state.palette,
          [emotionKey]: {
            blobId,
            previewUrl: createPreviewUrl(blob),
            warning: validation.warning,
          },
        },
      }
    })
    void savePersisted(get())
  },

  clearPaletteEmotion: (emotionKey) => {
    set((state) => {
      const existing = state.palette[emotionKey]
      if (existing) {
        revokePreviewUrl(existing.previewUrl)
        void removeBlob(existing.blobId)
      }
      const next = { ...state.palette }
      delete next[emotionKey]
      return { palette: next }
    })
    void savePersisted(get())
  },

  assignFromPalette: async (emotionKey, folderPath, filename) => {
    const paletteEntry = get().palette[emotionKey]
    if (!paletteEntry) return

    const blob = await idbGet<Blob>(paletteEntry.blobId)
    if (!blob) return

    const assignmentBlobId = await storeBlob(blob)
    const key = slotKey(folderPath, filename)

    set((state) => ({
      assignments: {
        ...state.assignments,
        [key]: { blobId: assignmentBlobId, source: 'palette', emotionKey },
      },
    }))
    void savePersisted(get())
  },

  assignCustomFile: async (folderPath, filename, file) => {
    const validation = await validatePngFile(file)
    const blobId = await storeBlob(file)
    const key = slotKey(folderPath, filename)
    const emotionKey = emotionFromFilename(filename) ?? undefined

    set((state) => ({
      assignments: {
        ...state.assignments,
        [key]: {
          blobId,
          source: 'custom',
          emotionKey,
          warning: validation.warning,
        },
      },
    }))

    void savePersisted(get())
  },

  assignCustomFilesToScenario: async (scenario, files) => {
    if (files.length === 0) return { assigned: 0, unmatched: [] }

    const { settings } = get()
    const visibleFiles = getScenarioVisibleFiles(scenario, settings)
    const matches = matchFilesToScenarioSlots(files, visibleFiles)

    if (matches.length === 0) {
      return { assigned: 0, unmatched: files.map((file) => file.name) }
    }

    const nextAssignments = { ...get().assignments }

    for (const { filename, file } of matches) {
      const validation = await validatePngFile(file)
      const blobId = await storeBlob(file)
      const key = slotKey(scenario.folderPath, filename)
      const emotionKey = emotionFromFilename(filename) ?? undefined
      const existing = nextAssignments[key]

      if (existing) void removeBlob(existing.blobId)

      nextAssignments[key] = {
        blobId,
        source: 'custom',
        emotionKey,
        warning: validation.warning,
      }
    }

    set({ assignments: nextAssignments })
    void savePersisted(get())

    return {
      assigned: matches.length,
      unmatched: unmatchedDroppedFilenames(files, matches),
    }
  },

  copyCustomAssignment: async (fromFolderPath, fromFilename, toFolderPath, toFilename) => {
    const copied = await get().copyCustomAssignmentToTargets(fromFolderPath, fromFilename, [
      { folderPath: toFolderPath, filename: toFilename },
    ])
    return copied === 1
  },

  copyCustomAssignmentToTargets: async (fromFolderPath, fromFilename, targets) => {
    if (targets.length === 0) return 0

    const fromKey = slotKey(fromFolderPath, fromFilename)
    const source = get().assignments[fromKey]
    if (!source) return 0

    const blob = await idbGet<Blob>(source.blobId)
    if (!blob) return 0

    const nextAssignments = { ...get().assignments }

    for (const { folderPath, filename } of targets) {
      const toKey = slotKey(folderPath, filename)
      const existingTarget = nextAssignments[toKey]
      if (existingTarget) void removeBlob(existingTarget.blobId)

      const blobId = await storeBlob(blob)

      if (source.source === 'palette') {
        nextAssignments[toKey] = {
          blobId,
          source: 'palette',
          emotionKey: source.emotionKey,
        }
      } else {
        const emotionKey = emotionFromFilename(filename) ?? source.emotionKey
        nextAssignments[toKey] = {
          blobId,
          source: 'custom',
          emotionKey,
          warning: source.warning,
        }
      }
    }

    set({ assignments: nextAssignments })
    void savePersisted(get())
    return targets.length
  },

  clearAssignment: (folderPath, filename) => {
    const key = slotKey(folderPath, filename)
    set((state) => {
      const existing = state.assignments[key]
      if (existing) void removeBlob(existing.blobId)
      const next = { ...state.assignments }
      delete next[key]
      return { assignments: next }
    })
    void savePersisted(get())
  },

  clearAssignmentsForScenarios: (scenarios) => {
    const { settings } = get()
    const keysToClear: string[] = []
    for (const scenario of scenarios) {
      for (const filename of getScenarioVisibleFiles(scenario, settings)) {
        keysToClear.push(slotKey(scenario.folderPath, filename))
      }
    }

    let cleared = 0
    set((state) => {
      const next = { ...state.assignments }
      for (const key of keysToClear) {
        const existing = next[key]
        if (!existing) continue
        void removeBlob(existing.blobId)
        delete next[key]
        cleared++
      }
      return { assignments: next }
    })
    void savePersisted(get())
    return cleared
  },

  clearAllAssignments: () => {
    let cleared = 0
    set((state) => {
      for (const assignment of Object.values(state.assignments)) {
        void removeBlob(assignment.blobId)
        cleared++
      }
      return { assignments: {} }
    })
    void savePersisted(get())
    return cleared
  },

  applyDefaultsToScenarios: async (scenarios) => {
    let count = 0
    const { palette, settings } = get()
    const emotions = [...CORE_EMOTIONS, ...(settings.extendedEmotions ? EXTENDED_EMOTIONS : [])]

    for (const scenario of scenarios) {
      const visibleFiles = getScenarioVisibleFiles(scenario, settings)
      for (const emotion of emotions) {
        if (!palette[emotion.key]) continue

        const outdoorFile = resolveFilenameForEmotion(emotion.key, visibleFiles, false)
        if (outdoorFile) {
          await get().assignFromPalette(emotion.key, scenario.folderPath, outdoorFile)
          count++
        }

        if (settings.indoorVariants) {
          const indoorFile = resolveFilenameForEmotion(emotion.key, visibleFiles, true)
          if (indoorFile) {
            await get().assignFromPalette(emotion.key, scenario.folderPath, indoorFile)
            count++
          }
        }
      }
    }

    return count
  },

  importProject: async (file) => {
    const parsed = await parseProjectZip(file)

    for (const entry of Object.values(get().palette)) {
      if (entry) revokePreviewUrl(entry.previewUrl)
    }

    await clearAllStoredData()

    const palette: Partial<Record<EmotionKey, PaletteEntry>> = {}
    for (const [emotionKey, entry] of Object.entries(parsed.palette)) {
      if (!entry) continue
      const blobId = await storeBlob(entry.blob)
      palette[emotionKey as EmotionKey] = {
        blobId,
        previewUrl: createPreviewUrl(entry.blob),
        warning: entry.warning,
      }
    }

    const assignments: Record<string, Assignment> = {}
    for (const [key, assignment] of Object.entries(parsed.assignments)) {
      const blob = parsed.assignmentBlobs.get(key)
      if (!blob) continue
      const blobId = await storeBlob(blob)
      assignments[key] = {
        ...assignment,
        blobId,
      }
    }

    set({
      hydrated: true,
      farmerName: parsed.farmerName,
      settings: parsed.settings,
      palette,
      assignments,
      blobCache: new Map(),
    })

    await savePersisted(get())

    return {
      farmerName: parsed.farmerName.trim() || 'Player 1',
      paletteCount: parsed.paletteCount,
      assignmentCount: parsed.assignmentCount,
      migratedCount: parsed.migratedCount,
      droppedCount: parsed.droppedCount,
    }
  },

  getBlob: async (blobId) => idbGet<Blob>(blobId),

  getAssignmentPreview: async (key) => {
    const assignment = get().assignments[key]
    if (!assignment) return undefined

    const cached = get().blobCache.get(assignment.blobId)
    if (cached) return cached

    const blob = await idbGet<Blob>(assignment.blobId)
    if (!blob) return undefined

    const url = createPreviewUrl(blob)
    set((state) => {
      const next = new Map(state.blobCache)
      next.set(assignment.blobId, url)
      return { blobCache: next }
    })
    return url
  },
}))

export function getVisibleGroups(settings: AppSettings): ScenarioGroupKey[] {
  const groups: ScenarioGroupKey[] = [...scenarioManifest.coreGroups]
  for (const group of scenarioManifest.advancedGroups) {
    if (settings.enabledAdvancedGroups[group]) {
      groups.push(group)
    }
  }
  return groups
}

export function getScenariosForGroup(group: ScenarioGroupKey): Scenario[] {
  return scenarioManifest.groups[group] ?? []
}

export interface SlotTarget {
  folderPath: string
  filename: string
  key: string
  scenarioId: string
  scenarioLabel: string
  groupKey: ScenarioGroupKey
  groupLabel: string
}

export interface CopyTargetSection {
  scenarioId: string
  scenarioLabel: string
  targets: SlotTarget[]
}

export interface CopyTargetGroup {
  groupKey: ScenarioGroupKey
  groupLabel: string
  sections: CopyTargetSection[]
}

export function getVisibleSlots(settings: AppSettings): { folderPath: string; filename: string }[] {
  return getVisibleSlotTargets(settings).map(({ folderPath, filename }) => ({
    folderPath,
    filename,
  }))
}

export function getVisibleCopyTargetGroups(
  settings: AppSettings,
  excludeKey?: string,
): CopyTargetGroup[] {
  const groups: CopyTargetGroup[] = []

  for (const groupKey of getVisibleGroups(settings)) {
    const groupLabel = scenarioManifest.groupLabels[groupKey] ?? groupKey
    const sections: CopyTargetSection[] = []

    for (const scenario of getScenariosForGroup(groupKey)) {
      const targets: SlotTarget[] = []

      for (const filename of getScenarioVisibleFiles(scenario, settings)) {
        const key = slotKey(scenario.folderPath, filename)
        if (key === excludeKey) continue
        targets.push({
          folderPath: scenario.folderPath,
          filename,
          key,
          scenarioId: scenario.id,
          scenarioLabel: scenario.label,
          groupKey,
          groupLabel,
        })
      }

      if (targets.length > 0) {
        sections.push({
          scenarioId: scenario.id,
          scenarioLabel: scenario.label,
          targets,
        })
      }
    }

    if (sections.length > 0) {
      groups.push({ groupKey, groupLabel, sections })
    }
  }

  return groups
}

export function getVisibleSlotTargets(
  settings: AppSettings,
  excludeKey?: string,
): SlotTarget[] {
  return getVisibleCopyTargetGroups(settings, excludeKey).flatMap((group) =>
    group.sections.flatMap((section) => section.targets),
  )
}

export function countVisibleSlots(settings: AppSettings): number {
  return getVisibleSlots(settings).length
}

export function hasPalettePortraits(palette: Partial<Record<EmotionKey, PaletteEntry>>): boolean {
  return Object.values(palette).some((entry) => entry != null)
}

export function countVisibleAssignments(
  assignments: Record<string, Assignment>,
  settings: AppSettings,
): number {
  return getVisibleSlots(settings).filter(
    (slot) => assignments[slotKey(slot.folderPath, slot.filename)],
  ).length
}

export function countGroupSlotStats(
  scenarios: Scenario[],
  assignments: Record<string, Assignment>,
  settings: AppSettings,
): { filled: number; total: number } {
  let total = 0
  let filled = 0
  for (const scenario of scenarios) {
    for (const filename of getScenarioVisibleFiles(scenario, settings)) {
      total++
      if (assignments[slotKey(scenario.folderPath, filename)]) filled++
    }
  }
  return { filled, total }
}

export { scenarioManifest }

export type { ImportProjectResult }

export async function clearAllStoredData(): Promise<void> {
  const allKeys = await keys()
  await Promise.all(allKeys.filter((k) => String(k).startsWith(BLOB_PREFIX)).map((k) => del(k)))
  localStorage.removeItem(STORAGE_KEY)
}

export async function exportAllBlobs(resizeOnExport: boolean): Promise<Map<string, Blob>> {
  const { assignments } = usePortraitStore.getState()
  const result = new Map<string, Blob>()

  for (const [key, assignment] of Object.entries(assignments)) {
    const blob = await idbGet<Blob>(assignment.blobId)
    if (!blob) continue
    result.set(key, resizeOnExport ? await resizeTo64(blob) : blob)
  }

  return result
}
