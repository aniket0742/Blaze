import { FlameMark } from "./icons";

const option =
  "flex cursor-pointer items-start gap-3 rounded-lg border border-border-field bg-background p-4 transition-colors has-[:checked]:border-foreground has-[:checked]:ring-1 has-[:checked]:ring-foreground";

/**
 * The payment step. There are no card inputs anywhere in Blaze, by design:
 * a form that accepts a card number can receive a real one, and the safest
 * way not to store real payment details is never to collect them. The card
 * below is a picture, not a field. See DECISIONS.md.
 */
export function DemoPayment({ selected, error }: { selected: string; error?: string }) {
  return (
    <fieldset className="border-t border-border-subtle pt-6">
      <legend className="float-left flex w-full items-baseline gap-3">
        <span aria-hidden className="font-mono text-[13px] text-brand-600">
          02
        </span>
        <span className="font-display text-2xl tracking-tight">Payment</span>
      </legend>

      <div className="clear-both pt-5">
        <p className="rounded-md border-l-4 border-amber-600 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
          <strong className="font-semibold">Demo payment.</strong> No money moves and no card details are
          collected or stored. Blaze has no card fields anywhere.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={option}>
            <input
              type="radio"
              name="payment"
              value="demo_card"
              defaultChecked={selected !== "demo_cod"}
              className="mt-1 accent-foreground"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">Demo card</span>
              {/* A picture of a card, not a card form. */}
              <span
                aria-hidden
                className="mt-3 block aspect-[1.6] w-full max-w-[240px] rounded-lg bg-foreground p-3.5 text-page"
              >
                <span className="flex items-start justify-between">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-page/70">Not a real card</span>
                  <FlameMark className="h-4 w-4 text-brand-400" />
                </span>
                <span className="mt-5 block font-mono text-[14px] tracking-[0.2em]">•••• •••• •••• 4242</span>
                <span className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-page/70">
                  <span>Blaze demo</span>
                  <span>12/30</span>
                </span>
              </span>
            </span>
          </label>

          <label className={option}>
            <input
              type="radio"
              name="payment"
              value="demo_cod"
              defaultChecked={selected === "demo_cod"}
              className="mt-1 accent-foreground"
            />
            <span>
              <span className="block text-[15px] font-medium">Cash on delivery</span>
              <span className="mt-1 block text-[13px] text-muted">
                Also a demo — no courier is coming and nothing is owed.
              </span>
            </span>
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-[13px] text-red-800">
            {error}
          </p>
        )}
      </div>
    </fieldset>
  );
}
