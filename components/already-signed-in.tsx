import Link from "next/link";

/**
 * Shown instead of the form when a signed-in shopper opens /signin or /signup.
 *
 * This deliberately does NOT redirect. Next re-renders this page as part of
 * the sign-in action's response, and a redirect here would run *after* the
 * action's own redirect and silently override it — which is how `returnTo`
 * ended up always landing on the home page.
 */
export function AlreadySignedIn({ email }: { email: string }) {
  return (
    <div className="mx-auto w-full max-w-sm text-center">
      <h1 className="text-2xl font-semibold tracking-tight">You&apos;re signed in</h1>
      <p className="mt-2 text-sm text-muted">
        Signed in as <span className="font-medium text-foreground">{email}</span>.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Keep shopping
        </Link>
        <Link
          href="/cart"
          className="rounded-full border border-border-subtle px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
        >
          Your cart
        </Link>
      </div>
    </div>
  );
}
