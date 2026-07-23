<script setup>
defineProps({
  title: String,
  subtitle: String,
  items: { type: Array, default: () => [] },
})
const emit = defineEmits(['close'])
</script>

<template>
  <div class="fixed inset-0 z-30 flex justify-end" @click.self="emit('close')">
    <div class="absolute inset-0 bg-black/20"></div>
    <div class="relative w-80 bg-white h-full shadow-xl p-5 overflow-y-auto">
      <div class="flex items-start justify-between mb-1">
        <h3 class="font-semibold text-gray-900">{{ title }}</h3>
        <button @click="emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p class="text-xs text-gray-400 mb-4">{{ subtitle }}</p>

      <p class="text-xs font-medium text-gray-500 mb-2">PRODUK DALAM KELOMPOK INI</p>
      <div class="space-y-1">
        <div
          v-for="(item, i) in items"
          :key="item.nama_produk"
          class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
        >
          <span class="text-xs font-mono text-gray-300 w-5">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="text-sm text-gray-700">{{ item.nama_produk }}</span>
        </div>
        <p v-if="items.length === 0" class="text-sm text-gray-400 py-4 text-center">Tidak ada produk di kelompok ini.</p>
      </div>
    </div>
  </div>
</template>
