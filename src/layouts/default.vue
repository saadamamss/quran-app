<template>
  <div
    class="flex flex-col h-screen min-h-screen max-h-screen bg-white dark:bg-gray-950 transition-colors"
  >
    <!-- Main Top Navbar -->
    <header
      class="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 z-40"
    >
      <div class="flex items-center gap-3">
        <button
          @click="showSidebar = !showSidebar"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <div class="flex flex-col">
          <h1
            class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter leading-none"
          >
            Al-Quran
          </h1>
          <span class="text-xs text-gray-500 dark:text-gray-500 font-medium">Mushaf Al-Madina</span>
        </div>
      </div>

      <!-- Center Status -->
      <div
        class="hidden md:flex items-center gap-6 bg-gray-50 dark:bg-gray-800/50 px-6 py-1.5 rounded-full border border-gray-100 dark:border-gray-800"
      >
        <div class="flex flex-col items-center">
          <span class="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Surah</span>
          <span class="text-sm font-bold dark:text-white">{{ currentSurahName }}</span>
        </div>
        <div class="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
        <div class="flex flex-col items-center">
          <span class="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Juz</span>
          <span class="text-sm font-bold dark:text-white">{{ currentJuz }}</span>
        </div>
        <div class="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
        <div class="flex flex-col items-center">
          <span class="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Page</span>
          <span class="text-sm font-bold dark:text-white">{{ store.currentPage }}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <ThemeToggle />
        <button class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden relative">
      <!-- Side Navigation -->
      <aside
        v-if="showSidebar"
        class="absolute md:relative inset-y-0 left-0 w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-30 transition-all shadow-xl md:shadow-none"
      >
        <div class="p-4 border-b border-gray-100 dark:border-gray-800">
          <SearchBar />
        </div>

        <div class="flex p-2 gap-1 border-b border-gray-100 dark:border-gray-800">
          <button
            v-for="tab in [
              { key: 'surahs', text: 'السور' },
              { key: 'juz', text: 'الأجزاء' },
              { key: 'bookmarks', text: 'العلامات' },
            ]"
            :key="tab"
            @click="activeTab = tab.key"
            class="flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all"
            :class="[
              activeTab === tab.key
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800',
            ]"
          >
            {{ tab.text }}
          </button>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <SurahList v-if="activeTab === 'surahs'" @select-surah="selectSurah" />
          <JuzList v-if="activeTab === 'juz'" @select-juz="selectSurah" />
          <BookmarksList v-if="activeTab === 'bookmarks'" @select-surah="selectSurah" />
        </div>
      </aside>

      <!-- Mobile Overlay -->
      <div
        v-if="showSidebar"
        @click="showSidebar = false"
        class="md:hidden absolute inset-0 bg-black/50 backdrop-blur-sm z-20"
      ></div>

      <!-- Main Content -->
      <main
        class="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-0 md:p-2 lg:p-4 transition-all duration-300"
        :class="{ 'pb-24 md:pb-28': audioStore.currentAyahKey || audioStore.isPlaying }"
      >
        <div
          class="w-full h-full max-w-full mx-auto bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden relative"
        >
          <MushafSlider />
        </div>
      </main>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import SurahList from '@/components/SurahList.vue'
import JuzList from '@/components/JuzList.vue'
import BookmarksList from '@/components/BookmarksList.vue'
import SearchBar from '@/components/SearchBar.vue'
import MushafSlider from '@/components/MushafSlider.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useQuranStore } from '@/stores/quranStore'
import { useAudioStore } from '@/stores/audioStore'
import { JUZ } from '@/utils/JUZ'
import { chapters } from '@/chapters'

const activeTab = ref('surahs')
const showSidebar = ref(window.innerWidth > 768)
const store = useQuranStore()
const audioStore = useAudioStore()

const currentSurahName = computed(() => {
  const surahId = store.currentSurah[0]
  return chapters[surahId]?.name || `Surah ${surahId}`
})

const currentJuz = computed(() => {
  for (const [id, data] of Object.entries(JUZ)) {
    const juzId = Number(id)
    const nextPageStart = JUZ[juzId + 1]?.startpage || 605
    if (store.currentPage >= data.startpage && store.currentPage < nextPageStart) {
      return juzId.toLocaleString('ar-Eg')
    }
  }
  return '1'.toLocaleString('ar-Eg')
})

const selectSurah = async (surahNumber) => {
  if (window.innerWidth < 768) showSidebar.value = false
}
</script>

<style>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #10b981;
  border-radius: 10px;
}
</style>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.main-header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  text-align: center;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.side-nav {
  width: 300px;
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #dee2e6;
}

.tabs button {
  flex: 1;
  padding: 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: bold;
}

.tabs button.active {
  background-color: #e9ecef;
  border-bottom: 3px solid #2c3e50;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.content-area {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.welcome-message {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #6c757d;
}
</style>
