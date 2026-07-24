<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAnalysisStore } from '@/stores/analysis'

const analysisStore = useAnalysisStore()
const activeTab = ref('matrix')
const loadError = ref(false)
const kondisiFilter = ref('') // used by the 4 clickable summary cards to jump to filtered list

const kondisiList = ['Produk Laris', 'Produk Stabil', 'Produk Musiman', 'Jarang Terjual', 'Produk Grosir']
const abcList = ['A', 'B', 'C']
const abcLabel = { A: 'A — Harus Selalu Ada', B: 'B — Perlu Dipantau', C: 'C — Kurangi Pembelian' }

const badgeAbc = {
  A: 'bg-[#dcfce7] text-[#15803d]',
  B: 'bg-[#fef9c3] text-[#854d0e]',
  C: 'bg-[#fee2e2] text-[#dc2626]',
}
const badgeKondisi = {
  'Produk Laris': 'bg-[#dcfce7] text-[#16a34a]',
  'Produk Stabil': 'bg-[#dbeafe] text-[#1d4ed8]',
  'Produk Musiman': 'bg-[#fef9c3] text-[#854d0e]',
  'Jarang Terjual': 'bg-[#fde8d8] text-[#c2410c]',
  'Produk Grosir': 'bg-[#ede9fe] text-[#6d28d9]',
}
const rowDot = {
  'Produk Laris': '#16a34a',
  'Produk Stabil': '#1d4ed8',
  'Produk Musiman': '#d97706',
  'Jarang Terjual': '#c2410c',
  'Produk Grosir': '#6d28d9',
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

// ── KPI row ──
const totalPenjualan = computed(() => hasil.value.reduce((sum, p) => sum + (p.total_penjualan || 0), 0))
const tanggalAnalisis = computed(() => {
  const c = analysisStore.currentAnalysis?.created_at
  return c ? new Date(c).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
})

// ── 4 clickable summary cards (harus selalu ada / perlu dipantau / musiman / kurangi pembelian) ──
const countHarusAda = computed(() => hasil.value.filter((p) => p.prioritas_abc === 'A').length)
const countDipantau = computed(() => hasil.value.filter((p) => p.prioritas_abc === 'B').length)
const countMusiman = computed(() => hasil.value.filter((p) => p.kondisi_penjualan === 'Produk Musiman').length)
const countKurangi = computed(() => hasil.value.filter((p) => p.prioritas_abc === 'C').length)

function toggleKondisiFilter(value) {
  kondisiFilter.value = kondisiFilter.value === value ? '' : value
  activeTab.value = 'list'
}
const filteredList = computed(() => {
  if (!kondisiFilter.value) return hasil.value
  if (kondisiFilter.value === 'A' || kondisiFilter.value === 'B' || kondisiFilter.value === 'C') {
    return hasil.value.filter((p) => p.prioritas_abc === kondisiFilter.value)
  }
  return hasil.value.filter((p) => p.kondisi_penjualan === kondisiFilter.value)
})

function formatRupiah(value) {
  if (value >= 1e9) return `Rp${(value / 1e9).toFixed(1)} M`
  if (value >= 1e6) return `Rp${(value / 1e6).toFixed(1)} Jt`
  return `Rp${value.toLocaleString('id-ID')}`
}

function kondisiWarnaSolid(kondisi) {
  return rowDot[kondisi]
}

// ── Scatter plot hover tooltip ──
const hoverProduct = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })
const abcSingkat = { A: 'Harus Selalu Ada', B: 'Perlu Dipantau', C: 'Kurangi Pembelian' }
function prioritasSingkat(abc) {
  return abcSingkat[abc]
}
function onPointHover(p, event) {
  hoverProduct.value = p
  // position tooltip relative to the nearest positioned ancestor (the wrapping .relative div)
  const container = event.currentTarget.closest('svg').parentElement.getBoundingClientRect()
  tooltipPos.value = {
    x: event.clientX - container.left,
    y: event.clientY - container.top,
  }
}

// ── Side panel ──
// Single, simple interaction: clicking "+N produk lainnya" on a matrix cell
// opens a panel listing every product in that (kondisi × prioritas) cell.
// No per-product detail drill-down -- kept intentionally simple.
const panelOpen = ref(false)
const panelListContext = ref(null) // { kondisi, abc, products }

function openList(kondisi, abc) {
  panelListContext.value = { kondisi, abc, products: matrix.value[kondisi][abc] }
  panelOpen.value = true
}
function closePanel() {
  panelOpen.value = false
  panelListContext.value = null
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
      <h1 class="text-[19px] font-bold text-[#111] tracking-tight">Hasil Analisis</h1>
      <p class="text-xs text-[#888] mt-0.5">
        Berikut hasil analisis segmentasi produk berdasarkan pola penjualan
        <span v-if="analysisStore.currentAnalysis"> — {{ analysisStore.currentAnalysis.periode_data }}</span>
      </p>
    </div>

    <div v-if="loadError" class="bg-white rounded-xl border border-[#e8eae8] p-10 text-center text-gray-500">
      Belum ada hasil analisis. Jalankan analisis baru terlebih dahulu.
    </div>

    <template v-else-if="analysisStore.currentAnalysis">
      <!-- KPI row -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        <div class="bg-white border border-[#e8eae8] rounded-[10px] p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-[#f0fdf4] flex items-center justify-center text-[#16a34a]">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
          </div>
          <div>
            <div class="text-lg font-extrabold text-[#111]">{{ analysisStore.currentAnalysis.jumlah_transaksi.toLocaleString('id-ID') }}</div>
            <div class="text-[11px] text-[#888]">Jumlah Transaksi</div>
          </div>
        </div>
        <div class="bg-white border border-[#e8eae8] rounded-[10px] p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-[#f0fdf4] flex items-center justify-center text-[#16a34a]">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
          </div>
          <div>
            <div class="text-lg font-extrabold text-[#111]">{{ analysisStore.currentAnalysis.jumlah_produk }}</div>
            <div class="text-[11px] text-[#888]">Jumlah Produk</div>
          </div>
        </div>
        <div class="bg-white border border-[#e8eae8] rounded-[10px] p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-[#eff6ff] flex items-center justify-center text-[#2563eb]">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <div>
            <div class="text-base font-extrabold text-[#111]">{{ formatRupiah(totalPenjualan) }}</div>
            <div class="text-[11px] text-[#888]">Total Penjualan</div>
          </div>
        </div>
        <div class="bg-white border border-[#e8eae8] rounded-[10px] p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-[#f3f4f6] flex items-center justify-center text-[#6b7280]">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <div class="text-sm font-extrabold text-[#111]">{{ tanggalAnalisis }}</div>
            <div class="text-[11px] text-[#888]">Tanggal Analisis</div>
          </div>
        </div>
      </div>

      <!-- Clickable summary cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <button
          @click="toggleKondisiFilter('A')"
          class="text-left bg-white border-l-[3px] rounded-[10px] p-4 hover:shadow-sm transition-shadow"
          :class="kondisiFilter === 'A' ? 'border-[#16a34a] ring-1 ring-[#16a34a] bg-[#f0fdf4]' : 'border-[#16a34a] border border-[#e8eae8] border-l-[3px]'"
        >
          <div class="text-2xl font-extrabold text-[#16a34a] mb-1">{{ countHarusAda }}</div>
          <div class="text-[12.5px] font-semibold text-[#222]">Harus Selalu Ada</div>
          <div class="text-[11px] text-[#999]">Kontributor utama, penjualan tinggi</div>
        </button>
        <button
          @click="toggleKondisiFilter('B')"
          class="text-left bg-white border-l-[3px] rounded-[10px] p-4 hover:shadow-sm transition-shadow"
          :class="kondisiFilter === 'B' ? 'border-[#d97706] ring-1 ring-[#d97706] bg-[#fffbeb]' : 'border-[#d97706] border border-[#e8eae8] border-l-[3px]'"
        >
          <div class="text-2xl font-extrabold text-[#d97706] mb-1">{{ countDipantau }}</div>
          <div class="text-[12.5px] font-semibold text-[#222]">Perlu Dipantau</div>
          <div class="text-[11px] text-[#999]">Penjualan stabil atau musiman</div>
        </button>
        <button
          @click="toggleKondisiFilter('Produk Musiman')"
          class="text-left bg-white border-l-[3px] rounded-[10px] p-4 hover:shadow-sm transition-shadow"
          :class="kondisiFilter === 'Produk Musiman' ? 'border-[#ea580c] ring-1 ring-[#ea580c] bg-[#fff7ed]' : 'border-[#ea580c] border border-[#e8eae8] border-l-[3px]'"
        >
          <div class="text-2xl font-extrabold text-[#ea580c] mb-1">{{ countMusiman }}</div>
          <div class="text-[12.5px] font-semibold text-[#222]">Produk Musiman</div>
          <div class="text-[11px] text-[#999]">Penjualan tinggi di periode tertentu</div>
        </button>
        <button
          @click="toggleKondisiFilter('C')"
          class="text-left bg-white border-l-[3px] rounded-[10px] p-4 hover:shadow-sm transition-shadow"
          :class="kondisiFilter === 'C' ? 'border-[#dc2626] ring-1 ring-[#dc2626] bg-[#fef2f2]' : 'border-[#dc2626] border border-[#e8eae8] border-l-[3px]'"
        >
          <div class="text-2xl font-extrabold text-[#dc2626] mb-1">{{ countKurangi }}</div>
          <div class="text-[12.5px] font-semibold text-[#222]">Kurangi Pembelian</div>
          <div class="text-[11px] text-[#999]">Penjualan rendah, kontribusi kecil</div>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-[#e8eae8] mb-5">
        <button
          v-for="tab in [{k:'matrix',l:'Matrix Segmentasi'},{k:'scatter',l:'Scatter Plot'},{k:'list',l:'Daftar Produk'}]"
          :key="tab.k"
          @click="activeTab = tab.k"
          class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === tab.k ? 'border-[#1e3a2a] text-[#1e3a2a]' : 'border-transparent text-gray-400 hover:text-gray-600'"
        >
          {{ tab.l }}
        </button>
      </div>

      <!-- TAB: Matrix -->
      <div v-if="activeTab === 'matrix'" class="bg-white rounded-[10px] border border-[#e8eae8] p-5 overflow-x-auto">
        <div class="text-sm font-bold text-[#111] mb-1">Matrix Segmentasi K-Means × ABC Analysis</div>
        <div class="text-[11px] text-[#9ca3af] mb-4">Baris = Kondisi Penjualan (K-Means Clustering) · Kolom = Nilai Kontribusi (ABC Analysis) · Klik sel atau produk untuk detail</div>
        <table class="w-full text-sm border-collapse min-w-[720px]">
          <thead>
            <tr>
              <th class="text-left p-2 text-xs text-gray-400 font-medium w-[150px]">Kondisi Penjualan</th>
              <th v-for="abc in abcList" :key="abc" class="text-left p-2 text-[11px] font-semibold" :class="badgeAbc[abc].split(' ')[1]">
                {{ abcLabel[abc] }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="kondisi in kondisiList" :key="kondisi" class="border-t border-[#f3f4f3] align-top">
              <td class="p-2 align-top whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: rowDot[kondisi] }"></span>
                  <span class="font-bold" :style="{ color: rowDot[kondisi] }">{{ kondisi }}</span>
                </div>
              </td>
              <td v-for="abc in abcList" :key="abc" class="p-2 align-top">
                <div class="border border-[#e8eae8] rounded-lg p-2.5 min-h-[90px]">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-base font-extrabold text-[#111]">{{ matrix[kondisi][abc].length }}</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold" :class="badgeAbc[abc]">Prioritas {{ abc }}</span>
                  </div>
                  <div
                    v-for="p in matrix[kondisi][abc].slice(0, 4)"
                    :key="p.nama_produk"
                    class="text-[11.5px] text-[#555] truncate"
                  >
                    {{ p.nama_produk }}
                  </div>
                  <button
                    v-if="matrix[kondisi][abc].length > 4"
                    @click="openList(kondisi, abc)"
                    class="text-[11px] text-[#1e3a2a] font-semibold mt-0.5 hover:underline"
                  >
                    +{{ matrix[kondisi][abc].length - 4 }} produk lainnya
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TAB: Scatter -->
      <div v-if="activeTab === 'scatter'" class="bg-white rounded-[10px] border border-[#e8eae8] p-5">
        <p class="text-xs text-gray-400 mb-4">Sebaran produk: frekuensi transaksi (X) vs total terjual (Y). Arahkan kursor ke titik untuk detail.</p>
        <div class="relative">
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
              :fill-opacity="hoverProduct === p ? 1 : 0.7"
              :stroke="hoverProduct === p ? '#111' : 'none'"
              stroke-width="1"
              class="cursor-pointer transition-opacity"
              @mouseenter="onPointHover(p, $event)"
              @mousemove="onPointHover(p, $event)"
              @mouseleave="hoverProduct = null"
            />
          </svg>

          <!-- Custom tooltip: plain-language stats, not just a name -->
          <div
            v-if="hoverProduct"
            class="absolute z-10 pointer-events-none bg-[#111827] text-white text-xs rounded-lg shadow-lg px-3.5 py-2.5 w-52"
            :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px', transform: 'translate(-50%, calc(-100% - 10px))' }"
          >
            <div class="font-semibold text-[13px] mb-1.5">{{ hoverProduct.nama_produk }}</div>
            <div class="flex justify-between py-0.5 text-gray-300">
              <span>Kondisi</span><span class="text-white font-medium">{{ hoverProduct.kondisi_penjualan }}</span>
            </div>
            <div class="flex justify-between py-0.5 text-gray-300">
              <span>Prioritas</span><span class="text-white font-medium">{{ hoverProduct.prioritas_abc }} — {{ prioritasSingkat(hoverProduct.prioritas_abc) }}</span>
            </div>
            <div class="flex justify-between py-0.5 text-gray-300">
              <span>Terjual</span><span class="text-white font-medium">{{ hoverProduct.total_terjual.toLocaleString('id-ID') }} pcs</span>
            </div>
            <div class="flex justify-between py-0.5 text-gray-300">
              <span>Pendapatan</span><span class="text-white font-medium">{{ formatRupiah(hoverProduct.total_penjualan) }}</span>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 mt-3">
          <div v-for="kondisi in kondisiList" :key="kondisi" class="flex items-center gap-1.5 text-xs text-gray-600">
            <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: kondisiWarnaSolid(kondisi) }"></span>
            {{ kondisi }}
          </div>
        </div>
      </div>

      <!-- TAB: List -->
      <div v-if="activeTab === 'list'" class="bg-white rounded-[10px] border border-[#e8eae8] overflow-hidden">
        <div v-if="kondisiFilter" class="px-4 py-2.5 bg-[#f2f8f4] border-b border-[#e8eae8] text-xs text-[#1e3a2a] flex items-center justify-between">
          <span>Filter aktif: <strong>{{ kondisiFilter.length === 1 ? abcLabel[kondisiFilter] : kondisiFilter }}</strong> ({{ filteredList.length }} produk)</span>
          <button @click="kondisiFilter = ''" class="font-semibold hover:underline">Hapus filter ✕</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-[#f9fafb] text-[#9ca3af] text-[11px] uppercase tracking-wide">
              <tr>
                <th class="text-left px-4 py-3 font-semibold">Nama Produk</th>
                <th class="text-left px-4 py-3 font-semibold">Kondisi</th>
                <th class="text-left px-4 py-3 font-semibold">Prioritas</th>
                <th class="text-right px-4 py-3 font-semibold">Total Terjual</th>
                <th class="text-right px-4 py-3 font-semibold">Total Penjualan</th>
                <th class="text-left px-4 py-3 font-semibold">Rekomendasi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f3f4f3]">
              <tr v-for="p in filteredList" :key="p.nama_produk" class="hover:bg-[#fafbfa]">
                <td class="px-4 py-3 font-medium text-[#222]">{{ p.nama_produk }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded text-xs font-semibold" :class="badgeKondisi[p.kondisi_penjualan]">{{ p.kondisi_penjualan }}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded text-xs font-semibold" :class="badgeAbc[p.prioritas_abc]">{{ p.prioritas_abc }}</span>
                </td>
                <td class="px-4 py-3 text-right text-[#333] tabular-nums">{{ p.total_terjual.toLocaleString('id-ID') }}</td>
                <td class="px-4 py-3 text-right text-[#333] tabular-nums">{{ formatRupiah(p.total_penjualan) }}</td>
                <td class="px-4 py-3 text-[#666] text-xs max-w-xs truncate">{{ p.rekomendasi }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div v-else class="text-center text-gray-400 py-20">Memuat...</div>

    <!-- Side panel: daftar produk dalam satu sel matrix (satu-satunya interaksi di halaman ini) -->
    <div v-if="panelOpen" @click="closePanel" class="fixed inset-0 bg-black/30 z-40"></div>
    <transition name="slide">
      <div v-if="panelOpen && panelListContext" class="fixed top-0 right-0 bottom-0 w-full sm:w-[380px] bg-white shadow-2xl z-50 overflow-y-auto">
        <div class="p-5 border-b border-[#e8eae8] flex items-start justify-between gap-3 sticky top-0 bg-white z-10">
          <div>
            <div class="text-base font-bold text-[#111] mb-1.5">{{ panelListContext.kondisi }}</div>
            <div class="flex gap-1.5 flex-wrap items-center">
              <span class="px-2 py-0.5 rounded text-[11px] font-semibold" :class="badgeAbc[panelListContext.abc]">{{ abcLabel[panelListContext.abc] }}</span>
              <span class="text-xs text-[#888]">{{ panelListContext.products.length }} produk</span>
            </div>
          </div>
          <button @click="closePanel" class="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
        </div>

        <div class="divide-y divide-[#f3f4f3]">
          <div v-for="p in panelListContext.products" :key="p.nama_produk" class="px-5 py-3">
            <div class="text-sm font-medium text-[#222]">{{ p.nama_produk }}</div>
            <div class="text-[11px] text-[#999] mt-0.5">{{ p.total_terjual.toLocaleString('id-ID') }} pcs · {{ formatRupiah(p.total_penjualan) }}</div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
