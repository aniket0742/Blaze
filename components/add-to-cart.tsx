"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addToCart } from "@/lib/actions/cart";
import { MAX_PER_LINE, type AddToCartResult } from "@/lib/cart";
import { useSession } from "./session-provider";
import { button, field } from "./ui";

type Feedback =
  | { tone: "ok"; title: string; detail: string }
  | { tone: "warn"; title: string; detail: string }
  | { tone: "error"; title: string; detail: string };

function itemsLabel(n: number): string {
  return `${n} ${n === 1 ? "item" : "items"} in your bag`;
}

function feedbackFor(result: AddToCartResult): Feedback {
  switch (result.status) {
    case "added":
      return {
        tone: "ok",
        title: "Added to your bag",
        detail: `${result.lineQty} of this item · ${itemsLabel(result.cartQty)}`,
      };
    case "capped":
      return {
        tone: "warn",
        title: `Limited to ${MAX_PER_LINE} per order`,
        detail: `${result.lineQty} of this item · ${itemsLabel(result.cartQty)}`,
      };
    case "unavailable":
      return {
        tone: "error",
        title: "This item is no longer available",
        detail: "Nothing was added to your cart.",
      };
  }
}

const TONES: Record<Feedback["tone"], string> = {
  ok: "border-emerald-700 bg-emerald-50 text-emerald-900",
  warn: "border-amber-600 bg-amber-50 text-amber-900",
  error: "border-red-700 bg-red-50 text-red-900",
};

/**
 * Quantity selector plus the Add to bag button. The server action returns the
 * resulting line and cart quantities, which is what the confirmation reports —
 * so the page itself never has to read the cart and can stay prerendered.
 */
export function AddToCart({ productId }: { productId: number }) {
  const { setCartCount } = useSession();
  const [qty, setQty] = useState(1);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      try {
        const result = await addToCart(productId, qty);
        if (result.status !== "unavailable") setCartCount(result.cartQty);
        setFeedback(feedbackFor(result));
      } catch {
        setFeedback({
          tone: "error",
          title: "Couldn't add that to your bag",
          detail: "Something went wrong on our side. Try again.",
        });
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="w-24 shrink-0">
          <label htmlFor="qty" className="sr-only">
            Quantity
          </label>
          <select id="qty" value={qty} onChange={(e) => setQty(Number(e.target.value))} className={`${field} h-12`}>
            {Array.from({ length: MAX_PER_LINE }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Qty {n}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={submit} disabled={pending} className={`${button("primary", "lg")} flex-1`}>
          {pending ? "Adding…" : "Add to bag"}
        </button>
      </div>

      {/* Always mounted so the confirmation is announced, not just painted. */}
      <div role="status" aria-live="polite">
        {feedback && (
          <div className={`rounded-md border-l-4 px-4 py-3 text-[14px] ${TONES[feedback.tone]}`}>
            <p className="font-semibold">{feedback.title}</p>
            <p className="mt-0.5">{feedback.detail}</p>
            {feedback.tone !== "error" && (
              <Link href="/cart" className="mt-1.5 inline-block font-medium underline underline-offset-2">
                Go to your bag
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
