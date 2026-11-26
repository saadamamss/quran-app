import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registration happens in src/main.js with `immediate: true`, so a slow
      // third-party request cannot delay the service worker / precache.
      injectRegister: null,
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Quran App',
        short_name: 'Quran',
        description: 'Modern Quran Mushaf Application',
        theme_color: '#10b981',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Precache the app shell, the page text (~1 MB) and the small UI fonts.
        // The 604 per-page glyph fonts (~46 MB) are NOT precached: each one is
        // fetched on demand and then kept forever by the rule below.
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,ttf,json}',
          // Small UI fonts used by the page header (not the 604 page fonts).
          'fonts/sura_names.woff2',
          'fonts/UthmanicHafs1Ver18.woff2',
        ],
        globIgnores: ['fonts/KfgqpcHafsUthmanicScriptRegular-*'],
        runtimeCaching: [
          {
            // One font per Mushaf page (~78 KB). Downloaded on first view of
            // that page, then served from cache — including offline.
            urlPattern: /\/fonts\/p\d+\.woff2$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mushaf-page-fonts',
              expiration: {
                maxEntries: 604,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.alquran\.cloud\/v1\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-api-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.islamic\.network\/quran\/audio\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-audio-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
