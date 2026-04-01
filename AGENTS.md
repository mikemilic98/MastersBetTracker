# MastersBetTracker — agent / contributor handoff

Use this file to onboard quickly if the project owner is offline. **Cursor:** an always-on rule lives at [`.cursor/rules/masters-pool-tracker.mdc`](.cursor/rules/masters-pool-tracker.mdc) so agents load domain context automatically; details live here. It summarizes **product intent**, **authoritative scoring**, **stack**, and **architecture** so you do not reverse rules or rebuild the wrong thing.

## What this app is

- A **friends-only betting pool** for **The Masters**: each participant submits **five players**, names **one** as their **predicted winner**, and a **predicted winning score** (total strokes for the champion — used as a **tie-breaker**).
- The **primary UI leaderboard ranks friends by pool score**, **not** by mirroring the public Masters website order. Public data is only an **input** to compute each friend’s score under the rules below.

## Authoritative scoring (do not simplify without explicit owner sign-off)

All pool math uses **strokes relative to par** (Augusta: **par 72 per round** → each round contribution is `strokes − 72` for that round).

1. **Per picked player — tournament total vs par:** sum of **four** round values. If the player **missed the cut**, impute **+2 vs par for Saturday** and **+2 vs par for Sunday** (same idea as scoring 74 on each of those days when par is 72).
2. **Per participant:** take the **four lowest** (best) per-player totals among their **five** picks and **sum** them. Lower total is better.
3. **Winner bonus:** if their designated winner is the **actual champion**, **subtract 3** from their pool total (same scale as the summed vs-par totals).
4. **Ranking:** sort by pool total ascending. **Ties for first place** among participants: break by **closest predicted winning score** to the champion’s **actual total strokes**.

Edge cases to handle in code: name ↔ id mapping for picks; champion identification from snapshot; parser drift if using HTML scrape.

## Stack (planned / decided)

- **Next.js** (App Router) + **TypeScript** + **Tailwind**
- **SQLite** + **Prisma** (or Drizzle), or **PostgreSQL** if hosted DB is preferred
- **Live data:** **no paid API assumed** — **scheduled scrape** of a configurable public leaderboard **HTML** page, parsed into a normalized **`LeaderboardSnapshot`**, stored in the DB. Implement behind a **`scoresProvider`**-style interface so a paid API could be swapped in later without changing scoring/UI.

## Access (no participant accounts)

- **Pool master key:** one shared secret (emailed to everyone) — gates the participant experience (e.g. httpOnly session cookie).
- **Per-participant edit token** (or personalized URL): required so each person only edits **their** row; a shared key alone does not identify users.
- **Admin key:** separate secret for organizer-only routes — edit anyone’s picks, set **cutoff** time, **global lock/unlock**, **per-participant lock**, overrides after cutoff.
- **Cutoff:** after configured time, participant self-edits are rejected unless admin unlocks or edits on their behalf.

## Architecture (mental model)

```text
Scrape/HTML → parse → normalized snapshot (DB)
                              ↓
Picks (DB) + snapshot → scoring engine → friends leaderboard
```

- **Ingest:** server-side only; polite polling (interval + jitter); parser tests against **saved HTML fixtures**.
- **Scoring module:** pure TypeScript; unit-tested with fixtures (no network).

## Repository status

The repo may still be **greenfield**. If there is no `package.json` yet, scaffold per the owner’s Cursor plan (“Masters Pool Tracker” / MastersBetTracker) before adding features.

## Where to work

| Area | Responsibility |
|------|----------------|
| Scoring | Best 4 of 5, MC +2/+2, −3 winner, tie-break; must match this document |
| Ingest | Fetch + parse HTML → internal snapshot; configurable URL |
| Persistence | Pools, participants, picks, optional snapshot cache |
| UI | Pick entry (before lock), friends leaderboard with optional row breakdown |

## What not to do

- Do not treat the app as a **read-only mirror** of an external leaderboard.
- Do not hard-code a paid golf API as the only path — keep **provider abstraction**.
- Do not scrape blindly without **ToS awareness**; the owner accepts scrape risk for a private pool.

---

If instructions here conflict with a **written owner decision** in an issue or newer doc, follow the owner’s latest decision and update this file.
