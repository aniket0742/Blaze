import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
import { CheckoutSummary } from "@/components/checkout-summary";
import { EmptyState } from "@/components/empty-state";
import { loadCart } from "@/lib/cart-store";
import { problemText, type CheckoutProblem } from "@/lib/checkout";
import { quoteCart } from "@/lib/checkout-server";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">{children}</div>;
}

function Problems({ problems }: { problems: CheckoutProblem[] }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-800">
      <p className="font-semibold">Your cart needs attention before you can order.</p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
        {problems.map((problem, i) => (
          <li key={i}>{problemText(problem)}</li>
        ))}
      </ul>
      <Link href="/cart" className="mt-2 inline-block font-medium underline">
        Open your cart to fix this
      </Link>
    </div>
  );
}

/**
 * This page never calls `redirect()`, and that is deliberate. It is the POST
 * target of the place-order action, so Next re-renders it as part of the
 * action's response — and a redirect here would run after the action and
 * override it. Exactly the bug that broke `returnTo` in Milestone 5, which is
 * why every state below is rendered instead. See DECISIONS.md.
 */
export default async function CheckoutPage() {
  const user = await getUser();
  if (!user) {
    return (
      <Shell>
        <h1 className="sr-only">Checkout</h1>
        <EmptyState
          title="Sign in to check out"
          description="Your cart is saved. Sign in and you will come straight back here."
          actionHref="/signin?returnTo=%2Fcheckout"
          actionLabel="Sign in"
        />
      </Shell>
    );
  }

  const quote = await quoteCart(await loadCart());

  // Nothing orderable: either an empty cart, or every line has a problem.
  if (quote.lines.length === 0) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Checkout</h1>
        {quote.problems.length > 0 ? (
          <div className="mt-5 max-w-xl">
            <Problems problems={quote.problems} />
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="Your cart is empty"
              description="There is nothing to check out yet. Browse the marketplace and add something you like."
              actionHref="/search"
              actionLabel="Start shopping"
            />
          </div>
        )}
      </Shell>
    );
  }

  const blocked = quote.problems.length > 0;

  return (
    <Shell>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Checkout</h1>
        <p className="text-[13px] text-muted">
          Ordering as <span className="font-medium text-foreground">{user.email}</span>
        </p>
      </header>

      {blocked && (
        <div className="mt-4">
          <Problems problems={quote.problems} />
        </div>
      )}

      <div className="mt-5 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
        <CheckoutForm quote={quote} blocked={blocked} />

        <div className="mt-5 lg:mt-0">
          <div className="lg:sticky lg:top-36">
            <CheckoutSummary quote={quote} />
          </div>
        </div>
      </div>
    </Shell>
  );
}
