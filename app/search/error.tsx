"use client";

import { ErrorPanel } from "@/components/error-panel";

export default function SearchError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorPanel
      title="Search isn’t responding"
      description="This is usually temporary — try again in a moment."
      reset={reset}
      href="/"
      hrefLabel="Back to home"
    />
  );
}
