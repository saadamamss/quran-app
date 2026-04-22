<template>
  <div class="p-2 space-y-1">
    <button
      v-for="surah in 114"
      :key="surah"
      @click="selectSurah(surah)"
      class="w-full flex items-center justify-between p-3 rounded-xl transition-all group"
      :class="[
        isCurrentSurah(surah)
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent',
      ]"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors"
          :class="
            isCurrentSurah(surah)
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 group-hover:text-emerald-600'
          "
        >
          {{ surah }}
        </div>
        <div class="text-right">
          <div
            class="surahname text-2xl font-bold transition-opacity dark:text-gray-200"
          >
            <span>{{ String(surah).padStart(3, '0') }}</span>
          </div>
          <p
            class="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider"
          >
            {{ chapters[surah].revelation_type }} - {{ chapters[surah].total_verses }} الآيات
          </p>
        </div>
        <!-- </div> -->
      </div>

      <!-- Surah name in specialized font if available, or just icon -->
      <!-- <div class="flex items-center gap-2">
        <div class="surahname text-2xl font-bold opacity-20 group-hover:opacity-100 transition-opacity dark:text-gray-400">
          <span>{{ String(surah).padStart(3, '0') }}</span>
        </div>
      </div> -->
    </button>
  </div>
</template>
<script setup>
import { chapters } from '@/chapters'
import { useQuranStore } from '@/stores/quranStore'
import { FPCh } from '@/utils/FPCH'

const store = useQuranStore()

const emit = defineEmits(['select-surah'])

const selectSurah = (number) => {
  const page = FPCh[number - 1]

  console.log(page)

  store.setCurrentPage(page)
  store.goToPage(page)

  emit('select-surah', number - 1)
}

const isCurrentSurah = (number) => {
  return store.currentSurah.includes(number)
}
</script>
