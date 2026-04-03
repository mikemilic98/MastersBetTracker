import { jsonError, jsonOk } from "@/lib/api/http";
import { isAdminRequest } from "@/lib/auth/cookies";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  cutoffAt: z.string().datetime().nullable().optional(),
  picksLocked: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ slug: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
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
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid body", 400);
  }
  const data: {
    cutoffAt?: Date | null;
    picksLocked?: boolean;
  } = {};
  if (parsed.data.cutoffAt !== undefined) {
    data.cutoffAt =
      parsed.data.cutoffAt === null
        ? null
        : new Date(parsed.data.cutoffAt);
  }
  if (parsed.data.picksLocked !== undefined) {
    data.picksLocked = parsed.data.picksLocked;
  }
  if (Object.keys(data).length === 0) {
    return jsonError("No fields to update", 400);
  }
  try {
    const pool = await prisma.pool.update({
      where: { slug },
      data,
    });
    return jsonOk({ pool });
  } catch {
    return jsonError("Pool not found", 404);
  }
}
