import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "@/components/order-card";
import { listOrders } from "@/lib/orders-server";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your orders", robots: { index: false } };

/**
 * Order history. `listOrders` scopes to the signed-in user in SQL, so this
 * page has no filtering to do and no way to show someone else's order.
 *
 * Redirecting here is safe — unlike /checkout, this page is not the POST
 * target of any server action, so nothing can run after an action and
 * override it. See DECISIONS.md.
 */
export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/signin?returnTo=/orders");

  const orders = await listOrders(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your orders</h1>
        {orders.length > 0 && (
          <p className="text-[13px] text-muted">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </p>
        )}
      </header>

      {orders.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="No orders yet"
            description="Orders you place will appear here, with everything you bought and what you paid."
            actionHref="/search"
            actionLabel="Start shopping"
          />
        </div>
      ) : (
        <>
          <ul className="mt-5 space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.orderNumber} order={order} />
            ))}
          </ul>
          <p className="mt-5 text-center text-[12px] text-muted">
            Demo orders. Nothing was charged and nothing ships.{" "}
            <Link href="/search" className="font-medium text-brand-600 hover:underline">
              Keep shopping
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
