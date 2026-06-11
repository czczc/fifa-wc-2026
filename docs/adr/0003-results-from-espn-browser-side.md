# Results from ESPN's public scoreboard, fetched browser-side

On opening day the openfootball JSON had 0 scores hours after the first match ended, and its text repo hadn't committed that day either — repeating the 2022 pattern where the JSON mirror stayed stale all tournament. ESPN's public scoreboard API (`site.api.espn.com/.../fifa.world/scoreboard`, one date-range request for the whole tournament, no key, `Access-Control-Allow-Origin: *`) had the result in near-real-time with scorers, penalty/own-goal flags, and `shootoutScore` for knockout pens.

Decision: on every app open the browser fetches openfootball (curated base; its scores win if present) and ESPN in parallel, and applies the ESPN overlay (`src/lib/espn.js`): completed-match scores/scorers, plus real team names for knockout slots as ESPN learns them. The merged result is cached in localStorage, which is also the offline story. Either source alone is enough; both failing means showing the last cached data.

## Considered Options

- **worldcup26.ir** (community API, briefly used): volunteer-run, messier data, no CORS.
- **football-data.org / API-Football / balldontlie**: reputable but need API keys — impossible to keep secret in a static site.
- **A GitHub Actions cron pipeline** committing a merged `results.json` every 30 min (briefly built): originally motivated by the assumption that no live source allowed browser CORS — true for worldcup26.ir, false for ESPN. Once the browser could fetch ESPN directly, the pipeline's only unique value was surviving a hypothetical ESPN browser-origin block, which didn't justify ~1,900 cron runs and a commit-plus-redeploy per result. Removed for simplicity.

## Consequences

- Result freshness = ESPN's own lag (near-real-time) on every open; no infrastructure beyond the static site.
- ESPN's API is unofficial and could change shape without notice; openfootball remains the independent fallback path.
- Match pairing is by kickoff instant + team names (5 ESPN name aliases). Simultaneous knockout kickoffs with placeholder names on our side cannot be disambiguated and are skipped with a warning.
- Extra-time splits (90-minute score vs final) are reconstructed from scoring-play clocks; if they don't reconcile, the full-time field carries the ET total.
