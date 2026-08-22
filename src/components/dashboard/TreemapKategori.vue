<script setup>
import { computed, ref } from 'vue'
import ChartTooltip from './ChartTooltip.vue'

const props = defineProps({
  products: { type: Array, default: () => [] },
})
const emit = defineEmits(['select'])

const tooltip = ref(null)

// Palet: turunan dari 4 keluarga warna yang sama dipakai di seluruh app
// (green/blue/amber/merah-bata), tanpa warna cerah/saturasi tinggi.
const PALETTE = ['#3d6b4f', '#5c8a70', '#4f6c8a', '#8a6d3b', '#33507a', '#a15252', '#3d5a75']

function formatRupiah(value) {
  if (value >= 1e9) return `Rp${(value / 1e9).toFixed(1)}M`
  if (value >= 1e6) return `Rp${(value / 1e6).toFixed(0)}Jt`
  return `Rp${value.toLocaleString('id-ID')}`
}

const kategoriData = computed(() => {
  const map = {}
  for (const p of props.products) {
    map[p.kategori] = (map[p.kategori] || 0) + p.total_penjualan
  }
  const total = Object.values(map).reduce((a, b) => a + b, 0)
  const arr = Object.entries(map)
    .map(([kategori, revenue]) => ({
      kategori,
      revenue,
      pct: total > 0 ? (revenue / total) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 7)

  return arr.map((item, i) => {
    const produkDiKategori = props.products.filter((p) => p.kategori === item.kategori)
    const countAbc = { A: 0, B: 0, C: 0 }
    for (const p of produkDiKategori) countAbc[p.prioritas_abc]++
    const dominan = Object.entries(countAbc).sort((a, b) => b[1] - a[1])[0][0]
    return { ...item, dominanAbc: dominan, jumlahProduk: produkDiKategori.length, countAbc, warna: PALETTE[i % PALETTE.length] }
  })
})

function sizeClass(pct) {
  if (pct > 18) return 'col-span-2 row-span-2'
  if (pct > 9) return 'col-span-2'
  return 'col-span-1'
}

function showTooltip(event, item) {
  tooltip.value = {
    x: event.clientX,
    y: event.clientY,
    title: item.kategori,
    lines: [
      { label: 'Pendapatan', value: formatRupiah(item.revenue) },
      { label: 'Kontribusi', value: `${item.pct.toFixed(1)}% dari total` },
      { label: 'Jumlah produk', value: `${item.jumlahProduk} produk` },
      { label: 'Kategori A/B/C', value: `${item.countAbc.A} / ${item.countAbc.B} / ${item.countAbc.C}` },
    ],
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
  <div class="bg-white rounded-[10px] border border-[#e8eae8] p-3.5 relative">
    <h3 class="text-[12.5px] font-bold text-[#111] mb-0.5">Treemap Kontribusi Pendapatan per Kategori</h3>
    <p class="text-[10.5px] text-[#999] mb-3">Ukuran kotak = proporsi pendapatan. Arahkan kursor untuk detail.</p>
    <div class="grid grid-cols-4 gap-1.5 auto-rows-[68px]">
      <div
        v-for="item in kategoriData"
        :key="item.kategori"
        class="rounded-lg p-2.5 flex flex-col justify-between overflow-hidden cursor-pointer text-white transition-transform hover:scale-[1.02]"
        :class="sizeClass(item.pct)"
        :style="{ backgroundColor: item.warna }"
        @mouseenter="showTooltip($event, item)"
        @mousemove="moveTooltip"
        @mouseleave="hideTooltip"
        @click="emit('select', item.kategori)"
      >
        <span class="text-[9.5px] font-medium rounded px-1.5 py-0.5 w-fit bg-white/20">Kat {{ item.dominanAbc }}</span>
        <div>
          <div class="text-[11px] font-semibold truncate">{{ item.kategori }}</div>
          <div class="text-[13px] font-bold">{{ formatRupiah(item.revenue) }}</div>
          <div class="text-[9.5px] opacity-80">{{ item.pct.toFixed(1) }}%</div>
        </div>
      </div>
    </div>

    <ChartTooltip :tooltip="tooltip" />
  </div>
</template>
