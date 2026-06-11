<script setup>
import { computed } from 'vue'
import { computeStandings, hasResult, matchKey, teamLogo } from '../lib/wc'
import { useData } from '../composables/useData'
import { useReveals } from '../composables/useReveals'

const { data } = useData()
const { groupRevealedKeys, revealGroup } = useReveals()

const groups = computed(() =>
  [...new Set(data.value.matches.filter((m) => m.group).map((m) => m.group))].sort()
)
const standings = (g) => computeStandings(data.value.matches, g)

// The gate re-locks when results exist that the last reveal didn't cover.
const playedKeys = (g) =>
  data.value.matches.filter((m) => m.group === g && hasResult(m)).map(matchKey)
const newCount = (g) => {
  const seen = groupRevealedKeys(g)
  if (seen === null) return null
  const seenSet = new Set(seen)
  return playedKeys(g).filter((k) => !seenSet.has(k)).length
}
const isOpen = (g) => newCount(g) === 0
const buttonLabel = (g) => {
  const n = newCount(g)
  if (n === null) return 'Reveal standings'
  return `${n} new result${n === 1 ? '' : 's'} — reveal updated standings`
}
</script>

<template>
  <section v-for="g in groups" :key="g" class="group-section">
    <h2>{{ g }}</h2>
    <button v-if="!isOpen(g)" class="reveal" @click="revealGroup(g, playedKeys(g))">
      {{ buttonLabel(g) }}
    </button>
    <table v-else class="standings">
      <thead>
        <tr>
          <th>Team</th>
          <th>P</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          <th>GF</th>
          <th>GA</th>
          <th>GD</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in standings(g)" :key="r.team">
          <td class="team-cell">
            <img v-if="teamLogo(r.team)" :src="teamLogo(r.team)" class="logo" alt="" />
            {{ r.team }}
          </td>
          <td>{{ r.p }}</td>
          <td>{{ r.w }}</td>
          <td>{{ r.d }}</td>
          <td>{{ r.l }}</td>
          <td>{{ r.gf }}</td>
          <td>{{ r.ga }}</td>
          <td>{{ r.gf - r.ga }}</td>
          <td class="pts">{{ r.pts }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
