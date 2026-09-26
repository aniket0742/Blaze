import type { Metadata } from "next";
import { AlreadySignedIn } from "@/components/already-signed-in";
import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/lib/actions/auth";
import { safeReturnTo } from "@/lib/auth";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const { returnTo } = await searchParams;
  const target = safeReturnTo(returnTo);
  const user = await getUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
      {user?.email ? (
        <AlreadySignedIn email={user.email} />
      ) : (
        <AuthForm mode="signup" action={signUp} returnTo={target} />
      )}
    </div>
  );
}
