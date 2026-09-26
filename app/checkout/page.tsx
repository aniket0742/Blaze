import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
import { CheckoutSummary } from "@/components/checkout-summary";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/ui";
import { loadCart } from "@/lib/cart-store";
import { problemText, type CheckoutProblem } from "@/lib/checkout";
import { quoteCart } from "@/lib/checkout-server";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">{children}</div>;
}

function Problems({ problems }: { problems: CheckoutProblem[] }) {
  return (
    <div role="alert" className="rounded-md border-l-4 border-red-700 bg-red-50 px-4 py-3 text-[14px] text-red-900">
      <p className="font-semibold">Your bag needs attention before you can order.</p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
        {problems.map((problem, i) => (
          <li key={i}>{problemText(problem)}</li>
        ))}
      </ul>
      <Link href="/cart" className="mt-2 inline-block font-medium underline underline-offset-2">
        Open your bag to fix this
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
          description="Your bag is saved. Sign in and you will come straight back here."
          actionHref="/signin?returnTo=%2Fcheckout"
          actionLabel="Sign in"
        />
      </Shell>
    );
  }

  const quote = await quoteCart(await loadCart());

  // Nothing orderable: either an empty bag, or every line has a problem.
  if (quote.lines.length === 0) {
    return (
      <Shell>
        <PageTitle eyebrow="Checkout" title="Nothing to check out" />
        <div className="mt-8 max-w-2xl">
          {quote.problems.length > 0 ? (
            <Problems problems={quote.problems} />
          ) : (
            <EmptyState
              title="Your bag is empty"
              description="There is nothing to check out yet. Browse the aisles and add something you like."
              actionHref="/#aisles"
              actionLabel="Browse the aisles"
            />
          )}
        </div>
      </Shell>
    );
  }

  const blocked = quote.problems.length > 0;

  return (
    <Shell>
      <div className="border-b border-foreground pb-6">
        <PageTitle eyebrow="Checkout" title="Almost yours.">
          <p>
            Ordering as <span className="font-medium text-foreground">{user.email}</span>. Two steps: your details,
            then a review before anything is placed.
          </p>
        </PageTitle>
      </div>

      {blocked && (
        <div className="mt-6">
          <Problems problems={quote.problems} />
        </div>
      )}

      <div className="mt-8 lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-12">
        <CheckoutForm quote={quote} blocked={blocked} />

        <div className="mt-10 lg:mt-0">
          <div className="lg:sticky lg:top-24">
            <CheckoutSummary quote={quote} />
          </div>
        </div>
      </div>
    </Shell>
  );
}
