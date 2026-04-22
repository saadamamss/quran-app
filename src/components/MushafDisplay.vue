<template>
  <div class="mushaf-page" :class="{ rtl: isRTL }">
    <!-- Page Header (Surah Name) -->
    <div class="page-header" v-if="showHeader">
      <h2 class="surah-name">{{ currentSurahName }}</h2>
    </div>

    <!-- Page Content (2 columns) -->
    <div class="page-content">
      <!-- Left Column -->
      <div class="page-column">
        <div
          v-for="ayah in leftColumnAyahs"
          :key="`${ayah.page}-${ayah.ayah}-left`"
          class="ayah-container"
        >
          <ayah-display :ayah="ayah" />
        </div>
      </div>

      <!-- Right Column -->
      <div class="page-column">
        <div
          v-for="ayah in rightColumnAyahs"
          :key="`${ayah.page}-${ayah.ayah}-right`"
          class="ayah-container"
        >
          <ayah-display :ayah="ayah" />
        </div>
      </div>
    </div>

    <!-- Page Footer (Page Number) -->
    <div class="page-footer">
      <span class="page-number">الصفحة {{ pageNumber }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Ayah from './Ayah.vue'

const props = defineProps({
  ayahs: {
    type: Array,
    required: true,
  },
  pageNumber: {
    type: Number,
    required: true,
  },
  isRTL: {
    type: Boolean,
    default: true,
  },
})

// Split ayahs into two columns
const leftColumnAyahs = computed(() => {
  return props.ayahs.slice(0, Math.ceil(props.ayahs.length / 2))
})

const rightColumnAyahs = computed(() => {
  return props.ayahs.slice(Math.ceil(props.ayahs.length / 2))
})

// Get surah name for header
const currentSurahName = computed(() => {
  if (props.ayahs.length === 0) return ''
  const firstAyah = props.ayahs[0]
  return firstAyah.surahName || `Surah ${firstAyah.surahNumber}`
})

const showHeader = computed(() => {
  // Only show header if this page starts a new surah
  return props.ayahs[0]?.ayahInSurah === 1
})
</script>

<style scoped>
.mushaf-page {
  width: 100%;
  height: 100%;
  background-color: #f5f2e9; /* Parchment color */
  padding: 2rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.rtl {
  direction: rtl;
}

.page-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.surah-name {
  font-family: 'Traditional Arabic', 'Amiri', serif;
  font-size: 2rem;
  color: #2c3e50;
}

.page-content {
  display: flex;
  flex: 1;
  gap: 2rem;
}

.page-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.ayah-container {
  line-height: 2.5;
}

.page-footer {
  text-align: center;
  margin-top: 1.5rem;
  font-family: 'Traditional Arabic', 'Amiri', serif;
  font-size: 1.2rem;
  color: #2c3e50;
}
</style>
