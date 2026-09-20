"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { MAX_PER_LINE, type CartItemView } from "@/lib/cart";
import { removeFromCart, setCartQuantity } from "@/lib/actions/cart";
import { formatPrice } from "@/lib/format";
import { useCartCount } from "./cart-count";

function noteText(note: CartItemView["note"], qty: number): string | null {
  if (!note) return null;
  if (note.kind === "out-of-stock") return "Out of stock — remove it to check out";
  return `Only ${qty} left, so we reduced this from ${note.from}`;
}

export function CartItemRow({ item }: { item: CartItemView }) {
  const { setCount } = useCartCount();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const outOfStock = item.note?.kind === "out-of-stock";
  const note = noteText(item.note, item.qty);

  function run(action: () => Promise<{ cartQty: number }>) {
    setFailed(false);
    startTransition(async () => {
      try {
        setCount((await action()).cartQty);
      } catch {
        setFailed(true);
      }
    });
  }

  const canDecrease = !outOfStock && !pending;
  const canIncrease = !outOfStock && !pending && item.qty < Math.min(item.stock, MAX_PER_LINE);

  return (
    <li
      className={`flex gap-3 py-4 transition-opacity sm:gap-4 ${pending ? "opacity-60" : ""}`}
      aria-busy={pending}
    >
      <Link
        href={`/product/${item.slug}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-background sm:h-24 sm:w-24"
      >
        <Image src={item.thumbnail} alt={item.title} fill sizes="96px" className="object-contain p-1.5" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted">
          {item.brand ?? "Blaze Marketplace"}
        </p>
        <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium hover:underline">
          {item.title}
        </Link>
        <p className="text-sm font-semibold">{formatPrice(item.pricePaise)}</p>

        {note && (
          <p className={`text-[12px] ${outOfStock ? "text-red-700" : "text-amber-700"}`}>{note}</p>
        )}
        {failed && <p className="text-[12px] text-red-700">That didn&apos;t save. Try again.</p>}

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-border-subtle">
            <button
              type="button"
              onClick={() => run(() => setCartQuantity(item.id, item.qty - 1))}
              disabled={!canDecrease}
              aria-label={item.qty === 1 ? `Remove ${item.title}` : `Decrease quantity of ${item.title}`}
              className="h-9 w-9 rounded-l-full text-lg leading-none transition-colors hover:bg-surface disabled:opacity-40"
            >
              −
            </button>
            <span aria-live="polite" className="w-8 text-center text-sm font-medium tabular-nums">
              {item.qty}
            </span>
            <button
              type="button"
              onClick={() => run(() => setCartQuantity(item.id, item.qty + 1))}
              disabled={!canIncrease}
              aria-label={`Increase quantity of ${item.title}`}
              className="h-9 w-9 rounded-r-full text-lg leading-none transition-colors hover:bg-surface disabled:opacity-40"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => run(() => removeFromCart(item.id))}
            disabled={pending}
            className="text-[13px] font-medium text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>

      <p className="shrink-0 text-sm font-semibold tabular-nums">
        {outOfStock ? "—" : formatPrice(item.linePaise)}
      </p>
    </li>
  );
}
