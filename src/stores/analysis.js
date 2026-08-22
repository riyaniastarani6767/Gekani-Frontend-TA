import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useAnalysisStore = defineStore('analysis', () => {
  const currentAnalysis = ref(null)
  const latestAnalysisDate = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const uploadedFile = ref(null)
  const selectedTahunAwal = ref(null)
  const selectedTahunAkhir = ref(null)
  const previewData = ref(null)

  async function uploadDataset(file) {
    isLoading.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      uploadedFile.value = response.data
      selectedTahunAwal.value = response.data.tahun_min
      selectedTahunAkhir.value = response.data.tahun_max
      return response.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Gagal mengunggah file.'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPreview() {
    if (!uploadedFile.value) return
    isLoading.value = true
    error.value = null
    try {
      const response = await api.post('/preview', {
        filepath: uploadedFile.value.filepath,
        tahun_awal: selectedTahunAwal.value,
        tahun_akhir: selectedTahunAkhir.value,
      })
      previewData.value = response.data
      return response.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Gagal memuat preview.'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function runAnalysis(userId) {
    if (!uploadedFile.value) return
    isLoading.value = true
    error.value = null
    try {
      const response = await api.post('/analyze', {
        filepath: uploadedFile.value.filepath,
        nama_file_asli: uploadedFile.value.nama_file_asli,
        tahun_awal: selectedTahunAwal.value,
        tahun_akhir: selectedTahunAkhir.value,
        user_id: userId,
      })
      currentAnalysis.value = response.data
      return response.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Analisis gagal dijalankan.'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDashboardSummary() {
    isLoading.value = true
    error.value = null
    try {
      const response = await api.get('/dashboard-summary')
      latestAnalysisDate.value = response.data.created_at
      return response.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Gagal memuat ringkasan dashboard.'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProducts(filters = {}) {
    isLoading.value = true
    error.value = null
    try {
      const response = await api.get('/products', { params: filters })
      return response.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Gagal memuat data produk.'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchHistory() {
    isLoading.value = true
    error.value = null
    try {
      const response = await api.get('/history')
      return response.data.history
    } catch (e) {
      error.value = e.response?.data?.error || 'Gagal memuat riwayat analisis.'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchHistoryDetail(analysisId) {
    isLoading.value = true
    error.value = null
    try {
      const response = await api.get(`/history/${analysisId}`)
      currentAnalysis.value = response.data
      return response.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Gagal memuat detail riwayat.'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function deleteHistory(analysisId) {
    isLoading.value = true
    error.value = null
    try {
      const response = await api.delete(`/history/${analysisId}`)
      return response.data
    } catch (e) {
      error.value = e.response?.data?.error || 'Gagal menghapus riwayat analisis.'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  function resetWizard() {
    uploadedFile.value = null
    selectedTahunAwal.value = null
    selectedTahunAkhir.value = null
    previewData.value = null
  }

  return {
    currentAnalysis,
    latestAnalysisDate,
    isLoading,
    error,
    uploadedFile,
    selectedTahunAwal,
    selectedTahunAkhir,
    previewData,
    uploadDataset,
    fetchPreview,
    runAnalysis,
    fetchDashboardSummary,
    fetchProducts,
    fetchHistory,
    fetchHistoryDetail,
    deleteHistory,
    resetWizard,
  }
})
