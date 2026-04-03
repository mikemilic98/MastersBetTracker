import { jsonError, jsonOk } from "@/lib/api/http";
import { isAdminRequest } from "@/lib/auth/cookies";
import { prisma } from "@/lib/prisma";
import { normalizePicksPayload } from "@/lib/validation/picks";
import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  displayName: z.string().min(1),
  predictedWinningScore: z.number().int().min(60).max(400),
  winnerPickPlayerId: z.string().min(1),
  playerIds: z.array(z.string().min(1)).length(5),
});

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isAdminRequest(request)) {
    return jsonError("Admin session required", 401);
  }
  const { slug } = await context.params;
  const pool = await prisma.pool.findUnique({
    where: { slug },
    include: {
      participants: {
        include: { picks: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!pool) {
    return jsonError("Pool not found", 404);
  }
  return jsonOk({
    participants: pool.participants.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      editToken: p.editToken,
      predictedWinningScore: p.predictedWinningScore,
      winnerPickPlayerId: p.winnerPickPlayerId,
      locked: p.locked,
      picks: [...p.picks].sort((a, b) => a.sortOrder - b.sortOrder),
    })),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isAdminRequest(request)) {
    return jsonError("Admin session required", 401);
  }
  const { slug } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = createSchema.safeParse(json);
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

  const pool = await prisma.pool.findUnique({ where: { slug } });
  if (!pool) {
    return jsonError("Pool not found", 404);
  }

  const editToken = randomBytes(24).toString("hex");

  const participant = await prisma.participant.create({
    data: {
      poolId: pool.id,
      displayName: parsed.data.displayName,
      editToken,
      predictedWinningScore: parsed.data.predictedWinningScore,
      winnerPickPlayerId: normalized.winnerPickPlayerId,
      picks: {
        create: normalized.playerIds.map((playerId, sortOrder) => ({
          sortOrder,
          playerId,
        })),
      },
    },
    include: { picks: true },
  });

  return jsonOk({
    participant: {
      id: participant.id,
      displayName: participant.displayName,
      predictedWinningScore: participant.predictedWinningScore,
      winnerPickPlayerId: participant.winnerPickPlayerId,
      picks: [...participant.picks].sort((a, b) => a.sortOrder - b.sortOrder),
    },
    editToken,
  });
}
