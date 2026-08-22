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
    <!-- Left branding panel (desktop only) -->
    <div class="hidden lg:flex lg:w-1/2 bg-[#1e3a2a] text-white flex-col justify-between p-12 relative overflow-hidden">
      <!-- subtle decorative circles, replaces the old fake-data stat card -->
      <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/[0.04]"></div>
      <div class="absolute bottom-10 -left-16 w-56 h-56 rounded-full bg-white/[0.03]"></div>

      <div class="relative">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-[#2d6a4f] flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L4.09 12.11a1 1 0 00.77 1.64H11l-1 8.25L19.91 11.89A1 1 0 0019.14 10.25H13L14 2z" />
            </svg>
          </div>
          <div class="leading-tight">
            <div class="font-bold text-[11px] tracking-wide">YUDI MOTOR</div>
            <div class="font-bold text-[11px] tracking-wide text-[#8fb89f]">ANALYTICS</div>
          </div>
        </div>
      </div>

      <div class="relative">
        <h2 class="text-3xl font-bold leading-tight mb-3">Kelola Stok Lebih<br />Tepat &amp; Percaya Diri</h2>
        <p class="text-[#c3d9cb] text-[13px] leading-relaxed max-w-sm">
          Unggah data penjualan, dapatkan rekomendasi produk mana yang harus ditambah, dipantau, atau dikurangi stoknya.
        </p>
      </div>
    </div>

    <!-- Right form panel -->
    <div class="flex-1 flex flex-col bg-[#fafbfa]">
      <!-- Mobile-only branding header, so the screen isn't just blank whitespace on narrow viewports -->
      <div class="lg:hidden flex items-center gap-2.5 px-6 py-5">
        <div class="w-8 h-8 rounded-lg bg-[#1e3a2a] flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 2L4.09 12.11a1 1 0 00.77 1.64H11l-1 8.25L19.91 11.89A1 1 0 0019.14 10.25H13L14 2z" />
          </svg>
        </div>
        <div class="leading-tight">
          <div class="font-bold text-[11px] tracking-wide text-[#1e3a2a]">YUDI MOTOR</div>
          <div class="font-bold text-[11px] tracking-wide text-[#5c8a70]">ANALYTICS</div>
        </div>
      </div>

      <div class="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div class="w-full max-w-sm bg-white border border-[#e8eae8] rounded-[14px] shadow-sm p-7 sm:p-8 form-pop">
          <h1 class="text-[19px] font-bold text-[#111] tracking-tight mb-1">Masuk ke Akun Anda</h1>
          <p class="text-xs text-[#888] mb-7">Gunakan akun yang telah didaftarkan oleh administrator.</p>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-[12.5px] font-medium text-[#555] mb-1.5">Username</label>
              <input
                v-model="username"
                type="text"
                placeholder="Masukkan username"
                class="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-[#e0e0e0] outline-none focus:border-[#2d6a4f] text-[13px] text-[#222] transition-colors autofill-input"
              />
            </div>

            <div>
              <label class="block text-[12.5px] font-medium text-[#555] mb-1.5">Password</label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Masukkan password"
                  class="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-[#e0e0e0] outline-none focus:border-[#2d6a4f] text-[13px] text-[#222] pr-10 transition-colors autofill-input"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666] transition-colors"
                  :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                >
                  <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.025 10.025 0 012.132-3.62m3.09-2.523A9.958 9.958 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.965 9.965 0 01-1.563 3.029M3 3l18 18" />
                  </svg>
                </button>
              </div>
            </div>

            <transition name="fade">
              <p v-if="errorMsg" class="text-[12.5px] text-[#8a4a4a] bg-[#f0dede] border border-[#e6c9c9] rounded-lg px-3.5 py-2.5">
                {{ errorMsg }}
              </p>
            </transition>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full flex items-center justify-center gap-2 bg-[#1e3a2a] hover:bg-[#2d5a3d] text-white font-semibold text-[13px] py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <svg v-if="isSubmitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
                <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              {{ isSubmitting ? 'Memproses...' : 'Masuk' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes formPop {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.form-pop {
  animation: formPop 0.35s ease both;
}

/* Netralkan highlight biru/kuning otomatis dari Chrome autofill */
.autofill-input:-webkit-autofill,
.autofill-input:-webkit-autofill:hover,
.autofill-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0px 1000px #ffffff inset;
  -webkit-text-fill-color: #222;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
