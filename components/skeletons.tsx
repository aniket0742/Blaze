/** Loading placeholders shaped like what they stand in for, so nothing jumps. */
export function Shimmer({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-surface ${className}`} />;
}

/** An eyebrow, a serif headline and a standfirst, under a ruled line. */
export function TitleSkeleton({ ruled = true }: { ruled?: boolean }) {
  return (
    <div className={ruled ? "border-b border-foreground pb-6" : ""}>
      <Shimmer className="h-3 w-24" />
      <Shimmer className="mt-3 h-10 w-2/3 max-w-md sm:h-12" />
      <Shimmer className="mt-3 h-4 w-48" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Shimmer className="aspect-[4/5] rounded-xl" />
          <Shimmer className="mt-3 h-2.5 w-1/3" />
          <Shimmer className="mt-2 h-3.5 w-full" />
          <Shimmer className="mt-1.5 h-3.5 w-2/3" />
          <Shimmer className="mt-3 h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

/** A receipt-shaped block for bag, checkout and order summaries. */
export function ReceiptSkeleton() {
  return (
    <div className="receipt space-y-3 px-5 pt-5">
      <Shimmer className="mx-auto h-2.5 w-28" />
      <Shimmer className="h-3.5 w-full" />
      <Shimmer className="h-3.5 w-full" />
      <Shimmer className="h-5 w-full" />
      <Shimmer className="h-12 w-full" />
    </div>
  );
}
