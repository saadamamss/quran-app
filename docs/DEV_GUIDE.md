# Developer Guide

> Practical guide to running, changing, and debugging the app. Read [ARCHITECTURE.md](./ARCHITECTURE.md) first for the mental model.

---

## 1. Prerequisites

| Tool | Version used |
|------|--------------|
| Node.js | v24.15.0 (any modern LTS should work) |
| npm | 11.12.1 |
| OS | Linux (project was originally set up on Windows — see troubleshooting) |

No backend, database, or API keys are required. The app calls public Quran APIs directly.

---

## 2. Install & run

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server (http://localhost:5173)
npm run build        # production build → dist/
npm run preview      # preview the production build
npm run format       # Prettier over src/
```

### Important: cross-platform `node_modules`

`node_modules` is **not portable across operating systems**. If you copied this folder from Windows to Linux (or vice versa), the build will fail with:

```
Error: Cannot find module @rollup/rollup-linux-x64-gnu
```

Fix (choose one):

```bash
# A) clean reinstall (recommended)
rm -rf node_modules package-lock.json
npm install

# B) install just the missing native binary for this OS
npm install --no-save @rollup/rollup-linux-x64-gnu@4.44.0
```

> This session used option B; `package.json`/`package-lock.json` were not modified. The build then passed.

---

## 3. Conventions

| Topic | Rule |
|-------|------|
| Formatting | Prettier: **no semicolons**, **single quotes**, **print width 100** |
| Components | Vue 3 `<script setup>`, Composition API |
| Imports | Use the `@/` alias for `src/` (e.g. `@/stores/quranStore`) |
| Direction | App is **RTL** (`dir="rtl"` on `<html>`); Arabic text is hard-coded |
| Styling | Tailwind utilities first; scoped `<style>` for special cases |
| State | Pinia options API (`state`/`actions`), manual `localStorage` persistence |
| Naming | Components PascalCase; utility data modules PascalCase (`FPCH.js`, `JUZ.js`) |

> There is no ESLint/TypeScript yet, so match the surrounding style manually.

---

## 4. Recipes (where to change what)

### Add a reciter
1. Add `{ id: 'ar.xxx', name: '...' }` to `audioStore.reciters` in `src/stores/audioStore.js`.
2. Ensure the ID is valid for `https://api.alquran.cloud/v1/ayah/{key}/{reciter}`.
3. It appears automatically in `AudioPlayer`'s reciter dropdown.

### Change the default translation
- The modal hard-codes `en.sahih` in `AyahModal.vue` (`fetchAyahDetails`).
- To make it configurable: read `quranStore.settings.translation` and pass it into the URL. (See [ISSUES #10](./ISSUES.md#10-settings-ui-missing-stored-settings-unused).)

### Change the default theme / initial page
- Theme default: `settings.theme` in `quranStore.js` state.
- Initial page: `currentPage` in `quranStore.js` state (default `1`).
- Remember `index.html` also reads the persisted theme key for no-flash boot.

### Adjust page font size
- `MushafPage.vue` `<style scoped>`: `.mushaf-page { font-size: clamp(16px, 2.8vh, 24px) }` and a `max-width: 640px` override. The `settings.fontSize` value is currently unused — wire it here if you add a control.

### Add a page marker (hizb/rub)
- Data lives in `src/utils/Hizb.js` (`hizpdata`, `pageshashizbnumber`).
- Rendering logic: `MushafPage.vue` → `hizbNumber`, `rub_el_hizb`, `rubHizbText`, `hizbLocation`.

### Add a route/view (currently non-functional)
1. `default.vue` has **no `<router-view>`**. Add one where the content should render.
2. Move `<MushafSlider />` into `HomeView.vue` (or keep it in the layout and render child views elsewhere).
3. Otherwise, prefer deleting unused routes/views to reduce confusion.

### Update Quran metadata
- `src/chapters.js` (114 entries), `src/utils/FPCH.js` (114), `src/utils/JUZ.js` (30).
- These are hand-maintained. A safer long-term approach is generating them from the installed `quran-json` package.

---

## 5. Debugging tips

| Symptom | Likely cause | What to check |
|---------|--------------|---------------|
| Page stuck on "رسم الآيات" spinner | Local page JSON failed to load | Network tab (`/data/pages/{N}.json`); `MushafPage.error`; SW cache |
| Wrong Arabic glyph widths | Page font not loaded | `<style id="font-p{N}">` in `<head>`; `/fonts/p{N}.woff2` 200 |
| Blank/misplaced line | Bad generated data | `public/data/pages/{N}.json`; re-run `npm run data:validate` |
| Word click doesn't open modal | `selectedAyahKey` not set / modal hidden | `quranStore.selectedAyahKey`; `AyahModal` `v-if` |
| Audio won't start | Autoplay policy / API failure | Console; `audioStore.loading`; `data.data.audio` |
| Audio plays wrong reciter | Reciter id invalid | `audioStore.reciter`; API response |
| Jump lands one page off (desktop) | Duplicate navigation logic | `quranStore.goToPage` vs `MushafSlider.goToPage` ([ISSUES #4](./ISSUES.md#4-desktop-page-navigation-off-by-one)) |
| Theme flashes on load | Persisted key mismatch | `index.html` reads `quran_app_data_v2` |
| PWA won't install | Missing icons | `public/pwa-*.png`, manifest |
| Offline page fails | Page API not cached | `vite.config.js` runtimeCaching ([ISSUES #2](./ISSUES.md#2-offline-reading-broken-for-uncached-pages)) |
| Build fails on rollup binary | Cross-platform node_modules | Section 2 above |

### Inspecting persisted state
Open DevTools → Application → Local Storage:
- `quran_app_data_v2` → reader state
- `quran_audio_data_v2` → audio prefs
- `quran-bookmarks` → legacy (unused)

### Inspecting the service worker
DevTools → Application → Service Workers / Cache Storage. Note the `quran-api-cache`, `quran-audio-cache` caches.

---

## 6. Manual test checklist

Use this before shipping a change:

- [ ] App loads at `/` with the last-read page restored.
- [ ] Swipe/arrow to next/previous page; page number updates in header.
- [ ] On desktop (≥1200px), two pages show; navigation from Surah/Juz lands correctly.
- [ ] Surah list → jumps to correct start page.
- [ ] Juz list → jumps to correct start page.
- [ ] Page header shows juz + surah; basmalah/surah headers appear correctly.
- [ ] Click a word → modal opens with Arabic, translation, tafsir.
- [ ] Modal play/pause works; continuous mode advances to next ayah and flips page.
- [ ] Reciter change persists after reload.
- [ ] Add/remove bookmark; list updates.
- [ ] Bookmark click behavior is as expected (currently opens modal only).
- [ ] Search ≥3 chars returns results; clicking navigates.
- [ ] Dark mode toggles and survives reload with no flash.
- [ ] `npm run build` passes; `dist/` generated.
- [ ] Reload offline: already-visited pages behave as expected (known gap for unvisited pages).

---

## 7. Build & deployment

- Build output: `dist/` (gitignored).
- Deploy target: Vercel (`quran-app-inky.vercel.app` per README).
- `createWebHistory` requires SPA fallback rewrites on the host (serve `index.html` for unknown paths). Vercel usually handles this automatically for Vite SPAs; verify if adding real routes.
- PWA assets must exist in `public/` for a proper install.

---

## 8. Git notes

- Current branch: `main` (also `master`, `origin/main`).
- Recent history: init → UX improvements → player → readers → save states → readme.
- Commit style is short lowercase phrases (e.g. `make player`, `ux improve 1`).
- Working tree was clean at analysis time.

---

## 9. Suggested first contributions

If you're new and want to help, these are high-value and low-risk:

1. **Add PWA icons** → fixes install. ([ISSUES #1](./ISSUES.md#1-missing-pwa-icons))
2. **Unify `goToPage`** → fixes desktop jumps. ([ISSUES #4](./ISSUES.md#4-desktop-page-navigation-off-by-one))
3. **Delete dead files** (`SideNav`, `MushafDisplay`, `Ayah`, `AyahDisplay`, `views/*`, `counter.js`, `bookmarks.js`) and unused imports/deps. ([ISSUES #8](./ISSUES.md#8-dead-files-with-latent-errors), [#9](./ISSUES.md#9-duplicate-bookmark-stores-and-unused-deps))
4. **Runtime-cache the page API** → real offline support. ([ISSUES #2](./ISSUES.md#2-offline-reading-broken-for-uncached-pages))
5. **Add Vitest** for the pure logic (next/prev ayah, line grouping, juz lookup). ([ISSUES #11](./ISSUES.md#11-no-tests-lint-or-type-checking))

---

## 10. Environment notes from this analysis

- Analyzed on **Linux**, Node **v24.15.0**, npm **11.12.1**.
- `node_modules` initially contained a **Windows** Rollup binary; the Linux binary was installed to verify the build.
- Production build verified: `104 modules transformed`, JS 280.64 kB / CSS 40.34 kB, PWA precache 617 entries (~48 MB).
- Generated `dist/` was removed after verification; no tracked files were changed by the analysis.
