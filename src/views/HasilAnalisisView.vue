<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAnalysisStore } from '@/stores/analysis'

const analysisStore = useAnalysisStore()
const activeTab = ref('matrix')
const loadError = ref(false)

const kondisiList = ['Produk Laris', 'Produk Stabil', 'Produk Musiman', 'Jarang Terjual', 'Produk Grosir']
const abcList = ['A', 'B', 'C']

const badgeAbc = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-amber-100 text-amber-700',
  C: 'bg-red-100 text-red-700',
}
const badgeKondisi = {
  'Produk Laris': 'bg-emerald-100 text-emerald-700',
  'Produk Stabil': 'bg-blue-100 text-blue-700',
  'Produk Musiman': 'bg-amber-100 text-amber-700',
  'Jarang Terjual': 'bg-red-100 text-red-700',
  'Produk Grosir': 'bg-purple-100 text-purple-700',
}

const hasil = computed(() => analysisStore.currentAnalysis?.hasil_segmentasi || [])

const matrix = computed(() => {
  const grid = {}
  for (const kondisi of kondisiList) {
    grid[kondisi] = {}
    for (const abc of abcList) {
      grid[kondisi][abc] = hasil.value.filter(
        (p) => p.kondisi_penjualan === kondisi && p.prioritas_abc === abc
      )
    }
  }
  return grid
})

function formatRupiah(value) {
  if (value >= 1e9) return `Rp${(value / 1e9).toFixed(1)} M`
  if (value >= 1e6) return `Rp${(value / 1e6).toFixed(1)} Jt`
  return `Rp${value.toLocaleString('id-ID')}`
}

function kondisiWarnaSolid(kondisi) {
  return {
    'Produk Laris': '#10b981',
    'Produk Stabil': '#2563eb',
    'Produk Musiman': '#d97706',
    'Jarang Terjual': '#dc2626',
    'Produk Grosir': '#9333ea',
  }[kondisi]
}

onMounted(async () => {
  if (analysisStore.currentAnalysis) return
  try {
    const history = await analysisStore.fetchHistory()
    const latest = history.find((h) => h.status === 'Berhasil')
    if (latest) await analysisStore.fetchHistoryDetail(latest._id)
    else loadError.value = true
  } catch {
    loadError.value = true
  }
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Hasil Analisis</h1>
      <p class="text-sm text-gray-500 mt-1">
        Hasil segmentasi produk berdasarkan pola penjualan
        <span v-if="analysisStore.currentAnalysis"> — {{ analysisStore.currentAnalysis.periode_data }}</span>
      </p>
    </div>

    <div v-if="loadError" class="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
      Belum ada hasil analisis. Jalankan analisis baru terlebih dahulu.
    </div>

    <template v-else-if="analysisStore.currentAnalysis">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="text-xs text-gray-400">Jumlah Transaksi</div>
          <div class="text-xl font-bold text-gray-900">{{ analysisStore.currentAnalysis.jumlah_transaksi.toLocaleString('id-ID') }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="text-xs text-gray-400">Jumlah Produk</div>
          <div class="text-xl font-bold text-gray-900">{{ analysisStore.currentAnalysis.jumlah_produk }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="text-xs text-gray-400">K Optimal</div>
          <div class="text-xl font-bold text-gray-900">{{ analysisStore.currentAnalysis.optimal_k }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="text-xs text-gray-400">Silhouette Score</div>
          <div class="text-xl font-bold text-gray-900">{{ analysisStore.currentAnalysis.silhouette_score.toFixed(4) }}</div>
        </div>
      </div>

      <div class="flex gap-1 border-b border-gray-200 mb-5">
        <button
          v-for="tab in [{k:'matrix',l:'Matrix Segmentasi'},{k:'scatter',l:'Scatter Plot'},{k:'list',l:'Daftar Produk'}]"
          :key="tab.k"
          @click="activeTab = tab.k"
          class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === tab.k ? 'border-[#0d2818] text-[#0d2818]' : 'border-transparent text-gray-400 hover:text-gray-600'"
        >
          {{ tab.l }}
        </button>
      </div>

      <div v-if="activeTab === 'matrix'" class="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th class="text-left p-2 text-xs text-gray-400 font-medium">Kondisi Penjualan</th>
              <th v-for="abc in abcList" :key="abc" class="text-left p-2 text-xs text-gray-400 font-medium">Kategori {{ abc }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="kondisi in kondisiList" :key="kondisi" class="border-t border-gray-100">
              <td class="p-2 font-medium text-gray-700 align-top whitespace-nowrap">{{ kondisi }}</td>
              <td v-for="abc in abcList" :key="abc" class="p-2 align-top">
                <div class="border border-gray-200 rounded-lg p-2 min-h-[60px]">
                  <div class="text-xs font-semibold text-gray-500 mb-1">{{ matrix[kondisi][abc].length }} produk</div>
                  <div v-for="p in matrix[kondisi][abc].slice(0, 3)" :key="p.nama_produk" class="text-xs text-gray-600 truncate">
                    {{ p.nama_produk }}
                  </div>
                  <div v-if="matrix[kondisi][abc].length > 3" class="text-xs text-gray-400">
                    +{{ matrix[kondisi][abc].length - 3 }} lainnya
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'scatter'" class="bg-white rounded-xl border border-gray-200 p-5">
        <p class="text-xs text-gray-400 mb-4">Sebaran produk: frekuensi transaksi (X) vs total terjual (Y)</p>
        <svg viewBox="0 0 400 300" class="w-full h-80">
          <line x1="40" y1="260" x2="380" y2="260" stroke="#e5e7eb" stroke-width="1" />
          <line x1="40" y1="20" x2="40" y2="260" stroke="#e5e7eb" stroke-width="1" />
          <circle
            v-for="(p, i) in hasil"
            :key="i"
            :cx="40 + (p.frekuensi_transaksi / Math.max(...hasil.map(h => h.frekuensi_transaksi))) * 320"
            :cy="260 - (p.total_terjual / Math.max(...hasil.map(h => h.total_terjual))) * 230"
            r="4"
            :fill="kondisiWarnaSolid(p.kondisi_penjualan)"
            fill-opacity="0.7"
          >
            <title>{{ p.nama_produk }}</title>
          </circle>
        </svg>
        <div class="flex flex-wrap gap-3 mt-3">
          <div v-for="kondisi in kondisiList" :key="kondisi" class="flex items-center gap-1.5 text-xs text-gray-600">
            <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: kondisiWarnaSolid(kondisi) }"></span>
            {{ kondisi }}
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'list'" class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th class="text-left px-4 py-3 font-medium">Nama Produk</th>
              <th class="text-left px-4 py-3 font-medium">Kondisi</th>
              <th class="text-left px-4 py-3 font-medium">Prioritas</th>
              <th class="text-right px-4 py-3 font-medium">Total Terjual</th>
              <th class="text-right px-4 py-3 font-medium">Total Penjualan</th>
              <th class="text-left px-4 py-3 font-medium">Rekomendasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="p in hasil" :key="p.nama_produk" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-800">{{ p.nama_produk }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="badgeKondisi[p.kondisi_penjualan]">
                  {{ p.kondisi_penjualan }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="badgeAbc[p.prioritas_abc]">
                  {{ p.prioritas_abc }}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-gray-600">{{ p.total_terjual.toLocaleString('id-ID') }}</td>
              <td class="px-4 py-3 text-right text-gray-600">{{ formatRupiah(p.total_penjualan) }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs max-w-xs">{{ p.rekomendasi }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div v-else class="text-center text-gray-400 py-20">Memuat...</div>
  </div>
</template>
