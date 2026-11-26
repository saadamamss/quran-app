# File-by-file Reference

> Purpose of every tracked source file, key functions, and whether it is **active**, **legacy**, or **stub**.
>
> Legend: ✅ active · ⚠️ partially used / fragile · 🗑️ unused (safe to remove) · 📦 data only

---

## Entry & shell

| File | Status | Purpose | Key items |
|------|--------|---------|-----------|
| `index.html` | ✅ | RTL document shell. Pre-paint theme script, global `@font-face` declarations. | `#app`, inline dark-mode bootstrap, `surah-name` / `othmani` / `thuluth` fonts |
| `src/main.js` | ✅ | App bootstrap. | `createApp`, `createPinia`, `router`, `mount('#app')` |
| `src/App.vue` | ✅ | Root component. Mounts the router outlet + global overlays. | `<router-view/>`, `<AyahModal/>`, `<AudioPlayer/>`, applies persisted theme on mount |
| `src/router/index.js` | ⚠️ | Route table (nested under `DefaultLayout`). Children never render because layout lacks `<router-view>`. | `/` → home, `/surah/:number` → surah, `/bookmarks` → bookmarks |
| `src/layouts/default.vue` | ✅ | Main app shell. | Header (surah/juz/page status, theme toggle), collapsible sidebar with Surahs/Juz/Bookmarks tabs, `<MushafSlider/>`, mobile overlay |
| `src/assets/main.css` | ⚠️ | Tailwind entry + starter CSS. | `@import './base.css'`; note `body { display:flex }` at ≥1024px (starter leftover) |
| `src/assets/base.css` | ⚠️ | Tailwind directives + Vue starter palette. | `@tailwind base/components/utilities`, CSS variables, body typography |
| `src/assets/logo.svg` | 🗑️ | Vue starter asset. | — |

---

## Components

### Active

| File | Purpose | Key functions / notes |
|------|---------|----------------------|
| `src/components/MushafSlider.vue` | Swiper of 604 pages. | `onSwiperInit` (registers swiper in store), `onSlideChange` (writes `currentPage`), `isActive(page)` (render window), `goToPage` (local, desktop-aware), breakpoint `1200` → 2 pages |
| `src/components/MushafPage.vue` | **Core renderer.** Loads the precomputed page JSON, injects the page font, renders `pageData.lines`. | `loadFont`, `loadPageData`, `lines`/`surahs`/`juzName`/`hizbLine`/`hizbLabel`/`hizbNumber` computeds, `wordhovered/wordunhovered` (className-based highlight) |
| `src/components/AudioPlayer.vue` | Bottom playback bar + reciter picker + continuous toggle. Also a floating "listen to page" button. | `startPlayback` (selected ayah → else first verse of page), `currentSurahName`, `currentReciterName` |
| `src/components/AyahModal.vue` | Ayah detail sheet: Arabic, English translation, Muyassar tafsir, listen, bookmark. | `fetchAyahDetails` (3 API calls), `toggleAudio`, `toggleBookmark`, `isBookmarked`, `activeTab` |
| `src/components/SearchBar.vue` | Debounced ayah search with dropdown. | `handleInput` (500 ms, min 3 chars), `performSearch`, `goToResult`, local `vClickOutside` directive |
| `src/components/SurahList.vue` | List of 114 surahs; jumps to surah start page. | `selectSurah` (uses `FPCh[number-1]`), `isCurrentSurah` |
| `src/components/JuzList.vue` | List of 30 juz; jumps to start page. | `selectJuz`, `isCurrentJuz` |
| `src/components/BookmarksList.vue` | Sidebar bookmark cards with delete. | `goToBookmark` (only sets `selectedAyahKey` — does **not** navigate to page) |
| `src/components/ThemeToggle.vue` | Light/dark switch. | `toggleTheme`, `darkMode` |
| `src/components/basmalah.vue` | SVG basmalah glyph. | Inline SVG path, `currentColor` |

### Legacy / unused

| File | Status | Why unused / issue |
|------|--------|--------------------|
| `src/components/SideNav.vue` | 🗑️ | Older sidebar; `default.vue` implements its own sidebar. |
| `src/components/MushafDisplay.vue` | 🗑️ | Older 2-column renderer. Imports `Ayah.vue` but template uses `<ayah-display>` (unresolved). Never imported. |
| `src/components/Ayah.vue` | 🗑️ | Simple ayah display used only by `MushafDisplay`. |
| `src/components/AyahDisplay.vue` | 🗑️ | Older surah viewer. Contains a **stray `c` statement** in `<script setup>` (ReferenceError if ever mounted). Never imported. |

---

## Stores

| File | Status | Purpose |
|------|--------|---------|
| `src/stores/quranStore.js` | ✅ | Reader state: bookmarks, current page/surah, settings, selected ayah, page→first-verse map, swiper instance. Storage key `quran_app_data_v2`. |
| `src/stores/audioStore.js` | ✅ | Reciter, playback element, continuous mode, next/prev. Storage key `quran_audio_data_v2`. |
| `src/stores/bookmarks.js` | 🗑️ | Duplicate bookmark store (`quran-bookmarks` key). Never imported. |
| `src/stores/counter.js` | 🗑️ | Vue starter demo store. Never imported. |

---

## Services

| File | Status | Purpose |
|------|--------|---------|
| `src/services/localPageService.js` | ✅ | Loads `public/data/pages/{n}.json`; in-memory cache + in-flight dedupe; `preload()` for neighbouring pages. |
| `src/services/fontService.js` | ✅ | Injects per-page `@font-face`, waits for `document.fonts.check()`, dedupes/preloads. Rendering is gated on it because glyphs are private-use codepoints. |
| `src/services/quranServices.js` | ✅ | `getSurahs()`, `getSurah(n, translation)`, `search(q)` (alquran.cloud). The old quran.com `getPage(n)` wrapper was removed with the local-dataset migration. |

---

## Views (stubs)

| File | Status | Notes |
|------|--------|-------|
| `src/views/HomeView.vue` | 🗑️ | Renders `<h1>Home</h1>`. Never shown (no `<router-view>` in layout). |
| `src/views/SurahView.vue` | 🗑️ | "This is an about page" placeholder. Never shown. |
| `src/views/BookmarksView.vue` | 🗑️ | Empty `<template>`. Never shown. |

---

## Data / utils (📦 data only unless noted)

| File | Status | Contents |
|------|--------|----------|
| `src/chapters.js` | 📦 | `chapters` object keyed 1–114: `name`, `transliteration_en`, `translation_en`, `total_verses`, `revelation_type`, `juz`. |
| `src/utils/FPCH.js` | 📦 | `FPCh` array (114 entries): first page of each surah. |
| `src/utils/JUZ.js` | 📦 | `JUZ` object (1–30): `{ name, startpage, startatchapt }`. |
| `src/utils/Hizb.js` | 📦 | `hizpdata` (page → hizb/rub/position) and `pageshashizbnumber` (pages that show a rub marker). |
| `src/utils/CLines.js` | 📦 | `clines` map of page → line numbers that must be center-aligned. |

---

## Config & tooling

| File | Purpose | Notes |
|------|---------|-------|
| `package.json` | Scripts + deps. | `dev`, `build`, `preview`, `format`. |
| `vite.config.js` | Vite plugins + alias + PWA/Workbox. | `@` → `src`; PWA precaches `woff2` (large); runtime-caches alquran.cloud + islamic.network. |
| `tailwind.config.js` | Tailwind theme. | `darkMode: 'class'`, `fontFamily.arabic`, `quran.*` colors. Written as CJS inside an ESM package (works via loader, inconsistent). |
| `postcss.config.js` | PostCSS plugins. | `tailwindcss`, `autoprefixer`. |
| `jsconfig.json` | Editor path alias. | `@/*` → `./src/*`. |
| `.prettierrc.json` | Format rules. | No semicolons, single quotes, width 100. |
| `.gitignore` | Ignores. | `node_modules`, `dist`, logs, editor dirs. |
| `.vscode/` | Editor settings. | Not tracked except extensions/settings. |

---

## Generated / external (not in git)

| Path | Notes |
|------|-------|
| `node_modules/` | Installed deps. May contain platform-specific Rollup binary (see DEV_GUIDE troubleshooting). |
| `dist/` | Build output (gitignored). |
| `public/fonts/p1.woff2 … p604.woff2` | Per-page fonts served at `/fonts/p{N}.woff2`. |
| `public/fonts/{sura_names,thuluth,UthmanicHafs1Ver18,Untitled1}` + 2 KFGQPC TTFs | UI/header fonts. |
