<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useAnalysisStore } from '@/stores/analysis'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const uiStore = useUiStore()
const analysisStore = useAnalysisStore()
const router = useRouter()
const showMenu = ref(false)

const analysisDateLabel = computed(() => {
  const created = analysisStore.currentAnalysis?.created_at || analysisStore.latestAnalysisDate
  if (!created) return null
  return new Date(created).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
})

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between gap-4 px-4 sm:px-6 shrink-0">
    <button @click="uiStore.toggleSidebar()" class="lg:hidden text-gray-500 hover:text-gray-700 p-1.5 -ml-1.5">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <div class="flex-1"></div>

    <div class="flex items-center gap-2 sm:gap-4">
      <div
        v-if="analysisDateLabel"
        class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e2ede6] text-[#3d6b4f] text-[11.5px] font-semibold"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path stroke-linecap="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        Data per {{ analysisDateLabel }}
      </div>

      <div class="relative">
        <button @click="showMenu = !showMenu" class="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100">
          <div class="w-8 h-8 rounded-full bg-[#1e3a2a] text-white flex items-center justify-center text-xs font-semibold shrink-0">
            {{ authStore.user?.username?.slice(0, 2).toUpperCase() || '?' }}
          </div>
          <span class="hidden sm:inline text-sm text-gray-700 font-medium">
            {{ authStore.user?.username || 'Guest' }}
          </span>
          <svg class="hidden sm:block w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          v-if="showMenu"
          class="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10"
          @mouseleave="showMenu = false"
        >
          <button
            @click="handleLogout"
            class="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
