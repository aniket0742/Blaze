function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle">
      <Shimmer className="aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <Shimmer className="h-3 w-1/3" />
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-2/3" />
        <Shimmer className="h-5 w-1/2" />
        <Shimmer className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Shimmer key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
  );
}
