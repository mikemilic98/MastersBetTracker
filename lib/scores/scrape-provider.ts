import {
  detectLeaderboardParserKind,
  type LeaderboardParserKind,
} from "./detect-parser";
import { fetchHtml } from "./fetch-html";
import { parseLeaderboardHtml } from "./parse-html";
import { parsePgaTourNextDataHtml } from "./parse-pga-tour-next-data";
import type {
  FetchHtmlOptions,
  LeaderboardSnapshot,
  ParseHtmlOptions,
} from "./types";

export type ScrapeScoresProviderOptions = {
  url: string;
  fetch?: FetchHtmlOptions;
  parse?: ParseHtmlOptions;
  /** Override auto-detect (see {@link detectLeaderboardParserKind}). */
  parser?: LeaderboardParserKind;
};

/**
 * {@link ScoresProvider} backed by HTTP GET + HTML parse (e.g. public leaderboard page).
 */
export class ScrapeScoresProvider {
  constructor(private readonly opts: ScrapeScoresProviderOptions) {}

  async fetchSnapshot(): Promise<LeaderboardSnapshot> {
    const html = await fetchHtml(this.opts.url, this.opts.fetch);
    const kind =
      this.opts.parser ?? detectLeaderboardParserKind(this.opts.url);
    if (kind === "pga-next-data") {
      return parsePgaTourNextDataHtml(html, this.opts.url);
    }
    return parseLeaderboardHtml(html, this.opts.url, this.opts.parse);
  }
}

export type ScoresProvider = {
  fetchSnapshot(): Promise<LeaderboardSnapshot>;
};
