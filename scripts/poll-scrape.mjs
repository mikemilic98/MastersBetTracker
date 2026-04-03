/**
 * Long-running process: scrapes on an interval by calling GET /api/cron/refresh-snapshots.
 * Default interval: 10s (override with SCRAPER_POLL_INTERVAL_SECONDS).
 *
 * Requires: CRON_SECRET, app running, SCRAPE_LEADERBOARD_URL on the server.
 * Run: CRON_SECRET=... SCRAPER_POLL_BASE_URL=http://127.0.0.1:3000 node scripts/poll-scrape.mjs
 * Or: npm run scrape:poll (loads .env if you use node --env-file=.env — see package.json)
 */
import process from "node:process";

const DEFAULT_INTERVAL_SECONDS = 10;

function baseUrl() {
  const explicit = process.env.SCRAPER_POLL_BASE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const v = process.env.VERCEL_URL;
  if (v) return `https://${v}`;
  return "http://127.0.0.1:3000";
}

const raw = process.env.SCRAPER_POLL_INTERVAL_SECONDS;
const intervalSec = Math.max(
  1,
  Number.parseInt(raw ?? String(DEFAULT_INTERVAL_SECONDS), 10) ||
    DEFAULT_INTERVAL_SECONDS,
);

const secret = process.env.CRON_SECRET;
if (!secret) {
  console.error("poll-scrape: set CRON_SECRET in the environment.");
  process.exit(1);
}

const url = `${baseUrl()}/api/cron/refresh-snapshots`;

async function tick() {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[poll-scrape] ${res.status}`, j);
      return;
    }
    console.log(`[poll-scrape] ok`, new Date().toISOString());
  } catch (e) {
    console.error("[poll-scrape]", e);
  }
}

console.log(
  `[poll-scrape] every ${intervalSec}s → ${url} (override SCRAPER_POLL_INTERVAL_SECONDS)`,
);
void tick();
setInterval(() => {
  void tick();
}, intervalSec * 1000);
