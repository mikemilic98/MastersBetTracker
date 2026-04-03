import { jsonError, jsonOk } from "@/lib/api/http";
import { isAdminRequest } from "@/lib/auth/cookies";
import { persistLeaderboardSnapshot } from "@/lib/leaderboard/refresh-snapshot";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isAdminRequest(request)) {
    return jsonError("Admin session required", 401);
  }
  const { slug } = await context.params;

  try {
    const { fetchedAt, sourceUrl } = await persistLeaderboardSnapshot(slug);
    return jsonOk({ ok: true, fetchedAt, sourceUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Scrape failed";
    if (msg === "Pool not found") {
      return jsonError("Pool not found", 404);
    }
    if (msg === "SCRAPE_LEADERBOARD_URL not set") {
      return jsonError(msg, 400);
    }
    return jsonError(msg, 502);
  }
}
