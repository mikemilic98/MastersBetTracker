import { jsonError, jsonOk } from "@/lib/api/http";
import { setAdminCookie } from "@/lib/auth/cookies";
import type { NextRequest } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  adminKey: z.string().min(1),
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
    return jsonError("Invalid body", 400);
  }
  const expected = process.env.ADMIN_KEY;
  if (!expected || parsed.data.adminKey !== expected) {
    return jsonError("Invalid admin key", 401);
  }
  const res = jsonOk({ ok: true });
  setAdminCookie(res);
  return res;
}
