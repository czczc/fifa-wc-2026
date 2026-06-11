# FIFA World Cup 2026 Spoiler-Safe Schedule

A personal, offline-capable PWA showing the WC 2026 schedule (June 11 – July 19, 2026, 104 matches) where match results stay hidden until explicitly revealed per match.

## Language

**Match**:
One of the 104 scheduled games, identified by its position in the tournament (date + teams, or knockout match number).
_Avoid_: game, fixture

**Spoiler**:
Any score or result information (final score, scorers, W/D/L, standings points), including external recap/highlights links — those appear only after a Reveal. Team names are explicitly NOT spoilers — knockout slots show real team names as soon as they are known.
_Avoid_: result (ambiguous — see Flagged ambiguities)

**Reveal**:
The local, per-match, permanent act of unhiding a Match's score and scorers. Stored on-device (localStorage); never expires, never resets.
_Avoid_: load, unlock

**Fetch**:
The background network refresh of results data from the Results Source, performed automatically on app open. Fetching never shows anything on screen by itself.
_Avoid_: load, sync

**Results Source**:
What a Fetch reads, browser-side and in parallel: openfootball's JSON (curated base; its scores win if present) plus ESPN's public scoreboard API, whose finished-game scores, scorers, and knockout team names are overlaid on top. Online freshness is ESPN's own (near-real-time); final scores only.

**Bundled Schedule**:
The copy of the 2026 schedule JSON compiled into the app at build time, so the app works fully on first install with no network. Superseded by Fetched data when available.

**Standings Gate**:
The per-group reveal for a group's standings table. A reveal covers exactly the results included at that moment; when new results for the group arrive, the gate re-locks until revealed again. Independent of per-match Reveals — revealing a group's table does not reveal its matches' scores, and vice versa.

## Relationships

- A **Fetch** updates the on-device data cache; a **Reveal** only changes what is displayed.
- A **Reveal** applies to exactly one **Match** and is shared across all views (list, bracket).
- A **Standings Gate** applies to exactly one group and is independent of the six **Reveals** inside that group.
- The **Bundled Schedule** is the fallback when no **Fetch** has ever succeeded.

## Example dialogue

> **Dev:** "When the user taps 'load result' on a Match, do we hit the network?"
> **Domain expert:** "No — that button is a **Reveal**, purely local. The **Fetch** already happened silently when the app opened. If the phone is offline, the Reveal shows whatever the last Fetch cached."
> **Dev:** "And if they check the Round of 32 schedule before revealing any group matches?"
> **Domain expert:** "They'll see the real team names — who advanced is not a **Spoiler** here, only scores are."

## Flagged ambiguities

- "load results" (from the original request) conflated two concepts — resolved: **Fetch** (network, automatic, silent) and **Reveal** (display, manual, per match) are decoupled.
- "result" could mean a score or who advanced — resolved: only score/standings information is a **Spoiler**; advancement (team names in knockout slots) is always visible.
