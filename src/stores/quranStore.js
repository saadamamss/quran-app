import { defineStore } from 'pinia'

export const useQuranStore = defineStore('quran', {
  state: () => ({
    bookmarks: [],
    currentSurah: [1],
    currentPage: 1,
    lastRead: 1,
    swiperEl: null,
    settings: {
      translation: 'en.sahih',
      fontSize: 'medium',
      theme: 'light',
    },
  }),
  actions: {
    addBookmark(ayah) {
      this.bookmarks.push(ayah)
    },
    setCurrentSurah(surah) {
      this.currentSurah = surah //array
    },
    setCurrentPage(page) {
      this.currentPage = page
      this.lastRead = page
    },
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings }
    },
    setSwiper(swiper) {
      this.swiperEl = swiper
    },
    goToPage(_page) {
      this.swiperEl.$el.swiper.slideTo(_page - 1)
    },
  },
  persist: true, // for localStorage persistence
})
