import type { Metadata } from "next";
import Link from "next/link";
import { CartItemRow } from "@/components/cart-item-row";
import { CartSummary } from "@/components/cart-summary";
import { EmptyState } from "@/components/empty-state";
import { getCartView } from "@/lib/cart-server";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false },
};

export default async function CartPage() {
  const cart = await getCartView();

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h1 className="sr-only">Your cart</h1>
        <EmptyState
          title="Your cart is empty"
          description={
            cart.staleCount > 0
              ? "The items you had saved are no longer in our catalog. Browse the marketplace to find something else."
              : "Nothing here yet. Browse the marketplace and add something you like."
          }
          actionHref="/search"
          actionLabel="Start shopping"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your cart</h1>
        <Link href="/search" className="text-[13px] font-medium text-brand-600 hover:underline">
          Continue shopping →
        </Link>
      </header>

      {cart.staleCount > 0 && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
          {cart.staleCount === 1
            ? "One item was removed because it is no longer in our catalog."
            : `${cart.staleCount} items were removed because they are no longer in our catalog.`}
        </p>
      )}

      <div className="mt-5 lg:grid lg:grid-cols-[1fr_340px] lg:gap-6">
        <ul className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-background px-4 shadow-card sm:px-5">
          {cart.items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </ul>

        <div className="mt-5 lg:mt-0">
          <div className="lg:sticky lg:top-36">
            <CartSummary cart={cart} />
          </div>
        </div>
      </div>
    </div>
  );
}
