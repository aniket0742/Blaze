"use client";

import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { UserIcon } from "./icons";
import { useSession } from "./session-provider";

/**
 * A native <details> disclosure, so the menu needs no outside-click handling
 * and closes on Escape for free — same approach as the mobile search filters.
 */
export function AccountMenu() {
  const { email, loading, clearSession } = useSession();

  if (loading) {
    return <div className="h-10 w-10" aria-hidden />;
  }

  if (!email) {
    return (
      <Link
        href="/signin"
        className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-medium transition-colors hover:bg-surface"
      >
        Sign in
      </Link>
    );
  }

  return (
    <details className="relative">
      <summary
        className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl transition-colors hover:bg-surface"
        aria-label={`Account, signed in as ${email}`}
      >
        <UserIcon />
      </summary>

      <div className="absolute right-0 z-50 mt-1 w-56 rounded-xl border border-border-subtle bg-background p-1.5 shadow-lift">
        <p className="truncate px-2.5 py-1.5 text-[12px] text-muted" title={email}>
          {email}
        </p>
        <Link
          href="/orders"
          className="block rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-surface"
        >
          Your orders
        </Link>
        <Link
          href="/cart"
          className="block rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-surface"
        >
          Your cart
        </Link>
        {/* Signing out redirects to "/", which is not a path change when you
            are already there — so the provider's per-navigation re-read would
            not fire. Clearing on click keeps the header correct either way. */}
        <form action={signOut}>
          <button
            type="submit"
            onClick={() => clearSession()}
            className="w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface"
          >
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
