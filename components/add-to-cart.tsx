"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addToCart } from "@/lib/actions/cart";
import { MAX_PER_LINE, type AddToCartResult } from "@/lib/cart";
import { useCartCount } from "./cart-count";

type Feedback =
  | { tone: "ok"; title: string; detail: string }
  | { tone: "warn"; title: string; detail: string }
  | { tone: "error"; title: string; detail: string };

function itemsLabel(n: number): string {
  return `${n} ${n === 1 ? "item" : "items"} in your cart`;
}

function feedbackFor(result: AddToCartResult): Feedback {
  switch (result.status) {
    case "added":
      return {
        tone: "ok",
        title: "Added to cart",
        detail: `${result.lineQty} of this item · ${itemsLabel(result.cartQty)}`,
      };
    case "capped":
      return {
        tone: "warn",
        title:
          result.reason === "stock"
            ? `Only ${result.lineQty} in stock — that's what we added`
            : `Limited to ${MAX_PER_LINE} per order`,
        detail: `${result.lineQty} of this item · ${itemsLabel(result.cartQty)}`,
      };
    case "unavailable":
      return {
        tone: "error",
        title: "This item just went out of stock",
        detail: "Nothing was added to your cart.",
      };
  }
}

const TONES: Record<Feedback["tone"], string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-800",
};

/**
 * Quantity selector plus the Add to Cart button. The server action returns the
 * resulting line and cart quantities, which is what the confirmation reports —
 * so the page itself never has to read the cart and can stay prerendered.
 */
export function AddToCart({ productId, stock }: { productId: number; stock: number }) {
  const { setCount } = useCartCount();
  const [qty, setQty] = useState(1);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();

  const max = Math.min(stock, MAX_PER_LINE);

  if (stock < 1) {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-full border border-border-subtle bg-surface px-5 py-3 text-sm font-medium text-muted"
      >
        Out of stock
      </button>
    );
  }

  function submit() {
    startTransition(async () => {
      try {
        const result = await addToCart(productId, qty);
        if (result.status !== "unavailable") setCount(result.cartQty);
        setFeedback(feedbackFor(result));
      } catch {
        setFeedback({
          tone: "error",
          title: "Couldn't add to cart",
          detail: "Something went wrong on our side. Try again.",
        });
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label htmlFor="qty" className="text-[13px] text-muted">
          Quantity
        </label>
        <select
          id="qty"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="h-11 rounded-xl border border-border-subtle bg-background px-3 text-sm outline-none focus:border-brand-400"
        >
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-70"
      >
        {pending ? "Adding…" : "Add to cart"}
      </button>

      {/* Always mounted so the confirmation is announced, not just painted. */}
      <div role="status" aria-live="polite">
        {feedback && (
          <div className={`rounded-xl border px-3.5 py-2.5 text-[13px] ${TONES[feedback.tone]}`}>
            <p className="font-medium">{feedback.title}</p>
            <p className="mt-0.5 opacity-80">{feedback.detail}</p>
            {feedback.tone !== "error" && (
              <Link href="/cart" className="mt-1 inline-block font-medium underline underline-offset-2">
                View cart
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
