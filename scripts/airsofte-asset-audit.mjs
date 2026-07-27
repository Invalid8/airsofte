import { readdir, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'

const ASSET_DIRS = ['src/lib/assets', 'static']
const TRACKED_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.ico',
  '.jpg',
  '.jpeg',
  '.mp3',
  '.ogg',
  '.png',
  '.svg',
  '.ttf',
  '.webp',
  '.wav'
])

const MAX_ASSET_BYTES = Number(process.env.AIRSOFTE_MAX_ASSET_KB ?? 750) * 1024
const MAX_TOTAL_BYTES = Number(process.env.AIRSOFTE_MAX_TOTAL_ASSETS_KB ?? 5120) * 1024
const TOP_COUNT = Number(process.env.AIRSOFTE_ASSET_AUDIT_TOP ?? 12)

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectFiles(path))
      continue
    }

    if (!entry.isFile() || !TRACKED_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      continue
    }

    const info = await stat(path)
    files.push({ path, bytes: info.size })
  }

  return files
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
  return `${(bytes / 1024).toFixed(1)} KiB`
}

const files = (await Promise.all(ASSET_DIRS.map(collectFiles))).flat()
const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0)
const oversized = files.filter((file) => file.bytes > MAX_ASSET_BYTES)
const sorted = files.toSorted((a, b) => b.bytes - a.bytes)

console.log(`Asset files: ${files.length}`)
console.log(`Asset total: ${formatBytes(totalBytes)} / ${formatBytes(MAX_TOTAL_BYTES)}`)
console.log(`Largest allowed file: ${formatBytes(MAX_ASSET_BYTES)}`)
console.log('Largest assets:')

for (const file of sorted.slice(0, TOP_COUNT)) {
  console.log(`${formatBytes(file.bytes).padStart(10)}  ${file.path}`)
}

if (oversized.length > 0 || totalBytes > MAX_TOTAL_BYTES) {
  if (oversized.length > 0) {
    console.error('\nOversized assets:')
    for (const file of oversized) {
      console.error(`${formatBytes(file.bytes).padStart(10)}  ${file.path}`)
    }
  }

  if (totalBytes > MAX_TOTAL_BYTES) {
    console.error(`\nAsset total exceeds cap: ${formatBytes(totalBytes)} > ${formatBytes(MAX_TOTAL_BYTES)}`)
  }

  process.exit(1)
}
