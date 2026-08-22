<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAnalysisStore } from '@/stores/analysis'

const analysisStore = useAnalysisStore()
const activeTab = ref('matrix')
const loadError = ref(false)
const kondisiFilter = ref('')

const kondisiList = ['Produk Laris', 'Produk Stabil', 'Produk Musiman', 'Jarang Terjual', 'Produk Grosir']
const abcList = ['A', 'B', 'C']
const abcLabel = { A: 'Harus Selalu Ada', B: 'Perlu Dipantau', C: 'Kurangi Pembelian' }

const badgeAbc = {
  A: 'bg-[#e2ede6] text-[#3d6b4f]',
  B: 'bg-[#f0e8d8] text-[#8a6d3b]',
  C: 'bg-[#f0dede] text-[#8a4a4a]',
}
const badgeKondisi = {
  'Produk Laris': 'bg-[#e2ede6] text-[#3d6b4f]',
  'Produk Stabil': 'bg-[#e3e9f2] text-[#3d5a75]',
  'Produk Musiman': 'bg-[#f0e8d8] text-[#8a6d3b]',
  'Jarang Terjual': 'bg-[#f0dede] text-[#8a4a4a]',
  'Produk Grosir': 'bg-[#dde3ef] text-[#33507a]',
}
const rowDot = {
  'Produk Laris': '#5c8a70',
  'Produk Stabil': '#4f6c8a',
  'Produk Musiman': '#b6935a',
  'Jarang Terjual': '#a15252',
  'Produk Grosir': '#3d5580',
}
const cellBg = {
  'Produk Laris': 'bg-[#eef4f0]',
  'Produk Stabil': 'bg-[#eef1f5]',
  'Produk Musiman': 'bg-[#f6f1e8]',
  'Jarang Terjual': 'bg-[#f6eeee]',
  'Produk Grosir': 'bg-[#eceff5]',
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

const totalPenjualan = computed(() => hasil.value.reduce((sum, p) => sum + (p.total_penjualan || 0), 0))
const tanggalAnalisis = computed(() => {
  const c = analysisStore.currentAnalysis?.created_at
  return c ? new Date(c).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
})

const silhouetteScore = computed(() => analysisStore.currentAnalysis?.silhouette_score)
const silhouetteFormatted = computed(() => {
  const s = silhouetteScore.value
  if (s == null) return null
  return s.toFixed(4).replace('.', ',')
})
const silhouetteColor = computed(() => {
  const s = silhouetteScore.value
  if (s == null) return '#33403a'
  if (s >= 0.5) return '#3d6b4f'
  if (s >= 0.25) return '#8a6d3b'
  return '#8a4a4a'
})

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

const SCATTER_W = 560
const SCATTER_H = 320
const SCATTER_PAD_L = 56
const SCATTER_PAD_R = 20
const SCATTER_PAD_T = 16
const SCATTER_PAD_B = 40
const scatterMaxFrek = computed(() => Math.max(1, ...hasil.value.map((h) => h.frekuensi_transaksi)))
const scatterMaxTerjual = computed(() => Math.max(1, ...hasil.value.map((h) => h.total_terjual)))
const scatterMaxPendapatan = computed(() => Math.max(1, ...hasil.value.map((h) => h.total_penjualan)))

function scatterX(p) {
  const usable = SCATTER_W - SCATTER_PAD_L - SCATTER_PAD_R
  return SCATTER_PAD_L + (p.frekuensi_transaksi / scatterMaxFrek.value) * usable
}
function scatterY(p) {
  const usable = SCATTER_H - SCATTER_PAD_T - SCATTER_PAD_B
  return SCATTER_H - SCATTER_PAD_B - (p.total_terjual / scatterMaxTerjual.value) * usable
}
function scatterRadius(p) {
  const minR = 4,
    maxR = 15
  const ratio = Math.sqrt(p.total_penjualan / scatterMaxPendapatan.value)
  return minR + ratio * (maxR - minR)
}
function niceTicks(max, count = 5) {
  const step = max / count
  return Array.from({ length: count + 1 }, (_, i) => Math.round(step * i))
}
const scatterXTicks = computed(() => niceTicks(scatterMaxFrek.value))
const scatterYTicks = computed(() => niceTicks(scatterMaxTerjual.value))
function formatCompact(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}rb`
  return `${n}`
}

const hoverProduct = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })
function onPointHover(p, event) {
  hoverProduct.value = p
  const container = event.currentTarget.closest('svg').parentElement.getBoundingClientRect()
  tooltipPos.value = {
    x: event.clientX - container.left,
    y: event.clientY - container.top,
  }
}

const panelOpen = ref(false)
const panelListContext = ref(null)

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
        <span v-if="analysisStore.currentAnalysis"> · {{ analysisStore.currentAnalysis.periode_data }}</span>
      </p>
    </div>

    <div v-if="loadError" class="bg-white rounded-xl border border-[#e8eae8] p-10 text-center text-gray-500">
      Belum ada hasil analisis. Jalankan analisis baru terlebih dahulu.
    </div>

    <template v-else-if="analysisStore.currentAnalysis">
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        <div class="rounded-[10px] p-4 bg-[#33403a] text-white">
          <div class="text-[20px] font-extrabold leading-none">{{ analysisStore.currentAnalysis.jumlah_transaksi.toLocaleString('id-ID') }}</div>
          <div class="text-[12px] font-semibold mt-2">Jumlah Transaksi</div>
        </div>
        <div class="rounded-[10px] p-4 bg-[#3d6b4f] text-white">
          <div class="text-[20px] font-extrabold leading-none">{{ analysisStore.currentAnalysis.jumlah_produk }}</div>
          <div class="text-[12px] font-semibold mt-2">Jumlah Produk</div>
        </div>
        <div class="rounded-[10px] p-4 bg-[#4f6c8a] text-white">
          <div class="text-[17px] font-extrabold leading-none">{{ formatRupiah(totalPenjualan) }}</div>
          <div class="text-[12px] font-semibold mt-2">Total Penjualan</div>
        </div>
        <div class="rounded-[10px] p-4 bg-[#33507a] text-white">
          <div class="text-[16px] font-extrabold leading-none">{{ tanggalAnalisis }}</div>
          <div class="text-[12px] font-semibold mt-2">Tanggal Analisis</div>
        </div>
        <div v-if="silhouetteFormatted" class="rounded-[10px] p-4 text-white col-span-2 lg:col-span-1" :style="{ backgroundColor: silhouetteColor }">
          <div class="text-[20px] font-extrabold leading-none">{{ silhouetteFormatted }}</div>
          <div class="text-[12px] font-semibold mt-2">Silhouette Score</div>
        </div>
      </div>

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

      <div v-if="activeTab === 'matrix'" class="bg-white rounded-[10px] border border-[#e8eae8] p-5 overflow-x-auto">
        <div class="text-sm font-bold text-[#111] mb-1">Peta Kelompok Produk</div>
        <div class="text-[12px] text-[#666] mb-1 leading-relaxed max-w-2xl">
          <strong>Baris</strong> = pola penjualan produk, <strong>kolom</strong> = besar pengaruhnya ke pendapatan toko. Klik kotak untuk lihat produknya.
        </div>
        <div class="text-[10.5px] text-[#aaa] mb-4">Baris: K-Means Clustering &middot; Kolom: ABC Analysis</div>
        <table class="w-full text-sm border-collapse min-w-[720px]">
          <thead>
            <tr>
              <th class="text-left p-2 text-xs text-gray-400 font-medium w-[150px]">Kondisi Penjualan</th>
              <th v-for="abc in abcList" :key="abc" class="text-left p-2 text-[11px] font-semibold" :class="badgeAbc[abc].split(' ')[1]">
                {{ abc }} · {{ abcLabel[abc] }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(kondisi, kIdx) in kondisiList" :key="kondisi" class="border-t border-[#f3f4f3] align-top row-fade-in" :style="{ animationDelay: `${kIdx * 60}ms` }">
              <td class="p-2 align-top whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: rowDot[kondisi] }"></span>
                  <span class="font-bold" :style="{ color: rowDot[kondisi] }">{{ kondisi }}</span>
                </div>
              </td>
              <td v-for="abc in abcList" :key="abc" class="p-2 align-top">
                <div
                  class="border border-black/[0.06] rounded-lg p-2.5 min-h-[90px] transition-all duration-200 hover:shadow-sm hover:brightness-95"
                  :class="cellBg[kondisi]"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-base font-extrabold text-[#111]">{{ matrix[kondisi][abc].length }}</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/70" :class="badgeAbc[abc].split(' ')[1]">Prioritas {{ abc }}</span>
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

      <div v-if="activeTab === 'scatter'" class="bg-white rounded-[10px] border border-[#e8eae8] p-5">
        <div class="flex items-start justify-between gap-3 mb-1">
          <div class="text-sm font-bold text-[#111]">Sebaran Produk</div>
          <div v-if="silhouetteFormatted" class="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white" :style="{ backgroundColor: silhouetteColor }">
            Silhouette Score: {{ silhouetteFormatted }}
          </div>
        </div>
        <p class="text-[12px] text-[#666] mb-4 leading-relaxed max-w-2xl">
          Tiap titik = satu produk. Makin ke <strong>kanan</strong> makin sering dibeli, makin ke <strong>atas</strong> makin banyak terjual, makin <strong>besar</strong> titiknya makin besar pendapatannya.
        </p>
        <div class="relative">
          <svg :viewBox="`0 0 ${SCATTER_W} ${SCATTER_H}`" class="w-full h-[380px]">
            <g v-for="(t, i) in scatterYTicks" :key="'y' + i">
              <line
                :x1="SCATTER_PAD_L" :x2="SCATTER_W - SCATTER_PAD_R"
                :y1="SCATTER_H - SCATTER_PAD_B - (t / scatterMaxTerjual) * (SCATTER_H - SCATTER_PAD_T - SCATTER_PAD_B)"
                :y2="SCATTER_H - SCATTER_PAD_B - (t / scatterMaxTerjual) * (SCATTER_H - SCATTER_PAD_T - SCATTER_PAD_B)"
                stroke="#f0f0ef" stroke-width="1"
              />
              <text
                :x="SCATTER_PAD_L - 8"
                :y="SCATTER_H - SCATTER_PAD_B - (t / scatterMaxTerjual) * (SCATTER_H - SCATTER_PAD_T - SCATTER_PAD_B) + 3"
                text-anchor="end" font-size="9.5" fill="#9ca3af"
              >{{ formatCompact(t) }}</text>
            </g>
            <g v-for="(t, i) in scatterXTicks" :key="'x' + i">
              <line
                :x1="SCATTER_PAD_L + (t / scatterMaxFrek) * (SCATTER_W - SCATTER_PAD_L - SCATTER_PAD_R)"
                :x2="SCATTER_PAD_L + (t / scatterMaxFrek) * (SCATTER_W - SCATTER_PAD_L - SCATTER_PAD_R)"
                :y1="SCATTER_PAD_T" :y2="SCATTER_H - SCATTER_PAD_B"
                stroke="#f6f6f5" stroke-width="1"
              />
              <text
                :x="SCATTER_PAD_L + (t / scatterMaxFrek) * (SCATTER_W - SCATTER_PAD_L - SCATTER_PAD_R)"
                :y="SCATTER_H - SCATTER_PAD_B + 16"
                text-anchor="middle" font-size="9.5" fill="#9ca3af"
              >{{ formatCompact(t) }}</text>
            </g>
            <line :x1="SCATTER_PAD_L" :x2="SCATTER_W - SCATTER_PAD_R" :y1="SCATTER_H - SCATTER_PAD_B" :y2="SCATTER_H - SCATTER_PAD_B" stroke="#d8d8d6" stroke-width="1.2" />
            <line :x1="SCATTER_PAD_L" :x2="SCATTER_PAD_L" :y1="SCATTER_PAD_T" :y2="SCATTER_H - SCATTER_PAD_B" stroke="#d8d8d6" stroke-width="1.2" />
            <text :x="(SCATTER_W + SCATTER_PAD_L - SCATTER_PAD_R) / 2" :y="SCATTER_H - 6" text-anchor="middle" font-size="10.5" fill="#888" font-weight="600">Makin sering dibeli &rarr;</text>
            <text :x="14" :y="(SCATTER_H - SCATTER_PAD_B + SCATTER_PAD_T) / 2" text-anchor="middle" font-size="10.5" fill="#888" font-weight="600" :transform="`rotate(-90 14 ${(SCATTER_H - SCATTER_PAD_B + SCATTER_PAD_T) / 2})`">Makin banyak terjual &rarr;</text>

            <circle
              v-for="(p, i) in hasil"
              :key="i"
              :cx="scatterX(p)"
              :cy="scatterY(p)"
              :r="hoverProduct === p ? scatterRadius(p) + 2 : scatterRadius(p)"
              :fill="kondisiWarnaSolid(p.kondisi_penjualan)"
              :fill-opacity="hoverProduct === p ? 0.95 : 0.55"
              :stroke="hoverProduct === p ? '#333' : 'none'"
              stroke-width="1.2"
              class="cursor-pointer transition-all duration-150"
              @mouseenter="onPointHover(p, $event)"
              @mousemove="onPointHover(p, $event)"
              @mouseleave="hoverProduct = null"
            />
          </svg>

          <div
            v-if="hoverProduct"
            class="absolute z-10 pointer-events-none bg-[#111827] text-white text-xs rounded-lg shadow-lg px-3.5 py-2.5 w-52 transition-opacity"
            :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px', transform: 'translate(-50%, calc(-100% - 10px))' }"
          >
            <div class="font-semibold text-[13px] mb-1.5">{{ hoverProduct.nama_produk }}</div>
            <div class="flex justify-between py-0.5 text-gray-300">
              <span>Kondisi</span><span class="text-white font-medium">{{ hoverProduct.kondisi_penjualan }}</span>
            </div>
            <div class="flex justify-between py-0.5 text-gray-300">
              <span>Prioritas</span><span class="text-white font-medium">{{ hoverProduct.prioritas_abc }} · {{ abcLabel[hoverProduct.prioritas_abc] }}</span>
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

      <div v-if="activeTab === 'list'" class="bg-white rounded-[10px] border border-[#e8eae8] overflow-hidden">
        <div class="px-4 py-3 border-b border-[#e8eae8] flex items-center justify-between gap-3">
          <span class="text-[12.5px] text-[#888]">{{ filteredList.length }} produk ditampilkan</span>
          <router-link
            :to="{ name: 'data-produk' }"
            class="text-[12.5px] font-semibold text-[#1e3a2a] hover:underline shrink-0"
          >
            Buka di Data Produk &rarr;
          </router-link>
        </div>
        <div v-if="kondisiFilter" class="px-4 py-2.5 bg-[#f2f8f4] border-b border-[#e8eae8] text-xs text-[#1e3a2a] flex items-center justify-between">
          <span>Filter aktif: <strong>{{ kondisiFilter.length === 1 ? kondisiFilter + ' · ' + abcLabel[kondisiFilter] : kondisiFilter }}</strong> ({{ filteredList.length }} produk)</span>
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
              <tr v-for="(p, idx) in filteredList" :key="p.nama_produk" class="hover:bg-[#fafbfa] row-fade-in" :style="{ animationDelay: `${Math.min(idx, 12) * 30}ms` }">
                <td class="px-4 py-3 font-medium text-[#222]">{{ p.nama_produk }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded text-xs font-semibold transition-transform hover:scale-105 inline-block" :class="badgeKondisi[p.kondisi_penjualan]">{{ p.kondisi_penjualan }}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="w-6 h-6 rounded-md text-xs font-bold inline-flex items-center justify-center transition-transform hover:scale-110" :class="badgeAbc[p.prioritas_abc]" :title="abcLabel[p.prioritas_abc]">{{ p.prioritas_abc }}</span>
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

    <div v-else class="space-y-4">
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div v-for="i in 5" :key="'kpi-'+i" class="skeleton-box h-[66px] rounded-[10px]"></div>
      </div>
      <div class="skeleton-box h-10 w-72 rounded-lg"></div>
      <div class="skeleton-box h-[380px] rounded-[10px]"></div>
    </div>

    <div v-if="panelOpen" @click="closePanel" class="fixed inset-0 bg-black/30 z-40"></div>
    <transition name="slide">
      <div v-if="panelOpen && panelListContext" class="fixed top-0 right-0 bottom-0 w-full sm:w-[380px] bg-white shadow-2xl z-50 overflow-y-auto">
        <div class="p-5 border-b border-[#e8eae8] flex items-start justify-between gap-3 sticky top-0 bg-white z-10">
          <div>
            <div class="text-base font-bold text-[#111] mb-1.5">{{ panelListContext.kondisi }}</div>
            <div class="flex gap-1.5 flex-wrap items-center">
              <span class="px-2 py-0.5 rounded text-[11px] font-semibold" :class="badgeAbc[panelListContext.abc]">{{ panelListContext.abc }} · {{ abcLabel[panelListContext.abc] }}</span>
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
.skeleton-box {
  background: linear-gradient(90deg, #f0f1f3 25%, #e8eaed 37%, #f0f1f3 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

@keyframes rowFadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.row-fade-in {
  animation: rowFadeIn 0.28s ease both;
}
</style>
