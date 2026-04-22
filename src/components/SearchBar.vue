<!-- components/SearchBar.vue -->
<template>
  <div class="search-bar">
    <input 
      v-model="query" 
      @input="search" 
      placeholder="Search Quran..."
    />
    <div class="results" v-if="results.length">
      <div v-for="result in results" :key="result.ayah" class="result-item">
        <!-- Display search results -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import quranApi from '../services/quranApi';

const query = ref('');
const results = ref([]);

const search = async () => {
  if (query.value.length > 2) {
    const response = await quranApi.search(query.value);
    results.value = response.data.matches;
  }
};
</script>