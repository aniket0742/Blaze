import { NextResponse } from "next/server";
import { cartQuantity } from "@/lib/cart";
import { readCart } from "@/lib/cart-server";

/**
 * The header badge's only data source. A read, not a mutation, so it is a
 * route handler rather than a server action — and keeping it out of the root
 * layout is what lets every catalog page stay prerendered. See DECISIONS.md.
 */
export async function GET() {
  const count = cartQuantity(await readCart());
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
