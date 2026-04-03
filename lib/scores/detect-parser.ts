export type LeaderboardParserKind = "html-contract" | "pga-next-data";

/**
 * `SCRAPE_LEADERBOARD_PARSER`: `pga-next-data` | `html-contract`.
 * If unset, `pgatour.com` URLs use the PGA Next.js `__NEXT_DATA__` parser.
 */
export function detectLeaderboardParserKind(url: string): LeaderboardParserKind {
  const env = process.env.SCRAPE_LEADERBOARD_PARSER?.trim();
  if (env === "pga-next-data") return "pga-next-data";
  if (env === "html-contract") return "html-contract";
  try {
    const host = new URL(url).hostname;
    if (host === "www.pgatour.com" || host.endsWith(".pgatour.com")) {
      return "pga-next-data";
    }
  } catch {
    /* ignore */
  }
  return "html-contract";
}
