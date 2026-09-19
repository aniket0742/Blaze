import Link from "next/link";

/**
 * The Blaze wordmark. The A→Z underline is our own expression of the
 * "everything, A to Z" principle — not a borrowed logo treatment.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex flex-col leading-none ${className}`}>
      <span className="text-2xl font-semibold tracking-tight">
        Blaze
        <span className="text-brand-500">.</span>
      </span>
      <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        A
        <span
          aria-hidden
          className="h-px w-5 bg-gradient-to-r from-brand-500 to-brand-300 transition-all group-hover:w-8"
        />
        Z
      </span>
    </Link>
  );
}
