"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type PoolRow = {
  id: string;
  slug: string;
  name: string;
  cutoffAt: string | null;
  picksLocked: boolean;
  participantCount: number;
  createdAt: string;
};

export default function AdminHomePage() {
  const router = useRouter();
  const [pools, setPools] = useState<PoolRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/admin/pools", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "Failed to load pools");
      setPools([]);
      return;
    }
    setPools((data as { pools: PoolRow[] }).pools);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), slug: slug.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Create failed");
        return;
      }
      setName("");
      setSlug("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ scope: "admin" }),
    });
    router.refresh();
    router.push("/admin/login");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-neutral-100">Admin</h1>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          Log out
        </button>
      </div>

      <section className="mt-10 rounded-lg border border-neutral-800 bg-neutral-950/50 p-6">
        <h2 className="text-sm font-medium text-neutral-300">Create pool</h2>
        <form onSubmit={onCreate} className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[160px] flex-1">
            <label className="text-xs text-neutral-500">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
              required
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="text-xs text-neutral-500">Slug (a-z, 0-9, -)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              pattern="[a-z0-9-]+"
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100"
              required
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </form>
        {err ? (
          <p className="mt-3 text-sm text-red-400">{err}</p>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-neutral-300">Pools</h2>
        {pools === null ? (
          <p className="mt-4 text-neutral-500">Loading…</p>
        ) : pools.length === 0 ? (
          <p className="mt-4 text-neutral-500">No pools yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {pools.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-neutral-200">{p.name}</p>
                  <p className="font-mono text-xs text-neutral-500">{p.slug}</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    {p.participantCount} participants
                    {p.picksLocked ? " · picks locked" : ""}
                  </p>
                </div>
                <Link
                  href={`/admin/pool/${encodeURIComponent(p.slug)}`}
                  className="text-sm text-amber-400 hover:text-amber-300"
                >
                  Manage →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-sm">
        <Link href="/" className="text-neutral-500 hover:text-neutral-300">
          ← Home
        </Link>
      </p>
    </main>
  );
}
