<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAnalysisStore } from '@/stores/analysis'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const route = useRoute()
const analysisStore = useAnalysisStore()

const products = ref([])
const total = ref(0)
const loadError = ref(false)

const allProducts = ref([])

const filterKategori = ref('')
const filterKondisi = ref('')
const filterPrioritas = ref('')
const searchQuery = ref(route.query.search || '')
const currentPage = ref(1)
const PAGE_SIZE = 19

const kondisiList = ['Produk Harian', 'Produk Langka', 'Produk Andalan', 'Produk Premium']
const abcList = ['A', 'B', 'C']

// ── Badge colors: one consistent 4-color family, desaturated, solid bg ──
// green = harian/rutin · blue = andalan/stabil · amber = premium/mahal · merah-bata = langka/perlu tindakan
const badgeKondisi = {
  'Produk Harian': 'bg-[#e2ede6] text-[#3d6b4f]',
  'Produk Langka': 'bg-[#f0dede] text-[#8a4a4a]',
  'Produk Andalan': 'bg-[#e3e9f2] text-[#3d5a75]',
  'Produk Premium': 'bg-[#f0e8d8] text-[#8a6d3b]',
}
const kondisiDeskripsi = {
  'Produk Harian': 'Paling sering dibeli, harganya murah, jaga stok jangan sampai kehabisan.',
  'Produk Langka': 'Jarang dibeli dibanding produk lain, tapi tetap ada peminatnya tiap bulan.',
  'Produk Andalan': 'Penyumbang keuntungan terbesar toko, prioritas utama dijaga stoknya.',
  'Produk Premium': 'Harganya mahal, tapi tetap rutin dicari walau jumlahnya sedikit.',
}
const badgePrioritas = {
  A: 'bg-[#e2ede6] text-[#3d6b4f]',
  B: 'bg-[#f0e8d8] text-[#8a6d3b]',
  C: 'bg-[#f0dede] text-[#8a4a4a]',
}
const prioritasShort = { A: 'A', B: 'B', C: 'C' }
const prioritasLabel = { A: 'Harus Selalu Ada', B: 'Perlu Dipantau', C: 'Kurangi Pembelian' }

function badgeRekomendasi(text = '') {
  const t = text.toLowerCase()
  if (t.includes('tambah') || t.includes('promosi')) return 'bg-[#e2ede6] text-[#3d6b4f]'
  if (t.includes('pertahankan') || t.includes('cek harga')) return 'bg-[#e3e9f2] text-[#3d5a75]'
  if (t.includes('musim') || t.includes('gabungkan')) return 'bg-[#f0e8d8] text-[#8a6d3b]'
  if (t.includes('kurangi') || t.includes('evaluasi')) return 'bg-[#f0dede] text-[#8a4a4a]'
  return 'bg-gray-100 text-gray-600'
}

function iconFor(kategori) {
  return kategori ? kategori.trim().charAt(0).toUpperCase() : '?'
}

function formatRupiah(value) {
  return `Rp${Math.round(value).toLocaleString('id-ID')}`
}

// Format ringkas buat sel tabel per-bulan (kolomnya banyak, nggak muat kalau full Rp)
function formatCompact(value) {
  if (!value) return '-'
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} M`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} Jt`
  if (value >= 1e3) return `${Math.round(value / 1e3)} rb`
  return `${Math.round(value)}`
}

// ── Mode Ringkasan (existing) ──
async function loadProducts() {
  try {
    const filters = {}
    if (filterKategori.value) filters.kategori = filterKategori.value
    if (filterKondisi.value) filters.kondisi = filterKondisi.value
    if (filterPrioritas.value) filters.prioritas = filterPrioritas.value
    if (searchQuery.value) filters.search = searchQuery.value

    const data = await analysisStore.fetchProducts(filters)
    products.value = data.products
    total.value = data.total
    currentPage.value = 1
  } catch {
    loadError.value = true
  }
}

async function loadSummary() {
  try {
    const data = await analysisStore.fetchProducts({})
    allProducts.value = data.products
  } catch {
    // dropdown kategori cuma nggak keisi kalau ini gagal; error tabel ditangani terpisah
  }
}

// ── Mode Per Bulan (baru) ──
const viewMode = ref('ringkasan') // 'ringkasan' | 'bulanan'
const bulanAwal = ref('')
const bulanAkhir = ref('')
const months = ref([])
const monthlyProducts = ref([])
const monthlyLoading = ref(false)
const monthlyLoadError = ref('')
const currentPageMonthly = ref(1)
const selectedForChart = ref(new Set())

const bulanLabelMap = { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Agu', '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des' }
function monthLabel(ym) {
  const [y, m] = ym.split('-')
  return `${bulanLabelMap[m]} '${y.slice(2)}`
}

async function loadMonthly() {
  if (!bulanAwal.value || !bulanAkhir.value) return
  monthlyLoading.value = true
  monthlyLoadError.value = ''
  try {
    const filters = { bulan_awal: bulanAwal.value, bulan_akhir: bulanAkhir.value }
    if (filterKategori.value) filters.kategori = filterKategori.value
    if (filterKondisi.value) filters.kondisi = filterKondisi.value
    if (filterPrioritas.value) filters.prioritas = filterPrioritas.value
    if (searchQuery.value) filters.search = searchQuery.value

    const data = await analysisStore.fetchProductsMonthly(filters)
    months.value = data.months
    monthlyProducts.value = data.products
    currentPageMonthly.value = 1
  } catch (e) {
    monthlyLoadError.value = e.response?.data?.error || 'Gagal memuat data bulanan.'
    monthlyProducts.value = []
    months.value = []
  } finally {
    monthlyLoading.value = false
  }
}

function switchMode(mode) {
  viewMode.value = mode
  if (mode === 'bulanan' && bulanAwal.value && bulanAkhir.value && monthlyProducts.value.length === 0) {
    loadMonthly()
  }
}

function toggleChartSelect(namaProduk) {
  const s = new Set(selectedForChart.value)
  if (s.has(namaProduk)) s.delete(namaProduk)
  else s.add(namaProduk)
  selectedForChart.value = s
}

const totalPagesMonthly = computed(() => Math.max(1, Math.ceil(monthlyProducts.value.length / PAGE_SIZE)))
const pagedMonthlyProducts = computed(() => {
  const start = (currentPageMonthly.value - 1) * PAGE_SIZE
  return monthlyProducts.value.slice(start, start + PAGE_SIZE)
})
const rangeLabelMonthly = computed(() => {
  if (monthlyProducts.value.length === 0) return '0 produk'
  const start = (currentPageMonthly.value - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPageMonthly.value * PAGE_SIZE, monthlyProducts.value.length)
  return `Menampilkan ${start}–${end} dari ${monthlyProducts.value.length} produk`
})
function goToPageMonthly(p) {
  if (p >= 1 && p <= totalPagesMonthly.value) currentPageMonthly.value = p
}

// ── Grafik perbandingan (SVG manual, konsisten sama scatter plot Hasil Analisis) ──
const CHART_W = 640
const CHART_H = 190
const CHART_PAD_L = 50
const CHART_PAD_R = 16
const CHART_PAD_T = 12
const CHART_PAD_B = 26
const chartColors = ['#3d6b4f', '#4f6c8a', '#b6935a', '#a15252', '#3d5580', '#8a4a4a', '#33507a', '#5c8a70']

const selectedProductsData = computed(() =>
  monthlyProducts.value.filter((p) => selectedForChart.value.has(p.nama_produk))
)
const chartMaxValue = computed(() => {
  let max = 1
  for (const p of selectedProductsData.value) {
    for (const ym of months.value) {
      const v = p.monthly[ym] || 0
      if (v > max) max = v
    }
  }
  return max
})
function chartX(i) {
  if (months.value.length <= 1) return CHART_PAD_L
  return CHART_PAD_L + (i / (months.value.length - 1)) * (CHART_W - CHART_PAD_L - CHART_PAD_R)
}
function chartY(v) {
  return CHART_H - CHART_PAD_B - (v / chartMaxValue.value) * (CHART_H - CHART_PAD_T - CHART_PAD_B)
}
function chartPoints(p) {
  return months.value.map((ym, i) => `${chartX(i)},${chartY(p.monthly[ym] || 0)}`).join(' ')
}
const chartYTicks = computed(() => {
  const max = chartMaxValue.value
  return [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f))
})

// Tooltip hover di titik grafik -- konsisten sama pola tooltip Scatter Plot di Hasil Analisis
const hoverPoint = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })
function onDotHover(namaProduk, ym, value, event) {
  hoverPoint.value = { produk: namaProduk, bulan: monthLabel(ym), value }
  const container = event.currentTarget.closest('svg').parentElement.getBoundingClientRect()
  tooltipPos.value = { x: event.clientX - container.left, y: event.clientY - container.top }
}

// Tint background baris tabel yang lagi dicentang, warnanya nyambung ke garis di grafik
function rowHighlightStyle(namaProduk) {
  const idx = selectedProductsData.value.findIndex((p) => p.nama_produk === namaProduk)
  if (idx === -1) return {}
  const color = chartColors[idx % chartColors.length]
  return { backgroundColor: `${color}26`, borderLeft: `3px solid ${color}` }
}

let searchTimeout
function refreshActiveMode() {
  if (viewMode.value === 'ringkasan') loadProducts()
  else loadMonthly()
}
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(refreshActiveMode, 300)
})
watch([filterKategori, filterKondisi, filterPrioritas], refreshActiveMode)
watch([bulanAwal, bulanAkhir], () => {
  if (viewMode.value === 'bulanan') loadMonthly()
})

onMounted(() => {
  loadProducts()
  loadSummary()
})

// kategoriList tetap dipakai untuk isi dropdown filter kategori
const kategoriList = computed(() => [...new Set(allProducts.value.map((p) => p.kategori))].sort())

const totalPages = computed(() => Math.max(1, Math.ceil(products.value.length / PAGE_SIZE)))
const pagedProducts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return products.value.slice(start, start + PAGE_SIZE)
})
const rangeLabel = computed(() => {
  if (products.value.length === 0) return '0 produk'
  const start = (currentPage.value - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage.value * PAGE_SIZE, products.value.length)
  return `Menampilkan ${start}–${end} dari ${products.value.length} produk`
})
function goToPage(p) {
  if (p >= 1 && p <= totalPages.value) currentPage.value = p
}

function exportExcel() {
  const header = ['No', 'Nama Produk', 'Kategori', 'Kondisi Penjualan', 'Prioritas', 'Total Terjual', 'Total Penjualan', 'Rekomendasi']
  const rows = products.value.map((p, i) => [
    i + 1, p.nama_produk, p.kategori, p.kondisi_penjualan, p.prioritas_abc,
    p.total_terjual, p.total_penjualan, p.rekomendasi,
  ])
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'data-produk-yudi-motor.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportPdf() {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(14)
  doc.setTextColor(30, 58, 42)
  doc.setFont(undefined, 'bold')
  doc.text('Yudi Motor Analytics: Data Produk', 40, 40)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.setFont(undefined, 'normal')
  const tanggalExport = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const filterInfo = [
    filterKategori.value && `Kategori: ${filterKategori.value}`,
    filterKondisi.value && `Kondisi: ${filterKondisi.value}`,
    filterPrioritas.value && `Prioritas: ${filterPrioritas.value}`,
    searchQuery.value && `Cari: "${searchQuery.value}"`,
  ].filter(Boolean).join('  ·  ')
  doc.text(
    `Diekspor ${tanggalExport}  ·  ${products.value.length} produk${filterInfo ? '  ·  ' + filterInfo : ''}`,
    40, 56
  )

  autoTable(doc, {
    startY: 72,
    head: [['No', 'Nama Produk', 'Kategori', 'Kondisi', 'Prioritas', 'Terjual', 'Pendapatan', 'Rekomendasi']],
    body: products.value.map((p, i) => [
      i + 1,
      p.nama_produk,
      p.kategori,
      p.kondisi_penjualan,
      `${p.prioritas_abc}: ${prioritasLabel[p.prioritas_abc]}`,
      `${p.total_terjual.toLocaleString('id-ID')} pcs`,
      formatRupiah(p.total_penjualan),
      p.rekomendasi,
    ]),
    styles: { fontSize: 8, cellPadding: 5, textColor: [40, 40, 40] },
    headStyles: { fillColor: [30, 58, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 249] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 110 },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { cellWidth: 160 },
    },
    margin: { left: 40, right: 40 },
    didDrawPage: () => {
      const pageCount = doc.internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Halaman ${doc.internal.getCurrentPageInfo().pageNumber} dari ${pageCount}`,
        pageWidth - 90, doc.internal.pageSize.getHeight() - 20
      )
    },
  })

  doc.save(`data-produk-yudi-motor-${new Date().toISOString().slice(0, 10)}.pdf`)
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-[19px] font-bold text-[#111] tracking-tight">Data Produk</h1>
      <p class="text-xs text-[#888] mt-0.5">Daftar seluruh produk beserta kondisi penjualan dan rekomendasi pengelolaan stok</p>
    </div>

    <div v-if="loadError" class="bg-white rounded-xl border border-[#e8eae8] p-10 text-center text-gray-500">
      Belum ada hasil analisis. Jalankan analisis baru terlebih dahulu.
    </div>

    <!-- Toggle mode -->
    <div class="flex items-center gap-2 mb-3.5">
      <button
        @click="switchMode('ringkasan')"
        class="px-4 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors"
        :class="viewMode === 'ringkasan' ? 'bg-[#1e3a2a] text-white' : 'bg-[#f0f1f3] text-[#666] hover:bg-[#e5e6e8]'"
      >
        Ringkasan
      </button>
      <button
        @click="switchMode('bulanan')"
        class="px-4 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors"
        :class="viewMode === 'bulanan' ? 'bg-[#1e3a2a] text-white' : 'bg-[#f0f1f3] text-[#666] hover:bg-[#e5e6e8]'"
      >
        Per Bulan
      </button>
    </div>

    <!-- Filter bar (kategori/kondisi/prioritas/search dipakai bareng 2 mode) -->
    <div data-tour="data-produk-filter" class="flex flex-wrap items-center gap-2 mb-3.5">
      <div class="relative">
        <select
          v-model="filterKategori"
          class="appearance-none pl-3 pr-8 py-2 rounded-lg text-[12.5px] outline-none cursor-pointer font-medium"
          :class="filterKategori ? 'border-[1.5px] border-[#2d6a4f] bg-[#f2f8f4] text-[#1e3a2a]' : 'border-[1.5px] border-[#e0e0e0] bg-white text-[#333]'"
        >
          <option value="">Semua Kategori</option>
          <option v-for="k in kategoriList" :key="k" :value="k">{{ k }}</option>
        </select>
        <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="10" fill="none" stroke="#999" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      <div class="relative">
        <select
          v-model="filterKondisi"
          class="appearance-none pl-3 pr-8 py-2 rounded-lg text-[12.5px] outline-none cursor-pointer font-medium"
          :class="filterKondisi ? 'border-[1.5px] border-[#2d6a4f] bg-[#f2f8f4] text-[#1e3a2a]' : 'border-[1.5px] border-[#e0e0e0] bg-white text-[#333]'"
        >
          <option value="">Semua Kondisi</option>
          <option v-for="k in kondisiList" :key="k" :value="k">{{ k }}</option>
        </select>
        <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="10" fill="none" stroke="#999" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      <div class="relative">
        <select
          v-model="filterPrioritas"
          class="appearance-none pl-3 pr-8 py-2 rounded-lg text-[12.5px] outline-none cursor-pointer font-medium"
          :class="filterPrioritas ? 'border-[1.5px] border-[#2d6a4f] bg-[#f2f8f4] text-[#1e3a2a]' : 'border-[1.5px] border-[#e0e0e0] bg-white text-[#333]'"
        >
          <option value="">Semua Prioritas</option>
          <option v-for="a in abcList" :key="a" :value="a">{{ a }}: {{ prioritasLabel[a] }}</option>
        </select>
        <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="10" fill="none" stroke="#999" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      <div class="relative flex-1 min-w-[180px] max-w-[280px]">
        <svg class="absolute left-2.5 top-1/2 -translate-y-1/2" width="13" height="13" fill="none" stroke="#bbb" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama produk..."
          class="w-full pl-[30px] pr-2.5 py-2 rounded-lg border-[1.5px] border-[#e0e0e0] text-[12.5px] text-[#333] outline-none focus:border-[#2d6a4f]"
        />
      </div>

      <!-- Kanan: export (mode Ringkasan) atau rentang bulan (mode Per Bulan) -->
      <div v-if="viewMode === 'ringkasan'" class="ml-auto flex gap-2">
        <button
          @click="exportExcel"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-semibold border-[1.5px] border-[#d1d5db] bg-white text-[#333] hover:bg-gray-50 hover:border-[#9ca3af] transition-colors"
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Excel
        </button>
        <button
          @click="exportPdf"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-semibold border-[1.5px] border-[#1e3a2a] bg-[#1e3a2a] text-white hover:bg-[#2d5a3d] transition-colors"
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export PDF
        </button>
      </div>
      <div v-else class="ml-auto flex items-center gap-2">
        <span class="text-[11px] text-[#888] font-medium">Dari</span>
        <input v-model="bulanAwal" type="month" class="px-2.5 py-1.5 rounded-lg border-[1.5px] border-[#e0e0e0] text-[12.5px] text-[#333] outline-none focus:border-[#2d6a4f]" />
        <span class="text-[11px] text-[#888] font-medium">Sampai</span>
        <input v-model="bulanAkhir" type="month" class="px-2.5 py-1.5 rounded-lg border-[1.5px] border-[#e0e0e0] text-[12.5px] text-[#333] outline-none focus:border-[#2d6a4f]" />
      </div>
    </div>

    <!-- Legenda -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2.5 text-[11px] text-[#888]">
      <span class="font-medium text-[#666]">Prioritas:</span>
      <span v-for="a in abcList" :key="a" class="inline-flex items-center gap-1.5">
        <span class="inline-flex items-center justify-center w-4 h-4 rounded text-[9.5px] font-bold" :class="badgePrioritas[a]">{{ a }}</span>
        {{ prioritasLabel[a] }}
      </span>
    </div>

    <!-- ============ MODE RINGKASAN ============ -->
    <div v-if="viewMode === 'ringkasan'" class="bg-white border border-[#e8eae8] rounded-[10px] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-[#f9fafb] border-b-[1.5px] border-[#e8eae8]">
              <th class="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide w-10">No</th>
              <th class="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Nama Produk</th>
              <th class="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Kategori</th>
              <th class="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Kondisi Penjualan</th>
              <th class="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Prioritas</th>
              <th class="text-right px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Total Terjual</th>
              <th class="text-right px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Total Penjualan</th>
              <th class="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Rekomendasi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(p, idx) in pagedProducts"
              :key="p.nama_produk"
              class="border-b border-[#f3f4f3] last:border-b-0 hover:bg-[#fafbfa] transition-colors row-fade-in"
              :style="{ animationDelay: `${Math.min(idx, 12) * 30}ms` }"
            >
              <td class="px-3.5 py-3 text-[12px] text-[#bbb]">{{ (currentPage - 1) * PAGE_SIZE + idx + 1 }}</td>
              <td class="px-3.5 py-3">
                <div class="flex items-center gap-2 font-medium text-[13px] text-[#222] min-w-[160px]">
                  <span class="w-7 h-7 rounded-md bg-[#f3f4f6] flex items-center justify-center text-[13px] shrink-0">{{ iconFor(p.kategori) }}</span>
                  {{ p.nama_produk }}
                </div>
              </td>
              <td class="px-3.5 py-3 text-[12.5px] text-[#555]">{{ p.kategori }}</td>
              <td class="px-3.5 py-3">
                <span class="inline-flex items-center px-2.5 py-[3px] rounded-[5px] text-xs font-semibold whitespace-nowrap transition-transform hover:scale-105" :class="badgeKondisi[p.kondisi_penjualan]" :title="kondisiDeskripsi[p.kondisi_penjualan]">
                  {{ p.kondisi_penjualan }}
                </span>
              </td>
              <td class="px-3.5 py-3">
                <span class="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold transition-transform hover:scale-110" :class="badgePrioritas[p.prioritas_abc]" :title="prioritasLabel[p.prioritas_abc]">
                  {{ prioritasShort[p.prioritas_abc] }}
                </span>
              </td>
              <td class="px-3.5 py-3 text-[13px] text-[#333] text-right tabular-nums whitespace-nowrap">{{ p.total_terjual.toLocaleString('id-ID') }} pcs</td>
              <td class="px-3.5 py-3 text-[13px] text-[#333] text-right tabular-nums whitespace-nowrap">{{ formatRupiah(p.total_penjualan) }}</td>
              <td class="px-3.5 py-3">
                <span class="inline-flex items-center px-2.5 py-[3px] rounded-[5px] text-xs font-semibold whitespace-nowrap transition-transform hover:scale-105" :class="badgeRekomendasi(p.rekomendasi)">
                  {{ p.rekomendasi }}
                </span>
              </td>
            </tr>
            <tr v-if="pagedProducts.length === 0">
              <td colspan="8" class="px-4 py-10 text-center text-gray-400 text-sm">Tidak ada produk yang cocok dengan filter.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-4 py-3 border-t border-[#e8eae8] flex items-center justify-between">
        <span class="text-xs text-[#9ca3af]">{{ rangeLabel }}</span>
        <div class="flex gap-1">
          <button
            v-for="p in totalPages"
            :key="p"
            @click="goToPage(p)"
            class="px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors"
            :class="p === currentPage ? 'bg-[#1e3a2a] border-[#1e3a2a] text-white' : 'bg-white border-[#e8eae8] text-[#555] hover:bg-gray-50'"
          >
            {{ p }}
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 rounded-md text-xs border border-[#e8eae8] bg-white text-[#555] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            &rarr;
          </button>
        </div>
      </div>
    </div>

    <!-- ============ MODE PER BULAN ============ -->
    <div v-else>
      <div v-if="!bulanAwal || !bulanAkhir" class="bg-white rounded-[10px] border border-[#e8eae8] p-10 text-center text-[#888] text-sm">
        Pilih rentang bulan di atas untuk melihat perbandingan pendapatan per produk.
      </div>
      <div v-else-if="monthlyLoadError" class="bg-white rounded-[10px] border border-[#e8eae8] p-10 text-center text-[#8a4a4a] text-sm">
        {{ monthlyLoadError }}
      </div>
      <div v-else>
        <!-- Grafik -->
        <div class="bg-white rounded-[10px] border border-[#e8eae8] p-4 mb-4">
          <div class="text-[13px] font-bold text-[#111] mb-0.5">Grafik Perbandingan</div>
          <p class="text-[11px] text-[#999] mb-3">{{ selectedForChart.size === 0 ? 'Centang produk di tabel untuk menampilkan grafik.' : `${selectedForChart.size} produk dicentang` }}</p>
          <div v-if="selectedForChart.size > 0" class="relative">
            <svg :viewBox="`0 0 ${CHART_W} ${CHART_H}`" class="w-full h-[190px]">
              <g v-for="t in chartYTicks" :key="t">
                <line :x1="CHART_PAD_L" :x2="CHART_W - CHART_PAD_R" :y1="chartY(t)" :y2="chartY(t)" stroke="#f0f0ef" stroke-width="1" />
                <text :x="CHART_PAD_L - 8" :y="chartY(t) + 3" text-anchor="end" font-size="9" fill="#9ca3af">{{ formatCompact(t) }}</text>
              </g>
              <text v-for="(ym, i) in months" :key="ym" :x="chartX(i)" :y="CHART_H - 6" text-anchor="middle" font-size="9" fill="#9ca3af">{{ monthLabel(ym) }}</text>
              <polyline
                v-for="(p, idx) in selectedProductsData" :key="p.nama_produk"
                :points="chartPoints(p)" fill="none" :stroke="chartColors[idx % chartColors.length]" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"
              />
              <template v-for="(p, idx) in selectedProductsData" :key="'dots-' + p.nama_produk">
                <circle
                  v-for="(ym, i) in months" :key="ym"
                  :cx="chartX(i)" :cy="chartY(p.monthly[ym] || 0)"
                  :r="hoverPoint && hoverPoint.produk === p.nama_produk && hoverPoint.bulan === monthLabel(ym) ? 5 : 3"
                  :fill="chartColors[idx % chartColors.length]"
                  stroke="#fff" stroke-width="1.2"
                  class="cursor-pointer transition-all duration-100"
                  @mouseenter="onDotHover(p.nama_produk, ym, p.monthly[ym] || 0, $event)"
                  @mousemove="onDotHover(p.nama_produk, ym, p.monthly[ym] || 0, $event)"
                  @mouseleave="hoverPoint = null"
                />
              </template>
            </svg>

            <div
              v-if="hoverPoint"
              class="absolute z-10 pointer-events-none bg-[#111827] text-white text-xs rounded-lg shadow-lg px-3 py-2 whitespace-nowrap transition-opacity"
              :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px', transform: 'translate(-50%, calc(-100% - 10px))' }"
            >
              <div class="font-semibold text-[12px] mb-0.5">{{ hoverPoint.produk }}</div>
              <div class="text-gray-300">{{ hoverPoint.bulan }} &middot; <span class="text-white font-medium">{{ formatRupiah(hoverPoint.value) }}</span></div>
            </div>
          </div>
          <div class="flex flex-wrap gap-3 mt-2">
            <div v-for="(p, idx) in selectedProductsData" :key="p.nama_produk" class="flex items-center gap-1.5 text-[11px] text-[#666]">
              <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: chartColors[idx % chartColors.length] }"></span>
              {{ p.nama_produk }}
            </div>
          </div>
        </div>

        <!-- Tabel per bulan -->
        <div class="bg-white border border-[#e8eae8] rounded-[10px] overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse" style="min-width: 760px;">
              <thead>
                <tr class="bg-[#f9fafb] border-b-[1.5px] border-[#e8eae8]">
                  <th class="px-3 py-2.5 w-9"></th>
                  <th class="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Nama Produk</th>
                  <th class="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Kondisi</th>
                  <th class="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Prioritas</th>
                  <th v-for="ym in months" :key="ym" class="text-right px-3 py-2.5 text-[10.5px] font-semibold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap">{{ monthLabel(ym) }}</th>
                  <th class="text-right px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(p, idx) in pagedMonthlyProducts" :key="p.nama_produk"
                  class="border-b border-[#f3f4f3] last:border-b-0 hover:brightness-95 transition-colors row-fade-in"
                  :style="{ animationDelay: `${Math.min(idx, 12) * 30}ms`, ...rowHighlightStyle(p.nama_produk) }"
                >
                  <td class="px-3 py-3 text-center">
                    <input type="checkbox" :checked="selectedForChart.has(p.nama_produk)" @change="toggleChartSelect(p.nama_produk)" />
                  </td>
                  <td class="px-3.5 py-3 font-medium text-[13px] text-[#222] whitespace-nowrap">{{ p.nama_produk }}</td>
                  <td class="px-3.5 py-3">
                    <span class="inline-flex items-center px-2 py-[3px] rounded-[5px] text-[10.5px] font-semibold whitespace-nowrap" :class="badgeKondisi[p.kondisi_penjualan]">{{ p.kondisi_penjualan }}</span>
                  </td>
                  <td class="px-3.5 py-3">
                    <span class="inline-flex items-center justify-center w-5 h-5 rounded text-[10.5px] font-bold" :class="badgePrioritas[p.prioritas_abc]">{{ p.prioritas_abc }}</span>
                  </td>
                  <td v-for="ym in months" :key="ym" class="px-3 py-3 text-right text-[12px] text-[#555] tabular-nums whitespace-nowrap">{{ formatCompact(p.monthly[ym]) }}</td>
                  <td class="px-3.5 py-3 text-right text-[13px] font-bold text-[#222] tabular-nums whitespace-nowrap">{{ formatCompact(p.total) }}</td>
                </tr>
                <tr v-if="pagedMonthlyProducts.length === 0">
                  <td :colspan="5 + months.length" class="px-4 py-10 text-center text-gray-400 text-sm">Tidak ada produk yang cocok dengan filter di rentang ini.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="px-4 py-3 border-t border-[#e8eae8] flex items-center justify-between">
            <span class="text-xs text-[#9ca3af]">{{ rangeLabelMonthly }}</span>
            <div class="flex gap-1">
              <button
                v-for="p in totalPagesMonthly" :key="p"
                @click="goToPageMonthly(p)"
                class="px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors"
                :class="p === currentPageMonthly ? 'bg-[#1e3a2a] border-[#1e3a2a] text-white' : 'bg-white border-[#e8eae8] text-[#555] hover:bg-gray-50'"
              >
                {{ p }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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