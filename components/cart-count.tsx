"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type CartCount = {
  /** null until the first read lands, so the badge can stay absent rather
   *  than flash a zero on every page load. */
  count: number | null;
  setCount: (n: number) => void;
};

const Context = createContext<CartCount>({ count: null, setCount: () => {} });

export function useCartCount(): CartCount {
  return useContext(Context);
}

/**
 * Holds the header badge count. Mutations already return the authoritative
 * total, so this only fetches once on load and is set directly after that.
 */
export function CartCountProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && typeof data?.count === "number") setCount(data.count);
      })
      // A failed count is a missing badge, never a broken page.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const set = useCallback((n: number) => setCount(n), []);
  return <Context.Provider value={{ count, setCount: set }}>{children}</Context.Provider>;
}
