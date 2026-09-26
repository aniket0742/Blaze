/**
 * The reconciled view the cart page renders. Reads whichever backend the
 * request belongs to — cookie for guests, `cart_items` for signed-in
 * shoppers — via lib/cart-store.ts, so this file no longer cares which.
 */
import { inArray } from "drizzle-orm";
import { EMPTY_CART, clampQuantity, type CartItemView, type CartView } from "./cart";
import { loadCart } from "./cart-store";
import { db } from "./db";
import { products } from "./db/schema";

/**
 * Joins the stored cart against the live catalog and reconciles the
 * difference. A render cannot write, so corrections here are for display only
 * — the store is corrected by the next mutation, which reconciles again.
 */
export async function getCartView(): Promise<CartView> {
  const lines = await loadCart();
  if (lines.length === 0) return EMPTY_CART;

  const rows = await db
    .select()
    .from(products)
    .where(
      inArray(
        products.id,
        lines.map((l) => l.i),
      ),
    );
  const byId = new Map(rows.map((p) => [p.id, p]));

  const items: CartItemView[] = [];
  let staleCount = 0;
  let subtotalPaise = 0;
  let totalQty = 0;

  for (const line of lines) {
    const product = byId.get(line.i);
    if (!product) {
      staleCount += 1;
      continue;
    }

    const qty = clampQuantity(line.q);
    const linePaise = qty * product.pricePaise;
    items.push({
      id: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      thumbnail: product.thumbnail,
      pricePaise: product.pricePaise,
      mrpPaise: product.mrpPaise,
      qty,
      linePaise,
      note: qty < line.q ? { kind: "reduced", from: line.q } : null,
    });
    subtotalPaise += linePaise;
    totalQty += qty;
  }

  return {
    items,
    staleCount,
    totalQty,
    subtotalPaise,
    // Delivery is free on every order; there is no shipping-cost model.
    deliveryPaise: 0,
    totalPaise: subtotalPaise,
  };
}
