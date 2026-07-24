<script setup>
import { ref, computed, onMounted } from 'vue'
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

const totalAnalisis = computed(() => history.value.length)
const berhasilCount = computed(() => history.value.filter((h) => h.status === 'Berhasil').length)
const gagalCount = computed(() => history.value.filter((h) => h.status !== 'Berhasil').length)
const terakhirLabel = computed(() => {
  if (history.value.length === 0) return '-'
  const latest = [...history.value].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  return latest?.created_at
    ? new Date(latest.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-'
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-[19px] font-bold text-[#111] tracking-tight">Riwayat Analisis</h1>
      <p class="text-xs text-[#888] mt-0.5">Daftar analisis yang pernah dijalankan sebelumnya</p>
    </div>

    <div v-if="loadError" class="bg-white rounded-xl border border-[#e8eae8] p-10 text-center text-gray-500">
      Gagal memuat riwayat analisis.
    </div>

    <template v-else>
      <!-- Summary strip -->
      <div class="bg-white border border-[#e8eae8] rounded-[10px] mb-5 flex flex-wrap divide-x divide-[#e8eae8]">
        <div class="flex-1 min-w-[140px] px-6 py-4">
          <div class="text-[24px] font-extrabold text-[#111] leading-none mb-1">{{ totalAnalisis }}</div>
          <div class="text-xs text-[#888]">Total Analisis</div>
        </div>
        <div class="flex-1 min-w-[140px] px-6 py-4">
          <div class="text-[24px] font-extrabold text-[#16a34a] leading-none mb-1">{{ berhasilCount }}</div>
          <div class="text-xs text-[#888]">Analisis Berhasil</div>
        </div>
        <div class="flex-1 min-w-[140px] px-6 py-4">
          <div class="text-[24px] font-extrabold text-[#dc2626] leading-none mb-1">{{ gagalCount }}</div>
          <div class="text-xs text-[#888]">Analisis Gagal</div>
        </div>
        <div class="flex-1 min-w-[140px] px-6 py-4">
          <div class="text-[24px] font-extrabold text-[#111] leading-none mb-1">{{ terakhirLabel }}</div>
          <div class="text-xs text-[#888]">Analisis Terakhir</div>
        </div>
      </div>

      <div data-tour="riwayat-table" class="bg-white border border-[#e8eae8] rounded-[10px] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-[#f9fafb] border-b-[1.5px] border-[#e8eae8]">
                <th class="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Tanggal Analisis</th>
                <th class="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Periode Data</th>
                <th class="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Nama File</th>
                <th class="text-right px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Jumlah Produk</th>
                <th class="text-left px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Status</th>
                <th class="text-right px-3.5 py-2.5 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in history" :key="item._id" class="border-b border-[#f3f4f3] last:border-b-0 hover:bg-[#fafbfa] transition-colors">
                <td class="px-3.5 py-3 text-[13px] text-[#333]">
                  {{ item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-' }}
                </td>
                <td class="px-3.5 py-3 text-[12.5px] text-[#555]">{{ item.periode_data }}</td>
                <td class="px-3.5 py-3 text-[12.5px] text-[#555]">{{ item.nama_file }}</td>
                <td class="px-3.5 py-3 text-[13px] text-[#333] text-right tabular-nums">{{ item.jumlah_produk ?? '-' }}</td>
                <td class="px-3.5 py-3">
                  <span
                    class="inline-flex items-center px-2.5 py-[3px] rounded-[5px] text-xs font-semibold"
                    :class="item.status === 'Berhasil' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fee2e2] text-[#dc2626]'"
                  >
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-3.5 py-3 text-right">
                  <button
                    v-if="item.status === 'Berhasil'"
                    @click="lihatHasil(item._id)"
                    class="text-[#1e3a2a] text-xs font-semibold hover:underline"
                  >
                    Lihat Hasil &rarr;
                  </button>
                </td>
              </tr>
              <tr v-if="history.length === 0">
                <td colspan="6" class="px-4 py-10 text-center text-gray-400 text-sm">Belum ada riwayat analisis.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
