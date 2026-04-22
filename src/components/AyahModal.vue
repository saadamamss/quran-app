<template>
  <Transition name="fade">
    <div
      v-if="selectedAyahKey"
      class="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/40 backdrop-blur-sm"
      @click.self="close"
    >
      <Transition name="slide-up">
        <div
          v-if="selectedAyahKey"
          class="bg-white dark:bg-gray-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        >
          <!-- Header -->
          <div
            class="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50"
          >
            <div class="flex flex-col">
              <span
                class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider"
              >
                {{ surahName }} - {{ ayahNumber }}
              </span>
              <span class="text-lg font-bold dark:text-white">Ayah Details</span>
            </div>
            <button
              @click="close"
              class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 dark:text-gray-400"
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

          <!-- Content -->
          <div class="p-6 max-h-[60vh] overflow-y-auto">
            <div v-if="loading" class="flex flex-col items-center py-8">
              <div
                class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"
              ></div>
              <p class="text-gray-500 dark:text-gray-400">Loading translation...</p>
            </div>
            <div v-else-if="error" class="text-red-500 py-8 text-center">
              {{ error }}
            </div>
            <div v-else class="space-y-6">
              <!-- Arabic Text -->
              <div class="text-right">
                <p
                  class="text-2xl font-arabic leading-relaxed text-gray-900 dark:text-gray-100 mb-2"
                >
                  {{ ayahData.text }}
                </p>
              </div>

              <!-- Translation -->
              <div
                class="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800"
              >
                <p class="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  "{{ ayahData.translation }}"
                </p>
                <p class="text-xs text-emerald-600 dark:text-emerald-500 mt-2 font-medium">
                  — Sahih International
                </p>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
            <button
              @click="toggleAudio"
              class="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <svg
                v-if="!playing"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
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
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ playing ? 'Pause' : 'Listen' }}
            </button>
            <button
              @click="toggleBookmark"
              :class="[
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all border-2 active:scale-95',
                isBookmarked
                  ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700',
              ]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                :fill="isBookmarked ? 'currentColor' : 'none'"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              {{ isBookmarked ? 'Saved' : 'Bookmark' }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuranStore } from '@/stores/quranStore'
import quranServices from '@/services/quranServices'

const store = useQuranStore()
const selectedAyahKey = computed(() => store.selectedAyahKey)

const loading = ref(false)
const error = ref(null)
const ayahData = ref({ text: '', translation: '', audio: '' })
const playing = ref(false)
let audioObj = null

const surahNumber = computed(() => selectedAyahKey.value?.split(':')[0])
const ayahNumber = computed(() => selectedAyahKey.value?.split(':')[1])
const surahName = computed(() => {
  // In a real app, you'd map surahNumber to its name.
  // For now, let's just return Surah X
  return `Surah ${surahNumber.value}`
})

const isBookmarked = computed(() => {
  return store.bookmarks.some((b) => b.verse_key === selectedAyahKey.value)
})

const fetchAyahDetails = async (key) => {
  if (!key) return
  loading.value = true
  error.value = null
  try {
    const [s, a] = key.split(':')
    // We can use the existing getSurah or create a specific getAyah if needed
    // Using a more specific API for single ayah details
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${key}/ar.sahih`)
    const data = await response.json()

    const transResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${key}/en.sahih`)
    const transData = await transResponse.json()

    const audioResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${key}/ar.alafasy`)
    const audioDataRes = await audioResponse.json()

    ayahData.value = {
      text: data.data.text,
      translation: transData.data.text,
      audio: audioDataRes.data.audio,
    }
  } catch (err) {
    error.value = 'Failed to load Ayah details'
    console.error(err)
  } finally {
    loading.value = false
  }
}

watch(selectedAyahKey, (newKey) => {
  if (newKey) {
    fetchAyahDetails(newKey)
  } else {
    stopAudio()
  }
})

const close = () => {
  store.setSelectedAyahKey(null)
}

const toggleAudio = () => {
  if (playing.value) {
    audioObj?.pause()
    playing.value = false
  } else {
    if (!audioObj || audioObj.src !== ayahData.value.audio) {
      audioObj = new Audio(ayahData.value.audio)
      audioObj.onended = () => (playing.value = false)
    }
    audioObj.play()
    playing.value = true
  }
}

const stopAudio = () => {
  audioObj?.pause()
  playing.value = false
  audioObj = null
}

const toggleBookmark = () => {
  if (isBookmarked.value) {
    store.removeBookmark(selectedAyahKey.value)
  } else {
    store.addBookmark({
      verse_key: selectedAyahKey.value,
      surah: surahNumber.value,
      ayah: ayahNumber.value,
      text: ayahData.value.text,
      translation: ayahData.value.translation,
    })
  }
}
</script>

<style scoped>
.font-arabic {
  font-family: 'KFGQPC Uthman Taha Naskh', 'Amiri', serif;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

@media (min-width: 640px) {
  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: translateY(20px) scale(0.95);
    opacity: 0;
  }
}
</style>
