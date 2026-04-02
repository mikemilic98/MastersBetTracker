import * as cheerio from "cheerio";
import type {
  LeaderboardSnapshot,
  ParseHtmlOptions,
  ScrapedPlayer,
} from "./types";

function normalizeNameKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Cheerio row selection; structural type avoids coupling to domhandler. */
type Row = { attr(name: string): string | undefined };

function parseNum(el: Row, attr: string): number | null {
  const v = el.attr(attr);
  if (v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseBool(el: Row, attr: string): boolean {
  const v = el.attr(attr)?.toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/**
 * Parses our **contract** HTML shape: a table with `data-masters-snapshot` and
 * rows using `data-name`, `data-r1`…`data-r4`, `data-mc`, optional `data-pos`,
 * `data-total-strokes`. Real-world pages will need different selectors; keep
 * parsing logic versioned and covered by fixtures.
 */
export function parseLeaderboardHtml(
  html: string,
  sourceUrl: string,
  options: ParseHtmlOptions = {},
): LeaderboardSnapshot {
  const $ = cheerio.load(html);
  const rootSel = options.rootSelector ?? "[data-masters-snapshot]";
  const rowSel = options.rowSelector ?? `${rootSel} tr[data-name]`;

  const root = $(rootSel);
  const tournamentComplete = parseBool(root, "data-tournament-complete");

  const players: ScrapedPlayer[] = [];
  $(rowSel).each((_, el) => {
    const row = $(el);
    const name = row.attr("data-name")?.trim();
    if (!name) return;

    const missedCut = parseBool(row, "data-mc");
    const r1 = parseNum(row, "data-r1");
    const r2 = parseNum(row, "data-r2");
    const r3 = parseNum(row, "data-r3");
    const r4 = parseNum(row, "data-r4");
    const pos = parseNum(row, "data-pos");
    const totalStrokes = parseNum(row, "data-total-strokes") ?? undefined;

    if (r1 === null || r2 === null) {
      throw new Error(`Row for "${name}" missing r1/r2 vs par`);
    }
    if (!missedCut && (r3 === null || r4 === null)) {
      throw new Error(
        `Row for "${name}" is not MC but missing r3/r4 vs par`,
      );
    }

    players.push({
      position: pos ?? players.length + 1,
      name,
      nameKey: normalizeNameKey(name),
      roundsVsPar: {
        r1,
        r2,
        r3: missedCut ? null : r3,
        r4: missedCut ? null : r4,
      },
      missedCut,
      totalStrokes,
    });
  });

  if (players.length === 0) {
    throw new Error("No player rows parsed; check selectors or HTML shape");
  }

  players.sort((a, b) => a.position - b.position);

  let champion: LeaderboardSnapshot["champion"];
  if (tournamentComplete) {
    const first =
      players.find((p) => p.position === 1) ?? players[0] ?? undefined;
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
