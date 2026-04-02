import { fetchHtml } from "./fetch-html";
import { parseLeaderboardHtml } from "./parse-html";
import type {
  FetchHtmlOptions,
  LeaderboardSnapshot,
  ParseHtmlOptions,
} from "./types";

export type ScrapeScoresProviderOptions = {
  url: string;
  fetch?: FetchHtmlOptions;
  parse?: ParseHtmlOptions;
};

/**
 * {@link ScoresProvider} backed by HTTP GET + HTML parse (e.g. public leaderboard page).
 */
export class ScrapeScoresProvider {
  constructor(private readonly opts: ScrapeScoresProviderOptions) {}

  async fetchSnapshot(): Promise<LeaderboardSnapshot> {
    const html = await fetchHtml(this.opts.url, this.opts.fetch);
    return parseLeaderboardHtml(html, this.opts.url, this.opts.parse);
  }
}

export type ScoresProvider = {
  fetchSnapshot(): Promise<LeaderboardSnapshot>;
};
