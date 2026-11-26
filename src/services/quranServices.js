const API_BASE = 'https://api.alquran.cloud/v1'

export default {
  async getSurahs() {
    const response = await fetch(`${API_BASE}/surah`)
    return await response.json()
  },

  async getSurah(surahNumber, translation = 'ar.sahih') {
    const response = await fetch(`${API_BASE}/surah/${surahNumber}/${translation}`)
    return await response.json()
  },

  async search(query) {
    const response = await fetch(`${API_BASE}/search/${query}/all/${'ar.sahih'}`)
    return await response.json()
  },
}
