<template>
  <div class="bookmark-list">
    <div 
      v-for="(bookmark, index) in store.bookmarks" 
      :key="index"
      class="bookmark-item"
      @click="selectBookmark(bookmark)"
    >
      <div class="bookmark-info">
        <h4>Surah {{ bookmark.surahNumber }}:{{ bookmark.ayahNumber }}</h4>
        <p class="arabic-preview">{{ bookmark.arabicText.substring(0, 30) }}...</p>
      </div>
    </div>
    
    <div v-if="!store.bookmarks.length" class="empty-state">
      <p>No bookmarks yet</p>
    </div>
  </div>
</template>

<script setup>
import { useQuranStore } from '@/stores/quranStore';

const store = useQuranStore();
const emit = defineEmits(['select-surah']);

const selectBookmark = (bookmark) => {
  emit('select-surah', bookmark.surahNumber);
};
</script>

<style scoped>
.bookmark-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bookmark-item {
  padding: 0.75rem;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.bookmark-item:hover {
  background-color: #f1f1f1;
}

.bookmark-info h4 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.arabic-preview {
  margin: 0;
  font-family: 'Traditional Arabic', 'Amiri', serif;
  font-size: 1.1rem;
  color: #555;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}
</style>