<template>
  <div
    class="mushaf-page bg-[#f9f7f0] dark:bg-[#1a1a1a] transition-colors duration-300 relative overflow-hidden"
    :class="{
      'border-r-4 border-black/5': pageNumber % 2 !== 0,
      'border-l-4 border-black/5': pageNumber % 2 === 0,
    }"
    v-if="isActive || isPreloaded"
  >
    <!-- Background Texture Overlay -->
    <div
      class="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"
    ></div>

    <div v-if="loading" class="h-full flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        <span class="text-sm font-bold text-emerald-600/60 uppercase tracking-widest">
          رسم الآيات
        </span>
      </div>
    </div>

    <div
      v-else-if="error"
      class="h-full flex flex-col gap-3 items-center justify-center text-red-500 p-10 text-center"
    >
      <p class="font-bold">{{ error }}</p>
      <button
        type="button"
        class="text-sm font-bold text-emerald-600 hover:underline dark:text-emerald-400"
        @click="retryLoad"
      >
        إعادة المحاولة
      </button>
    </div>

    <div v-else class="h-full flex flex-col p-2 md:p-4 relative z-10 overflow-hidden">
      <!-- Page Header -->
      <div
        class="w-full flex justify-between items-center mb-2 md:mb-4 px-4 text-gray-500 dark:text-gray-400"
        v-if="pageData"
      >
        <div class="flex flex-col items-start">
          <span class="text-xs font-bold thuluth">{{ juzName }}</span>
        </div>

        <div class="flex gap-4 items-center">
          <div v-for="surah in surahs" :key="surah" class="flex flex-col items-center">
            <span class="surah-header-font text-xl leading-none">
              {{ String(surah).padStart(3, '0') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Main Mushaf Content with Decorative Border -->
      <div class="flex-1 flex flex-col items-center justify-center relative min-h-0">
        <!-- Decorative Border (Visible on Desktop/Larger screens) -->
        <div
          class="absolute -inset-1 md:-inset-2 border-[8px] md:border-[16px] border-double border-emerald-900/5 dark:border-emerald-100/5 rounded-sm pointer-events-none"
        ></div>

        <div
          class="page-container w-full max-w-[480px] flex flex-col h-full"
          :class="[
            `page_${pageNumber} p${pageNumber}-v1`,
            [1, 2].includes(pageNumber) ? 'justify-center' : 'justify-between',
          ]"
        >
          <div
            v-for="(line, index) in lines"
            :key="index"
            class="flex line relative group/line"
            :class="[
              `Page${pageNumber}-line${index + 1}`,
              line.center ? 'justify-center' : 'justify-between',
              { 'items-center': true },
            ]"
          >
            <!-- Surah Header in the middle of page -->
            <div class="w-full py-2 my-1 relative" v-if="line.type === 'surah'">
              <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div class="w-full border-t border-emerald-900/10 dark:border-emerald-100/10"></div>
              </div>
              <div class="relative flex justify-center">
                <span
                  class="bg-[#f9f7f0] dark:bg-[#1a1a1a] px-3 text-3xl surah-header-font text-emerald-900/80 dark:text-emerald-100/80"
                >
                  {{ String(line.chapter).padStart(3, '0') }}
                </span>
              </div>
            </div>

            <!-- Basmalah -->
            <div v-else-if="line.type === 'basmalah'" class="w-full py-1 flex justify-center">
              <Basmalah class="h-8 md:h-10 text-emerald-900/90 dark:text-emerald-100/90" />
            </div>

            <!-- Ayah Words -->
            <template v-else>
              <template v-for="(run, runIndex) in line.runs" :key="runIndex">
                <span
                  v-for="(text, wordIndex) in run[1]"
                  :key="`${run[0]}-${wordIndex}`"
                  :class="[
                    `word verse_${run[0]} transition-all duration-200 cursor-pointer text-emerald-900/90 dark:text-emerald-100/90`,
                    {
                      'bg-emerald-600/20 dark:bg-emerald-400/30 rounded shadow-[0_0_12px_rgba(16,185,129,0.4)] scale-105 z-10':
                        audioStore.currentAyahKey === run[0],
                    },
                    {
                      'bg-amber-500/10 dark:bg-amber-400/20 rounded border-b-2 border-amber-500/50':
                        quranStore.selectedAyahKey === run[0] &&
                        audioStore.currentAyahKey !== run[0],
                    },
                    {
                      'hover:bg-black/5 dark:hover:bg-white/5':
                        quranStore.selectedAyahKey !== run[0] &&
                        audioStore.currentAyahKey !== run[0],
                    },
                  ]"
                  @mouseover="wordhovered"
                  @mouseleave="wordunhovered"
                  @click="quranStore.setSelectedAyahKey(run[0])"
                >
                  {{ text }}
                </span>
              </template>
            </template>

            <!-- Hizb/Rub Marker -->
            <div
              class="absolute hidden lg:flex flex-col items-center justify-center w-10 h-10 -right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover/line:opacity-100 transition-opacity"
              :class="{ '-left-14 right-auto': pageNumber % 2 == 0 }"
              v-if="hizbLine === index + 1"
            >
              <div
                class="text-[7px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter whitespace-nowrap"
              >
                {{ hizbLabel }}
              </div>
              <div class="text-base font-bold thuluth text-emerald-800 dark:text-emerald-200">
                {{ hizbNumber }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Page Footer -->
      <div class="mt-2 md:mt-4 flex justify-center items-center">
        <div class="relative flex items-center justify-center">
          <span class="text-sm font-bold text-gray-800 dark:text-gray-200 z-10">
            {{ pageNumber.toLocaleString('ar-Eg') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import localPageService from '@/services/localPageService'
import fontService from '@/services/fontService'
import { useQuranStore } from '@/stores/quranStore'
import { useAudioStore } from '@/stores/audioStore'
import Basmalah from './basmalah.vue'
import { JUZ } from '@/utils/JUZ'

const quranStore = useQuranStore()
const audioStore = useAudioStore()
const props = defineProps({
  pageNumber: {
    type: Number,
    required: true,
    validator: (value) => value >= 1 && value <= 604,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['loaded'])

const pageData = ref(null)
const loading = ref(false)
const error = ref(null)

// Only load if active or marked as preloaded
const isActive = computed(() => props.active)
const isPreloaded = computed(() => {
  // Preload if the page is within 5 pages of the current page
  return Math.abs(props.pageNumber - quranStore.currentPage) <= 5
})

// Precomputed page layout (see docs/PAGE_DATA_PIPELINE.md).
const lines = computed(() => pageData.value?.lines ?? [])
const surahs = computed(() => pageData.value?.surahs ?? [])
const juzName = computed(() => (pageData.value ? (JUZ[pageData.value.juz]?.name ?? '') : ''))
const hizbLine = computed(() => pageData.value?.hizbLine ?? null)
const hizbLabel = computed(() => pageData.value?.hizbLabel ?? '')
const hizbNumber = computed(() => pageData.value?.hizb ?? '')

// Load page data from the local dataset, and wait for the page font.
// Rendering before the glyph font is ready shows garbage, so both must be
// available before `pageData` is set.
const loadPageData = async () => {
  if (pageData.value) return // Already loaded
  try {
    loading.value = true
    error.value = null

    const [data, fontReady] = await Promise.all([
      localPageService.loadPage(props.pageNumber),
      fontService.ensureFont(props.pageNumber),
    ])

    if (!fontReady) {
      throw new Error('تعذر تحميل خط الصفحة — تحقق من الاتصال')
    }

    pageData.value = data

    // Set first verse key for this page in store
    quranStore.setPageFirstVerseKey(props.pageNumber, data.firstVerse)

    emit('loaded', props.pageNumber)
  } catch (err) {
    error.value = err?.message || 'تعذر تحميل الصفحة'
    console.log(err)
  } finally {
    loading.value = false
  }
}

const retryLoad = () => {
  error.value = null
  fontService.clear(props.pageNumber)
  loadPageData()
}

// Watch active status and load when needed
watch(
  () => props.active,
  (active) => {
    if (active) {
      loadPageData()
    }
  },
  { immediate: true },
)

// Also load if preloaded becomes true
watch(
  isPreloaded,
  (preloaded) => {
    if (!preloaded) return
    // Warm the JSON for pages just off-screen; fonts are handled by
    // MushafSlider (current ±1) so we never download a page we don't show.
    if (Math.abs(props.pageNumber - quranStore.currentPage) <= 2) {
      localPageService.preload(props.pageNumber)
    }
  },
  { immediate: true },
)

// Keep the app header's current surah in sync with the visible page.
watch(
  [() => props.active, () => quranStore.currentPage, surahs],
  () => {
    if (!props.active || !pageData.value) return
    if (quranStore.currentPage !== props.pageNumber) return

    const next = surahs.value
    const current = quranStore.currentSurah
    const same =
      Array.isArray(current) &&
      current.length === next.length &&
      current.every((value, i) => value === next[i])
    if (!same) quranStore.setCurrentSurah(next)
  },
  { immediate: true },
)

const wordhovered = (e) => {
  Array.from(document.getElementsByClassName(e.target.className)).forEach((element) => {
    element.classList.add('hoverd')
  })
}
const wordunhovered = (e) => {
  Array.from(document.getElementsByClassName(e.target.className)).forEach((element) => {
    element.classList.remove('hoverd')
  })
}
</script>

<style scoped>
.mushaf-page {
  width: 100%;
  height: 100%;
  position: relative;
  font-size: clamp(16px, 2.8vh, 24px);
  user-select: none;
}

.surah-header-font {
  font-family: 'surah-name', sans-serif;
}

.page-container {
  padding: 10px;
}

.word {
  display: inline-block;
  padding: 0 1px;
}

.word.hoverd {
  background-color: rgba(16, 185, 129, 0.05);
  border-radius: 2px;
}

/* Ensure lines are responsive but maintain layout */
.line {
  width: 100%;
  min-height: 1.5em;
}

@media (max-width: 640px) {
  .mushaf-page {
    font-size: 18px;
  }
  .page-container {
    padding: 5px;
  }
}

/* Custom scrollbar for dark mode compatibility */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.2);
  border-radius: 10px;
}
</style>
<!-- Page data is precomputed: see docs/PAGE_DATA_PIPELINE.md -->
