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
          Loading Page {{ pageNumber }}
        </span>
      </div>
    </div>

    <div
      v-else-if="error"
      class="h-full flex items-center justify-center text-red-500 p-10 text-center"
    >
      <p class="font-bold">{{ error }}</p>
    </div>

    <div v-else class="h-full flex flex-col p-2 md:p-4 relative z-10 overflow-hidden">
      <!-- Page Header -->
      <div
        class="w-full flex justify-between items-center mb-2 md:mb-4 px-4 text-gray-500 dark:text-gray-400"
        v-if="verses.length > 0"
      >
        <div class="flex flex-col items-start">
          <span class="text-xs font-bold thuluth">{{ pageJuz }}</span>
        </div>

        <div class="flex gap-4 items-center">
          <div v-for="surah in pageSurah" :key="surah" class="flex flex-col items-center">
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
            v-for="(line, index) in pageLines"
            :key="index"
            class="flex line relative group/line"
            :class="[
              `Page${pageNumber}-line${index + 1}`,
              [1, 2].includes(pageNumber) || clines[pageNumber]?.includes(index + 1)
                ? 'justify-center'
                : 'justify-between',
              { 'items-center': true },
            ]"
          >
            <!-- Surah Header in the middle of page -->
            <div class="w-full py-2 my-1 relative" v-if="line.name">
              <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div class="w-full border-t border-emerald-900/10 dark:border-emerald-100/10"></div>
              </div>
              <div class="relative flex justify-center">
                <span
                  class="bg-[#f9f7f0] dark:bg-[#1a1a1a] px-3 text-3xl surah-header-font text-emerald-900/80 dark:text-emerald-100/80"
                >
                  {{ String(line.chapter_id).padStart(3, '0') }}
                </span>
              </div>
            </div>

            <!-- Basmalah -->
            <div v-if="line.basmalah" class="w-full py-1 flex justify-center">
              <Basmalah class="h-8 md:h-10 text-emerald-900/90 dark:text-emerald-100/90" />
            </div>

            <!-- Ayah Words -->
            <template v-else>
              <span
                :class="[
                  `word verse_${word.verse_key} transition-all duration-200 cursor-pointer text-emerald-900/90 dark:text-emerald-100/90`,
                  {
                    'bg-emerald-600/10 dark:bg-emerald-400/20 rounded shadow-[0_0_8px_rgba(16,185,129,0.2)] scale-105 z-10':
                      quranStore.selectedAyahKey === word.verse_key,
                  },
                  {
                    'hover:bg-black/5 dark:hover:bg-white/5':
                      quranStore.selectedAyahKey !== word.verse_key,
                  },
                ]"
                v-for="word in line"
                :key="word.location"
                @mouseover="wordhovered"
                @mouseleave="wordunhovered"
                @click="quranStore.setSelectedAyahKey(word.verse_key)"
              >
                {{ word.text }}
              </span>
            </template>

            <!-- Hizb/Rub Marker -->
            <div
              class="absolute hidden lg:flex flex-col items-center justify-center w-10 h-10 -right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover/line:opacity-100 transition-opacity"
              :class="{ '-left-14 right-auto': pageNumber % 2 == 0 }"
              v-if="hizbLocation === index + 1"
            >
              <div
                class="text-[7px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter whitespace-nowrap"
              >
                {{ rubHizbText }}
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
import { ref, watch, computed, onMounted } from 'vue'
import quranServices from '@/services/quranServices'
import { useQuranStore } from '@/stores/quranStore'
import Basmalah from './basmalah.vue'
import quran from 'quran-json'
import { JUZ } from '@/utils/JUZ'
import { pageshashizbnumber } from '@/utils/Hizb'
import { clines } from '@/utils/CLines'
const quranStore = useQuranStore()
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

const verses = ref([])
const loading = ref(false)
const error = ref(null)

// Only load if active or marked as preloaded
const isActive = computed(() => props.active)
const isPreloaded = computed(() => {
  // Preload if the page is within 5 pages of the current page
  return Math.abs(props.pageNumber - quranStore.currentPage) <= 5
})

const head = computed(() => document.querySelector('head'))
// Load font only
const loadFont = () => {
  const fontId = `font-p${props.pageNumber}`
  if (document.getElementById(fontId)) return

  const style = document.createElement('style')
  style.id = fontId
  style.innerHTML = `@font-face { font-family: 'p${props.pageNumber}-v1'; src: url('/fonts/p${props.pageNumber}.woff2'); font-display: swap; } .p${props.pageNumber}-v1{font-family: 'p${props.pageNumber}-v1'}`
  head.value.append(style)
}

// Load page data
const loadPageData = async () => {
  if (verses.value.length > 0) return // Already loaded
  loadFont()
  try {
    loading.value = true
    error.value = null

    const response = await quranServices.getPage(props.pageNumber)
    verses.value = response.verses
    emit('loaded', props.pageNumber)
  } catch (err) {
    error.value = err.message
    console.log(err)
  } finally {
    loading.value = false
  }
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
    if (preloaded) {
      // For preloading, we load the font immediately but data only if active or near
      loadFont()
      if (Math.abs(props.pageNumber - quranStore.currentPage) <= 2) {
        loadPageData()
      }
    }
  },
  { immediate: true },
)

const pageSurah = computed(() => {
  const surahs = verses.value.filter((verse) => verse.verse_number === 1).map((i) => i.chapter_id)
  const currentSurahs = surahs.length ? surahs : [verses.value[0].chapter_id]
  if (isActive.value && quranStore.currentPage == props.pageNumber) {
    quranStore.setCurrentSurah(currentSurahs)
  }

  return currentSurahs
})

const pageJuz = computed(() => {
  const lastVerse = verses.value[0]

  return JUZ[lastVerse.juz_number].name
})

const hizbNumber = computed(() => {
  const hizb = verses.value.map((i) => i.hizb_number)
  const nonRepeatedHizb = Math.max(...[...new Set(hizb)])
  return nonRepeatedHizb
})
const rub_el_hizb = computed(() => {
  const rub_el_hizb = verses.value.map((i) => i.rub_el_hizb_number)
  const nonRepeatedRubHizb = Math.max(...[...new Set(rub_el_hizb)])
  return nonRepeatedRubHizb
})
const rubHizbText = computed(() => {
  // if([...new Set(rub_el_hizb)].length == 1) return ""
  switch (((rub_el_hizb.value - 1) % 4) / 4) {
    case 0.25:
      return 'ربع الحزب'
    case 0.5:
      return 'نصف الحزب'
    case 0.75:
      return 'ثلاثة أرباع الحزب'
    case 0:
      return 'الحزب'
  }
})

const hizbLocation = computed(() => {
  const position = verses.value.find((i) => i.rub_el_hizb_number === rub_el_hizb.value).words[0]
    .line_number

  if (!pageshashizbnumber.includes(props.pageNumber)) return null

  return position
})

const completeLines = computed(() => Array.from({ length: 15 }, (_, i) => i + 1))

const pageLines = computed(() => {
  // Process verses into lines
  const lines = verses.value
    .flatMap((ayah) => ayah.words)
    .reduce((acc, word) => {
      const lineNumber = word.line_number
      acc[lineNumber] = acc[lineNumber] || []
      acc[lineNumber].push(word)
      return acc
    }, {})

  // Find missing lines
  const existingLineNumbers = new Set(Object.keys(lines).map(Number))
  const missingLines = completeLines.value.filter((line) => !existingLineNumbers.has(line))

  // Handle missing lines
  missingLines.forEach((missingLine) => {
    const nextLine = lines[missingLine + 1]

    if (nextLine) {
      // If next line exists, this is a basmalah line
      lines[missingLine] = { basmalah: true }
    } else {
      // Try to find chapter info for surah name display
      const nextChapter = lines[missingLine + 2]?.[0]?.verse_key?.split(':')[0]
      const prevChapter = lines[missingLine - 1]?.[0]?.verse_key?.split(':')[0]

      let chapterId = null
      if (nextChapter) {
        chapterId = nextChapter
      } else if (prevChapter) {
        // If we only have previous chapter, this is likely the last line of a surah
        chapterId = String(Number(prevChapter) + 1)
      }

      // Special handling for first two pages
      if ([1, 2].includes(props.pageNumber)) {
        lines[missingLine] = chapterId ? { name: true, chapter_id: chapterId } : null
      } else {
        lines[missingLine] = { name: true, chapter_id: chapterId }
      }
    }
  })

  // Convert to array maintaining line order
  return completeLines.value.map((lineNumber) => lines[lineNumber] || null).filter((i) => i != null)
})

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
onMounted(() => {})
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
<!-- 
page = {
    id:1,
    juz_number:1,
    hizp_number:1,
    rub_hizp:1,
    surahs:[1],
    hizp_position:5,
    lines:[
        {
            id:"",
            words:[
                verse_number:1,
                page_number:1,
                text:"",
                line_number:1,
                position:1,
                location:"1:1:1"
            ]
        }
    ]
}
-->
