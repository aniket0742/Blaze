import { ProductGridSkeleton, Shimmer, TitleSkeleton } from "@/components/skeletons";

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Shimmer className="h-3 w-32" />
      <div className="mt-6">
        <TitleSkeleton />
      </div>
      <div className="mt-8">
        <ProductGridSkeleton count={10} />
      </div>
    </div>
  );
}
