import { jsonError, jsonOk } from "@/lib/api/http";
import { isAdminRequest } from "@/lib/auth/cookies";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  locked: z.boolean(),
});

type RouteContext = {
  params: Promise<{ slug: string; participantId: string }>;
};

/** Admin-only: toggle per-participant lock. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isAdminRequest(request)) {
    return jsonError("Admin session required", 401);
  }
  const { slug, participantId } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid body", 400);
  }

  const pool = await prisma.pool.findUnique({ where: { slug } });
  if (!pool) {
    return jsonError("Pool not found", 404);
  }

  const participant = await prisma.participant.findFirst({
    where: { id: participantId, poolId: pool.id },
  });
  if (!participant) {
    return jsonError("Participant not found", 404);
  }

  const updated = await prisma.participant.update({
    where: { id: participant.id },
    data: { locked: parsed.data.locked },
    include: { picks: true },
  });

  return jsonOk({
    participant: {
      id: updated.id,
      displayName: updated.displayName,
      editToken: updated.editToken,
      locked: updated.locked,
      predictedWinningScore: updated.predictedWinningScore,
      winnerPickPlayerId: updated.winnerPickPlayerId,
      picks: [...updated.picks].sort((a, b) => a.sortOrder - b.sortOrder),
    },
  });
}
