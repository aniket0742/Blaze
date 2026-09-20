"use client";

import Link from "next/link";
import { CartIcon } from "./icons";
import { useSession } from "./session-provider";

export function CartBadge() {
  const { cartCount: count } = useSession();
  const label = count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart";

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-surface"
    >
      <CartIcon />
      {count > 0 && (
        <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-brand-600 px-1 text-center text-[11px] font-semibold leading-[18px] text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
