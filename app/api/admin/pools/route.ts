import { jsonError, jsonOk } from "@/lib/api/http";
import { isAdminRequest } from "@/lib/auth/cookies";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
});

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return jsonError("Admin session required", 401);
  }
  const pools = await prisma.pool.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { participants: true } } },
  });
  return jsonOk({
    pools: pools.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      cutoffAt: p.cutoffAt?.toISOString() ?? null,
      picksLocked: p.picksLocked,
      participantCount: p._count.participants,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return jsonError("Admin session required", 401);
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid body", 400);
  }
  try {
    const pool = await prisma.pool.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
      },
    });
    return jsonOk({ pool });
  } catch (e: unknown) {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return jsonError("Pool slug already exists", 409);
    }
    throw e;
  }
}
