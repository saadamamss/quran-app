# Issues, Technical Debt & Roadmap

> A prioritized register of bugs, risks, and improvements. Each item has an ID, severity, evidence, cause, and a suggested fix.
>
> Severity: **🔴 High** (user-visible breakage / data risk) · **🟠 Medium** (degraded UX / maintenance) · **🟡 Low** (cleanup / polish)

---

## Quick index

| ID | Severity | Issue | Area |
|----|----------|-------|------|
| 1 | 🟠 | Missing PWA icons | PWA |
| 2 | 🔴 | Offline reading broken for uncached pages | PWA / data |
| 3 | 🔴 | ~48 MB PWA precache | PWA / perf |
| 4 | 🟠 | Desktop page navigation off-by-one | Navigation |
| 5 | 🟠 | Routing is dead (no `<router-view>`) | Routing |
| 6 | 🟠 | Bookmarks cannot jump to the ayah page | Bookmarks |
| 7 | 🟠 | Side effect inside a computed | State |
| 8 | 🟡 | Dead files with latent errors | Cleanup |
| 9 | 🟡 | Duplicate bookmark stores / unused deps | Cleanup |
| 10 | 🟠 | Settings UI missing; stored settings unused | Feature |
| 11 | 🟠 | No tests, lint, or type checking | Quality |
| 12 | 🟡 | Swiper `virtual` configured but unused | Perf |
| 13 | 🟡 | Audio lacks progress/seek; refetches per ayah | Audio |
| 14 | 🟡 | Hard-coded audio reciter in modal | Audio |
| 15 | 🟡 | Fragile word-hover highlight | UI |
| 16 | 🟡 | API query typo `chizb_number` | Data |
| 17 | 🟡 | CORS workaround headers in page service | Data |
| 18 | 🟡 | Accessibility gaps | A11y |
| 19 | 🟡 | Starter CSS leftovers may affect layout | Styling |
| 20 | 🟡 | Modal refetches on every open | Perf |

---

## 🔴 High severity

### 2. Offline reading broken for uncached pages
- **Evidence:** `vite.config.js` runtime-caches only `api.alquran.cloud/*` and `cdn.islamic.network/quran/audio/*`. Page data comes from `api.qurancdn.com`, which is **not** cached.
- **Symptom:** After going offline, swiping to a page never visited shows a spinner/error.
- **Cause:** Missing Workbox `runtimeCaching` entry for `qurancdn`.
- **Fix:** Add:
  ```js
  {
    urlPattern: /^https:\/\/api\.qurancdn\.com\/api\/qdc\/verses\/by_page\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'quran-pages',
      expiration: { maxEntries: 604, maxAgeSeconds: 60 * 60 * 24 * 90 },
      cacheableResponse: { statuses: [0, 200] },
    },
  }
  ```
  Better: pre-cache page JSON at build time (see #3) or cache-on-demand with a "download for offline" action.
- **Effort:** S

### 3. ~48 MB PWA precache
- **Evidence:** Build log: `precache 617 entries (48129.55 KiB)`. `globPatterns` includes `woff2`.
- **Symptom:** Slow first install/update, high bandwidth/storage, especially on mobile.
- **Cause:** All 604 page fonts are precached eagerly.
- **Fix options:**
  1. Remove `woff2`/`ttf` from `globPatterns`; instead runtime-cache `/fonts/*` with `CacheFirst` as pages load.
  2. Group fonts into chunks and lazy-load only nearby pages (e.g. ±10).
  3. Offer an explicit "download all for offline" flow.
- **Effort:** M

---

## 🟠 Medium severity

### 1. Missing PWA icons
- **Evidence:** `vite.config.js` manifest references `pwa-192x192.png` and `pwa-512x512.png`; `includeAssets` references `apple-touch-icon.png`, `masked-icon.svg`. `public/` contains only `favicon.ico`.
- **Symptom:** Install prompt/icon broken or blank; manifest 404s.
- **Fix:** Add the 4 assets to `public/` (or generate with a PWA asset tool) and rebuild.
- **Effort:** S

### 4. Desktop page navigation off-by-one
- **Evidence:** `quranStore.goToPage(page)` calls `swiperEl.slideTo(page - 1)` and ignores the desktop 2-page offset. `MushafSlider.goToPage(page)` **does** clamp `Math.min(TOTAL_PAGES - 2, page - 1)`.
- **Symptom:** On ≥1200px screens, jumping from search/juz/bookmarks can show the target page shifted by one.
- **Cause:** Two divergent navigation implementations.
- **Fix:** Route all navigation through one method (e.g. store delegates to the slider's `goToPage`, or the slider exposes a `goToPage` that the store calls). Remove the duplicate.
- **Effort:** S

### 5. Routing is dead
- **Evidence:** `src/layouts/default.vue` has no `<router-view>`. Child routes (`HomeView`, `SurahView`, `BookmarksView`) never mount.
- **Symptom:** URL changes do nothing meaningful; views are unreachable.
- **Fix:** Either (a) add `<router-view>` where content should render and move `MushafSlider` into `HomeView`, or (b) delete the unused routes/views and keep a single-screen app (simplest, matches current design).
- **Effort:** S (delete) / M (restructure)

### 6. Bookmarks cannot jump to the ayah page
- **Evidence:** `BookmarksList.goToBookmark` only calls `store.setSelectedAyahKey(...)`. The code comment acknowledges it.
- **Symptom:** Clicking a bookmark opens the modal but stays on the current page.
- **Fix:** Persist `page` on the bookmark (available from the ayah API/`data.data.page`) and call `goToPage(page)`; optionally scroll/flash the word.
- **Effort:** S–M

### 7. Side effect inside a computed
- **Evidence:** `MushafPage.pageSurah` calls `quranStore.setCurrentSurah(...)`, which calls `saveToStorage()` (localStorage write) whenever the computed re-evaluates.
- **Symptom:** Unnecessary storage writes during renders; violates Vue's "computeds are pure" rule; can cause subtle re-render loops.
- **Fix:** Move the update into a `watch` on `verses`/`currentPage` (with `flush: 'post'`), or call it once in `loadPageData`.
- **Effort:** S

### 10. Settings UI missing; stored settings unused
- **Evidence:** `settings` stores `translation` and `fontSize`, but nothing reads them. Header gear button has no handler.
- **Symptom:** Users can't change translation or font size; dead UI.
- **Fix:** Build a settings panel (translation picker, font size, theme, reciter) and wire values into `AyahModal` and `MushafPage` font sizing.
- **Effort:** M

### 11. No tests, lint, or type checking
- **Evidence:** No test runner, ESLint config, or TS. `package.json` has only dev/build/preview/format.
- **Symptom:** Regressions are easy; refactors are risky.
- **Fix:** Add Vitest for pure logic (chapter next/prev, line grouping, juz lookup) and ESLint + `eslint-plugin-vue`. Optionally migrate to TS incrementally.
- **Effort:** M

---

## 🟡 Low severity

### 8. Dead files with latent errors
- **Evidence:**
  - `AyahDisplay.vue` contains a stray `c` statement in `<script setup>` (would throw if mounted).
  - `MushafDisplay.vue` imports `Ayah.vue` but uses `<ayah-display>` (unresolved component).
  - `SideNav.vue`, `Ayah.vue`, `views/*`, `stores/counter.js`, `stores/bookmarks.js` are unused.
- **Fix:** Delete unused files, or fix them if you plan to reuse. Removing them shrinks the mental surface.
- **Effort:** S

### 9. Duplicate bookmark stores and unused deps
- **Evidence:** `quranStore.bookmarks` is used; `stores/bookmarks.js` is not. `pinia-plugin-persistedstate` is installed but unused. `quran-json` is a dependency and imported in `MushafPage` but never used. Swiper `Mousewheel` imported while `:mousewheel="false"`.
- **Fix:** Remove the dead store, unused deps/imports, and the unused Swiper module.
- **Effort:** S

### 12. Swiper `virtual` configured but unused
- **Evidence:** `MushafSlider` passes `:virtual="virtualOptions"` but renders slides with `v-for="(page) in 604"`.
- **Symptom:** 604 slide DOM nodes exist (content gated by `v-if`), limiting the benefit.
- **Fix:** Implement true virtual slides (`v-swiper:virtual` / `swiper-slide-virtual`) or remove the virtual config to avoid confusion.
- **Effort:** M

### 13. Audio lacks progress/seek; refetches per ayah
- **Evidence:** `audioStore.playAyah` fetches `api.alquran.cloud/v1/ayah/{key}/{reciter}` for every ayah. No `timeupdate` handling or seek UI.
- **Fix:** Build the static CDN URL from the global ayah number (requires a mapping) or cache metadata; add a progress bar with `timeupdate`/`currentTime`.
- **Effort:** M

### 14. Hard-coded audio reciter in modal
- **Evidence:** `AyahModal` builds `audio` with `ar.alafasy` regardless of `audioStore.reciter`. (Field is unused because playback goes through the store, but it's misleading.)
- **Fix:** Remove the unused field or derive it from the selected reciter.
- **Effort:** S

### 15. Fragile word-hover highlight
- **Evidence:** `MushafPage.wordhovered` uses `document.getElementsByClassName(e.target.className)` and adds `.hoverd`. Class strings contain many tokens; matching by full className is brittle.
- **Fix:** Use a reactive `hoveredVerseKey` in the store/component and bind a class, or use `data-*` attributes.
- **Effort:** S

### 16. API query typo `chizb_number`
- **Evidence:** `quranServices.getPage` includes `fields=...,chizb_number,...`.
- **Fix:** Correct to `hizb_number` (verify the API's accepted fields).
- **Effort:** S

### 17. CORS workaround headers in page service
- **Evidence:** `getPage` sends browser-like headers + `referrer: 'https://quran.com/'`.
- **Risk:** Fragile; may break if the CDN changes CORS policy.
- **Fix:** Prefer a documented API/endpoint; or proxy at build/deploy time.
- **Effort:** S–M

### 18. Accessibility gaps
- **Evidence:** Icon-only buttons (header gear, stop, prev/next) lack `aria-label`; clickable `<span>` words aren't keyboard-focusable; modal has no focus trap/Escape handler.
- **Fix:** Add labels, `tabindex`/`role` or real buttons, focus trap, and `Esc` to close.
- **Effort:** M

### 19. Starter CSS leftovers may affect layout
- **Evidence:** `src/assets/main.css` sets `body { display: flex }` at ≥1024px, and `#app { height: auto }`, while the shell uses `h-screen`.
- **Fix:** Remove starter CSS not needed by the app; keep only Tailwind entry.
- **Effort:** S

### 20. Modal refetches on every open
- **Evidence:** `AyahModal.fetchAyahDetails` runs 3 network calls each time `selectedAyahKey` changes.
- **Fix:** Add an in-memory cache keyed by `verse_key` (or rely on the SW cache). Consider `Promise.all`.
- **Effort:** S

---

## Roadmap

### Phase 0 — Stabilize (quick wins, ~1 day)
- [ ] Add PWA icons (#1)
- [ ] Unify page navigation; fix desktop off-by-one (#4)
- [ ] Remove dead files, stores, imports, deps (#8, #9, #15 partial)
- [ ] Fix `chizb_number` typo (#16)
- [ ] Remove starter CSS leftovers (#19)

### Phase 1 — Offline & performance (~2–4 days)
- [ ] Runtime-cache `qurancdn` page API (#2)
- [ ] Shrink precache / lazy-load fonts (#3)
- [ ] Implement true Swiper virtualization or drop the config (#12)
- [ ] Cache ayah details in the modal (#20)

### Phase 2 — UX & correctness (~1 week)
- [ ] Persist bookmark page and jump to it (#6)
- [ ] Move computed side effects into watchers (#7)
- [ ] Settings panel: translation, font size, theme, reciter (#10)
- [ ] Audio progress bar + seek (#13)
- [ ] Accessibility pass (#18)

### Phase 3 — Sustainability (~ongoing)
- [ ] Add Vitest + ESLint (#11)
- [ ] Decide routing: delete or restructure (#5)
- [ ] Generate `chapters`/`FPCH`/`JUZ` from `quran-json` to prevent drift
- [ ] Document data update procedure

---

## How to use this register

1. Pick an item by severity or roadmap phase.
2. Read the linked section, confirm the evidence still applies.
3. Implement the fix and update [STATUS.md](./STATUS.md).
4. Move the item to a "Done" list or delete it here.
