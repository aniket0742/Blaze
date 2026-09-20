export function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}

function CardBody() {
  return (
    <div className="space-y-1.5 p-2.5">
      <Shimmer className="h-2.5 w-1/3" />
      <Shimmer className="h-3 w-full" />
      <Shimmer className="h-3 w-2/3" />
      <Shimmer className="h-4 w-1/2" />
      <Shimmer className="h-2.5 w-3/4" />
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle">
      <Shimmer className="aspect-square rounded-none" />
      <CardBody />
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RailSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-[152px] shrink-0 sm:w-[180px]">
          <Shimmer className="aspect-square rounded-xl" />
          <CardBody />
        </div>
      ))}
    </div>
  );
}
