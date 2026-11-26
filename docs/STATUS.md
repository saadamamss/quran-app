# Project Status

> Snapshot of health, features, and metrics. **Last analyzed: 2026-11-26.**
> Update this file whenever behavior or priorities change.

---

## 1. Health dashboard

| Check | Result | Evidence |
|-------|--------|----------|
| Production build | ✅ Pass | `npm run build` → `✓ 104 modules transformed`, built in ~13 s |
| Bundle size | ✅ Reasonable | JS 280.64 kB (95.69 kB gzip), CSS 40.34 kB (9.75 kB gzip) |
| Dev server | ✅ Expected to run | `npm run dev` (Vite) — not re-verified this session |
| Unit tests | ❌ None | No test runner configured |
| Lint | ❌ None | No ESLint configured |
| Type checking | ❌ None | Plain JS + `jsconfig.json` aliases only |
| Formatting | ✅ Prettier | `npm run format` |
| PWA generation | ⚠️ Builds with gaps | SW generated; icons missing; page API not cached |
| Git working tree | ✅ Clean | No uncommitted changes |

> **Build note:** the first build failed on Linux because `node_modules` contained the **Windows** Rollup binary (`rollup-win32-x64-msvc`). Installing `@rollup/rollup-linux-x64-gnu@4.44.0` (no tracked-file change) fixed it. See [DEV_GUIDE.md](./DEV_GUIDE.md#5-debugging-tips).

---

## 2. Feature matrix

| Feature | Status | Where | Notes |
|---------|--------|-------|-------|
| Render 604-page Mushaf | ✅ Working | `MushafSlider`, `MushafPage` | Precomputed lines from local JSON; per-page fonts |
| RTL page swiping | ✅ Working | `MushafSlider` | Swiper `rtl: true` |
| Desktop 2-page spread | ✅ Working | `MushafSlider` breakpoint `1200` | Navigation from other components can land off-by-one (see ISSUES) |
| Page persistence | ✅ Working | `quranStore.currentPage` | Restored on reload; initial slide = page − 1 |
| Surah navigation | ✅ Working | `SurahList` + `FPCH` | Jumps to surah start page |
| Juz navigation | ✅ Working | `JuzList` + `JUZ` | Jumps to juz start page |
| Page header (juz + surah) | ✅ Working | `MushafPage` | From `pageData.juz` / `pageData.surahs` |
| Basmalah rendering | ✅ Working | Precomputed page data + `basmalah.vue` | Surah 9 correctly has no basmalah |
| Surah-name header lines | ✅ Working | Precomputed page data | Chapters resolved at generation time |
| Hizb / rub' markers | ✅ Working | `MushafPage` + `pageData.hizbLine` | Precomputed label + line |
| Word click → modal | ✅ Working | `MushafPage` → `AyahModal` | Opens on `selectedAyahKey` |
| Translation (EN) | ✅ Working | `AyahModal` | `en.sahih` |
| Tafsir (Muyassar) | ✅ Working | `AyahModal` | `ar.muyassar` |
| Reciter selection | ✅ Working | `AudioPlayer` + `audioStore` | 6 reciters, persisted |
| Play / pause / prev / next | ✅ Working | `AudioPlayer` + `audioStore` | Per-ayah audio |
| Continuous playback | ✅ Working | `audioStore.playNextAyah` | Default ON, persisted |
| Auto page flip during audio | ✅ Working | `audioStore.playAyah` | Flips when ayah page differs |
| "Listen to page" floating button | ⚠️ Works when page loaded | `AudioPlayer.startPlayback` | Needs `pageFirstVerseKeys[currentPage]` |
| Search ayahs | ⚠️ Works, API-dependent | `SearchBar` | Assumes `page` in results |
| Bookmarks (add/remove/list) | ✅ Working | `quranStore` + `BookmarksList` | Persisted |
| Bookmark → jump to ayah | ❌ Missing | `BookmarksList.goToBookmark` | Only opens modal, no page navigation |
| Dark mode | ✅ Working | `ThemeToggle` + `index.html` | No flash on load |
| Settings (font size / translation) | ⚠️ Partial | `quranStore.settings` | Stored but no UI controls consume `fontSize`/`translation` |
| Settings gear button | ❌ No-op | `default.vue` header | Button rendered without handler |
| PWA install | ⚠️ Partial | `vite.config.js` | Manifest icons missing |
| Offline reading | ✅ Working | SW precache | Page JSON + fonts + app shell are precached |
| Routing to views | ❌ Dead | `default.vue` | No `<router-view>` for children |
| Keyboard navigation | ⚠️ Swiper Keyboard module enabled | `MushafSlider` | Arrow keys may work; not documented/tested |
| Accessibility | ❌ Weak | Many components | Icon-only buttons lack labels; clickable spans not focusable; no focus trap in modal |

---

## 3. Code metrics

| Metric | Value |
|--------|-------|
| Source files (`.vue/.js/.css`) | **34** |
| Total source lines | **5,446** |
| Largest logic file | `src/components/AyahModal.vue` (348) |
| Largest data file | `src/utils/Hizb.js` (1,455) |
| Components | 15 (≈10 active, 4 legacy) |
| Stores | 4 (2 active, 2 legacy) |
| Views | 3 (all stubs) |
| External API hosts | 2 runtime (`alquran.cloud`, `islamic.network`) + `qurancdn` (build-time) + 1 texture host |
| Public font files | 610 (~49 MB) |
| Generated page files | 604 JSON (~965 KB raw / ~335 KB gzip) |
| Precache entries (build) | 1222 (~49,193 KiB) |

### Source line breakdown (top files)

| File | Lines |
|------|------:|
| `src/utils/Hizb.js` | 1,455 |
| `src/chapters.js` | 1,031 |
| `src/components/AyahModal.vue` | 348 |
| `src/components/MushafPage.vue` | 344 |
| `src/components/AudioPlayer.vue` | 292 |
| `src/layouts/default.vue` | 263 |
| `src/components/MushafSlider.vue` | 178 |
| `src/stores/audioStore.js` | 175 |
| `src/components/SearchBar.vue` | 136 |
| `src/components/MushafDisplay.vue` | 131 |
| `src/utils/FPCH.js` | 117 |

---

## 4. Data completeness

| Dataset | Entries | Complete? |
|---------|---------|-----------|
| `chapters` | 114 | ✅ |
| `FPCh` (surah start pages) | 114 | ✅ |
| `JUZ` | 30 | ✅ |
| `hizpdata` | 240 rub' entries (sampled) | ✅ appears complete |
| `clines` | 11 pages | ⚠️ only pages needing centering |
| Page fonts | 604 | ✅ |

---

## 5. Risk summary

| Risk | Severity | Link |
|------|----------|------|
| Offline reading fails for uncached pages | High | [ISSUES #2](./ISSUES.md#2-offline-reading-broken-for-uncached-pages) |
| ~48 MB PWA precache | High | [ISSUES #3](./ISSUES.md#3-48-mb-pwa-precache) |
| Desktop page-jump off-by-one | Medium | [ISSUES #4](./ISSUES.md#4-desktop-page-navigation-off-by-one) |
| Missing PWA icons | Medium | [ISSUES #1](./ISSUES.md#1-missing-pwa-icons) |
| Dead routes / views | Medium | [ISSUES #5](./ISSUES.md#5-routing-is-dead) |
| Bookmark cannot jump to page | Medium | [ISSUES #6](./ISSUES.md#6-bookmarks-cannot-jump-to-the-ayah-page) |
| Computed side effect writes storage | Low–Medium | [ISSUES #7](./ISSUES.md#7-side-effect-inside-a-computed) |
| No tests / lint / types | Medium (long-term) | [ISSUES #11](./ISSUES.md#11-no-tests-lint-or-type-checking) |
| Dead files with latent errors | Low | [ISSUES #8](./ISSUES.md#8-dead-files-with-latent-errors) |

---

## 6. Bottom line

The **core reading experience is solid and the build is healthy**. The main work ahead is:
1. Make offline actually work (cache page API) and shrink the precache.
2. Fix navigation consistency (desktop page jumps, bookmark jumps).
3. Remove dead code and consolidate stores.
4. Add tests/lint and a settings UI.

See the prioritized plan in [ISSUES.md](./ISSUES.md#roadmap).
