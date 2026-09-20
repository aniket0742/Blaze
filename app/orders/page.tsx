import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your orders", robots: { index: false } };

/** Protected placeholder. Order history itself is a later milestone. */
export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/signin?returnTo=/orders");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your orders</h1>
      <div className="mt-5">
        <EmptyState
          title="No orders yet"
          description="Checkout isn't built yet, so there's nothing to show here. Once you can place an order, it will appear on this page."
          actionHref="/search"
          actionLabel="Start shopping"
        />
      </div>
    </div>
  );
}
