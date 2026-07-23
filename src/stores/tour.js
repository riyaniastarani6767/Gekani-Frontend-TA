import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'onboarding_tour_completed'

export const TOUR_STEPS = [
  {
    route: 'dashboard',
    target: 'kpi-cards',
    title: 'Ringkasan Cepat',
    text: 'Di sini Anda bisa langsung lihat jumlah produk, berapa yang harus selalu ada, perlu dipantau, dan sebaiknya dikurangi.',
    placement: 'bottom',
  },
  {
    route: 'dashboard',
    target: 'panduan-keputusan',
    title: 'Panduan Keputusan Persediaan',
    text: 'Klik salah satu kartu di sini untuk melihat daftar produk sesuai kategorinya. Ini panduan tercepat untuk keputusan stok.',
    placement: 'bottom',
  },
  {
    route: 'dashboard',
    target: 'insight-segmentasi',
    title: 'Insight Segmentasi',
    text: 'Ringkasan otomatis dalam bentuk kalimat, menjelaskan temuan penting dari hasil analisis tanpa perlu membaca data mentah.',
    placement: 'bottom',
  },
  {
    route: 'dashboard',
    target: 'komposisi-segmentasi',
    title: 'Komposisi Segmentasi Produk',
    text: 'Grafik batang ini menunjukkan sebaran produk berdasarkan prioritas (ABC) dan kondisi penjualan. Klik salah satu batang untuk memfilter tabel produk di bawah.',
    placement: 'right',
  },
  {
    route: 'dashboard',
    target: 'matrix-prioritas',
    title: 'Matrix Prioritas Keputusan',
    text: 'Kombinasi kondisi penjualan dan kategori ABC dirangkum jadi 4 kuadran keputusan. Klik salah satu untuk lihat daftar produknya.',
    placement: 'left',
  },
  {
    route: 'dashboard',
    target: 'treemap',
    title: 'Treemap Kontribusi Pendapatan',
    text: 'Ukuran kotak menunjukkan besar kontribusi pendapatan tiap kategori produk. Semakin besar kotaknya, semakin besar kontribusinya.',
    placement: 'right',
  },
  {
    route: 'dashboard',
    target: 'ringkasan-rekomendasi',
    title: 'Ringkasan Rekomendasi Tindak Lanjut',
    text: 'Aksi yang paling sering direkomendasikan sistem untuk seluruh produk, diurutkan dari yang paling banyak.',
    placement: 'right',
  },
  {
    route: 'dashboard',
    target: 'kategori-produk-terbanyak',
    title: 'Kategori dengan Produk Terbanyak',
    text: 'Menunjukkan kategori mana yang memiliki varian produk paling banyak, dilihat dari jumlah produk bukan pendapatan.',
    placement: 'right',
  },
  {
    route: 'dashboard',
    target: 'tren-bulanan',
    title: 'Tren Penjualan Bulanan',
    text: 'Grafik garis ini menunjukkan naik-turunnya total penjualan tiap bulan. Arahkan kursor ke titik mana pun untuk lihat nilai persisnya.',
    placement: 'left',
  },
  {
    route: 'dashboard',
    target: 'proporsi-kondisi',
    title: 'Proporsi Kondisi Produk',
    text: 'Diagram donat ini menunjukkan persentase produk di tiap kondisi penjualan (Laris, Stabil, Musiman, dst).',
    placement: 'left',
  },
  {
    route: 'dashboard',
    target: 'top-5-produk',
    title: 'Top 5 Produk Terlaris',
    text: '5 produk dengan total penjualan tertinggi. Klik salah satu untuk melihat detail lengkapnya.',
    placement: 'left',
  },
  {
    route: 'dashboard',
    target: 'daftar-produk-table',
    title: 'Daftar Produk',
    text: 'Tabel ini otomatis berubah mengikuti filter yang Anda klik di atas. Gunakan untuk melihat detail produk satu per satu.',
    placement: 'top',
  },
  {
    route: 'dashboard',
    target: 'nav-analisis-baru',
    title: 'Analisis Baru',
    text: 'Kalau Anda punya data penjualan baru, mulai dari sini untuk mengunggah dan menganalisisnya.',
    placement: 'right',
  },
  {
    route: 'analisis-baru',
    target: 'upload-area',
    title: 'Unggah Data Penjualan',
    text: 'Unggah file CSV atau Excel di sini. Sistem akan otomatis membaca data dan memandu Anda ke langkah berikutnya.',
    placement: 'bottom',
  },
  {
    route: 'analisis-baru',
    target: 'step-indicator-bar',
    title: 'Alur 3 Langkah',
    text: 'Setelah data terunggah, Anda akan diminta memilih rentang tanggal periode yang ingin dianalisis, lalu klik "Mulai Analisis" untuk menjalankan proses K-Means Clustering dan ABC Analysis secara otomatis.',
    placement: 'bottom',
  },
  {
    route: 'analisis-baru',
    target: 'nav-data-produk',
    title: 'Data Produk',
    text: 'Semua produk beserta rekomendasi pengelolaan stoknya bisa dicari dan difilter di halaman ini.',
    placement: 'right',
  },
  {
    route: 'analisis-baru',
    target: 'nav-riwayat-analisis',
    title: 'Riwayat Analisis',
    text: 'Setiap analisis yang pernah Anda jalankan tersimpan di sini, bisa dibuka kembali kapan saja. Selamat menggunakan sistem!',
    placement: 'right',
  },
]

export const useTourStore = defineStore('tour', () => {
  const isActive = ref(false)
  const showWelcome = ref(false)
  const currentStepIndex = ref(0)

  function hasCompletedTour() {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  }
  const currentStep = computed(() => TOUR_STEPS[currentStepIndex.value] || null)
  const totalSteps = TOUR_STEPS.length
  const isLastStep = computed(() => currentStepIndex.value === totalSteps - 1)

  function maybeShowWelcome() {
    if (!hasCompletedTour()) {
      showWelcome.value = true
    }
  }

  function startTour() {
    showWelcome.value = false
    isActive.value = true
    currentStepIndex.value = 0
  }

  function skipTour(dontShowAgain = true) {
    showWelcome.value = false
    isActive.value = false
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
  }

  function nextStep() {
    if (isLastStep.value) {
      finishTour()
    } else {
      currentStepIndex.value++
    }
  }

  function prevStep() {
    if (currentStepIndex.value > 0) currentStepIndex.value--
  }

  function finishTour() {
    isActive.value = false
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  return {
    isActive,
    showWelcome,
    currentStepIndex,
    currentStep,
    totalSteps,
    isLastStep,
    hasCompletedTour,
    maybeShowWelcome,
    startTour,
    skipTour,
    nextStep,
    prevStep,
    finishTour,
  }
})
