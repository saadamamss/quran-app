#!/usr/bin/env node
/**
 * Fetch every Mushaf page from quran.com CDN, reduce it to the lean schema,
 * and write one JSON file per page under public/data/pages/.
 *
 * Usage:
 *   node scripts/fetch-pages.mjs                       # all 604 pages, concurrency 6
 *   node scripts/fetch-pages.mjs --from 1 --to 20
 *   node scripts/fetch-pages.mjs --only 1,2,42,187,604
 *   node scripts/fetch-pages.mjs --force               # refetch existing files
 *   node scripts/fetch-pages.mjs --out /tmp/x --no-manifest
 *
 * The source query is intentionally locked (mushaf=2, words=true) so the
 * page-font glyph text in `word.text` matches public/fonts/p{N}.woff2.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { clines } from '../src/utils/CLines.js'
import { pageshashizbnumber } from '../src/utils/Hizb.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const API = 'https://api.qurancdn.com/api/qdc/verses/by_page'
const QUERY =
  'words=true&per_page=all&fields=text_uthmani%2Cchapter_id%2Cchizb_number%2Ctext_imlaei_simple&reciter=7&word_translation_language=en&word_fields=verse_key%2Cverse_id%2Cpage_number%2Clocation%2Ctext_uthmani%2Ccode_v1%2Cqpc_uthmani_hafs&mushaf=2&filter_page_words=true&from=0%3A0&to=0%3A0'
const COMPLETE_LINES = Array.from({ length: 15 }, (_, i) => i + 1)
const TOTAL_PAGES = 604

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function printHelp() {
  console.log(`Fetch and reduce Quran page data.

Options:
  --from N            first page (default 1)
  --to N              last page (default 604)
  --only 1,2,42       explicit page list (overrides --from/--to)
  --concurrency N     parallel requests (default 6)
  --out DIR           output dir (default public/data)
  --force             refetch pages even if the JSON already exists
  --pretty            pretty-print page JSON (default minified)
  --no-manifest       do not write manifest.json
  --dry-run           transform but do not write files
  --retries N         max attempts per page (default 5)
  --help              show this help`)
}

function parseArgs(argv) {
  const args = {
    from: 1,
    to: TOTAL_PAGES,
    only: null,
    concurrency: 6,
    out: path.join(ROOT, 'public/data'),
    force: false,
    pretty: false,
    manifest: true,
    dryRun: false,
    retries: 5,
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--from') args.from = Number(argv[++i])
    else if (a === '--to') args.to = Number(argv[++i])
    else if (a === '--only') args.only = argv[++i].split(',').map(Number)
    else if (a === '--concurrency') args.concurrency = Number(argv[++i])
    else if (a === '--out') args.out = path.resolve(argv[++i])
    else if (a === '--force') args.force = true
    else if (a === '--pretty') args.pretty = true
    else if (a === '--no-manifest') args.manifest = false
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--retries') args.retries = Number(argv[++i])
    else if (a === '--help' || a === '-h') {
      printHelp()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${a}`)
    }
  }
  return args
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const backoff = (attempt) => Math.min(8000, 500 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 250)

async function exists(file) {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

function rubLabel(rub) {
  if (!Number.isFinite(rub)) return null
  const q = ((rub - 1) % 4) / 4
  return (
    {
      0: 'الحزب',
      0.25: 'ربع الحزب',
      0.5: 'نصف الحزب',
      0.75: 'ثلاثة أرباع الحزب',
    }[q] ?? null
  )
}

function isCentered(page, lineNumber) {
  return page === 1 || page === 2 || Boolean(clines[page]?.includes(lineNumber))
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
async function fetchRaw(page, attempt = 1, retries = 5) {
  const url = `${API}/${page}?${QUERY}`
  try {
    const res = await fetch(url, {
      headers: {
        accept: '*/*',
        referer: 'https://quran.com/',
      },
    })
    if (!res.ok) {
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await sleep(backoff(attempt))
        return fetchRaw(page, attempt + 1, retries)
      }
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }
    const json = await res.json()
    if (!Array.isArray(json.verses) || json.verses.length === 0) {
      throw new Error('response has no verses')
    }
    return json
  } catch (err) {
    if (attempt < retries) {
      await sleep(backoff(attempt))
      return fetchRaw(page, attempt + 1, retries)
    }
    throw err
  }
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------
/**
 * Rebuilds the 15-line page layout using the same rules the app currently
 * applies at runtime, with one correction: Surah 9 (At-Tawba) has no
 * basmalah, so a single reserved line before 9:1 is a surah header.
 */
function buildLean(raw, page) {
  const verses = raw.verses
  const anomalies = []

  // 1. Group words by the API's line_number, preserving reading order.
  const byLine = {}
  for (const verse of verses) {
    for (const word of verse.words) {
      const n = word.line_number
      if (!Number.isInteger(n) || n < 1 || n > 15) {
        throw new Error(`page ${page}: invalid line_number ${n} for ${word.verse_key}`)
      }
      if (typeof word.text !== 'string' || word.text.length === 0) {
        throw new Error(`page ${page}: empty word text for ${word.verse_key}`)
      }
      ;(byLine[n] ||= []).push(word)
    }
  }

  // 2. Fill reserved (word-less) lines: basmalah and surah headers.
  const missing = COMPLETE_LINES.filter((n) => !byLine[n])
  for (const m of missing) {
    const nextLine = byLine[m + 1]

    if (nextLine) {
      const nextKey = nextLine[0]?.verse_key || ''
      const [nextChapter, nextAyah] = nextKey.split(':').map(Number)

      // Surah 9 has no basmalah: the reserved line is its header.
      if (nextAyah === 1 && nextChapter === 9) {
        byLine[m] = { name: true, chapter_id: 9 }
        continue
      }

      byLine[m] = { basmalah: true }
      if (nextAyah !== 1) {
        anomalies.push(`line ${m}: basmalah inserted before ${nextKey} (not a surah start)`)
      }
      continue
    }

    // Gap at the end of the page: infer a surah header.
    const nextChapter = byLine[m + 2]?.[0]?.verse_key?.split(':')[0]
    const prevChapter = byLine[m - 1]?.[0]?.verse_key?.split(':')[0]
    let chapterId = null
    if (nextChapter) chapterId = nextChapter
    else if (prevChapter) chapterId = String(Number(prevChapter) + 1)

    if (page === 1 || page === 2) {
      // Pages 1–2 have a large decorative header area; preserve current behavior.
      byLine[m] = chapterId ? { name: true, chapter_id: chapterId } : null
    } else {
      byLine[m] = { name: true, chapter_id: chapterId }
      if (!chapterId) anomalies.push(`line ${m}: surah header with unknown chapter`)
      else if (!nextChapter) anomalies.push(`line ${m}: surah header inferred at page end (chapter ${chapterId})`)
    }
  }

  // 3. Build the lean ordered lines.
  const lines = []
  for (const n of COMPLETE_LINES) {
    const L = byLine[n]
    if (L == null) continue

    if (L.basmalah) {
      const line = { type: 'basmalah' }
      if (isCentered(page, n)) line.center = true
      lines.push(line)
      continue
    }

    if (L.name) {
      const chapter = Number(L.chapter_id)
      if (!Number.isInteger(chapter) || chapter < 1 || chapter > 114) {
        anomalies.push(`line ${n}: invalid surah chapter ${L.chapter_id}`)
        continue
      }
      const line = { type: 'surah', chapter }
      if (isCentered(page, n)) line.center = true
      lines.push(line)
      continue
    }

    // Word line: group into [verseKey, [texts]] runs.
    const runs = []
    let current = null
    for (const word of L) {
      if (!current || current[0] !== word.verse_key) {
        current = [word.verse_key, []]
        runs.push(current)
      }
      current[1].push(word.text)
    }
    if (runs.length === 0) {
      anomalies.push(`line ${n}: empty word line`)
      continue
    }

    const line = { type: 'words' }
    if (isCentered(page, n)) line.center = true
    line.runs = runs
    lines.push(line)
  }

  // 4. Page-level metadata.
  const wordCount = verses.reduce((sum, v) => sum + v.words.length, 0)
  const juz = verses[0].juz_number
  const hizbValues = verses.map((v) => v.hizb_number).filter(Number.isFinite)
  const rubValues = verses.map((v) => v.rub_el_hizb_number).filter(Number.isFinite)
  const hizb = hizbValues.length ? Math.max(...hizbValues) : null
  const rub = rubValues.length ? Math.max(...rubValues) : null

  let surahs = [...new Set(verses.filter((v) => v.verse_number === 1).map((v) => v.chapter_id))]
  if (surahs.length === 0) surahs = [verses[0].chapter_id]

  const firstVerse = verses[0].verse_key

  let hizbLine = null
  let hizbLabel = null
  if (pageshashizbnumber.includes(page) && Number.isFinite(rub)) {
    const markerVerse = verses.find((v) => v.rub_el_hizb_number === rub)
    hizbLine = markerVerse?.words?.[0]?.line_number ?? null
    hizbLabel = rubLabel(rub)
  }

  const data = {
    page,
    juz,
    hizb,
    rub,
    surahs,
    firstVerse,
    hizbLine,
    hizbLabel,
    lines,
  }

  // 5. Consistency checks (warnings only).
  const firstWordLine = lines.find((l) => l.type === 'words')
  if (firstWordLine && firstWordLine.runs[0]?.[0] !== firstVerse) {
    anomalies.push(`firstVerse ${firstVerse} does not match first run ${firstWordLine.runs[0]?.[0]}`)
  }
  if (lines.length > 15) anomalies.push(`${lines.length} lines (max 15)`)

  return { data, wordCount, anomalies }
}

function countWords(data) {
  let n = 0
  for (const line of data.lines) {
    if (line.type !== 'words') continue
    for (const [, words] of line.runs) n += words.length
  }
  return n
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv)
  const pagesDir = path.join(args.out, 'pages')
  const manifestFile = path.join(args.out, 'manifest.json')

  const pages = args.only
    ? args.only
    : Array.from({ length: args.to - args.from + 1 }, (_, i) => args.from + i)
  if (pages.length === 0) throw new Error('no pages selected')
  for (const p of pages) {
    if (!Number.isInteger(p) || p < 1 || p > TOTAL_PAGES) throw new Error(`invalid page ${p}`)
  }

  await fs.mkdir(pagesDir, { recursive: true })

  const stats = {}
  const anomalyMap = {}
  const errors = []
  let done = 0
  let index = 0

  async function processPage(page) {
    const file = path.join(pagesDir, `${page}.json`)

    // Resume: reuse a valid existing file.
    if (!args.force && (await exists(file))) {
      try {
        const raw = await fs.readFile(file, 'utf8')
        const data = JSON.parse(raw)
        if (data.page !== page || !Array.isArray(data.lines) || data.lines.length === 0) {
          throw new Error('existing file is invalid')
        }
        const size = Buffer.byteLength(raw)
        stats[page] = {
          bytes: size,
          words: countWords(data),
          lines: data.lines.length,
          juz: data.juz,
          surahs: data.surahs,
          firstVerse: data.firstVerse,
        }
        done++
        if (done % 25 === 0 || done === pages.length) {
          console.log(`[${done}/${pages.length}] page ${page} ↷ reused (${size} B)`)
        }
        return
      } catch {
        // fall through and refetch
      }
    }

    try {
      const raw = await fetchRaw(page, 1, args.retries)
      const { data, wordCount, anomalies } = buildLean(raw, page)
      const json = args.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
      const payload = json + '\n'

      if (!args.dryRun) await fs.writeFile(file, payload)

      const size = Buffer.byteLength(payload)
      stats[page] = {
        bytes: size,
        words: wordCount,
        lines: data.lines.length,
        juz: data.juz,
        surahs: data.surahs,
        firstVerse: data.firstVerse,
      }
      if (anomalies.length) anomalyMap[page] = anomalies

      done++
      if (done % 25 === 0 || done === pages.length) {
        console.log(
          `[${done}/${pages.length}] page ${page} ✓ ${size} B (${wordCount} words, ${data.lines.length} lines)`,
        )
      }
    } catch (err) {
      errors.push({ page, message: err.message })
      done++
      console.error(`[${done}/${pages.length}] page ${page} ✗ ${err.message}`)
    }
  }

  const workerCount = Math.max(1, Math.min(args.concurrency, pages.length))
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const i = index++
      if (i >= pages.length) return
      await processPage(pages[i])
    }
  })
  await Promise.all(workers)

  // Manifest
  const orderedStats = {}
  for (const p of [...pages].sort((a, b) => a - b)) {
    if (stats[p]) orderedStats[p] = stats[p]
  }
  const totalBytes = Object.values(orderedStats).reduce((a, s) => a + s.bytes, 0)
  const totalWords = Object.values(orderedStats).reduce((a, s) => a + s.words, 0)

  if (args.manifest && !args.dryRun) {
    const manifest = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      source: { api: API, mushaf: 2, query: QUERY },
      pages: Object.keys(orderedStats).length,
      totalWords,
      totalBytes,
      files: orderedStats,
      anomalies: Object.entries(anomalyMap).map(([page, messages]) => ({
        page: Number(page),
        messages,
      })),
    }
    await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
    console.log(`\nManifest written: ${manifestFile}`)
  }

  console.log(
    `\nDone. ${Object.keys(orderedStats).length} pages, ${totalWords} words, ` +
      `${(totalBytes / 1024).toFixed(1)} KB total.`,
  )
  if (Object.keys(anomalyMap).length) {
    console.log(`\nAnomalies on ${Object.keys(anomalyMap).length} page(s):`)
    for (const [page, messages] of Object.entries(anomalyMap)) {
      console.log(`  page ${page}:`)
      for (const m of messages) console.log(`    - ${m}`)
    }
  }
  if (errors.length) {
    console.error(`\n${errors.length} page(s) failed:`)
    for (const e of errors) console.error(`  page ${e.page}: ${e.message}`)
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
