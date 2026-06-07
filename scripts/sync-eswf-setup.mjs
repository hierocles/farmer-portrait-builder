import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MOD_ROOT = join(__dirname, '../../Farmer 2.0 ESWF NPC Reaction Overhaul')
const MOD_SETUP = join(MOD_ROOT, 'assets/setup')
const OUTPUT_DIR = join(__dirname, '../public/eswf-setup')

const SETUP_FILES = [
  'portrait_setup.json',
  'portrait_cw.json',
  'portrait_festival.json',
  'portrait_newfestival.json',
  'portrait_swimsuit.json',
  'portrait_farming.json',
  'portrait_mining.json',
  'portrait_pajamas.json',
]

const ROOT_FILES = ['content.json']

if (!existsSync(MOD_SETUP) && !existsSync(MOD_ROOT)) {
  if (existsSync(OUTPUT_DIR) && readdirSync(OUTPUT_DIR).some((f) => f.endsWith('.json'))) {
    console.log('ESWF setup source not found; keeping existing public/eswf-setup/')
    process.exit(0)
  }

  console.warn('Warning: ESWF setup folder not found and no cached copies exist.')
  process.exit(0)
}

mkdirSync(OUTPUT_DIR, { recursive: true })

let copied = 0
for (const file of SETUP_FILES) {
  const source = join(MOD_SETUP, file)
  if (!existsSync(source)) {
    console.warn(`Warning: missing ${file} in ESWF mod setup folder`)
    continue
  }

  copyFileSync(source, join(OUTPUT_DIR, file))
  copied++
}

for (const file of ROOT_FILES) {
  const source = join(MOD_ROOT, file)
  if (!existsSync(source)) {
    console.warn(`Warning: missing ${file} in ESWF mod root folder`)
    continue
  }

  copyFileSync(source, join(OUTPUT_DIR, file))
  copied++
}

console.log(`Synced ${copied} ESWF setup JSON file(s) to public/eswf-setup/`)
