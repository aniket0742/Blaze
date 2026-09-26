"use client";

import { ErrorPanel } from "@/components/error-panel";

export default function SignUpError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorPanel
      title="Sign-up isn’t responding"
      description="We couldn’t reach the sign-up service. Your bag is safe either way."
      reset={reset}
      href="/"
      hrefLabel="Back to home"
    />
  );
}
