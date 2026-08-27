<script setup>
import { computed, ref } from 'vue'
import ChartTooltip from './ChartTooltip.vue'

const props = defineProps({
  products: { type: Array, default: () => [] },
})
const emit = defineEmits(['select'])

const tooltip = ref(null)

function formatRupiah(value) {
  if (value >= 1e9) return `Rp${(value / 1e9).toFixed(1)}M`
  if (value >= 1e6) return `Rp${(value / 1e6).toFixed(0)}Jt`
  return `Rp${value.toLocaleString('id-ID')}`
}

const quadrants = computed(() => {
  const def = [
    { key: 'prioritas-utama', label: 'Prioritas Utama', sublabel: 'Andalan + Kategori A', hint: 'Stok selalu ada', color: 'bg-emerald-50 border-emerald-200', numColor: 'text-emerald-700', kondisi: 'Produk Andalan', abc: 'A' },
    { key: 'pantau-langka', label: 'Pantau Produk Langka', sublabel: 'Langka + Kategori A', hint: 'Mahal, jangan sampai kosong', color: 'bg-amber-50 border-amber-200', numColor: 'text-amber-700', kondisi: 'Produk Langka', abc: 'A' },
    { key: 'evaluasi-margin', label: 'Evaluasi Margin', sublabel: 'Harian + Kategori C', hint: 'Sering terjual, nilai kecil', color: 'bg-blue-50 border-blue-200', numColor: 'text-blue-700', kondisi: 'Produk Harian', abc: 'C' },
    { key: 'pertimbangkan-stop', label: 'Pertimbangkan Stop', sublabel: 'Langka + Kategori C', hint: 'Kontribusi sangat kecil', color: 'bg-red-50 border-red-200', numColor: 'text-red-700', kondisi: 'Produk Langka', abc: 'C' },
  ]
  return def.map((q) => {
    const items = props.products.filter((p) => p.kondisi_penjualan === q.kondisi && p.prioritas_abc === q.abc)
    const totalRevenue = items.reduce((s, p) => s + p.total_penjualan, 0)
    return { ...q, items, totalRevenue }
  })
})

function showTooltip(event, q) {
  tooltip.value = {
    x: event.clientX,
    y: event.clientY,
    title: q.label,
    lines: [`${q.items.length} produk`, `Total penjualan: ${formatRupiah(q.totalRevenue)}`, 'Klik untuk lihat daftar produk'],
  }
}
function moveTooltip(event) {
  if (tooltip.value) {
    tooltip.value.x = event.clientX
    tooltip.value.y = event.clientY
  }
}
function hideTooltip() {
  tooltip.value = null
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-3.5 relative h-full">
    <h3 class="text-[12.5px] font-bold text-gray-900 mb-0.5">Matrix Prioritas Keputusan</h3>
    <p class="text-[10.5px] text-gray-400 mb-3">Klik kuadran untuk melihat daftar produk</p>
    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="q in quadrants"
        :key="q.key"
        @click="emit('select', q)"
        @mouseenter="showTooltip($event, q)"
        @mousemove="moveTooltip"
        @mouseleave="hideTooltip"
        class="text-left border rounded-lg p-2.5 hover:shadow-md hover:-translate-y-px transition-all"
        :class="q.color"
      >
        <div class="text-xl font-extrabold" :class="q.numColor">{{ q.items.length }}</div>
        <div class="text-[11px] font-bold text-gray-700 mt-0.5">{{ q.label }}</div>
        <div class="text-[9.5px] text-gray-500 leading-tight mt-0.5">{{ q.sublabel }}<br />{{ q.hint }}</div>
      </button>
    </div>

    <ChartTooltip :tooltip="tooltip" />
  </div>
</template>
