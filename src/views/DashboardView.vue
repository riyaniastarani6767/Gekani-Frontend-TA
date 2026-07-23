<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAnalysisStore } from '@/stores/analysis'
import { useTourStore } from '@/stores/tour'
import KpiCard from '@/components/dashboard/KpiCard.vue'
import MatrixPrioritas from '@/components/dashboard/MatrixPrioritas.vue'
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

const kondisiWarna = {
  'Produk Laris': 'bg-[#1b3829]',
  'Produk Stabil': 'bg-blue-500',
  'Produk Musiman': 'bg-amber-500',
  'Jarang Terjual': 'bg-red-500',
  'Produk Grosir': 'bg-purple-500',
}
const kondisiWarnaSolid = {
  'Produk Laris': '#1b3829',
  'Produk Stabil': '#3b82f6',
  'Produk Musiman': '#f59e0b',
  'Jarang Terjual': '#ef4444',
  'Produk Grosir': '#9333ea',
}
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

function formatRupiah(value) {
  if (value >= 1e9) return `Rp${(value / 1e9).toFixed(1)} M`
  if (value >= 1e6) return `Rp${(value / 1e6).toFixed(1)} Jt`
  return `Rp${value.toLocaleString('id-ID')}`
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

const maxKondisi = computed(() => (summary.value ? Math.max(...Object.values(summary.value.komposisi_kondisi), 1) : 1))
const maxAbc = computed(() => (summary.value ? Math.max(...Object.values(summary.value.komposisi_abc), 1) : 1))

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
function kondisiBreakdownForRekomendasi(text) {
  const matched = products.value.filter((p) => p.rekomendasi === text)
  const counts = {}
  for (const p of matched) counts[p.kondisi_penjualan] = (counts[p.kondisi_penjualan] || 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, c]) => `${k} (${c})`).join(', ')
}
function revenueForRekomendasi(text) {
  return products.value.filter((p) => p.rekomendasi === text).reduce((s, p) => s + p.total_penjualan, 0)
}

const insights = computed(() => {
  if (!summary.value || products.value.length === 0) return []
  const totalRevenue = products.value.reduce((s, p) => s + p.total_penjualan, 0)
  const revenueA = revenueByAbc('A')
  const revenueC = revenueByAbc('C')
  const pctA = totalRevenue > 0 ? ((revenueA / totalRevenue) * 100).toFixed(0) : 0
  const pctC = totalRevenue > 0 ? ((revenueC / totalRevenue) * 100).toFixed(0) : 0
  const musiman = summary.value.komposisi_kondisi['Produk Musiman'] || 0

  const list = [
    { type: 'default', text: `${summary.value.komposisi_abc.A} produk menyumbang ${pctA}% total pendapatan — fokus prioritas stok pada kelompok ini` },
  ]
  if (musiman > 0) {
    list.push({ type: 'warn', text: `${musiman} produk musiman — siapkan stok ekstra sebelum periode ramai` })
  }
  list.push({ type: 'danger', text: `${summary.value.komposisi_abc.C} produk Kategori C berkontribusi hanya ${pctC}% pendapatan — potensi efisiensi modal` })
  return list
})

const insightBorder = {
  default: 'border-l-[#1b3829]',
  warn: 'border-l-amber-500',
  danger: 'border-l-red-500',
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

const daftarProdukRef = ref(null)
function scrollToTable() {
  daftarProdukRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function toggleFilterKondisi(k) {
  filterKondisi.value = filterKondisi.value === k ? '' : k
  scrollToTable()
}
function toggleFilterPrioritas(a) {
  filterPrioritas.value = filterPrioritas.value === a ? '' : a
  scrollToTable()
}
function toggleFilterKategori(k) {
  filterKategori.value = filterKategori.value === k ? '' : k
  scrollToTable()
}

const activePanel = ref(null)
function openQuadrant(q) {
  activePanel.value = q
}

function openPanduanPanel(type) {
  const configs = {
    tambah: {
      label: 'Produk Harus Ditambah Stok',
      sublabel: 'Kategori A - Harus Selalu Ada',
      items: products.value.filter((p) => p.prioritas_abc === 'A'),
    },
    pantau: {
      label: 'Produk Perlu Dipantau',
      sublabel: 'Kategori B - Perlu Dipantau',
      items: products.value.filter((p) => p.prioritas_abc === 'B'),
    },
    musiman: {
      label: 'Produk Musiman',
      sublabel: 'Siapkan stok sebelum periode ramai',
      items: products.value.filter((p) => p.kondisi_penjualan === 'Produk Musiman'),
    },
    kurangi: {
      label: 'Produk Kurangi Pembelian',
      sublabel: 'Kategori C - Kontribusi kecil terhadap pendapatan',
      items: products.value.filter((p) => p.prioritas_abc === 'C'),
    },
  }
  activePanel.value = configs[type]
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

const kondisiWarnaBar = kondisiWarnaSolid

const topKategoriByCount = computed(() => {
  const counts = {}
  for (const p of products.value) {
    counts[p.kategori] = (counts[p.kategori] || 0) + 1
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const max = sorted.length ? sorted[0][1] : 1
  return sorted.map(([kategori, count]) => ({ kategori, count, pct: (count / max) * 100 }))
})

const topRekomendasi = computed(() => {
  const counts = {}
  for (const p of products.value) {
    counts[p.rekomendasi] = (counts[p.rekomendasi] || 0) + 1
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const max = sorted.length ? sorted[0][1] : 1
  return sorted.map(([text, count]) => ({ text, count, pct: (count / max) * 100 }))
})

const topProducts = computed(() => {
  return [...products.value]
    .sort((a, b) => b.total_penjualan - a.total_penjualan)
    .slice(0, 5)
    .sort((a, b) => b.total_penjualan - a.total_penjualan)
    .slice(0, 5)
})
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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-sm text-gray-500 mt-1">Ringkasan segmentasi produk dan panduan pengambilan keputusan persediaan</p>
      </div>
      <div class="relative w-full sm:w-64">
        <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama produk..."
          class="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3829]"
        />
      </div>
    </div>

    <div v-if="loadError" class="bg-white rounded-xl border border-gray-200 p-10 text-center">
      <p class="text-gray-500 mb-4">Belum ada analisis yang berhasil dijalankan.</p>
      <router-link
        :to="{ name: 'analisis-baru' }"
        class="inline-block bg-[#1b3829] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#2d5a3d]"
      >
        Mulai Analisis Baru
      </router-link>
    </div>

    <div v-else-if="summary" class="space-y-5">
      <div data-tour="kpi-cards" class="flex flex-wrap gap-3">
        <KpiCard label="Jumlah Produk" :value="summary.jumlah_produk" sublabel="Semua produk dianalisis" icon="box" />
        <KpiCard label="Harus Selalu Ada" :value="summary.komposisi_abc.A" sublabel="Prioritas utama stok" color="green" icon="check" />
        <KpiCard label="Perlu Dipantau" :value="summary.komposisi_abc.B" sublabel="Pantau stok & penjualan" sublabelType="warn" color="amber" icon="eye" />
        <KpiCard label="Kurangi Pembelian" :value="summary.komposisi_abc.C" sublabel="Sebaiknya dikurangi" sublabelType="down" color="red" icon="cart" />
        <KpiCard label="Total Penjualan" :value="formatRupiah(summary.total_penjualan)" sublabel="Seluruh periode data" color="blue" icon="money" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div data-tour="panduan-keputusan" class="bg-white rounded-xl border border-gray-200 p-3.5">
          <h3 class="text-[12.5px] font-bold text-gray-900 mb-0.5">Panduan Keputusan Persediaan</h3>
          <p class="text-[10.5px] text-gray-400 mb-3">Berdasarkan data periode: {{ summary.periode_data }}</p>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div
              class="rounded-lg p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors bg-emerald-50 border border-emerald-200 hover:brightness-[.97]"
              @mouseenter="showTooltip($event, 'Produk Harus Ditambah', [{label: 'Total penjualan', value: formatRupiah(revenueByAbc('A'))}, {label: 'Kategori', value: 'A - Harus Selalu Ada'}])"
              @mousemove="moveTooltip" @mouseleave="hideTooltip"
              @click="openPanduanPanel('tambah')"
            >
              <div>
                <div class="text-xl font-extrabold text-emerald-600 leading-none">{{ summary.komposisi_abc.A }}</div>
                <div class="text-[10.5px] font-semibold text-gray-700 mt-1 leading-tight">Produk Harus<br />Ditambah Stok</div>
              </div>
              <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
            </div>
            <div
              class="rounded-lg p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors bg-amber-50 border border-amber-200 hover:brightness-[.97]"
              @mouseenter="showTooltip($event, 'Produk Perlu Dipantau', [{label: 'Total penjualan', value: formatRupiah(revenueByAbc('B'))}, {label: 'Kategori', value: 'B - Perlu Dipantau'}])"
              @mousemove="moveTooltip" @mouseleave="hideTooltip"
              @click="openPanduanPanel('pantau')"
            >
              <div>
                <div class="text-xl font-extrabold text-amber-600 leading-none">{{ summary.komposisi_abc.B }}</div>
                <div class="text-[10.5px] font-semibold text-gray-700 mt-1 leading-tight">Produk Perlu<br />Dipantau</div>
              </div>
              <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-width="2" /><path stroke-linecap="round" stroke-width="2" d="M12 8v4l2.5 2.5" /></svg>
            </div>
            <div
              class="rounded-lg p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors bg-orange-50 border border-orange-200 hover:brightness-[.97]"
              @mouseenter="showTooltip($event, 'Produk Musiman', [{label: 'Total penjualan', value: formatRupiah(revenueByKondisi('Produk Musiman'))}, {label: 'Aksi', value: 'Siapkan sebelum musim'}])"
              @mousemove="moveTooltip" @mouseleave="hideTooltip"
              @click="openPanduanPanel('musiman')"
            >
              <div>
                <div class="text-xl font-extrabold text-orange-600 leading-none">{{ summary.komposisi_kondisi['Produk Musiman'] || 0 }}</div>
                <div class="text-[10.5px] font-semibold text-gray-700 mt-1 leading-tight">Produk<br />Musiman</div>
              </div>
              <svg class="w-4 h-4 text-orange-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke-width="2" /><path stroke-linecap="round" stroke-width="2" d="M16 2v4M8 2v4M3 10h18" /></svg>
            </div>
            <div
              class="rounded-lg p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors bg-red-50 border border-red-200 hover:brightness-[.97]"
              @mouseenter="showTooltip($event, 'Produk Kurangi Pembelian', [{label: 'Total penjualan', value: formatRupiah(revenueByAbc('C'))}, {label: 'Kategori', value: 'C - Kurangi Pembelian'}])"
              @mousemove="moveTooltip" @mouseleave="hideTooltip"
              @click="openPanduanPanel('kurangi')"
            >
              <div>
                <div class="text-xl font-extrabold text-red-600 leading-none">{{ summary.komposisi_abc.C }}</div>
                <div class="text-[10.5px] font-semibold text-gray-700 mt-1 leading-tight">Produk Kurangi<br />Pembelian</div>
              </div>
              <svg class="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <router-link
            :to="{ name: 'hasil-analisis' }"
            class="w-full py-2 bg-[#1b3829] hover:bg-[#2d5a3d] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke-width="2" /></svg>
            Lihat Hasil Analisis Lengkap
          </router-link>
        </div>

        <div data-tour="insight-segmentasi" class="bg-white rounded-xl border border-gray-200 p-3.5">
          <h3 class="text-[12.5px] font-bold text-gray-900 mb-3">Insight Segmentasi</h3>
          <div class="space-y-2">
            <div
              v-for="(insight, i) in insights" :key="i"
              class="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-lg border-l-[3px]"
              :class="insightBorder[insight.type]"
            >
              <div class="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="#1b3829" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p class="text-[11.5px] text-gray-700 leading-relaxed">{{ insight.text }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div data-tour="komposisi-segmentasi" class="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-3.5">
          <h3 class="text-[12.5px] font-bold text-gray-900 mb-0.5">Komposisi Segmentasi Produk</h3>
          <p class="text-[10.5px] text-gray-400 mb-3.5">Klik bar untuk filter tabel produk di bawah</p>

          <div class="mb-3.5">
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Prioritas Persediaan (ABC Analysis)</div>
            <div class="space-y-1.5">
              <button
                v-for="(count, kategori) in summary.komposisi_abc" :key="kategori"
                @click="toggleFilterPrioritas(kategori)"
                @mouseenter="showTooltip($event, `Kategori ${kategori}`, [{label: 'Jumlah produk', value: `${count} produk`}, {label: 'Persentase', value: `${((count/summary.jumlah_produk)*100).toFixed(0)}% dari total`}, {label: 'Total penjualan', value: formatRupiah(revenueByAbc(kategori))}])"
                @mousemove="moveTooltip" @mouseleave="hideTooltip"
                class="w-full flex items-center gap-2 p-1 rounded hover:bg-gray-50"
              >
                <span class="text-[11px] font-semibold text-gray-700 w-24 text-left shrink-0">
                  {{ kategori }} — {{ kategori === 'A' ? 'Harus Ada' : kategori === 'B' ? 'Dipantau' : 'Kurangi' }}
                </span>
                <span class="flex-1 h-[18px] bg-gray-100 rounded-full overflow-hidden" :class="filterPrioritas === kategori ? 'ring-2 ring-[#1b3829]' : ''">
                  <span
                    class="h-full block rounded-full transition-all"
                    :class="kategori === 'A' ? 'bg-emerald-500' : kategori === 'B' ? 'bg-amber-500' : 'bg-red-500'"
                    :style="{ width: `${(count / maxAbc) * 100}%` }"
                  ></span>
                </span>
                <span class="text-[10.5px] font-bold text-gray-500 w-14 text-right shrink-0">
                  {{ count }} ({{ ((count/summary.jumlah_produk)*100).toFixed(0) }}%)
                </span>
              </button>
            </div>
          </div>

          <div>
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Kondisi Penjualan (K-Means Clustering)</div>
            <div class="space-y-1.5">
              <button
                v-for="(count, kondisi) in summary.komposisi_kondisi" :key="kondisi"
                @click="toggleFilterKondisi(kondisi)"
                @mouseenter="showTooltip($event, kondisi, [{label: 'Jumlah produk', value: `${count} produk`}, {label: 'Persentase', value: `${((count/summary.jumlah_produk)*100).toFixed(0)}% dari total`}, {label: 'Total penjualan', value: formatRupiah(revenueByKondisi(kondisi))}])"
                @mousemove="moveTooltip" @mouseleave="hideTooltip"
                class="w-full flex items-center gap-2 p-1 rounded hover:bg-gray-50"
              >
                <span class="text-[11px] font-semibold text-gray-700 w-24 text-left shrink-0 truncate">{{ kondisi }}</span>
                <span class="flex-1 h-[18px] bg-gray-100 rounded-full overflow-hidden" :class="filterKondisi === kondisi ? 'ring-2 ring-[#1b3829]' : ''">
                  <span class="h-full block rounded-full transition-all" :class="kondisiWarna[kondisi] || 'bg-gray-400'" :style="{ width: `${(count / maxKondisi) * 100}%` }"></span>
                </span>
                <span class="text-[10.5px] font-bold text-gray-500 w-14 text-right shrink-0">
                  {{ count }} ({{ ((count/summary.jumlah_produk)*100).toFixed(0) }}%)
                </span>
              </button>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2">
          <MatrixPrioritas data-tour="matrix-prioritas" :products="products" @select="openQuadrant" />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div class="space-y-4">
          <TreemapKategori data-tour="treemap" :products="products" @select="toggleFilterKategori" />

          <div data-tour="ringkasan-rekomendasi" class="bg-white rounded-xl border border-gray-200 p-3.5">
            <h3 class="text-[12.5px] font-bold text-gray-900 mb-0.5">Ringkasan Rekomendasi Tindak Lanjut</h3>
            <p class="text-[10.5px] text-gray-400 mb-3">Aksi paling sering direkomendasikan. Arahkan kursor untuk detail.</p>

            <div class="flex h-8 rounded-lg overflow-hidden mb-4">
              <div
                v-for="(r, i) in topRekomendasi" :key="'bar-'+r.text"
                class="h-full cursor-pointer transition-all hover:brightness-110 first:rounded-l-lg last:rounded-r-lg"
                :style="{ width: `${(r.count / topRekomendasi.reduce((s,x)=>s+x.count,0)) * 100}%`, backgroundColor: ['#1b3829', '#2d6a4f', '#40916c', '#d97706', '#9333ea'][i] }"
                @mouseenter="showTooltip($event, r.text, [{label: 'Jumlah produk', value: `${r.count} produk`}, {label: 'Total penjualan', value: formatRupiah(revenueForRekomendasi(r.text))}, {label: 'Kondisi penjualan', value: kondisiBreakdownForRekomendasi(r.text)}, {label: '', value: 'Klik untuk lihat daftar produk'}])"
                @mousemove="moveTooltip" @mouseleave="hideTooltip"
                @click="activePanel = { label: r.text, sublabel: 'Rekomendasi tindak lanjut', items: products.filter(p => p.rekomendasi === r.text) }"
              ></div>
            </div>

            <div class="space-y-2">
              <div
                v-for="(r, i) in topRekomendasi" :key="'leg-'+r.text"
                class="flex items-center gap-2 cursor-pointer group"
                @mouseenter="showTooltip($event, r.text, [{label: 'Jumlah produk', value: `${r.count} produk`}, {label: 'Total penjualan', value: formatRupiah(revenueForRekomendasi(r.text))}, {label: 'Kondisi penjualan', value: kondisiBreakdownForRekomendasi(r.text)}, {label: '', value: 'Klik untuk lihat daftar produk'}])"
                @mousemove="moveTooltip" @mouseleave="hideTooltip"
                @click="activePanel = { label: r.text, sublabel: 'Rekomendasi tindak lanjut', items: products.filter(p => p.rekomendasi === r.text) }"
              >
                <span class="w-2.5 h-2.5 rounded-sm shrink-0" :style="{ backgroundColor: ['#1b3829', '#2d6a4f', '#40916c', '#d97706', '#9333ea'][i] }"></span>
                <span class="flex-1 text-[11px] text-gray-700 truncate group-hover:text-gray-900">{{ r.text }}</span>
                <span class="text-[11px] font-bold text-gray-800 shrink-0">{{ r.count }} produk</span>
              </div>
            </div>
          </div>

          <div data-tour="kategori-produk-terbanyak" class="bg-white rounded-xl border border-gray-200 p-3.5">
            <h3 class="text-[12.5px] font-bold text-gray-900 mb-0.5">Kategori dengan Produk Terbanyak</h3>
            <p class="text-[10.5px] text-gray-400 mb-3">Ukuran bubble = jumlah varian produk. Arahkan kursor untuk detail.</p>
            <div class="flex flex-wrap items-end justify-between gap-4 py-3 px-2">
              <div
                v-for="(k, i) in topKategoriByCount" :key="k.kategori"
                class="flex flex-col items-center cursor-pointer group"
                @mouseenter="showTooltip($event, k.kategori, [{label: 'Jumlah produk', value: `${k.count} produk`}, {label: 'Total penjualan', value: formatRupiah(revenueByKategori(k.kategori))}, {label: 'Rata-rata/produk', value: formatRupiah(revenueByKategori(k.kategori) / k.count)}, {label: 'ABC dominan', value: dominantAbc(k.kategori)}])"
                @mousemove="moveTooltip" @mouseleave="hideTooltip"
                @click="toggleFilterKategori(k.kategori)"
              >
                <div
                  class="rounded-full flex items-center justify-center text-white font-bold shrink-0 transition-transform group-hover:scale-110"
                  :style="{ width: `${44 + (k.pct/100)*46}px`, height: `${44 + (k.pct/100)*46}px`, backgroundColor: ['#1b3829', '#2d6a4f', '#40916c', '#d97706', '#9333ea'][i] }"
                >
                  <span class="text-[12px]">{{ k.count }}</span>
                </div>
                <span class="text-[10px] font-semibold text-gray-700 mt-2 max-w-[70px] truncate text-center">{{ k.kategori }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <TrenBulanan data-tour="tren-bulanan" :data="summary.tren_bulanan || []" />

          <div data-tour="proporsi-kondisi" class="bg-white rounded-xl border border-gray-200 p-3.5">
            <h3 class="text-[12.5px] font-bold text-gray-900 mb-0.5">Proporsi Kondisi Produk</h3>
            <p class="text-[10.5px] text-gray-400 mb-3">Klik segmen atau baris untuk filter tabel produk</p>
            <div class="flex items-center gap-6">
              <svg viewBox="0 0 140 140" class="w-[140px] h-[140px] shrink-0">
                <circle cx="70" cy="70" r="54" fill="none" stroke="#e5e7eb" stroke-width="20" />
                <circle
                  v-for="seg in donutSegments" :key="seg.kondisi"
                  cx="70" cy="70" r="54" fill="none" :stroke="seg.color" stroke-width="20"
                  :stroke-dasharray="`${(seg.pct/100)*339.3} 339.3`"
                  :stroke-dashoffset="-(donutSegments.slice(0, donutSegments.indexOf(seg)).reduce((s,x)=>s+(x.pct/100)*339.3,0))"
                  transform="rotate(-90 70 70)"
                  class="cursor-pointer transition-opacity hover:opacity-75"
                  @mouseenter="showTooltip($event, seg.kondisi, [{label: 'Jumlah produk', value: `${seg.count} produk`}, {label: 'Persentase', value: `${seg.pct.toFixed(0)}% dari total`}, {label: 'Total penjualan', value: formatRupiah(revenueByKondisi(seg.kondisi))}, {label: 'Rata-rata/produk', value: formatRupiah(revenueByKondisi(seg.kondisi) / seg.count)}])"
                  @mousemove="moveTooltip" @mouseleave="hideTooltip"
                  @click="toggleFilterKondisi(seg.kondisi)"
                />
                <text x="70" y="66" text-anchor="middle" font-size="22" font-weight="800" fill="#111">{{ summary.jumlah_produk }}</text>
                <text x="70" y="82" text-anchor="middle" font-size="9" fill="#9ca3af">Produk</text>
              </svg>
              <div class="flex-1 min-w-0 space-y-1.5">
                <button
                  v-for="seg in donutSegments" :key="'leg'+seg.kondisi"
                  class="w-full flex items-center gap-2 text-left rounded-lg px-2 py-1.5 transition-colors"
                  :class="filterKondisi === seg.kondisi ? 'bg-gray-100' : 'hover:bg-gray-50'"
                  @click="toggleFilterKondisi(seg.kondisi)"
                >
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: seg.color }"></span>
                  <span class="flex-1 text-[11.5px] font-medium text-gray-700 truncate">{{ seg.kondisi }}</span>
                  <span class="text-right shrink-0">
                    <span class="block text-[11.5px] font-bold text-gray-800">{{ seg.count }} <span class="font-normal text-gray-400">({{ seg.pct.toFixed(0) }}%)</span></span>
                    <span class="block text-[9.5px] text-gray-400">avg {{ formatRupiah(revenueByKondisi(seg.kondisi) / seg.count) }}/produk</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div data-tour="top-5-produk" class="bg-white rounded-xl border border-gray-200 p-3.5">
            <h3 class="text-[12.5px] font-bold text-gray-900 mb-0.5">Top 5 Produk Terlaris</h3>
            <p class="text-[10.5px] text-gray-400 mb-3">Berdasarkan total penjualan, klik untuk lihat detail</p>
            <div class="space-y-2.5">
              <button
                v-for="(p, i) in topProducts" :key="p.nama_produk"
                @click="lihatDetail(p.nama_produk)"
                @mouseenter="showTooltip($event, p.nama_produk, [{label: 'Kategori', value: p.kategori}, {label: 'Kondisi', value: p.kondisi_penjualan}, {label: 'Prioritas', value: p.prioritas_abc}, {label: 'Total penjualan', value: formatRupiah(p.total_penjualan)}, {label: 'Total terjual', value: `${p.total_terjual.toLocaleString('id-ID')} pcs`}])"
                @mousemove="moveTooltip" @mouseleave="hideTooltip"
                class="w-full text-left group"
              >
                <div class="flex items-center justify-between text-[11px] mb-1">
                  <span class="font-semibold text-gray-700 truncate flex items-center gap-1.5">
                    <span class="text-gray-300 font-bold w-3 shrink-0">{{ i + 1 }}</span>
                    {{ p.nama_produk }}
                  </span>
                  <span class="font-bold text-gray-800 shrink-0 ml-2">{{ formatRupiah(p.total_penjualan) }}</span>
                </div>
                <div class="h-[14px] bg-gray-100 rounded-full overflow-hidden ml-4.5">
                  <div
                    class="h-full rounded-full transition-all group-hover:brightness-110"
                    :style="{ width: `${(p.total_penjualan / maxTopProduct) * 100}%`, backgroundColor: kondisiWarnaBar[p.kondisi_penjualan] }"
                  ></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref="daftarProdukRef" data-tour="daftar-produk-table" class="bg-white rounded-xl border border-gray-200 p-3.5 scroll-mt-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[12.5px] font-bold text-gray-900">Daftar Produk</h3>
          <router-link :to="{ name: 'hasil-analisis' }" class="text-[11px] font-semibold text-emerald-700 hover:underline">
            Lihat Hasil Analisis Lengkap &rarr;
          </router-link>
        </div>

        <div class="flex flex-wrap items-center gap-1.5 mb-3">
          <select v-model="filterKondisi" class="px-2 py-1.5 border border-gray-200 rounded-md text-[11px] text-gray-700">
            <option value="">Semua Kondisi</option>
            <option v-for="k in kondisiOptions" :key="k" :value="k">{{ k }}</option>
          </select>
          <select v-model="filterPrioritas" class="px-2 py-1.5 border border-gray-200 rounded-md text-[11px] text-gray-700">
            <option value="">Semua Prioritas</option>
            <option value="A">Prioritas A</option>
            <option value="B">Prioritas B</option>
            <option value="C">Prioritas C</option>
          </select>
          <select v-model="filterKategori" class="px-2 py-1.5 border border-gray-200 rounded-md text-[11px] text-gray-700">
            <option value="">Semua Kategori</option>
            <option v-for="k in kategoriOptions" :key="k" :value="k">{{ k }}</option>
          </select>
          <div class="relative flex-1 min-w-[160px]">
            <svg class="w-3 h-3 text-gray-300 absolute left-2 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke-width="2" /><path stroke-linecap="round" stroke-width="2" d="M21 21l-4.35-4.35" /></svg>
            <input v-model="searchQuery" type="text" placeholder="Cari nama produk..." class="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-md text-[11px]" />
          </div>
          <span class="text-[10.5px] text-gray-400 ml-auto">{{ filteredProducts.length }} dari {{ products.length }} produk</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-[11.5px]">
            <thead class="bg-gray-50 text-gray-400 text-[9.5px] uppercase tracking-wide">
              <tr>
                <th class="text-left px-2 py-2 font-bold">Nama Produk</th>
                <th class="text-left px-2 py-2 font-bold">Kategori</th>
                <th class="text-left px-2 py-2 font-bold">Kondisi</th>
                <th class="text-left px-2 py-2 font-bold">Prioritas</th>
                <th class="text-right px-2 py-2 font-bold">Terjual</th>
                <th class="text-right px-2 py-2 font-bold">Penjualan</th>
                <th class="text-right px-2 py-2 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="p in filteredProducts.slice(0, 10)" :key="p.nama_produk" class="hover:bg-gray-50">
                <td class="px-2 py-2 font-medium text-gray-800">{{ p.nama_produk }}</td>
                <td class="px-2 py-2 text-gray-500">{{ p.kategori }}</td>
                <td class="px-2 py-2">
                  <span class="px-1.5 py-0.5 rounded text-[10.5px] font-semibold" :class="badgeKondisi[p.kondisi_penjualan]">{{ p.kondisi_penjualan }}</span>
                </td>
                <td class="px-2 py-2">
                  <span class="px-1.5 py-0.5 rounded text-[10.5px] font-bold" :class="badgeAbc[p.prioritas_abc]">{{ p.prioritas_abc }}</span>
                </td>
                <td class="px-2 py-2 text-right text-gray-600">{{ p.total_terjual.toLocaleString('id-ID') }}</td>
                <td class="px-2 py-2 text-right text-gray-600">{{ formatRupiah(p.total_penjualan) }}</td>
                <td class="px-2 py-2 text-right">
                  <button @click="lihatDetail(p.nama_produk)" class="text-[10.5px] font-bold text-[#1b3829] hover:bg-emerald-50 px-1.5 py-0.5 rounded">Detail</button>
                </td>
              </tr>
              <tr v-if="filteredProducts.length === 0">
                <td colspan="7" class="px-2 py-8 text-center text-gray-400">Tidak ada produk yang cocok.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="text-[10.5px] text-gray-400 flex items-center gap-1.5 pt-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2" /><path stroke-linecap="round" stroke-width="2" d="M12 6v6l4 2" /></svg>
        Data terakhir diperbarui: {{ summary.created_at ? new Date(summary.created_at).toLocaleString('id-ID') : '-' }}
        &middot; Menampilkan: {{ summary.periode_data }}
      </div>
    </div>

    <div v-else class="text-center text-gray-400 py-20">Memuat...</div>

    <ProdukPrioritasPanel
      v-if="activePanel"
      :title="activePanel.label"
      :subtitle="`${activePanel.sublabel} — ${activePanel.items.length} produk`"
      :items="activePanel.items"
      @close="activePanel = null"
    />

    <ChartTooltip :tooltip="tooltip" />
  </div>
</template>
