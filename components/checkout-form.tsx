"use client";

import { useActionState } from "react";
import { placeOrder } from "@/lib/actions/checkout";
import {
  CHECKOUT_IDLE,
  INDIAN_STATES,
  PAYMENT_LABELS,
  isPaymentMethod,
  type CheckoutField,
  type CheckoutQuote,
  type CheckoutState,
  type CheckoutValues,
} from "@/lib/checkout";
import { formatPrice } from "@/lib/format";
import { DemoPayment } from "./demo-payment";

const field =
  "mt-1 h-11 w-full rounded-xl border border-border-subtle bg-background px-3 text-sm outline-none focus:border-brand-400 aria-[invalid=true]:border-red-400";
const card = "rounded-2xl border border-border-subtle bg-background p-4 shadow-card sm:p-5";

function Field({
  name,
  label,
  state,
  optional = false,
  ...input
}: {
  name: CheckoutField;
  label: string;
  state: CheckoutState;
  optional?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const error = state.errors[name];
  return (
    <label htmlFor={name} className="block text-[13px] font-medium">
      {label}
      {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      <input
        id={name}
        name={name}
        defaultValue={state.values[name]}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={field}
        {...input}
      />
      {error && (
        <span id={`${name}-error`} className="mt-1 block text-[12px] font-normal text-red-700">
          {error}
        </span>
      )}
    </label>
  );
}

function AddressFields({ state }: { state: CheckoutState }) {
  const stateError = state.errors.state;
  return (
    <fieldset className={card}>
      <legend className="px-1 text-sm font-semibold tracking-tight">Delivery address</legend>

      <div className="mt-1 space-y-3">
        <Field name="fullName" label="Full name" state={state} required autoComplete="name" />
        <Field
          name="phone"
          label="Phone number"
          state={state}
          required
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="10-digit mobile number"
        />
        <Field
          name="addressLine1"
          label="Address"
          state={state}
          required
          autoComplete="address-line1"
          placeholder="Flat, house no., building, street"
        />
        <Field
          name="addressLine2"
          label="Landmark or area"
          state={state}
          optional
          autoComplete="address-line2"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="city" label="City" state={state} required autoComplete="address-level2" />

          <label htmlFor="state" className="block text-[13px] font-medium">
            State
            <select
              id="state"
              name="state"
              required
              defaultValue={state.values.state}
              aria-invalid={stateError ? true : undefined}
              aria-describedby={stateError ? "state-error" : undefined}
              autoComplete="address-level1"
              className={field}
            >
              <option value="">Select a state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {stateError && (
              <span id="state-error" className="mt-1 block text-[12px] font-normal text-red-700">
                {stateError}
              </span>
            )}
          </label>
        </div>

        <div className="sm:max-w-[200px]">
          <Field
            name="postalCode"
            label="PIN code"
            state={state}
            required
            inputMode="numeric"
            maxLength={6}
            autoComplete="postal-code"
            placeholder="560001"
          />
        </div>
      </div>
    </fieldset>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 py-1.5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="text-[13px] font-medium">{children}</dd>
    </div>
  );
}

/** The confirmation step. Every value is carried forward in a hidden input,
 *  so the confirming submit is a complete post and needs no client state. */
function ReviewPanel({ values, quote }: { values: CheckoutValues; quote: CheckoutQuote }) {
  const payment = isPaymentMethod(values.payment) ? PAYMENT_LABELS[values.payment] : "—";

  return (
    <div className={card}>
      <h2 className="text-sm font-semibold tracking-tight">Review your order</h2>

      {(Object.keys(values) as CheckoutField[]).map((key) => (
        <input key={key} type="hidden" name={key} value={values[key]} />
      ))}

      <dl className="mt-2 divide-y divide-border-subtle">
        <Row label="Deliver to">
          <span className="block max-w-xs text-right sm:text-left">
            {values.fullName}
            <span className="block font-normal text-muted">
              {values.addressLine1}
              {values.addressLine2 ? `, ${values.addressLine2}` : ""}, {values.city}, {values.state}{" "}
              {values.postalCode}
            </span>
            <span className="block font-normal text-muted">{values.phone}</span>
          </span>
        </Row>
        <Row label="Payment">{payment}</Row>
        <Row label="Items">
          {quote.totalQty} {quote.totalQty === 1 ? "item" : "items"}
        </Row>
        {quote.arrivesBy && <Row label="Delivery">{quote.arrivesBy.replace(/^Arrives /, "")}</Row>}
      </dl>

      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-border-subtle pt-3">
        <span className="text-sm font-semibold">Total to pay</span>
        <span className="text-lg font-semibold tabular-nums">{formatPrice(quote.totalPaise)}</span>
      </div>
    </div>
  );
}

/**
 * Address, payment and review in one form. The step comes from the server
 * action's returned state rather than from client state, so the whole flow
 * survives JavaScript being off — the same reason the auth form is built
 * this way. `blocked` is set when the cart cannot currently be ordered.
 */
export function CheckoutForm({ quote, blocked }: { quote: CheckoutQuote; blocked: boolean }) {
  const [state, formAction, pending] = useActionState(placeOrder, CHECKOUT_IDLE);
  const reviewing = state.phase === "review";

  return (
    <form action={formAction} className="space-y-4">
      {reviewing ? (
        <ReviewPanel values={state.values} quote={quote} />
      ) : (
        <>
          <AddressFields state={state} />
          <DemoPayment selected={state.values.payment} error={state.errors.payment} />
        </>
      )}

      {state.formError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800"
        >
          {state.formError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row-reverse sm:items-center">
        <button
          type="submit"
          name="intent"
          value={reviewing ? "place" : "review"}
          disabled={pending || blocked}
          className="w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:flex-1"
        >
          {pending
            ? reviewing
              ? "Placing your order…"
              : "Checking your details…"
            : reviewing
              ? `Place order · ${formatPrice(quote.totalPaise)}`
              : "Continue to review"}
        </button>

        {reviewing && (
          <button
            type="submit"
            name="intent"
            value="edit"
            formNoValidate
            disabled={pending}
            className="w-full rounded-full border border-border-subtle px-5 py-3 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-60 sm:w-auto"
          >
            Edit details
          </button>
        )}
      </div>

      <p className="text-center text-[12px] text-muted sm:text-right">
        Placing an order here charges nothing. Blaze is a demo storefront.
      </p>
    </form>
  );
}
