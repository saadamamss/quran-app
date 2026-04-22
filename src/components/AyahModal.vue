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
              <p class="text-gray-500 dark:text-gray-400">تحميل الترجمة...</p>
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

              <!-- Tabs -->
              <div class="flex p-1 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                <button
                  @click="activeTab = 'translation'"
                  class="flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all"
                  :class="
                    activeTab === 'translation'
                      ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  "
                >
                  الترجمة
                </button>
                <button
                  @click="activeTab = 'tafsir'"
                  class="flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all"
                  :class="
                    activeTab === 'tafsir'
                      ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  "
                >
                  التفسير
                </button>
              </div>

              <!-- Content Tab -->
              <div
                v-if="activeTab === 'translation'"
                class="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <p class="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  "{{ ayahData.translation }}"
                </p>
                <p class="text-xs text-emerald-600 dark:text-emerald-500 mt-2 font-medium">
                  — Sahih International
                </p>
              </div>

              <div
                v-else
                class="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <p class="text-gray-800 dark:text-gray-200 leading-relaxed text-right font-medium">
                  {{ ayahData.tafsir }}
                </p>
                <p
                  class="text-[10px] text-amber-600 dark:text-amber-500 mt-2 font-bold text-left uppercase tracking-widest"
                >
                  — التفسير الميسر
                </p>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div
            class="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col gap-3"
          >
            <div class="flex gap-3">
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
                {{ isBookmarked ? 'تم الحفظ' : 'حفظ العلامة' }}
              </button>
            </div>

            <!-- Continuous Play Toggle -->
            <button 
              @click="audioStore.setContinuous(!audioStore.isContinuous)"
              class="flex items-center justify-between px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
              :class="audioStore.isContinuous ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-900/50'"
            >
              <div class="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
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
                تشغيل مستمر
              </div>
              <div
                class="w-8 h-4 rounded-full relative transition-colors"
                :class="audioStore.isContinuous ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'"
              >
                <div
                  class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all"
                  :class="audioStore.isContinuous ? 'left-4.5' : 'left-0.5'"
                ></div>
              </div>
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
import { useAudioStore } from '@/stores/audioStore'
import quranServices from '@/services/quranServices'
import { chapters } from '@/chapters'

const store = useQuranStore()
const audioStore = useAudioStore()
const selectedAyahKey = computed(() => store.selectedAyahKey)

const loading = ref(false)
const error = ref(null)
const ayahData = ref({ text: '', translation: '', tafsir: '', audio: '' })
const activeTab = ref('translation') // 'translation' or 'tafsir'

const playing = computed(
  () => audioStore.isPlaying && audioStore.currentAyahKey === selectedAyahKey.value,
)

const surahNumber = computed(() => selectedAyahKey.value?.split(':')[0])
const ayahNumber = computed(() => selectedAyahKey.value?.split(':')[1])
const surahName = computed(() => {
  const surahId = Number(surahNumber.value)
  return chapters[surahId]?.name || `Surah ${surahId}`
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

    // Fetch Arabic text
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${key}/ar.sahih`)
    const data = await response.json()

    // Fetch English translation
    const transResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${key}/en.sahih`)
    const transData = await transResponse.json()

    // Fetch Arabic Tafsir (Muyassar)
    const tafsirResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${key}/ar.muyassar`)
    const tafsirData = await tafsirResponse.json()

    ayahData.value = {
      text: data.data.text,
      translation: transData.data.text,
      tafsir: tafsirData.data.text,
      audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${data.data.number}.mp3`,
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
  }
})

const close = () => {
  store.setSelectedAyahKey(null)
}

const toggleAudio = () => {
  audioStore.togglePlay(selectedAyahKey.value)
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
