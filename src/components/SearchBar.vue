<template>
  <div class="relative group">
    <div class="relative">
      <input 
        v-model="query" 
        @input="handleInput"
        @focus="showResults = true"
        type="text"
        placeholder="Search for Ayah, Surah or Page..."
        class="w-full bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-sm transition-all"
      />
      <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <div v-else class="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    </div>

    <!-- Results Dropdown -->
    <Transition name="fade">
      <div 
        v-if="showResults && (results.length > 0 || query.length > 2)"
        v-click-outside="() => showResults = false"
        class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 max-h-[400px] overflow-y-auto custom-scrollbar"
      >
        <div v-if="loading" class="p-8 text-center text-gray-500">
          Searching...
        </div>
        <div v-else-if="results.length === 0" class="p-8 text-center text-gray-500">
          No results found for "{{ query }}"
        </div>
        <div v-else class="p-2 space-y-1">
          <button
            v-for="result in results"
            :key="result.key"
            @click="goToResult(result)"
            class="w-full text-right p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/50"
          >
            <div class="flex justify-between items-center mb-1">
              <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                {{ result.surahName }} : {{ result.ayahNumber }}
              </span>
              <span class="text-xs text-gray-400">Page {{ result.page }}</span>
            </div>
            <p class="font-arabic text-lg text-gray-900 dark:text-gray-100 leading-relaxed">
              {{ result.text }}
            </p>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import quranServices from '@/services/quranServices'
import { useQuranStore } from '@/stores/quranStore'
import { chapters } from '@/chapters'

const query = ref('')
const results = ref([])
const loading = ref(false)
const showResults = ref(false)
const store = useQuranStore()

let debounceTimer = null

const handleInput = () => {
  clearTimeout(debounceTimer)
  if (query.value.length < 3) {
    results.value = []
    return
  }
  
  loading.value = true
  debounceTimer = setTimeout(performSearch, 500)
}

const performSearch = async () => {
  try {
    const response = await quranServices.search(query.value)
    if (response.data && response.data.matches) {
      results.value = response.data.matches.map(m => ({
        key: `${m.surah.number}:${m.numberInSurah}`,
        text: m.text,
        surahName: m.surah.name,
        ayahNumber: m.numberInSurah,
        page: m.page // Assuming API provides page
      }))
    }
  } catch (err) {
    console.error("Search failed", err)
  } finally {
    loading.value = false
  }
}

const goToResult = (result) => {
  if (result.page) {
    store.setCurrentPage(result.page)
    store.goToPage(result.page)
  }
  store.setSelectedAyahKey(result.key)
  showResults.value = false
  query.value = ''
}

// Custom directive for clicking outside
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}
</script>

<style scoped>
.font-arabic {
  font-family: 'KFGQPC Uthman Taha Naskh', 'Amiri', serif;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>