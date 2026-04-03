import { prisma } from "@/lib/prisma";
import { ScrapeScoresProvider } from "@/lib/scores/scrape-provider";
import type { Prisma } from "@prisma/client";

/**
 * Fetches HTML leaderboard, parses snapshot, persists for the pool.
 * @throws Error when URL missing, pool missing, or scrape fails
 */
export async function persistLeaderboardSnapshot(poolSlug: string): Promise<{
  fetchedAt: string;
  sourceUrl: string;
}> {
  const url = process.env.SCRAPE_LEADERBOARD_URL;
  if (!url) {
    throw new Error("SCRAPE_LEADERBOARD_URL not set");
  }

  const pool = await prisma.pool.findUnique({ where: { slug: poolSlug } });
  if (!pool) {
    throw new Error("Pool not found");
  }

  const provider = new ScrapeScoresProvider({ url });
  const snap = await provider.fetchSnapshot();
  await prisma.leaderboardSnapshot.create({
    data: {
      poolId: pool.id,
      sourceUrl: snap.sourceUrl,
      payload: JSON.parse(JSON.stringify(snap)) as Prisma.InputJsonValue,
    },
  });

  return { fetchedAt: snap.fetchedAt, sourceUrl: snap.sourceUrl };
}
