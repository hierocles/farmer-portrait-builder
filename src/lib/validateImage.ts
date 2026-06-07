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
    result.warning = `Expected 64×64 pixels, got ${result.width}×${result.height}.`
  }

  return result
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
