import { defineStore } from 'pinia'
import { useQuranStore } from './quranStore'
import { chapters } from '@/chapters'

const STORAGE_KEY = 'quran_audio_data_v2'

export const useAudioStore = defineStore('audio', {
  state: () => {
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    
    return {
      isPlaying: false,
      currentAyahKey: null, // format: "surah:ayah"
      audioElement: null,
      isContinuous: savedData.isContinuous !== undefined ? savedData.isContinuous : true,
      reciter: savedData.reciter || 'ar.alafasy',
      reciters: [
        { id: 'ar.alafasy', name: 'مشاري العفاسي' },
        { id: 'ar.minshawi', name: 'المنشاوي' },
        { id: 'ar.husary', name: 'الحصري' },
        { id: 'ar.abdulsamad', name: 'عبد الباسط عبد الصمد' },
        { id: 'ar.abdurrahmaansudais', name: 'السديس' },
        { id: 'ar.hudhaify', name: 'الحذيفي' },
      ],
      loading: false,
    }
  },
  actions: {
    saveToStorage() {
      const dataToSave = {
        reciter: this.reciter,
        isContinuous: this.isContinuous
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    },

    setReciter(reciterId) {
      this.reciter = reciterId
      this.saveToStorage()
      if (this.isPlaying) {
        this.playAyah(this.currentAyahKey)
      }
    },
    
    setContinuous(val) {
      this.isContinuous = val
      this.saveToStorage()
    },

    async playAyah(key) {
      if (!key) return
      
      try {
        this.loading = true
        if (this.audioElement) {
          try {
            this.audioElement.pause()
          } catch(e) {}
          this.audioElement.onended = null
        }
        
        this.currentAyahKey = key
        
        const response = await fetch(`https://api.alquran.cloud/v1/ayah/${key}/${this.reciter}`)
        const data = await response.json()
        const url = data.data.audio
        
        this.audioElement = new Audio(url)
        this.audioElement.play()
        this.isPlaying = true
        this.loading = false
        
        // Flip page if needed
        const quranStore = useQuranStore()
        if (data.data.page !== quranStore.currentPage) {
          quranStore.setCurrentPage(data.data.page)
          quranStore.goToPage(data.data.page)
        }
        
        this.audioElement.onended = () => {
          if (this.isContinuous) {
            this.playNextAyah()
          } else {
            this.isPlaying = false
          }
        }
      } catch (err) {
        console.error("Audio playback failed", err)
        this.isPlaying = false
        this.loading = false
      }
    },
    
    pauseAudio() {
      if (this.audioElement) {
        try {
          this.audioElement.pause()
        } catch(e) {}
        this.isPlaying = false
      }
    },
    
    resumeAudio() {
      if (this.audioElement) {
        try {
          this.audioElement.play()
        } catch(e) {}
        this.isPlaying = true
      }
    },
    
    stopAudio() {
      if (this.audioElement) {
        try {
          this.audioElement.pause()
        } catch (e) {}
        this.audioElement = null
      }
      this.isPlaying = false
      this.currentAyahKey = null
    },
    
    togglePlay(key) {
      const targetKey = key || this.currentAyahKey
      if (!targetKey) return
      
      if (this.currentAyahKey === targetKey) {
        if (this.isPlaying) {
          this.pauseAudio()
        } else {
          this.resumeAudio()
        }
      } else {
        this.playAyah(targetKey)
      }
    },
    
    playNextAyah() {
      if (!this.currentAyahKey) return
      
      const [surah, ayah] = this.currentAyahKey.split(':').map(Number)
      const totalVerses = chapters[surah].total_verses
      
      let nextKey = ''
      if (ayah < totalVerses) {
        nextKey = `${surah}:${ayah + 1}`
      } else if (surah < 114) {
        nextKey = `${surah + 1}:1`
      } else {
        this.stopAudio()
        return
      }
      
      this.playAyah(nextKey)
    },

    playPrevAyah() {
      if (!this.currentAyahKey) return
      
      const [surah, ayah] = this.currentAyahKey.split(':').map(Number)
      
      let prevKey = ''
      if (ayah > 1) {
        prevKey = `${surah}:${ayah - 1}`
      } else if (surah > 1) {
        const prevSurahTotal = chapters[surah - 1].total_verses
        prevKey = `${surah - 1}:${prevSurahTotal}`
      } else {
        return
      }
      
      this.playAyah(prevKey)
    },
  },
})
