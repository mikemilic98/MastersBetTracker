/**
 * Normalized leaderboard snapshot produced by a {@link ScoresProvider}
 * (HTML scrape or future JSON API). Used with scoring after name→id mapping.
 */

export type ScrapedPlayer = {
  /** Position on the leaderboard (1 = leader). */
  position: number;
  /** Name as shown on the source page. */
  name: string;
  /** Lowercased trimmed key for fuzzy matching to pool player ids. */
  nameKey: string;
  roundsVsPar: {
    r1: number;
    r2: number;
    r3: number | null;
    r4: number | null;
  };
  missedCut: boolean;
  /**
   * When set (e.g. PGA TOUR live JSON), used as the player’s total vs par for pool
   * math instead of summing `roundsVsPar` — needed while R3/R4 are not yet played.
   */
  tournamentVsPar?: number;
  /** Total strokes if the page exposes it (tie-break / champion). */
  totalStrokes?: number;
};

export type LeaderboardSnapshot = {
  /** ISO timestamp when the snapshot was produced. */
  fetchedAt: string;
  sourceUrl: string;
  /** Parsed rows (entire field or subset, depending on HTML). */
  players: ScrapedPlayer[];
  /**
   * When the source marks the tournament finished, champion info for tie-break.
   * Otherwise omit and treat as in-progress.
   */
  champion?: {
    name: string;
    nameKey: string;
    totalStrokes: number;
  };
};

export type ParseHtmlOptions = {
  /** CSS selector for each player row (default: rows under `[data-masters-snapshot]`). */
  rowSelector?: string;
  /** Root selector for the table (default `[data-masters-snapshot]`). */
  rootSelector?: string;
};

export type FetchHtmlOptions = {
  timeoutMs?: number;
  userAgent?: string;
};
