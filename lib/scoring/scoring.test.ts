import { describe, expect, it } from "vitest";
import {
  comparePoolResults,
  indicesOfBestFourPicks,
  playerTotalVsPar,
  rankParticipants,
  scoreParticipant,
  sumBestFourOfFive,
} from "./scoring";
import type { ChampionResult, ParticipantInput } from "./types";

describe("playerTotalVsPar", () => {
  it("sums four rounds when player made the cut", () => {
    expect(
      playerTotalVsPar({
        playerId: "a",
        missedCut: false,
        rounds: { r1: -2, r2: 0, r3: 1, r4: -1 },
      }),
    ).toBe(-2);
  });

  it("imputes +2/+2 for weekend when missed cut", () => {
    expect(
      playerTotalVsPar({
        playerId: "mc",
        missedCut: true,
        rounds: { r1: 2, r2: 4, r3: null, r4: null },
      }),
    ).toBe(2 + 4 + 2 + 2);
  });
});

describe("sumBestFourOfFive", () => {
  it("drops the worst (highest) vs-par total", () => {
    const totals = [-8, -5, 1, 5, 12];
    expect(sumBestFourOfFive(totals)).toBe(-8 + -5 + 1 + 5);
  });
});

describe("indicesOfBestFourPicks", () => {
  it("returns four indices with lowest totals", () => {
    const totals = [-8, -5, 1, 5, 12];
    expect(indicesOfBestFourPicks(totals)).toEqual([0, 1, 2, 3]);
  });
});

describe("scoreParticipant (Alice / Bob / Carol example)", () => {
  const champion: ChampionResult = {
    playerId: "scottie",
    totalStrokes: 280,
  };

  const totals = new Map<string, number>([
    ["scottie", -8],
    ["rory", -5],
    ["viktor", -3],
    ["xander", -2],
    ["jt", -1],
    ["collin", 1],
    ["jon", 4],
    ["brooks", 5],
    ["tiger", 12],
    ["spieth", 12],
  ]);

  const alice: ParticipantInput = {
    id: "alice",
    displayName: "Alice",
    predictedWinningScore: 278,
    winnerPickPlayerId: "scottie",
    picks: [
      { playerId: "scottie" },
      { playerId: "rory" },
      { playerId: "collin" },
      { playerId: "brooks" },
      { playerId: "tiger" },
    ],
  };

  const bob: ParticipantInput = {
    id: "bob",
    displayName: "Bob",
    predictedWinningScore: 276,
    winnerPickPlayerId: "viktor",
    picks: [
      { playerId: "viktor" },
      { playerId: "rory" },
      { playerId: "xander" },
      { playerId: "spieth" },
      { playerId: "jon" },
    ],
  };

  const carol: ParticipantInput = {
    id: "carol",
    displayName: "Carol",
    predictedWinningScore: 280,
    winnerPickPlayerId: "scottie",
    picks: [
      { playerId: "scottie" },
      { playerId: "jt" },
      { playerId: "spieth" },
      { playerId: "brooks" },
      { playerId: "collin" },
    ],
  };

  it("computes Alice first with -10 pool total", () => {
    const r = scoreParticipant(alice, totals, champion);
    expect(r.poolTotalVsPar).toBe(-10);
    expect(r.winnerBonusApplied).toBe(true);
  });

  it("computes Bob and Carol at -6", () => {
    expect(scoreParticipant(bob, totals, champion).poolTotalVsPar).toBe(-6);
    expect(scoreParticipant(carol, totals, champion).poolTotalVsPar).toBe(-6);
  });

  it("ranks Carol ahead of Bob on tie-break (exact predicted score)", () => {
    const ra = scoreParticipant(alice, totals, champion);
    const rb = scoreParticipant(bob, totals, champion);
    const rc = scoreParticipant(carol, totals, champion);
    const ranked = rankParticipants([rb, ra, rc]);
    expect(ranked.map((x) => x.displayName)).toEqual([
      "Alice",
      "Carol",
      "Bob",
    ]);
    expect(comparePoolResults(rb, rc)).toBeGreaterThan(0);
  });
});
