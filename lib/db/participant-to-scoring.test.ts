import { describe, expect, it } from "vitest";
import { participantToParticipantInput } from "./participant-to-scoring";

function samplePicks(playerIds: string[]) {
  return playerIds.map((playerId, sortOrder) => ({ sortOrder, playerId }));
}

describe("participantToParticipantInput", () => {
  it("maps sorted picks to ParticipantInput", () => {
    const ids = ["a", "b", "c", "d", "e"];
    const input = participantToParticipantInput({
      id: "p1",
      displayName: "Alex",
      predictedWinningScore: 280,
      winnerPickPlayerId: "c",
      picks: samplePicks(ids),
    });
    expect(input.picks.map((x) => x.playerId)).toEqual(ids);
    expect(input.winnerPickPlayerId).toBe("c");
  });

  it("sorts picks by sortOrder", () => {
    const input = participantToParticipantInput({
      id: "p1",
      displayName: "Alex",
      predictedWinningScore: 280,
      winnerPickPlayerId: "a",
      picks: [
        { sortOrder: 4, playerId: "e" },
        { sortOrder: 0, playerId: "a" },
        { sortOrder: 2, playerId: "c" },
        { sortOrder: 1, playerId: "b" },
        { sortOrder: 3, playerId: "d" },
      ],
    });
    expect(input.picks.map((x) => x.playerId)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
  });

  it("throws if winner not among picks", () => {
    expect(() =>
      participantToParticipantInput({
        id: "p1",
        displayName: "Alex",
        predictedWinningScore: 280,
        winnerPickPlayerId: "x",
        picks: samplePicks(["a", "b", "c", "d", "e"]),
      }),
    ).toThrow(/Winner pick must be one of the five players/);
  });
});
