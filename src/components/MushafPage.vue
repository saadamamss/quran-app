<template>
  <div
    class="mushaf-page bg-yellow-100"
    :class="{ left: pageNumber % 2 == 0 }"
    v-if="isActive || isPreloaded"
  >
    <!-- Page content here -->
    <div v-if="loading" class="loading-indicator">Loading page {{ pageNumber }}...</div>
    <div v-else-if="error" class="error-message">Error loading page {{ pageNumber }}</div>
    <div v-else class="h-full flex flex-col justify-center items-center">
      <div
        class="surahname w-full max-w-[430px] flex justify-between items-center"
        v-if="quranStore.currentSurah"
      >
        <div class="text-xs font-bold thuluth">{{ pageJuz }}</div>
        <div class="flex text-xl">
          <span v-for="surah in pageSurah">{{ String(surah).padStart(3, '0') }} </span>
        </div>
      </div>
      <div
        class="page flex-1 flex flex-col mb-2"
        :class="[
          `page_${pageNumber} p${pageNumber}-v1`,
          [1, 2].includes(pageNumber) ? 'justify-center' : 'justify-between',
        ]"
      >
        <div
          v-for="(line, index) in pageLines"
          :key="index"
          class="flex line relative"
          :class="[
            `Page${pageNumber}-line${index + 1}`,
            [1, 2].includes(pageNumber) || clines[pageNumber]?.includes(index + 1)
              ? 'justify-center'
              : 'justify-between',
          ]"
        >
          <div class="border py-[2px] w-full" v-if="line.name">
            <div class="surahname flex justify-center text-2xl">
              <span>surah</span>
              <span>{{ String(line.chapter_id).padStart(3, '0') }}</span>
            </div>
          </div>

          <div v-if="line.basmalah" class="w-full">
            <Basmalah />
          </div>
          <span
            :class="`word verse_${word.verse_key}`"
            v-for="word in line"
            v-else
            @mouseover="wordhovered"
            @mouseleave="wordunhovered"
          >
            {{ word.text }}
          </span>
          <div
            class="thuluth hizp-position"
            :class="{ left: pageNumber % 2 == 0 }"
            v-if="hizbLocation === index + 1"
          >
            <span class="block text-xs font-bold">{{ rubHizbText }}</span>
            <span class="text-xl font-bold block">{{ hizbNumber }}</span>
          </div>
        </div>
      </div>
      <div class="text-center text-sm font-bold">
        <span> - {{ pageNumber.toLocaleString('ar-Eg') }} - </span>
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
  // Add your preloading logic here
  return true
})

const head = computed(() => document.querySelector('head'))
// Load page data
const loadPageData = async () => {
  if (verses.value.length > 0) return // Already loaded
  const style = document.createElement('style')
  style.innerHTML = `@font-face { font-family: 'p${props.pageNumber}-v1'; src: url('/fonts/p${props.pageNumber}.woff2');} .p${props.pageNumber}-v1{font-family: 'p${props.pageNumber}-v1'}`
  head.value.append(style)
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
watch(isPreloaded, (preloaded) => {
  if (preloaded && !loading.value && verses.value.length === 0) {
    loadPageData()
  }
})

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
const pageSurahs = computed(() => {
  return verses.value.reduce((acc, verse) => {
    if (!acc.includes(verse.chapter_id)) {
      acc.push(verse.chapter_id)
    }

    return acc
  }, [])
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
        lines[missingLine] = chapterId ? { name: true, chapter_id: chapterId } : {}
      } else {
        lines[missingLine] = { name: true, chapter_id: chapterId }
      }
    }
  })

  // Convert to array maintaining line order
  return completeLines.value.map((lineNumber) => lines[lineNumber] || [])
})

const getLines = (chapter_id) => {
  console.log(
    verses.value.filter((verse) => verse.chapter_id === chapter_id).flatMap((ayah) => ayah.words),
  )

  return Object.values(
    verses.value
      .filter((verse) => verse.chapter_id === chapter_id)
      .flatMap((ayah) => ayah.words)
      .reduce((acc, word) => {
        const lineNumber = word.line_number

        if (!acc[lineNumber]) {
          acc[lineNumber] = []
        }
        acc[lineNumber].push(word)
        return acc
      }, {}),
  )
}

// const pageLines = computed(() => {
//   const gg = pageSurahs.value.map((chapter_id) => {
//     const lines = getLines(chapter_id)
//     const firstLine = lines[0][0].line_number
//     const lastLine = lines.at(-1).at(-1).line_number
//     const firstVerse =
//       verses.value.filter((verse) => verse.chapter_id === chapter_id)[0].verse_number == 1

//     return {
//       chapter_id: chapter_id,
//       lines: lines,
//       basmalah: firstVerse && ![1, 9].includes(chapter_id),
//       surahName: (firstVerse && chapter_id == 9) || (firstVerse && firstLine != 2),
//       surahNameLast: lastLine == 14,
//     }
//   })

//   return gg
// })

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
  font-size: 24px;
}
.mushaf-page:not(.left) {
  border-right: solid 2px #aaa;
}
.mushaf-page.left {
  border-left: solid 2px #aaa;
}
.loading-indicator,
.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.page-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.page {
  border: solid 2px #ddd;
  padding: 10px;
  max-height: 660px;
  min-width: 430px;
  max-width: 430px;
}

.word.hoverd {
  background-color: rgba(0, 0, 0, 0.1);
}

.hizp-position {
  position: absolute;
  left: calc(100% + 25px);
  text-align: center;
}
.hizp-position.left {
  right: calc(100% + 25px);
  left: auto;
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
