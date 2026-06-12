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
  compact: { type: Boolean, default: false },
  upNext: { type: Boolean, default: false },
})

const { isRevealed, reveal } = useReveals()
const { open } = useDetail()
const { tz } = useTimezone()

const id = computed(() => matchKey(props.match))
const ko = computed(() => kickoff(props.match))
const timeLabel = computed(() =>
  ko.value
    ? ko.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: tz.value })
    : props.match.time
)
const played = computed(() => hasResult(props.match))
const started = computed(() => ko.value && ko.value < new Date())
const live = computed(() => isLive(props.match))
const revealed = computed(() => isRevealed(id.value))
const win = computed(() => winner(props.match))
const goals1 = computed(() => goalsText(props.match.goals1))
const goals2 = computed(() => goalsText(props.match.goals2))
const liveGoals1 = computed(() => goalsText(props.match.live?.goals1))
const liveGoals2 = computed(() => goalsText(props.match.live?.goals2))
const logo1 = computed(() => teamLogo(props.match.team1))
const logo2 = computed(() => teamLogo(props.match.team2))
</script>

<template>
  <article class="match" :class="{ compact, 'up-next': upNext, live }">
    <img v-if="logo1" :src="logo1" class="logo" alt="" />
    <div class="body">
      <div class="teams">
        <span class="team" :class="{ winner: revealed && win === 1, placeholder: isPlaceholder(match.team1) }">
          {{ teamLabel(match.team1) }}
        </span>
        <span class="vs">vs</span>
        <span class="team" :class="{ winner: revealed && win === 2, placeholder: isPlaceholder(match.team2) }">
          {{ teamLabel(match.team2) }}
        </span>
      </div>
      <div class="meta">
        <span>
          <span v-if="live" class="badge live">● Live</span>
          <span v-else-if="upNext" class="badge">Up next</span>
          {{ timeLabel }}
        </span>
        <span v-if="!compact">{{ match.ground }} · {{ match.group || match.round }}</span>
        <span v-else-if="ko">{{ ko.toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: tz }) }}</span>
      </div>
      <div v-if="played || started" class="result">
        <template v-if="played">
          <button v-if="!revealed" class="reveal" @click="reveal(id)">Show result</button>
          <template v-else>
            <div class="score">{{ scoreLine(match) }}</div>
            <template v-if="!compact">
              <div v-if="goals1" class="goals">{{ match.team1 }}: {{ goals1 }}</div>
              <div v-if="goals2" class="goals">{{ match.team2 }}: {{ goals2 }}</div>
            </template>
          </template>
        </template>
        <template v-else-if="live && match.live">
          <button v-if="!revealed" class="reveal" @click="reveal(id)">Show live score</button>
          <template v-else>
            <div class="score">
              {{ match.live.ft[0] }}–{{ match.live.ft[1] }}
              <span class="clock">{{ match.live.clock }}</span>
            </div>
            <template v-if="!compact">
              <div v-if="liveGoals1" class="goals">{{ match.team1 }}: {{ liveGoals1 }}</div>
              <div v-if="liveGoals2" class="goals">{{ match.team2 }}: {{ liveGoals2 }}</div>
            </template>
          </template>
        </template>
        <span v-else-if="!live" class="pending">Finished — awaiting result</span>
      </div>
    </div>
    <img v-if="logo2" :src="logo2" class="logo" alt="" />
    <button class="details" aria-label="Match details" @click="open(match)">›</button>
  </article>
</template>
