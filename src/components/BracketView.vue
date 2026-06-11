<script setup>
import { computed } from 'vue'
import { matchKey } from '../lib/wc'
import { useData } from '../composables/useData'
import MatchCard from './MatchCard.vue'

const { data } = useData()

const ROUND_ORDER = [
  'Round of 32',
  'Round of 16',
  'Quarter-final',
  'Semi-final',
  'Match for third place',
  'Final',
]

const rounds = computed(() =>
  ROUND_ORDER.map((name) => ({
    name,
    matches: data.value.matches.filter((m) => !m.group && m.round === name),
  })).filter((r) => r.matches.length)
)
</script>

<template>
  <div class="bracket">
    <div v-for="r in rounds" :key="r.name" class="round">
      <h3>{{ r.name }}</h3>
      <MatchCard v-for="m in r.matches" :key="matchKey(m)" :match="m" compact />
    </div>
  </div>
</template>
