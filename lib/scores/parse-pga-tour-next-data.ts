import * as cheerio from "cheerio";
import { normalizePlayerIdKey } from "@/lib/normalize-player-id";
import { ROUND_PAR } from "@/lib/scoring/types";
import type { LeaderboardSnapshot, ScrapedPlayer } from "./types";

/** Strokes string per round; "-" = not played yet. */
function roundVsPar(strokesCell: string | undefined): number | null {
  if (strokesCell === undefined || strokesCell === "" || strokesCell === "-") {
    return null;
  }
  const n = Number(strokesCell);
  if (!Number.isFinite(n)) return null;
  return n - ROUND_PAR;
}

type NextData = {
  props?: {
    pageProps?: {
      dehydratedState?: {
        queries?: Array<{
          queryKey?: unknown;
          state?: { status?: string; data?: PgaLeaderboardPayload };
        }>;
      };
    };
  };
};

type PgaLeaderboardPayload = {
  tournamentStatus?: string;
  players?: PgaPlayerRow[];
};

type PgaPlayerRow = {
  player?: {
    displayName?: string;
  };
  scoringData?: {
    position?: string;
    totalSort?: number;
    totalStrokesSort?: number;
    rounds?: string[];
    playerState?: string;
  };
};

function findLeaderboardPayload(
  nextData: NextData,
): { data: PgaLeaderboardPayload; tournamentComplete: boolean } | null {
  const queries = nextData.props?.pageProps?.dehydratedState?.queries;
  if (!queries?.length) return null;

  for (const q of queries) {
    const key = q.queryKey;
    if (
      Array.isArray(key) &&
      key[0] === "leaderboard" &&
      q.state?.status === "success" &&
      q.state.data?.players
    ) {
      const data = q.state.data;
      const tournamentComplete =
        data.tournamentStatus === "COMPLETE" ||
        data.tournamentStatus === "OFFICIAL";
      return { data, tournamentComplete };
    }
  }
  return null;
}

/** Parses PGA TOUR Next.js HTML: JSON in `#__NEXT_DATA__` (React Query `leaderboard`). */
export function parsePgaTourNextDataHtml(
  html: string,
  sourceUrl: string,
): LeaderboardSnapshot {
  const $ = cheerio.load(html);
  const raw = $("#__NEXT_DATA__").html();
  if (!raw) {
    throw new Error(
      "No __NEXT_DATA__ script found; page may not be PGA TOUR Next.js HTML",
    );
  }

  let nextData: NextData;
  try {
    nextData = JSON.parse(raw) as NextData;
  } catch {
    throw new Error("Failed to parse __NEXT_DATA__ JSON");
  }

  const found = findLeaderboardPayload(nextData);
  if (!found) {
    throw new Error("No leaderboard query in __NEXT_DATA__ dehydratedState");
  }

  const { data: lb, tournamentComplete } = found;
  const rows = lb.players ?? [];
  const players: ScrapedPlayer[] = [];

  for (const row of rows) {
    const sd = row.scoringData;
    const player = row.player;
    if (!sd || !player?.displayName) continue;

    const name = player.displayName.trim();
    const nameKey = normalizePlayerIdKey(name);

    const pos = Number.parseInt(String(sd.position ?? ""), 10);
    const position = Number.isFinite(pos) ? pos : players.length + 1;

    const rounds = sd.rounds ?? [];
    const r1 = roundVsPar(rounds[0]);
    const r2 = roundVsPar(rounds[1]);
    const r3 = roundVsPar(rounds[2]);
    const r4 = roundVsPar(rounds[3]);

    const mc =
      sd.playerState === "CUT" ||
      sd.playerState === "WD" ||
      sd.playerState === "DQ" ||
      sd.playerState === "MDF";

    if (r1 === null || r2 === null) {
      continue;
    }

    // In-progress rounds: allow null r3/r4 when not MC (we use totalSort for pool total).
    const roundsVsPar = {
      r1,
      r2,
      r3: mc ? null : r3,
      r4: mc ? null : r4,
    };

    const tournamentVsPar =
      typeof sd.totalSort === "number" ? sd.totalSort : undefined;

    const totalStrokes =
      typeof sd.totalStrokesSort === "number" ? sd.totalStrokesSort : undefined;

    players.push({
      position,
      name,
      nameKey,
      roundsVsPar,
      missedCut: mc,
      tournamentVsPar,
      totalStrokes,
    });
  }

  if (players.length === 0) {
    throw new Error("No players parsed from PGA TOUR leaderboard");
  }

  players.sort((a, b) => a.position - b.position);

  let champion: LeaderboardSnapshot["champion"];
  if (tournamentComplete) {
    const first = players.find((p) => p.position === 1) ?? players[0];
    if (first?.totalStrokes !== undefined) {
      champion = {
        name: first.name,
        nameKey: first.nameKey,
        totalStrokes: first.totalStrokes,
      };
    }
  }

  return {
    fetchedAt: new Date().toISOString(),
    sourceUrl,
    players,
    champion,
  };
}
