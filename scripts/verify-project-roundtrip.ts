/**
 * Project file format round-trip checks.
 * Run: npm run verify-project-roundtrip
 */
import JSZip from 'jszip'

import {
  APP_VERSION,
  PROJECT_FORMAT_VERSION,
  PROJECT_JSON,
  buildAssignmentImagePath,
  buildPaletteImagePath,
  parseProjectFile,
} from '../src/lib/projectFormat.ts'
import { parseProjectZip } from '../src/lib/importProject.ts'
import { slotKey } from '../src/lib/types.ts'

const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
])

let failed = 0

const happyPath = buildPaletteImagePath('happy')
const assignmentKey = slotKey('Fall/GreenRain/', 'portrait_happy.png')
const assignmentImage = buildAssignmentImagePath('Fall/GreenRain/', 'portrait_happy.png')

const project = {
  formatVersion: PROJECT_FORMAT_VERSION,
  exportedAt: new Date().toISOString(),
  appVersion: APP_VERSION,
  farmerName: 'Player 1',
  settings: {
    extendedEmotions: false,
    indoorVariants: true,
    resizeOnExport: false,
    enabledAdvancedGroups: { weatherWonders: true },
  },
  palette: { happy: happyPath },
  assignments: {
    [assignmentKey]: {
      source: 'custom',
      emotionKey: 'happy',
      warning: null,
      image: assignmentImage,
    },
  },
}

try {
  parseProjectFile(project)
} catch (error) {
  console.error('parseProjectFile failed on valid project')
  console.error(error)
  failed++
}

const zip = new JSZip()
zip.file(PROJECT_JSON, JSON.stringify(project, null, 2))
zip.file(happyPath, PNG)
zip.file(assignmentImage, PNG)

const buffer = await zip.generateAsync({ type: 'arraybuffer' })
const parsed = await parseProjectZip(buffer)

if (parsed.paletteCount !== 1 || parsed.assignmentCount !== 1) {
  console.error('parseProjectZip counts mismatch')
  console.error(parsed)
  failed++
}

if (parsed.farmerName !== 'Player 1') {
  console.error('parseProjectZip farmerName mismatch')
  failed++
}

try {
  parseProjectFile({ formatVersion: 99 })
  console.error('parseProjectFile should reject unknown format version')
  failed++
} catch {
  // expected
}

if (failed > 0) {
  console.error(`verify-project-roundtrip: ${failed} check(s) failed`)
  process.exit(1)
}

console.log('verify-project-roundtrip: OK')
