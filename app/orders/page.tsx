import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "@/components/order-card";
import { PageTitle } from "@/components/ui";
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
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
      <div className="border-b border-foreground pb-6">
        <PageTitle eyebrow="Your account" title="Your orders">
          {orders.length > 0 && (
            <p>
              {orders.length} {orders.length === 1 ? "order" : "orders"}, newest first. Demo orders — nothing was
              charged and nothing ships.
            </p>
          )}
        </PageTitle>
      </div>

      <div className="mt-8">
        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Orders you place will appear here, with everything you bought and what you paid."
            actionHref="/#aisles"
            actionLabel="Browse the aisles"
          />
        ) : (
          <ul className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.orderNumber} order={order} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
