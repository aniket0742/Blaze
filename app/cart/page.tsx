import type { Metadata } from "next";
import Link from "next/link";
import { CartItemRow } from "@/components/cart-item-row";
import { CartSummary } from "@/components/cart-summary";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/ui";
import { getCartView } from "@/lib/cart-server";

export const metadata: Metadata = {
  title: "Your bag",
  robots: { index: false },
};

export default async function CartPage() {
  const cart = await getCartView();

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="sr-only">Your bag</h1>
        <EmptyState
          title="Your bag is empty"
          description={
            cart.staleCount > 0
              ? "The items you had saved are no longer in our catalog. Browse the aisles to find something else."
              : "Nothing here yet. Browse the aisles and add something you like."
          }
          actionHref="/#aisles"
          actionLabel="Browse the aisles"
          secondaryHref="/search?sort=discount"
          secondaryLabel="See the price watch"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground pb-6">
        <PageTitle eyebrow="Your bag" title={`${cart.totalQty} ${cart.totalQty === 1 ? "item" : "items"}`} />
        <Link
          href="/#aisles"
          className="text-sm font-medium underline decoration-border-field underline-offset-4 hover:decoration-foreground"
        >
          Keep shopping
        </Link>
      </div>

      {cart.staleCount > 0 && (
        <p className="mt-5 rounded-md border-l-4 border-amber-600 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
          {cart.staleCount === 1
            ? "One item was removed because it is no longer in our catalog."
            : `${cart.staleCount} items were removed because they are no longer in our catalog.`}
        </p>
      )}

      <div className="mt-4 lg:grid lg:grid-cols-[1fr_360px] lg:gap-12">
        <ul className="divide-y divide-border-subtle">
          {cart.items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </ul>

        <div className="mt-6 lg:mt-6">
          <div className="lg:sticky lg:top-24">
            <CartSummary cart={cart} />
          </div>
        </div>
      </div>
    </div>
  );
}
