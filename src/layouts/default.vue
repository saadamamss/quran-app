<template>
  <div class="flex flex-col h-screen min-h-screen max-h-screen bg-quran-light dark:bg-quran-dark">
    <!-- Header -->
    <!-- <header class="bg-quran-primary text-white p-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold">Al-Quran Al-Kareem</h1>
      <ThemeToggle />
    </header> -->

    <div class="flex flex-1 overflow-hidden">
      <!-- Side Navigation -->
      <aside
        class="w-72 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
      >
        <div class="flex border-b border-gray-200 dark:border-gray-700">
          <button
            @click="activeTab = 'surahs'"
            class="flex-1 p-4 font-semibold transition-colors"
            :class="{
              'bg-gray-200 dark:bg-gray-700 border-b-2 border-quran-primary':
                activeTab === 'surahs',
              'hover:bg-gray-100 dark:hover:bg-gray-600': activeTab !== 'surahs',
            }"
          >
            Surahs
          </button>
          <button
            @click="activeTab = 'bookmarks'"
            class="flex-1 p-4 font-semibold transition-colors"
            :class="{
              'bg-gray-200 dark:bg-gray-700 border-b-2 border-quran-primary':
                activeTab === 'bookmarks',
              'hover:bg-gray-100 dark:hover:bg-gray-600': activeTab !== 'bookmarks',
            }"
          >
            Bookmarks
          </button>
        </div>

        <div class="flex-1 overflow-y-auto">
          <SurahList v-if="activeTab === 'surahs'" @select-surah="selectSurah" class="space-y-2" />
          <BookmarksList
            v-if="activeTab === 'bookmarks'"
            @select-surah="selectSurah"
            class="space-y-2"
          />
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto px-6">
        <!-- <AyahDisplay :current-surah="currentSurah" @bookmark="addBookmark" /> -->
        <MushafSlider :initial-page="1"/>
      </main>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import SurahList from '@/components/SurahList.vue'
import BookmarksList from '@/components/BookmarksList.vue'
import AyahDisplay from '@/components/AyahDisplay.vue'
import MushafSlider from '@/components/MushafSlider.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useQuranStore } from '@/stores/quranStore'

const activeTab = ref('surahs')
const currentSurah = ref(null)
const store = useQuranStore()

const selectSurah = async (surahNumber) => {
  currentSurah.value = surahNumber
}

const addBookmark = (ayah) => {
  store.addBookmark(ayah)
}
</script>

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
