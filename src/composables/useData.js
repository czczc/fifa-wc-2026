import { ref } from 'vue'
import bundled from '../data/worldcup.json'
import { RESULTS_URL } from '../lib/wc'
import { ESPN_URL, applyEspnOverlay } from '../lib/espn'

const CACHE_KEY = 'wc2026.results'
const TIME_KEY = 'wc2026.fetchedAt'

function cached() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY))
  } catch {
    return null
  }
}

// Fetched data fully supersedes the bundled schedule (same file upstream).
const data = ref(cached() || bundled)
const fetchedAt = ref(localStorage.getItem(TIME_KEY))
const status = ref('idle') // idle | fetching | ok | offline

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json.matches) || json.matches.length === 0) throw new Error('bad data')
  return json
}

async function refresh() {
  status.value = 'fetching'
  // openfootball is the curated base (schedule + their scores if/when they
  // catch up); the ESPN overlay browser-side provides near-real-time scores
  // and knockout team names. Either alone is enough to count as fresh.
  const [of, espn] = await Promise.allSettled([
    fetchJson(RESULTS_URL),
    fetch(ESPN_URL, { cache: 'no-cache' }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    }),
  ])
  if (of.status === 'rejected' && espn.status === 'rejected') {
    status.value = 'offline'
    return
  }
  const json =
    of.status === 'fulfilled' ? of.value : JSON.parse(JSON.stringify(data.value))
  if (espn.status === 'fulfilled') applyEspnOverlay(json, espn.value)
  data.value = json
  fetchedAt.value = new Date().toISOString()
  localStorage.setItem(CACHE_KEY, JSON.stringify(json))
  localStorage.setItem(TIME_KEY, fetchedAt.value)
  status.value = 'ok'
}

export function useData() {
  return { data, fetchedAt, status, refresh }
}
