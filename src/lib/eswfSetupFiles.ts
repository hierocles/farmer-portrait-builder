/** Portrait setup JSON shipped with exports (updated folder layout for Farmer 2.0 ESWF). */
export const ESWF_SETUP_FILES = [
  'content.json',
  'portrait_setup.json',
  'portrait_cw.json',
  'portrait_festival.json',
  'portrait_newfestival.json',
  'portrait_swimsuit.json',
  'portrait_farming.json',
  'portrait_mining.json',
  'portrait_pajamas.json',
] as const

export type EswfSetupFile = (typeof ESWF_SETUP_FILES)[number]

export function eswfSetupZipPath(filename: EswfSetupFile): string {
  if (filename === 'content.json') return filename
  return `assets/setup/${filename}`
}

export function eswfSetupPublicPath(filename: EswfSetupFile): string {
  return `eswf-setup/${filename}`
}
