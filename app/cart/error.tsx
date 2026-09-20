"use client";

import Link from "next/link";

export default function CartError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">We couldn&apos;t load your cart</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Your items are safe — this is usually temporary.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Try again
        </button>
        <Link
          href="/search"
          className="rounded-full border border-border-subtle px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
