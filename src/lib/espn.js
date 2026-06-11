// ESPN public scoreboard overlay — shared by the app (fetched browser-side
// on every open; ESPN sends Access-Control-Allow-Origin: *) and by
// scripts/fetch-results.mjs (which bakes the same overlay into
// public/results.json as the offline/fallback baseline).
import { kickoff } from './wc.js'

export const ESPN_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=300'

// ESPN display name -> openfootball name
const NAME_ALIASES = {
  'Bosnia-Herzegovina': 'Bosnia & Herzegovina',
  'Congo DR': 'DR Congo',
  Czechia: 'Czech Republic',
  'Türkiye': 'Turkey',
  'United States': 'USA',
}

function kickoffMs(m) {
  const d = kickoff(m)
  return d ? d.getTime() : null
}

// "90'+2'" -> {minute: 90, offset: 2}
function parseClock(clock) {
  const m = /(\d+)'(?:\s*\+\s*(\d+)')?/.exec(clock || '')
  if (!m) return null
  const g = { minute: Number(m[1]) }
  if (m[2]) g.offset = Number(m[2])
  return g
}

// Mutates `base` (openfootball-shaped {matches}): applies completed-match
// scores/scorers and fills knockout team names as ESPN learns them.
export function applyEspnOverlay(base, espn) {
  const knownTeams = new Set(
    base.matches.filter((m) => m.group).flatMap((m) => [m.team1, m.team2])
  )

  let scoresApplied = 0
  let namesFilled = 0
  for (const ev of espn?.events || []) {
    const comp = ev.competitions?.[0]
    if (!comp) continue
    const home = comp.competitors?.find((c) => c.homeAway === 'home')
    const away = comp.competitors?.find((c) => c.homeAway === 'away')
    if (!home || !away) continue
    const homeName = NAME_ALIASES[home.team.displayName] || home.team.displayName
    const awayName = NAME_ALIASES[away.team.displayName] || away.team.displayName

    const evMs = Date.parse(ev.date)
    const candidates = base.matches.filter((m) => kickoffMs(m) === evMs)
    let match = candidates.find(
      (m) =>
        (m.team1 === homeName && m.team2 === awayName) ||
        (m.team1 === awayName && m.team2 === homeName)
    )
    // Knockout fixtures may still hold placeholders ("1A") on our side while
    // ESPN already has real (or its own placeholder) names — match by kickoff
    // instant. Group matches always name-match, so simultaneous group finales
    // are never ambiguous; simultaneous knockouts at the same instant would
    // be, hence the length check.
    if (!match && candidates.length === 1 && !candidates[0].group) match = candidates[0]
    if (!match) {
      if (knownTeams.has(homeName) && knownTeams.has(awayName)) {
        console.warn(`no fixture for ${homeName} v ${awayName} at ${ev.date}`)
      }
      continue
    }

    // Fill knockout team names as soon as ESPN knows them (openfootball
    // convention: team1 is the home/bracket-upper side, same as ESPN).
    if (!match.group) {
      if (knownTeams.has(homeName) && !knownTeams.has(match.team1)) {
        match.team1 = homeName
        namesFilled++
      }
      if (knownTeams.has(awayName) && !knownTeams.has(match.team2)) {
        match.team2 = awayName
        namesFilled++
      }
    }

    if (!ev.status?.type?.completed) continue
    if (match.score) continue // openfootball's curated score wins

    const flip = match.team1 === awayName && match.team2 === homeName
    const totals = [Number(home.score), Number(away.score)]
    const goalsHome = []
    const goalsAway = []
    for (const d of comp.details || []) {
      if (!d.scoringPlay) continue
      const g = parseClock(d.clock?.displayValue)
      if (!g) continue
      g.name = d.athletesInvolved?.[0]?.displayName || 'Unknown'
      if (d.penaltyKick) g.penalty = true
      if (d.ownGoal) g.owngoal = true
      ;(d.team?.id === home.team.id ? goalsHome : goalsAway).push(g)
    }

    // ESPN totals include extra time; openfootball splits ft/et. Recover the
    // 90-minute score from scoring-play clocks when they reconcile.
    const score = {}
    const detail = `${ev.status.type.detail || ''} ${ev.status.type.shortDetail || ''}`
    const wentToExtra = home.shootoutScore != null || /aet|extra/i.test(detail)
    if (wentToExtra) {
      const ft90 = [goalsHome, goalsAway].map((gs) => gs.filter((g) => g.minute <= 90).length)
      score.ft =
        ft90[0] + goalsHome.filter((g) => g.minute > 90).length === totals[0] &&
        ft90[1] + goalsAway.filter((g) => g.minute > 90).length === totals[1]
          ? ft90
          : totals
      score.et = totals
      if (home.shootoutScore != null) {
        score.p = [Number(home.shootoutScore), Number(away.shootoutScore)]
      }
    } else {
      score.ft = totals
    }

    if (flip) {
      for (const k of Object.keys(score)) score[k] = [score[k][1], score[k][0]]
    }
    match.score = score
    match.goals1 = flip ? goalsAway : goalsHome
    match.goals2 = flip ? goalsHome : goalsAway
    scoresApplied++
  }
  return { scoresApplied, namesFilled }
}
