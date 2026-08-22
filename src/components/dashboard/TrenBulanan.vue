<script setup>
import { ref, computed, onMounted } from 'vue'
import ChartTooltip from './ChartTooltip.vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
})

// Animasi "gambar sendiri" pas chart pertama muncul, bukan langsung utuh
const revealed = ref(false)
onMounted(() => requestAnimationFrame(() => requestAnimationFrame(() => (revealed.value = true))))

const rangeOptions = [
  { key: '12', label: '1 Thn', n: 12 },
  { key: '6', label: '6 Bln', n: 6 },
  { key: '3', label: '3 Bln', n: 3 },
]
const activeRange = ref('12')

const visibleData = computed(() => {
  const n = rangeOptions.find((r) => r.key === activeRange.value)?.n || 12
  return props.data.slice(-n)
})

const W = 340
const H = 120
const PAD_LEFT = 34
const PAD_BOTTOM = 16
const PAD_TOP = 8

function formatRupiahShort(value) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}M`
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}Jt`
  return `${value.toLocaleString('id-ID')}`
}
function formatRupiahFull(value) {
  if (value >= 1e9) return `Rp${(value / 1e9).toFixed(2)} M`
  if (value >= 1e6) return `Rp${(value / 1e6).toFixed(1)} Jt`
  return `Rp${value.toLocaleString('id-ID')}`
}

const points = computed(() => {
  const arr = visibleData.value
  if (arr.length === 0) return []
  const max = Math.max(...arr.map((d) => d.total))
  const min = 0
  const usableW = W - PAD_LEFT - 6
  const usableH = H - PAD_TOP - PAD_BOTTOM
  return arr.map((d, i) => {
    const x = PAD_LEFT + (arr.length === 1 ? 0 : (i / (arr.length - 1)) * usableW)
    const y = PAD_TOP + usableH - ((d.total - min) / (max - min || 1)) * usableH
    return { ...d, x, y }
  })
})

const linePath = computed(() => {
  if (points.value.length === 0) return ''
  return points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
})
const areaPath = computed(() => {
  if (points.value.length === 0) return ''
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  return `${linePath.value} L${last.x.toFixed(1)},${H - PAD_BOTTOM} L${first.x.toFixed(1)},${H - PAD_BOTTOM} Z`
})

const yAxisLabels = computed(() => {
  if (visibleData.value.length === 0) return []
  const max = Math.max(...visibleData.value.map((d) => d.total))
  const steps = 4
  const usableH = H - PAD_TOP - PAD_BOTTOM
  return Array.from({ length: steps }, (_, i) => {
    const val = (max / steps) * (steps - i)
    const y = PAD_TOP + (usableH / steps) * i
    return { y, label: formatRupiahShort(val) }
  })
})

const xAxisLabels = computed(() => {
  const arr = points.value
  if (arr.length <= 7) return arr
  const step = Math.ceil(arr.length / 6)
  return arr.filter((_, i) => i % step === 0 || i === arr.length - 1)
})

const tooltip = ref(null)
const hoverX = ref(null)

function handleMouseMove(event) {
  const svg = event.currentTarget
  const rect = svg.getBoundingClientRect()
  const relX = ((event.clientX - rect.left) / rect.width) * W
  let nearest = points.value[0]
  let minDist = Infinity
  for (const p of points.value) {
    const dist = Math.abs(p.x - relX)
    if (dist < minDist) {
      minDist = dist
      nearest = p
    }
  }
  if (nearest) {
    hoverX.value = nearest.x
    tooltip.value = {
      x: event.clientX,
      y: event.clientY,
      title: nearest.label,
      lines: [{ label: 'Total penjualan', value: formatRupiahFull(nearest.total) }],
    }
  }
}
function handleMouseLeave() {
  hoverX.value = null
  tooltip.value = null
}
</script>

<template>
  <div class="bg-white rounded-[10px] border border-[#e8eae8] p-3.5">
    <div class="flex items-center justify-between mb-3">
      <div>
        <h3 class="text-[12.5px] font-bold text-[#111]">Tren Penjualan Bulanan</h3>
        <p class="text-[10.5px] text-[#999]">Arahkan kursor untuk lihat nilai per bulan</p>
      </div>
      <div class="flex gap-1 bg-[#f3f4f6] rounded-lg p-0.5">
        <button
          v-for="opt in rangeOptions"
          :key="opt.key"
          @click="activeRange = opt.key"
          class="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors"
          :class="activeRange === opt.key ? 'bg-[#1e3a2a] text-white' : 'text-[#888] hover:text-[#333]'"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div v-if="points.length === 0" class="text-center text-gray-300 py-10 text-sm">Belum ada data tren bulanan.</div>

    <svg
      v-else
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full cursor-crosshair"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <defs>
        <linearGradient id="trenGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e3a2a" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#1e3a2a" stop-opacity="0" />
        </linearGradient>
        <clipPath id="trenRevealClip">
          <rect x="0" y="0" :width="revealed ? W : 0" :height="H" style="transition: width 0.9s ease" />
        </clipPath>
      </defs>

      <line
        v-for="yl in yAxisLabels" :key="yl.y"
        :x1="PAD_LEFT" :y1="yl.y" :x2="W - 6" :y2="yl.y"
        stroke="#f0f0f0" stroke-width="1"
      />
      <text v-for="yl in yAxisLabels" :key="'t'+yl.y" :x="PAD_LEFT - 4" :y="yl.y + 3" text-anchor="end" font-size="7.5" fill="#9ca3af">
        {{ yl.label }}
      </text>

      <g clip-path="url(#trenRevealClip)">
        <path :d="areaPath" fill="url(#trenGradient)" />
        <path :d="linePath" fill="none" stroke="#1e3a2a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

        <line
          v-if="hoverX !== null"
          :x1="hoverX" :y1="PAD_TOP" :x2="hoverX" :y2="H - PAD_BOTTOM"
          stroke="#1e3a2a" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"
        />
        <circle
          v-for="p in points" :key="p.bulan"
          :cx="p.x" :cy="p.y"
          :r="hoverX === p.x ? 4 : 2"
          fill="#1e3a2a"
          :opacity="hoverX === null || hoverX === p.x ? 1 : 0"
          :stroke="hoverX === p.x ? '#fff' : 'none'"
          stroke-width="2"
        />
      </g>

      <text v-for="xl in xAxisLabels" :key="'x'+xl.bulan" :x="xl.x" :y="H - 3" text-anchor="middle" font-size="7.5" fill="#9ca3af">
        {{ xl.label.split(' ')[0] }}
      </text>
    </svg>

    <ChartTooltip :tooltip="tooltip" />
  </div>
</template>
