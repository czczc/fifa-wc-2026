<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { matchKey, kickoff, dateKey, isLive } from '../lib/wc'
import { useData } from '../composables/useData'
import { useTimezone } from '../composables/useTimezone'
import MatchCard from './MatchCard.vue'

const { data } = useData()
const { tz } = useTimezone()
const group = ref('')
const team = ref('')

const groups = computed(() =>
  [...new Set(data.value.matches.filter((m) => m.group).map((m) => m.group))].sort()
)
const teams = computed(() =>
  [...new Set(data.value.matches.filter((m) => m.group).flatMap((m) => [m.team1, m.team2]))].sort()
)

const filtered = computed(() =>
  data.value.matches.filter(
    (m) =>
      (!group.value || m.group === group.value) &&
      (!team.value || m.team1 === team.value || m.team2 === team.value)
  )
)

// Matches are grouped by the date they fall on in the selected timezone,
// which can differ from the venue-local date.
const days = computed(() => {
  const map = new Map()
  for (const m of filtered.value) {
    const ko = kickoff(m)
    const key = ko ? dateKey(ko, tz.value) : m.date
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(m)
  }
  return [...map.entries()]
    .map(([key, matches]) => ({
      key,
      label: new Date(`${key}T12:00`).toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      matches: matches.sort((a, b) => (kickoff(a) || 0) - (kickoff(b) || 0)),
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
})

const todayKey = computed(() => dateKey(new Date(), tz.value))

// First match in the current view that hasn't kicked off yet — but while
// a match is live, the live card is the highlight, not the next one.
const nextKey = computed(() => {
  const now = new Date()
  if (filtered.value.some((m) => isLive(m, now))) return null
  const upcoming = filtered.value
    .filter((m) => kickoff(m) > now)
    .sort((a, b) => kickoff(a) - kickoff(b))[0]
  return upcoming ? matchKey(upcoming) : null
})

onMounted(async () => {
  await nextTick()
  const target = days.value.find((d) => d.key >= todayKey.value)
  if (target) document.getElementById(`day-${target.key}`)?.scrollIntoView()
})
</script>

<template>
  <div class="filters">
    <select v-model="group">
      <option value="">All groups</option>
      <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
    </select>
    <select v-model="team">
      <option value="">All teams</option>
      <option v-for="t in teams" :key="t" :value="t">{{ t }}</option>
    </select>
  </div>
  <section v-for="day in days" :key="day.key" :id="`day-${day.key}`" class="day">
    <h2 :class="{ today: day.key === todayKey }">
      <span v-if="day.key === todayKey" class="today-pill">Today</span>
      {{ day.label }}
    </h2>
    <MatchCard v-for="m in day.matches" :key="matchKey(m)" :match="m" :up-next="matchKey(m) === nextKey" />
  </section>
</template>
