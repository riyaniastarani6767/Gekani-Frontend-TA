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
  <div class="min-h-screen flex bg-[#f7f9f7] relative overflow-hidden">
    <!-- Left branding + ilustrasi panel (desktop only) -- hijau gelap solid -->
    <div class="hidden lg:flex lg:w-1/2 flex-col p-12 relative overflow-hidden bg-[#1e3a2a]">
      <!-- Dekorasi lingkaran, khusus di dalam panel hijau -->
      <div class="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/[0.04] pointer-events-none"></div>
      <div class="absolute -top-6 right-24 w-28 h-28 rounded-full bg-white/[0.05] pointer-events-none"></div>
      <svg class="absolute bottom-0 left-0 w-52 h-52 text-white/[0.15] pointer-events-none" viewBox="0 0 200 200">
        <defs>
          <pattern id="loginDotsGreen" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#loginDotsGreen)" />
      </svg>

      <div class="flex items-center gap-2.5 relative z-10">
        <div class="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
          <svg class="w-4.5 h-4.5 text-[#1e3a2a]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 2L4.09 12.11a1 1 0 00.77 1.64H11l-1 8.25L19.91 11.89A1 1 0 0019.14 10.25H13L14 2z" />
          </svg>
        </div>
        <div class="leading-tight">
          <div class="font-bold text-[13px] tracking-wide text-white">YUDI MOTOR</div>
          <div class="font-semibold text-[11px] tracking-wide text-[#8fb89f]">ANALYTICS</div>
        </div>
      </div>

      <!-- Blok konten di-center vertikal sebagai satu kesatuan -->
      <div class="flex-1 flex flex-col justify-center gap-10 max-w-md relative z-10">
        <div>
          <h2 class="text-[40px] font-extrabold leading-[1.08] text-white mb-1">
            Kelola Stok
          </h2>
          <h2 class="text-[40px] font-extrabold leading-[1.08] text-[#8fb89f] mb-5">
            Lebih Cerdas
          </h2>
          <div class="w-12 h-[3px] bg-[#8fb89f] rounded-full mb-5"></div>
          <p class="text-[#c3d9cb] text-[14px] leading-relaxed">
            Dapatkan insight terbaik untuk manajemen persediaan produk otomotif Anda.
          </p>
        </div>

        <!-- Ilustrasi line-art: clipboard checklist + panel grafik + kotak, warna terang di atas hijau gelap -->
        <div class="relative w-[260px] h-[210px] shrink-0">
          <svg class="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 260 210" fill="none">
            <!-- Clipboard -->
            <rect x="24" y="20" width="112" height="164" rx="9" fill="#254a34" stroke="white" stroke-width="2" stroke-opacity="0.55" />
            <rect x="58" y="9" width="44" height="19" rx="5" fill="#254a34" stroke="white" stroke-width="2" stroke-opacity="0.55" />
            <circle cx="80" cy="18.5" r="3.5" fill="white" fill-opacity="0.4" />

            <g stroke-opacity="0.6">
              <g v-for="(y, i) in [56, 87, 118, 149]" :key="i">
                <rect :x="37" :y="y - 7" width="14" height="14" rx="3.5" stroke="white" stroke-width="2" fill="#8fb89f" fill-opacity="0.25" />
                <path :d="`M40.5 ${y} l2.5 2.5 l5 -6`" stroke="#8fb89f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <line :x1="58" :y1="y" :x2="124" :y2="y" stroke="white" stroke-width="2" stroke-opacity="0.4" />
              </g>
            </g>

            <!-- Panel grafik mengambang -->
            <rect x="102" y="80" width="122" height="92" rx="9" fill="#254a34" stroke="white" stroke-width="2" stroke-opacity="0.55" />
            <circle cx="117" cy="96" r="3.5" fill="white" fill-opacity="0.4" />
            <line x1="130" y1="96" x2="204" y2="96" stroke="white" stroke-width="2" stroke-opacity="0.3" />
            <rect x="117" y="130" width="12" height="30" rx="2" fill="#8fb89f" fill-opacity="0.6" />
            <rect x="137" y="117" width="12" height="43" rx="2" fill="white" />
            <rect x="157" y="139" width="12" height="21" rx="2" fill="#8fb89f" fill-opacity="0.6" />
            <line x1="117" y1="166" x2="200" y2="166" stroke="white" stroke-width="2" stroke-opacity="0.2" />

            <!-- Kotak paket -->
            <g transform="translate(130 168)" stroke="white" stroke-width="2" stroke-opacity="0.55">
              <path d="M0 26 L39 9 L78 26 L39 43 Z" fill="#254a34" />
              <path d="M0 26 L0 56 L39 73 L39 43 Z" fill="#173023" />
              <path d="M78 26 L78 56 L39 73 L39 43 Z" fill="#254a34" />
            </g>
          </svg>
        </div>
      </div>
    </div>

    <!-- Right form panel: kotak solid putih, full height -->
    <div class="flex-1 flex flex-col relative bg-white">
      <!-- Mobile-only branding header -->
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

      <div class="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div class="w-full max-w-[460px] form-pop">
          <h1 class="text-[28px] font-bold text-[#111] tracking-tight mb-2">Masuk ke Akun Anda</h1>
          <p class="text-[15px] text-[#888] mb-9 leading-relaxed">Gunakan akun yang telah didaftarkan oleh administrator.</p>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            <div>
              <label class="block text-[14px] font-medium text-[#444] mb-2">Username</label>
              <div class="relative">
                <svg class="w-5 h-5 text-[#bbb] absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  v-model="username"
                  type="text"
                  placeholder="Masukkan username"
                  class="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-[#e0e0e0] outline-none focus:border-[#2d6a4f] text-[15px] text-[#222] transition-colors autofill-input"
                />
              </div>
            </div>

            <div>
              <label class="block text-[14px] font-medium text-[#444] mb-2">Password</label>
              <div class="relative">
                <svg class="w-5 h-5 text-[#bbb] absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Masukkan password"
                  class="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-[#e0e0e0] outline-none focus:border-[#2d6a4f] text-[15px] text-[#222] transition-colors autofill-input"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666] transition-colors"
                  :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                >
                  <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.025 10.025 0 012.132-3.62m3.09-2.523A9.958 9.958 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.965 9.965 0 01-1.563 3.029M3 3l18 18" />
                  </svg>
                </button>
              </div>
            </div>

            <transition name="fade">
              <p v-if="errorMsg" class="text-[13.5px] text-[#8a4a4a] bg-[#f0dede] border border-[#e6c9c9] rounded-lg px-4 py-3">
                {{ errorMsg }}
              </p>
            </transition>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full flex items-center justify-center gap-2 bg-[#1e3a2a] hover:bg-[#2d5a3d] text-white font-semibold text-[15px] py-3.5 rounded-xl transition-colors disabled:opacity-60"
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
