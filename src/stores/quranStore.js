import { defineStore } from 'pinia'

export const useQuranStore = defineStore('quran', {
  state: () => ({
    bookmarks: [],
    currentSurah: [1],
    currentPage: 1,
    lastRead: 1,
    selectedAyahKey: null,
    swiperEl: null,
    settings: {
      translation: 'en.sahih',
      fontSize: 'medium',
      theme: 'light',
    },
  }),
  actions: {
    addBookmark(ayah) {
      if (!this.bookmarks.some((b) => b.verse_key === ayah.verse_key)) {
        this.bookmarks.push(ayah)
      }
    },
    removeBookmark(verse_key) {
      this.bookmarks = this.bookmarks.filter((b) => b.verse_key !== verse_key)
    },
    setCurrentSurah(surah) {
      this.currentSurah = surah //array
    },
    setCurrentPage(page) {
      this.currentPage = page
      this.lastRead = page
    },
    setSelectedAyahKey(key) {
      this.selectedAyahKey = key
    },
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings }
    },
    setSwiper(swiper) {
      this.swiperEl = swiper
    },
    goToPage(_page) {
      this.swiperEl.slideTo(_page - 1)
    },
  },
  persist: true, // for localStorage persistence
})
