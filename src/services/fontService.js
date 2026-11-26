/**
 * Per-page Mushaf fonts.
 *
 * Every page is drawn with its own font (`/fonts/p{n}.woff2`, ~78 KB). The
 * glyphs are private-use codepoints, so rendering before the font is ready
 * shows garbage symbols. This service:
 *
 * - injects the `@font-face` for a page once (`font-display: block`, so a
 *   slow font never shows fallback glyphs),
 * - resolves only after the font is actually usable (`document.fonts.check`),
 * - dedupes concurrent loads and caches results in memory,
 * - preloads neighbours without blocking.
 *
 * Fonts are *not* precached by the service worker (604 × 78 KB ≈ 46 MB).
 * `vite.config.js` runtime-caches `/fonts/p*.woff2` with `CacheFirst`, so each
 * font is downloaded once and then served from cache — including offline.
 */
const BASE_URL = import.meta.env.BASE_URL || '/'
const FONT_ROOT = `${BASE_URL.replace(/\/+$/, '')}/fonts`
const TOTAL_PAGES = 604

const injected = new Set()
const inFlight = new Map()
const failed = new Set()

// Pages whose font was loaded before the service worker controlled the page.
// Their requests never reached the SW cache, so every font the app has touched
// is re-fetched (from the HTTP cache) once the SW claims the page.
const pendingPrime = new Set()
let primeListenerAttached = false

function fontUrl(page) {
  return `${FONT_ROOT}/p${page}.woff2`
}

function prime(page) {
  fetch(fontUrl(page)).catch(() => {
    // Priming is best-effort.
  })
}

function primeWhenControlled(page) {
  const sw = navigator.serviceWorker
  if (!sw) return
  if (sw.controller) {
    prime(page)
    return
  }

  pendingPrime.add(page)
  if (primeListenerAttached) return
  primeListenerAttached = true

  const flush = () => {
    // Give the worker a moment to become fully active before priming.
    setTimeout(() => {
      for (const p of new Set([...injected, ...pendingPrime])) prime(p)
      pendingPrime.clear()
    }, 800)
  }
  sw.addEventListener('controllerchange', flush)
  // The controller may have been set between the check and the listener.
  if (sw.controller) flush()
}

function family(page) {
  return `p${page}-v1`
}

function normalize(page) {
  const n = Number(page)
  if (!Number.isInteger(n) || n < 1 || n > TOTAL_PAGES) return null
  return n
}

function inject(page) {
  if (injected.has(page)) return
  injected.add(page)

  const style = document.createElement('style')
  style.id = `font-p${page}`
  // `block` keeps text invisible until the glyph font is ready instead of
  // flashing unrelated glyphs. Rendering is gated on ensureFont() anyway.
  style.textContent = `@font-face{font-family:'${family(page)}';src:url('${FONT_ROOT}/p${page}.woff2') format('woff2');font-display:block}.p${page}-v1{font-family:'${family(page)}'}`
  document.head.appendChild(style)
}

/**
 * Make sure a page font is downloaded and usable.
 * @param {number} page
 * @returns {Promise<boolean>} true when the font can render
 */
async function ensureFont(page) {
  const n = normalize(page)
  if (!n) return false

  inject(n)

  if (inFlight.has(n)) return inFlight.get(n)

  const task = (async () => {
    try {
      await document.fonts.load(`16px "${family(n)}"`)
      // `load()` resolves even when the file fails; `check()` tells the truth.
      const ok = document.fonts.check(`16px "${family(n)}"`)
      if (ok) {
        failed.delete(n)
        primeWhenControlled(n)
      } else {
        failed.add(n)
      }
      return ok
    } catch {
      failed.add(n)
      return false
    }
  })()

  inFlight.set(n, task)
  try {
    return await task
  } finally {
    inFlight.delete(n)
  }
}

/**
 * Best-effort font warm-up. Never throws.
 * @param {number|number[]} pages
 */
async function preload(pages) {
  const list = Array.isArray(pages) ? pages : [pages]
  await Promise.allSettled(
    list.map((page) => {
      const n = normalize(page)
      if (n) return ensureFont(n)
      return Promise.resolve(false)
    }),
  )
}

/** True when the font is already usable (no network). */
function isReady(page) {
  const n = normalize(page)
  return n ? document.fonts.check(`16px "${family(n)}"`) : false
}

/** Forget a failed load so it can be retried. */
function clear(page) {
  const n = normalize(page)
  if (n) failed.delete(n)
}

export default { ensureFont, preload, isReady, clear }
export { ensureFont, preload, isReady, clear }
