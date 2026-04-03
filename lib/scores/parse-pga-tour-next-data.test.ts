import { describe, expect, it } from "vitest";
import { parsePgaTourNextDataHtml } from "./parse-pga-tour-next-data";

const minimalHtml = `<!DOCTYPE html><html><head></head><body>
<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
  props: {
    pageProps: {
      dehydratedState: {
        queries: [
          {
            queryKey: ["leaderboard", { leaderboardId: "R2099999" }],
            state: {
              status: "success",
              data: {
                tournamentStatus: "IN_PROGRESS",
                players: [
                  {
                    player: { displayName: "Test Player" },
                    scoringData: {
                      position: "1",
                      totalSort: -5,
                      totalStrokesSort: 139,
                      rounds: ["70", "69", "-", "-"],
                      playerState: "ACTIVE",
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  },
})}</script>
</body></html>`;

describe("parsePgaTourNextDataHtml", () => {
  it("parses __NEXT_DATA__ leaderboard query", () => {
    const snap = parsePgaTourNextDataHtml(minimalHtml, "https://www.pgatour.com/leaderboard");
    expect(snap.players).toHaveLength(1);
    const p = snap.players[0]!;
    expect(p.name).toBe("Test Player");
    expect(p.position).toBe(1);
    expect(p.tournamentVsPar).toBe(-5);
    expect(p.totalStrokes).toBe(139);
    expect(p.roundsVsPar.r1).toBe(70 - 72);
    expect(p.roundsVsPar.r2).toBe(69 - 72);
    expect(p.missedCut).toBe(false);
    expect(snap.champion).toBeUndefined();
  });
});
