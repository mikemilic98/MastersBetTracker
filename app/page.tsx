import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-100">
        Masters Bet Tracker
      </h1>
      <p className="mt-4 leading-relaxed text-neutral-400">
        Friends pool for The Masters: five picks, one winner designation, predicted
        champion strokes. Open your pool by slug, enter the pool key to view the
        leaderboard, and use your personal edit link to change picks before the
        cutoff.
      </p>
      <div className="mt-10 space-y-3">
        <p className="text-sm font-medium text-neutral-300">Go to a pool</p>
        <form
          action="/pool/redirect"
          method="get"
          className="flex flex-wrap gap-2"
        >
          <input
            name="slug"
            type="text"
            required
            placeholder="pool-slug"
            pattern="[a-z0-9-]+"
            title="Lowercase letters, numbers, hyphens"
            className="min-w-[200px] flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Open
          </button>
        </form>
      </div>
      <ul className="mt-12 space-y-2 text-sm text-neutral-500">
        <li>
          <Link href="/admin/login" className="text-neutral-400 hover:text-neutral-200">
            Organizer: admin login
          </Link>
        </li>
      </ul>
    </main>
  );
}
