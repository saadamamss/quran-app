import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/default.vue'
import SurahView from '@/views/SurahView.vue'
import BookmarksView from '@/views/BookmarksView.vue'
import HomeView from '@/views/HomeView.vue'
const routes = [
  {
    path: '/',
    name: 'layout',
    component: DefaultLayout,
    children: [
      {
        path: '/',
        name: 'home',
        component: HomeView,
      },
      {
        path: '/surah/:number',
        name: 'surah',
        component: SurahView,
        props: true,
      },
      {
        path: '/bookmarks',
        name: 'bookmarks',
        component: BookmarksView,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
