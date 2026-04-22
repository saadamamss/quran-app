<template>
  <div class="w-64 h-full bg-white shadow-md">
    <div class="p-4 border-b border-gray-200">
      <h1 class="text-xl font-bold text-emerald-600">Quran Mushaf</h1>
    </div>

    <div class="flex border-b border-gray-200">
      <button
        @click="activeTab = 'surahs'"
        :class="[
          'py-3 px-4 font-medium',
          activeTab === 'surahs'
            ? 'text-emerald-600 border-b-2 border-emerald-600'
            : 'text-gray-600',
        ]"
      >
        Surahs
      </button>
      <button
        @click="activeTab = 'bookmarks'"
        :class="[
          'py-3 px-4 font-medium',
          activeTab === 'bookmarks'
            ? 'text-emerald-600 border-b-2 border-emerald-600'
            : 'text-gray-600',
        ]"
      >
        Bookmarks
      </button>
    </div>

    <div class="overflow-y-auto h-[calc(100%-110px)]">
      <SurahList v-if="activeTab === 'surahs'" />
      <BookmarksList v-else />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SurahList from './SurahList.vue'
import BookmarksList from './BookmarksList.vue'

const activeTab = ref('surahs')
</script>
