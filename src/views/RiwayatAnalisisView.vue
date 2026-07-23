<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAnalysisStore } from '@/stores/analysis'

const router = useRouter()
const analysisStore = useAnalysisStore()
const history = ref([])
const loadError = ref(false)

async function loadHistory() {
  try {
    history.value = await analysisStore.fetchHistory()
  } catch {
    loadError.value = true
  }
}

async function lihatHasil(id) {
  await analysisStore.fetchHistoryDetail(id)
  router.push({ name: 'hasil-analisis' })
}

onMounted(loadHistory)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Riwayat Analisis</h1>
      <p class="text-sm text-gray-500 mt-1">Daftar analisis yang pernah dijalankan sebelumnya</p>
    </div>

    <div v-if="loadError" class="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
      Gagal memuat riwayat analisis.
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-500 text-xs">
          <tr>
            <th class="text-left px-4 py-3 font-medium">Tanggal Analisis</th>
            <th class="text-left px-4 py-3 font-medium">Periode Data</th>
            <th class="text-left px-4 py-3 font-medium">Nama File</th>
            <th class="text-right px-4 py-3 font-medium">Jumlah Produk</th>
            <th class="text-left px-4 py-3 font-medium">Status</th>
            <th class="text-right px-4 py-3 font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="item in history" :key="item._id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-700">
              {{ item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-' }}
            </td>
            <td class="px-4 py-3 text-gray-600">{{ item.periode_data }}</td>
            <td class="px-4 py-3 text-gray-600">{{ item.nama_file }}</td>
            <td class="px-4 py-3 text-right text-gray-600">{{ item.jumlah_produk ?? '-' }}</td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="item.status === 'Berhasil' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
              >
                {{ item.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                v-if="item.status === 'Berhasil'"
                @click="lihatHasil(item._id)"
                class="text-emerald-700 text-xs font-medium hover:underline"
              >
                Lihat Hasil &rarr;
              </button>
            </td>
          </tr>
          <tr v-if="history.length === 0">
            <td colspan="6" class="px-4 py-10 text-center text-gray-400">Belum ada riwayat analisis.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
