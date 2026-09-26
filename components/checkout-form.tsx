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
import { button, field } from "./ui";

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
        className={`${field} mt-1.5`}
        {...input}
      />
      {error && (
        <span id={`${name}-error`} className="mt-1.5 block text-[13px] font-normal text-red-800">
          {error}
        </span>
      )}
    </label>
  );
}

/** A numbered part of the form, set like the home page's sections. */
function Part({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-border-subtle pt-6">
      <legend className="float-left flex w-full items-baseline gap-3">
        <span aria-hidden className="font-mono text-[13px] text-brand-600">
          {n}
        </span>
        <span className="font-display text-2xl tracking-tight">{title}</span>
      </legend>
      <div className="clear-both pt-5">{children}</div>
    </fieldset>
  );
}

function AddressFields({ state }: { state: CheckoutState }) {
  const stateError = state.errors.state;
  return (
    <Part n="01" title="Delivery address">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field name="fullName" label="Full name" state={state} required autoComplete="name" />
        </div>
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
          name="postalCode"
          label="PIN code"
          state={state}
          required
          inputMode="numeric"
          maxLength={6}
          autoComplete="postal-code"
          placeholder="560001"
        />
        <div className="sm:col-span-2">
          <Field
            name="addressLine1"
            label="Address"
            state={state}
            required
            autoComplete="address-line1"
            placeholder="Flat, house no., building, street"
          />
        </div>
        <div className="sm:col-span-2">
          <Field name="addressLine2" label="Landmark or area" state={state} optional autoComplete="address-line2" />
        </div>
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
            className={`${field} mt-1.5`}
          >
            <option value="">Select a state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {stateError && (
            <span id="state-error" className="mt-1.5 block text-[13px] font-normal text-red-800">
              {stateError}
            </span>
          )}
        </label>
      </div>
    </Part>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted sm:pt-0.5">{label}</dt>
      <dd className="text-[15px]">{children}</dd>
    </div>
  );
}

/** The confirmation step. Every value is carried forward in a hidden input,
 *  so the confirming submit is a complete post and needs no client state. */
function ReviewPanel({ values, quote }: { values: CheckoutValues; quote: CheckoutQuote }) {
  const payment = isPaymentMethod(values.payment) ? PAYMENT_LABELS[values.payment] : "—";

  return (
    <Part n="02" title="Review your order">
      {(Object.keys(values) as CheckoutField[]).map((key) => (
        <input key={key} type="hidden" name={key} value={values[key]} />
      ))}

      <dl className="divide-y divide-border-subtle border-y border-border-subtle">
        <Row label="Deliver to">
          <span className="block font-medium">{values.fullName}</span>
          <span className="block text-muted">
            {values.addressLine1}
            {values.addressLine2 ? `, ${values.addressLine2}` : ""}, {values.city}, {values.state} {values.postalCode}
          </span>
          <span className="block text-muted">{values.phone}</span>
        </Row>
        <Row label="Payment">{payment}</Row>
        <Row label="Items">
          {quote.totalQty} {quote.totalQty === 1 ? "item" : "items"}
        </Row>
      </dl>

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <span className="font-display text-xl">Total to pay</span>
        <span className="font-mono text-2xl font-semibold tabular-nums">{formatPrice(quote.totalPaise)}</span>
      </div>
    </Part>
  );
}

/** Which of the two steps you are on. */
function Steps({ reviewing }: { reviewing: boolean }) {
  const steps = ["Your details", "Review and place"];
  return (
    <ol className="mb-8 flex items-center gap-3 text-[13px]" aria-label="Checkout steps">
      {steps.map((label, i) => {
        const current = (i === 1) === reviewing;
        const done = i === 0 && reviewing;
        return (
          <li key={label} className="flex items-center gap-3" aria-current={current ? "step" : undefined}>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-[12px] ${
                current ? "bg-foreground text-page" : done ? "bg-brand-600 text-white" : "border border-border-field text-muted"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={current ? "font-medium" : "text-muted"}>{label}</span>
            {i === 0 && <span aria-hidden className="h-px w-8 bg-border-field sm:w-16" />}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Address, payment and review in one form. The step comes from the server
 * action's returned state rather than from client state, so the whole flow
 * survives JavaScript being off — the same reason the auth form is built
 * this way. `blocked` is set when the bag cannot currently be ordered.
 */
export function CheckoutForm({ quote, blocked }: { quote: CheckoutQuote; blocked: boolean }) {
  const [state, formAction, pending] = useActionState(placeOrder, CHECKOUT_IDLE);
  const reviewing = state.phase === "review";

  return (
    <form action={formAction}>
      <Steps reviewing={reviewing} />

      <div className="space-y-8">
        {reviewing ? (
          <ReviewPanel values={state.values} quote={quote} />
        ) : (
          <>
            <AddressFields state={state} />
            <DemoPayment selected={state.values.payment} error={state.errors.payment} />
          </>
        )}
      </div>

      {state.formError && (
        <p role="alert" className="mt-6 rounded-md border-l-4 border-red-700 bg-red-50 px-4 py-3 text-[14px] text-red-900">
          {state.formError}
        </p>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row-reverse sm:items-center">
        <button
          type="submit"
          name="intent"
          value={reviewing ? "place" : "review"}
          disabled={pending || blocked}
          className={`${button("primary", "lg")} w-full sm:w-auto sm:flex-1`}
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
            className={`${button("secondary", "lg")} w-full sm:w-auto`}
          >
            Edit details
          </button>
        )}
      </div>

      <p className="mt-3 text-center text-[12px] text-muted sm:text-right">
        Placing an order here charges nothing. Blaze is a demo storefront.
      </p>
    </form>
  );
}
