"use client";

import { ErrorPanel } from "@/components/error-panel";

export default function OrdersError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorPanel
      title="We couldn’t load your orders"
      description="Your orders are safe — this is usually temporary."
      reset={reset}
      href="/#aisles"
      hrefLabel="Keep shopping"
    />
  );
}
