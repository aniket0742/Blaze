"use client";

import Link from "next/link";
import { useActionState } from "react";
import { IDLE, type AuthState } from "@/lib/auth";
import { Eyebrow, button, field } from "./ui";

type Props = {
  mode: "signin" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  returnTo: string;
};

const COPY = {
  signin: {
    eyebrow: "Welcome back",
    title: "Sign in",
    submit: "Sign in",
    pending: "Signing in…",
    autoComplete: "current-password",
    altText: "New to Blaze?",
    altLabel: "Create an account",
    altHref: "/signup",
  },
  signup: {
    eyebrow: "New here",
    title: "Create your account",
    submit: "Create account",
    pending: "Creating your account…",
    autoComplete: "new-password",
    altText: "Already have an account?",
    altLabel: "Sign in",
    altHref: "/signin",
  },
} as const;

export function AuthForm({ mode, action, returnTo }: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const copy = COPY[mode];

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-20">
      <div className="hidden lg:block">
        <p className="font-display text-5xl leading-[1.05] tracking-tight">
          Your bag <span className="italic text-brand-600">comes with you.</span>
        </p>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
          Anything you added before signing in is kept and added to your account&apos;s bag, so it follows you
          to any device.
        </p>
      </div>

      <div>
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{copy.title}</h1>
        <p className="mt-2 text-[14px] text-muted lg:hidden">Your bag comes with you — anything you&apos;ve added is kept.</p>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="returnTo" value={returnTo} />

          <label htmlFor="email" className="block text-[13px] font-medium">
            Email
            <input id="email" name="email" type="email" required autoComplete="email" className={`${field} mt-1.5`} />
          </label>

          <label htmlFor="password" className="block text-[13px] font-medium">
            Password
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === "signup" ? 6 : undefined}
              autoComplete={copy.autoComplete}
              aria-describedby={mode === "signup" ? "password-hint" : undefined}
              className={`${field} mt-1.5`}
            />
          </label>
          {mode === "signup" && (
            <p id="password-hint" className="-mt-2 text-[13px] text-muted">
              At least 6 characters.
            </p>
          )}

          {state.error && (
            <p role="alert" className="rounded-md border-l-4 border-red-700 bg-red-50 px-4 py-3 text-[14px] text-red-900">
              {state.error}
            </p>
          )}

          <button type="submit" disabled={pending} className={`${button("primary", "lg")} w-full`}>
            {pending ? copy.pending : copy.submit}
          </button>
        </form>

        <p className="mt-6 border-t border-border-subtle pt-5 text-[14px] text-muted">
          {copy.altText}{" "}
          <Link
            href={copy.altHref}
            className="font-medium text-foreground underline decoration-border-field underline-offset-4 hover:decoration-foreground"
          >
            {copy.altLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
