"use client";

import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { UserIcon } from "./icons";
import { useSession } from "./session-provider";

const trigger =
  "inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors hover:bg-surface";
const item = "block rounded px-3 py-2 text-sm transition-colors hover:bg-surface";

/**
 * A native <details> disclosure, so the menu needs no outside-click handling
 * and closes on Escape for free — same approach as the mobile search filters.
 */
export function AccountMenu() {
  const { email, loading, clearSession } = useSession();

  // Blank until the first session read lands, so the header never flashes
  // "Sign in" at someone who is already signed in. Without JavaScript that
  // read never happens, so <noscript> keeps a real entry point rather than a
  // permanently empty corner.
  if (loading) {
    return (
      <>
        <div className="h-10 w-10" aria-hidden />
        <noscript>
          <Link href="/signin" className={trigger}>
            Sign in
          </Link>
        </noscript>
      </>
    );
  }

  if (!email) {
    return (
      <Link href="/signin" className={trigger}>
        <UserIcon />
        {/* sr-only, not hidden: on phones the icon stands alone, and the link
            still needs a name. */}
        <span className="sr-only sm:not-sr-only">Sign in</span>
      </Link>
    );
  }

  return (
    <details className="relative">
      <summary className={`${trigger} cursor-pointer list-none`} aria-label={`Account, signed in as ${email}`}>
        <UserIcon />
        <span className="hidden sm:inline">Account</span>
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-60 rounded-lg border border-border-subtle bg-background p-1.5 shadow-lift">
        <p className="px-3 pb-2 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Signed in
        </p>
        <p className="truncate px-3 pb-2 text-[13px]" title={email}>
          {email}
        </p>
        <div className="border-t border-border-subtle pt-1.5">
          <Link href="/orders" className={item}>
            Your orders
          </Link>
          <Link href="/cart" className={item}>
            Your bag
          </Link>
          {/* Signing out redirects to "/", which is not a path change when you
              are already there — so the provider's per-navigation re-read would
              not fire. Clearing on click keeps the header correct either way. */}
          <form action={signOut}>
            <button type="submit" onClick={() => clearSession()} className={`${item} w-full text-left`}>
              Sign out
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
