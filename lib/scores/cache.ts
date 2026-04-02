import type { LeaderboardSnapshot } from "./types";
import type { ScoresProvider } from "./scrape-provider";

type Cached = { atMs: number; snapshot: LeaderboardSnapshot };

/**
 * In-memory TTL cache for server-side polling (per process). Not shared across instances.
 */
export function withSnapshotCache(
  provider: ScoresProvider,
  ttlMs: number,
): ScoresProvider {
  let cache: Cached | null = null;

  return {
    async fetchSnapshot() {
      const now = Date.now();
      if (cache && now - cache.atMs < ttlMs) {
        return cache.snapshot;
      }
      const snapshot = await provider.fetchSnapshot();
      cache = { atMs: now, snapshot };
      return snapshot;
    },
  };
}
