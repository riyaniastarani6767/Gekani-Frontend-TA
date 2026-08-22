<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAnalysisStore } from '@/stores/analysis'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const route = useRoute()
const analysisStore = useAnalysisStore()

// Filtered table data (server-side filters)
const products = ref([])
const total = ref(0)
const loadError = ref(false)

// Unfiltered snapshot, used only to compute the 4 summary cards so they
// stay constant while the table itself is being filtered/searched
const allProducts = ref([])

const filterKategori = ref('')
const filterKondisi = ref('')
const filterPrioritas = ref('')
const searchQuery = ref(route.query.search || '')
const currentPage = ref(1)
const PAGE_SIZE = 19

const kondisiList = ['Produk Laris', 'Produk Stabil', 'Produk Musiman', 'Jarang Terjual', 'Produk Grosir']
const abcList = ['A', 'B', 'C']

// ── Badge colors: one consistent 4-color family, desaturated, solid bg ──
// green = positif/prioritas · blue = stabil/netral · amber = musiman/pantau · merah-bata = perlu tindakan
// Produk Grosir reuses the blue family (darker shade) instead of introducing a 5th hue.
const badgeKondisi = {
  'Produk Laris': 'bg-[#e2ede6] text-[#3d6b4f]',
  'Produk Stabil': 'bg-[#e3e9f2] text-[#3d5a75]',
  'Produk Musiman': 'bg-[#f0e8d8] text-[#8a6d3b]',
  'Jarang Terjual': 'bg-[#f0dede] text-[#8a4a4a]',
  'Produk Grosir': 'bg-[#dde3ef] text-[#33507a]',
}
const badgePrioritas = {
  A: 'bg-[#e2ede6] text-[#3d6b4f]',
  B: 'bg-[#f0e8d8] text-[#8a6d3b]',
  C: 'bg-[#f0dede] text-[#8a4a4a]',
}
// Label singkat dipakai di badge tabel (biar nggak diulang ratusan kali);
// kepanjangannya cukup sekali di legenda atas tabel.
const prioritasShort = { A: 'A', B: 'B', C: 'C' }
const prioritasLabel = { A: 'Harus Selalu Ada', B: 'Perlu Dipantau', C: 'Kurangi Pembelian' }

// Rekomendasi badge is derived from keywords in the recommendation text
function badgeRekomendasi(text = '') {
  const t = text.toLowerCase()
  if (t.includes('tambah') || t.includes('promosi')) return 'bg-[#e2ede6] text-[#3d6b4f]'
  if (t.includes('pertahankan') || t.includes('cek harga')) return 'bg-[#e3e9f2] text-[#3d5a75]'
  if (t.includes('musim') || t.includes('gabungkan')) return 'bg-[#f0e8d8] text-[#8a6d3b]'
  if (t.includes('kurangi') || t.includes('evaluasi')) return 'bg-[#f0dede] text-[#8a4a4a]'
  return 'bg-gray-100 text-gray-600'
}

// Category badge: first letter of the category name, no emoji
function iconFor(kategori) {
  return kategori ? kategori.trim().charAt(0).toUpperCase() : '?'
}

function formatRupiah(value) {
  return `Rp${Math.round(value).toLocaleString('id-ID')}`
}

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
    // summary cards just stay at 0 if this fails; table error is handled separately
  }
}

let searchTimeout
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadProducts, 300)
})
watch([filterKategori, filterKondisi, filterPrioritas], loadProducts)

onMounted(() => {
  loadProducts()
  loadSummary()
})

// ── Summary card numbers, computed from the unfiltered snapshot ──
const kategoriList = computed(() => [...new Set(allProducts.value.map((p) => p.kategori))].sort())
const totalProduk = computed(() => allProducts.value.length)
const totalKategori = computed(() => kategoriList.value.length)
const prioritasACount = computed(() => allProducts.value.filter((p) => p.prioritas_abc === 'A').length)
const perluDievaluasiCount = computed(
  () => allProducts.value.filter((p) => p.prioritas_abc === 'C' || p.kondisi_penjualan === 'Jarang Terjual').length
)

// Count-up animation: angka di summary card naik halus ke nilai baru,
// bukan langsung ganti instan -- kesannya lebih hidup/interaktif.
function useCountUp(source) {
  const display = ref(0)
  watch(
    source,
    (val) => {
      const start = display.value
      const change = val - start
      if (change === 0) return
      const duration = 500
      const startTime = performance.now()
      function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1)
        display.value = Math.round(start + change * progress)
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    },
    { immediate: true }
  )
  return display
}
const totalProdukAnim = useCountUp(totalProduk)
const totalKategoriAnim = useCountUp(totalKategori)
const prioritasACountAnim = useCountUp(prioritasACount)
const perluDievaluasiCountAnim = useCountUp(perluDievaluasiCount)

// ── Client-side pagination over the already-fetched filtered list ──
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

// ── Export ──
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

  // Header
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 42) // #1e3a2a
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

  // Table
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

    <template v-else>
      <!-- Summary cards: warna solid bold, tanpa ikon -- konsisten sama halaman lain -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <div class="rounded-[10px] p-4 bg-[#33403a] text-white">
          <div class="text-[22px] font-extrabold leading-none">{{ totalProdukAnim }}</div>
          <div class="text-[12px] font-semibold mt-2">Total Produk</div>
          <div class="text-[10.5px] text-white/60 mt-0.5">Semua produk terdaftar</div>
        </div>
        <div class="rounded-[10px] p-4 bg-[#4f6c8a] text-white">
          <div class="text-[22px] font-extrabold leading-none">{{ totalKategoriAnim }}</div>
          <div class="text-[12px] font-semibold mt-2">Total Kategori</div>
          <div class="text-[10.5px] text-white/60 mt-0.5">Kelompok produk utama</div>
        </div>
        <div class="rounded-[10px] p-4 bg-[#3d6b4f] text-white">
          <div class="text-[22px] font-extrabold leading-none">{{ prioritasACountAnim }}</div>
          <div class="text-[12px] font-semibold mt-2">Produk Prioritas A</div>
          <div class="text-[10.5px] text-white/60 mt-0.5">Harus selalu tersedia</div>
        </div>
        <div class="rounded-[10px] p-4 bg-[#8a4a4a] text-white">
          <div class="text-[22px] font-extrabold leading-none">{{ perluDievaluasiCountAnim }}</div>
          <div class="text-[12px] font-semibold mt-2">Perlu Dievaluasi</div>
          <div class="text-[10.5px] text-white/60 mt-0.5">Pertimbangkan kurangi stok</div>
        </div>
      </div>

      <!-- Filter bar -->
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

        <div class="ml-auto flex gap-2">
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
      </div>

      <!-- Legenda -- dijelaskan sekali di sini, bukan diulang di tiap baris tabel -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2.5 text-[11px] text-[#888]">
        <span class="font-medium text-[#666]">Prioritas:</span>
        <span v-for="a in abcList" :key="a" class="inline-flex items-center gap-1.5">
          <span class="inline-flex items-center justify-center w-4 h-4 rounded text-[9.5px] font-bold" :class="badgePrioritas[a]">{{ a }}</span>
          {{ prioritasLabel[a] }}
        </span>
      </div>

      <!-- Table -->
      <div class="bg-white border border-[#e8eae8] rounded-[10px] overflow-hidden">
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
                  <span class="inline-flex items-center px-2.5 py-[3px] rounded-[5px] text-xs font-semibold whitespace-nowrap transition-transform hover:scale-105" :class="badgeKondisi[p.kondisi_penjualan]">
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

        <!-- Pagination -->
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
              →
            </button>
          </div>
        </div>
      </div>
    </template>
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
