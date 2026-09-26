"use client";

import { ErrorPanel } from "@/components/error-panel";

export default function OrderDetailError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorPanel
      title="We couldn’t load this order"
      description="The order itself is unaffected — this is usually temporary."
      reset={reset}
      href="/orders"
      hrefLabel="Your orders"
    />
  );
}
