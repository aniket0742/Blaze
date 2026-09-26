import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { FlameMark } from "./icons";
import { button } from "./ui";

/**
 * Shown instead of the form when a signed-in shopper opens /signin or /signup.
 *
 * It carries Sign out because the header's account menu is a client component
 * that only appears once the session read lands — so this is the one place to
 * sign out that works with JavaScript off.
 *
 * This deliberately does NOT redirect. Next re-renders this page as part of
 * the sign-in action's response, and a redirect here would run *after* the
 * action's own redirect and silently override it — which is how `returnTo`
 * ended up always landing on the home page.
 */
export function AlreadySignedIn({ email }: { email: string }) {
  return (
    <div className="mx-auto w-full max-w-md text-center">
      <FlameMark className="mx-auto h-8 w-8 text-brand-500" />
      <h1 className="mt-4 font-display text-4xl tracking-tight">You&apos;re signed in</h1>
      <p className="mt-3 text-[15px] text-muted">
        Signed in as <span className="font-medium text-foreground">{email}</span>.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className={button("primary")}>
          Keep shopping
        </Link>
        <Link href="/cart" className={button("secondary")}>
          Your bag
        </Link>
      </div>

      <form action={signOut} className="mt-6 border-t border-border-subtle pt-5">
        <button type="submit" className={button("quiet")}>
          Sign out
        </button>
      </form>
    </div>
  );
}
