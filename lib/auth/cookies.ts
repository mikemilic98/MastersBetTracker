import type { NextRequest, NextResponse } from "next/server";
import { COOKIE_ADMIN, COOKIE_POOL_SLUG } from "./constants";

const baseOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export function setPoolCookie(res: NextResponse, slug: string): void {
  res.cookies.set(COOKIE_POOL_SLUG, slug, baseOpts);
}

export function setAdminCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_ADMIN, "1", baseOpts);
}

export function clearPoolCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_POOL_SLUG, "", { ...baseOpts, maxAge: 0 });
}

export function clearAdminCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_ADMIN, "", { ...baseOpts, maxAge: 0 });
}

export function getPoolSlugFromRequest(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_POOL_SLUG)?.value ?? null;
}

export function isAdminRequest(request: NextRequest): boolean {
  return request.cookies.get(COOKIE_ADMIN)?.value === "1";
}
