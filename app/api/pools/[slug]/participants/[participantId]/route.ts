import { jsonError, jsonOk } from "@/lib/api/http";
import { getPoolSlugFromRequest, isAdminRequest } from "@/lib/auth/cookies";
import { timingSafeStringEqual } from "@/lib/auth/token-compare";
import { prisma } from "@/lib/prisma";
import {
  assertParticipantSelfServeAllowed,
  PoolEditForbiddenError,
} from "@/lib/pool/locks";
import { normalizePicksPayload } from "@/lib/validation/picks";
import type { Pool } from "@prisma/client";
import type { NextRequest } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  editToken: z.string().optional(),
  predictedWinningScore: z.number().int().min(60).max(400),
  winnerPickPlayerId: z.string().min(1),
  playerIds: z.array(z.string().min(1)).length(5),
});

type RouteContext = {
  params: Promise<{ slug: string; participantId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
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

  let normalized: ReturnType<typeof normalizePicksPayload>;
  try {
    normalized = normalizePicksPayload(
      parsed.data.playerIds,
      parsed.data.winnerPickPlayerId,
    );
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Invalid picks", 400);
  }

  const pool = await prisma.pool.findUnique({
    where: { slug },
    include: {
      participants: {
        where: { id: participantId },
        include: { picks: true },
      },
    },
  });

  if (!pool || pool.participants.length === 0) {
    return jsonError("Participant not found", 404);
  }

  const participant = pool.participants[0]!;
  const poolRow: Pool = {
    id: pool.id,
    slug: pool.slug,
    name: pool.name,
    cutoffAt: pool.cutoffAt,
    picksLocked: pool.picksLocked,
    createdAt: pool.createdAt,
    updatedAt: pool.updatedAt,
  };

  const admin = isAdminRequest(request);

  if (!admin) {
    const cookieSlug = getPoolSlugFromRequest(request);
    if (cookieSlug !== slug) {
      return jsonError("Pool session required", 401);
    }
    const token = parsed.data.editToken;
    if (!token || !timingSafeStringEqual(token, participant.editToken)) {
      return jsonError("Invalid edit token", 401);
    }
    try {
      assertParticipantSelfServeAllowed(poolRow, participant);
    } catch (e) {
      if (e instanceof PoolEditForbiddenError) {
        return jsonError(e.message, 403);
      }
      throw e;
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.pick.deleteMany({ where: { participantId: participant.id } });
    await tx.participant.update({
      where: { id: participant.id },
      data: {
        predictedWinningScore: parsed.data.predictedWinningScore,
        winnerPickPlayerId: normalized.winnerPickPlayerId,
      },
    });
    for (let i = 0; i < 5; i++) {
      await tx.pick.create({
        data: {
          participantId: participant.id,
          sortOrder: i,
          playerId: normalized.playerIds[i]!,
        },
      });
    }
  });

  const updated = await prisma.participant.findUniqueOrThrow({
    where: { id: participant.id },
    include: { picks: true },
  });

  return jsonOk({
    participant: {
      id: updated.id,
      displayName: updated.displayName,
      predictedWinningScore: updated.predictedWinningScore,
      winnerPickPlayerId: updated.winnerPickPlayerId,
      picks: [...updated.picks].sort((a, b) => a.sortOrder - b.sortOrder),
    },
  });
}
