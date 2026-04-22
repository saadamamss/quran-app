<template>
  <Transition name="slide-up">
    <div
      v-if="audioStore.currentAyahKey || audioStore.isPlaying"
      class="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] px-4 py-3 sm:px-6"
    >
      <div class="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
        <!-- Left: Ayah Info -->
        <div class="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial" dir="rtl">
          <div
            class="hidden sm:flex w-10 h-10 bg-emerald-600 text-white rounded-full items-center justify-center font-bold text-xs shadow-lg shadow-emerald-600/20"
          >
            {{ currentAyahNumber?.toLocaleString('ar-Eg') }}
          </div>
          <div class="flex flex-col min-w-0 text-right">
            <h4 class="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {{ currentSurahName }}
            </h4>
            <p
              class="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest"
            >
              الآية {{ currentAyahNumber?.toLocaleString('ar-Eg') }}
            </p>
          </div>
        </div>

        <!-- Center: Main Controls -->
        <div class="flex items-center gap-2 sm:gap-6">
          <button
            @click="audioStore.playPrevAyah"
            class="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            @click="audioStore.togglePlay()"
            class="w-12 h-12 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
            :disabled="audioStore.loading"
          >
            <div
              v-if="audioStore.loading"
              class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"
            ></div>
            <template v-else>
              <svg
                v-if="!audioStore.isPlaying"
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </template>
          </button>

          <button
            @click="audioStore.playNextAyah"
            class="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <!-- Right: Settings & Stop -->
        <div class="flex items-center gap-1 sm:gap-4">
          <button
            @click="audioStore.isContinuous = !audioStore.isContinuous"
            class="p-2 transition-colors rounded-lg hidden sm:block"
            :class="
              audioStore.isContinuous
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            "
            title="Continuous Play"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </button>

          <button
            @click="audioStore.stopAudio"
            class="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Stop"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Floating Start Button if nothing is playing -->
  <button
    v-if="!audioStore.currentAyahKey && !audioStore.isPlaying"
    @click="startPlayback"
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full shadow-2xl shadow-emerald-600/40 font-bold flex items-center gap-3 transition-all active:scale-95"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fill-rule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
        clip-rule="evenodd"
      />
    </svg>
    استماع للصفحة {{ quranStore.currentPage.toLocaleString('ar-Eg') }}
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useAudioStore } from '@/stores/audioStore'
import { useQuranStore } from '@/stores/quranStore'
import { chapters } from '@/chapters'

const audioStore = useAudioStore()
const quranStore = useQuranStore()

const currentSurahNumber = computed(() => audioStore.currentAyahKey?.split(':')[0])
const currentAyahNumber = computed(() => audioStore.currentAyahKey?.split(':')[1])
const currentSurahName = computed(() => {
  const id = Number(currentSurahNumber.value)
  return chapters[id]?.name || ''
})

const startPlayback = () => {
  // Logic from user:
  // 1. If an ayah is selected, start from it.
  // 2. Else, start from the first ayah of the current page.

  if (quranStore.selectedAyahKey) {
    audioStore.playAyah(quranStore.selectedAyahKey)
  } else {
    const firstVerse = quranStore.pageFirstVerseKeys[quranStore.currentPage]
    if (firstVerse) {
      audioStore.playAyah(firstVerse)
    } else {
      // Fallback: we might need to wait for page to load or fetch it
      console.warn('First verse not yet loaded for page', quranStore.currentPage)
    }
  }
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.4s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
