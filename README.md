# Masters Bet Tracker

Next.js (App Router) + TypeScript + Tailwind CSS + Prisma (SQLite). See [AGENTS.md](./AGENTS.md) for domain rules.

## Setup

1. **Node.js** 20+ recommended (fix Homebrew `icu4c` / Node if `dyld` errors occur on macOS).

2. Install dependencies:

   ```bash
   npm install
   ```

3. Environment:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` — set `DATABASE_URL`, `POOL_KEY`, and `ADMIN_KEY`.

4. Database:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Dev server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Verify scaffold (before feature work)

Run these in order; all should complete without errors:

```bash
npm install
cp .env.example .env   # if you do not already have .env
npx prisma generate
npx prisma db push
npm run lint
npm run build
npm run dev              # optional: open http://localhost:3000
```

Quick health check:

```bash
npm run test             # Vitest: scoring + HTML snapshot parser + cache
```

### Live scores (HTML scrape)

- **`lib/scores/`** — `ScoresProvider` contract, `fetchHtml`, `parseLeaderboardHtml` (Cheerio; test fixture in `lib/scores/fixtures/`), `ScrapeScoresProvider`, `withSnapshotCache` (TTL).
- Set `SCRAPE_LEADERBOARD_URL` in `.env` when wiring a real page; production sites need **new selectors** — keep parser changes + fixtures in sync.

## HTTP API (manual testing)

With `npm run dev` on port 3000, cookies are set on `localhost` (use `-c` / a browser for cookie jars). Run this once per terminal session so the `curl` examples work as-is (edit values to match `.env` and the slug you pass to `POST /api/admin/pools`):

```bash
export POOL_KEY="change-me-pool-secret" ADMIN_KEY="change-me-admin-secret" SLUG="my-pool"
```

`POOL_KEY` and `ADMIN_KEY` should match your `.env`; `SLUG` is the URL-safe pool id (e.g. `my-pool`). Run `echo "$POOL_KEY" "$SLUG"` before `curl`; if either line is blank, run the `export` line again in **that** terminal (unset variables produce empty JSON fields and a 400 error).

**Auth**

```bash
# Pool session (httpOnly cookie mbt_pool_slug)
curl -s -c cookies.txt -b cookies.txt -X POST http://localhost:3000/api/auth/pool \
  -H "Content-Type: application/json" \
  -d '{"poolKey":"'"$POOL_KEY"'","slug":"'"$SLUG"'"}'

# Admin session (cookie mbt_admin)
curl -s -c admin.txt -b admin.txt -X POST http://localhost:3000/api/auth/admin \
  -H "Content-Type: application/json" \
  -d '{"adminKey":"'"$ADMIN_KEY"'"}'
```

**Admin: create pool**

```bash
curl -s -b admin.txt -X POST http://localhost:3000/api/admin/pools \
  -H "Content-Type: application/json" \
  -d '{"name":"My Pool","slug":"'"$SLUG"'"}'
```

**Participant: create (admin)**

```bash
curl -s -b admin.txt -X POST http://localhost:3000/api/pools/"$SLUG"/participants \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Alice","predictedWinningScore":280,"winnerPickPlayerId":"scottie_scheffler","playerIds":["scottie_scheffler","rory_mcilroy","xander_schauffele","jon_rahm","brooks_koepka"]}'
```

**Snapshot: POST fixture over HTTP** (parser expects `[data-masters-snapshot]`). Serve `lib/scores/fixtures/sample-leaderboard.html` with `python3 -m http.server 8765` in that folder, then `SCRAPE_LEADERBOARD_URL=http://127.0.0.1:8765/sample-leaderboard.html`, then:

```bash
curl -s -b admin.txt -X POST http://localhost:3000/api/pools/"$SLUG"/snapshot/refresh
```

**GET — verify what you created**

| Endpoint | Auth | Use it to |
|----------|------|-----------|
| `GET /api/pools/{slug}` | None | Confirm the pool exists (`participantCount`, `cutoffAt`, `picksLocked`, …). |
| `GET /api/pools/{slug}/participants` | Admin cookie (`admin.txt`) | List all participants, picks, and `editToken` values. |
| `GET /api/pools/{slug}/leaderboard` | Pool cookie (`cookies.txt`) **or** `LEADERBOARD_PUBLIC=true` in `.env` | See computed pool scores (needs a snapshot + matching pick ids). |

```bash
# Pool metadata (public)
curl -s "http://localhost:3000/api/pools/$SLUG"

# All participants and picks (admin)
curl -s -b admin.txt "http://localhost:3000/api/pools/$SLUG/participants"

# Leaderboard (pool session, or set LEADERBOARD_PUBLIC=true to omit cookie)
curl -s -b cookies.txt "http://localhost:3000/api/pools/$SLUG/leaderboard"
```

## Scripts

| Script            | Description        |
| ----------------- | ------------------ |
| `npm run dev`     | Next.js + Turbopack |
| `npm run build`   | Production build   |
| `npm run lint`    | ESLint              |
| `npm run db:push` | Sync Prisma schema |
| `npm run db:studio` | Prisma Studio     |
| `npm run test`      | Vitest (scoring)  |
| `npm run test:watch`| Vitest watch mode |
