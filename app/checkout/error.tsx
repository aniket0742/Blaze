"use client";

import { ErrorPanel } from "@/components/error-panel";

export default function CheckoutError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorPanel
      title="Checkout isn’t responding"
      description="No order was placed and nothing was charged. Your bag is exactly as you left it."
      reset={reset}
      href="/cart"
      hrefLabel="Back to your bag"
    />
  );
}
