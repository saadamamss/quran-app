<template>
  <router-view />
  <AyahModal />
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import AyahModal from '@/components/AyahModal.vue'
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
