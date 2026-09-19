import { CategoryGridSkeleton, ProductGridSkeleton } from "@/components/skeletons";

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="py-12 sm:py-20">
        <div className="h-14 w-3/4 animate-pulse rounded-lg bg-surface sm:h-20" />
        <div className="mt-5 h-5 w-1/2 animate-pulse rounded-lg bg-surface" />
      </div>
      <div className="py-10">
        <div className="mb-5 h-7 w-48 animate-pulse rounded-lg bg-surface" />
        <CategoryGridSkeleton count={8} />
      </div>
      <div className="py-10">
        <div className="mb-5 h-7 w-40 animate-pulse rounded-lg bg-surface" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
