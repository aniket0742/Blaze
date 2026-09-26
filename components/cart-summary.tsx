import Link from "next/link";
import type { CartView } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { Receipt, ReceiptRow, button } from "./ui";

/** The bag's total, printed as a receipt. */
export function CartSummary({ cart }: { cart: CartView }) {
  const nothingOrderable = cart.totalQty === 0;

  return (
    <Receipt>
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.3em] text-muted">Blaze · your bag</p>
      <dl className="mt-4 space-y-2 border-t border-dashed border-border-field pt-4">
        <ReceiptRow
          label={`Subtotal, ${cart.totalQty} ${cart.totalQty === 1 ? "item" : "items"}`}
          value={formatPrice(cart.subtotalPaise)}
        />
        <ReceiptRow label="Delivery" value="Free" />
      </dl>
      <dl className="mt-4 border-t border-dashed border-border-field pt-4">
        <ReceiptRow label="Total" value={formatPrice(cart.totalPaise)} strong />
      </dl>
      <p className="mt-1 text-[12px] text-muted">Inclusive of all taxes</p>

      {/* A bag with nothing orderable in it keeps the disabled control rather
          than a link that dead-ends on a checkout page it cannot use. */}
      {nothingOrderable ? (
        <>
          <button type="button" disabled className={`${button("primary", "lg")} mt-5 w-full`}>
            Check out
          </button>
          <p className="mt-2 text-center text-[12px] text-muted">Nothing in your bag can be ordered right now.</p>
        </>
      ) : (
        <>
          <Link href="/checkout" className={`${button("primary", "lg")} mt-5 w-full`}>
            Check out
          </Link>
          <p className="mt-2 text-center text-[12px] text-muted">Demo checkout — no payment is taken.</p>
        </>
      )}
    </Receipt>
  );
}
