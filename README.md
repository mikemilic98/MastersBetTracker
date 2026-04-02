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
npm run test             # scoring unit tests (Vitest)
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
