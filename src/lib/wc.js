export const RESULTS_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

// Knockout matches carry a stable `num`, except the third-place match and the
// final, whose round names are unique. Group matches are identified by
// date + teams, which never change once the draw is done.
export function matchKey(m) {
  if (m.num != null) return `m${m.num}`
  if (m.group) return `${m.date}|${m.team1}|${m.team2}`
  return `r|${m.round}`
}

// "13:00 UTC-6" + "2026-06-11" -> Date in the device's timezone
export function kickoff(m) {
  const t = /^(\d{1,2}):(\d{2})\s*UTC([+-])(\d{1,2})(?::(\d{2}))?$/.exec(m.time || '')
  if (!t) return null
  const [, h, min, sign, oh, om] = t
  const d = new Date(`${m.date}T${h.padStart(2, '0')}:${min}:00${sign}${oh.padStart(2, '0')}:${om || '00'}`)
  return isNaN(d) ? null : d
}

// Knockout placeholders: "1A" / "2A" (group winner/runner-up),
// "3A/B/C/D/F" (best third), "W101" / "L101" (winner/loser of match #)
export function teamLabel(name) {
  let m = /^([12])([A-L])$/.exec(name)
  if (m) return `${m[1] === '1' ? 'Winner' : 'Runner-up'} Group ${m[2]}`
  if (/^3[A-L](\/[A-L])+$/.test(name)) return `3rd of ${name.slice(1)}`
  m = /^([WL])(\d+)$/.exec(name)
  if (m) return `${m[1] === 'W' ? 'Winner' : 'Loser'} of match ${m[2]}`
  return name
}

export function isPlaceholder(name) {
  return teamLabel(name) !== name
}

// Cat logos in public/logos/ — only the teams below have one; the rest
// (and knockout placeholders) render without a logo.
const LOGO_OVERRIDES = { USA: 'united-states' }
const LOGOS = new Set([
  'algeria', 'argentina', 'australia', 'austria', 'belgium', 'brazil',
  'canada', 'colombia', 'croatia', 'curacao', 'czech-republic', 'ecuador',
  'egypt', 'england', 'france', 'germany', 'ghana', 'haiti', 'iran', 'iraq',
  'ivory-coast', 'japan', 'jordan', 'mexico', 'morocco', 'netherlands',
  'new-zealand', 'norway', 'panama', 'paraguay', 'portugal', 'qatar',
  'saudi-arabia', 'scotland', 'senegal', 'south-africa', 'south-korea',
  'spain', 'sweden', 'switzerland', 'united-states', 'uruguay', 'uzbekistan',
])

export function teamLogo(name) {
  const slug =
    LOGO_OVERRIDES[name] ||
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z ]/g, '')
      .trim()
      .replace(/ +/g, '-')
  return LOGOS.has(slug) ? `${import.meta.env.BASE_URL}logos/${slug}.png` : null
}

export function hasResult(m) {
  return !!m.score?.ft
}

// No live data feed during play — "in play" is inferred from kickoff time.
export const MATCH_DURATION_MS = 2.5 * 60 * 60 * 1000

export function isLive(m, now = new Date()) {
  if (hasResult(m)) return false
  const ko = kickoff(m)
  return !!ko && ko < now && now - ko < MATCH_DURATION_MS
}

export function scoreLine(m) {
  const s = m.score
  if (!s?.ft) return null
  if (s.p) return `${(s.et || s.ft)[0]}–${(s.et || s.ft)[1]} a.e.t. (${s.p[0]}–${s.p[1]} pens)`
  if (s.et) return `${s.et[0]}–${s.et[1]} a.e.t.`
  return `${s.ft[0]}–${s.ft[1]}`
}

// 1 = team1 won, 2 = team2 won, 0 = draw or not played
export function winner(m) {
  const s = m.score
  if (!s?.ft) return 0
  const dec = s.p || s.et || s.ft
  return dec[0] > dec[1] ? 1 : dec[1] > dec[0] ? 2 : 0
}

export function goalsText(goals) {
  if (!goals?.length) return ''
  return goals
    .map((g) => {
      const min = g.offset ? `${g.minute}+${g.offset}'` : `${g.minute}'`
      const tags = [g.penalty && 'pen', g.owngoal && 'o.g.'].filter(Boolean)
      return `${g.name} ${min}${tags.length ? ` (${tags.join(', ')})` : ''}`
    })
    .join(', ')
}

// Points, goal difference, goals for, then name — close enough to FIFA
// tiebreakers for a glanceable table.
export function computeStandings(matches, group) {
  const rows = new Map()
  const row = (t) => {
    if (!rows.has(t)) rows.set(t, { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 })
    return rows.get(t)
  }
  for (const m of matches) {
    if (m.group !== group) continue
    const r1 = row(m.team1)
    const r2 = row(m.team2)
    if (!m.score?.ft) continue
    const [a, b] = m.score.ft
    r1.p++; r2.p++
    r1.gf += a; r1.ga += b
    r2.gf += b; r2.ga += a
    if (a > b) { r1.w++; r2.l++; r1.pts += 3 }
    else if (a < b) { r2.w++; r1.l++; r2.pts += 3 }
    else { r1.d++; r2.d++; r1.pts++; r2.pts++ }
  }
  return [...rows.values()].sort(
    (x, y) =>
      y.pts - x.pts ||
      y.gf - y.ga - (x.gf - x.ga) ||
      y.gf - x.gf ||
      x.team.localeCompare(y.team)
  )
}

// "YYYY-MM-DD" of a Date in the given timezone (en-CA formats ISO-style)
const dateKeyFormatters = new Map()
export function dateKey(d, tz) {
  if (!dateKeyFormatters.has(tz)) {
    dateKeyFormatters.set(
      tz,
      new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    )
  }
  return dateKeyFormatters.get(tz).format(d)
}
