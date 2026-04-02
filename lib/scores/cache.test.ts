import { describe, expect, it, vi } from "vitest";
import { withSnapshotCache } from "./cache";
import type { LeaderboardSnapshot } from "./types";

const fakeSnap = (n: number): LeaderboardSnapshot => ({
  fetchedAt: new Date().toISOString(),
  sourceUrl: "https://test",
  players: [],
  champion: {
    name: "A",
    nameKey: "a",
    totalStrokes: n,
  },
});

describe("withSnapshotCache", () => {
  it("returns cached snapshot within TTL without calling provider again", async () => {
    const fetchSnapshot = vi
      .fn()
      .mockResolvedValueOnce(fakeSnap(280))
      .mockResolvedValueOnce(fakeSnap(270));
    const provider = { fetchSnapshot };
    const cached = withSnapshotCache(provider, 60_000);

    const a = await cached.fetchSnapshot();
    const b = await cached.fetchSnapshot();

    expect(fetchSnapshot).toHaveBeenCalledTimes(1);
    expect(a.champion?.totalStrokes).toBe(280);
    expect(b.champion?.totalStrokes).toBe(280);
  });

});
