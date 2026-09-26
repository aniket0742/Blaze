"use client";

import { ErrorPanel } from "@/components/error-panel";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorPanel
      title="Something went wrong"
      description="We couldn’t load this page. This is usually temporary — try again."
      reset={reset}
      href="/"
      hrefLabel="Back to home"
    />
  );
}
