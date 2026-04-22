<template>
  <router-view />
  <AyahModal />
  <AudioPlayer />
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import AyahModal from '@/components/AyahModal.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import { useQuranStore } from '@/stores/quranStore'

const store = useQuranStore()

onMounted(() => {
  // Apply persisted theme on startup
  if (store.settings.theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<style>
/* Add your styles here */
.app {
  direction: rtl;
  font-family: 'Traditional Arabic', 'Amiri', serif;
}
.arabic {
  font-size: 1.5rem;
  line-height: 2.5rem;
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .side-nav {
    width: 100%;
    height: 300px;
    border-right: none;
    border-bottom: 1px solid #dee2e6;
  }

  .tabs {
    position: sticky;
    top: 0;
    background-color: #f8f9fa;
    z-index: 1;
  }
}
</style>
