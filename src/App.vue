<script setup>
import { onMounted, ref, computed } from 'vue'
import { useData } from './composables/useData'
import { useDetail } from './composables/useDetail'
import ScheduleView from './components/ScheduleView.vue'
import StandingsView from './components/StandingsView.vue'
import BracketView from './components/BracketView.vue'
import MatchDetail from './components/MatchDetail.vue'
import TimezonePicker from './components/TimezonePicker.vue'

const { fetchedAt, status, refresh } = useData()
const { current } = useDetail()
const tab = ref('schedule')
const tabs = [
  { id: 'schedule', label: 'Schedule', view: ScheduleView },
  { id: 'standings', label: 'Standings', view: StandingsView },
  { id: 'bracket', label: 'Bracket', view: BracketView },
]
const view = computed(() => tabs.find((t) => t.id === tab.value).view)

const statusLine = computed(() => {
  const at = fetchedAt.value
    ? new Date(fetchedAt.value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null
  if (status.value === 'fetching') return 'Checking for results…'
  if (status.value === 'offline') return at ? `Offline — results as of ${at}` : 'Offline — schedule only'
  return at ? `Results updated ${at}` : ''
})

onMounted(() => {
  refresh()
  // Installed PWAs resume from background without remounting; "auto-fetch
  // on open" has to cover that path too.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh()
  })
})
</script>

<template>
  <header class="app">
    <h1>🐱⚽ Cat World Cup 2026</h1>
    <div class="status-row">
      <p class="status">{{ statusLine }}</p>
      <TimezonePicker />
    </div>
    <nav class="tabs">
      <button
        v-for="t in tabs"
        :key="t.id"
        :class="{ active: tab === t.id }"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </nav>
  </header>
  <main>
    <component :is="view" />
  </main>
  <MatchDetail v-if="current" :match="current" />
</template>
