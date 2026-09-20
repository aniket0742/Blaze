import { NextResponse } from "next/server";
import { cartQuantity } from "@/lib/cart";
import { loadCart } from "@/lib/cart-store";
import { getUser } from "@/lib/supabase/server";

/**
 * Everything the header needs, in one request: who you are and how many items
 * you have. Keeping this out of the root layout is what lets the whole catalog
 * stay prerendered — see DECISIONS.md.
 */
export async function GET() {
  try {
    const [user, lines] = await Promise.all([getUser(), loadCart()]);
    return NextResponse.json(
      { email: user?.email ?? null, cartCount: cartQuantity(lines) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // A failed session read means a plain header, never a broken page.
    return NextResponse.json(
      { email: null, cartCount: 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
