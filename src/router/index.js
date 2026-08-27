import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/analisis-baru',
    name: 'analisis-baru',
    component: () => import('@/views/AnalisisBaruView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/hasil-analisis',
    name: 'hasil-analisis',
    component: () => import('@/views/HasilAnalisisView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/data-produk',
    name: 'data-produk',
    component: () => import('@/views/DataProdukView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/riwayat-analisis',
    name: 'riwayat-analisis',
    component: () => import('@/views/RiwayatAnalisisView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // Scroll ke atas tiap pindah halaman -- default Vue Router TIDAK
  // melakukan ini otomatis, jadi tanpa baris ini posisi scroll lama
  // "kebawa" ke halaman baru dan bikin tampilan kelihatan numpuk/aneh.
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

// Route guard: sesuai Use Case Diagram (Gambar 3.3) -- Login jadi syarat
// wajib sebelum akses seluruh fitur lainnya.
// Pakai return-based guard (bukan next()), sesuai API terbaru Vue Router.
router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { name: 'login' }
  }
  if (to.name === 'login' && authStore.isLoggedIn) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
