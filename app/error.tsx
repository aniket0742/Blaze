"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        We couldn&apos;t load this page. This is usually temporary — try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
      >
        Try again
      </button>
    </div>
  );
}
