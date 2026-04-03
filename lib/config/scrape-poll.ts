/**
 * Default interval for `npm run scrape:poll` (hits `/api/cron/refresh-snapshots`).
 * Vercel Cron cannot run faster than once per minute — use the poll script for 10s.
 */
export const DEFAULT_SCRAPER_POLL_INTERVAL_SECONDS = 10;
