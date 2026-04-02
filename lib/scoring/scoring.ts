import type {
  ChampionResult,
  ParticipantInput,
  ParticipantPoolResult,
  PlayerId,
  PlayerTournamentInput,
} from "./types";
import { ROUND_PAR } from "./types";

export { ROUND_PAR };

/**
 * Total tournament strokes vs par for one player (four rounds).
 * Missed cut: Thu/Fri actual vs par, then +2 vs par for Sat and Sun each.
 */
export function playerTotalVsPar(input: PlayerTournamentInput): number {
  const { missedCut, rounds } = input;
  if (missedCut) {
    return rounds.r1 + rounds.r2 + 2 + 2;
  }
  if (rounds.r3 === null || rounds.r4 === null) {
    throw new Error("Made cut requires four rounds vs par");
  }
  return rounds.r1 + rounds.r2 + rounds.r3 + rounds.r4;
}

/** Sum of the four best (lowest) vs-par totals among five picks. */
export function sumBestFourOfFive(totals: number[]): number {
  if (totals.length !== 5) {
    throw new Error("Exactly five pick totals required");
  }
  const sorted = [...totals].sort((a, b) => a - b);
  return sorted[0]! + sorted[1]! + sorted[2]! + sorted[3]!;
}

/** Which pick indices (0–4) count toward the pool sum (four lowest vs-par). */
export function indicesOfBestFourPicks(totals: number[]): number[] {
  if (totals.length !== 5) {
    throw new Error("Exactly five pick totals required");
  }
  const indexed = totals.map((t, i) => ({ t, i }));
  indexed.sort((a, b) => a.t - b.t);
  return indexed
    .slice(0, 4)
    .map((x) => x.i)
    .sort((a, b) => a - b);
}

const WINNER_BONUS_VS_PAR = 3;

export function scoreParticipant(
  participant: ParticipantInput,
  playerTotalsVsPar: Map<PlayerId, number>,
  champion: ChampionResult,
): ParticipantPoolResult {
  if (participant.picks.length !== 5) {
    throw new Error("Exactly five picks required");
  }
  const ids = new Set(participant.picks.map((p) => p.playerId));
  if (ids.size !== 5) {
    throw new Error("Five distinct players required");
  }
  if (!ids.has(participant.winnerPickPlayerId)) {
    throw new Error("Winner pick must be one of the five players");
  }

  const pickTotalsVsPar = participant.picks.map((p) => {
    const v = playerTotalsVsPar.get(p.playerId);
    if (v === undefined) {
      throw new Error(`Missing tournament total for player ${p.playerId}`);
    }
    return v;
  });

  const base = sumBestFourOfFive(pickTotalsVsPar);
  const winnerBonusApplied =
    participant.winnerPickPlayerId === champion.playerId;
  const poolTotalVsPar = winnerBonusApplied
    ? base - WINNER_BONUS_VS_PAR
    : base;

  const tieBreakDistance = Math.abs(
    participant.predictedWinningScore - champion.totalStrokes,
  );

  return {
    participantId: participant.id,
    displayName: participant.displayName,
    poolTotalVsPar,
    tieBreakDistance,
    winnerBonusApplied,
    pickTotalsVsPar,
    countedPickIndices: indicesOfBestFourPicks(pickTotalsVsPar),
  };
}

/** Lower pool total first; ties broken by smaller tie-break distance (closer predicted score). */
export function comparePoolResults(
  a: ParticipantPoolResult,
  b: ParticipantPoolResult,
): number {
  if (a.poolTotalVsPar !== b.poolTotalVsPar) {
    return a.poolTotalVsPar - b.poolTotalVsPar;
  }
  return a.tieBreakDistance - b.tieBreakDistance;
}

export function rankParticipants(
  results: ParticipantPoolResult[],
): ParticipantPoolResult[] {
  return [...results].sort(comparePoolResults);
}
