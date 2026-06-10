export interface ImageValidation {
  width: number
  height: number
  warning?: string
}

export async function validatePngFile(file: File): Promise<ImageValidation> {
  if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
    return { width: 0, height: 0, warning: 'Only PNG files are supported.' }
  }

  const bitmap = await createImageBitmap(file)
  const result: ImageValidation = { width: bitmap.width, height: bitmap.height }
  bitmap.close()

  if (result.width !== 64 || result.height !== 64) {
    result.warning = `dimension:${result.width}x${result.height}`
  }

  return result
}

const LEGACY_DIMENSION_WARNING = /^Expected 64×64 pixels, got (\d+)×(\d+)\.$/
const DIMENSION_WARNING = /^dimension:(\d+)x(\d+)$/

export function getDimensionWarningMessage(width: number, height: number): string {
  return `${width}×${height} portrait — 64×64 recommended`
}

export function parseDimensionWarning(warning?: string): { width: number; height: number } | null {
  if (!warning) return null

  const legacyMatch = warning.match(LEGACY_DIMENSION_WARNING)
  if (legacyMatch) {
    return { width: Number(legacyMatch[1]), height: Number(legacyMatch[2]) }
  }

  const match = warning.match(DIMENSION_WARNING)
  if (match) {
    return { width: Number(match[1]), height: Number(match[2]) }
  }

  return null
}

export async function resizeTo64(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(bitmap, 0, 0, 64, 64)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) reject(new Error('Failed to resize image'))
      else resolve(b)
    }, 'image/png')
  })
}

export function createPreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

export function revokePreviewUrl(url: string | undefined): void {
  if (url) URL.revokeObjectURL(url)
}
