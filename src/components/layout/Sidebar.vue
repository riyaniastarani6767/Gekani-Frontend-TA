<script setup>
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const uiStore = useUiStore()
const router = useRouter()

const navItems = [
  { name: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'analisis-baru', label: 'Analisis Baru', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'riwayat-analisis', label: 'Riwayat Analisis', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'data-produk', label: 'Data Produk', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
]

async function handleLogout() {
  uiStore.closeSidebar()
  await authStore.logout()
  router.push({ name: 'login' })
}

function handleNavClick() {
  uiStore.closeSidebar()
}
</script>

<template>
  <div
    v-if="uiStore.sidebarOpen"
    @click="uiStore.closeSidebar()"
    class="fixed inset-0 bg-black/40 z-40 lg:hidden"
  ></div>

  <aside
    class="w-[188px] bg-[#1b3829] text-white flex flex-col shrink-0 fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0"
    :class="uiStore.sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex items-center gap-2.5 px-3.5 py-4 border-b border-white/[0.08]">
      <div class="w-7 h-7 rounded-md bg-[#2d6a4f] flex items-center justify-center shrink-0">
        <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 2L4.09 12.11a1 1 0 00.77 1.64H11l-1 8.25L19.91 11.89A1 1 0 0019.14 10.25H13L14 2z" />
        </svg>
      </div>
      <div class="text-[10px] font-bold leading-[1.4] tracking-wide">YUDI MOTOR<br />ANALYTICS</div>
      <button @click="uiStore.closeSidebar()" class="ml-auto lg:hidden text-white/50 hover:text-white">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <nav class="flex-1 p-2 flex flex-col gap-px">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        :data-tour="`nav-${item.name}`"
        @click="handleNavClick"
        class="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12.5px] font-medium transition-colors relative"
        :class="$route.name === item.name
          ? 'bg-white/10 text-white'
          : 'text-white/50 hover:bg-white/[0.07] hover:text-white/85'"
      >
        <span
          v-if="$route.name === item.name"
          class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-emerald-400 rounded-r"
        ></span>
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
        </svg>
        {{ item.label }}
      </router-link>
    </nav>

    <div class="p-2 pt-2 border-t border-white/[0.08]">
      <button
        @click="handleLogout"
        class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12.5px] font-medium text-white/40 hover:bg-white/[0.07] hover:text-white/85 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        Logout
      </button>
    </div>
  </aside>
</template>
