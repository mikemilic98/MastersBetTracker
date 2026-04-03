import { normalizePlayerIdKey } from "@/lib/normalize-player-id";

export function normalizePicksPayload(
  playerIds: string[],
  winnerPickPlayerId: string,
): { playerIds: string[]; winnerPickPlayerId: string } {
  const ids = playerIds.map((id) => normalizePlayerIdKey(id));
  const winner = normalizePlayerIdKey(winnerPickPlayerId);
  if (ids.length !== 5) {
    throw new Error("Exactly five player ids required");
  }
  if (new Set(ids).size !== 5) {
    throw new Error("Five distinct players required");
  }
  if (!ids.includes(winner)) {
    throw new Error("Winner must be one of the five picks");
  }
  return { playerIds: ids, winnerPickPlayerId: winner };
}
