import { playerTotalVsPar } from "@/lib/scoring/scoring";
import type { LeaderboardSnapshot } from "@/lib/scores/types";
import { normalizePlayerIdKey } from "@/lib/normalize-player-id";
import type { ChampionResult } from "@/lib/scoring/types";
import { ROUND_PAR } from "@/lib/scoring/types";

/** Map canonical player key → total strokes vs par for the tournament. */
export function playerTotalsVsParMapFromSnapshot(
  snapshot: LeaderboardSnapshot,
): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of snapshot.players) {
    const key = normalizePlayerIdKey(p.nameKey);
    const total = playerTotalVsPar({
      playerId: key,
      missedCut: p.missedCut,
      rounds: {
        r1: p.roundsVsPar.r1,
        r2: p.roundsVsPar.r2,
        r3: p.roundsVsPar.r3,
        r4: p.roundsVsPar.r4,
      },
    });
    m.set(key, total);
  }
  return m;
}

/**
 * Champion for scoring: explicit `snapshot.champion`, else leader (position 1).
 * Total strokes: explicit, else 4×round par + leader vs par.
 */
export function resolveChampionForScoring(
  snapshot: LeaderboardSnapshot,
): ChampionResult {
  if (snapshot.champion) {
    return {
      playerId: normalizePlayerIdKey(snapshot.champion.nameKey),
      totalStrokes: snapshot.champion.totalStrokes,
    };
  }
  const leader =
    snapshot.players.find((p) => p.position === 1) ?? snapshot.players[0];
  if (!leader) {
    throw new Error("Snapshot has no players");
  }
  const vs = playerTotalVsPar({
    playerId: normalizePlayerIdKey(leader.nameKey),
    missedCut: leader.missedCut,
    rounds: {
      r1: leader.roundsVsPar.r1,
      r2: leader.roundsVsPar.r2,
      r3: leader.roundsVsPar.r3,
      r4: leader.roundsVsPar.r4,
    },
  });
  const totalStrokes =
    leader.totalStrokes ?? 4 * ROUND_PAR + vs;
  return {
    playerId: normalizePlayerIdKey(leader.nameKey),
    totalStrokes,
  };
}
