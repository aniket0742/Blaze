/**
 * The payment step. There are no card inputs anywhere in Blaze, by design:
 * a form that accepts a card number can receive a real one, and the safest
 * way not to store real payment details is never to collect them. The card
 * below is a picture, not a field. See DECISIONS.md.
 */
export function DemoPayment({ selected, error }: { selected: string; error?: string }) {
  return (
    <fieldset className="rounded-2xl border border-border-subtle bg-background p-4 shadow-card sm:p-5">
      <legend className="px-1 text-sm font-semibold tracking-tight">Payment</legend>

      <p className="mt-1 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
        <strong className="font-semibold">Demo payment.</strong> No money moves and no card
        details are collected or stored. Blaze has no card fields anywhere.
      </p>

      <div className="mt-3 space-y-2">
        <label className="flex cursor-pointer gap-3 rounded-xl border border-border-subtle p-3 transition-colors has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50">
          <input
            type="radio"
            name="payment"
            value="demo_card"
            defaultChecked={selected !== "demo_cod"}
            className="mt-1 accent-brand-600"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Demo card</span>
            <span className="mt-2 block w-full max-w-[280px] rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 p-3.5 text-white">
              <span className="block text-[10px] font-semibold uppercase tracking-widest opacity-80">
                Not a real card
              </span>
              <span className="mt-4 block font-mono text-[15px] tracking-widest">
                •••• •••• •••• 4242
              </span>
              <span className="mt-2 flex justify-between text-[10px] uppercase tracking-wider opacity-80">
                <span>Blaze Demo</span>
                <span>Exp 12/30</span>
              </span>
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-subtle p-3 transition-colors has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50">
          <input
            type="radio"
            name="payment"
            value="demo_cod"
            defaultChecked={selected === "demo_cod"}
            className="mt-0.5 accent-brand-600"
          />
          <span>
            <span className="block text-sm font-medium">Cash on delivery</span>
            <span className="block text-[12px] text-muted">
              Also a demo — no courier is coming and nothing is owed.
            </span>
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-[12px] text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
