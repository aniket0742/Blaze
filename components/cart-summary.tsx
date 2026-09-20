import type { CartView } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export function CartSummary({ cart }: { cart: CartView }) {
  const nothingOrderable = cart.totalQty === 0;

  return (
    <div className="rounded-2xl border border-border-subtle bg-background p-4 shadow-card sm:p-5">
      <h2 className="text-lg font-semibold tracking-tight">Order summary</h2>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">
            Subtotal ({cart.totalQty} {cart.totalQty === 1 ? "item" : "items"})
          </dt>
          <dd className="font-medium tabular-nums">{formatPrice(cart.subtotalPaise)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Delivery</dt>
          <dd className="font-medium text-emerald-700">Free</dd>
        </div>
        {cart.arrivesBy && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Arrives</dt>
            <dd className="text-right font-medium">{cart.arrivesBy.replace(/^Arrives /, "")}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3 border-t border-border-subtle pt-2.5 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-semibold tabular-nums">{formatPrice(cart.totalPaise)}</dd>
        </div>
      </dl>

      <p className="mt-1 text-[12px] text-muted">Inclusive of all taxes</p>

      {/* Checkout is the next milestone. A disabled CTA is more honest than a
          link that dead-ends, and matches how the header treats Account. */}
      <button
        type="button"
        disabled
        title="Checkout — not available yet"
        className="mt-4 w-full cursor-not-allowed rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white opacity-60"
      >
        Proceed to checkout
      </button>
      <p className="mt-2 text-center text-[12px] text-muted">
        {nothingOrderable
          ? "Nothing in your cart can be ordered right now."
          : "Checkout arrives in the next milestone."}
      </p>
    </div>
  );
}
