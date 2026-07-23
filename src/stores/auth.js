import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

function loadUserFromStorage() {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(loadUserFromStorage())

  const isLoggedIn = computed(() => user.value !== null)

  async function login(username, password) {
    const response = await api.post('/auth/login', { username, password })
    user.value = response.data.user
    localStorage.setItem('user', JSON.stringify(user.value))
    return response.data
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      user.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('onboarding_tour_completed')
    }
  }

  return { user, isLoggedIn, login, logout }
})
