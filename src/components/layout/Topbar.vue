<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const uiStore = useUiStore()
const router = useRouter()
const showMenu = ref(false)

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
      <button class="relative w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center shrink-0">
        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>

      <div class="relative">
        <button @click="showMenu = !showMenu" class="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100">
          <div class="w-8 h-8 rounded-full bg-[#1b3829] text-white flex items-center justify-center text-xs font-semibold shrink-0">
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
