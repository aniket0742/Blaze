"use client";

import { ErrorPanel } from "@/components/error-panel";

export default function ProductError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorPanel
      title="We couldn’t load this product"
      description="This is usually temporary — try again, or keep browsing the aisles."
      reset={reset}
      href="/#aisles"
      hrefLabel="Browse the aisles"
    />
  );
}
