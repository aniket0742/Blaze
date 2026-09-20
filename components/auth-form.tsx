"use client";

import Link from "next/link";
import { useActionState } from "react";
import { IDLE, type AuthState } from "@/lib/auth";

type Props = {
  mode: "signin" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  returnTo: string;
};

const COPY = {
  signin: {
    title: "Sign in",
    submit: "Sign in",
    pending: "Signing in…",
    autoComplete: "current-password",
    altText: "New to Blaze?",
    altLabel: "Create an account",
    altHref: "/signup",
  },
  signup: {
    title: "Create your account",
    submit: "Create account",
    pending: "Creating your account…",
    autoComplete: "new-password",
    altText: "Already have an account?",
    altLabel: "Sign in",
    altHref: "/signin",
  },
} as const;

const field =
  "mt-1 h-11 w-full rounded-xl border border-border-subtle bg-background px-3 text-sm outline-none focus:border-brand-400";

export function AuthForm({ mode, action, returnTo }: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const copy = COPY[mode];

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
      <p className="mt-1 text-[13px] text-muted">
        Your cart comes with you — anything you&apos;ve added is kept.
      </p>

      <form action={formAction} className="mt-5 rounded-2xl border border-border-subtle bg-background p-4 shadow-card sm:p-5">
        <input type="hidden" name="returnTo" value={returnTo} />

        <label htmlFor="email" className="block text-[13px] font-medium">
          Email
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
          />
        </label>

        <label htmlFor="password" className="mt-3 block text-[13px] font-medium">
          Password
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 6 : undefined}
            autoComplete={copy.autoComplete}
            className={field}
          />
        </label>
        {mode === "signup" && (
          <p className="mt-1 text-[12px] text-muted">At least 6 characters.</p>
        )}

        {state.error && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-70"
        >
          {pending ? copy.pending : copy.submit}
        </button>
      </form>

      <p className="mt-4 text-center text-[13px] text-muted">
        {copy.altText}{" "}
        <Link href={copy.altHref} className="font-medium text-brand-600 hover:underline">
          {copy.altLabel}
        </Link>
      </p>
    </div>
  );
}
