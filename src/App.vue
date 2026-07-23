<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Sidebar from '@/components/layout/Sidebar.vue'
import Topbar from '@/components/layout/Topbar.vue'
import OnboardingModal from '@/components/tour/OnboardingModal.vue'
import TourOverlay from '@/components/tour/TourOverlay.vue'
import { useTourStore } from '@/stores/tour'

const route = useRoute()
const authStore = useAuthStore()
const tourStore = useTourStore()

const showLayout = computed(() => route.name !== 'login' && authStore.isLoggedIn)
</script>

<template>
  <div v-if="showLayout" class="flex h-screen bg-gray-50">
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <Topbar />
      <main class="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <router-view />
      </main>
    </div>

    <OnboardingModal v-if="tourStore.showWelcome" />
    <TourOverlay />
  </div>

  <div v-else class="min-h-screen">
    <router-view />
  </div>
</template>
