import { jsonOk } from "@/lib/api/http";
import { getPoolSlugFromRequest, isAdminRequest } from "@/lib/auth/cookies";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return jsonOk({
    admin: isAdminRequest(request),
    poolSlug: getPoolSlugFromRequest(request),
  });
}
