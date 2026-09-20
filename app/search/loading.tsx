import { ProductGridSkeleton, Shimmer } from "@/components/skeletons";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Shimmer className="h-8 w-64 sm:h-9" />
          <Shimmer className="mt-2 h-3.5 w-28" />
        </div>
        <Shimmer className="h-9 w-40" />
      </div>

      <div className="mt-5 lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        <Shimmer className="mb-4 h-11 rounded-xl lg:mb-0 lg:h-[420px] lg:rounded-2xl" />
        <ProductGridSkeleton count={10} />
      </div>
    </div>
  );
}
