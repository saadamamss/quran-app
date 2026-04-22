import { ref } from 'vue'

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

  async getPage(page) {
    const response = await fetch(
      `https://api.qurancdn.com/api/qdc/verses/by_page/${page}?words=true&per_page=all&fields=text_uthmani%2Cchapter_id%2Chizb_number%2Ctext_imlaei_simple&reciter=7&word_translation_language=en&word_fields=verse_key%2Cverse_id%2Cpage_number%2Clocation%2Ctext_uthmani%2Ccode_v1%2Cqpc_uthmani_hafs&mushaf=2&filter_page_words=true&from=0%3A0&to=0%3A0`,
      {
        headers: {
          accept: '*/*',
          'sec-ch-ua': '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
        referrer: 'https://quran.com/',
        referrerPolicy: 'origin-when-cross-origin',
        body: null,
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
      },
    )
    return await response.json()
  },

  async search(query) {
    const response = await fetch(`${API_BASE}/search/${query}/all/${'ar.sahih'}`)
    return await response.json()
  },
}
