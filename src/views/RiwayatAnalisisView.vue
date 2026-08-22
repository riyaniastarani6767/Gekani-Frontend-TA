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

// ── Hapus riwayat: konfirmasi dulu sebelum benar-benar hapus dari DB ──
const deleteTarget = ref(null) // item yang mau dihapus, null = modal tertutup
const isDeleting = ref(false)
const deleteError = ref('')

function askDelete(item) {
  deleteTarget.value = item
  deleteError.value = ''
}
function cancelDelete() {
  if (isDeleting.value) return
  deleteTarget.value = null
}
async function confirmDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  deleteError.value = ''
  try {
    await analysisStore.deleteHistory(deleteTarget.value._id)
    history.value = history.value.filter((h) => h._id !== deleteTarget.value._id)
    deleteTarget.value = null
  } catch (e) {
    deleteError.value = 'Gagal menghapus analisis. Coba lagi.'
  } finally {
    isDeleting.value = false
  }
}
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
      <!-- Summary cards: warna solid bold, tanpa ikon -- konsisten sama Dashboard & Hasil Analisis -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <div class="rounded-[10px] p-4 bg-[#33403a] text-white">
          <div class="text-[22px] font-extrabold leading-none">{{ totalAnalisis }}</div>
          <div class="text-[12px] font-semibold mt-2">Total Analisis</div>
        </div>
        <div class="rounded-[10px] p-4 bg-[#3d6b4f] text-white">
          <div class="text-[22px] font-extrabold leading-none">{{ berhasilCount }}</div>
          <div class="text-[12px] font-semibold mt-2">Analisis Berhasil</div>
        </div>
        <div class="rounded-[10px] p-4 bg-[#8a4a4a] text-white">
          <div class="text-[22px] font-extrabold leading-none">{{ gagalCount }}</div>
          <div class="text-[12px] font-semibold mt-2">Analisis Gagal</div>
        </div>
        <div class="rounded-[10px] p-4 bg-[#4f6c8a] text-white">
          <div class="text-[18px] font-extrabold leading-none">{{ terakhirLabel }}</div>
          <div class="text-[12px] font-semibold mt-2">Analisis Terakhir</div>
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
              <tr
                v-for="(item, idx) in history"
                :key="item._id"
                class="border-b border-[#f3f4f3] last:border-b-0 hover:bg-[#fafbfa] transition-colors row-fade-in"
                :style="{ animationDelay: `${Math.min(idx, 12) * 30}ms` }"
              >
                <td class="px-3.5 py-3 text-[13px] text-[#333]">
                  {{ item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-' }}
                </td>
                <td class="px-3.5 py-3 text-[12.5px] text-[#555]">{{ item.periode_data }}</td>
                <td class="px-3.5 py-3 text-[12.5px] text-[#555]">{{ item.nama_file }}</td>
                <td class="px-3.5 py-3 text-[13px] text-[#333] text-right tabular-nums">{{ item.jumlah_produk ?? '-' }}</td>
                <td class="px-3.5 py-3">
                  <span
                    class="inline-flex items-center px-2.5 py-[3px] rounded-[5px] text-xs font-semibold transition-transform hover:scale-105"
                    :class="item.status === 'Berhasil' ? 'bg-[#e2ede6] text-[#3d6b4f]' : 'bg-[#f0dede] text-[#8a4a4a]'"
                  >
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-3.5 py-3 text-right">
                  <div class="flex items-center justify-end gap-3">
                    <button
                      v-if="item.status === 'Berhasil'"
                      @click="lihatHasil(item._id)"
                      class="text-[#1e3a2a] text-xs font-semibold hover:underline"
                    >
                      Lihat Hasil &rarr;
                    </button>
                    <button
                      @click="askDelete(item)"
                      class="text-[#a15252] text-xs font-semibold hover:underline"
                      title="Hapus riwayat ini"
                    >
                      Hapus
                    </button>
                  </div>
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

    <!-- Modal konfirmasi hapus -->
    <transition name="fade">
      <div v-if="deleteTarget" @click="cancelDelete" class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
        <div @click.stop class="bg-white rounded-[10px] shadow-2xl w-full max-w-sm p-5 modal-pop">
          <div class="w-10 h-10 rounded-full bg-[#f0dede] flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-[#8a4a4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 class="text-sm font-bold text-[#111] mb-1.5">Hapus riwayat analisis ini?</h3>
          <p class="text-[12.5px] text-[#666] leading-relaxed mb-1">
            <span class="font-medium">{{ deleteTarget.nama_file }}</span> ({{ deleteTarget.periode_data }}) akan dihapus permanen dari database. Tindakan ini tidak bisa dibatalkan.
          </p>
          <p v-if="deleteError" class="text-[12px] text-[#a15252] mt-2">{{ deleteError }}</p>
          <div class="flex justify-end gap-2.5 mt-5">
            <button
              @click="cancelDelete"
              :disabled="isDeleting"
              class="px-4 py-2 rounded-lg border-[1.5px] border-[#e0e0e0] text-[12.5px] font-semibold text-[#555] hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              @click="confirmDelete"
              :disabled="isDeleting"
              class="px-4 py-2 rounded-lg bg-[#a15252] hover:bg-[#8a4444] text-white text-[12.5px] font-semibold transition-colors disabled:opacity-60"
            >
              {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(6px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.modal-pop {
  animation: modalPop 0.2s ease both;
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
