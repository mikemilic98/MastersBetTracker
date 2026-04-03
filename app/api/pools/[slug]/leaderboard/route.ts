import { jsonError, jsonOk } from "@/lib/api/http";
import { getPoolSlugFromRequest } from "@/lib/auth/cookies";
import { computePoolLeaderboard } from "@/lib/leaderboard/compute";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const publicLb = process.env.LEADERBOARD_PUBLIC === "true";
  const cookieSlug = getPoolSlugFromRequest(request);
  if (!publicLb && cookieSlug !== slug) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const data = await computePoolLeaderboard(slug);
    return jsonOk(data);
  } catch (e) {
    if (e instanceof Error && e.message === "Pool not found") {
      return jsonError("Pool not found", 404);
    }
    const msg = e instanceof Error ? e.message : "Leaderboard error";
    return jsonError(msg, 500);
  }
}
