# Page Data Pipeline

> **Status:** M1–M3 complete — 604 page JSON files, generator, validator, local loader,
> `MushafPage` renders precomputed lines, neighbours are preloaded, and the dataset is
> precached for offline use.
> **Branch:** `page-data` (local page dataset).
> **Source of truth:** `scripts/fetch-pages.mjs` (generator) and `scripts/validate-pages.mjs` (validator).

---

## 1. Why this exists

Historically `MushafPage.vue` fetched a full quran.com page payload (~17–70 KB) on every page
view, then re-derived the 15-line Mushaf layout in the browser: grouping words by
`line_number`, inventing missing lines, deciding where basmalahs and surah headers go, and
looking up hizb/rub markers. That was slow (network + JSON parse + heuristic work per page),
wasteful (most fields were never rendered), and impossible to use offline.

The pipeline precomputes all of that once, offline, and stores **one small JSON file per page**
(~0.5–1.3 KB each). The renderer becomes a dumb loop over `lines[]`.

**Measured reduction** (sample pages):

| Page | API payload | Lean JSON | Reduction |
|-----:|------------:|----------:|----------:|
| 1 | 16.9 KB | 0.46 KB | ~97% |
| 42 | 65.6 KB | 1.16 KB | ~98% |
| 604 | 34.3 KB | 0.86 KB | ~98% |

Whole dataset: **604 files, ~0.4–0.7 MB raw, ~0.2–0.35 MB gzip.**

---

## 2. Output layout

```
public/data/
├── manifest.json          ← pretty-printed summary + per-file stats + anomalies
└── pages/
    ├── 1.json             ← minified, one per Mushaf page
    ├── 2.json
    └── …604.json
```

Both the page files and the manifest are **committed to the repo** so builds are
deterministic and need no network.

### 2.1 Page schema (`schemaVersion: 1`)

```jsonc
{
  "page": 42,                 // 1..604, matches filename
  "juz": 3,                   // 1..30
  "hizb": 5,                  // 1..60 (max hizb touched on the page)
  "rub": 17,                  // 1..240 (max rub' touched on the page)
  "surahs": [2],              // chapter ids appearing on the page
  "firstVerse": "2:253",      // first verse on the page (fast "play page")
  "hizbLine": 1,              // 1..15 or null — line carrying the rub' marker
  "hizbLabel": "الحزب",       // Arabic label, or null
  "lines": [ /* ordered 1..15 */ ]
}
```

### 2.2 Line types

```jsonc
// A normal line of Mushaf text.
{ "type": "words", "center": true, "runs": [["2:253", ["ﭑ ﭒ", "ﭓ", "ﭔ"]]] }

// The basmalah line that opens a surah.
{ "type": "basmalah" }

// A surah header / name line.
{ "type": "surah", "chapter": 3 }
```

| Field | Meaning |
|-------|---------|
| `type` | `words` \| `basmalah` \| `surah` |
| `center` | Optional `true` when the line must be centered (pages 1–2 and `CLines` pages). May appear on any line type. |
| `runs` | Array of `[verseKey, [wordText, …]]`, preserving reading order. A line can mix the end of one ayah and the start of the next, hence multiple runs. |
| `chapter` | Chapter id, only on `surah` lines. |

`wordText` is the API's `word.text` — the **page-font glyph text** (e.g. `ﭑ ﭒ`) that matches
`public/fonts/p{N}.woff2`. It is **not** `text_uthmani`; do not substitute one for the other.
Ayah-number markers (`char_type_name: "end"`) are included as ordinary word entries, because
the current UI renders them as part of the line.

---

## 3. Generating the data

```bash
# All 604 pages (resumable, skips valid existing files)
npm run data:fetch

# Selected pages
node scripts/fetch-pages.mjs --only 1,2,42,187,604

# A range, more parallelism, pretty output, custom dir
node scripts/fetch-pages.mjs --from 100 --to 200 --concurrency 8 --pretty
```

| Flag | Default | Effect |
|------|---------|--------|
| `--from N` / `--to N` | `1` / `604` | Page range. |
| `--only 1,2,42` | — | Explicit page list (overrides range). |
| `--concurrency N` | `6` | Parallel requests. |
| `--out DIR` | `public/data` | Output directory. |
| `--force` | off | Refetch even if a valid file exists. |
| `--pretty` | off | Pretty-print page JSON (default minified). |
| `--no-manifest` | off | Skip `manifest.json`. |
| `--dry-run` | off | Transform but write nothing. |
| `--retries N` | `5` | Attempts per page with exponential backoff. |

**Resume:** without `--force`, any existing file that parses and has `page` + non-empty `lines`
is reused. Safe to interrupt and restart.

**Source query** is locked in the script (`mushaf=2`, `words=true`, `filter_page_words=true`)
so the glyph text stays aligned with the page fonts. Do not change it without regenerating and
re-validating the whole dataset.

---

## 4. Layout rules the generator encodes

The API gives each word a `line_number` (1–15) but leaves **reserved lines empty** where the
Mushaf prints a basmalah or a surah header. The generator fills those gaps deterministically:

1. **Group** all words by `line_number`, preserving reading order.
2. **Fill gaps**:
   - If the next non-empty line starts a surah (ayah `1`) and it is **not** Surah 9 →
     `basmalah`.
   - If it starts **Surah 9 (At-Tawba)** → `surah` header only. *At-Tawba has no basmalah.*
     (This fixes a real bug in the old runtime heuristic.)
   - Gap at the end of a page → `surah` header, chapter inferred from the next chapter.
   - Pages 1–2 keep their decorative header area behavior (no chapter → line dropped).
3. **Center flags**: page 1, page 2, and every page/line listed in
   `src/utils/CLines.js` (`clines`) get `center: true`.
4. **Metadata**:
   - `juz` from the first verse.
   - `hizb` / `rub` = maximum values touched on the page.
   - `surahs` = chapters whose ayah 1 appears (fallback: first chapter).
   - `hizbLine` / `hizbLabel` only for pages in `src/utils/Hizb.js`
     (`pageshashizbnumber`); the line comes from the rub' verse's first word.
5. **Anomalies** (logged into the manifest, not fatal) cover: basmalah before a non-surah
   start, headers inferred at page end, unknown chapter, empty word lines, `firstVerse`
   mismatch.

---

## 5. Validating

```bash
npm run data:validate

# Partial dataset (skips missing-file errors, e.g. sample runs)
node scripts/validate-pages.mjs --dir /tmp/sample --allow-partial

# Re-fetch pages and compare word counts + first verse
node scripts/validate-pages.mjs --compare 1,2,50,187,604
```

Checks include: all 604 files present; JSON parses; page/juz/hizb/rub/surah ranges; non-empty
`lines` ≤ 15; known line types; non-empty runs and words; verse order never regresses;
`firstVerse` matches the first word run; **Surah 9 never followed by a basmalah**; manifest
schema and per-file stats.

Exit code is non-zero on any error.

---

## 6. Runtime integration

### M2 — done

1. `src/services/localPageService.js` — `loadPage(n)` fetches `/data/pages/{n}.json`, memoized
   in a `Map`, in-flight requests deduped; `preload([n-1, n+1])` warms neighbours (best-effort).
2. `MushafPage.vue` — renders `pageData.lines` directly. The old `verses`, `pageLines`,
   `pageSurah`, `pageJuz`, `hizbNumber`, `rub_el_hizb`, `rubHizbText`, and `hizbLocation`
   logic is gone. `loadFont()` is unchanged. Header uses `pageData.juz` / `pageData.surahs`;
   marker uses `pageData.hizbLine` / `pageData.hizbLabel` / `pageData.hizb`.
3. `currentSurah` is synced in a `watch` (not a computed) and only written when it changes.

### M3 — done

4. `MushafSlider.vue` — `preloadAround()` warms `currentPage ± 2` on init and on every slide change.
5. `vite.config.js` — `json` added to Workbox `globPatterns`; the build precaches all 604 page
   files + manifest (1222 entries total including fonts).
6. `quranServices.getPage` is kept as a legacy wrapper but is no longer on the reading path.

### Possible follow-ups

- Add an explicit API fallback if a local file is ever missing (currently it surfaces an error).
- Remove the legacy `quranServices.getPage` wrapper if no fallback is desired.
- Consider lazy-loading fonts to shrink the ~49 MB precache (see ISSUES #3).

---

## 7. Maintenance

Regenerate (and re-validate) whenever:

- the source query or mushaf edition changes,
- `CLines.js` / `Hizb.js` layout data changes,
- a rendering rule changes (then update `buildLean()` and bump `schemaVersion`).

The dataset is derived data: never hand-edit files in `public/data/pages/`; change the
generator instead. `manifest.json` is regenerated on every run and is the quickest way to spot
anomalies and size regressions.
