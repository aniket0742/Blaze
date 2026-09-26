"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { MAX_PER_LINE, type CartItemView } from "@/lib/cart";
import { removeFromCart, setCartQuantity } from "@/lib/actions/cart";
import { formatPrice } from "@/lib/format";
import { useSession } from "./session-provider";

function noteText(note: CartItemView["note"], qty: number): string | null {
  if (!note) return null;
  return `Limited to ${qty} per order, so we reduced this from ${note.from}`;
}

export function CartItemRow({ item }: { item: CartItemView }) {
  const { setCartCount } = useSession();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const note = noteText(item.note, item.qty);

  function run(action: () => Promise<{ cartQty: number }>) {
    setFailed(false);
    startTransition(async () => {
      try {
        setCartCount((await action()).cartQty);
      } catch {
        setFailed(true);
      }
    });
  }

  const canDecrease = !pending;
  const canIncrease = !pending && item.qty < MAX_PER_LINE;

  const step =
    "flex h-10 w-10 items-center justify-center text-lg leading-none transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <li className={`flex gap-4 py-6 transition-opacity ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
      <Link
        href={`/product/${item.slug}`}
        className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-surface sm:h-32 sm:w-28"
      >
        <Image src={item.thumbnail} alt={item.title} fill sizes="112px" className="object-contain p-2.5 mix-blend-multiply" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {item.brand && (
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{item.brand}</p>
            )}
            <Link
              href={`/product/${item.slug}`}
              className="mt-0.5 line-clamp-2 text-[15px] font-medium leading-snug hover:underline hover:underline-offset-2"
            >
              {item.title}
            </Link>
            <p className="mt-1 text-[13px] text-muted">
              {formatPrice(item.pricePaise)} each
            </p>
          </div>
          <p className="shrink-0 font-mono text-[15px] font-semibold tabular-nums">{formatPrice(item.linePaise)}</p>
        </div>

        {note && <p className="mt-2 text-[13px] text-amber-900">{note}</p>}
        {failed && <p className="mt-2 text-[13px] text-red-800">That didn&apos;t save. Try again.</p>}

        <div className="mt-auto flex flex-wrap items-center gap-4 pt-3">
          <div className="inline-flex items-center overflow-hidden rounded-md border border-border-field">
            <button
              type="button"
              onClick={() => run(() => setCartQuantity(item.id, item.qty - 1))}
              disabled={!canDecrease}
              aria-label={item.qty === 1 ? `Remove ${item.title}` : `Decrease quantity of ${item.title}`}
              className={step}
            >
              −
            </button>
            <span aria-live="polite" className="w-9 text-center font-mono text-[14px] tabular-nums">
              {item.qty}
            </span>
            <button
              type="button"
              onClick={() => run(() => setCartQuantity(item.id, item.qty + 1))}
              disabled={!canIncrease}
              aria-label={`Increase quantity of ${item.title}`}
              className={step}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => run(() => removeFromCart(item.id))}
            disabled={pending}
            className="text-[13px] font-medium text-muted underline decoration-border-field underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
