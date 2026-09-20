import Link from "next/link";

/**
 * The one saturated element on the page. Kept short — it sits above a deal
 * card rather than stretching to the height of the deals module.
 */
export function AzPromo({ categoryCount }: { categoryCount: number }) {
  return (
    <Link
      href="/#browse"
      className="group flex h-full items-center justify-between gap-3 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-4 text-white shadow-card transition-shadow hover:shadow-lift"
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-100">
          Everything, A to Z
        </p>
        <p className="mt-0.5 text-lg font-semibold leading-tight tracking-tight">
          {categoryCount} categories
        </p>
        <span className="mt-1 inline-block text-[12px] font-medium text-white/85 group-hover:text-white">
          Browse the index →
        </span>
      </div>

      <span aria-hidden className="flex shrink-0 items-center gap-1.5 text-xl font-semibold">
        A
        <span className="h-px w-5 bg-white/60 transition-all duration-300 group-hover:w-9" />
        Z
      </span>
    </Link>
  );
}
