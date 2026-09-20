import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Env is read at call time, never at module scope, so a missing key fails one
 * request with a clear message instead of breaking the whole build.
 */
function credentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. See .env.example.",
    );
  }
  return { url, key };
}

export async function createClient() {
  const store = await cookies();
  const { url, key } = credentials();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component render, where cookies are readonly.
          // Middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/** The signed-in user, or null. Never throws on an expired or absent session. */
export async function getUser() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    return error ? null : data.user;
  } catch {
    return null;
  }
}
