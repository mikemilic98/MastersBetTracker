"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteNav() {
  const [session, setSession] = useState<{
    admin: boolean;
    poolSlug: string | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => r.json())
      .then(setSession)
      .catch(() => setSession({ admin: false, poolSlug: null }));
  }, []);

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/"
            className="font-medium text-neutral-100 hover:text-white"
          >
            Masters Bet Tracker
          </Link>
          {session?.admin ? (
            <Link
              href="/admin"
              className="text-amber-200/90 hover:text-amber-100"
            >
              Admin
            </Link>
          ) : (
            <Link
              href="/admin/login"
              className="text-neutral-500 hover:text-neutral-300"
            >
              Admin
            </Link>
          )}
        </nav>
        {session?.poolSlug ? (
          <span className="text-xs text-neutral-500">
            Pool session:{" "}
            <Link
              href={`/pool/${encodeURIComponent(session.poolSlug)}`}
              className="text-emerald-400/90 hover:text-emerald-300"
            >
              {session.poolSlug}
            </Link>
          </span>
        ) : null}
      </div>
    </header>
  );
}
