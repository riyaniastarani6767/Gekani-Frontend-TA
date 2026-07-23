<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAnalysisStore } from '@/stores/analysis'

const route = useRoute()
const analysisStore = useAnalysisStore()
const products = ref([])
const total = ref(0)
const loadError = ref(false)

const filterKondisi = ref('')
const filterPrioritas = ref('')
const searchQuery = ref(route.query.search || '')

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

function formatRupiah(value) {
  if (value >= 1e9) return `Rp${(value / 1e9).toFixed(1)} M`
  if (value >= 1e6) return `Rp${(value / 1e6).toFixed(1)} Jt`
  return `Rp${value.toLocaleString('id-ID')}`
}

async function loadProducts() {
  try {
    const filters = {}
    if (filterKondisi.value) filters.kondisi = filterKondisi.value
    if (filterPrioritas.value) filters.prioritas = filterPrioritas.value
    if (searchQuery.value) filters.search = searchQuery.value

    const data = await analysisStore.fetchProducts(filters)
    products.value = data.products
    total.value = data.total
  } catch {
    loadError.value = true
  }
}

let searchTimeout
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadProducts, 300)
})
watch([filterKondisi, filterPrioritas], loadProducts)

onMounted(loadProducts)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Data Produk</h1>
      <p class="text-sm text-gray-500 mt-1">Daftar seluruh produk beserta kondisi penjualan dan rekomendasi pengelolaan stok</p>
    </div>

    <div v-if="loadError" class="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
      Belum ada hasil analisis. Jalankan analisis baru terlebih dahulu.
    </div>

    <template v-else>
      <div class="flex flex-wrap gap-3 mb-4">
        <select v-model="filterKondisi" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Kondisi</option>
          <option v-for="k in kondisiList" :key="k" :value="k">{{ k }}</option>
        </select>
        <select v-model="filterPrioritas" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Prioritas</option>
          <option v-for="a in abcList" :key="a" :value="a">Kategori {{ a }}</option>
        </select>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama produk..."
          class="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <span class="text-sm text-gray-400 self-center">{{ total }} produk</span>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th class="text-left px-4 py-3 font-medium">Nama Produk</th>
              <th class="text-left px-4 py-3 font-medium">Kategori</th>
              <th class="text-left px-4 py-3 font-medium">Kondisi</th>
              <th class="text-left px-4 py-3 font-medium">Prioritas</th>
              <th class="text-right px-4 py-3 font-medium">Total Terjual</th>
              <th class="text-right px-4 py-3 font-medium">Total Penjualan</th>
              <th class="text-left px-4 py-3 font-medium">Rekomendasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="p in products" :key="p.nama_produk" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-800">{{ p.nama_produk }}</td>
              <td class="px-4 py-3 text-gray-500">{{ p.kategori }}</td>
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
            <tr v-if="products.length === 0">
              <td colspan="7" class="px-4 py-10 text-center text-gray-400">Tidak ada produk yang cocok dengan filter.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
