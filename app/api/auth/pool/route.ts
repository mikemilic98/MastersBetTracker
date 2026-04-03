import { jsonError, jsonOk } from "@/lib/api/http";
import { setPoolCookie } from "@/lib/auth/cookies";
import type { NextRequest } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  poolKey: z.string().min(1),
  slug: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => i.message).join("; ");
    return jsonError(
      `Invalid body (${detail}). Send JSON: { "poolKey": "...", "slug": "..." } — if using $POOL_KEY / $SLUG in curl, export them in this shell first.`,
      400,
    );
  }
  const { poolKey, slug } = parsed.data;
  const expected = process.env.POOL_KEY;
  if (!expected || poolKey !== expected) {
    return jsonError("Invalid pool key", 401);
  }
  const res = jsonOk({ ok: true, slug });
  setPoolCookie(res, slug);
  return res;
}
