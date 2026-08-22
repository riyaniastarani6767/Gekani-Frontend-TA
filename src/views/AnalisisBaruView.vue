<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAnalysisStore } from '@/stores/analysis'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const analysisStore = useAnalysisStore()
const authStore = useAuthStore()

const step = ref(1)
const fileInput = ref(null)
const dragOver = ref(false)
const errorMsg = ref('')

const steps = [
  { n: 1, label: 'Upload Data' },
  { n: 2, label: 'Preview Data' },
  { n: 3, label: 'Analisis' },
]

const loadingMessage = ref('')
let loadingTimer = null
function startLoadingMessages(messages, intervalMs = 900) {
  let i = 0
  loadingMessage.value = messages[0]
  clearInterval(loadingTimer)
  loadingTimer = setInterval(() => {
    i = (i + 1) % messages.length
    loadingMessage.value = messages[i]
  }, intervalMs)
}
function stopLoadingMessages() {
  clearInterval(loadingTimer)
  loadingTimer = null
  loadingMessage.value = ''
}
onUnmounted(() => clearInterval(loadingTimer))

const isUploading = ref(false)

async function handleFile(file) {
  if (!file) return
  const validExt = /\.(csv|xlsx)$/i.test(file.name)
  if (!validExt) {
    errorMsg.value = 'Format file tidak didukung. Gunakan .csv atau .xlsx.'
    return
  }
  errorMsg.value = ''
  isUploading.value = true
  startLoadingMessages([
    'Membaca file...',
    'Memeriksa kolom data...',
    'Menghitung jumlah transaksi...',
    'Menyiapkan preview...',
  ])
  try {
    await analysisStore.uploadDataset(file)
    await analysisStore.fetchPreview()
    step.value = 2
  } catch (e) {
    errorMsg.value = analysisStore.error || 'Gagal mengunggah file.'
  } finally {
    isUploading.value = false
    stopLoadingMessages()
  }
}

function onDrop(e) {
  dragOver.value = false
  handleFile(e.dataTransfer.files[0])
}

function onFileSelect(e) {
  handleFile(e.target.files[0])
}

watch([() => analysisStore.selectedTahunAwal, () => analysisStore.selectedTahunAkhir], async () => {
  if (step.value === 2) {
    try {
      await analysisStore.fetchPreview()
    } catch {
      // error sudah ditangani di store
    }
  }
})

const isRunningAnalysis = ref(false)

async function handleRunAnalysis() {
  isRunningAnalysis.value = true
  errorMsg.value = ''
  startLoadingMessages([
    'Membersihkan & menyiapkan data...',
    'Menghitung fitur produk (frekuensi, kuantitas, musiman)...',
    'Mencari jumlah cluster optimal (Elbow & Silhouette)...',
    'Menjalankan K-Means Clustering...',
    'Menjalankan ABC Analysis...',
    'Menyusun rekomendasi tindak lanjut...',
  ], 1100)
  try {
    await analysisStore.runAnalysis(authStore.user?.id)
    step.value = 3
    setTimeout(() => {
      analysisStore.resetWizard()
      router.push({ name: 'hasil-analisis' })
    }, 1200)
  } catch (e) {
    errorMsg.value = analysisStore.error || 'Analisis gagal dijalankan.'
  } finally {
    isRunningAnalysis.value = false
    stopLoadingMessages()
  }
}

const tahunOptions = computed(() => {
  if (!analysisStore.uploadedFile) return []
  const { tahun_min, tahun_max } = analysisStore.uploadedFile
  const arr = []
  for (let y = tahun_min; y <= tahun_max; y++) arr.push(y)
  return arr
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-[19px] font-bold text-[#111] tracking-tight">Analisis Baru</h1>
      <p class="text-xs text-[#888] mt-0.5">Unggah data penjualan untuk memulai analisis clustering & ABC otomatis</p>
    </div>

    <!-- Step indicator -->
    <div data-tour="step-indicator-bar" class="bg-white rounded-[10px] border border-[#e8eae8] shadow-sm p-5 mb-5">
      <div class="flex items-center">
        <template v-for="(s, idx) in steps" :key="s.n">
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300"
              :class="[
                step > s.n ? 'bg-[#1e3a2a] text-white scale-100' : step === s.n ? 'bg-[#1e3a2a] text-white scale-110 ring-4 ring-[#e2ede6]' : 'bg-[#eef1ee] text-[#aaa]'
              ]"
            >
              <svg v-if="step > s.n" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
              <span v-else>{{ s.n }}</span>
            </div>
            <span class="text-[12.5px] font-semibold transition-colors duration-300" :class="step >= s.n ? 'text-[#111]' : 'text-[#aaa]'">{{ s.label }}</span>
          </div>
          <div v-if="idx < steps.length - 1" class="flex-1 h-[3px] mx-4 rounded-full bg-[#eef1ee] overflow-hidden">
            <div
              class="h-full bg-[#3d6b4f] rounded-full transition-all duration-500 ease-out"
              :style="{ width: step > s.n ? '100%' : '0%' }"
            ></div>
          </div>
        </template>
      </div>
    </div>

    <transition name="fade">
      <p v-if="errorMsg" class="mb-4 text-[12.5px] text-[#8a4a4a] bg-[#f0dede] border border-[#e6c9c9] rounded-lg px-4 py-2.5">
        {{ errorMsg }}
      </p>
    </transition>

    <!-- STEP 1: Upload -->
    <div v-if="step === 1" class="bg-white rounded-[10px] border border-[#e8eae8] shadow-sm p-6">
      <h2 class="text-sm font-bold text-[#111] mb-1">Langkah 1: Unggah Data Penjualan</h2>
      <p class="text-xs text-[#888] mb-4">Unggah file data penjualan (format Excel atau CSV).</p>

      <div
        data-tour="upload-area"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
        class="relative border-2 border-dashed rounded-xl py-16 flex flex-col items-center justify-center transition-all duration-200 overflow-hidden"
        :class="dragOver ? 'border-[#3d6b4f] bg-[#e2ede6] scale-[1.01]' : 'border-[#d8dbd8] hover:border-[#b8c4bb] hover:bg-[#fafcfa]'"
      >
        <transition name="fade">
          <div v-if="isUploading" class="absolute inset-0 bg-white/95 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
            <svg class="w-8 h-8 text-[#1e3a2a] animate-spin mb-3" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
              <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <transition name="fade" mode="out-in">
              <p :key="loadingMessage" class="text-[12.5px] font-medium text-[#555]">{{ loadingMessage }}</p>
            </transition>
          </div>
        </transition>

        <div
          class="w-14 h-14 rounded-xl bg-[#1e3a2a] flex items-center justify-center mb-4 transition-transform duration-300"
          :class="dragOver ? 'scale-110 -translate-y-1' : ''"
        >
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p class="text-[13px] font-semibold text-[#222] mb-1">
          {{ dragOver ? 'Lepaskan file di sini' : 'Drag & drop file di sini' }}
        </p>
        <p class="text-[11.5px] text-[#999] mb-4">atau klik tombol di bawah untuk memilih file</p>
        <button
          @click="fileInput.click()"
          :disabled="isUploading"
          class="bg-[#1e3a2a] hover:bg-[#2d5a3d] hover:shadow-md hover:-translate-y-0.5 text-white text-[12.5px] font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50 transition-all duration-200"
        >
          Pilih File
        </button>
        <input ref="fileInput" type="file" accept=".csv,.xlsx" class="hidden" @change="onFileSelect" />
        <p class="text-[11px] text-[#999] mt-4">Format file: CSV, XLSX &middot; Maksimal ukuran: 50MB</p>
      </div>
    </div>

    <!-- STEP 2: Preview -->
    <div v-if="step === 2 && analysisStore.uploadedFile" class="relative bg-white rounded-[10px] border border-[#e8eae8] shadow-sm p-6 overflow-hidden">
      <transition name="fade">
        <div v-if="isRunningAnalysis" class="absolute inset-0 bg-white/95 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
          <svg class="w-10 h-10 text-[#1e3a2a] animate-spin mb-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
            <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <transition name="fade" mode="out-in">
            <p :key="loadingMessage" class="text-[13px] font-semibold text-[#222] mb-1">{{ loadingMessage }}</p>
          </transition>
          <p class="text-[11px] text-[#999]">Mohon tunggu, proses ini menjalankan K-Means Clustering dan ABC Analysis secara otomatis</p>
        </div>
      </transition>

      <h2 class="text-sm font-bold text-[#111] mb-1">Langkah 2: Preview & Pilih Rentang Tahun</h2>
      <p class="text-xs text-[#888] mb-4">Verifikasi data dan tentukan periode yang ingin dianalisis.</p>

      <div class="bg-[#3d6b4f] rounded-lg px-4 py-3.5 mb-5 flex items-center justify-between gap-3">
        <div class="text-[12.5px] text-white/90 leading-relaxed">
          <strong class="font-semibold text-white">{{ analysisStore.uploadedFile.nama_file_asli }}</strong>
          &middot; {{ analysisStore.uploadedFile.total_rows.toLocaleString('id-ID') }} transaksi ditemukan
          &middot; Periode tersedia: {{ analysisStore.uploadedFile.tahun_min }}&ndash;{{ analysisStore.uploadedFile.tahun_max }}
        </div>
        <div class="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div class="flex flex-wrap items-end gap-4 mb-5">
        <div>
          <label class="block text-[11px] font-medium text-[#888] mb-1">Dari Tahun</label>
          <select v-model.number="analysisStore.selectedTahunAwal" class="border-[1.5px] border-[#e0e0e0] rounded-lg px-3 py-2 text-[12.5px] text-[#333] outline-none focus:border-[#2d6a4f] transition-colors">
            <option v-for="y in tahunOptions" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <span class="text-[#bbb] pb-2">&rarr;</span>
        <div>
          <label class="block text-[11px] font-medium text-[#888] mb-1">Sampai Tahun</label>
          <select v-model.number="analysisStore.selectedTahunAkhir" class="border-[1.5px] border-[#e0e0e0] rounded-lg px-3 py-2 text-[12.5px] text-[#333] outline-none focus:border-[#2d6a4f] transition-colors">
            <option v-for="y in tahunOptions" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <transition name="fade" mode="out-in">
          <div v-if="analysisStore.previewData" :key="analysisStore.previewData.jumlah_transaksi_dipilih" class="bg-[#3d6b4f] text-white text-[12.5px] font-semibold px-3.5 py-2.5 rounded-lg">
            {{ analysisStore.previewData.jumlah_transaksi_dipilih.toLocaleString('id-ID') }} transaksi akan dianalisis
          </div>
        </transition>
      </div>

      <div v-if="analysisStore.previewData" class="overflow-x-auto border border-[#e8eae8] rounded-[10px] mb-5">
        <table class="w-full text-[12px] border-collapse">
          <thead>
            <tr class="bg-[#f9fafb] border-b-[1.5px] border-[#e8eae8]">
              <th v-for="col in analysisStore.previewData.columns" :key="col" class="text-left px-3.5 py-2.5 text-[10.5px] font-semibold text-[#9ca3af] uppercase tracking-wide whitespace-nowrap">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in analysisStore.previewData.sample_rows"
              :key="i"
              class="border-b border-[#f3f4f3] last:border-b-0 hover:bg-[#f2f8f4] transition-colors row-fade-in"
              :style="{ animationDelay: `${Math.min(i, 10) * 25}ms` }"
            >
              <td v-for="col in analysisStore.previewData.columns" :key="col" class="px-3.5 py-2.5 whitespace-nowrap text-[#555]">
                {{ row[col] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end gap-2.5">
        <button
          @click="step = 1"
          class="px-4 py-2 rounded-lg border-[1.5px] border-[#e0e0e0] text-[12.5px] font-semibold text-[#555] hover:bg-gray-50 hover:border-[#ccc] transition-colors"
        >
          Kembali
        </button>
        <button
          @click="handleRunAnalysis"
          :disabled="isRunningAnalysis"
          class="px-5 py-2 rounded-lg bg-[#1e3a2a] hover:bg-[#2d5a3d] hover:shadow-md hover:-translate-y-0.5 text-white text-[12.5px] font-semibold disabled:opacity-60 disabled:hover:translate-y-0 transition-all duration-200"
        >
          {{ isRunningAnalysis ? 'Memproses...' : 'Mulai Analisis' }}
        </button>
      </div>
    </div>

    <!-- STEP 3: Sukses -->
    <div v-if="step === 3" class="bg-white rounded-[10px] border border-[#e8eae8] shadow-sm p-16 flex flex-col items-center justify-center text-center">
      <div class="w-14 h-14 rounded-full bg-[#3d6b4f] flex items-center justify-center mb-4 success-pop">
        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p class="text-[13px] font-semibold text-[#222]">Analisis berhasil! Mengarahkan ke halaman hasil...</p>
      <div class="flex gap-1 mt-3">
        <span class="w-1.5 h-1.5 rounded-full bg-[#3d6b4f] dot-bounce" style="animation-delay: 0ms"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-[#3d6b4f] dot-bounce" style="animation-delay: 150ms"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-[#3d6b4f] dot-bounce" style="animation-delay: 300ms"></span>
      </div>
    </div>
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

@keyframes successPop {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  60% {
    opacity: 1;
    transform: scale(1.08);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
.success-pop {
  animation: successPop 0.4s ease both;
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

@keyframes dotBounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-4px); opacity: 1; }
}
.dot-bounce {
  animation: dotBounce 1.2s ease-in-out infinite;
}
</style>
