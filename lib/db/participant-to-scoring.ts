import type { ParticipantInput } from "../scoring/types";

/** Shape Prisma returns with `include: { picks: true }` (or equivalent plain objects). */
export type ParticipantWithPicks = {
  id: string;
  displayName: string;
  predictedWinningScore: number;
  winnerPickPlayerId: string;
  picks: { sortOrder: number; playerId: string }[];
};

/**
 * Maps persisted participant + picks to {@link ParticipantInput} for `scoreParticipant`.
 * Enforces five distinct picks and winner in the set (same rules as scoring).
 */
export function participantToParticipantInput(
  p: ParticipantWithPicks,
): ParticipantInput {
  if (p.picks.length !== 5) {
    throw new Error("Exactly five picks required");
  }
  const ordered = [...p.picks].sort((a, b) => a.sortOrder - b.sortOrder);
  for (let i = 0; i < 5; i++) {
    if (ordered[i]!.sortOrder !== i) {
      throw new Error(`Missing pick sortOrder ${i}`);
    }
  }
  const picks = ordered.map((row) => ({ playerId: row.playerId }));
  const ids = new Set(picks.map((x) => x.playerId));
  if (ids.size !== 5) {
    throw new Error("Five distinct players required");
  }
  if (!ids.has(p.winnerPickPlayerId)) {
    throw new Error("Winner pick must be one of the five players");
  }
  return {
    id: p.id,
    displayName: p.displayName,
    predictedWinningScore: p.predictedWinningScore,
    picks,
    winnerPickPlayerId: p.winnerPickPlayerId,
  };
}
