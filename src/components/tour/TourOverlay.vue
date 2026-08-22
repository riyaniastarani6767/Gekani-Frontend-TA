<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTourStore } from '@/stores/tour'
import { useUiStore } from '@/stores/ui'

const tourStore = useTourStore()
const uiStore = useUiStore()
const router = useRouter()
const route = useRoute()

const targetRect = ref(null)
const tooltipStyle = ref({})
const MOBILE_BREAKPOINT = 1024 // matches Tailwind's `lg:` used by Sidebar.vue

function isMobileViewport() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function measureTarget() {
  const step = tourStore.currentStep
  if (!step) return
  const el = document.querySelector(`[data-tour="${step.target}"]`)
  if (!el) {
    targetRect.value = null
    return
  }
  const rect = el.getBoundingClientRect()
  targetRect.value = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
  computeTooltipPosition(step, rect)
}

function computeTooltipPosition(step, rect) {
  const isNarrowScreen = window.innerWidth < 640

  if (isNarrowScreen) {
    // Di HP: tooltip selalu jadi panel tetap di bawah layar, terpisah dari
    // posisi/tinggi kartu target -- supaya tidak pernah terpotong keluar layar
    // walau kartunya lebih tinggi dari layar HP.
    tooltipStyle.value = {
      position: 'fixed',
      top: 'auto',
      bottom: '16px',
      left: '16px',
      right: '16px',
      width: 'auto',
      maxHeight: '45vh',
      overflowY: 'auto',
    }
    return
  }

  const gap = 14
  const placement = step.placement || 'bottom'
  const tooltipWidth = 320
  let style = { width: `${tooltipWidth}px` }

  if (placement === 'bottom') {
    style.top = `${rect.bottom + gap}px`
    style.left = `${Math.max(16, Math.min(rect.left, window.innerWidth - tooltipWidth - 16))}px`
  } else if (placement === 'right') {
    style.top = `${Math.max(16, Math.min(rect.top, window.innerHeight - 220))}px`
    style.left = `${Math.min(rect.right + gap, window.innerWidth - tooltipWidth - 16)}px`
  } else if (placement === 'left') {
    style.top = `${Math.max(16, Math.min(rect.top, window.innerHeight - 220))}px`
    style.left = `${Math.max(16, rect.left - tooltipWidth - gap)}px`
  } else if (placement === 'top') {
    style.top = `${rect.top - gap}px`
    style.left = `${Math.max(16, Math.min(rect.left, window.innerWidth - tooltipWidth - 16))}px`
    style.transform = 'translateY(-100%)'
  }
  tooltipStyle.value = style
}

async function goToStep() {
  const step = tourStore.currentStep
  if (!step) return

  // Reset di awal transisi supaya tooltip lama tidak "nempel" sekejap di posisi salah
  targetRect.value = null

  if (route.name !== step.route) {
    try {
      await router.push({ name: step.route })
    } catch (err) {
      console.error('Tour navigation error:', err)
    }
    await nextTick()
    await new Promise((r) => setTimeout(r, 200))
  }

  // FIX RESPONSIF: step yang menyorot ikon sidebar (target diawali "nav-")
  // butuh drawer mobile dibuka dulu, karena di layar sempit sidebar
  // disembunyikan di luar layar (-translate-x-full) sampai user buka
  // manual lewat hamburger. Tanpa ini, highlight jadi meleset/tidak
  // muncul di HP karena elemennya secara teknis ada tapi off-screen.
  const targetsSidebar = step.target.startsWith('nav-')
  if (isMobileViewport()) {
    if (targetsSidebar) {
      if (!uiStore.sidebarOpen) uiStore.toggleSidebar()
    } else {
      uiStore.closeSidebar()
    }
    // beri waktu transisi drawer (duration-300 di Sidebar.vue) selesai
    await new Promise((r) => setTimeout(r, 320))
  }

  await nextTick()

  let el = null
  for (let attempt = 0; attempt < 15; attempt++) {
    el = document.querySelector(`[data-tour="${step.target}"]`)
    if (el) break
    await new Promise((r) => setTimeout(r, 100))
  }

  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    await new Promise((r) => setTimeout(r, 350))
  }

  measureTarget()
}

watch(() => tourStore.currentStepIndex, () => {
  if (tourStore.isActive) goToStep()
})
watch(() => tourStore.isActive, (val) => {
  if (val) goToStep()
})

function handleReposition() {
  if (tourStore.isActive) measureTarget()
}

// Tombol "Selanjutnya" -- kalau ini step terakhir, selesaikan tur,
// tutup drawer mobile kalau masih kebuka, dan antar user balik ke
// Dashboard sebagai "home base" penutup tur.
async function handleNext() {
  if (tourStore.isLastStep) {
    tourStore.finishTour()
    uiStore.closeSidebar()
    if (route.name !== 'dashboard') {
      await router.push({ name: 'dashboard' })
    }
  } else {
    tourStore.nextStep()
  }
}

function handleSkip() {
  tourStore.skipTour(true)
  uiStore.closeSidebar()
}

onMounted(() => {
  window.addEventListener('resize', handleReposition)
  window.addEventListener('scroll', handleReposition, true)
  if (tourStore.isActive) goToStep()
})
onUnmounted(() => {
  window.removeEventListener('resize', handleReposition)
  window.removeEventListener('scroll', handleReposition, true)
})
</script>

<template>
  <div v-if="tourStore.isActive" class="fixed inset-0 z-[60]">
    <transition name="tour-spotlight">
      <div
        v-if="targetRect"
        :key="tourStore.currentStepIndex"
        class="fixed rounded-lg pointer-events-none transition-all duration-300"
        :style="{
          top: `${targetRect.top - 6}px`,
          left: `${targetRect.left - 6}px`,
          width: `${targetRect.width + 12}px`,
          height: `${targetRect.height + 12}px`,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
          border: '2px solid #34d399',
        }"
      ></div>
    </transition>
    <div v-if="!targetRect" class="fixed inset-0 bg-black/65 transition-opacity duration-300"></div>

    <transition name="tour-tooltip" mode="out-in">
      <div
        v-if="targetRect"
        :key="tourStore.currentStepIndex"
        class="fixed z-[61] bg-white rounded-xl shadow-2xl p-5"
        :style="tooltipStyle"
      >
        <div class="text-[10px] font-semibold text-emerald-600 mb-1">
          Langkah {{ tourStore.currentStepIndex + 1 }} dari {{ tourStore.totalSteps }}
        </div>
        <h4 class="text-sm font-bold text-gray-900 mb-1.5">{{ tourStore.currentStep.title }}</h4>
        <p class="text-xs text-gray-600 leading-relaxed mb-4">{{ tourStore.currentStep.text }}</p>
        <div class="flex items-center justify-between">
          <button @click="handleSkip" class="text-xs text-gray-400 hover:text-gray-600 transition-colors">Lewati Tur</button>
          <div class="flex gap-2">
            <button
              v-if="tourStore.currentStepIndex > 0"
              @click="tourStore.prevStep()"
              class="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Kembali
            </button>
            <button
              @click="handleNext"
              class="px-3 py-1.5 rounded-lg bg-[#1b3829] hover:bg-[#2d5a3d] text-white text-xs font-semibold transition-colors active:scale-95"
            >
              {{ tourStore.isLastStep ? 'Selesai' : 'Selanjutnya' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.tour-tooltip-enter-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.tour-tooltip-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tour-tooltip-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}
.tour-tooltip-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

.tour-spotlight-enter-active {
  transition: opacity 0.25s ease;
}
.tour-spotlight-enter-from {
  opacity: 0;
}
</style>
