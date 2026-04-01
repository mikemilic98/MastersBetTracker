export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Masters Bet Tracker
      </h1>
      <p className="mt-4 text-neutral-400">
        Next.js + TypeScript + Tailwind + Prisma (SQLite) scaffold is ready.
        Copy <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-sm">.env.example</code>{" "}
        to <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-sm">.env</code>, run{" "}
        <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-sm">npm install</code> and{" "}
        <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-sm">npx prisma db push</code>.
      </p>
    </main>
  );
}
