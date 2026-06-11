# Static PWA with openfootball as the sole data source

> Amended by ADR-0003: openfootball's JSON proved stale during the tournament, so results now arrive via a GitHub Actions pipeline; openfootball remains the schedule base and fallback.

The repo was scaffolded as a Python project, but the requirements (installable PWA, offline-capable, single user) need no backend at all — so this is a fully static Vue 3 + Vite app deployed to GitHub Pages, and the Python scaffold was removed. Results come from one upstream: the public-domain `openfootball/worldcup.json` 2026 file fetched browser-side from raw.githubusercontent.com (CORS-friendly, no API key, no rate limits that matter for one user).

## Considered Options

- Live community APIs (worldcupjson.net-style) were rejected: they offer near-real-time scores, but the user only needs final scores and tolerates hours of lag, and a volunteer-run live API is the most likely thing to die mid-tournament. GitHub raw files are about as reliable as free hosting gets.
- A Python proxy/backend was rejected: it adds hosting and uptime obligations purely to re-serve data the browser can already fetch directly.

## Consequences

- Result freshness is bounded by openfootball maintainers' commit cadence (typically hours, not minutes).
- The expected data contract once matches are played (observed in the 2022 file from the same repo): matches gain `score: {ft, ht, et?, p?}` plus `goals1`/`goals2` scorer arrays; there is no winner field — the app computes winners from scores.
