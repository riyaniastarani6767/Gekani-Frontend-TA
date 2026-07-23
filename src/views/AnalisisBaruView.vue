<script setup>
import { ref, computed, watch } from 'vue'
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

async function handleFile(file) {
  if (!file) return
  const validExt = /\.(csv|xlsx)$/i.test(file.name)
  if (!validExt) {
    errorMsg.value = 'Format file tidak didukung. Gunakan .csv atau .xlsx.'
    return
  }
  errorMsg.value = ''
  try {
    await analysisStore.uploadDataset(file)
    await analysisStore.fetchPreview()
    step.value = 2
  } catch (e) {
    errorMsg.value = analysisStore.error || 'Gagal mengunggah file.'
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
      <h1 class="text-2xl font-bold text-gray-900">Analisis Baru</h1>
      <p class="text-sm text-gray-500 mt-1">Unggah data penjualan untuk memulai analisis clustering &amp; ABC otomatis</p>
    </div>

    <div data-tour="step-indicator-bar" class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div class="flex items-center">
        <template v-for="(s, idx) in steps" :key="s.n">
          <div class="flex items-center gap-2">
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              :class="step >= s.n ? 'bg-[#1b3829] text-white' : 'bg-gray-100 text-gray-400'"
            >
              <svg v-if="step > s.n" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
              <span v-else>{{ s.n }}</span>
            </div>
            <span class="text-sm font-medium" :class="step >= s.n ? 'text-gray-900' : 'text-gray-400'">{{ s.label }}</span>
          </div>
          <div v-if="idx < steps.length - 1" class="flex-1 h-px bg-gray-200 mx-4"></div>
        </template>
      </div>
    </div>

    <p v-if="errorMsg" class="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
      {{ errorMsg }}
    </p>

    <div v-if="step === 1" class="bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="font-semibold text-gray-900 mb-1">Langkah 1 — Unggah Data Penjualan</h2>
      <p class="text-sm text-gray-500 mb-4">Unggah file data penjualan (format Excel atau CSV).</p>

      <div
        data-tour="upload-area"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
        class="border-2 border-dashed rounded-xl py-16 flex flex-col items-center justify-center transition-colors"
        :class="dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'"
      >
        <svg class="w-10 h-10 text-emerald-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="text-sm font-medium text-gray-700 mb-3">Drag &amp; drop file di sini atau klik untuk memilih file</p>
        <button
          @click="fileInput.click()"
          class="bg-[#0d2818] hover:bg-[#123320] text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          Pilih File
        </button>
        <input ref="fileInput" type="file" accept=".csv,.xlsx" class="hidden" @change="onFileSelect" />
        <p class="text-xs text-gray-400 mt-3">Format file: CSV, XLSX | Maksimal ukuran: 50MB</p>
      </div>
    </div>

    <div v-if="step === 2 && analysisStore.uploadedFile" class="bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="font-semibold text-gray-900 mb-1">Langkah 2 — Preview &amp; Pilih Rentang Tahun</h2>
      <p class="text-sm text-gray-500 mb-4">Verifikasi data dan tentukan periode yang ingin dianalisis.</p>

      <div class="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 mb-5 flex items-center justify-between">
        <div class="text-sm text-emerald-800">
          <strong>{{ analysisStore.uploadedFile.nama_file_asli }}</strong>
          &middot; {{ analysisStore.uploadedFile.total_rows.toLocaleString('id-ID') }} transaksi ditemukan
          &middot; Periode tersedia: {{ analysisStore.uploadedFile.tahun_min }}–{{ analysisStore.uploadedFile.tahun_max }}
        </div>
        <svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div class="flex items-end gap-4 mb-5">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Dari Tahun</label>
          <select v-model.number="analysisStore.selectedTahunAwal" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option v-for="y in tahunOptions" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <span class="text-gray-400 pb-2">&rarr;</span>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Sampai Tahun</label>
          <select v-model.number="analysisStore.selectedTahunAkhir" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option v-for="y in tahunOptions" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div v-if="analysisStore.previewData" class="bg-emerald-50 text-emerald-700 text-sm font-medium px-3 py-2 rounded-lg">
          {{ analysisStore.previewData.jumlah_transaksi_dipilih.toLocaleString('id-ID') }} transaksi akan dianalisis
        </div>
      </div>

      <div v-if="analysisStore.previewData" class="overflow-x-auto border border-gray-200 rounded-lg mb-5">
        <table class="w-full text-xs">
          <thead class="bg-gray-50 text-gray-500">
            <tr>
              <th v-for="col in analysisStore.previewData.columns" :key="col" class="text-left px-3 py-2 font-medium whitespace-nowrap">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="(row, i) in analysisStore.previewData.sample_rows" :key="i">
              <td v-for="col in analysisStore.previewData.columns" :key="col" class="px-3 py-2 whitespace-nowrap text-gray-700">
                {{ row[col] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end gap-3">
        <button
          @click="step = 1"
          class="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Kembali
        </button>
        <button
          @click="handleRunAnalysis"
          :disabled="isRunningAnalysis"
          class="px-4 py-2 rounded-lg bg-[#0d2818] hover:bg-[#123320] text-white text-sm font-medium disabled:opacity-60"
        >
          {{ isRunningAnalysis ? 'Menjalankan Analisis...' : 'Mulai Analisis' }}
        </button>
      </div>
    </div>

    <div v-if="step === 3" class="bg-white rounded-xl border border-gray-200 p-16 flex flex-col items-center justify-center text-center">
      <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
        <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p class="font-medium text-gray-800">Analisis berhasil! Mengarahkan ke halaman hasil...</p>
    </div>
  </div>
</template>
