# Cat World Cup 2026 — Spoiler-Safe Schedule

A personal, cat-friendly PWA showing the FIFA World Cup 2026 schedule with tap-to-reveal results. Scores stay hidden until you ask for them; the app installs on a phone, works offline, and every team is a cat.

- **Schedule** — all 104 matches grouped by day in your local timezone, with team/group filters
- **Reveal buttons** — results are fetched silently on app open but only shown per match when you tap (reveals persist on-device)
- **Standings** — per-group tables behind their own reveal gates
- **Bracket** — knockout rounds, sharing the same per-match reveal state

Results are fetched browser-side on every open: [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) as the curated base plus ESPN's public scoreboard API for near-real-time scores, scorers, and knockout team names (no API keys). The schedule is bundled at build time so the app works offline from first install. See `CONTEXT.md` and `docs/adr/` for the domain language and design decisions.

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # serve the production build
npm run icons    # regenerate public/icons/*.png
```

## Deployment

Pushing to `main` builds and deploys via GitHub Actions (`.github/workflows/deploy.yml`) to GitHub Pages at `https://<user>.github.io/fifa-wc-2026/`.

One-time setup: create a GitHub repo named `fifa-wc-2026` (the Vite `base` in `vite.config.js` must match the repo name), push, then in repo **Settings → Pages** set the source to **GitHub Actions**.

To install on a phone: open the deployed URL, then "Add to Home Screen" (iOS Safari) or "Install app" (Android Chrome).
