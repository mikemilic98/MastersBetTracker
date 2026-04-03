import { prisma } from "@/lib/prisma";
import { participantToParticipantInput } from "@/lib/db/participant-to-scoring";
import { normalizePlayerIdKey } from "@/lib/normalize-player-id";
import {
  rankParticipants,
  scoreParticipant,
} from "@/lib/scoring/scoring";
import type { ParticipantPoolResult } from "@/lib/scoring/types";
import type { LeaderboardSnapshot } from "@/lib/scores/types";
import { parseSnapshotPayload } from "./snapshot-parse";
import {
  playerTotalsVsParMapFromSnapshot,
  resolveChampionForScoring,
} from "./snapshot-totals";

export async function computePoolLeaderboard(
  poolSlug: string,
): Promise<{
  results: ParticipantPoolResult[];
  snapshotFetchedAt: string | null;
  sourceUrl: string | null;
}> {
  const pool = await prisma.pool.findUnique({
    where: { slug: poolSlug },
    include: {
      participants: { include: { picks: true } },
      leaderboardSnapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!pool) {
    throw new Error("Pool not found");
  }

  const snapRow = pool.leaderboardSnapshots[0];
  if (!snapRow) {
    return { results: [], snapshotFetchedAt: null, sourceUrl: null };
  }

  const snapshot = parseSnapshotPayload(snapRow.payload) as LeaderboardSnapshot;
  const totals = playerTotalsVsParMapFromSnapshot(snapshot);
  const champion = resolveChampionForScoring(snapshot);

  const results: ParticipantPoolResult[] = [];

  for (const p of pool.participants) {
    const orderedPicks = [...p.picks].sort((a, b) => a.sortOrder - b.sortOrder);
    const input = participantToParticipantInput({
      id: p.id,
      displayName: p.displayName,
      predictedWinningScore: p.predictedWinningScore,
      winnerPickPlayerId: normalizePlayerIdKey(p.winnerPickPlayerId),
      picks: orderedPicks.map((pick) => ({
        sortOrder: pick.sortOrder,
        playerId: normalizePlayerIdKey(pick.playerId),
      })),
    });

    const mapForScoring = new Map<string, number>();
    for (const pick of input.picks) {
      const v = totals.get(pick.playerId);
      if (v === undefined) {
        throw new Error(
          `No tournament data for picked player "${pick.playerId}" (check snapshot / name keys)`,
        );
      }
      mapForScoring.set(pick.playerId, v);
    }

    results.push(scoreParticipant(input, mapForScoring, champion));
  }

  return {
    results: rankParticipants(results),
    snapshotFetchedAt: snapRow.fetchedAt.toISOString(),
    sourceUrl: snapshot.sourceUrl,
  };
}
