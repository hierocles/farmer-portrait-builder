import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { ESWF_SETUP_FILES, eswfSetupPublicPath, eswfSetupZipPath } from './eswfSetupFiles'
import { buildManifestSlotIndex, buildZipAssetPath, resolveExportPath } from './exportPaths'
import { publicAsset } from './publicAsset'
import { parseSlotKey } from './types'
import { exportAllBlobs, usePortraitStore } from '../store/portraitStore'

export interface ExportResult {
  fileCount: number
  setupFileCount: number
  skippedCount: number
  farmerName: string
}

export async function exportPortraitZip(): Promise<ExportResult> {
  const { farmerName } = usePortraitStore.getState()
  const safeName = farmerName.trim() || 'Player 1'
  const manifestSlots = buildManifestSlotIndex()
  const blobs = await exportAllBlobs(usePortraitStore.getState().settings.resizeOnExport)

  const zip = new JSZip()
  const installText = await fetch(publicAsset('/INSTALL.txt')).then((r) => r.text())
  zip.file('INSTALL.txt', installText)

  let fileCount = 0
  let skippedCount = 0
  const written = new Set<string>()

  for (const [key, blob] of blobs.entries()) {
    const { folderPath, filename } = parseSlotKey(key)
    const resolved = resolveExportPath(folderPath, filename, manifestSlots)

    if (!resolved) {
      skippedCount++
      continue
    }

    const zipPath = buildZipAssetPath(safeName, resolved.folderPath, resolved.filename)
    if (written.has(zipPath)) continue

    zip.file(zipPath, blob)
    written.add(zipPath)
    fileCount++
  }

  if (fileCount === 0) {
    throw new Error(
      skippedCount > 0
        ? 'No portraits matched the current folder layout. Re-assign portraits and try again.'
        : 'No portrait files were available to export.',
    )
  }

  let setupFileCount = 0
  for (const filename of ESWF_SETUP_FILES) {
    const response = await fetch(publicAsset(`/${eswfSetupPublicPath(filename)}`))
    if (!response.ok) {
      throw new Error(`Missing ESWF setup file: ${filename}`)
    }

    zip.file(eswfSetupZipPath(filename), await response.text())
    setupFileCount++
  }

  const content = await zip.generateAsync({ type: 'blob' })
  saveAs(content, `${safeName}-portraits.zip`)

  return { fileCount, setupFileCount, skippedCount, farmerName: safeName }
}
