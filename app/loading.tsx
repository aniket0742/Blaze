import { ProductGridSkeleton, RailSkeleton, Shimmer } from "@/components/skeletons";

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <Shimmer className="h-80 rounded-2xl lg:col-span-2" />
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-rows-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Shimmer key={i} className="h-[152px] rounded-2xl" />
          ))}
        </div>
      </div>

      <div>
        <Shimmer className="mb-3 h-7 w-64" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="w-[92px] shrink-0 sm:w-[104px]">
              <Shimmer className="aspect-square rounded-xl" />
              <Shimmer className="mt-1.5 h-3 w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-background p-4 shadow-card sm:p-5">
        <Shimmer className="mb-3 h-7 w-40" />
        <RailSkeleton />
      </div>

      <div>
        <Shimmer className="mb-3 h-7 w-40" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
