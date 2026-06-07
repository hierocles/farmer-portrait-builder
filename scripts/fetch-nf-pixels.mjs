/**
 * Download NF-Pixels (SIL OFL 1.1) for local hosting.
 * https://github.com/sgigou/NF-Pixels
 */
import { mkdirSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'fonts', 'nf-pixels')
const BASE = 'https://raw.githubusercontent.com/sgigou/NF-Pixels/master'

const FILES = [
  { url: `${BASE}/fonts/ttf/NFPixels-Regular.ttf`, out: 'NFPixels-Regular.ttf' },
  { url: `${BASE}/LICENSE`, out: 'LICENSE.txt' },
]

async function fetchFile(url, outPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  writeFileSync(outPath, Buffer.from(await res.arrayBuffer()))
}

async function main() {
  mkdirSync(OUT, { recursive: true })

  const fontPath = join(OUT, FILES[0].out)
  if (existsSync(fontPath)) {
    console.log('NF-Pixels already present in public/fonts/nf-pixels/')
    return
  }

  for (const { url, out } of FILES) {
    const outPath = join(OUT, out)
    await fetchFile(url, outPath)
    console.log(`Fetched ${out}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
