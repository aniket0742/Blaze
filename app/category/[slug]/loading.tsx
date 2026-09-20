import { ProductGridSkeleton, Shimmer } from "@/components/skeletons";

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Shimmer className="h-3.5 w-32" />
      <Shimmer className="mt-3 h-8 w-56 sm:h-9" />
      <div className="mt-5">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
