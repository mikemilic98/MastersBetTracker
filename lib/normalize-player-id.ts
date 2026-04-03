/** Canonical key for matching scrape `nameKey` to `Pick.playerId`. */
export function normalizePlayerIdKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/ /g, "_");
}
