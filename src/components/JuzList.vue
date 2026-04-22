<template>
  <div class="p-2 space-y-1">
    <button
      v-for="(juz, id) in JUZ"
      :key="id"
      @click="selectJuz(juz.startpage)"
      class="w-full flex items-center justify-between p-3 rounded-xl transition-all group"
      :class="[
        isCurrentJuz(id)
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
      ]"
    >
      <div class="flex items-center gap-3">
        <div 
          class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors"
          :class="isCurrentJuz(id) ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 group-hover:text-emerald-600'"
        >
          {{ id }}
        </div>
        <div class="text-right">
          <p class="font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 transition-colors">
            {{ juz.name }}
          </p>
          <p class="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
            بداية من الصفحة {{ juz.startpage }}
          </p>
        </div>
      </div>
      <div v-if="isCurrentJuz(id)" class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
    </button>
  </div>
</template>

<script setup>
import { JUZ } from '@/utils/JUZ'
import { useQuranStore } from '@/stores/quranStore'

const store = useQuranStore()

const selectJuz = (page) => {
  store.setCurrentPage(page)
  store.goToPage(page)
}

const isCurrentJuz = (id) => {
  // Rough calculation for highlighting
  const juzId = Number(id)
  const nextPageStart = JUZ[juzId + 1]?.startpage || 605
  return store.currentPage >= JUZ[juzId].startpage && store.currentPage < nextPageStart
}
</script>
