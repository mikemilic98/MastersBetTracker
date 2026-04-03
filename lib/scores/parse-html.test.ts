import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseLeaderboardHtml } from "./parse-html";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("parseLeaderboardHtml", () => {
  it("parses fixture with champion and missed cut", () => {
    const html = readFileSync(
      join(__dirname, "fixtures", "sample-leaderboard.html"),
      "utf-8",
    );
    const snap = parseLeaderboardHtml(html, "https://example.test/leaderboard");

    expect(snap.players).toHaveLength(6);
    expect(snap.players[0]?.name).toBe("Scottie Scheffler");
    expect(snap.players[0]?.missedCut).toBe(false);
    expect(snap.players.find((p) => p.name === "Tiger Woods")?.missedCut).toBe(
      true,
    );
    expect(snap.champion?.totalStrokes).toBe(280);
    expect(snap.champion?.nameKey).toBe("scottie scheffler");
  });

  it("throws when no rows match", () => {
    expect(() =>
      parseLeaderboardHtml("<html></html>", "https://example.test/empty"),
    ).toThrow(/No player rows/);
  });
});
