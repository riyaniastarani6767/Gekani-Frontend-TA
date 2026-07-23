<script setup>
import { ref } from 'vue'
import { useTourStore } from '@/stores/tour'

const tourStore = useTourStore()
const dontShowAgain = ref(false)

const steps = [
  { icon: 'upload', label: 'Ringkasan', desc: 'Lihat kondisi stok' },
  { icon: 'target', label: 'Panduan', desc: 'Prioritas keputusan' },
  { icon: 'plus', label: 'Analisis Baru', desc: 'Mulai analisis' },
  { icon: 'file', label: 'Upload Data', desc: 'Unggah penjualan' },
  { icon: 'calendar', label: 'Pilih Periode', desc: 'Rentang tanggal' },
  { icon: 'list', label: 'Data Produk', desc: 'Cari & filter' },
  { icon: 'clock', label: 'Riwayat', desc: 'Analisis sebelumnya' },
]

const icons = {
  upload: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  target: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 16a4 4 0 100-8 4 4 0 000 8z',
  plus: 'M12 4v16m8-8H4',
  file: 'M9 12l2 2 4-4M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  list: 'M4 6h16M4 12h16M4 18h7',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
}

function handleStart() {
  tourStore.startTour()
}

function handleSkip() {
  tourStore.skipTour(dontShowAgain.value)
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl max-w-lg w-full p-8">
      <div class="flex justify-center mb-5">
        <div class="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <svg class="w-8 h-8 text-[#1b3829]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>

      <h2 class="text-xl font-bold text-gray-900 text-center mb-2">Selamat Datang di Yudi Motor Analytics 👋</h2>
      <p class="text-sm text-gray-500 text-center mb-6">
        Ikuti tur singkat ini untuk memahami cara menggunakan sistem Business Intelligence untuk manajemen persediaan.
      </p>

      <div class="grid grid-cols-3 gap-3 mb-6">
        <div v-for="(s, i) in steps" :key="i" class="flex flex-col items-center text-center">
          <div class="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mb-1.5">
            <svg class="w-4.5 h-4.5 text-[#1b3829]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="icons[s.icon]" />
            </svg>
          </div>
          <div class="text-[11px] font-semibold text-gray-700">{{ s.label }}</div>
          <div class="text-[9.5px] text-gray-400">{{ s.desc }}</div>
        </div>
      </div>

      <label class="flex items-center gap-2 mb-5 cursor-pointer select-none">
        <input type="checkbox" v-model="dontShowAgain" class="rounded border-gray-300" />
        <span class="text-xs text-gray-500">Jangan tampilkan lagi</span>
      </label>

      <div class="flex gap-3">
        <button
          @click="handleSkip"
          class="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Lewati
        </button>
        <button
          @click="handleStart"
          class="flex-1 py-2.5 rounded-lg bg-[#1b3829] hover:bg-[#2d5a3d] text-white text-sm font-semibold"
        >
          Mulai Tur
        </button>
      </div>
    </div>
  </div>
</template>
