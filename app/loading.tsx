import { ProductGridSkeleton, Shimmer } from "@/components/skeletons";

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:py-20">
        <div>
          <Shimmer className="h-3 w-64" />
          <Shimmer className="mt-5 h-14 w-full max-w-lg sm:h-16" />
          <Shimmer className="mt-3 h-14 w-2/3 sm:h-16" />
          <Shimmer className="mt-6 h-4 w-full max-w-md" />
          <Shimmer className="mt-2 h-4 w-3/4 max-w-sm" />
          <div className="mt-7 flex gap-3">
            <Shimmer className="h-12 w-44" />
            <Shimmer className="h-12 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Shimmer key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="mt-8 border-t border-foreground pt-5">
        <Shimmer className="mb-6 h-9 w-56" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
