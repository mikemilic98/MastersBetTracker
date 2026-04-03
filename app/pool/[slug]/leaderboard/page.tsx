"use client";

import type { ParticipantPoolResult } from "@/lib/scoring/types";
import Link from "next/link";
import { Fragment, use, useEffect, useRef, useState } from "react";

const POLL_MS = 10_000;

type Props = { params: Promise<{ slug: string }> };

export default function LeaderboardPage({ params }: Props) {
  const { slug } = use(params);
  const [data, setData] = useState<{
    results: ParticipantPoolResult[];
    snapshotFetchedAt: string | null;
    sourceUrl: string | null;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const loadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadedOnce.current = false;
    setData(null);
    setErr(null);
    setOpenId(null);

    async function load() {
      try {
        const res = await fetch(
          `/api/pools/${encodeURIComponent(slug)}/leaderboard`,
          { credentials: "include", cache: "no-store" },
        );
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof j.error === "string" ? j.error : `HTTP ${res.status}`,
          );
        }
        const d = j as {
          results: ParticipantPoolResult[];
          snapshotFetchedAt: string | null;
          sourceUrl: string | null;
        };
        if (!cancelled) {
          loadedOnce.current = true;
          setData(d);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          if (!loadedOnce.current) {
            setErr(e instanceof Error ? e.message : "Load failed");
          }
        }
      }
    }

    function tick() {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      void load();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        void load();
      }
    }

    void load();
    const intervalId = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [slug]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">
            Leaderboard
          </h1>
          <p className="mt-1 font-mono text-sm text-neutral-500">{slug}</p>
        </div>
        <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-xs text-neutral-600">
            Refreshes every {POLL_MS / 1000}s
          </p>
          <Link
            href={`/pool/${encodeURIComponent(slug)}/login`}
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            Pool key
          </Link>
        </div>
      </div>
      {data?.snapshotFetchedAt ? (
        <p className="mt-4 text-xs text-neutral-500">
          Snapshot:{" "}
          {new Date(data.snapshotFetchedAt).toLocaleString()}
          {data.sourceUrl ? (
            <>
              {" "}
              ·{" "}
              <span className="break-all text-neutral-600">{data.sourceUrl}</span>
            </>
          ) : null}
        </p>
      ) : null}

      {err ? (
        <p className="mt-8 rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {err}
          {err === "Unauthorized" ? (
            <span className="mt-2 block text-red-400/80">
              Use “Pool key” above or ask the organizer to enable{" "}
              <code className="rounded bg-neutral-900 px-1">LEADERBOARD_PUBLIC</code>.
            </span>
          ) : null}
        </p>
      ) : null}

      {!err && !data ? (
        <p className="mt-8 text-neutral-500">Loading…</p>
      ) : null}

      {data && data.results.length === 0 ? (
        <p className="mt-8 text-neutral-400">
          No scores yet. The organizer needs to refresh the leaderboard snapshot
          after scraping is configured.
        </p>
      ) : null}

      {data && data.results.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Pool total (vs par)</th>
                <th className="px-4 py-3 font-medium">Tie-break Δ</th>
                <th className="px-4 py-3 font-medium">Winner −3</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {data.results.map((row, i) => (
                <Fragment key={row.participantId}>
                  <tr className="bg-neutral-950/40">
                    <td className="px-4 py-3 text-neutral-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-neutral-200">
                      {row.displayName}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-300">
                      {row.poolTotalVsPar > 0 ? "+" : ""}
                      {row.poolTotalVsPar}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-400">
                      {row.tieBreakDistance}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {row.winnerBonusApplied ? "Yes" : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenId((id) =>
                            id === row.participantId ? null : row.participantId,
                          )
                        }
                        className="text-emerald-500/90 hover:text-emerald-400"
                      >
                        {openId === row.participantId ? "Hide" : "Breakdown"}
                      </button>
                    </td>
                  </tr>
                  {openId === row.participantId ? (
                    <tr>
                      <td colSpan={6} className="bg-neutral-900/30 px-4 py-4">
                        <p className="text-xs text-neutral-500">
                          Per-pick totals vs par (best four of five count). Indices
                          counted:{" "}
                          {row.countedPickIndices.join(", ")}
                        </p>
                        <ul className="mt-2 grid gap-1 font-mono text-xs text-neutral-400 sm:grid-cols-5">
                          {row.pickTotalsVsPar.map((v, idx) => (
                            <li key={idx}>
                              P{idx + 1}: {v > 0 ? "+" : ""}
                              {v}
                              {row.countedPickIndices.includes(idx) ? (
                                <span className="text-emerald-600"> ✓</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
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
