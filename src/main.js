import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Register the service worker immediately (not on `load`). Waiting for `load`
// can be delayed by slow third-party assets, which in turn delays offline
// availability and the precache of the page dataset.
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
