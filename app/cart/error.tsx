"use client";

import { ErrorPanel } from "@/components/error-panel";

export default function CartError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorPanel
      title="We couldn’t load your bag"
      description="Your items are safe — this is usually temporary."
      reset={reset}
      href="/#aisles"
      hrefLabel="Keep shopping"
    />
  );
}
