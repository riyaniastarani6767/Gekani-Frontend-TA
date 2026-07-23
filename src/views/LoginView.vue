<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMsg = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  if (!username.value || !password.value) {
    errorMsg.value = 'Username dan password wajib diisi.'
    return
  }
  errorMsg.value = ''
  isSubmitting.value = true
  try {
    await authStore.login(username.value, password.value)
    router.push({ name: 'dashboard' })
  } catch (e) {
    errorMsg.value = e.response?.data?.error || 'Username atau password salah.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex">
    <div class="hidden lg:flex lg:w-1/2 bg-[#0d2818] text-white flex-col justify-between p-12 relative overflow-hidden">
      <div>
        <div class="flex items-center gap-2 mb-16">
          <div class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          </div>
          <div class="leading-tight">
            <div class="font-bold text-sm">YUDI MOTOR</div>
            <div class="font-bold text-sm text-emerald-400">ANALYTICS</div>
          </div>
        </div>

        <div class="bg-white/5 border border-white/10 rounded-2xl p-5 max-w-sm space-y-4 backdrop-blur-sm">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs text-emerald-200/60">Nilai Penjualan Bulan Ini</div>
              <div class="text-xl font-semibold">Rp8,4 Juta</div>
            </div>
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs text-emerald-200/60">Produk Prioritas Utama</div>
              <div class="text-xl font-semibold">18 Produk</div>
            </div>
            <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <div class="text-xs text-emerald-200/60 mb-1">Stok Aman</div>
            <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full w-3/5 bg-emerald-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 class="text-3xl font-bold leading-tight mb-3">Kelola Stok Lebih<br />Tepat &amp; Percaya Diri</h2>
        <p class="text-emerald-100/60 text-sm max-w-sm">
          Unggah data penjualan, dapatkan rekomendasi produk mana yang harus ditambah, dipantau, atau dikurangi stoknya.
        </p>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-sm">
        <h1 class="text-2xl font-bold text-gray-900 mb-1">Masuk ke Akun Anda</h1>
        <p class="text-sm text-gray-500 mb-8">Gunakan akun yang telah didaftarkan oleh administrator.</p>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
            <input
              v-model="username"
              type="text"
              placeholder="Masukkan username"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Masukkan password"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm pr-10"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full bg-[#0d2818] hover:bg-[#123320] text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {{ isSubmitting ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
