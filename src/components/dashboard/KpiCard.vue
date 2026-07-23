<script setup>
defineProps({
  label: String,
  value: [String, Number],
  sublabel: String,
  sublabelType: { type: String, default: 'neutral' },
  color: { type: String, default: 'gray' },
  icon: { type: String, default: 'circle' },
})

const borderColor = {
  gray: 'border-l-gray-300',
  green: 'border-l-emerald-500',
  amber: 'border-l-amber-500',
  red: 'border-l-red-500',
  blue: 'border-l-blue-500',
}
const iconBg = {
  gray: 'bg-gray-100',
  green: 'bg-emerald-50',
  amber: 'bg-amber-50',
  red: 'bg-red-50',
  blue: 'bg-blue-50',
}
const iconColor = {
  gray: '#6b7280',
  green: '#16a34a',
  amber: '#d97706',
  red: '#dc2626',
  blue: '#2563eb',
}
const sublabelColor = {
  neutral: 'text-gray-400',
  up: 'text-emerald-600 font-medium',
  down: 'text-red-500 font-medium',
  warn: 'text-amber-600 font-medium',
}

const icons = {
  box: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
  check: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z',
  cart: 'M9 21a1 1 0 100-2 1 1 0 000 2zM20 21a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6',
  money: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
}
</script>

<template>
  <div class="bg-white rounded-[10px] border border-gray-200 p-3.5 flex-1 min-w-[150px] flex items-start gap-2.5 border-l-[3px]" :class="borderColor[color]">
    <div class="w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0" :class="iconBg[color]">
      <svg class="w-4 h-4" fill="none" :stroke="iconColor[color]" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" :d="icons[icon] || icons.box" />
      </svg>
    </div>
    <div class="flex-1 min-w-0">
      <div class="text-[22px] font-extrabold text-gray-900 leading-none">{{ value }}</div>
      <div class="text-[11.5px] font-semibold text-gray-800 mt-1">{{ label }}</div>
      <div v-if="sublabel" class="text-[10.5px] mt-0.5" :class="sublabelColor[sublabelType]">{{ sublabel }}</div>
    </div>
  </div>
</template>
