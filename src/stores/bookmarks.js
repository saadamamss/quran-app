import { defineStore } from 'pinia'

export const useBookmarksStore = defineStore('bookmarks', {
  state: () => ({
    bookmarks: JSON.parse(localStorage.getItem('quran-bookmarks')) || []
  }),
  actions: {
    toggleBookmark(surahNumber, ayahNumber) {
      const index = this.bookmarks.findIndex(
        b => b.surah === surahNumber && b.ayah === ayahNumber
      )
      
      if (index === -1) {
        this.bookmarks.push({ surah: surahNumber, ayah: ayahNumber })
      } else {
        this.bookmarks.splice(index, 1)
      }
      
      this.persistBookmarks()
    },
    persistBookmarks() {
      localStorage.setItem('quran-bookmarks', JSON.stringify(this.bookmarks))
    }
  }
})