<template>
  <div class="ayah-display">
    <!-- Bismillah for start of surah (except Surah 9) -->
    <div 
      v-if="ayah.ayahInSurah === 1 && ayah.surahNumber !== 1 && ayah.surahNumber !== 9"
      class="bismillah"
    >
      بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
    </div>
    
    <!-- Ayah Text -->
    <p class="ayah-text">
      {{ ayah.text }}
      <span class="ayah-end">﴿{{ ayah.ayahInSurah }}﴾</span>
    </p>
  </div>
</template>

<script setup>
defineProps({
  ayah: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.ayah-display {
  font-family: 'Traditional Arabic', 'Amiri', serif;
  font-size: 2rem;
  line-height: 3.5rem;
  text-align: right;
  color: #333;
}

.bismillah {
  font-size: 2.5rem;
  text-align: center;
  margin: 1rem 0;
  color: #2c3e50;
}

.ayah-text {
  margin: 0;
  word-spacing: -0.2em; /* Adjust for better Arabic word connection */
}

.ayah-end {
  color: #2c3e50;
  margin-right: 0.5rem;
}
</style>