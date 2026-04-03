"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

type Props = { params: Promise<{ slug: string }> };

export default function PoolLoginPage({ params }: Props) {
  const { slug: resolvedSlug } = use(params);
  const router = useRouter();
  const [poolKey, setPoolKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ poolKey, slug: resolvedSlug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Login failed");
        return;
      }
      router.refresh();
      router.push(`/pool/${encodeURIComponent(resolvedSlug)}/leaderboard`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-xl font-semibold text-neutral-100">Pool key</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Enter the shared pool key to set a browser session for this pool (needed
        to view the leaderboard unless{" "}
        <code className="rounded bg-neutral-800 px-1 text-xs">LEADERBOARD_PUBLIC</code>{" "}
        is enabled).
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm text-neutral-400">Pool key</label>
          <input
            type="password"
            autoComplete="off"
            value={poolKey}
            onChange={(e) => setPoolKey(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            required
          />
        </div>
        {err ? (
          <p className="text-sm text-red-400" role="alert">
            {err}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Continue"}
        </button>
      </form>
      <p className="mt-8 text-sm">
        <Link
          href={`/pool/${encodeURIComponent(resolvedSlug)}`}
          className="text-neutral-500 hover:text-neutral-300"
        >
          ← Back to pool
        </Link>
      </p>
    </main>
  );
}
