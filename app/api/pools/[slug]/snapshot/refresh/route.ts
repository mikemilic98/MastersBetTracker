import { jsonError, jsonOk } from "@/lib/api/http";
import { isAdminRequest } from "@/lib/auth/cookies";
import { prisma } from "@/lib/prisma";
import { ScrapeScoresProvider } from "@/lib/scores/scrape-provider";
import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isAdminRequest(request)) {
    return jsonError("Admin session required", 401);
  }
  const { slug } = await context.params;
  const url = process.env.SCRAPE_LEADERBOARD_URL;
  if (!url) {
    return jsonError("SCRAPE_LEADERBOARD_URL not set", 400);
  }

  const pool = await prisma.pool.findUnique({ where: { slug } });
  if (!pool) {
    return jsonError("Pool not found", 404);
  }

  try {
    const provider = new ScrapeScoresProvider({ url });
    const snap = await provider.fetchSnapshot();
    await prisma.leaderboardSnapshot.create({
      data: {
        poolId: pool.id,
        sourceUrl: snap.sourceUrl,
        payload: JSON.parse(JSON.stringify(snap)) as Prisma.InputJsonValue,
      },
    });
    return jsonOk({ ok: true, fetchedAt: snap.fetchedAt, sourceUrl: snap.sourceUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Scrape failed";
    return jsonError(msg, 502);
  }
}
