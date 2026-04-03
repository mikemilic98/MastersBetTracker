"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";

type Props = { params: Promise<{ slug: string }> };

type ParticipantRow = {
  id: string;
  displayName: string;
  predictedWinningScore: number;
  winnerPickPlayerId: string;
  locked: boolean;
  picks: { sortOrder: number; playerId: string }[];
};

export function PicksPageClient({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [editToken, setEditToken] = useState(tokenFromUrl);
  const [loaded, setLoaded] = useState<ParticipantRow | null>(null);
  const [playerIds, setPlayerIds] = useState<string[]>(["", "", "", "", ""]);
  const [winnerPick, setWinnerPick] = useState("");
  const [predictedScore, setPredictedScore] = useState<number>(280);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const bootstrapped = useRef(false);

  const fetchMe = useCallback(
    async (token: string, syncUrl: boolean) => {
      const t = token.trim();
      if (!t) {
        setErr("Enter your edit token");
        return;
      }
      setErr(null);
      setLoading(true);
      try {
        const res = await fetch(
          `/api/pools/${encodeURIComponent(slug)}/participants/me?editToken=${encodeURIComponent(t)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErr(typeof data.error === "string" ? data.error : "Load failed");
          setLoaded(null);
          return;
        }
        const me = data as { participant: ParticipantRow };
        setLoaded(me.participant);
        const ordered = [...me.participant.picks].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );
        setPlayerIds(ordered.map((p) => p.playerId));
        setWinnerPick(me.participant.winnerPickPlayerId);
        setPredictedScore(me.participant.predictedWinningScore);
        if (syncUrl) {
          router.replace(
            `/pool/${encodeURIComponent(slug)}/picks?token=${encodeURIComponent(t)}`,
            { scroll: false },
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [slug, router],
  );

  useEffect(() => {
    if (bootstrapped.current) return;
    if (!tokenFromUrl.trim()) return;
    bootstrapped.current = true;
    setEditToken(tokenFromUrl);
    void fetchMe(tokenFromUrl, true);
  }, [tokenFromUrl, fetchMe]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!loaded) return;
    setErr(null);
    setSaving(true);
    try {
      const res = await fetch(
        `/api/pools/${encodeURIComponent(slug)}/participants/${encodeURIComponent(loaded.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            editToken: editToken.trim(),
            playerIds,
            winnerPickPlayerId: winnerPick,
            predictedWinningScore: predictedScore,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Save failed");
        return;
      }
      await fetchMe(editToken, false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-xl font-semibold text-neutral-100">My picks</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Paste the edit token from your organizer. It acts like a password for your
        row.
      </p>

      <div className="mt-6 space-y-3">
        <label className="block text-sm text-neutral-400">Edit token</label>
        <div className="flex gap-2">
          <input
            type="password"
            value={editToken}
            onChange={(e) => setEditToken(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => void fetchMe(editToken, true)}
            disabled={loading}
            className="shrink-0 rounded-md border border-neutral-600 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "…" : "Load"}
          </button>
        </div>
      </div>

      {err ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {err}
        </p>
      ) : null}

      {loaded ? (
        <form onSubmit={onSave} className="mt-8 space-y-6">
          <p className="text-sm text-neutral-300">
            Playing as{" "}
            <span className="font-medium text-neutral-100">
              {loaded.displayName}
            </span>
            {loaded.locked ? (
              <span className="ml-2 rounded bg-amber-950/80 px-2 py-0.5 text-xs text-amber-200">
                Locked by admin
              </span>
            ) : null}
          </p>

          <div className="space-y-3">
            <p className="text-sm font-medium text-neutral-400">
              Five picks (player ids)
            </p>
            {playerIds.map((pid, idx) => (
              <div key={idx}>
                <label className="text-xs text-neutral-500">Pick {idx + 1}</label>
                <input
                  value={pid}
                  onChange={(e) => {
                    const next = [...playerIds];
                    next[idx] = e.target.value;
                    setPlayerIds(next);
                  }}
                  disabled={loaded.locked}
                  className="mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
                  required
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-sm text-neutral-400">
              Winner pick (must match one of the five)
            </label>
            <input
              value={winnerPick}
              onChange={(e) => setWinnerPick(e.target.value)}
              disabled={loaded.locked}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label className="text-sm text-neutral-400">
              Predicted champion total strokes
            </label>
            <input
              type="number"
              min={60}
              max={400}
              value={predictedScore}
              onChange={(e) => setPredictedScore(Number(e.target.value))}
              disabled={loaded.locked}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving || loaded.locked}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save picks"}
          </button>
        </form>
      ) : null}

      <p className="mt-10 text-sm">
        <Link
          href={`/pool/${encodeURIComponent(slug)}`}
          className="text-neutral-500 hover:text-neutral-300"
        >
          ← Pool home
        </Link>
      </p>
    </main>
  );
}
