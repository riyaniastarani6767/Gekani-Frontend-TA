<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAnalysisStore } from '@/stores/analysis'
import { useTourStore } from '@/stores/tour'
import TreemapKategori from '@/components/dashboard/TreemapKategori.vue'
import TrenBulanan from '@/components/dashboard/TrenBulanan.vue'
import ProdukPrioritasPanel from '@/components/dashboard/ProdukPrioritasPanel.vue'
import ChartTooltip from '@/components/dashboard/ChartTooltip.vue'

const router = useRouter()
const analysisStore = useAnalysisStore()
const tourStore = useTourStore()
const summary = ref(null)
const products = ref([])
const loadError = ref(false)
const tooltip = ref(null)

const kondisiList = ['Produk Harian', 'Produk Langka', 'Produk Andalan', 'Produk Premium']

const kondisiWarnaSolid = {
  'Produk Harian': '#5c8a70',
  'Produk Langka': '#a15252',
  'Produk Andalan': '#4f6c8a',
  'Produk Premium': '#b6935a',
}
const badgeAbc = {
  A: 'bg-[#e2ede6] text-[#3d6b4f]',
  B: 'bg-[#f0e8d8] text-[#8a6d3b]',
  C: 'bg-[#f0dede] text-[#8a4a4a]',
}
const badgeKondisi = {
  'Produk Harian': 'bg-[#e2ede6] text-[#3d6b4f]',
  'Produk Langka': 'bg-[#f0dede] text-[#8a4a4a]',
  'Produk Andalan': 'bg-[#e3e9f2] text-[#3d5a75]',
  'Produk Premium': 'bg-[#f0e8d8] text-[#8a6d3b]',
}

function formatRupiah(value) {
  if (value >= 1e9) return `Rp${(value / 1e9).toFixed(1)} M`
  if (value >= 1e6) return `Rp${(value / 1e6).toFixed(1)} Jt`
  return `Rp${value.toLocaleString('id-ID')}`
}

function kondisiPercent(kondisi) {
  if (!summary.value || !summary.value.jumlah_produk) return 0
  const count = summary.value.komposisi_kondisi[kondisi] || 0
  return Math.round((count / summary.value.jumlah_produk) * 100)
}

function showTooltip(event, title, lines) {
  tooltip.value = { x: event.clientX, y: event.clientY, title, lines }
}
function moveTooltip(event) {
  if (tooltip.value) {
    tooltip.value.x = event.clientX
    tooltip.value.y = event.clientY
  }
}
function hideTooltip() {
  tooltip.value = null
}

function revenueByAbc(abc) {
  return products.value.filter((p) => p.prioritas_abc === abc).reduce((s, p) => s + p.total_penjualan, 0)
}
function revenueByKondisi(kondisi) {
  return products.value.filter((p) => p.kondisi_penjualan === kondisi).reduce((s, p) => s + p.total_penjualan, 0)
}
function revenueByKategori(kategori) {
  return products.value.filter((p) => p.kategori === kategori).reduce((s, p) => s + p.total_penjualan, 0)
}
function dominantAbc(kategori) {
  const counts = { A: 0, B: 0, C: 0 }
  for (const p of products.value.filter((x) => x.kategori === kategori)) counts[p.prioritas_abc]++
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

const filterKondisi = ref('')
const filterPrioritas = ref('')
const filterKategori = ref('')
const searchQuery = ref('')

const kategoriOptions = computed(() => [...new Set(products.value.map((p) => p.kategori))].sort())
const kondisiOptions = computed(() => [...new Set(products.value.map((p) => p.kondisi_penjualan))])

const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    if (filterKondisi.value && p.kondisi_penjualan !== filterKondisi.value) return false
    if (filterPrioritas.value && p.prioritas_abc !== filterPrioritas.value) return false
    if (filterKategori.value && p.kategori !== filterKategori.value) return false
    if (searchQuery.value && !p.nama_produk.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
    return true
  })
})

const PAGE_SIZE = 10
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / PAGE_SIZE)))
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredProducts.value.slice(start, start + PAGE_SIZE)
})
function resetPage() {
  currentPage.value = 1
}

const daftarProdukRef = ref(null)
function scrollToTable() {
  daftarProdukRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function toggleFilterKondisi(k) {
  filterKondisi.value = filterKondisi.value === k ? '' : k
  resetPage()
  scrollToTable()
}
function toggleFilterKategori(k) {
  filterKategori.value = filterKategori.value === k ? '' : k
  resetPage()
  scrollToTable()
}

const activePanel = ref(null)
function openKondisiPanel(kondisi) {
  activePanel.value = {
    label: kondisi,
    sublabel: `${kondisiPercent(kondisi)}% dari total produk`,
    items: products.value.filter((p) => p.kondisi_penjualan === kondisi),
  }
}

function lihatDetail(namaProduk) {
  router.push({ name: 'data-produk', query: { search: namaProduk } })
}

const DONUT_R = 46
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R
const donutSegments = computed(() => {
  if (!summary.value) return []
  const entries = Object.entries(summary.value.komposisi_kondisi)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  let cumulativeLength = 0
  return entries.map(([kondisi, count]) => {
    const pct = total > 0 ? (count / total) * 100 : 0
    const arcLength = (pct / 100) * DONUT_CIRCUMFERENCE
    const dashArray = `${arcLength} ${DONUT_CIRCUMFERENCE - arcLength}`
    const dashOffset = -cumulativeLength
    cumulativeLength += arcLength
    return { kondisi, count, pct, dashArray, dashOffset, color: kondisiWarnaSolid[kondisi] }
  })
})

const topProducts = computed(() => [...products.value].sort((a, b) => b.total_penjualan - a.total_penjualan).slice(0, 5))
const maxTopProduct = computed(() => (topProducts.value.length ? topProducts.value[0].total_penjualan : 1))

async function loadAll() {
  try {
    summary.value = await analysisStore.fetchDashboardSummary()
    const data = await analysisStore.fetchProducts()
    products.value = data.products
  } catch {
    loadError.value = true
  }
}

onMounted(() => {
  loadAll()
  tourStore.maybeShowWelcome()
})
</script>

<template>
  <div>
    <div class="mb-5">
      <h1 class="text-[19px] font-bold text-[#111] tracking-tight">Dashboard</h1>
      <p class="text-xs text-[#888] mt-0.5">Ringkasan segmentasi produk dan panduan pengambilan keputusan persediaan</p>
    </div>

    <div v-if="loadError" class="bg-white rounded-[10px] border border-[#e8eae8] p-10 text-center">
      <p class="text-[#888] text-sm mb-4">Belum ada analisis yang berhasil dijalankan.</p>
      <router-link :to="{ name: 'analisis-baru' }" class="inline-block bg-[#1e3a2a] text-white text-[12.5px] font-semibold px-4 py-2 rounded-lg hover:bg-[#2d5a3d] transition-colors">
        Mulai Analisis Baru
      </router-link>
    </div>

    <div v-else-if="summary" class="space-y-5">

      <div data-tour="kpi-cards">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div class="rounded-[10px] p-4 bg-[#33403a] text-white">
            <div class="text-[22px] font-extrabold leading-none">{{ summary.jumlah_produk }}</div>
            <div class="text-[12px] font-semibold mt-2">Jumlah Produk</div>
            <div class="text-[10.5px] text-white/60 mt-0.5">Semua produk dianalisis</div>
          </div>
          <button
            v-for="kondisi in kondisiList" :key="kondisi"
            @click="openKondisiPanel(kondisi)"
            class="text-left rounded-[10px] p-4 text-white transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5"
            :style="{ backgroundColor: kondisiWarnaSolid[kondisi] }"
          >
            <div class="text-[22px] font-extrabold leading-none">{{ summary.komposisi_kondisi[kondisi] || 0 }}</div>
            <div class="text-[12px] font-semibold mt-2">{{ kondisi }}</div>
            <div class="text-[10.5px] text-white/70 mt-0.5">Lihat produk &rarr;</div>
          </button>
          <div class="rounded-[10px] p-4 bg-[#4f6c8a] text-white col-span-2 sm:col-span-1">
            <div class="text-[19px] font-extrabold leading-none">{{ formatRupiah(summary.total_penjualan) }}</div>
            <div class="text-[12px] font-semibold mt-2">Total Penjualan</div>
            <div class="text-[10.5px] text-white/60 mt-0.5">Seluruh periode data</div>
          </div>
        </div>
        <div class="flex items-center justify-between mt-2.5">
          <p class="text-[10.5px] text-[#999]">Berdasarkan data periode: {{ summary.periode_data }}</p>
          <router-link :to="{ name: 'hasil-analisis' }" class="text-[11px] font-semibold text-[#1e3a2a] hover:underline shrink-0">
            Lihat Hasil Analisis Lengkap &rarr;
          </router-link>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TreemapKategori data-tour="treemap" :products="products" @select="toggleFilterKategori" />
        <TrenBulanan data-tour="tren-bulanan" :data="summary.tren_bulanan || []" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div data-tour="top-5-produk" class="bg-white rounded-[10px] border border-[#e8eae8] p-4">
          <h3 class="text-[13px] font-bold text-[#111] mb-0.5">Top 5 Produk Terlaris</h3>
          <p class="text-[10.5px] text-[#999] mb-3.5">Berdasarkan total penjualan, klik untuk lihat detail</p>
          <div class="space-y-3">
            <button
              v-for="(p, i) in topProducts" :key="p.nama_produk"
              @click="lihatDetail(p.nama_produk)"
              @mouseenter="showTooltip($event, p.nama_produk, [{label: 'Kategori', value: p.kategori}, {label: 'Kondisi', value: p.kondisi_penjualan}, {label: 'Prioritas', value: p.prioritas_abc}, {label: 'Total penjualan', value: formatRupiah(p.total_penjualan)}, {label: 'Total terjual', value: `${p.total_terjual.toLocaleString('id-ID')} pcs`}])"
              @mousemove="moveTooltip" @mouseleave="hideTooltip"
              class="w-full text-left group"
            >
              <div class="flex items-center justify-between text-[12px] mb-1.5">
                <span class="font-semibold text-[#555] truncate flex items-center gap-2">
                  <span class="text-[#ccc] font-bold w-3.5 shrink-0">{{ i + 1 }}</span>
                  {{ p.nama_produk }}
                </span>
                <span class="font-bold text-[#333] shrink-0 ml-2">{{ formatRupiah(p.total_penjualan) }}</span>
              </div>
              <div class="h-[10px] bg-[#f2f3f2] rounded-full overflow-hidden ml-5.5">
                <div
                  class="h-full rounded-full transition-all group-hover:brightness-110"
                  :style="{ width: `${(p.total_penjualan / maxTopProduct) * 100}%`, backgroundColor: kondisiWarnaSolid[p.kondisi_penjualan] }"
                ></div>
              </div>
            </button>
          </div>
        </div>

        <div data-tour="proporsi-kondisi" class="bg-white rounded-[10px] border border-[#e8eae8] p-4">
          <h3 class="text-[13px] font-bold text-[#111] mb-0.5">Proporsi Kondisi Produk</h3>
          <p class="text-[10.5px] text-[#999] mb-3.5">Klik segmen atau baris untuk filter tabel produk</p>
          <div class="flex flex-col sm:flex-row items-center gap-5">
            <svg viewBox="0 0 140 140" class="w-[130px] h-[130px] shrink-0">
              <circle cx="70" cy="70" r="54" fill="none" stroke="#f3f4f6" stroke-width="20" />
              <circle
                v-for="seg in donutSegments" :key="seg.kondisi"
                cx="70" cy="70" r="54" fill="none" :stroke="seg.color" stroke-width="20"
                :stroke-dasharray="seg.dashArray" :stroke-dashoffset="seg.dashOffset"
                transform="rotate(-90 70 70)"
                class="cursor-pointer transition-opacity hover:opacity-75"
                @mouseenter="showTooltip($event, seg.kondisi, [{label: 'Jumlah produk', value: `${seg.count} produk`}, {label: 'Persentase', value: `${seg.pct.toFixed(0)}% dari total`}, {label: 'Total penjualan', value: formatRupiah(revenueByKondisi(seg.kondisi))}])"
                @mousemove="moveTooltip" @mouseleave="hideTooltip"
                @click="toggleFilterKondisi(seg.kondisi)"
              />
              <text x="70" y="66" text-anchor="middle" font-size="22" font-weight="800" fill="#111">{{ summary.jumlah_produk }}</text>
              <text x="70" y="82" text-anchor="middle" font-size="9" fill="#9ca3af">Produk</text>
            </svg>
            <div class="flex-1 w-full min-w-0 space-y-1.5">
              <button
                v-for="seg in donutSegments" :key="'leg'+seg.kondisi"
                class="w-full flex items-center gap-2 text-left rounded-lg px-2 py-1.5 transition-colors"
                :class="filterKondisi === seg.kondisi ? 'bg-[#f2f3f2]' : 'hover:bg-[#f9fafb]'"
                @click="toggleFilterKondisi(seg.kondisi)"
              >
                <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: seg.color }"></span>
                <span class="flex-1 text-[12px] font-medium text-[#333] truncate">{{ seg.kondisi }}</span>
                <span class="text-[12px] font-bold text-[#333] shrink-0">{{ seg.count }} <span class="font-normal text-[#999]">({{ seg.pct.toFixed(0) }}%)</span></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref="daftarProdukRef" data-tour="daftar-produk-table" class="bg-white rounded-[10px] border border-[#e8eae8] p-4 scroll-mt-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[13px] font-bold text-[#111]">Daftar Produk</h3>
          <router-link :to="{ name: 'hasil-analisis' }" class="text-[11px] font-semibold text-[#1e3a2a] hover:underline">
            Lihat Hasil Analisis Lengkap &rarr;
          </router-link>
        </div>

        <div class="flex flex-wrap items-center gap-2 mb-3">
          <select v-model="filterKondisi" @change="resetPage" class="px-2.5 py-1.5 border-[1.5px] border-[#e0e0e0] rounded-md text-[11px] text-[#555] outline-none focus:border-[#2d6a4f]">
            <option value="">Semua Kondisi</option>
            <option v-for="k in kondisiOptions" :key="k" :value="k">{{ k }}</option>
          </select>
          <select v-model="filterPrioritas" @change="resetPage" class="px-2.5 py-1.5 border-[1.5px] border-[#e0e0e0] rounded-md text-[11px] text-[#555] outline-none focus:border-[#2d6a4f]">
            <option value="">Semua Prioritas</option>
            <option value="A">Prioritas A</option>
            <option value="B">Prioritas B</option>
            <option value="C">Prioritas C</option>
          </select>
          <select v-model="filterKategori" @change="resetPage" class="px-2.5 py-1.5 border-[1.5px] border-[#e0e0e0] rounded-md text-[11px] text-[#555] outline-none focus:border-[#2d6a4f]">
            <option value="">Semua Kategori</option>
            <option v-for="k in kategoriOptions" :key="k" :value="k">{{ k }}</option>
          </select>
          <div class="relative flex-1 min-w-[160px]">
            <svg class="w-3.5 h-3.5 text-[#ccc] absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke-width="2" /><path stroke-linecap="round" stroke-width="2" d="M21 21l-4.35-4.35" /></svg>
            <input v-model="searchQuery" @input="resetPage" type="text" placeholder="Cari nama produk..." class="w-full pl-8 pr-2.5 py-1.5 border-[1.5px] border-[#e0e0e0] rounded-md text-[11px] outline-none focus:border-[#2d6a4f]" />
          </div>
          <span class="text-[10.5px] text-[#999] ml-auto whitespace-nowrap">{{ filteredProducts.length }} dari {{ products.length }} produk</span>
        </div>

        <div class="overflow-x-auto -mx-4 px-4">
          <table class="w-full text-[12px] border-collapse min-w-[640px]">
            <thead>
              <tr class="bg-[#f9fafb] border-b-[1.5px] border-[#e8eae8]">
                <th class="text-left px-2.5 py-2 font-semibold text-[#9ca3af] text-[9.5px] uppercase tracking-wide">Nama Produk</th>
                <th class="text-left px-2.5 py-2 font-semibold text-[#9ca3af] text-[9.5px] uppercase tracking-wide">Kategori</th>
                <th class="text-left px-2.5 py-2 font-semibold text-[#9ca3af] text-[9.5px] uppercase tracking-wide">Kondisi</th>
                <th class="text-left px-2.5 py-2 font-semibold text-[#9ca3af] text-[9.5px] uppercase tracking-wide">Prioritas</th>
                <th class="text-right px-2.5 py-2 font-semibold text-[#9ca3af] text-[9.5px] uppercase tracking-wide">Terjual</th>
                <th class="text-right px-2.5 py-2 font-semibold text-[#9ca3af] text-[9.5px] uppercase tracking-wide">Penjualan</th>
                <th class="text-right px-2.5 py-2 font-semibold text-[#9ca3af] text-[9.5px] uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in paginatedProducts" :key="p.nama_produk" class="border-b border-[#f3f4f3] last:border-b-0 hover:bg-[#fafbfa] transition-colors">
                <td class="px-2.5 py-2.5 font-medium text-[#222]">{{ p.nama_produk }}</td>
                <td class="px-2.5 py-2.5 text-[#666]">{{ p.kategori }}</td>
                <td class="px-2.5 py-2.5">
                  <span class="px-2 py-0.5 rounded text-[10.5px] font-semibold" :class="badgeKondisi[p.kondisi_penjualan]">{{ p.kondisi_penjualan }}</span>
                </td>
                <td class="px-2.5 py-2.5">
                  <span class="w-5 h-5 rounded text-[10.5px] font-bold inline-flex items-center justify-center" :class="badgeAbc[p.prioritas_abc]">{{ p.prioritas_abc }}</span>
                </td>
                <td class="px-2.5 py-2.5 text-right text-[#555]">{{ p.total_terjual.toLocaleString('id-ID') }}</td>
                <td class="px-2.5 py-2.5 text-right text-[#555]">{{ formatRupiah(p.total_penjualan) }}</td>
                <td class="px-2.5 py-2.5 text-right">
                  <button @click="lihatDetail(p.nama_produk)" class="text-[10.5px] font-bold text-[#1e3a2a] hover:bg-[#e2ede6] px-2 py-1 rounded transition-colors">Detail</button>
                </td>
              </tr>
              <tr v-if="filteredProducts.length === 0">
                <td colspan="7" class="px-2 py-8 text-center text-gray-400">Tidak ada produk yang cocok.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="flex items-center justify-between mt-3.5 pt-3.5 border-t border-[#f3f4f3]">
          <span class="text-[11px] text-[#999]">Halaman {{ currentPage }} dari {{ totalPages }}</span>
          <div class="flex gap-1.5">
            <button
              @click="currentPage > 1 && currentPage--"
              :disabled="currentPage === 1"
              class="px-3 py-1.5 rounded-md text-[11px] font-semibold border-[1.5px] border-[#e0e0e0] text-[#555] disabled:opacity-40 hover:bg-[#f9fafb] transition-colors"
            >
              &larr; Sebelumnya
            </button>
            <button
              @click="currentPage < totalPages && currentPage++"
              :disabled="currentPage === totalPages"
              class="px-3 py-1.5 rounded-md text-[11px] font-semibold border-[1.5px] border-[#e0e0e0] text-[#555] disabled:opacity-40 hover:bg-[#f9fafb] transition-colors"
            >
              Selanjutnya &rarr;
            </button>
          </div>
        </div>
      </div>

      <div class="text-[10.5px] text-[#999] flex items-center gap-1.5 pt-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2" /><path stroke-linecap="round" stroke-width="2" d="M12 6v6l4 2" /></svg>
        Data terakhir diperbarui: {{ summary.created_at ? new Date(summary.created_at).toLocaleString('id-ID') : '-' }}
        &middot; Menampilkan: {{ summary.periode_data }}
      </div>
    </div>

    <div v-else class="space-y-5">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div v-for="i in 6" :key="'kpi-'+i" class="skeleton-box h-[86px] rounded-[10px]"></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="skeleton-box h-[240px] rounded-[10px]"></div>
        <div class="skeleton-box h-[240px] rounded-[10px]"></div>
      </div>
      <div class="skeleton-box h-[260px] rounded-[10px]"></div>
    </div>

    <ProdukPrioritasPanel
      v-if="activePanel"
      :title="activePanel.label"
      :subtitle="`${activePanel.sublabel} (${activePanel.items.length} produk)`"
      :items="activePanel.items"
      @close="activePanel = null"
    />

    <ChartTooltip :tooltip="tooltip" />
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
</style>