<script setup>
import { computed, ref } from 'vue'
import { useTimezone } from '../composables/useTimezone'

const { tz, zones, deviceTz } = useTimezone()
const open = ref(false)
const q = ref('')

// Well-known cities that aren't IANA zone names (IANA names zones after
// the most populous city of the region, not capitals).
const CITY_ALIASES = {
  beijing: 'Asia/Shanghai',
  guangzhou: 'Asia/Shanghai',
  shenzhen: 'Asia/Shanghai',
  delhi: 'Asia/Kolkata',
  'new delhi': 'Asia/Kolkata',
  mumbai: 'Asia/Kolkata',
  hanoi: 'Asia/Ho_Chi_Minh',
  osaka: 'Asia/Tokyo',
  washington: 'America/New_York',
  miami: 'America/New_York',
  boston: 'America/New_York',
  atlanta: 'America/New_York',
  dallas: 'America/Chicago',
  houston: 'America/Chicago',
  austin: 'America/Chicago',
  'san francisco': 'America/Los_Angeles',
  seattle: 'America/Los_Angeles',
  'san diego': 'America/Los_Angeles',
  'las vegas': 'America/Los_Angeles',
  manchester: 'Europe/London',
  liverpool: 'Europe/London',
  edinburgh: 'Europe/London',
  munich: 'Europe/Berlin',
  frankfurt: 'Europe/Berlin',
  hamburg: 'Europe/Berlin',
  milan: 'Europe/Rome',
  barcelona: 'Europe/Madrid',
  geneva: 'Europe/Zurich',
  bern: 'Europe/Zurich',
}

const filtered = computed(() => {
  const raw = q.value.trim().toLowerCase()
  if (!raw) return zones.map((z) => ({ zone: z }))
  const needle = raw.replaceAll(' ', '_')
  const aliasHits = Object.entries(CITY_ALIASES)
    .filter(([city]) => city.includes(raw))
    .map(([city, zone]) => ({ zone, via: city }))
  const zoneHits = zones.filter((z) => z.toLowerCase().includes(needle)).map((z) => ({ zone: z }))
  const seen = new Set()
  return [...aliasHits, ...zoneHits].filter((e) => !seen.has(e.zone) && seen.add(e.zone))
})

function pick(z) {
  tz.value = z
  open.value = false
  q.value = ''
}
</script>

<template>
  <button class="tz-button" aria-label="Timezone" @click="open = true">
    {{ tz.replaceAll('_', ' ') }} ▾
  </button>
  <div v-if="open" class="tz-modal" @click.self="open = false">
    <div class="tz-panel">
      <input
        v-model="q"
        class="tz-search"
        type="search"
        placeholder="Search timezone…"
        autofocus
        @keydown.esc="open = false"
      />
      <ul class="tz-list">
        <li v-if="!q && deviceTz !== tz">
          <button @click="pick(deviceTz)">Device default — {{ deviceTz.replaceAll('_', ' ') }}</button>
        </li>
        <li v-for="e in filtered" :key="e.zone">
          <button :class="{ active: e.zone === tz }" @click="pick(e.zone)">
            {{ e.zone.replaceAll('_', ' ') }}
            <span v-if="e.via" class="tz-via">({{ e.via }})</span>
          </button>
        </li>
        <li v-if="!filtered.length" class="tz-empty">No matching timezone</li>
      </ul>
    </div>
  </div>
</template>
