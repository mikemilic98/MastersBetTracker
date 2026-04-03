import { jsonError, jsonOk } from "@/lib/api/http";
import { timingSafeStringEqual } from "@/lib/auth/token-compare";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ slug: string }> };

/** Participant self-fetch by edit token (no admin). */
export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const editToken = request.nextUrl.searchParams.get("editToken");
  if (!editToken || editToken.length < 8) {
    return jsonError("editToken query required", 400);
  }

  const pool = await prisma.pool.findUnique({
    where: { slug },
    include: {
      participants: { include: { picks: true } },
    },
  });
  if (!pool) {
    return jsonError("Pool not found", 404);
  }

  const participant = pool.participants.find((p) =>
    timingSafeStringEqual(p.editToken, editToken),
  );
  if (!participant) {
    return jsonError("Invalid edit token", 401);
  }

  return jsonOk({
    participant: {
      id: participant.id,
      displayName: participant.displayName,
      predictedWinningScore: participant.predictedWinningScore,
      winnerPickPlayerId: participant.winnerPickPlayerId,
      locked: participant.locked,
      picks: [...participant.picks].sort((a, b) => a.sortOrder - b.sortOrder),
    },
  });
}
