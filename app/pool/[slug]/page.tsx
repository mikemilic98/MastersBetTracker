import Link from "next/link";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export default async function PoolHubPage({ params }: Props) {
  const { slug } = await params;
  const pool = await prisma.pool.findUnique({
    where: { slug },
    include: { _count: { select: { participants: true } } },
  });
  if (!pool) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-neutral-400">
          Pool not found. Ask the organizer for the slug or create one in{" "}
          <Link href="/admin" className="text-emerald-400 hover:text-emerald-300">
            admin
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-neutral-100">{pool.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">{pool.slug}</p>
      <dl className="mt-6 grid gap-2 text-sm text-neutral-400">
        <div>
          <dt className="inline text-neutral-500">Participants</dt>{" "}
          <dd className="inline text-neutral-300">
            {pool._count.participants}
          </dd>
        </div>
        <div>
          <dt className="inline text-neutral-500">Cutoff</dt>{" "}
          <dd className="inline text-neutral-300">
            {pool.cutoffAt
              ? pool.cutoffAt.toLocaleString()
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="inline text-neutral-500">Pool picks locked</dt>{" "}
          <dd className="inline text-neutral-300">
            {pool.picksLocked ? "Yes" : "No"}
          </dd>
        </div>
      </dl>
      <ul className="mt-10 space-y-3">
        <li>
          <Link
            href={`/pool/${encodeURIComponent(slug)}/login`}
            className="text-emerald-400 hover:text-emerald-300"
          >
            Enter pool key (leaderboard access)
          </Link>
        </li>
        <li>
          <Link
            href={`/pool/${encodeURIComponent(slug)}/leaderboard`}
            className="text-emerald-400 hover:text-emerald-300"
          >
            Leaderboard
          </Link>
        </li>
        <li>
          <Link
            href={`/pool/${encodeURIComponent(slug)}/picks`}
            className="text-emerald-400 hover:text-emerald-300"
          >
            My picks (edit token)
          </Link>
        </li>
      </ul>
    </main>
  );
}
