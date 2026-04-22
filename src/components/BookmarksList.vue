<template>
  <div class="p-2 space-y-1">
    <div 
      v-for="(bookmark, index) in store.bookmarks" 
      :key="index"
      @click="goToBookmark(bookmark)"
      class="w-full flex flex-col p-4 rounded-xl transition-all group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md cursor-pointer"
    >
      <div class="flex justify-between items-center mb-2">
        <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
          {{ chapters[bookmark.surah]?.name }} - {{ bookmark.ayah }}
        </span>
        <button 
          @click.stop="store.removeBookmark(bookmark.verse_key)"
          class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <p class="text-lg font-arabic text-right text-gray-900 dark:text-gray-100 line-clamp-2 leading-relaxed">
        {{ bookmark.text }}
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-1 italic">
        {{ bookmark.translation }}
      </p>
    </div>
    
    <div v-if="!store.bookmarks.length" class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div class="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </div>
      <p class="text-gray-500 dark:text-gray-400 font-medium">No bookmarks yet</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Tap an Ayah to save it here</p>
    </div>
  </div>
</template>

<script setup>
import { useQuranStore } from '@/stores/quranStore'
import { chapters } from '@/chapters'

const store = useQuranStore()
const emit = defineEmits(['select-surah'])

const goToBookmark = (bookmark) => {
  // We need to find which page this ayah is on
  // For now, let's just go to the surah start page
  // A better way would be to store the page number in the bookmark
  store.setSelectedAyahKey(bookmark.verse_key)
}
</script>

<style scoped>
.font-arabic {
  font-family: 'KFGQPC Uthman Taha Naskh', 'Amiri', serif;
}
</style>