import { z } from "zod";

const scrapedPlayerSchema = z.object({
  position: z.number(),
  name: z.string(),
  nameKey: z.string(),
  roundsVsPar: z.object({
    r1: z.number(),
    r2: z.number(),
    r3: z.number().nullable(),
    r4: z.number().nullable(),
  }),
  missedCut: z.boolean(),
  totalStrokes: z.number().optional(),
});

export const leaderboardSnapshotSchema = z.object({
  fetchedAt: z.string(),
  sourceUrl: z.string(),
  players: z.array(scrapedPlayerSchema),
  champion: z
    .object({
      name: z.string(),
      nameKey: z.string(),
      totalStrokes: z.number(),
    })
    .optional(),
});

export function parseSnapshotPayload(json: unknown) {
  return leaderboardSnapshotSchema.parse(json);
}
