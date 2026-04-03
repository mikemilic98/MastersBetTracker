import { jsonError, jsonOk } from "@/lib/api/http";
import { persistLeaderboardSnapshot } from "@/lib/leaderboard/refresh-snapshot";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

/**
 * Scheduled refresh for all pools (same SCRAPE_LEADERBOARD_URL).
 * Protect with CRON_SECRET: Authorization: Bearer <secret> or ?secret=
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return jsonError("CRON_SECRET not configured", 503);
  }
  const auth = request.headers.get("authorization");
  const bearer =
    auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const q = request.nextUrl.searchParams.get("secret");
  const ok =
    (bearer && bearer === secret) || (q !== null && q === secret);
  if (!ok) {
    return jsonError("Unauthorized", 401);
  }

  if (!process.env.SCRAPE_LEADERBOARD_URL) {
    return jsonError("SCRAPE_LEADERBOARD_URL not set", 400);
  }

  const pools = await prisma.pool.findMany({ select: { slug: true } });
  const results: { slug: string; ok: boolean; error?: string }[] = [];

  for (const { slug } of pools) {
    try {
      await persistLeaderboardSnapshot(slug);
      results.push({ slug, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      results.push({ slug, ok: false, error: msg });
    }
  }

  return jsonOk({ refreshed: results.length, results });
}
