# Quran App — Documentation Hub

> **Purpose:** A durable knowledge base for studying, analyzing, maintaining, and improving this project. Read these docs before touching code.
>
> **Last analyzed:** 2026-11-26 · **App version:** 0.0.0 · **Branch:** `main`

---

## Start here (reading order)

| # | Document | What it answers | Time |
|---|----------|-----------------|------|
| 1 | **[STATUS.md](./STATUS.md)** | What works, what doesn't, health metrics, build result | 5 min |
| 2 | **[ARCHITECTURE.md](./ARCHITECTURE.md)** | How the app is wired: rendering pipeline, audio, state, routing | 15 min |
| 3 | **[FILES.md](./FILES.md)** | Every file: purpose, key functions, active/dead | 10 min |
| 4 | **[API_AND_DATA.md](./API_AND_DATA.md)** | External APIs, schemas, local datasets, persistence keys | 10 min |
| 5 | **[ISSUES.md](./ISSUES.md)** | Bugs, risks, technical debt, prioritized roadmap | 10 min |
| 6 | **[DEV_GUIDE.md](./DEV_GUIDE.md)** | Setup, scripts, conventions, recipes, troubleshooting | 10 min |
| 7 | **[PAGE_DATA_PIPELINE.md](./PAGE_DATA_PIPELINE.md)** | How the 604 local page JSONs are generated, validated, and consumed | 5 min |

---

## 60-second summary

A **Vue 3 + Vite** web app that renders the **Madinah Mushaf** (Hafs narration) page-by-page. Each of the **604 pages** is drawn with its own embedded Uthmanic `.woff2` font, so the Arabic glyph layout matches the printed Mushaf. Page text comes from a **committed local dataset** (`public/data/pages/*.json`, generated from the quran.com CDN API); audio, translation, and tafsir come from **alquran.cloud**. State is persisted manually in `localStorage` via Pinia stores. It is a **PWA** with offline text/fonts (install icons still missing).

**One-line mental model:**

> `Swiper (604 slides)` → `MushafPage` (load local page JSON → render precomputed lines with `p{N}` font) → click word → `AyahModal` / `AudioPlayer`.

---

## Status at a glance

| Area | State |
|------|-------|
| Production build | ✅ Passes (`vite build`, ~13 s) |
| Reading / page navigation | ✅ Working |
| Desktop 2-page view | ✅ Working (with an off-by-one navigation caveat) |
| Audio playback + continuous mode | ✅ Working |
| Translation / tafsir modal | ✅ Working |
| Bookmarks | ⚠️ Works, but cannot jump to the ayah's page |
| Search | ⚠️ Works, depends on API `page` field |
| Dark mode | ✅ Working |
| PWA / offline | ⚠️ Text + fonts precached; install icons missing |
| Routing (Home/Surah/Bookmarks views) | ❌ Dead — layout has no `<router-view>` |
| Tests / lint / type-check | ❌ None configured |

Full detail: **[STATUS.md](./STATUS.md)**.

---

## Tech stack

| Concern | Choice | Version |
|---------|--------|---------|
| UI framework | Vue 3 (Composition API, `<script setup>`) | `^3.5.13` |
| Build tool | Vite | `^6.2.4` (installed 6.3.5) |
| State | Pinia (manual localStorage persistence) | `^3.0.1` |
| Routing | Vue Router (HTML5 history) | `^4.5.0` |
| Styling | Tailwind CSS + scoped CSS | `^3.4.17` |
| Carousel | Swiper (Virtual, Keyboard modules) | `^11.2.8` |
| PWA | vite-plugin-pwa (Workbox `generateSW`) | `^1.2.0` |
| Devtools | vite-plugin-vue-devtools | `^7.7.2` |
| Formatting | Prettier (no semicolons, single quotes, width 100) | `3.5.3` |

Runtime verified with **Node v24.15.0 / npm 11.12.1**.

---

## Repository layout (high level)

```
quran-app/
├── docs/                     ← you are here
├── public/
│   ├── data/                 ← generated local page dataset (604 JSON + manifest)
│   ├── favicon.ico
│   └── fonts/                ← 604 page fonts (p1…p604.woff2) + 6 extras (~49 MB)
├── src/
│   ├── App.vue               ← root: router-view + AyahModal + AudioPlayer
│   ├── main.js               ← createApp + Pinia + Router
│   ├── chapters.js           ← 114 surah metadata
│   ├── router/index.js       ← 3 routes (nested under default layout)
│   ├── layouts/default.vue   ← app shell (header + sidebar + MushafSlider)
│   ├── components/           ← 15 components (≈7 active)
│   ├── stores/               ← 4 stores (2 active, 2 legacy)
│   ├── services/             ← external API wrappers
│   ├── utils/                ← hand-maintained Quran datasets
│   ├── views/                ← 3 stub views (never rendered)
│   └── assets/               ← Tailwind entry + base CSS
├── index.html                ← RTL shell, anti-flicker theme script, font-faces
├── vite.config.js            ← Vue, DevTools, PWA/Workbox, `@` alias
├── tailwind.config.js        ← dark mode `class`, fonts, colors
├── postcss.config.js
├── jsconfig.json             ← `@/*` path alias for editor
└── package.json
```

Full file-by-file reference: **[FILES.md](./FILES.md)**.

---

## Glossary (Arabic + technical)

| Term | Meaning |
|------|---------|
| **Mushaf** | The bound, printed Quran (as opposed to a digital list of surahs). |
| **Surah** | A chapter of the Quran (114 total). |
| **Ayah** | A verse. |
| **Juz** | One of 30 equal reading parts of the Quran. |
| **Hizb** | Half of a juz (60 total). |
| **Rub' al-Hizb** | Quarter of a hizb (240 total); a reading marker. |
| **Basmalah** | The phrase "بسم الله الرحمن الرحيم" opening most surahs. |
| **Uthmani script** | The standardized Quranic orthography used in printed Mushafs. |
| **Hafs** | The most common narration (qira'ah) of the Quran. |
| **Madinah Mushaf** | The 604-page printed layout this app imitates. |
| **Page font (`p{N}`)** | A per-page font whose glyph widths reproduce that page's exact line layout. |
| **Verse key** | Identifier `"surah:ayah"` (e.g. `2:255`). |
| **Location** | Word-level identifier `"surah:ayah:word"` (e.g. `2:255:3`). |
| **SW / Workbox** | Service Worker; Workbox is the caching library used by the PWA plugin. |

---

## How to keep these docs useful

- Update **STATUS.md** and **ISSUES.md** whenever behavior or priorities change.
- When adding/removing a file, update **FILES.md**.
- When an API or storage key changes, update **API_AND_DATA.md**.
- Keep line-number references soft (file + function name) so docs survive refactors.
