import { jsonOk } from "@/lib/api/http";
import { clearAdminCookie, clearPoolCookie } from "@/lib/auth/cookies";
import type { NextRequest } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  scope: z.enum(["pool", "admin", "all"]).optional().default("all"),
});

export async function POST(request: NextRequest) {
  let scope: z.infer<typeof bodySchema>["scope"] = "all";
  try {
    const json = await request.json();
    const p = bodySchema.safeParse(json);
    if (p.success) scope = p.data.scope;
  } catch {
    /* empty body ok */
  }
  const res = jsonOk({ ok: true });
  if (scope === "pool" || scope === "all") clearPoolCookie(res);
  if (scope === "admin" || scope === "all") clearAdminCookie(res);
  return res;
}
