import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim().toLowerCase();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.redirect(
    new URL(`/pool/${encodeURIComponent(slug)}`, request.url),
  );
}
