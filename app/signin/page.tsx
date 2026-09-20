import type { Metadata } from "next";
import { AlreadySignedIn } from "@/components/already-signed-in";
import { AuthForm } from "@/components/auth-form";
import { signIn } from "@/lib/actions/auth";
import { safeReturnTo } from "@/lib/auth";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const { returnTo } = await searchParams;
  const target = safeReturnTo(returnTo);
  const user = await getUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      {user?.email ? (
        <AlreadySignedIn email={user.email} />
      ) : (
        <AuthForm mode="signin" action={signIn} returnTo={target} />
      )}
    </div>
  );
}
