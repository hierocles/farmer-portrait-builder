/** Basename of a dropped file, normalized for slot lookup. */
export function droppedFileBasename(name: string): string {
  const normalized = name.replace(/^.*[/\\]/, '')
  return normalized
}

export interface MatchedScenarioFile {
  filename: string
  file: File
}

/**
 * Match dropped PNG files to visible scenario slot filenames by basename (case-insensitive).
 * Each slot accepts at most one file; duplicate basenames in the drop are ignored after the first.
 */
export function matchFilesToScenarioSlots(
  files: File[],
  visibleFilenames: string[],
): MatchedScenarioFile[] {
  const slotByLowerName = new Map<string, string>()
  for (const filename of visibleFilenames) {
    slotByLowerName.set(filename.toLowerCase(), filename)
  }

  const results: MatchedScenarioFile[] = []
  const usedSlots = new Set<string>()

  for (const file of files) {
    const baseName = droppedFileBasename(file.name)
    const canonical = slotByLowerName.get(baseName.toLowerCase())
    if (!canonical || usedSlots.has(canonical)) continue
    usedSlots.add(canonical)
    results.push({ filename: canonical, file })
  }

  return results
}

export function unmatchedDroppedFilenames(
  files: File[],
  matches: MatchedScenarioFile[],
): string[] {
  const matchedNames = new Set(matches.map(({ file }) => file.name.toLowerCase()))
  return files.filter((file) => !matchedNames.has(file.name.toLowerCase())).map((file) => file.name)
}
