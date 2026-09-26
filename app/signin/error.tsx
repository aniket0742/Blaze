"use client";

import { ErrorPanel } from "@/components/error-panel";

export default function SignInError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorPanel
      title="Sign-in isn’t responding"
      description="We couldn’t reach the sign-in service. Your bag is safe either way."
      reset={reset}
      href="/"
      hrefLabel="Back to home"
    />
  );
}
