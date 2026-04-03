"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

type Props = { params: Promise<{ slug: string }> };

type Participant = {
  id: string;
  displayName: string;
  editToken: string;
  predictedWinningScore: number;
  winnerPickPlayerId: string;
  locked: boolean;
  picks: { sortOrder: number; playerId: string }[];
};

export default function AdminPoolPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const [pool, setPool] = useState<{
    name: string;
    cutoffAt: string | null;
    picksLocked: boolean;
  } | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [cutoffLocal, setCutoffLocal] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [savingPool, setSavingPool] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPredicted, setNewPredicted] = useState(280);
  const [newWinner, setNewWinner] = useState("");
  const [newPicks, setNewPicks] = useState(["", "", "", "", ""]);
  const [creating, setCreating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [participantDeleteId, setParticipantDeleteId] = useState<string | null>(
    null,
  );
  const [deletingParticipant, setDeletingParticipant] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const [pr, list] = await Promise.all([
      fetch(`/api/pools/${encodeURIComponent(slug)}`),
      fetch(`/api/pools/${encodeURIComponent(slug)}/participants`, {
        credentials: "include",
      }),
    ]);
    if (list.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const poolJson = await pr.json().catch(() => ({}));
    const listJson = await list.json().catch(() => ({}));
    if (!pr.ok) {
      setErr(typeof poolJson.error === "string" ? poolJson.error : "Pool not found");
      setPool(null);
      return;
    }
    if (!list.ok) {
      setErr(typeof listJson.error === "string" ? listJson.error : "Failed to load");
      return;
    }
    const p = poolJson as {
      name: string;
      cutoffAt: string | null;
      picksLocked: boolean;
    };
    setPool({ name: p.name, cutoffAt: p.cutoffAt, picksLocked: p.picksLocked });
    if (p.cutoffAt) {
      const d = new Date(p.cutoffAt);
      const pad = (n: number) => String(n).padStart(2, "0");
      setCutoffLocal(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
      );
    } else {
      setCutoffLocal("");
    }
    setParticipants((listJson as { participants: Participant[] }).participants);
  }, [slug, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function savePoolSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!pool) return;
    setSavingPool(true);
    setErr(null);
    try {
      const cutoffAt =
        cutoffLocal.trim() === ""
          ? null
          : new Date(cutoffLocal).toISOString();
      const res = await fetch(`/api/admin/pools/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cutoffAt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Save failed");
        return;
      }
      await load();
    } finally {
      setSavingPool(false);
    }
  }

  async function togglePoolLock() {
    if (!pool) return;
    setErr(null);
    const res = await fetch(`/api/admin/pools/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ picksLocked: !pool.picksLocked }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "Update failed");
      return;
    }
    await load();
  }

  async function refreshSnapshot() {
    setRefreshing(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/pools/${encodeURIComponent(slug)}/snapshot/refresh`,
        { method: "POST", credentials: "include" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Refresh failed");
        return;
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function toggleParticipantLock(participantId: string, locked: boolean) {
    setErr(null);
    const res = await fetch(
      `/api/admin/pools/${encodeURIComponent(slug)}/participants/${encodeURIComponent(participantId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ locked: !locked }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "Lock update failed");
      return;
    }
    await load();
  }

  async function onCreateParticipant(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setErr(null);
    try {
      const res = await fetch(`/api/pools/${encodeURIComponent(slug)}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          displayName: newName.trim(),
          predictedWinningScore: newPredicted,
          winnerPickPlayerId: newWinner.trim(),
          playerIds: newPicks.map((s) => s.trim()),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Create failed");
        return;
      }
      setNewName("");
      setNewWinner("");
      setNewPicks(["", "", "", "", ""]);
      await load();
      alert(
        `Participant created. Edit token (copy now): ${(data as { editToken: string }).editToken}`,
      );
    } finally {
      setCreating(false);
    }
  }

  async function confirmDeleteParticipant() {
    if (!participantDeleteId) return;
    setDeletingParticipant(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/admin/pools/${encodeURIComponent(slug)}/participants/${encodeURIComponent(participantDeleteId)}`,
        { method: "DELETE", credentials: "include" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Delete failed");
        return;
      }
      setParticipantDeleteId(null);
      await load();
    } finally {
      setDeletingParticipant(false);
    }
  }

  async function confirmDeletePool() {
    setDeleting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/pools/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Delete failed");
        return;
      }
      setDeleteModalOpen(false);
      router.push("/admin");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (!pool && !err) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-neutral-500">
        Loading…
      </main>
    );
  }

  if (!pool) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-red-400">{err}</p>
        <Link href="/admin" className="mt-4 inline-block text-amber-400">
          ← Admin
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-neutral-100">{pool.name}</h1>
      <p className="font-mono text-sm text-neutral-500">{slug}</p>

      {err ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {err}
        </p>
      ) : null}

      <section className="mt-10 space-y-4 rounded-lg border border-neutral-800 bg-neutral-950/50 p-6">
        <h2 className="text-sm font-medium text-neutral-300">Pool settings</h2>
        <form onSubmit={savePoolSettings} className="space-y-3">
          <div>
            <label className="text-xs text-neutral-500">Cutoff (local time)</label>
            <input
              type="datetime-local"
              value={cutoffLocal}
              onChange={(e) => setCutoffLocal(e.target.value)}
              className="mt-1 block rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            />
            <p className="mt-1 text-xs text-neutral-600">
              Leave empty and save to clear cutoff.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={savingPool}
              className="rounded-md bg-neutral-700 px-4 py-2 text-sm text-white hover:bg-neutral-600 disabled:opacity-50"
            >
              {savingPool ? "Saving…" : "Save cutoff"}
            </button>
            <button
              type="button"
              onClick={() => void togglePoolLock()}
              className="rounded-md border border-neutral-600 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
            >
              {pool.picksLocked ? "Unlock pool picks" : "Lock pool picks"}
            </button>
            <button
              type="button"
              onClick={() => void refreshSnapshot()}
              disabled={refreshing}
              className="rounded-md border border-emerald-800 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-950/50 disabled:opacity-50"
            >
              {refreshing ? "Refreshing…" : "Refresh leaderboard snapshot"}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-10 rounded-lg border border-neutral-800 bg-neutral-950/50 p-6">
        <h2 className="text-sm font-medium text-neutral-300">Add participant</h2>
        <form onSubmit={onCreateParticipant} className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-neutral-500">Display name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-neutral-500">Predicted champion strokes</label>
              <input
                type="number"
                min={60}
                max={400}
                value={newPredicted}
                onChange={(e) => setNewPredicted(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500">Winner player id</label>
              <input
                value={newWinner}
                onChange={(e) => setNewWinner(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-neutral-500">Five picks (player ids)</p>
            {newPicks.map((v, i) => (
              <input
                key={i}
                value={v}
                onChange={(e) => {
                  const n = [...newPicks];
                  n[i] = e.target.value;
                  setNewPicks(n);
                }}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm"
                required
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create participant"}
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-neutral-300">Participants</h2>
        <ul className="mt-4 space-y-4">
          {participants.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-neutral-800 p-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-neutral-200">{p.displayName}</p>
                  <p className="mt-1 break-all font-mono text-xs text-amber-200/90">
                    editToken: {p.editToken}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    Participant link:{" "}
                    <Link
                      href={`/pool/${encodeURIComponent(slug)}/picks?token=${encodeURIComponent(p.editToken)}`}
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      /pool/{slug}/picks?token=…
                    </Link>
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleParticipantLock(p.id, p.locked)}
                    className="rounded border border-neutral-600 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                  >
                    {p.locked ? "Unlock row" : "Lock row"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setParticipantDeleteId(p.id)}
                    className="rounded border border-red-900/80 px-2 py-1 text-xs text-red-300 hover:bg-red-950/50"
                  >
                    Remove…
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-lg border border-red-950/60 bg-red-950/20 p-6">
        <h2 className="text-sm font-medium text-red-200/90">Danger zone</h2>
        <p className="mt-2 text-xs text-neutral-500">
          Permanently delete this pool, all participants, picks, and leaderboard
          snapshots.
        </p>
        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="mt-4 rounded-md border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-200 hover:bg-red-950/70"
        >
          Delete pool…
        </button>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/admin" className="text-neutral-500 hover:text-neutral-300">
          ← All pools
        </Link>
      </p>

      {participantDeleteId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setParticipantDeleteId(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-participant-title"
            className="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-950 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-participant-title"
              className="text-lg font-semibold text-neutral-100"
            >
              Remove participant?
            </h2>
            <p className="mt-3 text-sm text-neutral-400">
              <span className="font-medium text-neutral-200">
                {participants.find((x) => x.id === participantDeleteId)
                  ?.displayName ?? "This participant"}
              </span>{" "}
              will be removed with all picks. This cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setParticipantDeleteId(null)}
                disabled={deletingParticipant}
                className="rounded-md border border-neutral-600 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteParticipant()}
                disabled={deletingParticipant}
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deletingParticipant ? "Removing…" : "Yes, remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-pool-title"
            className="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-950 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-pool-title"
              className="text-lg font-semibold text-neutral-100"
            >
              Delete this pool?
            </h2>
            <p className="mt-3 text-sm text-neutral-400">
              <span className="font-medium text-neutral-200">{pool.name}</span>{" "}
              (<span className="font-mono text-neutral-500">{slug}</span>) will be
              removed permanently. All participants, picks, and snapshots are
              deleted. This cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="rounded-md border border-neutral-600 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeletePool()}
                disabled={deleting}
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, delete pool"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
