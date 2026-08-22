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
        <h3 class="text-[13px] font-bold text-[#111]">{{ title }}</h3>
        <button @click="emit('close')" class="text-[#bbb] hover:text-[#666] transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p class="text-xs text-[#999] mb-4">{{ subtitle }}</p>

      <p class="text-[11px] font-semibold text-[#888] uppercase tracking-wide mb-2">Produk dalam kelompok ini</p>
      <div class="space-y-1">
        <div
          v-for="(item, i) in items"
          :key="item.nama_produk"
          class="flex items-center gap-3 py-2 border-b border-[#f3f4f3] last:border-0"
        >
          <span class="text-xs font-mono text-[#ccc] w-5">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="text-sm text-[#333]">{{ item.nama_produk }}</span>
        </div>
        <p v-if="items.length === 0" class="text-sm text-[#999] py-4 text-center">Tidak ada produk di kelompok ini.</p>
      </div>
    </div>
  </div>
</template>
