import { prisma } from "@/lib/prisma";
import { detectLeaderboardParserKind } from "@/lib/scores/detect-parser";
import { ScrapeScoresProvider } from "@/lib/scores/scrape-provider";
import type { Prisma } from "@prisma/client";

const PGA_FETCH_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

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

  const parser = detectLeaderboardParserKind(url);
  const provider = new ScrapeScoresProvider({
    url,
    parser,
    fetch:
      parser === "pga-next-data"
        ? { userAgent: PGA_FETCH_UA, timeoutMs: 30_000 }
        : undefined,
  });
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
