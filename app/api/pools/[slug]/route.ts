import { jsonError, jsonOk } from "@/lib/api/http";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const pool = await prisma.pool.findUnique({
    where: { slug },
    include: { _count: { select: { participants: true } } },
  });
  if (!pool) {
    return jsonError("Pool not found", 404);
  }
  return jsonOk({
    id: pool.id,
    slug: pool.slug,
    name: pool.name,
    cutoffAt: pool.cutoffAt,
    picksLocked: pool.picksLocked,
    participantCount: pool._count.participants,
    createdAt: pool.createdAt,
  });
}
