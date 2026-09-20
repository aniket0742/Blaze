import Link from "next/link";

/**
 * The Blaze wordmark. The A→Z rule is our own expression of the
 * "everything, A to Z" principle — not a borrowed logo treatment.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2 ${className}`}>
      <span className="text-xl font-semibold tracking-tight sm:text-[22px]">
        Blaze
        <span className="text-brand-500">.</span>
      </span>
      <span className="hidden items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:flex">
        A
        <span
          aria-hidden
          className="h-px w-3 bg-gradient-to-r from-brand-500 to-brand-300 transition-all duration-300 group-hover:w-6"
        />
        Z
      </span>
    </Link>
  );
}
