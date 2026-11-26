<template>
  <div v-if="isLoading">
    <div class="text-center mb-8">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 py-4 bg-gray-100"></h2>
      <h3 class="text-3xl font-arabic mt-2 text-gray-800 dark:text-gray-200 py-4 bg-gray-100"></h3>
    </div>
    <div class="space-y-6">
      <div
        v-for="ayah in 4"
        :key="ayah"
        class="p-4 py-12 rounded-lg bg-gray-100 dark:bg-gray-700 shadow-sm"
      ></div>
    </div>
  </div>
  <Transition v-else-if="surah">
    <div class="space-y-6">
      <div class="text-center mb-8">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {{ surah.englishName }} ({{ surah.englishNameTranslation }})
        </h2>
        <h3 class="text-3xl font-arabic mt-2 text-gray-800 dark:text-gray-200">
          {{ surah.name }}
        </h3>
      </div>

      <div class="space-y-6">
        <div
          v-for="ayah in surah.ayahs"
          :key="ayah.number"
          class="p-4 rounded-lg bg-white dark:bg-gray-700 shadow-sm"
        >
          <p class="arabic-text text-gray-900 dark:text-gray-100 mb-4">
            {{ ayah.text }}
          </p>
          <p class="text-gray-700 dark:text-gray-300 mb-3">
            {{ ayah.translation }}
          </p>
          <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Ayah {{ ayah.numberInSurah }}</span>
            <div class="space-x-2">
              <button
                @click="playAudio(ayah.audio)"
                class="px-3 py-1 rounded bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                Play
              </button>
              <button
                @click="bookmarkAyah(ayah)"
                class="px-3 py-1 rounded bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                Bookmark
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  <div
    v-else
    class="h-full flex flex-col justify-center items-center text-gray-500 dark:text-gray-400"
  >
    <h2 class="text-xl font-semibold mb-2">Welcome to Quran App</h2>
    <p>Select a surah from the list to begin</p>
  </div>
</template>

<script setup>
import { ref, defineProps, watch } from 'vue'
import { useQuranStore } from '@/stores/quranStore'
const props = defineProps(['currentSurah'])

const store = useQuranStore()
const surah = ref(null)

c
const playAudio = (audioUrl) => {
  new Audio(audioUrl).play()
}

const emit = defineEmits(['bookmark'])

const bookmarkAyah = (ayah) => {
  emit('bookmark', ayah)
}
</script>
