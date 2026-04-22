<template>
  
  <Swiper
    :modules="modules"
    :direction="'horizontal'"
    :rtl="true"
    :slides-per-view="slidesPerView"
    :slides-per-group="slidesPerGroup"
    :space-between="spaceBetween"
    :mousewheel="false"
    :keyboard="true"
    :initial-slide="initialSlide"
    :breakpoints="breakpoints"
    :virtual="virtualOptions"
    @swiper="onSwiperInit"
    @slide-change="onSlideChange"
    class="mushaf-swiper"
    ref="swiperEl"
  >
    <swiper-slide v-for="(page, index) in 604" :key="index">
      <!-- <div class="mushaf-page bg-yellow-100 h-full">
        {{ page }}
      </div> -->
      <MushafPage :page-number="page" :active="isActive(page)" />
    </swiper-slide>
  </Swiper>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Virtual, Mousewheel, Keyboard } from 'swiper/modules'
import 'swiper/css'
import MushafPage from '@/components/MushafPage.vue'
import { useQuranStore } from '@/stores/quranStore'
const modules = [Virtual, Mousewheel, Keyboard]
const TOTAL_PAGES = 604
const store = useQuranStore()
// Swiper instance reference
const swiperEl = ref(null)
const swiper = ref(null)
const currentPage = computed(() => store.currentPage)
const initialSlide = ref(0)
const windowWidth = ref(window.innerWidth)

// Responsive settings
const slidesPerView = ref(1)
const slidesPerGroup = ref(1) // Added slidesPerGroup
const spaceBetween = ref(0)

// Breakpoints configuration
const breakpoints = ref({
  // When window width is >= 1200px
  1200: {
    slidesPerView: 2,
    slidesPerGroup: 2, // Slide 2 at a time in desktop view
    spaceBetween: 20,
  },
})

// Update responsive settings when window resizes
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Virtual slides configuration
const virtualOptions = ref({
  slides: Array.from({ length: TOTAL_PAGES }, (_, i) => i),
  renderExternal: true,
  cache: true, // Enable caching for better performance
})

// All slides (virtual)
const virtualSlides = computed(() => Array.from({ length: TOTAL_PAGES }, (_, i) => i))

// Check if a slide should be considered active
const isActive = (pageNumber) => {
  if (windowWidth.value < 1200) {
    return [currentPage.value - 1, currentPage.value, currentPage.value + 1].includes(pageNumber)
  } else {
    // For 2-slide view, consider both slides as "active"
    return [
      currentPage.value - 3,
      currentPage.value - 2,
      currentPage.value - 1,
      currentPage.value,
      currentPage.value + 1,
      currentPage.value + 2,
      currentPage.value + 3,
    ].includes(pageNumber)
  }
}

// Initialize swiper
const onSwiperInit = (swiperInstance) => {
  swiper.value = swiperInstance
  store.setSwiper(swiperInstance)
  
  // Go to initial page from store or props
  if (store.currentPage > 1) {
    swiperInstance.slideTo(store.currentPage - 1, 0)
  }
}

// Handle page change
const onSlideChange = () => {
  if (swiper.value) {
    // For 2-slide view, we need to handle the active index differently
    if (windowWidth.value >= 1200) {
      // In 2-slide view, activeIndex represents the first visible slide
      store.setCurrentPage(swiper.value.activeIndex + 1)

      // Ensure we don't go past the last page
      if (currentPage.value >= TOTAL_PAGES - 1) {
        store.setCurrentPage(TOTAL_PAGES - 1)
        swiper.value.slideTo(TOTAL_PAGES - 2) // Adjust to show last two pages
      }
    } else {
      // Single slide view - normal behavior
      store.setCurrentPage(swiper.value.activeIndex + 1)
    }
  }
}

// Navigation methods
const slidePrev = () => {
  if (swiperEl.value && currentPage.value > 1) {
    swiperEl.value.$el.swiper.slidePrev()
  }
}

const slideNext = () => {
  if (swiperEl.value && currentPage.value < TOTAL_PAGES) {
    swiperEl.value.$el.swiper.slideNext()
  }
}

const goToPage = (page) => {
  page = Math.max(1, Math.min(TOTAL_PAGES, page))
  if (swiperEl.value && page !== currentPage.value) {
    // For 2-slide view, adjust the target slide to show the requested page properly
    const targetSlide =
      windowWidth.value >= 1200 ? Math.max(0, Math.min(TOTAL_PAGES - 2, page - 1)) : page - 1
    swiperEl.value.$el.swiper.slideTo(targetSlide)
  }
}


</script>

<style scoped>
.mushaf-swiper {
  width: 100%;
  height: 100%;
}

.slide-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f2e9;
  color: #666;
  font-size: 1.2rem;
}

/* Adjust spacing between slides in desktop view */
@media (min-width: 1200px) {
  .mushaf-swiper {
    padding: 0 2rem;
  }
}
</style>
