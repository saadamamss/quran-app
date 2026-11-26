# APIs, Data & Persistence

> Everything the app reads from the network and stores locally.

---

## 1. External APIs

### 1.1 Page data — quran.com CDN (`qurancdn.com`) — source only

This endpoint is **no longer called at runtime** for reading. It is the source used by
`scripts/fetch-pages.mjs` to generate the committed local dataset
(`public/data/pages/*.json`). `quranServices.getPage` is kept as a legacy/reference wrapper;
`MushafPage.vue` now uses `localPageService` instead (see §2).

```
GET https://api.qurancdn.com/api/qdc/verses/by_page/{page}
    ?words=true
    &per_page=all
    &fields=text_uthmani,chapter_id,chizb_number,text_imlaei_simple
    &reciter=7
    &word_translation_language=en
    &word_fields=verse_key,verse_id,page_number,location,text_uthmani,code_v1,qpc_uthmani_hafs
    &mushaf=2
    &filter_page_words=true
    &from=0:0
    &to=0:0
```

> Note: the query string contains a typo `chizb_number` (should likely be `hizb_number`). The component relies on `hizb_number`/`rub_el_hizb_number` from the returned words/verses, which the API provides regardless.

**Response (shape used by the app):**

```jsonc
{
  "verses": [
    {
      "id": 262,
      "verse_key": "2:255",
      "verse_number": 255,
      "chapter_id": 2,
      "juz_number": 3,
      "hizb_number": 6,
      "rub_el_hizb_number": 22,
      "text_uthmani": "...",
      "page_number": 42,
      "words": [
        {
          "id": 1,
          "location": "2:255:1",
          "verse_key": "2:255",
          "position": 1,
          "line_number": 5,
          "text": "اللَّهُ",
          "text_uthmani": "ٱللَّهُ",
          "code_v1": "...",
          "page_number": 42
        }
      ]
    }
  ],
  "pagination": { "...": "..." }
}
```

**Fields the UI depends on:**

| Field | Used for |
|-------|----------|
| `verses[].words[].line_number` | Grouping words into the 15 lines |
| `verses[].words[].text` | Rendered glyph text |
| `verses[].words[].verse_key` | Click → modal; audio highlight |
| `verses[].words[].location` | Vue `:key` |
| `verses[].verse_number` | Detect ayah 1 (surah starts) |
| `verses[].chapter_id` | Surah headers / page header |
| `verses[].juz_number` | Juz label (`pageJuz`) |
| `verses[].hizb_number`, `rub_el_hizb_number` | Hizb marker |
| `verses[].words[0].line_number` | Rub marker vertical position |

**CORS note:** `quranServices.getPage` sends a `referrer: 'https://quran.com/'` and browser-like headers. This is a workaround for the CDN's CORS policy and is fragile across environments. It only matters if the legacy wrapper is used; runtime reading no longer depends on it.

---

### 1.2 Ayah details — alquran.cloud

Used by `AyahModal.vue` (3 parallel-ish fetches per open) and `audioStore.js`.

| Purpose | Endpoint | Notes |
|---------|----------|-------|
| Arabic text | `GET https://api.alquran.cloud/v1/ayah/{key}/ar.sahih` | `key = "2:255"` |
| English translation | `GET https://api.alquran.cloud/v1/ayah/{key}/en.sahih` | Sahih International |
| Tafsir | `GET https://api.alquran.cloud/v1/ayah/{key}/ar.muyassar` | التفسير الميسر |
| Audio | `GET https://api.alquran.cloud/v1/ayah/{key}/{reciter}` | Returns `data.audio` (mp3 URL) and `data.page` |
| Search | `GET https://api.alquran.cloud/v1/search/{query}/all/ar.sahih` | Returns `data.matches[]` |
| Surah list | `GET https://api.alquran.cloud/v1/surah` | Wrapper exists, unused |
| Surah | `GET https://api.alquran.cloud/v1/surah/{n}/{translation}` | Wrapper exists, unused |

**Ayah response (shape used):**

```jsonc
{
  "code": 200,
  "status": "OK",
  "data": {
    "number": 262,                 // global ayah number (1..6236)
    "text": "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ...",
    "numberInSurah": 255,
    "juz": 3,
    "page": 42,
    "surah": { "number": 2, "name": "سورة البقرة", "englishName": "Al-Baqara" },
    "audio": "https://cdn.islamic.network/quran/audio/128/ar.alafasy/262.mp3"
  }
}
```

**Search response (shape used):**

```jsonc
{
  "data": {
    "count": 12,
    "matches": [
      {
        "number": 262,
        "text": "...",
        "surah": { "number": 2, "name": "سورة البقرة" },
        "numberInSurah": 255,
        "page": 42
      }
    ]
  }
}
```

> `AyahModal` builds an audio URL from `data.data.number` (global number) with `ar.alafasy` **hard-coded**, ignoring the selected reciter. The play button, however, calls `audioStore.togglePlay`, which uses the selected reciter. The stored `ayahData.audio` field is therefore effectively unused.

---

### 1.3 Audio CDN

`https://cdn.islamic.network/quran/audio/128/{reciter}/{globalAyahNumber}.mp3`

- Reciter IDs used: `ar.alafasy`, `ar.minshawi`, `ar.husary`, `ar.abdulsamad`, `ar.abdurrahmaansudais`, `ar.hudhaify`.
- Cached by the service worker (CacheFirst, 100 entries, 7 days).

---

### 1.4 External texture

`MushafPage.vue` loads `https://www.transparenttextures.com/patterns/paper-fibers.png` for a subtle paper overlay. Cosmetic; missing offline.

---

## 2. Local datasets

### `public/data/` — generated page dataset (604 files + manifest)

Precomputed, committed Mushaf page data produced by `scripts/fetch-pages.mjs` and checked by
`scripts/validate-pages.mjs`. One minified JSON per page under `public/data/pages/{n}.json`
(~1.6 KB average, ~965 KB raw / ~335 KB gzip total) plus `public/data/manifest.json`.
Each file contains the page metadata (`juz`, `hizb`, `rub`, `surahs`, `firstVerse`,
`hizbLine`, `hizbLabel`) and the 15 precomputed `lines[]` (word runs, basmalahs, surah
headers, centering flags). This replaces the old runtime derivation from the quran.com page
API. Full schema and rules: **[PAGE_DATA_PIPELINE.md](./PAGE_DATA_PIPELINE.md)**.

The remaining datasets below are **hand-maintained** JS modules. Keep them in sync if the
Mushaf edition changes; the generator also reads `CLines.js` and `Hizb.js`.

### `src/chapters.js`
```js
chapters[1] = {
  number: 1,
  name: 'سورة الفاتحة',
  transliteration_en: 'Al-Faatiha',
  translation_en: 'The Opening',
  total_verses: 7,
  revelation_type: 'مكية',   // or 'مدنية'
  juz: 1,
}
```
Used by: `default.vue` (header name), `AudioPlayer` (names + next/prev), `AyahModal` (name), `SurahList` (metadata), `BookmarksList`.

### `src/utils/FPCH.js`
`FPCh[0..113]` = first page of surah 1..114. Used by `SurahList` to jump.

### `src/utils/JUZ.js`
`JUZ[1..30] = { name, startpage, startatchapt }`. Used by `JuzList`, `default.vue` (current juz), `MushafPage` (juz label).

### `src/utils/Hizb.js`
- `hizpdata`: page → `{ hizbNumber, rub_el_hizb_number, hizbstartpos, chapter_number }`.
- `pageshashizbnumber`: array of pages that display a rub marker.
Consumed by the page generator (`scripts/fetch-pages.mjs`) to precompute `hizbLine`/`hizbLabel`; `MushafPage` reads those fields from the page JSON.

### `src/utils/CLines.js`
`clines = { page: [lineNumbers...] }` for lines that must be centered (e.g. `604: [4, 9, 14, 15]`). Consumed by the generator to set the per-line `center` flag; `MushafPage` just reads `line.center`.

---

## 3. Fonts

| Font | Path | Used for |
|------|------|----------|
| Per-page | `/fonts/p{N}.woff2` (N = 1..604) | Exact Mushaf line layout for page N |
| `surah-name` | `/fonts/sura_names.woff2` | Surah names + stylized numbers (`.surahname`, `.surah-header-font`) |
| `othmani` | `/fonts/UthmanicHafs1Ver18.woff2` | Uthmani text (declared; limited direct use) |
| `thuluth` | `/fonts/thuluth.ttf` | Decorative headings (`.thuluth`) |
| KFGQPC Hafs | 2 `.ttf` files | Declared, not currently referenced in CSS |
| `Untitled1.woff2` | — | Unreferenced |

Total `public/fonts` size ≈ **49 MB**, **610 files** (604 page fonts + 6 extras).

---

## 4. Persistence keys (localStorage)

| Key | Owner | Contents |
|-----|-------|----------|
| `quran_app_data_v2` | `quranStore` + `index.html` bootstrap | `{ bookmarks, currentSurah, currentPage, lastRead, settings }` |
| `quran_audio_data_v2` | `audioStore` | `{ reciter, isContinuous }` |
| `quran-bookmarks` | legacy `stores/bookmarks.js` | unused |

**What is NOT persisted:** `selectedAyahKey`, `pageFirstVerseKeys`, `swiperEl`, playback position, scroll/zoom, search history.

---

## 5. Service-worker caching matrix

| Resource | Precached | Runtime cached | Offline? |
|----------|-----------|----------------|----------|
| App JS/CSS/HTML | ✅ | — | ✅ |
| All 604 page fonts | ✅ (~48 MB) | — | ✅ (heavy) |
| Local page JSON (`/data/pages/*.json`) | ✅ (~1 MB) | — | ✅ |
| alquran.cloud API | ❌ | ✅ CacheFirst 30d | ✅ after first use |
| islamic.network audio | ❌ | ✅ CacheFirst 7d | ✅ after first play |
| qurancdn page API | ❌ | ❌ | — no longer used at runtime |
| transparenttextures PNG | ❌ | ❌ | ❌ |

**Impact:** page text now comes from the app's own origin and is precached, so reading works
fully offline with no CORS dependency. See [ISSUES.md](./ISSUES.md).
