<script setup>
import { computed } from 'vue'
import {
  matchKey,
  kickoff,
  teamLabel,
  teamLogo,
  isPlaceholder,
  hasResult,
  isLive,
  scoreLine,
  winner,
  goalsText,
} from '../lib/wc'
import { useReveals } from '../composables/useReveals'
import { useDetail } from '../composables/useDetail'
import { useTimezone } from '../composables/useTimezone'

const props = defineProps({
  match: { type: Object, required: true },
})

const { close } = useDetail()
const { isRevealed, reveal } = useReveals()
const { tz } = useTimezone()

const id = computed(() => matchKey(props.match))
const ko = computed(() => kickoff(props.match))
const played = computed(() => hasResult(props.match))
const started = computed(() => ko.value && ko.value < new Date())
const inPlay = computed(() => isLive(props.match))
const revealed = computed(() => isRevealed(id.value))
const win = computed(() => winner(props.match))
const goals1 = computed(() => goalsText(props.match.goals1))
const goals2 = computed(() => goalsText(props.match.goals2))
const liveGoals1 = computed(() => goalsText(props.match.live?.goals1))
const liveGoals2 = computed(() => goalsText(props.match.live?.goals2))

const stage = computed(() =>
  props.match.group ? `${props.match.group} · ${props.match.round}` : props.match.round
)
const when = computed(() =>
  ko.value
    ? ko.value.toLocaleString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: tz.value,
        timeZoneName: 'short',
      })
    : `${props.match.date} ${props.match.time}`
)
const ht = computed(() => {
  const h = props.match.score?.ht
  return h ? `HT ${h[0]}–${h[1]}` : null
})

const query = computed(() =>
  encodeURIComponent(
    `${teamLabel(props.match.team1)} vs ${teamLabel(props.match.team2)} World Cup 2026 ${props.match.date}`
  )
)
const reportUrl = computed(() => `https://www.google.com/search?q=${query.value}%20match%20report`)
// FOX Sports' World Cup highlights playlist — every title is the spoiler-free
// "X vs Y Highlights" format, unlike YouTube search results which surface
// FIFA's score-in-title uploads.
const highlightsUrl =
  'https://www.youtube.com/playlist?list=PLSoN6Th-EepMUaxmTobuR_SBwVkdkxdfO'
</script>

<template>
  <div class="detail">
    <div class="detail-inner">
      <button class="back" @click="close">← Back</button>
      <p class="stage">{{ stage }}</p>
      <p class="when">{{ when }}</p>
      <p class="when">{{ match.ground }}</p>
      <div class="versus">
        <div class="side" :class="{ winner: revealed && win === 1 }">
          <img v-if="teamLogo(match.team1)" :src="teamLogo(match.team1)" alt="" />
          <span :class="{ placeholder: isPlaceholder(match.team1) }">{{ teamLabel(match.team1) }}</span>
        </div>
        <span class="vs">vs</span>
        <div class="side" :class="{ winner: revealed && win === 2 }">
          <img v-if="teamLogo(match.team2)" :src="teamLogo(match.team2)" alt="" />
          <span :class="{ placeholder: isPlaceholder(match.team2) }">{{ teamLabel(match.team2) }}</span>
        </div>
      </div>
      <div class="detail-result">
        <template v-if="played && !revealed">
          <button class="reveal" @click="reveal(id)">Show result</button>
          <div class="links">
            <a :href="highlightsUrl" target="_blank" rel="noopener">Highlights ↗</a>
          </div>
        </template>
        <template v-else-if="played">
          <div class="big-score">{{ scoreLine(match) }}</div>
          <div v-if="ht" class="ht">{{ ht }}</div>
          <div v-if="goals1" class="goals">{{ match.team1 }}: {{ goals1 }}</div>
          <div v-if="goals2" class="goals">{{ match.team2 }}: {{ goals2 }}</div>
          <div class="links">
            <a :href="reportUrl" target="_blank" rel="noopener">Match report ↗</a>
            <a :href="highlightsUrl" target="_blank" rel="noopener">Highlights ↗</a>
          </div>
        </template>
        <template v-else-if="inPlay && match.live">
          <button v-if="!revealed" class="reveal" @click="reveal(id)">Show live score</button>
          <template v-else>
            <div class="big-score">{{ match.live.ft[0] }}–{{ match.live.ft[1] }}</div>
            <div class="ht">{{ match.live.clock }} — in play</div>
            <div v-if="liveGoals1" class="goals">{{ match.team1 }}: {{ liveGoals1 }}</div>
            <div v-if="liveGoals2" class="goals">{{ match.team2 }}: {{ liveGoals2 }}</div>
          </template>
        </template>
        <span v-else-if="inPlay" class="pending in-play">● In play</span>
        <span v-else-if="started" class="pending">Finished — awaiting result</span>
      </div>
    </div>
  </div>
</template>
