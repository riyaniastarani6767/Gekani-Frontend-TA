<script setup>
import { computed } from 'vue'

const props = defineProps({
  tooltip: { type: Object, default: null },
})

const style = computed(() => {
  if (!props.tooltip) return {}
  return {
    left: `${props.tooltip.x + 14}px`,
    top: `${props.tooltip.y - 10}px`,
    transform: 'translateY(-100%)',
  }
})
</script>

<template>
  <div
    v-if="tooltip"
    class="fixed z-50 pointer-events-none bg-gray-900 text-white rounded-lg shadow-xl px-3.5 py-3 min-w-[160px] max-w-[240px]"
    :style="style"
  >
    <div class="font-bold text-[12.5px] mb-1.5 pb-1.5 border-b border-white/15">{{ tooltip.title }}</div>
    <div class="space-y-1">
      <template v-for="(line, i) in tooltip.lines" :key="i">
        <div v-if="typeof line === 'object'" class="flex items-center justify-between gap-3 text-[11px]">
          <span class="text-gray-400">{{ line.label }}</span>
          <span class="font-semibold text-white">{{ line.value }}</span>
        </div>
        <div v-else class="text-[10.5px] text-gray-300">{{ line }}</div>
      </template>
    </div>
  </div>
</template>
