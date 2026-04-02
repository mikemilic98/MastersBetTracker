/** Par per round at Augusta for pool math (strokes − par per round). */
export const ROUND_PAR = 72;

export type PlayerId = string;

/** Per-round strokes vs par; use null for a round not played (before imputation). */
export type RoundVsPar = {
  r1: number;
  r2: number;
  r3: number | null;
  r4: number | null;
};

export type PlayerTournamentInput = {
  playerId: PlayerId;
  /** If true, missing weekend rounds are imputed +2/+2 vs par each. */
  missedCut: boolean;
  rounds: RoundVsPar;
};

export type PickInput = {
  playerId: PlayerId;
};

export type ParticipantInput = {
  id: string;
  displayName: string;
  /** Predicted champion total strokes (tie-breaker). */
  predictedWinningScore: number;
  picks: PickInput[];
  /** Must be one of the five playerIds. */
  winnerPickPlayerId: PlayerId;
};

export type ChampionResult = {
  playerId: PlayerId;
  /** Actual total strokes for the champion (for tie-break distance). */
  totalStrokes: number;
};

export type ParticipantPoolResult = {
  participantId: string;
  displayName: string;
  poolTotalVsPar: number;
  /** Absolute distance for tie-break (lower is better when pool totals tie). */
  tieBreakDistance: number;
  winnerBonusApplied: boolean;
  /** The five per-pick totals vs par (after MC rules). */
  pickTotalsVsPar: number[];
  /** Indices of picks that counted toward the sum (four best), 0–4. */
  countedPickIndices: number[];
};
