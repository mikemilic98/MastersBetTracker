import { Suspense } from "react";
import { PicksPageClient } from "./picks-client";

export default function PicksPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-6 py-16 text-neutral-500">
          Loading…
        </main>
      }
    >
      <PicksPageClient params={props.params} />
    </Suspense>
  );
}
