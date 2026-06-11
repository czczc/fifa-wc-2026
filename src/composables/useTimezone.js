import { ref, watch } from 'vue'
import { dateKey } from '../lib/wc'

const FALLBACK_ZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Asia/Riyadh',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
]

const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone

function validZone(z) {
  try {
    dateKey(new Date(), z)
    return true
  } catch {
    return false
  }
}

const stored = localStorage.getItem('wc2026.tz')
const tz = ref(stored && validZone(stored) ? stored : deviceTz)
watch(tz, (v) => localStorage.setItem('wc2026.tz', v))

const zones =
  typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : [...new Set([deviceTz, ...FALLBACK_ZONES])].sort()

export function useTimezone() {
  return { tz, zones, deviceTz }
}
