"use client";

import Link from "next/link";
import { BagIcon } from "./icons";
import { useSession } from "./session-provider";

export function CartBadge() {
  const { cartCount: count } = useSession();
  const label = count > 0 ? `Bag, ${count} ${count === 1 ? "item" : "items"}` : "Bag, empty";

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors hover:bg-surface"
    >
      <BagIcon />
      <span className="hidden sm:inline">Bag</span>
      {count > 0 && (
        <span className="min-w-5 rounded-full bg-brand-600 px-1.5 text-center text-[11px] font-semibold leading-5 text-white tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
