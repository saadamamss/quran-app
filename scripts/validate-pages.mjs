#!/usr/bin/env node
/**
 * Validate the generated page dataset.
 *
 * Usage:
 *   node scripts/validate-pages.mjs
 *   node scripts/validate-pages.mjs --dir public/data --manifest public/data/manifest.json
 *   node scripts/validate-pages.mjs --compare 1,2,50,187,604
 *   node scripts/validate-pages.mjs --allow-partial
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const TOTAL_PAGES = 604
const API = 'https://api.qurancdn.com/api/qdc/verses/by_page'
const QUERY =
  'words=true&per_page=all&fields=text_uthmani%2Cchapter_id%2Cchizb_number%2Ctext_imlaei_simple&reciter=7&word_translation_language=en&word_fields=verse_key%2Cverse_id%2Cpage_number%2Clocation%2Ctext_uthmani%2Ccode_v1%2Cqpc_uthmani_hafs&mushaf=2&filter_page_words=true&from=0%3A0&to=0%3A0'

function parseArgs(argv) {
  const args = {
    dir: path.join(ROOT, 'public/data'),
    manifest: null,
    compare: null,
    allowPartial: false,
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dir') args.dir = path.resolve(argv[++i])
    else if (a === '--manifest') args.manifest = path.resolve(argv[++i])
    else if (a === '--compare') args.compare = argv[++i].split(',').map(Number)
    else if (a === '--allow-partial') args.allowPartial = true
    else if (a === '--help' || a === '-h') {
      console.log('Validate generated page JSON. See file header for options.')
      process.exit(0)
    } else throw new Error(`Unknown argument: ${a}`)
  }
  if (!args.manifest) args.manifest = path.join(args.dir, 'manifest.json')
  return args
}

const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max
const isVerseKey = (v) => typeof v === 'string' && /^\d{1,3}:\d{1,3}$/.test(v)
const parseVerseKey = (v) => v.split(':').map(Number)

function validatePage(data, filePage) {
  const errors = []
  const warnings = []
  const err = (m) => errors.push(m)
  const warn = (m) => warnings.push(m)

  if (data.page !== filePage) err(`page field ${data.page} does not match filename ${filePage}`)
  if (!isInt(data.juz, 1, 30)) err(`invalid juz ${data.juz}`)
  if (data.hizb !== null && !isInt(data.hizb, 1, 60)) err(`invalid hizb ${data.hizb}`)
  if (data.rub !== null && !isInt(data.rub, 1, 240)) err(`invalid rub ${data.rub}`)
  if (!Array.isArray(data.surahs) || data.surahs.length === 0) err('surahs must be a non-empty array')
  else if (data.surahs.some((s) => !isInt(s, 1, 114))) err(`invalid surah ids ${data.surahs}`)
  if (!isVerseKey(data.firstVerse)) err(`invalid firstVerse ${data.firstVerse}`)
  if (data.hizbLine !== null && !isInt(data.hizbLine, 1, 15)) err(`invalid hizbLine ${data.hizbLine}`)
  if (data.hizbLabel !== null && typeof data.hizbLabel !== 'string') err('hizbLabel must be string or null')

  if (!Array.isArray(data.lines) || data.lines.length === 0) {
    err('lines must be a non-empty array')
    return { errors, warnings, words: 0 }
  }
  if (data.lines.length > 15) err(`${data.lines.length} lines (max 15)`)

  let words = 0
  let firstRunKey = null
  let lastVerse = null

  data.lines.forEach((line, i) => {
    const at = `line[${i}]`
    if (!line || typeof line !== 'object') return err(`${at}: not an object`)

    if (line.type === 'basmalah') {
      const extra = Object.keys(line).filter((k) => k !== 'type' && k !== 'center')
      if (extra.length) warn(`${at}: unexpected fields on basmalah line: ${extra.join(', ')}`)
      if (line.center !== undefined && typeof line.center !== 'boolean') err(`${at}: center must be boolean`)
      return
    }

    if (line.type === 'surah') {
      if (!isInt(line.chapter, 1, 114)) err(`${at}: invalid chapter ${line.chapter}`)
      if (line.center !== undefined && typeof line.center !== 'boolean') err(`${at}: center must be boolean`)
      if (line.chapter === 9) {
        const next = data.lines[i + 1]
        if (next?.type === 'basmalah') err(`${at}: Surah 9 must not be followed by a basmalah`)
      }
      return
    }

    if (line.type !== 'words') {
      err(`${at}: unknown type ${line.type}`)
      return
    }

    if (line.center !== undefined && typeof line.center !== 'boolean') err(`${at}: center must be boolean`)
    if (!Array.isArray(line.runs) || line.runs.length === 0) {
      err(`${at}: runs must be a non-empty array`)
      return
    }

    for (const [ri, run] of line.runs.entries()) {
      if (!Array.isArray(run) || run.length !== 2) {
        err(`${at}.run[${ri}]: expected [verseKey, words[]]`)
        continue
      }
      const [verseKey, runWords] = run
      if (!isVerseKey(verseKey)) err(`${at}.run[${ri}]: invalid verseKey ${verseKey}`)
      if (!Array.isArray(runWords) || runWords.length === 0) {
        err(`${at}.run[${ri}]: words must be a non-empty array`)
        continue
      }
      for (const [wi, w] of runWords.entries()) {
        if (typeof w !== 'string' || w.length === 0) err(`${at}.run[${ri}].word[${wi}]: empty text`)
      }
      words += runWords.length
      if (firstRunKey === null) firstRunKey = verseKey
      if (isVerseKey(verseKey)) {
        const [s, a] = parseVerseKey(verseKey)
        if (lastVerse) {
          const [ps, pa] = lastVerse
          if (s < ps || (s === ps && a < pa)) {
            err(`${at}.run[${ri}]: verse order regression ${ps}:${pa} -> ${s}:${a}`)
          }
        }
        lastVerse = [s, a]
      }
    }
  })

  if (words === 0) err('page has no words')
  if (firstRunKey !== null && data.firstVerse !== firstRunKey) {
    err(`firstVerse ${data.firstVerse} does not match first word run ${firstRunKey}`)
  }
  if (data.lines[0]?.type === 'basmalah') {
    warn('page starts with a basmalah line (usually a surah header precedes it)')
  }

  return { errors, warnings, words }
}

async function fetchRaw(page) {
  const res = await fetch(`${API}/${page}?${QUERY}`, {
    headers: { accept: '*/*', referer: 'https://quran.com/' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json.verses) || json.verses.length === 0) throw new Error('no verses')
  return json
}

async function main() {
  const args = parseArgs(process.argv)
  const pagesDir = path.join(args.dir, 'pages')

  let names
  try {
    names = (await fs.readdir(pagesDir)).filter((n) => n.endsWith('.json')).sort()
  } catch {
    throw new Error(`pages directory not found: ${pagesDir}`)
  }

  const expected = Array.from({ length: TOTAL_PAGES }, (_, i) => `${i + 1}.json`)
  const missing = expected.filter((n) => !names.includes(n))
  const extra = names.filter((n) => !expected.includes(n))
  const errors = []
  const warnings = []

  if (missing.length) {
    const msg = `${missing.length} page file(s) missing (first: ${missing.slice(0, 5).join(', ')})`
    if (args.allowPartial) warnings.push(msg)
    else errors.push(msg)
  }
  if (extra.length) warnings.push(`${extra.length} unexpected file(s): ${extra.slice(0, 5).join(', ')}`)

  let totalWords = 0
  let totalBytes = 0
  let totalGzip = 0
  let checked = 0

  for (const name of names) {
    const filePage = Number(name.replace(/\.json$/, ''))
    if (!Number.isInteger(filePage) || filePage < 1 || filePage > TOTAL_PAGES) {
      warnings.push(`${name}: ignored (not a page 1..604)`)
      continue
    }
    const file = path.join(pagesDir, name)
    const raw = await fs.readFile(file)
    totalBytes += raw.length
    totalGzip += zlib.gzipSync(raw).length

    let data
    try {
      data = JSON.parse(raw.toString('utf8'))
    } catch (e) {
      errors.push(`page ${filePage}: invalid JSON (${e.message})`)
      continue
    }

    const result = validatePage(data, filePage)
    totalWords += result.words
    checked++
    for (const e of result.errors) errors.push(`page ${filePage}: ${e}`)
    for (const w of result.warnings) warnings.push(`page ${filePage}: ${w}`)
  }

  // Manifest checks
  let manifest = null
  try {
    manifest = JSON.parse(await fs.readFile(args.manifest, 'utf8'))
  } catch (e) {
    const msg = `manifest: cannot read ${args.manifest} (${e.message})`
    if (args.allowPartial) warnings.push(msg)
    else errors.push(msg)
  }
  if (manifest) {
    if (manifest.schemaVersion !== 1) errors.push(`manifest: schemaVersion is ${manifest.schemaVersion}, expected 1`)
    if (!args.allowPartial && manifest.pages !== TOTAL_PAGES) {
      errors.push(`manifest: pages is ${manifest.pages}, expected ${TOTAL_PAGES}`)
    }
    if (!manifest.files || typeof manifest.files !== 'object') errors.push('manifest: files object missing')
    else {
      for (const [p, s] of Object.entries(manifest.files)) {
        if (!isInt(Number(p), 1, TOTAL_PAGES)) errors.push(`manifest: invalid page key ${p}`)
        if (!isInt(s.bytes, 1, 1e7)) errors.push(`manifest: page ${p} invalid bytes`)
        if (!isInt(s.words, 1, 1000)) errors.push(`manifest: page ${p} invalid words`)
        if (!isInt(s.lines, 1, 15)) errors.push(`manifest: page ${p} invalid lines`)
      }
    }
  }

  // Optional live comparison against the source API.
  if (args.compare) {
    for (const p of args.compare) {
      try {
        const raw = await fetchRaw(p)
        const sourceWords = raw.verses.reduce((n, v) => n + v.words.length, 0)
        const data = JSON.parse(await fs.readFile(path.join(pagesDir, `${p}.json`), 'utf8'))
        const localWords = data.lines.reduce(
          (n, l) => n + (l.type === 'words' ? l.runs.reduce((m, r) => m + r[1].length, 0) : 0),
          0,
        )
        if (sourceWords !== localWords) {
          errors.push(`page ${p}: word count mismatch (source ${sourceWords}, local ${localWords})`)
        } else {
          console.log(`compare page ${p}: ✓ ${localWords} words match source`)
        }
        if (raw.verses[0].verse_key !== data.firstVerse) {
          errors.push(`page ${p}: firstVerse mismatch (source ${raw.verses[0].verse_key}, local ${data.firstVerse})`)
        }
      } catch (e) {
        errors.push(`compare page ${p}: ${e.message}`)
      }
    }
  }

  console.log('\n=== Page dataset validation ===')
  console.log(`Pages checked : ${checked}`)
  console.log(`Total words   : ${totalWords.toLocaleString()}`)
  console.log(`Total size    : ${(totalBytes / 1024).toFixed(1)} KB raw, ${(totalGzip / 1024).toFixed(1)} KB gzip`)
  console.log(`Avg per page  : ${(totalBytes / Math.max(1, checked)).toFixed(0)} B raw, ${(totalGzip / Math.max(1, checked)).toFixed(0)} B gzip`)
  if (manifest) console.log(`Manifest      : ${manifest.pages} pages, ${manifest.totalWords} words`)

  if (warnings.length) {
    console.log(`\nWarnings (${warnings.length}):`)
    for (const w of warnings.slice(0, 40)) console.log(`  - ${w}`)
    if (warnings.length > 40) console.log(`  ... and ${warnings.length - 40} more`)
  }

  if (errors.length) {
    console.error(`\nErrors (${errors.length}):`)
    for (const e of errors.slice(0, 80)) console.error(`  - ${e}`)
    if (errors.length > 80) console.error(`  ... and ${errors.length - 80} more`)
    process.exitCode = 1
  } else {
    console.log('\n✅ Dataset is valid.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
