"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { EMPTY_SESSION, applySessionResponse, type SessionSnapshot } from "@/lib/session";

type Session = SessionSnapshot & {
  /** True only until the first read lands, so the header stays quiet rather
   *  than flashing "Sign in" at someone who is already signed in. */
  loading: boolean;
};

type Store = Session & {
  setCartCount: (n: number) => void;
  /** Called by Sign out so the header updates even when signing out does not
   *  change the path. A wrong guess is corrected by the next navigation. */
  clearSession: () => void;
};

const INITIAL: Session = { ...EMPTY_SESSION, loading: true };

const Context = createContext<Store>({
  ...INITIAL,
  setCartCount: () => {},
  clearSession: () => {},
});

export function useSession(): Store {
  return useContext(Context);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(INITIAL);
  const pathname = usePathname();

  // Orders reads against local writes. A cart mutation returns the
  // authoritative count immediately; a slower /api/session response that was
  // already in flight must not overwrite it with a pre-mutation number.
  const tick = useRef(0);
  const lastLocalWrite = useRef(-1);

  useEffect(() => {
    // This provider sits in the root layout, so it is never remounted by a
    // client navigation. Signing in, signing up and signing out all end in a
    // redirect — re-reading per navigation is what keeps the header honest.
    const startedAt = ++tick.current;
    let cancelled = false;

    fetch("/api/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setSession((prev) => ({
          ...applySessionResponse(prev, data, {
            localWriteWon: lastLocalWrite.current > startedAt,
          }),
          loading: false,
        }));
      })
      .catch(() => {
        // A failed read leaves the header as it was, never breaks the page.
        if (!cancelled) setSession((prev) => ({ ...prev, loading: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const setCartCount = useCallback((n: number) => {
    lastLocalWrite.current = ++tick.current;
    setSession((prev) => ({ ...prev, cartCount: n, loading: false }));
  }, []);

  const clearSession = useCallback(() => {
    lastLocalWrite.current = ++tick.current;
    setSession({ ...EMPTY_SESSION, loading: false });
  }, []);

  return (
    <Context.Provider value={{ ...session, setCartCount, clearSession }}>
      {children}
    </Context.Provider>
  );
}
