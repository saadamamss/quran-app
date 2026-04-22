<template>
  <div>
    <button
      v-for="(surah, index) in 114"
      :key="surah"
      @click="selectSurah(index)"
      class="flex items-center gap-2 p-3 rounded-lg transition-colors cursor-pointer w-full"
      :class="{
        'bg-blue-50 dark:bg-gray-700': store.currentSurah.includes(surah),
        'hover:bg-gray-100 dark:hover:bg-gray-600': !store.currentSurah.includes(surah),
      }"
    >
      <span
        class="flex items-center justify-center w-8 h-8 rounded-full bg-quran-primary text-white text-sm mr-3"
      >
        {{ surah.toLocaleString('ar-Eg') }}
      </span>
      <div class="surahname text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
        <span>surah</span>
        <span>{{ String(surah).padStart(3, '0') }}</span>
      </div>
    </button>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import quran from 'quran-json'
import { useQuranStore } from '@/stores/quranStore'
import { FPCh } from '@/utils/FPCH'

const surahs = ref([])
const store = useQuranStore()

const emit = defineEmits(['select-surah'])

const selectSurah = (number) => {
  const page = FPCh[number]
  store.setCurrentPage(page)
  store.goToPage(page)
}
</script>
