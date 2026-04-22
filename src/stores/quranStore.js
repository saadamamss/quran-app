import { defineStore } from 'pinia'

// Manual Persistence Keys
const STORAGE_KEY = 'quran_app_data_v2'

export const useQuranStore = defineStore('quran', {
  state: () => {
    // Load initial state from localStorage
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

    return {
      bookmarks: savedData.bookmarks || [],
      currentSurah: savedData.currentSurah || [1],
      currentPage: savedData.currentPage || 1,
      lastRead: savedData.lastRead || 1,
      selectedAyahKey: null,
      pageFirstVerseKeys: {},
      swiperEl: null,
      settings: savedData.settings || {
        translation: 'en.sahih',
        fontSize: 'medium',
        theme: 'light',
      },
    }
  },
  actions: {
    // Helper to save state manually
    saveToStorage() {
      const dataToSave = {
        bookmarks: this.bookmarks,
        currentSurah: this.currentSurah,
        currentPage: this.currentPage,
        lastRead: this.lastRead,
        settings: this.settings,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    },

    addBookmark(ayah) {
      if (!this.bookmarks.some((b) => b.verse_key === ayah.verse_key)) {
        this.bookmarks.push(ayah)
        this.saveToStorage()
      }
    },
    removeBookmark(verse_key) {
      this.bookmarks = this.bookmarks.filter((b) => b.verse_key !== verse_key)
      this.saveToStorage()
    },
    setCurrentSurah(surah) {
      this.currentSurah = surah
      this.saveToStorage()
    },
    setCurrentPage(page) {
      this.currentPage = Number(page)
      this.lastRead = Number(page)
      this.saveToStorage()
    },
    setSelectedAyahKey(key) {
      this.selectedAyahKey = key
    },
    setPageFirstVerseKey(page, key) {
      this.pageFirstVerseKeys[page] = key
    },
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings }
      this.saveToStorage()
    },
    setSwiper(swiper) {
      this.swiperEl = swiper
    },
    goToPage(_page) {
      if (this.swiperEl) {
        this.swiperEl.slideTo(_page - 1)
      }
    },
  },
})
